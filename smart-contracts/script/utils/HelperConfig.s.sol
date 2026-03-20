// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

contract HelperConfig is Script {

    // ─────────────────────────────────────────
    //  NETWORK CONFIG STRUCT
    //  holds everything needed for deployment
    //  on any network
    // ─────────────────────────────────────────

    struct NetworkConfig {
        address treasury;        // protocol fee recipient
        uint96  feeBps;          // protocol sale fee e.g 250 = 2.5%
        uint256 mintFlatFee;     // flat fee per mint e.g 0.000777 ether
        address deployer;        // wallet deploying the contracts
    }

    NetworkConfig public activeConfig;

    // chain ids
    uint256 constant INJECTIVE_MAINNET  = 2525;
    uint256 constant INJECTIVE_TESTNET  = 2424;
    uint256 constant LOCAL_ANVIL        = 31337;

    constructor() {
        if (block.chainid == INJECTIVE_MAINNET) {
            activeConfig = getInjectiveMainnetConfig();
        } else if (block.chainid == INJECTIVE_TESTNET) {
            activeConfig = getInjectiveTestnetConfig();
        } else {
            activeConfig = getAnvilConfig();
        }
    }

    // ─────────────────────────────────────────
    //  INJECTIVE MAINNET
    // ─────────────────────────────────────────

    function getInjectiveMainnetConfig()
        public
        view
        returns (NetworkConfig memory)
    {
        return NetworkConfig({
            treasury:    vm.envAddress("PROTOCOL_FEE_RECIPIENT"),
            feeBps:      250,           // 2.5%
            mintFlatFee: 0.000777 ether,
            deployer:    vm.envAddress("DEPLOYER_ADDRESS")
        });
    }

    // ─────────────────────────────────────────
    //  INJECTIVE TESTNET
    // ─────────────────────────────────────────

    function getInjectiveTestnetConfig()
        public
        view
        returns (NetworkConfig memory)
    {
        return NetworkConfig({
            treasury:    vm.envAddress("PROTOCOL_FEE_RECIPIENT"),
            feeBps:      250,
            mintFlatFee: 0.000777 ether,
            deployer:    vm.envAddress("DEPLOYER_ADDRESS")
        });
    }

    // ─────────────────────────────────────────
    //  LOCAL ANVIL
    //  uses default anvil wallet so no .env needed
    //  for local testing
    // ─────────────────────────────────────────

    function getAnvilConfig()
        public
        pure
        returns (NetworkConfig memory)
    {
        return NetworkConfig({
            treasury:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // anvil #0
            feeBps:      250,
            mintFlatFee: 0.000777 ether,
            deployer:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  // anvil #0
        });
    }

    // ─────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────

    function getConfig() public view returns (NetworkConfig memory) {
        return activeConfig;
    }
}