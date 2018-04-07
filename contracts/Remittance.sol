pragma solidity 0.4.21;

contract Remittance {
    
    address public owner;
    
    struct RemittanceData {
        uint256 amount;
        uint256 claimStart;
        uint256 claimEnd;
        bool toBeTransfered;

    }
    
    mapping(address => mapping(bytes32 => RemittanceData)) public remittancesByOwner;
    mapping(bytes32 => mapping(bytes32 => uint256)) public noncePerUser;
    
    modifier noToLowValue() {
        require(tx.gasprice * gasleft() < msg.value);
        _;
    }
    
    function Remittance() public{
        owner = msg.sender;
    }
    
    function setRemittance(
        bytes32 puzzle, 
        uint256 claimStart, 
        uint256 claimEnd
    ) 
        public
        payable
        noToLowValue
        returns (bool)
    {
        require(remittancesByOwner[msg.sender][puzzle].amount == 0);
        
        RemittanceData storage remittance = remittancesByOwner[msg.sender][puzzle];
        
        remittance.toBeTransfered = true;
        remittance.amount = msg.value;
        remittance.claimStart = block.timestamp + claimStart;
        remittance.claimEnd = block.timestamp + claimEnd;
        return true;
    }
    
    function Withdrawal(
        address sender, 
        bytes32 exchangePuzzle, 
        bytes32 receiverPuzzle
    ) 
        public
        returns (bool success) 
    {
        bytes32 puzzle = keccak256(exchangePuzzle, receiverPuzzle);
        
        if (sender == msg.sender) {
            assert(senderCanClaimback(puzzle));
        }
        
        if(remittancesByOwner[sender][puzzle].toBeTransfered) {
            uint256 amount = remittancesByOwner[sender][puzzle].amount;
            
            remittancesByOwner[sender][puzzle].amount = 0;
            remittancesByOwner[sender][puzzle].toBeTransfered = false;
            
            if(!msg.sender.send(amount)) {
                remittancesByOwner[sender][puzzle].toBeTransfered = true;
                remittancesByOwner[sender][puzzle].amount = amount;
                success = false;
            }
            success = true;
        }
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
        
        remittancesByOwner[msg.sender][newPuzzle] = remittance;
        remittance.toBeTransfered = false;
        return true;
    }
    
    function getOneTimeNonce(bytes32 psw, bytes32 user) public returns (uint256) {
        noncePerUser[psw][user] = now;
        return now;
    }
    
}