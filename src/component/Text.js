import React, { Component } from 'react';
import { Text as TextRN } from 'react-native';
import * as s from "../Styles";

export default class Text extends Component {
  render() {
    return (
      <TextRN style={[styles.font, this.props.style]} {...this.props}> 
        {this.props.children}
      </TextRN>
    )
  }
}
const styles = {
  font: {
    fontFamily: s.fontName
  }
};
