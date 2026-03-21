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

        address feeManagerAddr = vm.envAddress("FEE_MANAGER");

        console.log("Deploying Minters + Factory...");
        console.log("  FeeManager:", feeManagerAddr);
        console.log("  Config deployer:", cfg.deployer);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        // msg.sender here is the actual broadcaster (derived from DEPLOYER_PRIVATE_KEY)
        // — not cfg.deployer which may be a hardcoded anvil address
        address deployer = msg.sender;
        console.log("  Actual broadcaster:", deployer);

        // ── deploy all four minters owned by the actual broadcaster ──
        fixedPriceMinter = new FixedPriceMinter(feeManagerAddr, deployer);
        freeMinter       = new FreeMinter(feeManagerAddr, deployer);
        timedMinter      = new TimedMinter(feeManagerAddr, deployer);
        allowlistMinter  = new AllowlistMinter(feeManagerAddr, deployer);

        // ── deploy factory ──
        factory = new Factory(
            feeManagerAddr,
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            deployer  // factory owner = actual broadcaster
        );

        // ── transfer minter ownership to factory ──
        // broadcaster owns the minters, so this call succeeds
        fixedPriceMinter.transferOwnership(address(factory));
        freeMinter.transferOwnership(address(factory));
        timedMinter.transferOwnership(address(factory));
        allowlistMinter.transferOwnership(address(factory));

        vm.stopBroadcast();

        console.log("FixedPriceMinter:", address(fixedPriceMinter));
        console.log("FreeMinter:      ", address(freeMinter));
        console.log("TimedMinter:     ", address(timedMinter));
        console.log("AllowlistMinter: ", address(allowlistMinter));
        console.log("Factory:         ", address(factory));
        console.log("Minter ownership transferred to factory.");

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
