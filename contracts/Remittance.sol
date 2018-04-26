pragma solidity ^0.4.21;

import "./Ownable.sol";

contract Remittance is Ownable {

    address public sender;
    uint256 public claimStart;
    uint256 public claimEnd;
    address public exchange;

    event LogRemittance(
        address indexed sender,
        uint256 claimStart,
        uint256 claimEnd,
        address exchange
    );

    function Remittance(
        address _sender,
        uint256 _claimStart,
        uint256 _claimEnd,
        address _exchange
    )
        public
    {
        require(_sender != address(0x0));
        require(claimStart <= claimEnd);
        require(_exchange != address(0x0));

        sender = _sender;
        claimStart = _claimStart;
        claimEnd = _claimEnd;
        exchange = _exchange;

        emit LogRemittance(
            sender,
            claimStart,
            claimEnd,
            exchange
        );
    }

    function senderCanClaimback()
        public
        view
        returns (bool)
    {
        return block.number <= claimEnd && block.number >= claimStart;
    }

    function kill() public onlyOwner returns (bool) {
        selfdestruct(msg.sender);
        return true;
    }

    function() public payable {
        revert();
    }
}
