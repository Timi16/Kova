// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/fee/FeeManager.sol";
import "../utils/HelperConfig.s.sol";

contract DeployFeeManager is Script {

    function run() external returns (FeeManager feeManager, HelperConfig helperConfig) {
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();

        console.log("Deploying FeeManager...");
        console.log("  Treasury:     ", cfg.treasury);
        console.log("  Fee BPS:      ", cfg.feeBps);
        console.log("  Mint Flat Fee:", cfg.mintFlatFee);
        console.log("  Chain ID:     ", block.chainid);

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        feeManager = new FeeManager(cfg.treasury, cfg.feeBps);

        // set the flat mint fee
        feeManager.setMintFlatFee(cfg.mintFlatFee);

        vm.stopBroadcast();

        console.log("FeeManager deployed at:", address(feeManager));

        return (feeManager, helperConfig);
    }
}