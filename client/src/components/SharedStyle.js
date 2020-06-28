import { css } from 'styled-components';
import {
  mobileWidth,
  TabDefaultWidth,
} from '../constants/styleConstants';

export const messageCell = css`
  display: flex;
  justify-content: center;
  align-items: center;
  border: solid 1px ${ props => props.theme.Border };
  border-top: none;
  padding: ${props => props.padding || '0 10px' };
  height: 30px;
  font-size: 16px;
  width: ${props => props.width || TabDefaultWidth }px;
  min-width: ${props => props.width || TabDefaultWidth }px;
  max-width: ${props => props.width || TabDefaultWidth }px;
`
export const rippleEffect = css`
  background-position: center;
  transition: background 0.3s;

  &:hover {
    cursor: pointer;
    opacity: 0.8;
    background: ${ props => props.theme.Buttons }
        radial-gradient(circle, transparent 1%, ${ props => props.theme.Active } 1%)
        center/15000%;
  }

  &:active {
    background-color: ${ props => props.theme.Contrast };
    background-size: 100%;
    transition: background 0s;
  }

  @media (max-width: ${ mobileWidth }) {
    &:focus {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    -ms-touch-action: manipulation;
    touch-action: manipulation;
  }
  }
`;
