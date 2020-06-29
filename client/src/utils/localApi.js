import { peerConnectionManager } from './peerConnection';
import LocalDropEvent from './LocalDropEvent';
import {
  EventSendTextData,
  EventSendFilesData,
  EventDownloadFileData,
  EventConnectData,
  EventSendMessageData,
  EventErrorData
} from './dataSchema/LocalDropEventData';
import { CLIENT_EVENT_TYPE, PEER_MESSAGE_TYPE } from '../schema';
import websocketManager from './websocket';
import store from '../redux/store';
import {
  addPeer,
  deletePeer,
  addMessage,
  updateMyUUID,
  addSystemMessage,
} from '../redux/action';
import { parseChunkAndHeader } from './peerMessage';
import { getCurrentTime, generateFingerPrint } from './commonUtil';
import { accumulateChunk, transferFile, isDownloadInProgress } from './downloadManager';

function sendTextToPeer(uuid, text) {
  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.SEND_TEXT,
    new EventSendTextData({ uuid, message: text }));

  peerConnectionManager.dispatchEvent(event);
}

function sendFileToPeer(uuid, fingerprintedFile) {
  const { file, fingerprint } = fingerprintedFile

  console.log('sendFileToPeer, file is', file);

  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.SEND_FILES,
    new EventSendFilesData({
      uuid,
      message: file.name,
      size: file.size,
      fingerprint,
    }));

  peerConnectionManager.dispatchEvent(event);
}

function sendErrorToPeer(uuid, message) {
  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.ERROR,
    new EventErrorData({ uuid, message }));

  peerConnectionManager.dispatchEvent(event);
}

function sendFilesToPeer(uuid, fingerprintedFiles) {
  fingerprintedFiles.forEach((fingerprintedFile) => {
    sendFileToPeer(uuid, fingerprintedFile);
  });
}

function requestDownloadFile(uuid, data) {
  const { fingerprint } = data;

  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.DOWNLOAD_FILE,
    new EventDownloadFileData({
      uuid, fingerprint
    }));

  peerConnectionManager.dispatchEvent(event);
}

function connectToPeer(uuid) {
  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.CONNECT,
    new EventConnectData({ uuid }));

  peerConnectionManager.dispatchEvent(event);
}

function sendMessageToServer(message) {
  const event = new LocalDropEvent(
    CLIENT_EVENT_TYPE.SEND_MESSAGE,
    new EventSendMessageData({ message }));

  websocketManager.dispatchEvent(event);
}

function closeWebSocket() {
  const event = new LocalDropEvent(CLIENT_EVENT_TYPE.CLOSE);

  websocketManager.dispatchEvent(event);
}

function addJoinedPeers(peers) {
  store.dispatch(addPeer(peers));
}

function deleteLeavedPeers(peers) {
  store.dispatch(deletePeer(peers));
}

function addMessagePacket(message) {
  store.dispatch(addMessage(message));
}

function updateUUID(uuid) {
  store.dispatch(updateMyUUID(uuid));
}

function getPeerUUID() {
  return store.getState().peerUUID;
}

function getMyUUID() {
  return store.getState().myUUID;
}

function getFileToTransfer(fingerprint) {
  const filesToTransfer = store.getState().filesToTransfer;

  return filesToTransfer[fingerprint];
}

function transferFileToPeer(fingerprint, uuid) {
  const file = getFileToTransfer(fingerprint);

  if (!file) {
    const message = `[From #${ getMyUUID() }]: ${ fingerprint } file link has expired`;
    sendErrorToPeer(uuid, message);
    return;
  }

  if (!peerConnectionManager.peerConnections[uuid]) {
    // There is nothing to do in this case..
    const systemMessage =
      `#${ uuid } requested download but uuid not found : ` + JSON.stringify({ fingerprint, file }, undefined, 2);
    writeSystemMessage(systemMessage);
    return;
  }

  const { dataChannel } = peerConnectionManager.peerConnections[uuid];

  if (isDownloadInProgress(fingerprint)) {
    const { name, size, type } = file;
    const payload = {
      fingerprint,
      file: { name, size, type },
    }
    const message = `[From #${ getMyUUID() }]: download is in progress ` + JSON.stringify(payload, undefined, 2);
    sendErrorToPeer(uuid, message);
    return;
  } else {
    transferFile(fingerprint, file, dataChannel, uuid);
  }
}

function getMessagePacket(fingerprint) {
  // TODO: Make O(1)

  const messagePacket = store.getState().messagePackets.find((messagePacket) => {
    const { data } = messagePacket;

    return data.fingerprint === fingerprint;
  });

  return messagePacket;
}

function parsePeerChunk(chunkWithHeader) {
  return parseChunkAndHeader(chunkWithHeader);
}

async function writePeerChunk(chunkWithHeader) {
  await accumulateChunk(chunkWithHeader);
}

function writeSystemMessage(message) {
  const systemMessage = {
    message,
    fingerprint: generateFingerPrint(),
    createdAt: getCurrentTime(),
  };

  store.dispatch(addSystemMessage(systemMessage));
}

export {
  sendTextToPeer,
  sendFilesToPeer,
  sendErrorToPeer,
  requestDownloadFile,
  sendMessageToServer,
  connectToPeer,
  closeWebSocket,
  addJoinedPeers,
  deleteLeavedPeers,
  addMessagePacket,
  updateUUID,
  getPeerUUID,
  getMyUUID,
  getFileToTransfer,
  transferFileToPeer,
  getMessagePacket,
  parsePeerChunk,
  writePeerChunk,
  writeSystemMessage,
};
