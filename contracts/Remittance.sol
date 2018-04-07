pragma solidity ^0.4.21;

contract Remittance {
    
    address public owner;
    
    struct RemittanceData {
        uint256 amount;
        uint256 claimStart;
        uint256 claimEnd;
        bool toBeTransfered;

    }
    
    mapping(address => mapping(bytes32 => RemittanceData)) public remittancesByOwner;
    mapping(address => mapping(bytes32 => uint256)) public noncePerUser;
    
    modifier noToLowValue(uint128 trashhold) {
        require(msg.value > trashhold);
        _;
    }
    
    function Remittance() public{
        owner = msg.sender;
    }
    
    function setRemittance(
        bytes32 puzzle, 
        uint256 claimStart, 
        uint256 claimEnd,
        uint128 trashhold
    ) 
        public
        payable
        noToLowValue(trashhold)
        returns (bool)
    {
        require(remittancesByOwner[msg.sender][puzzle].amount == 0);
        
        RemittanceData storage remittance = remittancesByOwner[msg.sender][puzzle];
        
        remittance.toBeTransfered = true;
        remittance.amount = msg.value;
        remittance.claimStart = now + claimStart;
        remittance.claimEnd = now + claimEnd;
        return true;
    }
    
    function Withdrawal(
        address sender, 
        bytes32 exchangePuzzle, 
        bytes32 receiverPuzzle
    ) 
        public
        returns (bool) 
    {
        bytes32 puzzle = keccak256(exchangePuzzle, receiverPuzzle);
        
        if (sender == msg.sender) {
            assert(senderCanClaimback(puzzle));
        }
        
        if(remittancesByOwner[sender][puzzle].toBeTransfered) {
            uint256 amount = remittancesByOwner[sender][puzzle].amount;
            
            remittancesByOwner[sender][puzzle].amount = 0;
            remittancesByOwner[sender][puzzle].toBeTransfered = false;
            msg.sender.transfer(amount);
        }
        return true;
    }
    

    function senderCanClaimback(bytes32 puzzle) public view returns (bool) {
        uint256 claimStart = remittancesByOwner[msg.sender][puzzle].claimStart;
        uint256 claimEnd = remittancesByOwner[msg.sender][puzzle].claimEnd;
        return now <= claimEnd && now >= claimStart;
    }
    
    function changePuzzle(bytes32 oldPuzzle, bytes32 newPuzzle) 
        public 
        returns (bool) 
    {
        RemittanceData storage remittance = remittancesByOwner[msg.sender][oldPuzzle];
        
        assert(remittance.toBeTransfered);
        
        remittance.toBeTransfered = false;
        remittancesByOwner[msg.sender][newPuzzle] = remittance;
        remittancesByOwner[msg.sender][newPuzzle].toBeTransfered = true;
        return true;
    }
    
    // user keccak256(msg.sender + email/phone)
    function getOneTimeNonce(bytes32 user) public returns (uint256) {
        noncePerUser[msg.sender][user] = now;
        return now;
    }
    
}