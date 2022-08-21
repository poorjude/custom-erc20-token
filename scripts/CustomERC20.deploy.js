const hre = require("hardhat");

async function main() {
    [acc1, acc2, acc3] = await hre.ethers.getSigners();

    const name_ = "PoorJudeToken";
    const symbol_ = "PJTKN";
    const maxSupply_ = 1_000_000;
    const amountToMint_ = 500;
    const intervalOfMint_ = 600;
    const additionalOwners_ = [acc2.address, acc3.address];

    const MyErc20 = await hre.ethers.getContractFactory("MyERC20MintOwnable");
    const myErc20 = await MyErc20.deploy(name_, symbol_, maxSupply_, amountToMint_, 
        intervalOfMint_, additionalOwners_);

    await myErc20.deployed();

    console.log("Address of deployed token:", myErc20.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});