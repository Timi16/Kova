// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────
//  MINTER TYPES
// ─────────────────────────────────────────

enum MinterType {
    FixedPrice,
    Free,
    Timed,
    Allowlist
}

enum TokenType {
    ERC721,
    ERC1155
}

// ─────────────────────────────────────────
//  COLLECTION CONFIG
// ─────────────────────────────────────────

struct NFTConfig {
    string name;
    string symbol;
    string baseURI;
    string hiddenURI;        // shown before reveal
    uint256 maxSupply;       // 0 = unlimited
    uint256 mintPrice;       // in wei
    uint256 mintStart;       // unix timestamp
    uint256 mintEnd;         // 0 = no end
    uint256 walletLimit;     // max mints per wallet, 0 = no limit
    uint96 royaltyBps;       // royalty in basis points e.g 500 = 5%
    address royaltyReceiver;
    bool isRevealed;
}

struct EditionConfig {
    string name;
    string uri;              // single URI for all tokens in edition
    uint256 tokenId;         // edition token ID
    uint256 maxSupply;       // 0 = unlimited open edition
    uint256 mintPrice;
    uint256 mintStart;
    uint256 mintEnd;         // 0 = open forever
    uint256 walletLimit;
    uint96 royaltyBps;
    address royaltyReceiver;
}

// ─────────────────────────────────────────
//  MINTER CONFIG
// ─────────────────────────────────────────

struct FixedPriceConfig {
    uint256 price;
    uint256 maxPerWallet;
}

struct TimedConfig {
    uint256 price;
    uint256 startTime;
    uint256 endTime;
    uint256 maxPerWallet;
}

struct AllowlistConfig {
    uint256 price;
    bytes32 merkleRoot;
    uint256 maxPerWallet;
}

// ─────────────────────────────────────────
//  MARKETPLACE
// ─────────────────────────────────────────

enum ListingStatus {
    Active,
    Sold,
    Cancelled
}

enum OfferStatus {
    Active,
    Accepted,
    Cancelled,
    Expired
}

struct Listing {
    uint256 listingId;
    address contractAddress;  // NFT or Edition contract
    uint256 tokenId;
    address seller;
    uint256 price;            // in wei
    TokenType tokenType;      // ERC721 or ERC1155
    uint256 quantity;         // always 1 for ERC721
    ListingStatus status;
    uint256 createdAt;
}

struct Offer {
    uint256 offerId;
    address contractAddress;
    uint256 tokenId;
    address buyer;
    uint256 amount;           // offer amount in wei
    TokenType tokenType;
    uint256 quantity;
    OfferStatus status;
    uint256 expiresAt;        // unix timestamp
    uint256 createdAt;
}

// ─────────────────────────────────────────
//  FEES
// ─────────────────────────────────────────

struct FeeConfig {
    address treasury;         // protocol fee recipient
    uint96 feeBps;            // protocol fee in bps e.g 250 = 2.5%
}

// ─────────────────────────────────────────
//  FACTORY
// ─────────────────────────────────────────

struct DeployedCollection {
    address contractAddress;
    address creator;
    address minter;
    TokenType tokenType;
    MinterType minterType;
    uint256 deployedAt;
}