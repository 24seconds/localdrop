import React, { Component, Fragment } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import './utils/localApi';
import './utils/window';
import HeaderComponent from './components/HeaderComponent';
import PeerTabComponent from './components/Message/PeerTabComponent';
import MetaDataComponent from './components/MetaData/MetaDataComponent';
import MessageTableComponent from './components/Message/MessageTableComponent';
import MessageTableHeaderComponent from './components/Message/MessageTableHeaderComponent';
import FooterComponent from './components/FooterComponent';
import SendComponent from './components/Send/SendComponent';
import { mobileWidth, ColorThemes } from './constants/styleConstants';

const GlobalStyle = createGlobalStyle`
  html, body {
    background-color: ${ props => props.theme.SecondBackground };
  }
`;

const LocalDropApp = styled.div`
  height: calc(100% - 110px);
  padding: 50px 100px;

  @media (max-width: ${ mobileWidth }) {
    padding: 0;
  }
`;

const Container = styled.div`
  border: solid 2px ${ props => props.theme.Contrast };
  border-radius: 5px;
  height: 100%;

  @media (max-width: ${ mobileWidth }) {
    margin: 0;
    border: none;
  }
`;

const MobileSticky = styled.div`
  background-color: ${ props => props.theme.SecondBackground };

  @media (max-width: ${ mobileWidth }) {
    position: sticky;
    top: 0;
  }
`

class App extends Component {
  STORAGE_COLOR_THEME_KEY = 'STORAGE_COLOR_THEME_KEY';
  themeIndex = 0;

  constructor(props) {
    super(props);

    this.state = {
      colorTheme: ColorThemes[this.getStorageColorTheme() || 'MaterialThemeOceanic'],
    }

    this.onChangeTheme = this.onChangeTheme.bind(this);
  }

  getStorageColorTheme() {
    return window.localStorage.getItem(this.STORAGE_COLOR_THEME_KEY);
  }

  setStorageColorTheme(value) {
    window.localStorage.setItem(this.STORAGE_COLOR_THEME_KEY, value);
  }

  getNextKey(keys) {
    const nextKey = keys[this.themeIndex];
    this.themeIndex = (this.themeIndex + 1) % keys.length;

    if (nextKey === localStorage.getItem(this.STORAGE_COLOR_THEME_KEY)) {
      return this.getNextKey(keys);
    } else {
      return nextKey;
    }
  }

  onChangeTheme() {
    console.log('onChangeTheme called');

    const keys = Object.keys(ColorThemes);
    const nextKey = this.getNextKey(keys);
    this.setStorageColorTheme(nextKey);

    console.log('randomKey is ', nextKey);

    this.setState({
      colorTheme: ColorThemes[nextKey],
    });
  }

  render() {
    const { colorTheme } = this.state;

    console.log('colorTheme is ', colorTheme);

    return (
      <ThemeProvider theme={ colorTheme }>
        <GlobalStyle />
        <LocalDropApp className="App">
          <Container className='localdrop-app-container'>
            <MobileSticky>
              <HeaderComponent />
              <SendComponent />
              <MetaDataComponent onChangeTheme={ this.onChangeTheme } />
              <PeerTabComponent />
              <MessageTableHeaderComponent />
            </MobileSticky>
            <MessageTableComponent />
            <FooterComponent />
          </Container>
        </LocalDropApp>
      </ThemeProvider>
    );
  }
}

export default App;
