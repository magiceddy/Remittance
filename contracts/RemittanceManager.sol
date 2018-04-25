pragma solidity 0.4.21;

import "./Ownable.sol";
import "./Remittance.sol";
import "./Bank.sol";

contract RemittanceManager is Ownable, Bank {

	uint256 threshold;
	address recoveryAddress;

	mapping(bytes32 => Remittance) public remittances;

	event LogNewRemittance(bytes32 puzzle);
	event LogWithdrawal(bytes32 puzzle);
	event LogChangePuzzle(bytes32 oldPuzzle, bytes32 newPuzzle);
	event LogSetTreshold(uint256 threshold);
	event LogRecoveryAddress(address recovery);
	event LogKilled(address recovery, uint256 amount);

	function RemittanceManager(address _recovery) public {
		require(_recovery != address(0x0));
		setRecoveryAddress(_recovery);
	}

	function setRecoveryAddress(address _recovery)
		public
		onlyOwner
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
		address _exchange
	)
		public
		payable
		returns (bool)
	{
		require(msg.value > threshold);
		remittances[_puzzle] = new Remittance(
			msg.sender,
			_claimStart,
			_claimEnd,
			_exchange
		);

		addAccount(_puzzle);
		credit(_puzzle, msg.value);

		emit LogNewRemittance(_puzzle);
		return true;
	}

	function withdrawal(bytes32 _exchangePuzzle, bytes32 _receiverPuzzle)
		public
		returns (bool)
	{
		bytes32 checkPuzzle = keccak256(_exchangePuzzle, _receiverPuzzle);
		Remittance remittance = getRemittance(checkPuzzle);

		require(uint(remittance.state()) == 0);
		require(msg.sender == remittance.exchange());

		uint256 amount = getAmount(checkPuzzle);
		remittance.setWithdrawalState();
		deleteAccount(checkPuzzle);
		delete remittances[checkPuzzle];

		require(msg.sender.send(amount));

		emit LogWithdrawal(checkPuzzle);
		return true;
	}

	function claimBack(bytes32 _puzzle) public returns (bool) {
		Remittance remittance = getRemittance(_puzzle);
		require(msg.sender == remittance.sender());

		if(remittance.senderCanClaimback()) {
			uint256 amount = getAmount(_puzzle);
			remittance.setWithdrawalState();
			deleteAccount(_puzzle);
			delete remittances[_puzzle];

			require(msg.sender.send(amount));

			emit LogWithdrawal(_puzzle);
		}
		return true;
	}

	function transfer(bytes32 _puzzle, address _beneficiary)
		private
		onlyOwner
		returns (bool)
	{
		Remittance remittance = getRemittance(_puzzle);

		uint256 amount = getAmount(_puzzle);
		remittance.setWithdrawalState();
		deleteAccount(_puzzle);
		delete remittances[_puzzle];

		require(_beneficiary.send(amount));

		emit LogWithdrawal(_puzzle);
		return true;
	}

	function getRemittance(bytes32 _puzzle) public view returns (Remittance) {
		require(remittances[_puzzle] != address(0x0));
		return Remittance(remittances[_puzzle]);
	}

	function setThreshold(uint256 _threshold) public onlyOwner returns (bool) {
		require(_threshold > 0);

		threshold = _threshold;
		emit LogSetTreshold(_threshold);
		return true;
	}

	function kill() public onlyOwner returns (bool) {
        emit LogKilled(recoveryAddress, address(this).balance);
        selfdestruct(recoveryAddress);
    }

	function() public payable {
		revert();
	}
}
