// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IMarketplace.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract Marketplace is IMarketplace, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // auto incrementing listing id
    uint256 private _nextListingId;

    // listingId → Listing
    mapping(uint256 => Listing) private _listings;

    // seller → listingIds they created
    mapping(address => uint256[]) private _sellerListings;

    // contractAddress → tokenId → listingIds created for that token
    // allows multiple sellers for the same ERC1155 tokenId
    mapping(address => mapping(uint256 => uint256[])) private _tokenListings;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address feeManager_, address owner_) Ownable(owner_) {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
        _nextListingId = 1;
    }

    // ─────────────────────────────────────────
    //  LIST
    //  seller lists their NFT or Edition token
    //  contract must be approved to transfer before listing
    // ─────────────────────────────────────────

    function list(
        address contractAddress,
        uint256 tokenId,
        uint256 price,
        TokenType tokenType,
        uint256 quantity
    ) external nonReentrant {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (price == 0) revert IncorrectPayment(0, 0);
        if (quantity == 0) revert InvalidMintAmount(quantity);

        // verify ownership + approval
        if (tokenType == TokenType.ERC721) {
            IERC721 nft = IERC721(contractAddress);
            if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
            if (
                nft.getApproved(tokenId) != address(this) &&
                !nft.isApprovedForAll(msg.sender, address(this))
            ) revert NFTNotApproved();
        } else {
            IERC1155 edition = IERC1155(contractAddress);
            if (edition.balanceOf(msg.sender, tokenId) < quantity) revert NotTokenOwner();
            if (!edition.isApprovedForAll(msg.sender, address(this))) revert NFTNotApproved();
        }

        uint256 listingId = _nextListingId++;

        _listings[listingId] = Listing({
            listingId: listingId,
            contractAddress: contractAddress,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            tokenType: tokenType,
            quantity: quantity,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });

        _sellerListings[msg.sender].push(listingId);
        _tokenListings[contractAddress][tokenId].push(listingId);

        emit Listed(
            listingId,
            msg.sender,
            contractAddress,
            tokenId,
            price,
            tokenType
        );
    }

    // ─────────────────────────────────────────
    //  BUY
    //  buyer sends exact price
    //  marketplace transfers NFT to buyer
    //  fee manager splits proceeds to seller + protocol
    // ─────────────────────────────────────────

    function buy(uint256 listingId) external payable nonReentrant {
        Listing storage listing = _listings[listingId];

        if (listing.listingId == 0) revert ListingNotFound();
        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (msg.value != listing.price) revert IncorrectPayment(listing.price, msg.value);

        // mark sold before transfer — prevent reentrancy
        listing.status = ListingStatus.Sold;

        // transfer token to buyer
        if (listing.tokenType == TokenType.ERC721) {
            IERC721(listing.contractAddress).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId
            );
        } else {
            IERC1155(listing.contractAddress).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId,
                listing.quantity,
                ""
            );
        }

        // split proceeds — seller gets sale price minus protocol fee
        feeManager.collectSaleFee{value: msg.value}(
            listing.seller,
            msg.value
        );

        emit Sale(
            listingId,
            msg.sender,
            listing.seller,
            listing.price
        );
    }

    // ─────────────────────────────────────────
    //  CANCEL LISTING
    //  only seller can cancel their own listing
    // ─────────────────────────────────────────

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = _listings[listingId];

        if (listing.listingId == 0) revert ListingNotFound();
        if (listing.seller != msg.sender) revert NotListingOwner();
        if (listing.status != ListingStatus.Active) revert ListingNotActive();

        listing.status = ListingStatus.Cancelled;

        emit ListingCancelled(listingId);
    }

    // ─────────────────────────────────────────
    //  OFFERS (handled by Offers.sol)
    // ─────────────────────────────────────────

    function makeOffer(
        address,
        uint256,
        TokenType,
        uint256,
        uint256
    ) external payable {
        revert OfferNotFound();
    }

    function acceptOffer(uint256) external pure {
        revert OfferNotFound();
    }

    function cancelOffer(uint256) external pure {
        revert OfferNotFound();
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function updateFeeManager(address feeManager_) external onlyOwner {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        if (_listings[listingId].listingId == 0) revert ListingNotFound();
        return _listings[listingId];
    }

    function getOffer(uint256) external pure returns (Offer memory) {
        revert OfferNotFound(); // offers live in Offers.sol
    }

    function getListingsByseller(
        address seller
    ) external view returns (Listing[] memory) {
        uint256[] memory ids = _sellerListings[seller];
        Listing[] memory result = new Listing[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _listings[ids[i]];
        }
        return result;
    }

    function getOffersByBuyer(
        address
    ) external pure returns (Offer[] memory) {
        revert OfferNotFound(); // offers live in Offers.sol
    }

    function getTokenListing(
        address contractAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        uint256 listingId = _latestActiveTokenListingId(contractAddress, tokenId);
        if (listingId == 0) revert ListingNotFound();
        return _listings[listingId];
    }

    function isListed(
        address contractAddress,
        uint256 tokenId
    ) external view returns (bool) {
        return _latestActiveTokenListingId(contractAddress, tokenId) != 0;
    }

    function _latestActiveTokenListingId(
        address contractAddress,
        uint256 tokenId
    ) internal view returns (uint256) {
        uint256[] storage listingIds = _tokenListings[contractAddress][tokenId];

        for (uint256 i = listingIds.length; i > 0; ) {
            unchecked {
                i--;
            }
            uint256 listingId = listingIds[i];
            if (_listings[listingId].status == ListingStatus.Active) {
                return listingId;
            }
        }

        return 0;
    }
}
