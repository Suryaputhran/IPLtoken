// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
}

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract TwelveMToken is ERC20, Ownable {
    // Taxation configuration parameters (5% Total)
    uint256 public constant TOTAL_TAX_PERCENT = 5;
    uint256 public constant TREASURY_FEE = 2;
    uint256 public constant MARKETING_FEE = 2;
    uint256 public constant BURN_FEE = 1;

    // Wallet destinations for taxes
    address public treasuryWallet;
    address public marketingWallet;

    // DEX integration
    IUniswapV2Router02 public immutable uniswapV2Router;
    address public immutable uniswapV2Pair;

    // Mapping to exempt specific wallets (like the PinkSale pre-sale contract or owners) from the 5% tax
    mapping(address => bool) public isExcludedFromFee;

    // Security switch to ensure taxes aren't collected during pre-sale transfers before official LP launch
    bool public tradingActive = false;
    
    // Internal guard to prevent taxation loops during internal contract swaps
    bool private inSwapAndLiquify;
    modifier lockTheSwap {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }

    constructor(
        address _treasuryWallet,
        address _marketingWallet,
        address _routerAddress 
    ) ERC20("12M Token", "12M") Ownable(msg.sender) {
        require(_treasuryWallet != address(0), "Treasury wallet cannot be 0x0");
        require(_marketingWallet != address(0), "Marketing wallet cannot be 0x0");
        
        treasuryWallet = _treasuryWallet;
        marketingWallet = _marketingWallet;

        // Initialize Router (e.g., PancakeSwap V2 Router on BSC)
        // Standard BSC Mainnet Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
        // Standard BSC Testnet Router: 0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3
        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(_routerAddress);
        uniswapV2Router = _uniswapV2Router;
        
        // Create the trading pair immediately 
        uniswapV2Pair = IUniswapV2Factory(_uniswapV2Router.factory())
            .createPair(address(this), _uniswapV2Router.WETH());

        // Exclude owner, treasury, marketing, and this contract from fees
        isExcludedFromFee[owner()] = true;
        isExcludedFromFee[address(this)] = true;
        isExcludedFromFee[treasuryWallet] = true;
        isExcludedFromFee[marketingWallet] = true;

        // Mint 1 Billion Tokens (1,000,000,000) directly to the deployer (owner)
        // Decimals are 18 by default in OpenZeppelin's ERC20
        _mint(msg.sender, 1_000_000_000 * 10**decimals());
    }

    /**
     * @dev Override the standard transfer function to implement our custom 5% tax.
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Prevent transfers before trading is officially activated (prevents sniper bots before LP is added)
        if (!tradingActive) {
            require(isExcludedFromFee[from] || isExcludedFromFee[to], "Trading is not active yet");
        }

        uint256 taxAmount = 0;

        // Only take tax if:
        // 1. Trading is active
        // 2. We aren't currently in an internal swap loop
        // 3. Neither the sender nor the receiver is excluded from fees
        if (tradingActive && !inSwapAndLiquify && !isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            // Apply tax on Buys and Sells (interactions with the DEX pair)
            // If you want to tax standard wallet-to-wallet transfers as well, remove the Pair conditionals.
            if (from == uniswapV2Pair || to == uniswapV2Pair) {
                taxAmount = (amount * TOTAL_TAX_PERCENT) / 100;

                if (taxAmount > 0) {
                    uint256 burnAmount = (taxAmount * BURN_FEE) / TOTAL_TAX_PERCENT;
                    uint256 treasuryAmount = (taxAmount * TREASURY_FEE) / TOTAL_TAX_PERCENT;
                    uint256 marketingAmount = taxAmount - burnAmount - treasuryAmount;

                    // Execute distributions
                    super._update(from, address(this), (treasuryAmount + marketingAmount)); // Send to contract for processing
                    super._update(from, address(0xdEaD), burnAmount); // Deflationary Burn
                    
                    // Immediately transfer out the collected fees to their respective wallets to avoid hoarding in contract
                    super._update(address(this), treasuryWallet, treasuryAmount);
                    super._update(address(this), marketingWallet, marketingAmount);
                }
            }
        }

        // Transfer the remaining amount to the actual recipient
        super._update(from, to, amount - taxAmount);
    }

    /**
     * @dev Enables trading. Can only be called once to prevent pausing the contract maliciously.
     */
    function enableTrading() external onlyOwner {
        require(!tradingActive, "Trading is already active");
        tradingActive = true;
    }

    /**
     * @dev Allows the owner to exclude or include addresses from paying fees (e.g., PinkSale, Staking Contracts).
     */
    function setExcludedFromFee(address account, bool excluded) external onlyOwner {
        isExcludedFromFee[account] = excluded;
    }

    /**
     * @dev Allows the owner to update the Treasury Wallet address if necessary.
     */
    function updateTreasuryWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Cannot be 0x0 address");
        treasuryWallet = newWallet;
        isExcludedFromFee[treasuryWallet] = true;
    }

    /**
     * @dev Allows the owner to update the Marketing Wallet address if necessary.
     */
    function updateMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Cannot be 0x0 address");
        marketingWallet = newWallet;
        isExcludedFromFee[marketingWallet] = true;
    }
}
