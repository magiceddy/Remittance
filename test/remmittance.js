const Promise = require('bluebird');
const Remittance = artifacts.require("./Remittance.sol");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

let instance;

contract('Remittance', async accounts => {
    const owner = accounts[0];
    const sender = accounts[1];
    const exchange = accounts[2];

    beforeEach(async() => {
        instance = await Remittance.deployed();
    });

    describe('Contructor', async() => {

        describe('fail case', async() => {

            it('should fail with value in transaction', async() => {
                try {
                    const ValueInstance = await Remittance.new({ value: 10 });
                    assert.isUndefined(ValueInstance, 'Contructor accept transaction with value');
                } catch (err) {
                    assert.equal(
                        err.message, 
                        'Cannot send value to non-payable constructor', 
                        'No Revert for value in contructor transaction'
                    );
                }
            });
        });

        describe('success case', async() => {

            it('should set the correct contract\'s owner', async() => {
                const contractOwner = await instance.owner();
                assert.strictEqual(contractOwner, owner, 'Contract creator is not the owner');
            });
        });
    });
});