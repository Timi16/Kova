// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface INFT {
    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────
    event Minted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event BatchMinted(address indexed to, uint256 fromTokenId, uint256 toTokenId);
    event Revealed(string newBaseURI);
    event MetadataFrozenEvent();
    event MinterSet(address indexed minter);
    event Withdrawn(address indexed to, uint256 amount);

    // ─────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────
    function mint(address to, uint256 quantity) external payable;
    function setMinter(address minter) external;

    // ─────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────
    function reveal(string calldata newBaseURI) external;
    function freezeMetadata() external;
    function setBaseURI(string calldata newBaseURI) external;

    // ─────────────────────────────────────────
    //  FUNDS
    // ─────────────────────────────────────────
    function withdraw() external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────
    function config() external view returns (NFTConfig memory);
    function royaltyReceiver() external view returns (address);
    function totalMinted() external view returns (uint256);
    function walletMints(address wallet) external view returns (uint256);
    function isMetadataFrozen() external view returns (bool);
}
