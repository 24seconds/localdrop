import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import MessageItemComponent from './MessageItemComponent';
import SystemMessageItemComponent from './SystemMessageItemComponent';
import { mobileWidth } from '../../constants/styleConstants';

const MessageTable = styled.div`
  width: 100%;
  height: calc(100% - 294px);
`;

const MessageItemContainer = styled.div`
  display: ${ props => props.isSelected ? 'block' : 'none' };
  min-height: 100px;
  height: 100%;
  background: ${ props => props.theme.SecondBackground };
  overflow-y: scroll;

  @media (max-width: ${ mobileWidth }) {
    height: auto;
    min-height: 300px;
  }
`;


class MessageTableComponent extends Component {
  render() {
    const {
      messagePackets,
      systemMessages,
      systemMessageMetaData,
    } = this.props;

    return (
      <MessageTable className='localdrop-message-table'>
        {
          <MessageItemContainer
            className='localdrop-message-item-container'
            isSelected={ !systemMessageMetaData.isSelected }>
            {
              messagePackets.map(messagePacket => {
                const { data } = messagePacket;

                return (
                  <MessageItemComponent
                    key={ data.fingerprint }
                    messagePacket={ messagePacket } />
                )
              })
            }
          </MessageItemContainer>
        }
        {
          <MessageItemContainer
            isSelected={ systemMessageMetaData.isSelected }>
            {
              systemMessages.map(systemMessage => {

              return (
                <SystemMessageItemComponent
                  key={ systemMessage.fingerprint }
                  systemMessage={ systemMessage } />
                )
              })
            }
          </MessageItemContainer>
        }
      </MessageTable>
    );
  }
}

const mapStateToProps = state => ({
  messagePackets: state.messagePackets,
  systemMessages: state.systemMessages,
  systemMessageMetaData: state.systemMessageMetaData,
});
export default connect(mapStateToProps)(MessageTableComponent);
