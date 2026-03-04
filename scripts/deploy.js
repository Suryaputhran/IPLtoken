const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. First, deploy a Mock Uniswap V2 Factory and Router since we are on a clean local EVM
    const MockFactory = await hre.ethers.getContractFactory("MockUniswapV2Factory");
    const mockFactory = await MockFactory.deploy(deployer.address);
    await mockFactory.deployed();

    const MockRouter = await hre.ethers.getContractFactory("MockUniswapV2Router02");
    const mockRouter = await MockRouter.deploy(mockFactory.address, deployer.address);
    await mockRouter.deployed();
    console.log("Mock Uniswap V2 environment deployed locally");

    // 2. Deploy 12M Token
    const Token = await hre.ethers.getContractFactory("TwelveMToken");
    const token = await Token.deploy(deployer.address, deployer.address, mockRouter.address);
    await token.deployed();
    console.log("-----------------------------------------");
    console.log("TwelveMToken deployed to:", token.address);

    // 2. Deploy PlayerCardMint NFT
    const NFT = await hre.ethers.getContractFactory("PlayerCardMint");
    // Arguments: PaymentToken address, Treasury Wallet, initial IPFS Base URI
    const nft = await NFT.deploy(token.address, deployer.address, "ipfs://QmPlaceholder/");
    await nft.deployed();
    console.log("PlayerCardMint (NFT) deployed to:", nft.address);

    // 3. Deploy CapOracle
    const Oracle = await hre.ethers.getContractFactory("CapOracle");
    const oracle = await Oracle.deploy();
    await oracle.deployed();
    console.log("CapOracle deployed to:", oracle.address);

    // 4. Deploy DividendVault
    const Vault = await hre.ethers.getContractFactory("DividendVault");
    // Arguments: PaymentToken address, NFT Contract, CapOracle, and Signer Wallet
    const vault = await Vault.deploy(token.address, nft.address, oracle.address, deployer.address);
    await vault.deployed();
    console.log("DividendVault deployed to:", vault.address);

    // 5. Initial Configurations
    console.log("\n--- Configuring Contracts ---");

    // Exclude Dividend Vault from trading fees so rewards can be distributed cleanly
    await token.setExcludedFromFee(vault.address, true);
    console.log("✅ DividendVault excluded from token fees");

    // Set the NFT contract address in the Vault so it can check balances
    await vault.setPlayerCardNFTContract(nft.address);
    console.log("✅ PlayerCardMint linked to DividendVault");

    console.log("\n🚀 All Systems Deployed and Go!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
