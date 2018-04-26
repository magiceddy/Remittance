const RemittanceManager = artifacts.require("./RemittanceManager.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const Bank = artifacts.require("./Bank.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(SafeMath);
    deployer.link(SafeMath, RemittanceManager);
    deployer.deploy(RemittanceManager, accounts[6]);
};
