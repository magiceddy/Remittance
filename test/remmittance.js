const Promise = require('bluebird');
const Remittance = artifacts.require("./Remittance.sol");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

let instance;

contract('Remittance', async accounts => {
    const owner = accounts[0];
    const sender = accounts[1];
    const exchange = accounts[2];

    let exchangePuzzle;
    let receiverPuzzle;
    let puzzle;

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

    describe('setRemittance', async() => {

        describe('fail case', async() => {

            it('should fail whitout trashhold setted', async() => {
                try {
                    const txOjb = await instance.setRemittance(0xa, 1, 1, { value: 10 });
                    assert.isUndefined(txOjb, 'it set remmittance with an incorrect treshhold');
                } catch (err) {
                    assert.include(err.message, 'revert', 'not revert with an incorrect threshhold');
                }
            })

            it('should fail with msg.value lower than trashhold', async() => {
                try {
                    await instance.setTrashhold(10);
                    const txOjb = await instance.setRemittance(0xa, 1, 1, { value: 5 });
                    assert.isUndefined(txOjb, 'it set remittance for msg.value lower than treshhold');
                } catch (err) {
                    assert.include(err.message, 'revert', 'not revert with msg.value lower than trashhold');
                }
            });

            it('should fail for remittance already created', async() => {
                try {
                    await instance.setTrashhold(10);
                    await instance.setRemittance(0xa, 1, 1, { value: 10 });

                    const txOjb = await instance.setRemittance(0xa, 1, 1, { value: 10 });
                    assert.isUndefined(txOjb, 'creation of multiple remittance with same puzzle');
                } catch (err) {
                    assert.include(err.message, 'revert', 'not revert with same puzzle');
                }
            });
        });

        describe('success case', async() => {

            it('should create a remittance', async() => {
                await instance.setTrashhold(30);
                const txObject = await instance.setRemittance(0xa, 1, 1, { value: 31 });

                const transaction = web3.eth.getTransactionReceipt(txObject.tx);
                const block = web3.eth.getBlock(transaction.blockNumber);
                const timestamp = block.timestamp;

                const remittance = await instance.getRemittance(0xa);
                assert.equal(remittance[0].toString(10), 31, 'remittance\'s amount not equal to msg.value');
                assert.equal(remittance[1].toString(10), timestamp + 1, 'incorrect claimStart');
                assert.equal(remittance[2].toString(10), timestamp + 1, 'incorrect claimEnd');
                assert.isTrue(remittance[3], 'toBeTransfered is not true');
            });
        });
    });

    describe('Withdrawal', async() => {});
});