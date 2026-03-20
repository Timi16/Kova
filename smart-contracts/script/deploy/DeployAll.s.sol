// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/marketplace/Offers.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/minters/FreeMinter.sol";
import "../../src/minters/TimedMinter.sol";
import "../../src/minters/AllowlistMinter.sol";
import "../../src/factory/Factory.sol";
import "../utils/HelperConfig.s.sol";

contract DeployAll is Script {

    // ─────────────────────────────────────────
    //  DEPLOYED ADDRESSES
    //  stored so tests + other scripts can read them
    // ─────────────────────────────────────────

    FeeManager       public feeManager;
    Marketplace      public marketplace;
    Offers           public offers;
    FixedPriceMinter public fixedPriceMinter;
    FreeMinter       public freeMinter;
    TimedMinter      public timedMinter;
    AllowlistMinter  public allowlistMinter;
    Factory          public factory;

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        console.log("==============================================");
        console.log("  FORGE PROTOCOL - FULL DEPLOYMENT");
        console.log("==============================================");
        console.log("  Network:  ", block.chainid);
        console.log("  Deployer: ", cfg.deployer);
        console.log("  Treasury: ", cfg.treasury);
        console.log("==============================================");

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // ── 1. FeeManager ──
        console.log("\n[1/8] Deploying FeeManager...");
        feeManager = new FeeManager(cfg.treasury, cfg.feeBps);
        feeManager.setMintFlatFee(cfg.mintFlatFee);
        console.log("  FeeManager:", address(feeManager));

        // ── 2. FixedPriceMinter ──
        console.log("[2/8] Deploying FixedPriceMinter...");
        fixedPriceMinter = new FixedPriceMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  FixedPriceMinter:", address(fixedPriceMinter));

        // ── 3. FreeMinter ──
        console.log("[3/8] Deploying FreeMinter...");
        freeMinter = new FreeMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  FreeMinter:", address(freeMinter));

        // ── 4. TimedMinter ──
        console.log("[4/8] Deploying TimedMinter...");
        timedMinter = new TimedMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  TimedMinter:", address(timedMinter));

        // ── 5. AllowlistMinter ──
        console.log("[5/8] Deploying AllowlistMinter...");
        allowlistMinter = new AllowlistMinter(
            address(feeManager),
            cfg.deployer
        );
        console.log("  AllowlistMinter:", address(allowlistMinter));

        // ── 6. Marketplace ──
        console.log("[6/8] Deploying Marketplace...");
        marketplace = new Marketplace(
            address(feeManager),
            cfg.deployer
        );
        console.log("  Marketplace:", address(marketplace));

        // ── 7. Offers ──
        console.log("[7/8] Deploying Offers...");
        offers = new Offers(
            address(feeManager),
            cfg.deployer
        );
        console.log("  Offers:", address(offers));

        // ── 8. Factory ──
        console.log("[8/8] Deploying Factory...");
        factory = new Factory(
            address(feeManager),
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            cfg.deployer
        );
        console.log("  Factory:", address(factory));

        vm.stopBroadcast();

        // ─────────────────────────────────────────
        //  DEPLOYMENT SUMMARY
        // ─────────────────────────────────────────

        console.log("\n==============================================");
        console.log("  DEPLOYMENT COMPLETE");
        console.log("==============================================");
        console.log("  FeeManager:       ", address(feeManager));
        console.log("  FixedPriceMinter: ", address(fixedPriceMinter));
        console.log("  FreeMinter:       ", address(freeMinter));
        console.log("  TimedMinter:      ", address(timedMinter));
        console.log("  AllowlistMinter:  ", address(allowlistMinter));
        console.log("  Marketplace:      ", address(marketplace));
        console.log("  Offers:           ", address(offers));
        console.log("  Factory:          ", address(factory));
        console.log("==============================================");
        console.log("\nSave these addresses to your .env!");
    }
}