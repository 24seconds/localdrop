/* eslint-disable no-console */
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as crypto from 'crypto';
import PORT from './config/constants';
import { MessageType, createMessage } from './utils/message';
import { getRemoteIpAddress } from './utils/network';
import webSocketManager from './utils/webSocketManager';


const wss = new WebSocket.Server({
  port: PORT,
});

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  if (!(request.headers.origin?.includes('localhost')
    || request.headers.origin?.includes('localdrop'))
    || request.headers.origint?.includes('24seconds.github.io')) {
    console.log('Can not recognize host');
    console.log('request.headers.origin is ', request.headers.origin);
    ws.close(4001, 'Can not recognize host. Signaling server accepts localhost and localdrop only');
    return;
  }

  const remoteIpAddress: string = getRemoteIpAddress(request);
  console.log('remoteIpAddress is ', remoteIpAddress);

  const peerUUID = crypto.randomBytes(4).toString('hex');
  console.log('[peerUUID]: ', peerUUID);

  // Add
  webSocketManager.addPeer(remoteIpAddress, peerUUID, ws);
  console.log(`[WS_EVENT]-[${peerUUID}]: joined!`);

  webSocketManager.addEventListenerToWebSocket(remoteIpAddress, peerUUID, ws);

  // send back to peer with uuid
  const message = createMessage(MessageType.UUID, { uuid: peerUUID });
  webSocketManager.sendMessageToPeer(remoteIpAddress, peerUUID, message);

  // send joined peers lists
  const peers = webSocketManager.getPeers(remoteIpAddress);
  const peersMessage = createMessage(MessageType.PEERS, { peers });
  webSocketManager.sendMessageToPeer(remoteIpAddress, peerUUID, peersMessage);

  // notify other peers that peer is joined
  webSocketManager.notifyJoined(remoteIpAddress, peerUUID);
});
