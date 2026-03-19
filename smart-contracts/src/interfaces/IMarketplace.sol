// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface IMarketplace {
    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed contractAddress,
        uint256 tokenId,
        uint256 price,
        TokenType tokenType
    );
    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event ListingCancelled(uint256 indexed listingId);
    event OfferMade(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed contractAddress,
        uint256 tokenId,
        uint256 amount
    );
    event OfferAccepted(uint256 indexed offerId, address indexed seller);
    event OfferCancelled(uint256 indexed offerId);

    // ─────────────────────────────────────────
    //  LISTINGS
    // ─────────────────────────────────────────
    function list(
        address contractAddress,
        uint256 tokenId,
        uint256 price,
        TokenType tokenType,
        uint256 quantity
    ) external;

    function buy(uint256 listingId) external payable;
    function cancelListing(uint256 listingId) external;

    // ─────────────────────────────────────────
    //  OFFERS
    // ─────────────────────────────────────────
    function makeOffer(
        address contractAddress,
        uint256 tokenId,
        TokenType tokenType,
        uint256 quantity,
        uint256 expiresAt
    ) external payable;

    function acceptOffer(uint256 offerId) external;
    function cancelOffer(uint256 offerId) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────
    function getListing(uint256 listingId) external view returns (Listing memory);
    function getOffer(uint256 offerId) external view returns (Offer memory);
    function getListingsByseller(address seller) external view returns (Listing[] memory);
    function getOffersByBuyer(address buyer) external view returns (Offer[] memory);
}