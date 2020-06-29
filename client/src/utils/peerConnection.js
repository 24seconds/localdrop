import { MESSAGE_TYPE, CLIENT_EVENT_TYPE, PEER_MESSAGE_TYPE } from '../schema';
import {
  messageTextData,
  messageFileData,
  messageDownloadData,
  messageErrorData,
} from './dataSchema/PeerMessageData';
import { createMessage } from './message';
import {
  createPeerMessage,
  parsePeerMessage,
} from './peerMessage';
import { createMessagePacket } from './messagePacket';
import { generateFingerPrint } from './commonUtil';
import {
  sendMessageToServer,
  addJoinedPeers,
  deleteLeavedPeers,
  updateUUID,
  getMyUUID,
  addMessagePacket,
  transferFileToPeer,
  writePeerChunk,
  writeSystemMessage,
} from './localApi';

function createPeerConnection(uuid) {
  const peerConnection = new RTCPeerConnection();

  // TODO: Handle createDataChannel error later
  const dataChannel = peerConnection.createDataChannel('localdropDataChannel', {
    negotiated: true,
    id: 0,
  });

  dataChannel.binaryType = 'arraybuffer';
  dataChannel.onopen = (event) => {
    handleDataChannelStatusChange(event, uuid);
  };

  dataChannel.onclose = (event) => {
    handleDataChannelStatusChange(event, uuid);
  };

  dataChannel.onmessage = (event) => {
    // console.log('[Message from DataChannel]: ', event);
    handleDataChannelMessage(event, uuid);
  }

  dataChannel.onerror = (event) => {
    const { message, filename, lineno, colno } = event;
    const payload = JSON.stringify({ message, filename, lineno, colno }, undefined, 2);

    const systemMessage = `[peer ${uuid}]: dataChannel error: ` + payload;
    writeSystemMessage(systemMessage);
  }

  peerConnection.onicecandidate = event => {
    console.log(`[peer ${uuid}]: onicecandidate, event is `, event);
  
    if (event.candidate) {
      // Send the candidate to the remote peer
      const message = createMessage(MESSAGE_TYPE.ICE_CANDIDATE, {
        fromUUID: getMyUUID(),
        toUUID: uuid,
        ice: event.candidate,
      });

      sendMessageToServer(message);

    } else {
      // All ICE candidates have been sent
    }
  };

  peerConnection.onconnectionstatechange = event => {
    console.log(`[peer ${uuid}]: onconnectionstatechange, event is `, event);
    console.log(`[peer ${uuid}]: peerConnection.connectionState is `, peerConnection.connectionState);

    switch(peerConnection.connectionState) {
      case 'connecting':
        // do nothing
        break;
      case 'connected':
        // do nothing
        break;
      case 'disconnected':
        break;
      case 'failed':
        writeSystemMessage('onconnectionstatechange, peerConnection failed');
        break;
      case 'closed':
        // TODO: Recreate PeerConnectionManager
        writeSystemMessage('onconnectionstatechange, peerConnection closed');
        break;
      default:
        writeSystemMessage('onconnectionstatechange, peerConnection.connectionState: ' + peerConnection.connectionState);
    }

  };

  return { peerConnection, dataChannel };
}

async function handleDataChannelMessage(event, uuid) {
  if (typeof event.data !== 'string') {
    const arrayBuffer = event.data;

    await writePeerChunk(arrayBuffer);

    return;
  }

  const message = parsePeerMessage(event.data);

  console.log(`[peer ${uuid}]: handleDataChannelMessage, message is `, message);

  const { messageType, data } = message;

  if (messageType === PEER_MESSAGE_TYPE.TEXT) {
    const messagePacket = createMessagePacket({
      source: uuid,
      destination: getMyUUID(),
      data,
      messageType,
    });

    console.log('[handleDataChannelMessage]: messagePacket is ', messagePacket);
    addMessagePacket(messagePacket);

    return;
  }

  if (messageType === PEER_MESSAGE_TYPE.FILE) {
    const messagePacket = createMessagePacket({
      source: uuid,
      destination: getMyUUID(),
      data,
      messageType,
    });

    console.log('[handleDataChannelMessage]: messagePacket is ', messagePacket);
    addMessagePacket(messagePacket);

    return;
  }

  if (messageType === PEER_MESSAGE_TYPE.DOWNLOAD) {
    // TODO: Handle this later
    const { fingerprint } = data;
    // transfer file

    transferFileToPeer(fingerprint, uuid);
    return;
  }

  if (messageType === PEER_MESSAGE_TYPE.ERROR) {
    const { message } = data;

    writeSystemMessage(message);
    return;
  }
}

function handleDataChannelStatusChange(event, uuid) {
  console.log(`[peer ${uuid}]: handleDataChannelStatusChange, event is `, event);
  const { type: eventType } = event;

  // TODO: Delete dataChannel in peerConnectionManager
  if (eventType === 'close') {
    const systemMessage = `[peer #${uuid}]: dataChannel closed `;
    writeSystemMessage(systemMessage);
  }
}

// TODO: Handle error later
async function createOffer(peerConnection) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  return peerConnection.localDescription;
}

async function setRemoteOffer(peerConnection, offer) {
  console.log('setOffer called');
  await peerConnection.setRemoteDescription(offer);

  console.log(peerConnection);
}

// TODO: Handle error later
async function createAnswer(peerConnection) {
  const answer = await peerConnection.createAnswer();
  console.log('createAnswer, answer is ', answer);

  await peerConnection.setLocalDescription(answer);

  return peerConnection.localDescription;
}

async function setRemoteAnswer(peerConnection, answer) {
  await peerConnection.setRemoteDescription(answer);
}

function initializePeerConnections(peerConnectionManager, peers) {
  const connectionArr = [];

  for (const peerUUID of peers) {
    if (!peerConnectionManager.peerConnections[peerUUID]) {
      // initialize peerConnection
      const { peerConnection, dataChannel } = createPeerConnection(peerUUID);

      connectionArr.push({ uuid: peerUUID, peerConnection, dataChannel });
    }
  }

  return connectionArr;
}


function addClientEventTypeEventListener(peerConnectionManager) {
  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.CONNECT, async (event) => {
    const { uuid: toUUID } = event;

    if (peerConnectionManager.peerConnections[toUUID]) {
      // already exist
      console.log(`[peerConnectionManger]: ${CLIENT_EVENT_TYPE.CONNECT}, peerConnection already exist`);
      // return;
    }

    const { peerConnection, dataChannel } = peerConnectionManager.peerConnections[toUUID] || createPeerConnection(toUUID);
    peerConnectionManager.peerConnections[toUUID] = { peerConnection, dataChannel };

    // check if peerConnection is done => if done, do nothing
    if (peerConnection.connectionState === 'connected') {
      console.log(`[peerConnectionManger]: ${CLIENT_EVENT_TYPE.CONNECT}, peerConnection already connected`);
      return;
    }

    try {
      const myUUID = peerConnectionManager.uuid;
      const offer = await createOffer(peerConnection);
      const message = createMessage(MESSAGE_TYPE.OFFER, {
        fromUUID: myUUID, toUUID, offer,
      });

      sendMessageToServer(message);
    } catch(error) {
      writeSystemMessage(JSON.stringify(error, undefined, 2));
    }
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.SEND_TEXT, event =>{
    const { uuid, message } = event;

    if (!peerConnectionManager.peerConnections[uuid]) {
      writeSystemMessage(`can not find peer: #${ uuid }`);
      return;
    }

    const { dataChannel } = peerConnectionManager.peerConnections[uuid];
    const data = new messageTextData({
      message,
      size: message.length,
      fingerprint: generateFingerPrint(),
    });

    const peerMessage = createPeerMessage(PEER_MESSAGE_TYPE.TEXT, data);

    console.log('CLIENT_EVENT_TYPE.SEND_TEXT, message is ', peerMessage);

    console.log('dataChannel is ', dataChannel);
    console.log('dataChannel.readyState is ', dataChannel.readyState);

    if (dataChannel.readyState !== 'open') {
      writeSystemMessage('dataChannel not opened!, try to clikc the peer again!');
      console.log('dataChannel not opened!, click the peer again!');
      return;
    }

    dataChannel.send(peerMessage);

    const messagePacket = createMessagePacket({
      source: getMyUUID(),
      destination: uuid,
      data,
      messageType: PEER_MESSAGE_TYPE.TEXT,
    });

    addMessagePacket(messagePacket);
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.SEND_FILES, event => {
    const { uuid, message, size, fingerprint } = event;

    if (!peerConnectionManager.peerConnections[uuid]) {
      writeSystemMessage(`can not find peer: #${ uuid }`);
      return;
    }

    const { dataChannel } = peerConnectionManager.peerConnections[uuid];
    const data = new messageFileData({ fingerprint, size, message });

    const peerMessage = createPeerMessage(PEER_MESSAGE_TYPE.FILE, data);

    console.log('CLIENT_EVENT_TYPE.SEND_FILES, message is ', peerMessage);

    console.log('dataChannel is ', dataChannel);
    console.log('dataChannel.readyState is ', dataChannel.readyState);

    if (dataChannel.readyState !== 'open') {
      writeSystemMessage('dataChannel not opened!, try to clikc the peer again!');
      console.log('dataChannel not opened!, click the peer again!');
      return;
    }

    dataChannel.send(peerMessage);

    const messagePacket = createMessagePacket({
      source: getMyUUID(),
      destination: uuid,
      data,
      messageType: PEER_MESSAGE_TYPE.FILE,
    });

    addMessagePacket(messagePacket);
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.DOWNLOAD_FILE, event => {
    const { uuid, fingerprint } = event;

    if (!peerConnectionManager.peerConnections[uuid]) {
      writeSystemMessage(`can not find peer: #${ uuid }`);
      return;
    }

    const { dataChannel } = peerConnectionManager.peerConnections[uuid];
    const data = new messageDownloadData({ fingerprint });

    const peerMessage = createPeerMessage(PEER_MESSAGE_TYPE.DOWNLOAD, data);

    console.log('CLIENT_EVENT_TYPE.DOWNLOAD_FILE, message is ', peerMessage);

    console.log('dataChannel is ', dataChannel);
    console.log('dataChannel.readyState is ', dataChannel.readyState);

    if (dataChannel.readyState !== 'open') {
      writeSystemMessage(
        `CLIENT_EVENT ${ CLIENT_EVENT_TYPE.DOWNLOAD_FILE }: dataChannel not opened!`
        + `dataChannel.readyState: ${ dataChannel.readyState }`);
      console.log('dataChannel not opened!');
      return;
    }

    dataChannel.send(peerMessage);
    // TODO: should I notify that peerMessage has been sent well?
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.ERROR, event =>{
    const { uuid, message } = event;

    if (!peerConnectionManager.peerConnections[uuid]) {
      writeSystemMessage(`can not find peer: #${ uuid }`);
      return;
    }

    const { dataChannel } = peerConnectionManager.peerConnections[uuid];
    const data = new messageErrorData({ message });

    const peerMessage = createPeerMessage(PEER_MESSAGE_TYPE.ERROR, data);

    console.log('CLIENT_EVENT_TYPE.ERROR, message is ', peerMessage);

    console.log('dataChannel is ', dataChannel);
    console.log('dataChannel.readyState is ', dataChannel.readyState);

    if (dataChannel.readyState !== 'open') {
      writeSystemMessage(
        `CLIENT_EVENT ${ CLIENT_EVENT_TYPE.ERROR }: dataChannel not opened!`);
      console.log('dataChannel not opened!');
      return;
    }

    dataChannel.send(peerMessage);
  });


  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.RECONNECT, event =>{
    const { uuid } = event;
    // TODO: DO it later
  });
}

function addMessageTypeEventListener(peerConnectionManager) {
  peerConnectionManager.addEventListener(MESSAGE_TYPE.UUID, event => {
    const { uuid } = event;

    peerConnectionManager.uuid = uuid;
    updateUUID(uuid);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.PEERS, event => {
    const { peers } = event;
    const filteredPeers = peers.filter(peerUUID => peerUUID !== peerConnectionManager.uuid);

    const connectionArr = initializePeerConnections(peerConnectionManager, filteredPeers);

    for (const connection of connectionArr) {
      const { uuid, peerConnection, dataChannel } = connection;

      peerConnectionManager.peerConnections[uuid] = { peerConnection, dataChannel };
    }

    // TODO: Inform this event to store
    addJoinedPeers(filteredPeers);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.JOIN, event => {
    const { peers } = event;
    const filteredPeers = peers.filter(peerUUID => peerUUID !== peerConnectionManager.uuid);

    const connectionArr = initializePeerConnections(peerConnectionManager, filteredPeers);

    for (const connection of connectionArr) {
      const { uuid, peerConnection, dataChannel } = connection;

      peerConnectionManager.peerConnections[uuid] = { peerConnection, dataChannel };
    }

    // TODO: Inform this event to store
    addJoinedPeers(filteredPeers);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.LEAVE, event => {
    const { peers } = event;
    const filteredPeers = peers.filter(peerUUID => peerUUID !== peerConnectionManager.uuid);

    // tear down and delete
    for (const peerUUID of filteredPeers) {
      if (!peerConnectionManager.peerConnections[peerUUID]) {
        continue;
      }

      const { peerConnection, dataChannel } = peerConnectionManager.peerConnections[peerUUID];

      console.log('[LEAVE]: peerConnectionManager.peerConnections[peerUUID] is ', peerConnectionManager.peerConnections[peerUUID]);

      peerConnection.close();
      dataChannel.close();

      delete peerConnectionManager.peerConnections[peerUUID];
    }

    deleteLeavedPeers(filteredPeers);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.OFFER, async (event) => {
    const { fromUUID, toUUID, offer, timeStamp } = event;

    console.log('peerConnectionManager.peerConnections[fromUUID] is', peerConnectionManager.peerConnections[fromUUID]);

    // TODO: Reject of Accept offer depend on timeStamp
    // Maybe.. need to use websocketManager to send message back
    if (!peerConnectionManager.peerConnections[fromUUID]) {
      console.log('offer, peerConnectionManager.peerConnections[fromUUID] not exist', peerConnectionManager);
      return;
    }

    const { peerConnection } = peerConnectionManager.peerConnections[fromUUID];

    try {
      await setRemoteOffer(peerConnection, offer);

      const answer = await createAnswer(peerConnection);
      const message = createMessage(MESSAGE_TYPE.ANSWER, {
        fromUUID: toUUID,
        toUUID: fromUUID,
        answer,
      });

      sendMessageToServer(message);
    } catch(err) {
      writeSystemMessage(JSON.stringify(err, undefined, 2));
    }
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.ANSWER, async (event) => {
    const { fromUUID, toUUID, answer, timeStamp } = event;

    if (!peerConnectionManager.peerConnections[fromUUID]) {
      console.log('answer, peerConnectionManager.peerConnections[fromUUID] not exist');
      return;
    }

    console.log('answer is ', answer);

    const { peerConnection } = peerConnectionManager.peerConnections[fromUUID];
    await setRemoteAnswer(peerConnection, answer);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.ERROR, event => {
    // handle error later

    const { message } = event;
    writeSystemMessage(message);

  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.ICE_CANDIDATE, async (event) => {
    const { fromUUID, toUUID, ice } = event;

    console.log('ICE_CANDIDATE, event is ', event);

    if (!peerConnectionManager.peerConnections[fromUUID]) {
      console.log('ICE CANDIDATE, peerConnection not exist');
      return;
    }

    const { peerConnection, dataChannel } = peerConnectionManager.peerConnections[fromUUID];
    await peerConnection.addIceCandidate(ice);
  });
}

function createPeerConnectionManager() {
  const peerConnectionManager = {
    uuid: null,
    peerConnections: { },
    events: { },
  };

  peerConnectionManager.addEventListener = (eventType, callback) => {
    // extract event type and do something here
  
    peerConnectionManager.events[eventType] = peerConnectionManager.events[eventType] || []
    peerConnectionManager.events[eventType].push(callback);
  }
  
  peerConnectionManager.dispatchEvent = (event) => {
    const eventType = event.type;
    const eventCallbacks = peerConnectionManager.events[eventType];
  
    if (!eventCallbacks) {
      console.log(`peerConnectionManager does not handle event: ${ eventType }`);
      return;
    }
  
    for (const callback of eventCallbacks) {
      callback(event);
    }
  }

  addMessageTypeEventListener(peerConnectionManager);
  addClientEventTypeEventListener(peerConnectionManager);

  return peerConnectionManager;
}

const peerConnectionManager = createPeerConnectionManager();
export {
  peerConnectionManager,
  createPeerConnectionManager,
};
