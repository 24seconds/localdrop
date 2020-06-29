import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { PEER_MESSAGE_TYPE } from '../../schema';
import { requestDownloadFile } from '../../utils/localApi';
import { messageCell, rippleEffect } from '../SharedStyle';
import {
  TabContentWidth,
  TabSmallWidth,
  TabSmall2Width,
  mobileWidth,
} from '../../constants/styleConstants';
import { getMyUUID } from '../../utils/localApi';
import { getSizeString } from '../../utils/commonUtil';

const MessageItem = styled.div`
  display: flex;
  width: 100%;
  height: 40px;
  font-size: 18px;
  border: solid 1px ${ props => props.theme.Contrast };
  border-style: solid none solid none;
  box-sizing: border-box;
  color: ${ props => props.theme.StringsColor };

  @media (max-width: ${ mobileWidth }) {
    border: none;
  }

`;

const MessageCell = styled.div`
  ${ messageCell }
  height: auto;
  border-style: none solid none none;
  font-size: 14px;

  @media (max-width: ${ mobileWidth }) {
    border-style: none solid solid none;
  }
`;

const MessageInOutCell = styled(MessageCell)`
  color: ${ props =>
    props.isMyMessagePacket
    ? props => props.theme.ParametersColor
    : props => props.theme.OperatorsColor };
`;


const MessageContentCellContainer = styled.div`
  ${ messageCell }
  justify-content: flex-start;
  border-style: none solid none none;
  height: auto;
  width: auto;
  max-width: none;
  flex-grow: 1;

  @media (max-width: ${ mobileWidth }) {
    border: solid 1px ${ props => props.theme.Border };
    border-style: none solid solid none;
  }
`;

const MessageContentCell = styled.span`
  display: block;
  height: auto;
  border-style: none;
  text-align: left;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  a {
    color: ${ props => props.theme.LinksColor };
  }
`;

const MessageButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100px;
  min-width: 100px;
  padding: 0 10px;

  @media (max-width: ${ mobileWidth }) {
    border: solid 1px ${ props => props.theme.Border };
    border-style: none solid solid none;
  }
`;

const MessageButtonCell = styled.button`
  width: 80px;
  height: 30px;
  margin: 0 3px;
  padding: 0;
  outline: none;
  font-size: 14px;

  background-color: ${ props => props.theme.Buttons };
  color: ${ props => props.theme.AttributesColor };
  border: 2px solid ${ props => props.theme.Border };
  border-radius: 4px;

  ${ rippleEffect };
`;

class MessageItemComponent extends Component {
  constructor(props) {
    super(props);

    this.onDownloadOrCopy = this.onDownloadOrCopy.bind(this);
    this.isMyMessagePacket = this.isMyMessagePacket.bind(this);
  }

  onDownloadOrCopy() {
    const { messagePacket } = this.props;
    const { source, type, data } = messagePacket;

    if (type === PEER_MESSAGE_TYPE.TEXT) {
      const { message } = data;

      navigator.clipboard.writeText(message).then(function() {
        // TODO: notify user that copy to clip succeed
      }, function() {
        // TODO: notify user that copy to clip failed
      });

      return;
    }

    if (type === PEER_MESSAGE_TYPE.FILE) {
      // request download
      requestDownloadFile(source, data);
      return;
    }

    if (type === PEER_MESSAGE_TYPE.ERROR) {
      // TODO: ???? do same as text type?..
    }
  }

  isMyMessagePacket(source) {
    console.log('isMyMessagePacket, source is ', source);
    console.log('isMyMessagePacket, getMyUUID() is ', getMyUUID());

    return source === getMyUUID();
  }

  isStartWithHttp(message) {
    return message.startsWith('http');
  }

  renderContent(messageType, data) {
    if (messageType === PEER_MESSAGE_TYPE.TEXT) {
      return (
        <Fragment>
          <MessageContentCellContainer width={ TabContentWidth }>
            {
              this.isStartWithHttp(data.message)
              ? <MessageContentCell>
                  <a href={ data.message } target='_blank' rel='noopener noreferrer'>
                    { `${ data.message }` }
                  </a>
                </MessageContentCell>
              : <MessageContentCell>{ `${ data.message }` }</MessageContentCell>
            }
          </MessageContentCellContainer>
          <MessageCell padding={ '0' }>{ `${ data.size }` }</MessageCell>
        </Fragment>
      );
    }

    if (messageType === PEER_MESSAGE_TYPE.FILE) {
      const sizeString =  getSizeString(data.size);

      return (
        <Fragment>
          <MessageContentCellContainer width={ TabContentWidth }>
            <MessageContentCell>{ `${ data.message }` }</MessageContentCell>
          </MessageContentCellContainer>
          <MessageCell padding={ '0' }>{ sizeString }</MessageCell>
        </Fragment>
      );
    }

    return;
  }

  renderButton(messageType, source) {
    if (messageType === PEER_MESSAGE_TYPE.TEXT) {
      return (
        <MessageButtonCell onClick={ this.onDownloadOrCopy }>
          Copy
        </MessageButtonCell>
      )
    }

    if (messageType === PEER_MESSAGE_TYPE.FILE && !this.isMyMessagePacket(source)) {
      return (
        <MessageButtonCell onClick={ this.onDownloadOrCopy }>
          Download
        </MessageButtonCell>
      )
    }

    return;
  }

  renderMessagePacket(messagePacket) {
    if (!messagePacket) {
      return;
    }

    const {
      source,
      destination,
      type,
      data,
      time,
      progress,
    } = messagePacket;

    const isMyMessagePacket = this.isMyMessagePacket(source);

    return (
      <Fragment>
        <MessageInOutCell
          width={ TabSmall2Width } padding={ '0' }
          isMyMessagePacket={ isMyMessagePacket }>
          { `${ isMyMessagePacket ? '⇇' : '⇉' }` }
        </MessageInOutCell>
        <MessageCell padding={ '0' }>{ `#${ source }` }</MessageCell>
        <MessageCell padding={ '0' }>{ `#${ destination }` }</MessageCell>
        <MessageCell width={ TabSmallWidth }>{ `${ type }` }</MessageCell>
        { this.renderContent(type, data) }
        <MessageCell width={ TabSmallWidth }>{ `${ time }` }</MessageCell>
        { false && <MessageCell>{ `${ progress }` }</MessageCell> }
        <MessageButtonContainer>
          { this.renderButton(type, source) }
        </MessageButtonContainer>
        { false && <MessageButtonCell>+</MessageButtonCell> }
        { false && <MessageButtonCell>Delete</MessageButtonCell> }
      </Fragment>
    );
  }

  render() {
    const { messagePacket } = this.props;

    return (
      <MessageItem className='localdrop-message-item'>
        { this.renderMessagePacket(messagePacket) }
      </MessageItem>
    )
  }
}

export default MessageItemComponent;
