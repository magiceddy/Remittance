pragma solidity 0.4.21;

contract IBank {
	function addAccount(bytes32 account) public returns (bool);
	function deleteAccount(bytes32 account) public returns (bool);
	function credit(bytes32 account, uint256 amount) public returns (bool);
	function debit(bytes32 account, uint256 amount) public returns (bool);
	function balanceOf(bytes32 account) public view  returns (uint256);
	event LogCredit(bytes32 indexed account, uint256 balance);
	event LogDebit(bytes32 indexed account, uint256 balance);
	event LogNewAccount(bytes32 indexed account);
	event LogDeleteAccount(bytes32 indexed account);
}
