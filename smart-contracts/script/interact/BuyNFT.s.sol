// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/utils/Types.sol";

contract BuyNFT is Script {

    function run() external {
        address marketplaceAddr = vm.envAddress("MARKETPLACE_ADDRESS");
        uint256 listingId       = vm.envUint("LISTING_ID");

        Marketplace marketplace = Marketplace(marketplaceAddr);

        // fetch listing to get the exact price
        Listing memory listing  = marketplace.getListing(listingId);

        console.log("Buying NFT...");
        console.log("  Marketplace:  ", marketplaceAddr);
        console.log("  Listing ID:   ", listingId);
        console.log("  NFT Contract: ", listing.contractAddress);
        console.log("  Token ID:     ", listing.tokenId);
        console.log("  Price (wei):  ", listing.price);
        console.log("  Seller:       ", listing.seller);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        marketplace.buy{value: listing.price}(listingId);

        vm.stopBroadcast();

        console.log("NFT purchased successfully.");
        console.log("  Listing ID:", listingId);
    }
}