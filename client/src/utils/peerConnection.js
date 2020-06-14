import { MESSAGE_TYPE, CLIENT_EVENT_TYPE, PEER_MESSAGE_TYPE } from '../schema';
import { createMessage } from './message';
import { createPeerMessage, parsePeerMessage } from './peerMessage';
import { sendMessageToServer } from './localApi';

function createPeerConnection(uuid) {
  const peerConnection = new RTCPeerConnection({
    iceServers: []
  });

  const dataChannel = peerConnection.createDataChannel('localdropDataChannel');

  dataChannel.onopen = (event) => {
    handleDataChannelStatusChange(event, uuid);
  };

  dataChannel.onclose = (event) => {
    handleDataChannelStatusChange(event, uuid);
  };

  dataChannel.onmessage = (event) => {
    handleDataChannelMessage(event, uuid);
  }

  peerConnection.ondatachannel = (event) => {
    handleOnDataChannel(event, uuid);
  };
  
  peerConnection.addEventListener('onicecandidate', event => {
    console.log(`[peer ${uuid}]: onicecandidate, event is `, event);
  
    if (event.candidate) {
      // Send the candidate to the remote peer
    } else {
      // All ICE candidates have been sent
    }
  });

  peerConnection.addEventListener('onconnectionstatechange', event => {
    console.log(`[peer ${uuid}]: onconnectionstatechange, event is `, event);
    console.log(`[peer ${uuid}]: peerConnection.connectionState is `, peerConnection.connectionState);
  });

  return { peerConnection, dataChannel };
}

function handleDataChannelMessage(event, uuid) {
  console.log(`[peer ${uuid}]: handleDataChannelMessage, event is `, event);
  const { data } = event;

  // TODO: Implement later
  const message = parsePeerMessage(data);
}

function handleDataChannelStatusChange(event, uuid) {
  console.log(`[peer ${uuid}]: handleDataChannelStatusChange, event is `, event);
}

function handleOnDataChannel(event, uuid) {
  console.log(`[peer ${uuid}]: handleOnDataChannel, event is `, event);
}

async function createOffer(peerConnection) {
  const offer = peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  return offer;
}

async function setRemoteOffer(peerConnection, offer) {
  console.log('setOffer called');
  await peerConnection.setRemoteDescription(offer);

  console.log(peerConnection);
}

async function createAnswer(peerConnection) {
  const answer = await peerConnection.createAnswer();
  console.log('createAnswer, answer is ', answer);

  await peerConnection.setLocalDescription(answer);

  return answer;
}

async function setRemoteAnswer(peerConnection, answer) {
  await peerConnection.setRemoteDescription(answer);
}

function initializePeerConnections(peerConnectionManager, peers) {
  const connectionArr = [];

  for (const peerUUID of peers) {
    if (!peerConnectionManager[peerUUID]) {
      // initialize peerConnection
      const { peerConnection, dataChannel } = createPeerConnection(peerUUID);

      connectionArr.push({ uuid: peerUUID, peerConnection, dataChannel });
    }
  }

  return connectionArr;
}


function addClientEventTypeEventListener(peerConnectionManager) {
  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.CONNECT, async (event) => {
    const { uuid } = event;

    if (peerConnectionManager[uuid]) {
      // already exist
      console.log(`[peerConnectionManger]: ${CLIENT_EVENT_TYPE.CONNECT}, peerConnection already exist`);

      return;
    }

    const { peerConnection, dataChannel } = createPeerConnection(uuid);
    peerConnectionManager[uuid] = { peerConnection, dataChannel };

    const offer = await createOffer(peerConnection);
    const message = createMessage(MESSAGE_TYPE.OFFER, { offer, fromUUID: uuid });

    // TODO: handle message
    sendMessageToServer(message);
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.SEND_TEXT, event =>{
    const { uuid, text } = event;
    const data = { message: text };

    if (!peerConnectionManager[uuid]) {
      return;
    }

    
    const { dataChannel } = peerConnectionManager[uuid];
    const message = createPeerMessage(PEER_MESSAGE_TYPE.TEXT, data);

    dataChannel.send(message);
  });

  peerConnectionManager.addEventListener(CLIENT_EVENT_TYPE.SEND_FILES, event =>{
    const { uuid, message } = event;

    // TODO:: Do it later
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
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.PEERS, event => {
    const { peers } = event;
    const connectionArr = initializePeerConnections(peerConnectionManager, peers);

    for (const connection of connectionArr) {
      const { uuid, peerConnection, dataChannel } = connection;

      peerConnectionManager[uuid] = { peerConnection, dataChannel };
    }
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.JOIN, event => {
    const { peers } = event;
    const connectionArr = initializePeerConnections(peerConnectionManager, peers);

    for (const connection of connectionArr) {
      const { uuid, peerConnection, dataChannel } = connection;

      peerConnectionManager[uuid] = { peerConnection, dataChannel };
    }
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.LEAVE, event => {
    const { peers } = event;

    // tear down and delete
    for (const peerUUID of peers) {
      if (!peerConnectionManager[peerUUID]) {
        continue;
      }

      const { peerConnection, dataChannel } = peerConnectionManager[peerUUID];

      peerConnection.close();
      dataChannel.close();

      delete peerConnectionManager[peerUUID];
    }
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.OFFER, async (event) => {
    const { uuid, offer, timeStamp } = event;

    // TODO: Reject of Accept offer depend on timeStamp
    // Maybe.. need to use websocketManager to send message back
    if (!peerConnectionManager[uuid]) {
      return;
    }

    const { peerConnection } = peerConnectionManager[uuid];
    await setRemoteOffer(peerConnection, offer);

    const answer = await createAnswer(peerConnection);
    const message = createMessage(MESSAGE_TYPE.ANSWER, answer);

    // TODO: Implement handling message

  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.ANSWER, async (event) => {
    const { uuid, answer, timeStamp } = event;

    if (!peerConnectionManager[uuid]) {
      return;
    }

    const { peerConnection } = peerConnectionManager[uuid];
    await setRemoteAnswer(peerConnection, answer);
  });

  peerConnectionManager.addEventListener(MESSAGE_TYPE.ERROR, event => {
    // handle error later
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