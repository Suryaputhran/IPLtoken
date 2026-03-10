const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0xDA0B1Aff813f88b57B89f7ae1a6c707912Eae5a7";
    const PINKSALE_ADDRESS = "0x3d7f375cc3FaAEFa5548f8aCD89a76c347c8bdCF";

    const TwelveMToken = await hre.ethers.getContractFactory("TwelveMToken");
    const token = await TwelveMToken.attach(CONTRACT_ADDRESS);

    console.log(`Setting fee exclusion for PinkSale address: ${PINKSALE_ADDRESS}`);

    // Check if already excluded
    const isExcluded = await token.isExcludedFromFee(PINKSALE_ADDRESS);
    if (!isExcluded) {
        const tx = await token.setExcludedFromFee(PINKSALE_ADDRESS, true);
        console.log("Transaction sent! Hash:", tx.hash);
        await tx.wait();
        console.log("Successfully excluded PinkSale address from 5% tax!");
    } else {
        console.log("PinkSale address is already excluded from fees.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
