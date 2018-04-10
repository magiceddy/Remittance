import React from 'react';
import { web3 as Web3 } from 'web3';

const getWeb3 = () => {
    let web3 = undefined;

    if(typeof window.web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        console.log('ciao');
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    console.log('web3');
    console.log(web3);
    return web3;
};

export default Web3Context = React.createContext(getWeb3());
