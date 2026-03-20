// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/fee/FeeManager.sol";

contract MintNFT is Script {

    function run() external {
        address fixedMinterAddr = vm.envAddress("FIXED_PRICE_MINTER_ADDRESS");
        address feeManagerAddr  = vm.envAddress("FEE_MANAGER_ADDRESS");
        address nftAddress      = vm.envAddress("NFT_CONTRACT_ADDRESS");
        address mintTo          = vm.envAddress("DEPLOYER_ADDRESS");
        uint256 quantity        = 1;

        FeeManager feeManager = FeeManager(payable(feeManagerAddr));
        uint256 flatFee        = feeManager.mintFlatFee();

        FixedPriceMinter minter = FixedPriceMinter(fixedMinterAddr);
        uint256 mintPrice       = minter.getMintPrice(nftAddress);
        uint256 totalCost       = (mintPrice * quantity) + (flatFee * quantity);

        console.log("Minting NFT...");
        console.log("  NFT Contract: ", nftAddress);
        console.log("  Quantity:     ", quantity);
        console.log("  Mint Price:   ", mintPrice);
        console.log("  Flat Fee:     ", flatFee);
        console.log("  Total Cost:   ", totalCost);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        minter.mintNFT{value: totalCost}(nftAddress, mintTo, quantity);

        vm.stopBroadcast();

        console.log("Minted successfully to:", mintTo);
    }
}