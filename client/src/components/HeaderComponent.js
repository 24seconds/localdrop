import React, { Component } from 'react';
import styled from 'styled-components';
import { mobileWidth } from '../constants/styleConstants';
import { ReactComponent as GithubLogo } from '../assets/github-logo.svg';

const Header = styled.div`
  display: flex;
  text-align: center;
  font-size: 26px;
  height: 60px;
  background: ${ props => props.theme.Background };

  .localdrop-header-title {
    display: flex;
    height: 100%;
    align-items: center;
    margin-left: 20px;
    flex-grow: 1;
    text-align: left;
    color: ${ props => props.theme.StringsColor };
    font-weight: bold;
  }

  .localdrop-header-github {
    display: flex;
    font-size: 18px;
    justify-content: center;
    align-items: center;
    margin-right: 20px;
    color: ${ props => props.theme.StringsColor };
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      fill: ${ props => props.theme.SecondText };
    }
  }

  @media (max-width: ${ mobileWidth }) {
    display: flex;
    height: 50px;
    text-align: left;

    .localdrop-header-title {
      margin-left: 10px;
      font-size: 18px;
    }

    .localdrop-header-github {
      font-size: 14px;
      margin-right: 10px;

      svg {
        width: 16px;
        height: 16px;
        margin-right: 6px;
      }
    }
  }
`;


class HeaderComponent extends Component {
  constructor(props) {
    super(props);

    this.onClickRepo = this.onClickRepo.bind(this);
  }

  onClickRepo() {
    window.open('https://github.com/24seconds/localdrop', '_blank');
  }

  render() {
    return (
      <Header className='localdrop-header' >
        <div className='localdrop-header-title'>
          Local Drop!
        </div>
        <div className='localdrop-header-github' onClick={ this.onClickRepo }>
          <GithubLogo/>
          localdrop
        </div>
      </Header>
    );
  }
}


export default HeaderComponent;
