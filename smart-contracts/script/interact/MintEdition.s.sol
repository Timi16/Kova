// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/fee/FeeManager.sol";

contract MintEdition is Script {

    function run() external {
        address fixedMinterAddr  = vm.envAddress("FIXED_PRICE_MINTER_ADDRESS");
        address feeManagerAddr   = vm.envAddress("FEE_MANAGER");
        address editionAddress   = vm.envAddress("EDITION_CONTRACT_ADDRESS");
        address mintTo           = vm.envAddress("DEPLOYER_ADDRESS");
        uint256 tokenId          = 1;
        uint256 quantity         = 1;

        FeeManager feeManager    = FeeManager(payable(feeManagerAddr));
        uint256 flatFee          = feeManager.mintFlatFee();

        FixedPriceMinter minter  = FixedPriceMinter(fixedMinterAddr);
        uint256 mintPrice        = minter.getMintPrice(editionAddress);
        uint256 totalCost        = (mintPrice * quantity) + (flatFee * quantity);

        console.log("Minting Edition...");
        console.log("  Edition Contract:", editionAddress);
        console.log("  Token ID:        ", tokenId);
        console.log("  Quantity:        ", quantity);
        console.log("  Total Cost:      ", totalCost);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        minter.mintEdition{value: totalCost}(
            editionAddress,
            mintTo,
            tokenId,
            quantity
        );

        vm.stopBroadcast();

        console.log("Edition minted successfully to:", mintTo);
    }
}