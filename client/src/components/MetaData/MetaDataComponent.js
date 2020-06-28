import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { mobileWidth } from '../../constants/styleConstants';
import { rippleEffect } from '../SharedStyle';


const MetaData = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
`;

const OtherMetadata = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: flex-end;
`;

const ThemeColorButton = styled.button`
  height: 30px;
  margin: 0 5px;
  outline: none;
  border: solid 2px ${ props => props.theme.Border };
  border-radius: 4px;
  background-color: ${ props => props.theme.Buttons };
  color: ${ props => props.theme.AttributesColor };

  ${ rippleEffect };
`;

const MyUUID = styled.div`
  display: flex;
  height: 30px;
  align-items: center;
  font-size: 14px;
  color: ${ props => props.theme.StringsColor };
  background-color: ${ props => props.theme.SecondBackground };

  span {
    margin-right: 8px;
    margin: 0 8px 0 10px;
    color: ${ props => props.theme.ParametersColor };
  }

  @media (max-width: ${ mobileWidth }) {
    height: 25px;
  }
`;

class MetaDataComponent extends Component {
  constructor(props) {
    super(props);

    this.onClickColorThemeButton = this.onClickColorThemeButton.bind(this);
  }

  // TODO: Give Theme Select option to user later
  onClickColorThemeButton() {
    const { onChangeTheme } = this.props;

    if (onChangeTheme) {
      onChangeTheme();
    }
  }

  render() {
    const { myUUID } = this.props

    return (
      <MetaData>
        <MyUUID>
          <span>My uuid:</span>
          { `${ myUUID ? ('#'+ myUUID) : '' }` }
        </MyUUID>
        <OtherMetadata>
          <ThemeColorButton onClick={ this.onClickColorThemeButton } >
            Change Color Theme
          </ThemeColorButton>
        </OtherMetadata>
      </MetaData>
    )
  }
}

const mapStateToProps = state => ({
  myUUID: state.myUUID,
});
export default connect(mapStateToProps)(MetaDataComponent);