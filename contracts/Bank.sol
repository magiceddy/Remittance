pragma solidity 0.4.21;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./IBank.sol";

contract Bank is IBank, Ownable {

	using SafeMath for uint256;

	mapping(bytes32 => uint256) public balances;
	mapping(bytes32 => bool) public accounts;

	event LogCredit(bytes32 indexed account, uint256 balance);
	event LogDebit(bytes32 indexed account, uint256 balance);
	event LogNewAccount(bytes32 indexed account);
	event LogDeleteAccount(bytes32 indexed account);

	modifier isAccount(bytes32 account) {
		require(accounts[account]);
		_;
	}

	function addAccount(bytes32 account)
		public
		onlyOwner
		returns (bool)
	{
		require(!accounts[account]);

		accounts[account] = true;
		emit LogNewAccount(account);
		return true;
	}

	function deleteAccount(bytes32 account)
		public
		onlyOwner
		isAccount(account)
		returns (bool)
	{
		require(balances[account] == 0);

		delete balances[account];
		delete accounts[account];
		emit LogDeleteAccount(account);
		return true;
	}

	function credit(bytes32 account, uint256 amount)
		public
		onlyOwner
		isAccount(account)
		returns (bool)
	{
		require(amount > 0);

		balances[account] = balances[account].add(amount);
		emit LogCredit(account, balances[account]);
		return true;
	}

	function debit(bytes32 account, uint256 amount)
		public
		onlyOwner
		isAccount(account)
		returns (bool)
	{
		require(balances[account] >= amount);

		balances[account] = balances[account].sub(amount);
		emit LogDebit(account, balances[account]);
		return true;
	}

	function balanceOf(bytes32 account)
	    public
        view
        isAccount(account)
        returns (uint256)
    {
        return balances[account];
    }
}
