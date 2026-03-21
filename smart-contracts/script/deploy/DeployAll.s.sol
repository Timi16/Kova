// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/fees/FeeManager.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/marketplace/Offers.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/minters/FreeMinter.sol";
import "../../src/minters/TimedMinter.sol";
import "../../src/minters/AllowlistMinter.sol";
import "../../src/factory/Factory.sol";
import "../../src/social/KaliesoProfiles.sol";
import "../../src/social/KaliesoFollow.sol";
import "../../src/social/KaliesoPosts.sol";
import "../utils/HelperConfig.s.sol";

contract DeployAll is Script {

    // ─────────────────────────────────────────
    //  PROTOCOL CONTRACTS
    // ─────────────────────────────────────────

    FeeManager       public feeManager;
    FixedPriceMinter public fixedPriceMinter;
    FreeMinter       public freeMinter;
    TimedMinter      public timedMinter;
    AllowlistMinter  public allowlistMinter;
    Marketplace      public marketplace;
    Offers           public offers;
    Factory          public factory;

    // ─────────────────────────────────────────
    //  SOCIAL CONTRACTS
    // ─────────────────────────────────────────

    KaliesoProfiles  public profiles;
    KaliesoFollow    public follow;
    KaliesoPosts     public posts;

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        console.log("==============================================");
        console.log("  KALIESO PROTOCOL FULL DEPLOYMENT");
        console.log("==============================================");
        console.log("  Network:  ", block.chainid);
        console.log("  Deployer: ", cfg.deployer);
        console.log("  Treasury: ", cfg.treasury);
        console.log("==============================================");

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // ─────────────────────────────────────────
        //  PROTOCOL — 8 CONTRACTS
        // ─────────────────────────────────────────

        // ── 1. FeeManager ──
        console.log("\n[1/11] Deploying FeeManager...");
        feeManager = new FeeManager(cfg.treasury, cfg.feeBps);
        feeManager.setMintFlatFee(cfg.mintFlatFee);
        console.log("  FeeManager:", address(feeManager));

        // ── 2. FixedPriceMinter ──
        console.log("[2/11] Deploying FixedPriceMinter...");
        fixedPriceMinter = new FixedPriceMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  FixedPriceMinter:", address(fixedPriceMinter));

        // ── 3. FreeMinter ──
        console.log("[3/11] Deploying FreeMinter...");
        freeMinter = new FreeMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  FreeMinter:", address(freeMinter));

        // ── 4. TimedMinter ──
        console.log("[4/11] Deploying TimedMinter...");
        timedMinter = new TimedMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  TimedMinter:", address(timedMinter));

        // ── 5. AllowlistMinter ──
        console.log("[5/11] Deploying AllowlistMinter...");
        allowlistMinter = new AllowlistMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  AllowlistMinter:", address(allowlistMinter));

        // ── 6. Marketplace ──
        console.log("[6/11] Deploying Marketplace...");
        marketplace = new Marketplace(
            address(feeManager),
            cfg.deployer
        );
        console.log("  Marketplace:", address(marketplace));

        // ── 7. Offers ──
        console.log("[7/11] Deploying Offers...");
        offers = new Offers(
            address(feeManager),
            cfg.deployer
        );
        console.log("  Offers:", address(offers));

        // ── 8. Factory ──
        console.log("[8/11] Deploying Factory...");
        factory = new Factory(
            address(feeManager),
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            cfg.deployer
        );
        console.log("  Factory:", address(factory));

        // ─────────────────────────────────────────
        //  SOCIAL — 3 CONTRACTS
        // ─────────────────────────────────────────

        // ── 9. KaliesoProfiles ──
        console.log("[9/11] Deploying KaliesoProfiles...");
        profiles = new KaliesoProfiles(cfg.deployer);
        console.log("  KaliesoProfiles:", address(profiles));

        // ── 10. KaliesoFollow ──
        console.log("[10/11] Deploying KaliesoFollow...");
        follow = new KaliesoFollow(cfg.deployer);
        console.log("  KaliesoFollow:", address(follow));

        // ── 11. KaliesoPosts ──
        // deployed last — needs profiles address
        console.log("[11/11] Deploying KaliesoPosts...");
        posts = new KaliesoPosts(address(profiles), cfg.deployer);
        console.log("  KaliesoPosts:", address(posts));

        vm.stopBroadcast();

        // ─────────────────────────────────────────
        //  FULL DEPLOYMENT SUMMARY
        // ─────────────────────────────────────────

        console.log("\n==============================================");
        console.log("  DEPLOYMENT COMPLETE 11 CONTRACTS");
        console.log("==============================================");
        console.log("  PROTOCOL");
        console.log("  --------");
        console.log("  FeeManager:       ", address(feeManager));
        console.log("  FixedPriceMinter: ", address(fixedPriceMinter));
        console.log("  FreeMinter:       ", address(freeMinter));
        console.log("  TimedMinter:      ", address(timedMinter));
        console.log("  AllowlistMinter:  ", address(allowlistMinter));
        console.log("  Marketplace:      ", address(marketplace));
        console.log("  Offers:           ", address(offers));
        console.log("  Factory:          ", address(factory));
        console.log("");
        console.log("  SOCIAL");
        console.log("  ------");
        console.log("  KaliesoProfiles:  ", address(profiles));
        console.log("  KaliesoFollow:    ", address(follow));
        console.log("  KaliesoPosts:     ", address(posts));
        console.log("==============================================");
        console.log("\nCopy all addresses to your .env!");
    }
}