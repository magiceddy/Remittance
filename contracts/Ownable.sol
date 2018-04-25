pragma solidity 0.4.21;

contract Ownable {

	address public owner;

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	function Ownable() public {
		owner = msg.sender;
	}

	function changeOwner(address newOwner) public onlyOwner returns (bool) {
		owner = newOwner;
		return true;
	}

	function() public payable {
		revert();
	}
}
