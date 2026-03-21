// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/social/KaliesoProfiles.sol";
import "../../src/social/KaliesoFollow.sol";
import "../../src/social/KaliesoPosts.sol";
import "../utils/HelperConfig.s.sol";

contract DeploySocial is Script {

    function run()
        external
        returns (
            KaliesoProfiles profiles,
            KaliesoFollow   follow,
            KaliesoPosts    posts,
            HelperConfig    helperConfig
        )
    {
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        console.log("Deploying Social contracts...");
        console.log("  Owner:    ", cfg.deployer);
        console.log("  Chain ID: ", block.chainid);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // ── 1. Profiles first ──
        // Follow + Posts both depend on nothing
        // but Posts depends on Profiles address
        profiles = new KaliesoProfiles(cfg.deployer);
        console.log("KaliesoProfiles deployed at:", address(profiles));

        // ── 2. Follow ──
        // standalone, no dependencies
        follow = new KaliesoFollow(cfg.deployer);
        console.log("KaliesoFollow deployed at:  ", address(follow));

        // ── 3. Posts ──
        // needs profiles address
        posts = new KaliesoPosts(address(profiles), cfg.deployer);
        console.log("KaliesoPosts deployed at:   ", address(posts));

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("  SOCIAL DEPLOYMENT COMPLETE");
        console.log("==============================================");
        console.log("  KaliesoProfiles:", address(profiles));
        console.log("  KaliesoFollow:  ", address(follow));
        console.log("  KaliesoPosts:   ", address(posts));
        console.log("==============================================");
        console.log("\nAdd these to your .env!");

        return (profiles, follow, posts, helperConfig);
    }
}