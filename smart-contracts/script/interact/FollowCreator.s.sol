// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/social/KaliesoFollow.sol";

contract FollowCreator is Script {

    function run() external {
        address followAddr  = vm.envAddress("KALIESO_FOLLOW_ADDRESS");
        address creatorAddr = vm.envAddress("CREATOR_TO_FOLLOW");

        KaliesoFollow followContract = KaliesoFollow(followAddr);

        address follower = vm.envAddress("DEPLOYER_ADDRESS");

        console.log("Following creator...");
        console.log("  Follow contract:", followAddr);
        console.log("  Follower:       ", follower);
        console.log("  Creator:        ", creatorAddr);

        // check if already following
        if (followContract.isFollowing(follower, creatorAddr)) {
            console.log("Already following this creator.");
            return;
        }

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        followContract.follow(creatorAddr);

        vm.stopBroadcast();

        console.log("Followed successfully.");
        console.log(
            "  Follower count for creator:",
            followContract.followerCount(creatorAddr)
        );
    }
}