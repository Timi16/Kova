// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface IFeeManager {
    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────
    event ProtocolFeeCollected(
        address indexed from,
        address indexed treasury,
        uint256 amount
    );
    event FeeUpdated(uint96 oldBps, uint96 newBps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ─────────────────────────────────────────
    //  FEE CALCULATION + DISTRIBUTION
    // ─────────────────────────────────────────
    function collectMintFee(
        address creator,
        uint256 totalPaid,
        uint256 quantity
    ) external payable returns (uint256 creatorAmount, uint256 protocolAmount);

    function collectSaleFee(
        address seller,
        uint256 salePrice
    ) external payable returns (uint256 sellerAmount, uint256 protocolAmount);

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────
    function setFee(uint96 newBps) external;
    function setTreasury(address newTreasury) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────
    function mintFlatFee() external view returns (uint256);
    function feeConfig() external view returns (FeeConfig memory);
    function calculateFee(uint256 amount) external view returns (uint256 fee, uint256 remainder);
}
