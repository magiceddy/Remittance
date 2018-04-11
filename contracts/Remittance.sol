pragma solidity ^0.4.21;

contract Remittance {
    
    address public owner;
    uint256 public trashhold;
    
    struct RemittanceData {
        uint256 amount;
        uint256 claimStart;
        uint256 claimEnd;
        bool toBeTransfered;
    }
    
    mapping(address => mapping(bytes32 => RemittanceData)) public remittancesByOwner;
    mapping(address => mapping(bytes32 => uint256)) private noncePerUser;

    enum State { Run, Stop }
    State state;

    event LogNewRemittance(address indexed sender, uint256 amount, bytes32 puzzle);
    event LogWithdrawal(address indexed sender, address indexed exchange, bytes32 puzzle);
    event LogChangePuzzle(address indexed owner, bytes32 oldPuzzle, bytes32 newPuzzle);
    event LogNewNonce(address indexed sender, bytes32 user, uint256 nonce);
    event LogTreshhold(uint256 trashhold);
    
    modifier noToLowValue() {
        require(trashhold != 0x00);
        require(msg.value > trashhold);
        _;
    }

    modifier running() {
        require(state == State.Run);
        _;
    }
    
    function Remittance() public{
        owner = msg.sender;
        state = State.Run;
    }
    
    function setRemittance(
        bytes32 puzzle, 
        uint256 claimStart, 
        uint256 claimEnd
    ) 
        public
        payable
        running()
        noToLowValue()
        returns (bool)
    {
        require(remittancesByOwner[msg.sender][puzzle].amount == 0);
        
        RemittanceData storage remittance = remittancesByOwner[msg.sender][puzzle];
        remittance.toBeTransfered = true;
        remittance.amount = msg.value;
        remittance.claimStart = block.number + claimStart;
        remittance.claimEnd = block.number + claimEnd;

        emit LogNewRemittance(msg.sender, msg.value, puzzle);
        return true;
    }
    
    function withdrawal(
        address sender, 
        bytes32 exchangePuzzle, 
        bytes32 receiverPuzzle
    ) 
        public
        running()
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

            emit LogWithdrawal(sender, msg.sender, puzzle);
            return true;
        }
        return false;
    }
    
    function senderCanClaimback(bytes32 puzzle) public view returns (bool) {
        uint256 claimStart = remittancesByOwner[msg.sender][puzzle].claimStart;
        uint256 claimEnd = remittancesByOwner[msg.sender][puzzle].claimEnd;
        return block.number <= claimEnd && block.number >= claimStart;
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

        emit LogChangePuzzle(msg.sender, oldPuzzle, newPuzzle);
        return true;
    }
    
    // in production external oracle
    function getOneTimeNonce(bytes32 user) public returns (uint256) {
        noncePerUser[msg.sender][user] = block.number;
        
        emit LogNewNonce(msg.sender, user, noncePerUser[msg.sender][user]);
        return block.number;
    }

    function setTrashhold(uint256 newTrashhold)
        public 
        returns (bool) 
    {
        require(msg.sender == owner);
        require(newTrashhold != trashhold);

        trashhold = newTrashhold;
        emit LogTreshhold(newTrashhold);
    }

    function getRemittance(bytes32 puzzle) 
        public 
        view 
        returns(
            uint256 amount,
            uint256 claimStart,
            uint256 claimEnd,
            bool toBeTransfered
        ) 
    {
        RemittanceData memory r = remittancesByOwner[msg.sender][puzzle];
        return(r.amount, r.claimStart, r.claimEnd, r.toBeTransfered);
    }

    function() public {}

    function kill() public {
        require(msg.sender == owner);
        state = State.Stop;
    }  
}