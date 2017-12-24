pragma solidity ^0.4.8;

import "./StandardToken.sol";
import "./Multiowned.sol";

contract UGCoin is Multiowned, StandardToken {

    event Freeze(address from, uint value);
    event Defreeze(address ownerAddr, address userAddr, uint256 amount);
    event ReturnToOwner(address ownerAddr, uint amount);
    event Destroy(address from, uint value);

    function UGCoin() public Multiowned(){
        balances[msg.sender] = initialAmount;   // Give the creator all initial balances is defined in StandardToken.sol
        totalSupply = initialAmount;              // Update total supply, totalSupply is defined in Tocken.sol
    }

    function() public {

    }
    
    /* transfer UGC to DAS */
    function freeze(uint256 _amount) external returns (bool success){
        require(balances[msg.sender] >= _amount);
        coinPool += _amount;
        balances[msg.sender] -= _amount;
        Freeze(msg.sender, _amount);
        return true;
    }

    /* transfer UGC from DAS */
    function defreeze(address _userAddr, uint256 _amount) onlyOwner external returns (bool success){
        require(balances[msg.sender] >= _amount); //msg.sender is a owner
        require(coinPool >= _amount);
        balances[_userAddr] += _amount;
        balances[msg.sender] -= _amount;
        ownersLoan[msg.sender] += _amount;
        Defreeze(msg.sender, _userAddr, _amount);
        return true;
    }

    function returnToOwner(address _ownerAddr, uint256 _amount) onlyManyOwners(keccak256(msg.data)) external returns (bool success){
        require(coinPool >= _amount);
        require(isOwner(_ownerAddr));
        require(ownersLoan[_ownerAddr] >= _amount);
        balances[_ownerAddr] += _amount;
        coinPool -= _amount;
        ownersLoan[_ownerAddr] -= _amount;
        ReturnToOwner(_ownerAddr, _amount);
        return true;
    }
    
    function destroy(uint256 _amount) external returns (bool success){
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] -= _amount;
        totalSupply -= _amount;
        Destroy(msg.sender, _amount);
        return true;
    }

    function getOwnersLoan(address _ownerAddr) view public returns (uint256){
        return ownersLoan[_ownerAddr];
    }

    /* Approves and then calls the receiving contract */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);

        //call the receiveApproval function on the contract you want to be notified. 
        //This crafts the function signature manually so one doesn't have to include a contract in here just for this.
        //receiveApproval(address _from, uint256 _value, address _tokenContract, bytes _extraData)
        //it is assumed when one does this that the call *should* succeed, otherwise one would use vanilla approve instead.
        require(_spender.call(bytes4(bytes32(keccak256("receiveApproval(address,uint256,address,bytes)"))), msg.sender, _value, this, _extraData));
        return true;
    }

    string public name = "UG Coin";
    uint8 public decimals = 18;
    string public symbol = "UGC";
    string public version = "v0.1";
    uint256 public initialAmount = (10 ** 9) * (10 ** 18);
    uint256 public coinPool = 0;      // coinPool is a pool for freezing UGC
    mapping (address => uint256) ownersLoan;      // record the amount of UGC paid by oweners for freezing UGC

}
