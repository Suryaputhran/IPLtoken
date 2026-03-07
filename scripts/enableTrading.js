const hre = require("hardhat");

async function main() {
    const contractAddress = "0xDA0B1Aff813f88b57B89f7ae1a6c707912Eae5a7";
    const TwelveMToken = await hre.ethers.getContractFactory("TwelveMToken");
    const token = TwelveMToken.attach(contractAddress);

    console.log("Checking trading status on TwelveMToken at:", contractAddress);

    const isActive = await token.tradingActive();
    console.log("Trading active before tx:", isActive);

    if (!isActive) {
        console.log("Enabling trading...");
        const tx = await token.enableTrading();
        console.log("Tx hash:", tx.hash);
        await tx.wait();
        console.log("Trading successfully enabled!");
    } else {
        console.log("Trading was already active.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
