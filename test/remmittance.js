const Promise = require('bluebird');
const Remittance = artifacts.require("./Remittance.sol");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });
Promise.promisifyAll(web3.personal, { suffix: "Promise" });

let instance;

contract('Remittance', async accounts => {
    const owner = accounts[0];
    const sender = accounts[1];
    const exchange = accounts[2];

    beforeEach(async() => {
        instance = await Remittance.new();
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

    describe('', async() => {

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

    describe('Withdrawal', async() => {

        let exchangePuzzle;
        let receiverPuzzle;
        let puzzle;
        let exchangeEmail = web3.sha3("test@gmail.com");
        let receiverPhone = web3.sha3("+39495869433");
        let exchangeNonce;
        let receiverNonce;
        
        beforeEach(async() => {
            exchangeNonce = await instance.getOneTimeNonce.call(exchangeEmail);
            receiverNonce = await instance.getOneTimeNonce.call(receiverPhone);
            exchangePuzzle = web3.sha3(exchangeEmail + exchangeNonce);
            receiverPuzzle = web3.sha3(receiverPhone + receiverNonce);
            puzzle = web3.sha3(exchangePuzzle.substr(2), receiverPuzzle.substr(2), { encoding: 'hex' });
            await instance.setTrashhold(1);
        });

        describe('fail case', async() => {

            it('should fail whit inconsistend data inputs', async() => {
                await instance.setRemittance(puzzle, 1, 1, { value: 2 });
                const result = await instance.withdrawal.call(exchange, exchangePuzzle, receiverPuzzle);
                assert.isFalse(result, 'withdrawal with inconsistent sender');
            });

            it('should fail with too early claimback', async() => {
                await instance.setRemittance(puzzle, 10000, 10000, { value: 2 });

                try {
                    const txObject = await instance.withdrawal(owner, exchangePuzzle, receiverPuzzle);
                    assert.isUndefined(txObject, 'too early claimback allowed');
                } catch (err) {
                    assert.include(err.message, 'invalid opcode', 'no invalid OPCODE with too early claimback');
                }
            });

            it('should fail with too late claimback', async() => {
                await instance.setRemittance(puzzle, 0, 0, { value: 2 });

                try {
                    const txObject = await instance.withdrawal(owner, exchangePuzzle, receiverPuzzle);
                    assert.isUndefined(txObject, 'too late claimback allowed');
                } catch (err) {
                    assert.include(err.message, 'invalid opcode', 'no invalid opcode with too late claimback');
                }
            });
        });

        describe('success case', async() => {

            it('should allow withdrawal for exchange', async() => {
                await instance.setRemittance(puzzle, 1, 1, { value: 2 });

                const initialExchangeBalance = await web3.eth.getBalance(exchange);
                const txObject = await instance.withdrawal(
                    owner, exchangePuzzle.substr(2), receiverPuzzle.substr(2),
                    { from: exchange }
                );
                const remittance = await instance.getRemittance(puzzle);

                const exchangeBalance = await web3.eth.getBalance(exchange);
                const txFee = getTxFee(txObject);

                assert.isFalse(remittance[3], 'no falsy value for withdrawad remittance');
                assert.equal(
                    exchangeBalance.minus(2).plus(txFee).toString(10),
                    initialExchangeBalance.toString(10),
                    'exchange balance not correct'
                );
            });

            it('should allow withdrawal for sender', async() => {
                await instance.setRemittance(puzzle, 1, 1000, { value: 2 });
                const initialOwnerBalance = await web3.eth.getBalance(owner);
                const txObject = await instance.withdrawal(
                    owner, exchangePuzzle.substr(2), receiverPuzzle.substr(2),
                    { from: owner }
                );

                const ownerBalance = await web3.eth.getBalance(owner);
                const txFee = getTxFee(txObject);

                assert.equal(
                    ownerBalance.minus(2).plus(txFee).toString(10),
                    initialOwnerBalance.toString(10),
                    'exchange balance not correct'
                );

                const remittance = await instance.getRemittance(puzzle);
                assert.isFalse(remittance[3], 'no falsy value for withdrawad remittance');
            });
        });
    });
});

const getTxFee = txObject => {
    const gasUsed = txObject.receipt.gasUsed;
    const transaction = web3.eth.getTransaction(txObject.tx);
    const gasPrice = transaction.gasPrice;
    return gasPrice.times(gasUsed);
}