// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface IEdition {
    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────
    event EditionMinted(address indexed to, uint256 indexed tokenId, uint256 quantity);
    event EditionCreated(uint256 indexed tokenId, string uri, uint256 maxSupply);
    event EditionClosed(uint256 indexed tokenId);
    event MinterSet(address indexed minter);
    event Withdrawn(address indexed to, uint256 amount);

    // ─────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────
    function mint(address to, uint256 tokenId, uint256 quantity) external payable;
    function setMinter(address minter) external;

    // ─────────────────────────────────────────
    //  EDITION MANAGEMENT
    // ─────────────────────────────────────────
    function createEdition(EditionConfig calldata config) external;
    function closeEdition(uint256 tokenId) external;

    // ─────────────────────────────────────────
    //  FUNDS
    // ─────────────────────────────────────────
    function withdraw() external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────
    function editionConfig(uint256 tokenId) external view returns (EditionConfig memory);
    function totalMinted(uint256 tokenId) external view returns (uint256);
    function walletMints(address wallet, uint256 tokenId) external view returns (uint256);
    function isEditionOpen(uint256 tokenId) external view returns (bool);
}