/* eslint-disable no-console */
import WebSocket from 'ws';
import {
  MessageType,
  createMessage,
  parseMessage,
  handleMessage,
  HandleMessageEvent,
  HandleMessageEventType,
  HandleMessageDeleteDataSchema,
} from './message';

interface webSocketGroup {
  ipAddress: string;
  webSockets: {
    [peerUUID: string]: WebSocket
  }
}

export type WebSocketContainer = {
  [ipAddress: string]: webSocketGroup;
};

export function isWebSocketOpen(webSocket: WebSocket) {
  return webSocket.readyState === WebSocket.OPEN;
}

export class WebSocketManager {
  webSocketContainer: WebSocketContainer = {};

  addPeer(ipAddress: string, uuid: string, ws: WebSocket) {
    const { webSocketContainer } = this;

    webSocketContainer[ipAddress] = webSocketContainer[ipAddress] || {};
    webSocketContainer[ipAddress].webSockets = webSocketContainer[ipAddress].webSockets || {};

    webSocketContainer[ipAddress].webSockets[uuid] = ws;

    this.pingPeriodically(ipAddress, uuid, ws);
  }

  pingPeriodically(ipAddress: string, uuid: string, ws: WebSocket) {
    const intervalId = setInterval(() => {
      console.log(`[Ping]: Send ping to #${uuid}`);
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        clearInterval(intervalId);

        this.deletePeer(ipAddress, uuid);
        return;
      }

      const pingMessage = createMessage(MessageType.PING, { message: 'Ping from server!' });
      ws.send(pingMessage);
    }, 1000 * 30);
  }

  addEventListenerToWebSocket(ipAddress: string, peerUUID: string, ws: WebSocket) {
    // Add event listeners
    const { webSocketContainer } = this;

    ws.on('message', (message: WebSocket.Data) => {
      console.log('[Message from client] ', message as string);

      const parsedMessage = parseMessage(message as string);
      const result = handleMessage(parsedMessage, ws, webSocketContainer, ipAddress);

      if (result) {
        this.handleMessageResult(result);
      }


      console.log('parsedMessage is ', parsedMessage);
    });

    ws.on('error', (error: Error) => {
      console.log(`[WS_EVENT]-[${peerUUID}]: error is `, error);
      console.log(`[WS_EVENT]-[${peerUUID}]: error, delete peer ${peerUUID}`);

      this.deletePeer(ipAddress, peerUUID);

      const leaveMessage = createMessage(MessageType.LEAVE, { peers: [peerUUID] });
      this.notifyEvent(ipAddress, peerUUID, leaveMessage);
    });

    ws.on('close', (code: number, reason: string) => {
      console.log(`[WS_EVENT]-[${peerUUID}]: close, code  is `, code, ', reason is ', reason);
      this.deletePeer(ipAddress, peerUUID);

      const leaveMessage = createMessage(MessageType.LEAVE, { peers: [peerUUID] });
      this.notifyEvent(ipAddress, peerUUID, leaveMessage);
    });
  }

  getPeers(ipAddress: string): Array<string> {
    if (!this.webSocketContainer[ipAddress]) {
      return [];
    }

    return Object.keys(this.webSocketContainer[ipAddress].webSockets);
  }

  deletePeer(ipAddress: string, peerUUID: string) {
    if (!this.webSocketContainer[ipAddress]) {
      return;
    }

    if (this.webSocketContainer[ipAddress].webSockets[peerUUID]) {
      delete this.webSocketContainer[ipAddress].webSockets[peerUUID];
    }

    if (this.webSocketContainer[ipAddress].webSockets
      && Object.keys(this.webSocketContainer[ipAddress].webSockets).length === 0) {
      delete this.webSocketContainer[ipAddress];
    }

    console.log('deletePeer, webSocketContainer: ', this.webSocketContainer);
  }

  sendMessageToPeer(ipAddress: string, peerUUID: string, message: string) {
    if (!this.webSocketContainer[ipAddress]) {
      return;
    }

    const ws = this.webSocketContainer[ipAddress].webSockets[peerUUID];
    ws.send(message);
  }

  notifyEvent(ipAddress: string, peerUUID: string, message: string) {
    if (!this.webSocketContainer[ipAddress]) {
      return;
    }

    const { webSockets } = this.webSocketContainer[ipAddress];
    Object.values(webSockets).forEach((otherWebSocket) => {
      otherWebSocket.send(message);
    });
  }

  notifyJoined(ipAddress: string, peerUUID: string) {
    if (!this.webSocketContainer[ipAddress]) {
      return;
    }

    const { webSocketContainer } = this;

    Object.entries(webSocketContainer[ipAddress].webSockets).forEach(([uuid, otherWebSocket]) => {
      const peerJoinMessage = createMessage(MessageType.JOIN, { peers: [peerUUID] });
      console.log(`[${uuid}]: readyState is `, otherWebSocket.readyState);

      if (otherWebSocket.readyState === WebSocket.CLOSED
        || otherWebSocket.readyState === WebSocket.CLOSING) {
        this.deletePeer(ipAddress, uuid);

        return;
      }

      otherWebSocket.send(peerJoinMessage, this.handleCloseErrorCallback(ipAddress, peerUUID));
    });
  }

  handleCloseErrorCallback(ipAddress: string, targetUUID: string) {
    return (err?: Error) => {
      // TODO: Check Who closed. But I think target peer is closed
      if (err && err.message.includes('CLOSED')) {
        this.deletePeer(ipAddress, targetUUID);

        const leaveMessage = createMessage(MessageType.LEAVE, { peers: [targetUUID] });
        this.notifyEvent(ipAddress, targetUUID, leaveMessage);
      }

      console.log(`[${targetUUID}]: target peer closed `, err);
    };
  }

  handleMessageResult(event: HandleMessageEvent) {
    const { eventType, data } = event;

    if (eventType === HandleMessageEventType.DELETE_PEER) {
      const { ipAddress, peerUUID } = data as HandleMessageDeleteDataSchema;

      this.deletePeer(ipAddress, peerUUID);
    }

  }
}


const webSocketManager = new WebSocketManager();
export default webSocketManager;
