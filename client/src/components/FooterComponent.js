import React, { Component } from 'react';
import styled from 'styled-components';
import { ReactComponent as GithubLogo } from '../assets/github-logo.svg';
import { mobileWidth } from '../constants/styleConstants';


const Footer = styled.div`
  display: flex;
  height: 40px;
  color: ${ props => props.theme.StringsColor };
  background: ${ props => props.theme.Background };

  div {
    display: flex;
    align-items: center;
    text-align: left;
    color: $color-text;
    font-size: 14px;
    margin: 2px 20px 2px 20px;
    cursor: pointer;

    svg {
      width: 20px;
      height: 20px;
      margin-right: 6px;
      fill: ${ props => props.theme.SecondText };
    }
  }

  @media (max-width: ${ mobileWidth }) {
    display: none;
  }
`;


export default class FooterComponent extends Component {
  constructor(props) {
    super(props);

    this.onClickId = this.onClickId.bind(this);
    this.onClickRepo = this.onClickRepo.bind(this);
  }

  onClickId() {
    window.open('https://github.com/24seconds/', '_blank');
  }

  onClickRepo() {
    window.open('https://github.com/24seconds/localdrop', '_blank');
  }

  render() {
    return (
      <Footer className='localdrop-footer'>
        <div onClick={ this.onClickId }>
          <GithubLogo/>
          24seconds
        </div>
        <div onClick={ this.onClickRepo }>
          <GithubLogo/>
          repo : localdrop
        </div>
      </Footer>
    );
  }
}