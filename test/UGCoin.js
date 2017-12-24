var UGCoin = artifacts.require("UGCoin");

const TOTAL_SUPPLY = 1000000000;
contract('UGCoin', function(accounts){

	it("totalSupply should be 10**9 * 10**18",function(){
		return UGCoin.deployed().then(function(instance){
			return instance.totalSupply.call();
		}).then(function(balance){
			assert.equal(fromWei(balance),TOTAL_SUPPLY," totalSupply error");
		});
	});

	it("founder balance should be 10**9 * 10**18", function(){
		return UGCoin.deployed().then(function(instance){
			return instance.balanceOf.call(accounts[0]);
		}).then(function(balance){
			assert.equal( fromWei(balance),TOTAL_SUPPLY,"founder account balance error");
		});
	});

	it("freeze require must be correctly",function(){
		var ugCoin;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			//return ugCoin.freeze(toWei(TOTAL_SUPPLY + 1));
		}).then(function(res){
			console.log(res);
		});
	});

	it("field must be correctly", function(){
		var ugCoin;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.name();
		}).then(function(res){
			console.log(res)
			assert.equal("UG Coin",res,"");
			return ugCoin.decimals.call();
		}).then(function(res){
			assert.equal(res,18,"");
			return ugCoin.symbol.call();
		}).then(function(res){
			assert.equal(res,"UGC","");
			return ugCoin.version.call();
		}).then(function(res){
			assert.equal(res,"v0.1","");
		})
	});

	it("destroy must be correctly", function(){
		var ugCoin;
		var amount = 20;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.destroy(toWei(amount),{from:accounts[0]});
		}).then(function(res){
			return ugCoin.totalSupply.call();
		}).then(function(balance){
			assert.equal(fromWei(balance),TOTAL_SUPPLY - amount,"destroy error");
		});
	});

	it("about coinPool test",function(){
		var ugCoin;
		var amount = 10;
		var acc = accounts[0];
		var acc2 = accounts[1];
		var startBalance;
		var gcoinPool;
		var gbalance;
		var gownersLoan;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.coinPool.call();
		}).then(function(balance){
			assert.equal(balance.toNumber(),0,"coinPool error");
			return ugCoin.balanceOf.call(acc);
		}).then(function(balance){
			startBalance = fromWei(balance);
			return ugCoin.freeze(toWei(amount));
		}).then(function(res){
			//var operation;
			var args;
			for (var i = 0; i < res.logs.length; i++) {
				var log = res.logs[i];
				if(log.event === "Freeze"){
					args = log.args;
				}
			};
			assert.equal(args.from,acc,"from must be acc");
			assert.equal(fromWei(args.value),amount,"value must be amount");
			return ugCoin.coinPool.call();
		}).then(function(balance){
			gcoinPool = fromWei(balance);
			assert.equal(fromWei(balance),amount,"coinPool amount not equal $amount");
			return ugCoin.balanceOf.call(acc);
		}).then(function(balance){
			
			assert.equal(fromWei(balance),startBalance - amount,"freeze balance error");
			return ugCoin.defreeze(acc2,toWei(amount));
		}).then(function(res){
			var args;
			for (var i = 0; i < res.logs.length; i++) {
				var log = res.logs[i];
				if(log.event === "Defreeze"){
					args = log.args;
				}
			};
			assert.equal(args.ownerAddr,acc,"");
			assert.equal(args.userAddr,acc2,"");
			assert.equal(fromWei(args.amount),amount,"");
			return ugCoin.balanceOf.call(acc2);
		}).then(function(balance){
			assert.equal(fromWei(balance),amount,"must be equal " + amount);
			return ugCoin.balanceOf.call(acc);
		}).then(function(balance){
			gbalance = fromWei(balance);
			return ugCoin.getOwnersLoan(acc);
		}).then(function(balance){
			gownersLoan = fromWei(balance);
			assert.equal(fromWei(balance),amount,"");
			return ugCoin.returnToOwner(acc,toWei(amount/2));
		}).then(function(res){
			var args;
			for (var i = 0; i < res.logs.length; i++) {
				var log = res.logs[i];
				if(log.event === "ReturnToOwner"){
					args = log.args;
				}
			};
			assert.equal(args.ownerAddr,acc,"");
			assert.equal(fromWei(args.amount),amount/2,"");
			return ugCoin.coinPool.call();
		}).then(function(balance){
			assert.equal(fromWei(balance),gcoinPool - amount/2,"");
			return ugCoin.balanceOf.call(acc);
		}).then(function(balance){
			assert.equal(fromWei(balance),gbalance+amount/2,"");
			return ugCoin.getOwnersLoan(acc);
		}).then(function(balance){
			assert.equal(fromWei(balance),gownersLoan - amount/2,"");
		});


	})

	it("should send coin correctly", function(){
		var ugCoin;
		var account_one = accounts[0];
	    var account_two = accounts[1];

	    var account_one_starting_balance;
	    var account_two_starting_balance;
	    var account_one_ending_balance;
	    var account_two_ending_balance;

	    var amount = 10;
	    return UGCoin.deployed().then(function(instance){
	    	ugCoin = instance;
			return instance.balanceOf.call(account_one);
		}).then(function(balance){
			account_one_starting_balance = fromWei(balance);
			return ugCoin.balanceOf.call(account_two);
		}).then(function(balance){
			account_two_starting_balance = fromWei(balance);
			return ugCoin.transfer(account_two, toWei(amount), {from: account_one});
		}).then(function(){
			return ugCoin.balanceOf.call(account_one);
		}).then(function(balance){
			account_one_ending_balance = fromWei(balance);
			return ugCoin.balanceOf.call(account_two);
		}).then(function(balance){
			account_two_ending_balance = fromWei(balance);
			assert.equal(account_one_ending_balance, account_one_starting_balance - amount," Amount wasn't correctly , sender" );
			assert.equal(account_two_ending_balance, account_two_starting_balance + amount," Amount wasn't correctly , receiver ");
		});
	})	
});

contract("UGCoin",function(accounts){
	it("about returnToOwner", function(){
		var ugCoin;
		var amount = 100;
		var freezeAmount = 60;
		var defreezeAmount = 20;
		var returnToOwnerAmount = 15;
		var acc = accounts[0];
		var acc2 = accounts[1];
		var acc3 = accounts[2];

		var user1 = accounts[3];
		var user2 = accounts[4];

		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return Promise.all([
				ugCoin.addOwner(acc2),
				ugCoin.addOwner(acc3)
				])
		}).then(function(){
			return ugCoin.changeRequirement(2);
		}).then(function(){
			return Promise.all([
				ugCoin.transfer(acc2,toWei(amount)),
				ugCoin.transfer(acc3,toWei(amount)),
				ugCoin.transfer(user1,toWei(amount))
				])
		}).then(function(){
			return ugCoin.freeze(toWei(freezeAmount),{from:user1});
		}).then(function(){
			return ugCoin.defreeze(user2,toWei(defreezeAmount),{from:acc2});
		}).then(function(){
			return ugCoin.getOwnersLoan.call(acc2);
		}).then(function(res){
			assert.equal(fromWei(res),defreezeAmount,"");
			return Promise.all([
				ugCoin.returnToOwner(acc2, toWei(returnToOwnerAmount),{from:acc}),
				ugCoin.returnToOwner(acc2, toWei(returnToOwnerAmount),{from:acc3})
				])
		}).then(function(){
			return ugCoin.getOwnersLoan.call(acc2);
		}).then(function(res){
			assert.equal(fromWei(res),defreezeAmount - returnToOwnerAmount,"");
		})
	});
});

//addOwner removeOwner when required = 1
contract("UGCoin",function(accounts){
	it("about addOwner ", function(){
		var ugCoin;
		var newOwner = accounts[1];
		
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_numOwners error");
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_required error");
			return ugCoin.addOwner(newOwner);
		}).then(function(){
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),2,"new numbers error");
			return ugCoin.removeOwner(newOwner);
		}).then(function(){
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_numOwners error");
		});
	});
});

//addOwner removeOwner isOwner when required = 3
contract("UGCoin",function(accounts){
	var initOwner = accounts[0];
	var oneOwner = accounts[1];
	var twoOwner = accounts[2];
	var thrOwner = accounts[3];

	it("addOwner removeOwner isOwner when required = 3", function(){
		var ugCoin;
		var gop;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_numOwners error");
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_required error");

			return Promise.all([
				ugCoin.addOwner(oneOwner),
				ugCoin.addOwner(twoOwner)
				]);
		}).then(function(){
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),3,"m_numOwners error");
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_required error");
			return ugCoin.changeRequirement(2);
		}).then(function(){
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res.toNumber(),2,"m_required error");
			return Promise.all([
				ugCoin.addOwner(thrOwner,{from:initOwner}),
				ugCoin.addOwner(thrOwner,{from:twoOwner})
				]);
		}).then(function(){
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res,4," m_numOwners error");
			return ugCoin.isOwner.call(thrOwner);
		}).then(function(res){
			assert.equal(res,true," must be owner");
			return Promise.all([
				ugCoin.removeOwner(initOwner,{from:oneOwner}),
				ugCoin.removeOwner(initOwner,{from:thrOwner})
				])
		}).then(function(){
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res,3," must be 3");
			return ugCoin.isOwner.call(initOwner);
		}).then(function(res){
			assert.equal(res,false," initOwner has be removed");
			return ugCoin.changeRequirement(1,{from:oneOwner});
		}).then(function(res){
			return getOperstion(res);
		})
		.then(function(operation){
			gop = operation;
			return ugCoin.hasConfirmed.call(operation, oneOwner);
		}).then(function(res){
			assert.equal(res,true,"must be true");
			return ugCoin.revoke(gop,{from:oneOwner});
		}).then(function(res){
			var operation;
			for (var i = 0; i < res.logs.length; i++) {
				var log = res.logs[i];
				if(log.event === "Revoke"){
					operation = log.args.operation;
				}
			};
			assert.equal(gop, operation,"operation must be equal");
			return ugCoin.hasConfirmed.call(operation, oneOwner);
		}).then(function(res){
			assert.equal(res,false,"must be false");
		})
	})
});


//changeOwner 
contract("UGCoin",function(accounts){
	var newOwner = accounts[1];
	var initOwner = accounts[0];
	it("about changeOwner", function(){ 
		var ugCoin;
		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.changeOwner(initOwner, newOwner);
		}).then(function(){
			return ugCoin.isOwner.call(initOwner);
		}).then(function(res){
			assert.equal(res,false,"");
			return ugCoin.isOwner.call(newOwner);
		}).then(function(res){
			assert.equal(res,true,"");
		})
	});
})

//hasConfirmed 
contract("UGCoin",function(accounts){
	var newOwner = accounts[1];
	var initOwner = accounts[0];
	it("about hasConfirmed", function(){ 
		var ugCoin;

		return UGCoin.deployed().then(function(instance){
			ugCoin = instance;
			return ugCoin.m_numOwners.call();
		}).then(function(res){
			assert.equal(res.toNumber(),1,"m_numOwners must be 1");
			return ugCoin.addOwner(newOwner,{from:initOwner});
		}).then(function(res){
			var operation;
			for (var i = 0; i < res.logs.length; i++) {
				var log = res.logs[i];
				if(log.event === "OwnerAdded"){
					operation = log.args.operation;
				}
			};
			return Promise.resolve(operation);
		}).then(function(operation){
			return ugCoin.hasConfirmed.call(operation, initOwner);
		}).then(function(res){
			assert.equal(res,false,"hasConfirmed error");
			return ugCoin.changeRequirement(2,{from: newOwner});
		}).then(function(res){
			return ugCoin.m_required.call()
		}).then(function(res){
			assert.equal(res.toNumber(),2," m_required must be 2");
			return ugCoin.changeRequirement(1,{from: initOwner});
		}).then(function(res){
			return getOperstion(res);
		}).then(function(operation){
			return ugCoin.hasConfirmed.call(operation, initOwner);
		}).then(function(res){
			assert.equal(res,true,"hasConfirmed error");
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res.toNumber(),2," m_required must be 2");
			return ugCoin.changeRequirement(1,{from: newOwner});
		}).then(function(res){
			return getOperstion(res);
		}).then(function(operation){
			return ugCoin.hasConfirmed.call(operation,newOwner);
		}).then(function(res){
			assert.equal(res,false," has clear pendding");
			return ugCoin.m_required.call();
		}).then(function(res){
			assert.equal(res,1," changeRequirement to 1 has done");
		});

	});
})

function getOperstion(res){
	var operation;
	for (var i = 0; i < res.logs.length; i++) {
		var log = res.logs[i];
		if(log.event === "Operation"){
			operation = log.args.operation;
		}
	};
	return Promise.resolve(operation);
}

function fromWei(val){
	return web3.fromWei(val,"ether").toNumber();
}

function toWei(val){
	return web3.toWei(val,"ether");
}
