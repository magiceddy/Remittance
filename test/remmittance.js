const Promise = require('bluebird');
const Remittance = artifacts.require("./Remittance.sol");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

let instance;

contract('Remittance', async accounts => {
    instance = await Remittance.deployed();
});