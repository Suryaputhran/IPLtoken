// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CapOracle
 * @dev This smart contract acts as the on-chain registry for the Orange and Purple Cap holders.
 * In a production environment, this contract would be updated by a Chainlink Oracle node
 * that fetches live stats from a sports API like Sportradar.
 */
contract CapOracle is Ownable {
    
    // The player IDs (e.g., mapped to NFT IDs or string names) holding the caps
    uint256 public currentOrangeCapPlayerId;
    uint256 public currentPurpleCapPlayerId;

    event CapsUpdated(uint256 orangeCapId, uint256 purpleCapId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Restricted to the centralized Oracle authorized wallet.
     * Updates the current cap holders after daily matches conclude.
     */
    function updateCapHolders(uint256 _orangeCapId, uint256 _purpleCapId) external onlyOwner {
        currentOrangeCapPlayerId = _orangeCapId;
        currentPurpleCapPlayerId = _purpleCapId;
        
        emit CapsUpdated(_orangeCapId, _purpleCapId);
    }

    /**
     * @dev Called by the Dividend Vault contract to check if a specific player NFT 
     * should receive a 2X yield bonus.
     */
    function hasActiveCap(uint256 _playerId) external view returns (bool isOrange, bool isPurple) {
        if (_playerId == currentOrangeCapPlayerId && _playerId != 0) {
            return (true, false);
        } else if (_playerId == currentPurpleCapPlayerId && _playerId != 0) {
            return (false, true);
        }
        return (false, false);
    }
}
