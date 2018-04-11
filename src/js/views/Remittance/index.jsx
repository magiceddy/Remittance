import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Web3Context from '../../common/context/Web3Context';
import { setTrashhold } from '../../redux/actions';

import '../../../../node_modules/flexboxgrid/css/flexboxgrid.css';

class Remittance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      beneficiary: 'beneficiary Phone Numbe',
      exchange: 'exchange email',
      amount: 'amount in eth'
    }
    this.onBeneficiaryChange = this.onBeneficiaryChange.bind(this);
    this.onExchangeChange = this.onExchangeChange.bind(this);
    this.onAmountChange = this.onAmountChange.bind(this);
    this.send = this.send.bind(this);
  }

  onBeneficiaryChange(e) {
    this.setState({ beneficiary: e.value });
  }

  onExchangeChange(e) {
    this.setState({ exchange: e.value });
  }

  onAmountChange(e) {
    this.setState({ amount: e.value });
  }

  send() {
    const { beneficiary, exchange, amount } = this.state;
    this.remittance({ beneficiary, exchange, amount })
  }

  render() {
    const { beneficiary, exchange, amount } = this.state;

    return (
      <div className="row center-xs">
        <div className="col-xs-10 col-xs-offset-1">
          <input
            id="beneficiary"
            value={beneficiary}
            onChange={this.onBeneficiaryChange}
          />
          <div className="col-xs-10 col-xs-offset-1">
            <input
              id="exchange"
              value={exchange}
              onChange={this.onExchangeChange}
            />
          </div>
          <div className="col-xs-10 col-xs-offset-1">
            <input
              id="amount"
              value={amount}
              onChange={this.onAmountChange}
            />
          </div>
          <div className="col-xs-10 col-xs-offset-1">
            <button id="sendButton" onclick={this.send}>Send amount</button>
          </div>
          <Web3Context.Consumer>
            {web3 => console.log(web3)}
          </Web3Context.Consumer>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.setTrashhold();
  }
}

Remittance.propTypes = {
  setTrashhold: PropTypes.func.isRequired
};

export default connect(
  state => ({}),
  {
    setTrashhold
  }
)(Remittance);
