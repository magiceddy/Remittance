import Remittance from '../../../build/contracts/Remittance.json';
import contract from 'truffle-contract';
import { getWeb3 } from '../common/context/Web3Context';

const web3 = getWeb3();

const remittance = contract(Remittance);
remittance.setProvider(web3.currentProvider);

export {
  remittance
}