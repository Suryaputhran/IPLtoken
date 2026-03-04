// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockUniswapV2Factory {
    address public feeToSetter;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        return address(uint160(uint(keccak256(abi.encodePacked(tokenA, tokenB)))));
    }
}

contract MockUniswapV2Router02 {
    address public factory;
    address public WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }
}
