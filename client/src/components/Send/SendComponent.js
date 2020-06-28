import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import {
  connectToPeer,
  sendTextToPeer,
  sendFilesToPeer,
  writeSystemMessage,
} from '../../utils/localApi';
import { addFiles } from '../../redux/action';
import { generateFingerPrint } from '../../utils/commonUtil';
import FingerprintedFile from '../../utils/dataSchema/FingerprintedFile';
import { mobileWidth } from '../../constants/styleConstants';
import { rippleEffect } from '../SharedStyle';

const Send = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 180px;
  height: 70px;
  margin-top: 5px;
  background-color: ${ props => props.theme.SecondBackground };

  textarea {
    background-color: ${ props => props.theme.SecondBackground };
    color: ${ props => props.theme.SecondText  };
    resize: none;
    flex-grow: 1;
    padding: 10px 5px;
    min-height: 40px;
    max-height: 120px;
    outline: none;
    border: 2px solid ${ props => props.theme.Border };
    border-radius: 4px;
  }

  @media (max-width: ${ mobileWidth }) {
    height: 75px;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const SelectFileButton = styled.button`
  width: 50px;
  height: 50px;
  border: 1px solid ${ props => props.theme.Border };
  border-radius: 4px;
  margin: 0 5px;
  background-color: ${ props => props.theme.Buttons };
  outline: none;

  color: ${ props => props.theme.ParametersColor };
  font-size: 16px;
  font-weight: 800;
  ${ rippleEffect };

  @media (max-width: ${ mobileWidth }) {
    width: 40px;
    height: 40px;
  }
`;

const SendPasteButton = styled.button`
  width: 50px;
  outline: none;
  background-color: ${ props => props.theme.Buttons };
  color: ${ props => props.theme.AttributesColor };
  border: 2px solid ${ props => props.theme.Border };
  border-radius: 4px;
  padding: 0;
  margin: 0 3px;
  height: 50px;

  ${ rippleEffect };
`;

const SendButton = styled(SendPasteButton)`
  margin: 0 5px 0 3px;

  @media (max-width: ${ mobileWidth }) {
    margin: 0 5px 0 0;
  }
`;

class SendComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: '',
      files: [],
    }

    this.handleText = this.handleText.bind(this);
    this.onSend = this.sendText.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
    this.onClickFile = this.onClickFile.bind(this);
    this.onPasteText = this.onPasteText.bind(this);

    this.fileInputRef = null;
    this.textareaRef = null;
  }

  getPlaceholder() {
    const { peerUUID } = this.props;

    if (peerUUID) {
      return `Send Message to #${peerUUID}...`;
    } else {
      return `Select peer to send Message!`;
    }
  }

  handleFiles(event) {
    const { peerUUID } = this.props;
    // 그럼 여기서 packet을 보내야한다는 거네?

    console.log('handleFiles called, peerUUID is ', peerUUID);

    if (peerUUID) {
      const files = event.target.files;

      if (files.length === 0) {
        console.log('no files are selected');
        return;
      }

      const fingerprintedFiles = [];
      for (let i = 0; i < files.length; i ++) {
        fingerprintedFiles.push(
          new FingerprintedFile({
            file: files.item(i),
            fingerprint: generateFingerPrint()
          }));
      }

      console.log('handleFiles, files are ', files);

      this.props.dispatch(addFiles(fingerprintedFiles));

      sendFilesToPeer(peerUUID, fingerprintedFiles);
    } else {
      writeSystemMessage('peerUUID is null! Select peer to transfer files!');
    }
  }

  handleText(event) {
    this.setState({ text: event.target.value });
  }

  sendText() {
    const { peerUUID } = this.props;
    const { text } = this.state;

    console.log('sendText is called, text is ', text);

    if (text.length === 0) {
      return;
    }

    if (peerUUID) {
      sendTextToPeer(peerUUID, text);
      // connectToPeer(uuid);
      // this.setState({ text: '' });
      if (this.textareaRef) {
        this.textareaRef.focus();
      }
    } else {
      writeSystemMessage('peerUUID is null! Select peer to send text!');
    }
  }

  onClickFile() {
    this.fileInputRef && this.fileInputRef.click()
  }

  async onPasteText() {
    const text = await navigator.clipboard.readText();

    this.setState({
      text
    });
  }

  render() {
    const { text } = this.state;

    return (
      <Send>
        <FileInput
          type='file'
          ref={ (ref) => this.fileInputRef = ref }
          multiple={ true }
          onClick={ () => { this.fileInputRef.value = null } }
          onChange={ this.handleFiles }/>
        <SelectFileButton onClick={ this.onClickFile }> + </SelectFileButton>
        <textarea
          autoCorrect={ 'off' }
          autoCapitalize={ 'off' }
          spellCheck={ false }
          ref={ (ref) => this.textareaRef = ref }
          value={ text } onChange={ this.handleText }
          placeholder={ this.getPlaceholder() } />
        <SendPasteButton onClick={ this.onPasteText }>
          paste
        </SendPasteButton>
        <SendButton onClick={ this.onSend } >
          send
        </SendButton>
      </Send>
    )
  }
}

const mapStateToProps = state => ({
  myUUID: state.myUUID,
  peerUUID: state.peerUUID,
});
export default connect(mapStateToProps)(SendComponent);
