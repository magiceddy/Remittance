import React from 'react';
import { default as Web3 } from 'web3';

let web3 = undefined;

export const getWeb3 = () => {
    if (typeof window.web3 !== 'undefined') {
        web3 = new Web3(window.web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    return web3;
};

export default React.createContext(null);
