// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/utils/Types.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ListNFT is Script {

    function run() external {
        address marketplaceAddr = vm.envAddress("MARKETPLACE_ADDRESS");
        address nftAddress      = vm.envAddress("NFT_CONTRACT_ADDRESS");
        uint256 tokenId         = vm.envUint("TOKEN_ID");
        uint256 listPrice       = vm.envUint("LIST_PRICE"); // in wei

        console.log("Listing NFT...");
        console.log("  Marketplace: ", marketplaceAddr);
        console.log("  NFT:         ", nftAddress);
        console.log("  Token ID:    ", tokenId);
        console.log("  Price (wei): ", listPrice);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // approve marketplace first
        IERC721(nftAddress).approve(marketplaceAddr, tokenId);

        // list it
        Marketplace(marketplaceAddr).list(
            nftAddress,
            tokenId,
            listPrice,
            TokenType.ERC721,
            1
        );

        vm.stopBroadcast();

        console.log("NFT listed successfully.");
        console.log("  Token ID:", tokenId);
        console.log("  Price:   ", listPrice);
    }
}