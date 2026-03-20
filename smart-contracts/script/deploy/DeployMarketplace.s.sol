// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/marketplace/Offers.sol";
import "../../src/fee/FeeManager.sol";
import "../utils/HelperConfig.s.sol";

contract DeployMarketplace is Script {

    function run()
        external
        returns (
            Marketplace marketplace,
            Offers      offers,
            HelperConfig helperConfig
        )
    {
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        // FeeManager must already be deployed
        // pass its address via env
        address feeManagerAddr = vm.envAddress("FEE_MANAGER_ADDRESS");

        console.log("Deploying Marketplace contracts...");
        console.log("  FeeManager:  ", feeManagerAddr);
        console.log("  Owner:       ", cfg.deployer);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        marketplace = new Marketplace(feeManagerAddr, cfg.deployer);
        offers      = new Offers(feeManagerAddr, cfg.deployer);

        vm.stopBroadcast();

        console.log("Marketplace deployed at:", address(marketplace));
        console.log("Offers deployed at:     ", address(offers));

        return (marketplace, offers, helperConfig);
    }
}