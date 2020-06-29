import {
  parsePeerChunk,
  getMessagePacket, 
  sendErrorToPeer,
  getMyUUID,
  writeSystemMessage,
} from './localApi';
import { HEADER_SIZE_IN_BYTES } from '../constants/constant';
import { concatHeaderAndChunk } from './peerMessage';
import StreamSaver from 'streamsaver';
StreamSaver.mitm = `${ process.env.REACT_APP_MITM_URL }/mitm.html?version=2.0.0`;

const MAXIMUM_ACC_SIZE = 625;
const chunkStore = { };
const transferStore = { };

const defaultStructure = {
  accArr: [],
  downloadWriter: null,
  offset: 0,
  size: 0,
};

async function writeChunk(chunkArr, downloadWriter) {
  const arrayBuffers = [...chunkArr];

  const arrayBuffer = await (new Blob(arrayBuffers)).arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  downloadWriter.write(buffer);
}

async function accumulateChunk(chunkWithHeader) {
  const {
    fingerprint, chunk
  } = parsePeerChunk(chunkWithHeader);

  chunkStore[fingerprint] = chunkStore[fingerprint] || {
    accArr: [],
    downloadWriter: null,
    offset: 0,
    size: 0,
    available: true,
  };

  if (!chunkStore[fingerprint].downloadWriter) {
    const messagePacket = getMessagePacket(fingerprint);

    const filename = (messagePacket && messagePacket.data.message) || 'localdrop_download_file';
    const fileSize = (messagePacket && messagePacket.data.size) || 0;
    const options = { pathname: fingerprint, size: fileSize };

    chunkStore[fingerprint].size = fileSize;
    const fileStream = StreamSaver.createWriteStream(filename, options);

    const writer = fileStream.getWriter();

    window.addEventListener('unload', (_) => {
      writer.abort();
    });

    chunkStore[fingerprint].downloadWriter = writer;
    const chunkArr = chunkStore[fingerprint].accArr;

    chunkStore[fingerprint].offset += chunk.byteLength;
    chunkArr.push(chunk);
  } else {
    const chunkArr = chunkStore[fingerprint].accArr;
    const downloadWriter = chunkStore[fingerprint].downloadWriter;

    chunkStore[fingerprint].offset += chunk.byteLength;
    chunkArr.push(chunk);

    if (chunkArr.length >= MAXIMUM_ACC_SIZE && chunkStore[fingerprint].available) {
      chunkStore[fingerprint].available = false;

      if (chunkArr.length !== MAXIMUM_ACC_SIZE) {
        throw new Error(`length are different, ${MAXIMUM_ACC_SIZE}/${chunkArr.length}`);
      }

      const arrayBuffers = [...chunkArr];
      chunkStore[fingerprint].accArr.splice(0, MAXIMUM_ACC_SIZE);

      await writeChunk(arrayBuffers, downloadWriter);
      chunkStore[fingerprint].available = true;
    }
  }

  // no need to lock, only occurred once
  if (chunkStore[fingerprint].offset >= chunkStore[fingerprint].size) {
    const chunkArr = chunkStore[fingerprint].accArr;
    const downloadWriter = chunkStore[fingerprint].downloadWriter;

    await writeChunk([...chunkArr], downloadWriter);
    chunkStore[fingerprint].accArr = [];

    downloadWriter.close();

    delete chunkStore[fingerprint];
  }
}

function readFile(file, offset, chunkSize, reader, fingerprint, uuid) {
  if (offset > file.size) {
    if (transferStore[fingerprint]) {
      transferStore[fingerprint] = false;
    }

    console.log('offset is ', offset);
    console.log('file.size is ', file.size);

    const message = `Transfer file to #${ uuid } done.\nFile: ${ file.name }`
    writeSystemMessage(message);

    return;
  }

  const chunk = file.slice(offset, offset + chunkSize);
  reader.readAsArrayBuffer(chunk);
}

function isDownloadInProgress(fingerprint) {
  return transferStore[fingerprint] || false;
}

function transferFile(fingerprint, file, dataChannel, uuid) {
  transferStore[fingerprint] = true;

  const reader = new FileReader();
  const chunkSize = 16000 - HEADER_SIZE_IN_BYTES;
  let offset = 0;

  console.log('chunkSize is ', chunkSize);
  console.log('file.size is ', file.size)

  readFile(file, offset, chunkSize, reader, fingerprint, uuid);

  reader.addEventListener('load', async (event) => {
    console.log('event.target.result is ', event.target.result);
    console.log('typeof event.target.result is ', typeof event.target.result);

    const chunk = event.target.result;
    console.log('chunk is ', chunk);

    const chunkWithHeader = await concatHeaderAndChunk(fingerprint, chunk);
    console.log('chunkWithHeader is ', chunkWithHeader);
    console.log('chunkWithHeader.byteLength is ', chunkWithHeader.byteLength);

    // return;
    dataChannel.send(chunkWithHeader);

    offset += chunkSize;

    // read next chunk
    readFile(file, offset, chunkSize, reader, fingerprint, uuid);
  });
}


export {
  accumulateChunk,
  transferFile,
  isDownloadInProgress,
}