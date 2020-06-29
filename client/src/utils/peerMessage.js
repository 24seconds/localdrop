import { PEER_MESSAGE_TYPE } from '../schema';
import {
  FINGERPRINT_SIZE,
  HEADER_SIZE_IN_BYTES,
} from '../constants/constant';

function createPeerMessage(messageType, data) {
  const message = {
    messageType,
    data,
  };

  return JSON.stringify(message);
}

function parsePeerMessage(rawMessage) {
  console.log('rawPeerMessage is ', rawMessage);
  const parsedMessage = ((rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);

      if (!(message['messageType'] in PEER_MESSAGE_TYPE)) {
        throw new Error(`This peerMessageType is not supported! type: ${message['messageType']}`)
      }

      return message;
    } catch(err) {
      return {
        messageType: PEER_MESSAGE_TYPE.ERROR,
        data: {
          "message": err.message
        }
      }
    }
  })(rawMessage);

  return parsedMessage;
}

async function concatHeaderAndChunk(fingerprint, chunk) {
  const headerFingerprint = new TextEncoder("utf-8").encode(fingerprint);

  console.log('sender: fingerprint is ', fingerprint);
  console.log('headerFingerprint is ', headerFingerprint);

  const chunkWithHeader = await (new Blob([headerFingerprint.buffer, chunk])).arrayBuffer();

  return chunkWithHeader;
}

function parseChunkAndHeader(chunkWithHeader) {
  const uInt8Array = new Uint8Array(chunkWithHeader);
  const fingerprint = new TextDecoder().decode(uInt8Array.slice(0, FINGERPRINT_SIZE));

  const chunk =
    uInt8Array.slice(HEADER_SIZE_IN_BYTES, uInt8Array.byteLength).buffer;

  return {
    fingerprint,
    chunk
  };
}


export {
  createPeerMessage,
  parsePeerMessage,
  concatHeaderAndChunk,
  parseChunkAndHeader
}