pragma solidity 0.4.21;

import "./Ownable.sol";
import "./Remittance.sol";
import "./Bank.sol";

contract RemittanceManager is Ownable {

	address public recoveryAddress;
	address public banckAddress;
	bool public killed;
	bool public stop;
	Bank public bank;

	mapping(bytes32 => Remittance) public remittances;

	event LogNewRemittance(bytes32 puzzle, uint256 amount);
	event LogWithdrawal(bytes32 puzzle);
	event LogRecoveryAddress(address recovery);
	event LogKilled(address recovery, uint256 amount);
	event LogBankAddress(address bankAddress);

	modifier running() {
		require(!killed && !stop);
		_;
	}

	function RemittanceManager(address _recovery) public {
		require(_recovery != address(0x0));
		setRecoveryAddress(_recovery);
		bank = new Bank();
	}

	function setRecoveryAddress(address _recovery)
		public
		onlyOwner
		running
		returns (bool)
	{
		require(_recovery != address(0x0));

		recoveryAddress = _recovery;
		emit LogRecoveryAddress(recoveryAddress);
		return true;
	}

	function createRemittance(
		bytes32 _puzzle,
		uint256 _claimStart,
		uint256 _claimEnd,
		address _exchange,
		uint256 _threshold
	)
		public
		payable
		running
		returns (bool)
	{
		require(msg.value > _threshold);

		remittances[_puzzle] = new Remittance(
			msg.sender,
			_claimStart,
			_claimEnd,
			_exchange
		);

		bank.addAccount(_puzzle);
		bank.credit(_puzzle, msg.value);

		emit LogNewRemittance(_puzzle, msg.value);
		return true;
	}

	function withdrawal(bytes32 _exchangePuzzle, bytes32 _receiverPuzzle)
		public
		running
		returns (bool)
	{
		bytes32 checkPuzzle = keccak256(_exchangePuzzle, _receiverPuzzle);
		Remittance remittance = getRemittance(checkPuzzle);

		require(msg.sender == remittance.exchange());

		uint256 amount = bank.balanceOf(checkPuzzle);
		remittance.kill();
		bank.debit(checkPuzzle, amount);
		bank.deleteAccount(checkPuzzle);
		delete remittances[checkPuzzle];

		require(msg.sender.send(amount));

		emit LogWithdrawal(checkPuzzle);
		return true;
	}

	function claimBack(bytes32 _puzzle) public running returns (bool) {
		Remittance remittance = getRemittance(_puzzle);
		require(remittance.senderCanClaimback());
		require(msg.sender == remittance.sender());


		uint256 amount = bank.balanceOf(_puzzle);
		remittance.kill();
		bank.debit(_puzzle, amount);
		bank.deleteAccount(_puzzle);
		delete remittances[_puzzle];

		require(msg.sender.send(amount));

		emit LogWithdrawal(_puzzle);
		return true;
	}

	function getPuzzle(bytes32 _exchangePuzzle, bytes32 _receiverPuzzle)
		public
		pure
		returns (bytes32)
	{
		return keccak256(_exchangePuzzle, _receiverPuzzle);
	}

	function getRemittance(bytes32 _puzzle) public view returns (Remittance) {
		require(remittances[_puzzle] != address(0x0));
		return Remittance(remittances[_puzzle]);
	}

	function kill() public onlyOwner returns (bool) {
		killed = true;
        require(recoveryAddress.send(address(this).balance));
		emit LogKilled(recoveryAddress, address(this).balance);
		return true;
    }

	function switchStop()
		public
		onlyOwner
		returns (bool)
	{
		stop = !stop;
		return true;
	}

	function() public payable {
		revert();
	}
}
