// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface IMinter {
    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────
    event MintExecuted(
        address indexed collection,
        address indexed to,
        uint256 tokenId,
        uint256 quantity,
        uint256 totalPaid
    );
    event MintPausedEvent(address indexed collection);
    event MintUnpaused(address indexed collection);

    // ─────────────────────────────────────────
    //  MINT ENTRY POINT
    //  called by frontend → minter → core contract
    // ─────────────────────────────────────────
    function mintNFT(
        address collection,
        address to,
        uint256 quantity
    ) external payable;

    function mintEdition(
        address collection,
        address to,
        uint256 tokenId,
        uint256 quantity
    ) external payable;

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────
    function pause(address collection) external;
    function unpause(address collection) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────
    function getMintPrice(address collection) external view returns (uint256);
    function isPaused(address collection) external view returns (bool);
    function minterType() external pure returns (MinterType);
}
