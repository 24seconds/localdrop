import WebSocket from 'ws';
import { WebSocketContainer, isWebSocketOpen } from './webSocketManager';

enum MessageType {
  UUID = 'UUID',
  PEERS = 'PEERS',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  OFFER = 'OFFER',
  ANSWER = 'ANSWER',
  PING = 'PING',
  PONG = 'PONG',
  ERROR = 'ERROR',
  ICE_CANDIDATE = 'ICE_CANDIDATE',
}

export enum HandleMessageEventType {
  DELETE_PEER = 'DELETE_PEER',
}

export interface HandleMessageDeleteDataSchema {
  ipAddress: string;
  peerUUID: string;
}

export type HandleMessageEventDataSchema = HandleMessageDeleteDataSchema;

export type HandleMessageEvent = {
  eventType: HandleMessageEventType;
  data: HandleMessageEventDataSchema;
};

export interface Message {
  messageType: MessageType;
  data: MessageDataSchema;
}

interface SimpleDataSchema {
  message: string;
}

interface OfferDataSchema {
  fromUUID: string;
  toUUID: string;
  timeStamp?: string | null;
  offer: {
    type: string;
    sdp: string;
  }
}

interface AnswerDataSchema {
  fromUUID: string;
  toUUID: string;
  timeStamp?: string | null;
  answer: {
    type: string;
    sdp: string;
  }
}

interface UUIDDataSchema {
  uuid: string;
}

interface IceCandidateDataSchema {
  fromUUID: string;
  toUUID: string;
  ice: string;
}

interface PeersJoinLeaveDataSchema {
  peers: Array<string>;
}

type MessageDataSchema =
  SimpleDataSchema
  | OfferDataSchema
  | AnswerDataSchema
  | UUIDDataSchema
  | PeersJoinLeaveDataSchema
  | IceCandidateDataSchema;


function createMessage(messageType: MessageType, data: MessageDataSchema): string {
  const message = {
    messageType,
    data,
  };

  return JSON.stringify(message);
}

function parseMessage(rawMessage: string): Message {
  try {
    const message: Message = JSON.parse(rawMessage);

    if (!Object.values(MessageType).includes(message.messageType)) {
      throw new Error(`MessageType not supported! type: ${message.messageType}`);
    }

    return message;
  } catch (err) {
    return {
      messageType: MessageType.ERROR,
      data: {
        message: err.message,
      },
    };
  }
}

function handleMessage(
  parsedMessage: Message, ws: WebSocket, webSocketContainer: WebSocketContainer, ipAddress: string,
): HandleMessageEvent | null {
  const { messageType, data } = parsedMessage;

  if (messageType === MessageType.PING) {
    const message = createMessage(MessageType.PONG, { message: 'pong from server!' });
    ws.send(message);

    return null;
  }

  if (messageType === MessageType.PONG) {
    console.log('[Pong from client] ', (data as SimpleDataSchema).message);

    return null;
  }

  if (messageType === MessageType.OFFER) {
    const { fromUUID, toUUID, offer } = data as OfferDataSchema;
    const timeStamp = (new Date()).toISOString();

    const otherSocket = webSocketContainer[ipAddress]
      && webSocketContainer[ipAddress].webSockets[toUUID];

    if (otherSocket && isWebSocketOpen(otherSocket)) {
      const offerMessage = createMessage(MessageType.OFFER, {
        fromUUID, toUUID, timeStamp, offer,
      });

      otherSocket.send(offerMessage);
    } else {
      const message = '[Message from Signal server]: Peer does not exist!';
      const errorMessage = createMessage(MessageType.ERROR, { message });

      ws.send(errorMessage);

      return {
        eventType: HandleMessageEventType.DELETE_PEER,
        data: { ipAddress, peerUUID: toUUID },
      };
    }
  }

  if (messageType === MessageType.ANSWER) {
    const { fromUUID, toUUID, answer } = data as AnswerDataSchema;

    const timeStamp = (new Date()).toISOString();
    const otherSocket = webSocketContainer[ipAddress]
      && webSocketContainer[ipAddress].webSockets[toUUID];

    if (otherSocket && isWebSocketOpen(otherSocket)) {
      const answerMessage = createMessage(MessageType.ANSWER, {
        fromUUID, toUUID, timeStamp, answer,
      });

      otherSocket.send(answerMessage);
    } else {
      const message = '[Message from Signal server]: Peer does not exist!';
      const errorMessage = createMessage(MessageType.ERROR, { message });

      ws.send(errorMessage);

      return {
        eventType: HandleMessageEventType.DELETE_PEER,
        data: { ipAddress, peerUUID: toUUID },
      };
    }
  }

  if (messageType === MessageType.PEERS) {
    const peers = Object.keys(webSocketContainer[ipAddress].webSockets);
    const peersMessage = createMessage(MessageType.PEERS, { peers });

    ws.send(peersMessage);
  }

  if (messageType === MessageType.ICE_CANDIDATE) {
    const { toUUID } = data as IceCandidateDataSchema;

    const otherWebSocket = webSocketContainer[ipAddress]
      && webSocketContainer[ipAddress].webSockets[toUUID];

    if (otherWebSocket) {
      const iceMessage = createMessage(MessageType.ICE_CANDIDATE, data);

      otherWebSocket.send(iceMessage);
    } else {
      return {
        eventType: HandleMessageEventType.DELETE_PEER,
        data: { ipAddress, peerUUID: toUUID },
      };
    }
  }

  return null;
}

export {
  MessageType,
  createMessage,
  parseMessage,
  handleMessage,
};
