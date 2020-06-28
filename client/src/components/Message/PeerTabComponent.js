import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { connectToPeer } from '../../utils/localApi';
import { updatePeerUUID, updateIsSystemMessageTabSelected } from '../../redux/action';
import { mobileWidth } from '../../constants/styleConstants';
import ToggleSwitch from '../ToggleSwitch';

const PeerTab = styled.div`
  background: ${ props => props.theme.SelectionBackground };
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 50px;

`;

const PeerList = styled.div`
  display: flex;
  flex-grow: 1;

  overflow-x: scroll;
  scrollbar-width: none; /* Firefox */

  ::-webkit-scrollbar { /* WebKit */
    width: 0;
    height: 0;
  }
`;

const SystemMessageTab = styled.div`
  position:relative;
  display: flex;
  align-items: center;
  border-radius: 4px;
  height: 40px;
  margin-right: 5px;
`;

const ConnectivityState = styled.div`
  margin: 10px 0;
  // TODO: Change color to Material color
  border: solid 1px green;

  button {
    margin-left: 16px;
  }
`;

const PeerTabButton = styled.button`
  width: 100px;
  height: 40px;
  font-size: 14px;
  margin: 0 5px;
  background-color: ${
    props => props.isSelected
    ? props => props.theme.SelectionForeground
    : props => props.theme.Disabled };
  border: solid 2px ${ props => props.theme.Border };
  border-radius: 4px;
  outline: none;

  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }

  @media (max-width: ${ mobileWidth }) {
    width: 80px;
    height: 30px;
    font-size: 12px;
  }
`;

const Peers = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 40px;
  font-size: 16px;
  background: ${ props => props.theme.Foreground };
  margin: 0 0 0 5px;
  border: solid 2px ${ props => props.theme.Border };
  border-radius: 4px;

  @media (max-width: ${ mobileWidth }) {
    width: 50px;
    height: 30px;
    font-size: 12px;
  }
`;


class PeerTabComponent extends Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onClickSystemMessageTab = this.onClickSystemMessageTab.bind(this);
  }

  onClick(uuid) {
    console.log('uuid is ', uuid);

    this.props.dispatch(updatePeerUUID(uuid));
    connectToPeer(uuid);
  }

  onClickSystemMessageTab() {
    this.props.dispatch(updateIsSystemMessageTabSelected());
  }

  render() {
    const {
      peers,
      peerUUID: selectedPeerUUID,
      systemMessageMetaData,
    } = this.props;

    console.log('this.props is ', this.props);
    console.log('peers is ', peers);

    return (
      <Fragment>
        <PeerTab className='localdrop-peer-tab'>
          <Peers>PEERS :</Peers>
          {
            false &&
            <PeerTabButton key='ALL' disabled={ false }>
              ALL
            </PeerTabButton>
          }
          {
            <PeerList>
              {
                peers && peers.map(peer => {
                  return (
                    <PeerTabButton
                      key={ peer }
                      isSelected={ peer === selectedPeerUUID }
                      onClick={ this.onClick.bind(this, peer) }>
                      { `#${peer}` }
                    </PeerTabButton>
                  )
                })
              }
            </PeerList>
          }
          <SystemMessageTab isRead={ systemMessageMetaData.isRead }>
            <ToggleSwitch
              key='System-Message-toggle'
              isSwitchOn={ systemMessageMetaData.isSelected }
              isRead={ systemMessageMetaData.isRead }
              onClick={ this.onClickSystemMessageTab } />
          </SystemMessageTab>
        </PeerTab>
        {
          false &&
          <ConnectivityState className='localdrop-connectivity-state'>
            Peer Connection State: Connected, <button> Retry </button>
          </ConnectivityState>
        }
      </Fragment>
    )
  }
}


const mapStateToProps = state => ({
  peers: state.localDropState.peers,
  peerUUID: state.peerUUID,
  systemMessageMetaData: state.systemMessageMetaData,
});
export default connect(mapStateToProps)(PeerTabComponent);
