import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import MessageItemComponent from './MessageItemComponent';
import SystemMessageItemComponent from './SystemMessageItemComponent';
import { mobileWidth, MaterialThemeOceanic } from '../../constants/styleConstants';

const MessageTable = styled.div`
  width: 100%;
  height: calc(100% - 296px);
`;

const MessageItemContainer = styled.div`
  min-height: 100px;
  height: 100%;
  background: ${ MaterialThemeOceanic.SecondBackground };
  overflow-y: scroll;

  /* hide scrollbar */
  scrollbar-width: none; /* Firefox */
  ::-webkit-scrollbar { /* WebKit */
    width: 0;
    height: 0;
  }

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
          !systemMessageMetaData.isSelected &&
          <MessageItemContainer
            className='localdrop-message-item-container'>
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
          systemMessageMetaData.isSelected &&
          <MessageItemContainer>
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
