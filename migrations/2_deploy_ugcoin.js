const UGCoin = artifacts.require(`./UGCoin.sol`);

module.exports = (deployer) => {
	deployer.deploy(UGCoin);
}