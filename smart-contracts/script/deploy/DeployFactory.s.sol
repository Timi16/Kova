// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/factory/Factory.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/minters/FreeMinter.sol";
import "../../src/minters/TimedMinter.sol";
import "../../src/minters/AllowlistMinter.sol";
import "../utils/HelperConfig.s.sol";

contract DeployFactory is Script {

    function run()
        external
        returns (
            Factory          factory,
            FixedPriceMinter fixedPriceMinter,
            FreeMinter       freeMinter,
            TimedMinter      timedMinter,
            AllowlistMinter  allowlistMinter,
            HelperConfig     helperConfig
        )
    {
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        address feeManagerAddr = vm.envAddress("FEE_MANAGER_ADDRESS");

        console.log("Deploying Minters + Factory...");
        console.log("  FeeManager:", feeManagerAddr);
        console.log("  Owner:     ", cfg.deployer);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // ── deploy all four minters ──
        fixedPriceMinter = new FixedPriceMinter(feeManagerAddr, cfg.deployer);
        freeMinter       = new FreeMinter(feeManagerAddr, cfg.deployer);
        timedMinter      = new TimedMinter(feeManagerAddr, cfg.deployer);
        allowlistMinter  = new AllowlistMinter(feeManagerAddr, cfg.deployer);

        // ── deploy factory, passing all minter addresses ──
        factory = new Factory(
            feeManagerAddr,
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            cfg.deployer
        );

        vm.stopBroadcast();

        console.log("FixedPriceMinter deployed at:", address(fixedPriceMinter));
        console.log("FreeMinter deployed at:      ", address(freeMinter));
        console.log("TimedMinter deployed at:     ", address(timedMinter));
        console.log("AllowlistMinter deployed at: ", address(allowlistMinter));
        console.log("Factory deployed at:         ", address(factory));

        return (
            factory,
            fixedPriceMinter,
            freeMinter,
            timedMinter,
            allowlistMinter,
            helperConfig
        );
    }
}