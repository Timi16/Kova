// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/social/KaliesoProfiles.sol";
import "../../src/social/KaliesoPosts.sol";
import "../../src/utils/Types.sol";

contract CreatePost is Script {

    function run() external {
        address profilesAddr = vm.envAddress("KALIESO_PROFILES_ADDRESS");
        address postsAddr    = vm.envAddress("KALIESO_POSTS_ADDRESS");
        address nftContract  = vm.envAddress("NFT_CONTRACT_ADDRESS");

        KaliesoProfiles profiles = KaliesoProfiles(profilesAddr);
        KaliesoPosts    posts    = KaliesoPosts(postsAddr);

        address deployer = vm.envAddress("DEPLOYER_ADDRESS");

        console.log("Creating post...");
        console.log("  Posts contract: ", postsAddr);
        console.log("  NFT contract:   ", nftContract);
        console.log("  Creator:        ", deployer);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // create profile first if it doesnt exist
        if (!profiles.hasProfile(deployer)) {
            console.log("No profile found creating one first...");
            profiles.createProfile(
                "kalieso_creator",
                "First creator on Kalieso",
                "ipfs://QmAvatarHash",
                ""
            );
            console.log("Profile created.");
        }

        // create the post linking it to the deployed NFT
        posts.createPost(
            nftContract,
            TokenType.ERC721,
            0,
            "My First Drop",
            "The first post on Kalieso",
            "ipfs://QmContentHash",
            "image"
        );

        vm.stopBroadcast();

        uint256 postId = posts.getPostIdByNFT(nftContract);
        console.log("Post created successfully.");
        console.log("  Post ID:      ", postId);
        console.log("  NFT Contract: ", nftContract);
    }
}