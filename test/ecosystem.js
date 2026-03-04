const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("12M Token Ecosystem - Full Integration Test", function () {
    let Token, token;
    let NFT, nft;
    let Oracle, oracle;
    let Vault, vault;
    let deployer, addr1, addr2, treasury, marketing;
    let standardMintPrice;

    before(async function () {
        [deployer, addr1, addr2, treasury, marketing] = await ethers.getSigners();

        // 1. Deploy Mock Uniswap Environment
        const MockFactory = await ethers.getContractFactory("MockUniswapV2Factory");
        const mockFactory = await MockFactory.deploy(deployer.address);
        await mockFactory.deployed();

        const MockRouter = await ethers.getContractFactory("MockUniswapV2Router02");
        const mockRouter = await MockRouter.deploy(mockFactory.address, deployer.address);
        await mockRouter.deployed();

        // 2. Deploy 12M Token
        Token = await ethers.getContractFactory("TwelveMToken");
        token = await Token.deploy(treasury.address, marketing.address, mockRouter.address);
        await token.deployed();

        // 3. Deploy PlayerCardMint NFT
        standardMintPrice = ethers.utils.parseUnits("50000", 18);
        NFT = await ethers.getContractFactory("PlayerCardMint");
        nft = await NFT.deploy(token.address, treasury.address, "ipfs://QmPlaceholder/");
        await nft.deployed();

        // 4. Deploy CapOracle
        Oracle = await ethers.getContractFactory("CapOracle");
        oracle = await Oracle.deploy();
        await oracle.deployed();

        // 5. Deploy DividendVault
        Vault = await ethers.getContractFactory("DividendVault");
        vault = await Vault.deploy(token.address, nft.address, oracle.address, deployer.address);
        await vault.deployed();

        // Initial Config
        await token.enableTrading(); // Turn on trading
        await token.setExcludedFromFee(vault.address, true); // Exclude vault from tax
        await nft.flipMintingState(); // Enable NFT minting
    });

    it("Should successfully buy 12M tokens, approve, and mint a Player Card", async function () {
        // 1. Give User Tokens
        const transferAmount = ethers.utils.parseUnits("100000", 18);
        await token.transfer(addr1.address, transferAmount);

        // 2. User Approves NFT contract
        await token.connect(addr1).approve(nft.address, standardMintPrice);

        // 3. User Mints Player ID #1 (e.g., MS Dhoni)
        await nft.connect(addr1).mintCard(1, 1); // Player ID 1, Amount 1

        // Check NFT Balance
        const nftBalance = await nft.balanceOf(addr1.address, 1);
        expect(nftBalance).to.equal(1);

        console.log("   ✅ User successfully purchased & minted 1 Player Card");
    });

    it("Should allow the Oracle to trigger a match payout which the Vault automatically airdrops to the holder", async function () {
        // 1. Load the Treasury Vault with 12M tokens to simulate protocol yield
        const vaultFunding = ethers.utils.parseUnits("500000", 18);
        await token.transfer(vault.address, vaultFunding);

        const initialUserBalance = await token.balanceOf(addr1.address);

        // 2. Oracle backend Triggers Match Payout for Player 1 (Dhoni hit a six!)
        const basePayout = ethers.utils.parseUnits("5000", 18); // 5k tokens per card

        // addr1 holds a Dhoni card, so addr1's wallet is sent to the Vault
        await vault.triggerMatchYield([addr1.address], 1, basePayout);

        // 3. Check User's new balance (Should be Initial + 5000)
        const finalUserBalance = await token.balanceOf(addr1.address);
        expect(finalUserBalance.sub(initialUserBalance)).to.equal(basePayout);

        console.log("   ✅ Dividend Vault successfully mass-airdropped 5,000 $12M tokens automatically!");
    });

    it("Should automatically apply a 2x Multiplier if the Oracle flags the player holding the Orange/Purple Cap", async function () {
        const initialUserBalance = await token.balanceOf(addr1.address);
        const basePayout = ethers.utils.parseUnits("5000", 18);

        // 1. Oracle updates that Player 1 now has the Orange Cap
        await oracle.updateCapHolders(1, 0);

        // 2. Oracle triggers another match payout
        await vault.triggerMatchYield([addr1.address], 1, basePayout);

        // 3. Check User's new balance. Because Orange Cap is true, payout should be 2x basePayout (10,000 tokens)
        const finalUserBalance = await token.balanceOf(addr1.address);
        const expectedBonusPayout = basePayout.mul(2);

        expect(finalUserBalance.sub(initialUserBalance)).to.equal(expectedBonusPayout);

        console.log("   ✅ CapOracle verified Orange Cap and successfully applied a 2x Bonus Payout multiplier!");
    });
});
