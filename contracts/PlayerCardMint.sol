// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PlayerCardMint is ERC1155, Ownable {
    using Strings for uint256;

    // The $12M Token Contract interfaces
    IERC20 public immutable paymentToken;
    address public treasuryWallet;

    // Base URI for NFT metadata (e.g. "ipfs://QmYourHashHere/")
    string public baseURI;
    
    // Default minting cost: e.g., 5,000 $12M tokens (assuming $12M has 18 decimals)
    uint256 public standardMintCost;

    // Optional mapping if you want superstar cards (Kohli, Dhoni) to cost more $12M to mint than standard players
    mapping(uint256 => uint256) public customCardPrices;

    // Toggle to turn minting on/off before the season officially starts
    bool public isMintingActive = false;

    // Event to log when a user mints a card (useful for the frontend to listen to)
    event PlayerCardMinted(address indexed buyer, uint256 indexed playerId, uint256 amountMints, uint256 totalCost);

    constructor(
        address _paymentTokenAddress,
        address _treasuryWallet,
        string memory _initialBaseURI
    ) ERC1155(_initialBaseURI) Ownable(msg.sender) {
        require(_paymentTokenAddress != address(0), "Token address cannot be 0x0");
        require(_treasuryWallet != address(0), "Treasury wallet cannot be 0x0");

        paymentToken = IERC20(_paymentTokenAddress);
        treasuryWallet = _treasuryWallet;
        baseURI = _initialBaseURI;
        
        // Setting a default starting cost of 1,000 $12M tokens to mint 1 card
        // Note: You must ensure the $12M token actually uses 18 decimals
        standardMintCost = 1000 * 10**18; 
    }

    /**
     * @dev Main function for users to mint a Player Card.
     * Users must first `approve()` this contract address to spend their $12M tokens.
     * @param playerId The numerical ID mapped to a specific cricket player (e.g. 1 = Dhoni, 2 = Kohli).
     * @param amountToMint How many of this specific card they want to mint in one transaction.
     */
    function mintCard(uint256 playerId, uint256 amountToMint) external {
        require(isMintingActive, "Minting is currently paused");
        require(amountToMint > 0, "Must mint at least 1 card");

        // Determine the required cost (checks if there is a custom price for this specific superstar player)
        uint256 costPerCard = customCardPrices[playerId] > 0 ? customCardPrices[playerId] : standardMintCost;
        uint256 totalCost = costPerCard * amountToMint;

        // Verify the user has enough $12M token balance to pay for the NFT
        require(paymentToken.balanceOf(msg.sender) >= totalCost, "Insufficient $12M token balance");

        // Transfer the $12M tokens from the User directly to the Treasury Yield Vault 
        // This funds the future dividend payouts!
        bool paymentSuccess = paymentToken.transferFrom(msg.sender, treasuryWallet, totalCost);
        require(paymentSuccess, "Token payment to Treasury failed. Check allowance.");

        // Mint the ERC-1155 Player Card to the user
        _mint(msg.sender, playerId, amountToMint, "");

        // Announce the minting event to the blockchain
        emit PlayerCardMinted(msg.sender, playerId, amountToMint, totalCost);
    }

    /**
     * @dev Allows the owner to set special prices for specific "Superstar" players dynamically.
     */
    function setCustomCardPrice(uint256 playerId, uint256 newPriceInWei) external onlyOwner {
        customCardPrices[playerId] = newPriceInWei;
    }

    /**
     * @dev Allows the owner to change the global baseline mint cost.
     */
    function setStandardMintCost(uint256 newCostInWei) external onlyOwner {
        standardMintCost = newCostInWei;
    }

    /**
     * @dev Allows the owner to start or pause the minting phase.
     */
    function flipMintingState() external onlyOwner {
        isMintingActive = !isMintingActive;
    }

    /**
     * @dev Updates the metadata URI for where the NFT images/stats are stored (IPFS/AWS).
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
        baseURI = newuri;
    }

    /**
     * @dev Required standard ERC-1155 override to return the specific metadata URL for each Player ID.
     */
    function uri(uint256 playerId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(baseURI, playerId.toString(), ".json"));
    }
}
