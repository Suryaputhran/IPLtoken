// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPlayerCardMint {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

interface ICapOracle {
    function hasActiveCap(uint256 playerId) external view returns (bool isOrangeCap, bool isPurpleCap);
}

contract DividendVault is Ownable, ReentrancyGuard {
    // 12M Token Interface for distributing payouts
    IERC20 public immutable paymentToken;
    
    // External Data Contracts
    IPlayerCardMint public playerCardNFT;
    ICapOracle public capOracle;

    // The backend Oracle server address allowed to trigger automated payouts
    address public oracleSigner;

    // Track total historical yield distributed globally
    uint256 public totalYieldDistributed;

    // Events to log the massive yield airdrops
    event PayoutExecuted(address indexed receiver, uint256 indexed playerId, uint256 amount);
    event OracleUpdated(address newOracle);

    // Modifier to restrict access to only the authorized backend server matching live IPL API stats
    modifier onlyOracle() {
        require(msg.sender == oracleSigner || msg.sender == owner(), "Only designated Oracle can trigger payouts");
        _;
    }

    constructor(
        address _paymentTokenAddress,
        address _playerCardNFTAddress,
        address _capOracleAddress,
        address _oracleSigner
    ) Ownable(msg.sender) {
        require(_paymentTokenAddress != address(0), "Payment Token cannot be 0x0");
        require(_playerCardNFTAddress != address(0), "NFT Contract cannot be 0x0");

        paymentToken = IERC20(_paymentTokenAddress);
        playerCardNFT = IPlayerCardMint(_playerCardNFTAddress);
        
        if (_capOracleAddress != address(0)) {
            capOracle = ICapOracle(_capOracleAddress);
        }

        oracleSigner = _oracleSigner;
    }

    /**
     * @dev Core function called by the automated Node.js Web3 backend when a real-world match event occurs.
     *      E.g., "Rohit Sharma just hit a boundary!". The backend passes an array of wallet addresses 
     *      who own the Rohit NFT, and the base payout amount. This vault then instantly airdrops the 12M!
     * @param receivers An array of user wallet addresses who hold the specific player's NFT.
     * @param playerId The unique ID of the player who triggered the event.
     * @param basePayoutAmount The baseline 12M tokens to send per card held.
     */
    function triggerMatchYield(
        address[] calldata receivers,
        uint256 playerId,
        uint256 basePayoutAmount
    ) external onlyOracle nonReentrant {
        require(receivers.length > 0, "No receivers to pay");
        require(basePayoutAmount > 0, "Payout must be greater than 0");

        // First, check with the Cap Oracle if this specific player holds an Orange/Purple cap bonus today
        bool capBonusActive = false;
        if (address(capOracle) != address(0)) {
            (bool isOrange, bool isPurple) = capOracle.hasActiveCap(playerId);
            if (isOrange || isPurple) {
                capBonusActive = true;
            }
        }

        uint256 payoutAmount = basePayoutAmount;
        
        // If the player holds an IPL Cap, applying the advertised 2x Yield Multiplier to the payout!
        if (capBonusActive) {
            payoutAmount = basePayoutAmount * 2;
        }

        uint256 vaultBalance = paymentToken.balanceOf(address(this));

        // Iterate through all holders and mass-airdrop the yield
        for (uint256 i = 0; i < receivers.length; i++) {
            address user = receivers[i];

            // Security Check: Verify user STILL holds the NFT and hasn't just quickly sold it
            uint256 playerCardBalance = playerCardNFT.balanceOf(user, playerId);
            if (playerCardBalance > 0) {
                
                // If they hold 3 cards of this player, pay them 3x the yield!
                uint256 totalPayoutForUser = payoutAmount * playerCardBalance;

                // Stop the loop if the Treasury runs completely out of funds somehow to prevent Reverts
                if (vaultBalance < totalPayoutForUser) {
                    break;
                }

                bool payoutSuccess = paymentToken.transfer(user, totalPayoutForUser);
                
                if (payoutSuccess) {
                    vaultBalance -= totalPayoutForUser;
                    totalYieldDistributed += totalPayoutForUser;
                    emit PayoutExecuted(user, playerId, totalPayoutForUser);
                }
            }
        }
    }

    /**
     * @dev Allow the Owner to update the backend Oracle Address in case of a server migration
     */
    function updateOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Cannot be 0x0 address");
        oracleSigner = newSigner;
        emit OracleUpdated(newSigner);
    }

    /**
     * @dev Allow the Owner to link a new version of the Player Card NFT if an upgrade occurs
     */
    function setPlayerCardNFTContract(address newContract) external onlyOwner {
        playerCardNFT = IPlayerCardMint(newContract);
    }
    
    /**
     * @dev Emergency withdraw function in case of a critical vulnerability or upgrade
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        paymentToken.transfer(owner(), amount);
    }
}
