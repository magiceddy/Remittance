const Promise = require('bluebird');
const RemittanceManager = artifacts.require("./RemittanceManager.sol");
const Remittance = artifacts.require("./Remittance.sol");
const Bank = artifacts.require("./Bank.sol");
const TestUtils = require("../testUtils");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });
Promise.promisifyAll(web3.personal, { suffix: "Promise" });

let instance;

contract('Remittance', async accounts => {
    const recovery = accounts[5];
    const owner = accounts[0];
    const sender = accounts[1];
    const exchange = accounts[2];
    const claimStart = 1;
    const claimEnd = 10;
    const exchangePuzzle = web3.sha3('sender');
    const receiverPuzzle = web3.sha3('receiver');
    let bank;

    let puzzle;

    beforeEach(async () => {
        instance = await RemittanceManager.new(recovery, { from: owner });
        const bankAddress = await instance.bank();
        bank = Bank.at(bankAddress);
    });

    describe('constructor', () => {

        describe('fail case', () => {
            it('should fail with value in transaction', async() => {
                const txObject = await TestUtils.noValue(RemittanceManager.new(
                    recovery, {from: owner, value: 1 }
                ), 'constructor');
            });

            it('should fail with wrong address', async() => {
                try {
                    const txObject = await RemittanceManager.new(
                        0x0,
                        { from: owner }
                    );
                    assert.isUndefined(txObject, 'it accept invalid address');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });
        });

        describe('success case', () => {

            it('should create RemittanceManager', async() => {
                const recoveryAddress = await instance.recoveryAddress();
                assert.equal(recoveryAddress, recovery, 'wrong recoveryAddress');
            });
        });
    });

    describe('setRecoveryAddress', () => {

        describe('fail case', () => {

            it('should fail on zero address', async() => {
                try {
                    const txObject = await instance.setRecoveryAddress(
                        0x0,
                        { from: owner }
                    );
                    assert.isUndefined(txObject, 'zero address aalowed');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });

            it('should revert by non owner', async() => {
                try {
                    const txObject = await instance.setRecoveryAddress(
                        0x0,
                        { from: sender }
                    );
                    assert.isUndefined(txObject, 'zero address aalowed');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });

            it('should fail on no running', async() => {
                await instance.switchStop();

                try {
                    txObject = await instance.setRecoveryAddress(
                        sender,
                        { from : owner }
                    );
                    assert.isUndefined(txObject, 'no revert on no running');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });
        });

        describe('success case', () => {

            it('should change recovery address', async() => {
                const txObject = await instance.setRecoveryAddress(
                    sender,
                    { from : owner }
                );

                const recoveryAddress = await instance.recoveryAddress();
                assert.equal(recoveryAddress, sender, 'wrong recovery address');

                const { logs } = txObject;
                assert.equal(logs[0].event, 'LogRecoveryAddress');
                assert.equal(logs[0].args.recovery, sender);
            });
        });
    });

    describe('createRemittance', async() => {

        beforeEach(async() => {
            puzzle = await instance.getPuzzle(exchangePuzzle, receiverPuzzle);
        });

        describe('fail case', () => {

            it('should fail if value is less than threshold', async() => {
                try {
                    const txObject = await instance.createRemittance(
                        puzzle, claimStart, claimEnd, exchange, 10,
                        { from: sender, value: 9 }
                    );
                    assert.isUndefined(txObject, 'remittance with low value');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });
        });
    });

    describe('success case', () => {

        it('should create remittance', async() => {
            const txObject = await instance.createRemittance(
                puzzle, claimStart, claimEnd, exchange, 10,
                { from: sender, value: 20 }
            );

            const remittanceAddress = await instance.remittances(puzzle);
            assert.isDefined(remittanceAddress, 'remittance not defined');

            const remittance = Remittance.at(remittanceAddress);
            const remittanceSender = await remittance.sender();
            assert.equal(remittanceSender, sender, 'wrong sender');

            const remittanceClaimStart = await remittance.claimStart();
            assert.equal(remittanceClaimStart, claimStart, 'wrong claim start');

            const remittanceClaimEnd = await remittance.claimEnd();
            assert.equal(remittanceClaimEnd, claimEnd, 'wrong claim end');

            const remittanceExchange = await remittance.exchange();
            assert.equal(remittanceExchange, exchange, 'worng exchange');

            const bankAccount = await bank.accounts(puzzle);
            assert.equal(bankAccount, true, 'no bank account');

            const balance = await bank.balances(puzzle);
            assert.equal(balance, 20, 'wrong balance');
        });
    });

    describe('withdrawal', () => {

        beforeEach(async() => {
            puzzle = await instance.getPuzzle(exchangePuzzle, receiverPuzzle);
            await instance.createRemittance(
                puzzle, 1, 200, exchange, 10,
                { from: sender, value: 20 }
            );
        });

        describe('fail case', async() => {

            it('should fail with already claimBack', async() => {
                await instance.claimBack(puzzle, { from: sender });

                try {
                    const txObject = await instance.withdrawal(
                        exchangePuzzle, receiverPuzzle,
                        { from: exchange }
                    );
                    assert.isUndefined(txObject, 'withdrawal after claim back');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });

            it('should fail if remittance has been stopped', async() => {
                await instance.switchStop({ from: owner });

                try {
                    const txObject = await instance.withdrawal(
                        exchangePuzzle, receiverPuzzle,
                        { from: exchange }
                    );
                    assert.isUndefined(txObject, 'withdrawal after stop');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });

            it('should fail if sender is non the exchange', async() => {
                try {
                    const txObject = await instance.withdrawal(
                        exchangePuzzle, receiverPuzzle,
                        { from: accounts[6] }
                    );
                    assert.isUndefined(txObject, 'withdrawal from non exchange');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            });
        });

        describe('success case', () => {

            it('should withdrawal', async() => {
                const txObject = await instance.withdrawal(
                    exchangePuzzle, receiverPuzzle,
                    { from: exchange }
                );

                const remittanceAddress = await instance.remittances(puzzle);
                assert.equal(remittanceAddress, 0, 'invalid address');

                const bankAmount = await bank.balances(puzzle);
                assert.equal(bankAmount, 0, 'wrong balance');

                const bankAccount = await bank.accounts(puzzle);
                assert.equal(bankAccount, 0, 'wrong account');

                const remittanceInstance = await instance.remittances(puzzle);
                assert.equal(remittanceInstance, 0, 'wrong remittance');
            });
        });
    });

    describe('claimBack', () => {

        beforeEach(async() => {
            puzzle = await instance.getPuzzle(exchangePuzzle, receiverPuzzle);
            await instance.createRemittance(
                puzzle, 1, 200, exchange, 10,
                { from: sender, value: 20 }
            );
        });

        describe('fail case', () => {

            it('should fail with already withdrawal', async() => {
                await instance.withdrawal(
                    exchangePuzzle, receiverPuzzle,
                    { from: exchange }
                );

                try {
                    const txObject = await instance.claimBack(
                        puzzle,
                        { from: sender }
                    );
                    assert.isUndefined(txObject, 'claimback after withdrawal');
                } catch (err) {
                    assert.include(err.message, 'revert');
                }
            })
        });

        describe('success case', async() => {

            it('sender should claimback', async() => {
                const txObject = await instance.claimBack(
                    puzzle,
                    { from: sender }
                );

                const remittanceAddress = await instance.remittances(puzzle);
                assert.equal(remittanceAddress, 0, 'invalid address');

                const bankAmount = await bank.balances(puzzle);
                assert.equal(bankAmount, 0, 'wrong balance');

                const bankAccount = await bank.accounts(puzzle);
                assert.equal(bankAccount, 0, 'wrong account');

                const remittanceInstance = await instance.remittances(puzzle);
                assert.equal(remittanceInstance, 0, 'wrong remittance');

            });
        });
    });
});
