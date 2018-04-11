import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { HashRouter as Router } from 'react-router-dom';
import Web3Context, { getWeb3 } from './common/context/Web3Context';

const web3 = getWeb3();

export default class Root extends Component {
  get content() {
    return (
      <Router>
        {this.props.routes}
      </Router>
    );
  }

  render() {
    return (
      <Provider store={this.props.store}>
        <Web3Context.Provider value={web3}>
          {this.content}
        </Web3Context.Provider>
      </Provider>
    );
  }
}

Root.propTypes = {
  routes: PropTypes.element.isRequired,
  store: PropTypes.object.isRequired,
};
