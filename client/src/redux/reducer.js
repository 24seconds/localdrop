import { combineReducers } from 'redux';
import {
  ADD_PEER,
  DELETE_PEER,
  ADD_MESSAGE,
  UPDATE_MY_UUID,
  UPDATE_PEER_UUID,
  ADD_FILES,
  UPDATE_PROGRESS,
  UPDATE_IS_SYSTEM_MESSAGE_SELECTED,
  ADD_SYSTEM_MESSAGE,
} from './actionType';
import { generateFingerPrint, getCurrentTime } from '../utils/commonUtil';
import { LOCALDROP_APP_VERSION } from '../constants/constant';

const initialState = { peers: [], message: [] }

function localDropState(state = initialState, action) {
  console.log('localDropReducer is called ', state);
  console.log('action is ', action);

  if (action.type === ADD_PEER) {
    // naive implementation
    const newState = { ...state };
    const peers = action.payload;

    console.log('ADD_PEER!!!');
    newState.peers = [...newState.peers, ...peers ];
    console.log('ADD_PEER!!!, ', newState);

    return newState;
  } else if (action.type === DELETE_PEER) {
    // naive implementation
    const newState = { ...state };
    const peerSet = new Set(action.payload);

    console.log('peerSet is ', peerSet);

    const newPeers = newState.peers.filter(peer => !peerSet.has(peer));
    console.log('newPeers is ', newPeers);
    newState.peers = newPeers;

    return newState;
  }

  return state;
}

function messagePackets(state = [], action) {
  if (action.type === ADD_MESSAGE) {
    const message = action.payload;
    const newState = [ ...state, message ];

    return newState;
  }

  return state;
}

function messageProgresses(state = {}, action) {
  if (action.type === UPDATE_PROGRESS) {
    const newState = { ...state };
    const { fingerprint, progress } = action.payload;

    if (newState[fingerprint]) {
      newState[fingerprint] = progress;
    }

    return newState;
  }

  return state;
}

function myUUID(state = null, action) {
  if (action.type === UPDATE_MY_UUID) {
    const newState = action.payload;

    return newState;
  }

  return state;
}

function peerUUID(state = null, action) {
  if (action.type === UPDATE_PEER_UUID) {
    const newState = action.payload;

    return newState;
  }

  if (action.type === DELETE_PEER) {
    const peers = action.payload;

    if (peers.indexOf(state) !== -1) {
      return null;
    }
  }

  return state;
}

function filesToTransfer(state = {}, action) {
  if (action.type === ADD_FILES) {
    const fingerprintedFiles = action.payload;

    const newState = { ...state };

    fingerprintedFiles.forEach((fingerprintedFile) => {
      const { file, fingerprint } = fingerprintedFile;

      newState[fingerprint] = file;
    });

    return newState;
  }

  return state;
}

function systemMessageMetaData(
  state = { isSelected: false, isRead: true }, action) {

  if (action.type === UPDATE_IS_SYSTEM_MESSAGE_SELECTED) {
    const newState = { ...state };

    newState.isSelected = !newState.isSelected;
    newState.isRead = newState.isSelected ? true : newState.isRead;

    return newState;
  }

  if (action.type === ADD_SYSTEM_MESSAGE) {
    const newState = { ...state };
    newState.isRead = newState.isSelected ? true : false;

    return newState;
  }

  return state;

}

const defaultSystemMessage = {
  message: `App version: ${ LOCALDROP_APP_VERSION }\n\nHi, This is the first system message!`,
  fingerprint: generateFingerPrint(),
  createdAt: getCurrentTime(),
};

function systemMessages(state = [defaultSystemMessage], action) {
  if (action.type === ADD_SYSTEM_MESSAGE) {
    const systemMessage = action.payload;
    const newState = [ systemMessage, ...state ];

    return newState;
  }

  return state;
}


export default combineReducers({
  localDropState,
  messagePackets,
  myUUID,
  peerUUID,
  filesToTransfer,
  messageProgresses,
  systemMessageMetaData,
  systemMessages,
});

