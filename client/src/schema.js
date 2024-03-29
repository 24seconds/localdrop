import {
    EventSendTextData,
    EventSendFilesData,
    EventConnectData,
    EventSendMessageData,
    EventErrorData,
} from "./utils/dataSchema/LocalDropEventData";

export const MESSAGE_TYPE = {
    UUID: "UUID",
    PEERS: "PEERS",
    JOIN: "JOIN",
    LEAVE: "LEAVE",
    OFFER: "OFFER",
    ANSWER: "ANSWER",
    PING: "PING",
    PONG: "PONG",
    ERROR: "ERROR",
    ICE_CANDIDATE: "ICE_CANDIDATE",
};

const messageSchema = {
    messageSchema: {
        messageType: "String",
        data: "Json String. Type is one of dataSchema",
    },
};

const dataSchema = {
    errorDataSchema: {
        message: "string",
    },
    offerDataSchema: {
        fromUUID: "string",
        toUUID: "string",
        timeStamp: "time string, ISO format",
        offer: {
            type: "string",
            sdp: "string",
        },
    },
    answerDataSchema: {
        fromUUID: "string",
        toUUID: "string",
        timeStamp: "time string, ISO format",
        answer: {
            // TODO: CHECK answer schema!!!
            type: "string",
            sdp: "string",
        },
    },
    pingpongDataSchema: {
        message: "string",
    },
    uuidDataSchema: {
        uuid: "string",
    },
    peersDataSchema: {
        peers: "array of string",
    },
    joinDataSchema: {
        peers: "array of string",
    },
    leaveDataSchema: {
        peers: "array of string",
    },
    iceCandidateDataSchema: {
        fromUUID: "string",
        toUUID: "string",
        ice: "string",
    },
    peerTextDataSchema: {
        message: "string",
    },
    peerFileDataSchema: {
        message: "string",
        fingerprint: "string",
        size: "long",
    },
};

export const CLIENT_EVENT_TYPE = {
    CONNECT: "CONNECT",
    SEND_TEXT: "SEND_TEXT",
    SEND_FILES: "SEND_FILES",
    DOWNLOAD_FILE: "DOWNLOAD_FILE",
    RECONNECT: "RECONNECT",
    // TODO Change name to SEND_MESSAGE_TO_SIGNAL
    SEND_MESSAGE: "SEND_MESSAGE",
    CLOSE: "CLOSE",
    ERROR: "ERROR",
};

const clientEventDataSchema = {
    sendTextDatSchema: EventSendTextData,
    sendFileDataSchema: EventSendFilesData,
    connectDataSchema: EventConnectData,
    sendMessageDataSchema: EventSendMessageData,
    errorDataSchema: EventErrorData,
};

export const PEER_MESSAGE_TYPE = {
    TEXT: "TEXT",
    FILE: "FILE",
    ERROR: "ERROR",
    DOWNLOAD: "DOWNLOAD",
};

const peerMessageSchema = {
    messageSchema: {
        messageType: "String",
        data: "Json String. Type is one of peerMessageDataSchema",
    },
};

const peerMessageDataSchema = {
    textDataSchema: { message: "string" },
    fileDataSchema: {
        message: "string",
        fingerprint: "string",
    },
    downloadDataSchema: { fingerprint: "string" },
    erroDataSchema: { message: "string" },
};

const messagePacketSchema = {
    source: "uuid string",
    destination: "uuid string",
    type: "PEER_MESSAGE_TYPE string",
    data: "peerDataSchema",
    time: "date",
    progress: "int",
};

const meesagePacketDownloadHeaderSchema = {
    fingerprint: "35 bytes",
};

const peerConnectionMangerSchema = {
    uuid: "string",
    peerConnections: {
        ["otherPeerUUid"]: {
            peerConnection: "RTCPeerConnection",
            dataChannel: "RTCDataChannel",
        },
    },
};

const systemMessageSchema = {
    message: "string",
    fingerprint: "string",
    createdAt: "time string",
};
