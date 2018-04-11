import { takeLatest } from 'redux-saga/effects';
import { SET_TRASHHOLD } from '../constants';
import { getWeb3 } from '../../common/context/Web3Context';
import { remittance } from '../../utility/ContractsProvider';

const web3 = getWeb3();

function* setTrash() {
  try {
    const instance = yield remittance.deployed();
    yield remittance.defaults({ from: web3.eth.coinbase });
    const estimateGas = yield instance.withdrawal.estimateGas(0xab, 0xa, 0xc);
    const txCost = web3.eth.gasPrice * estimateGas;
    yield instance.setTrashhold(txCost)
  } catch (err) {
    console.error(err);
  }
}

export default function* setTrashholdSaga() {
  yield takeLatest(SET_TRASHHOLD, setTrash)
}