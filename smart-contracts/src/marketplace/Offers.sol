// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract Offers is Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

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
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // auto incrementing offer id
    uint256 private _nextOfferId;

    // offerId → Offer
    mapping(uint256 => Offer) private _offers;

    // buyer → offerIds they made
    mapping(address => uint256[]) private _buyerOffers;

    // contractAddress → tokenId → offerIds on that token
    // one token can have multiple offers from different buyers
    mapping(address => mapping(uint256 => uint256[])) private _tokenOffers;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address feeManager_, address owner_) Ownable(owner_) {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
        _nextOfferId = 1;
    }

    // ─────────────────────────────────────────
    //  MAKE OFFER
    //  buyer sends INJ with transaction
    //  INJ stays locked in this contract as escrow
    //  until seller accepts, buyer cancels, or offer expires
    // ─────────────────────────────────────────

    function makeOffer(
        address contractAddress,
        uint256 tokenId,
        TokenType tokenType,
        uint256 quantity,
        uint256 expiresAt
    ) external payable nonReentrant {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert InsufficientOfferAmount();
        if (quantity == 0) revert InvalidMintAmount(quantity);
        if (expiresAt <= block.timestamp) revert OfferExpired();

        uint256 offerId = _nextOfferId++;

        _offers[offerId] = Offer({
            offerId: offerId,
            contractAddress: contractAddress,
            tokenId: tokenId,
            buyer: msg.sender,
            amount: msg.value,        // INJ locked in escrow here
            tokenType: tokenType,
            quantity: quantity,
            status: OfferStatus.Active,
            expiresAt: expiresAt,
            createdAt: block.timestamp
        });

        _buyerOffers[msg.sender].push(offerId);
        _tokenOffers[contractAddress][tokenId].push(offerId);

        emit OfferMade(
            offerId,
            msg.sender,
            contractAddress,
            tokenId,
            msg.value
        );
    }

    // ─────────────────────────────────────────
    //  ACCEPT OFFER
    //  seller calls this to accept an offer on their token
    //  seller must have approved this contract before calling
    //  token transfers to buyer
    //  escrowed INJ splits to seller + protocol via fee manager
    // ─────────────────────────────────────────

    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];

        if (offer.offerId == 0) revert OfferNotFound();
        if (offer.status != OfferStatus.Active) revert OfferAlreadyAccepted();
        if (block.timestamp > offer.expiresAt) revert OfferExpired();

        // verify caller owns the token
        if (offer.tokenType == TokenType.ERC721) {
            IERC721 nft = IERC721(offer.contractAddress);
            if (nft.ownerOf(offer.tokenId) != msg.sender) revert NotTokenOwner();
            if (
                nft.getApproved(offer.tokenId) != address(this) &&
                !nft.isApprovedForAll(msg.sender, address(this))
            ) revert NFTNotApproved();
        } else {
            IERC1155 edition = IERC1155(offer.contractAddress);
            if (edition.balanceOf(msg.sender, offer.tokenId) < offer.quantity) {
                revert NotTokenOwner();
            }
            if (!edition.isApprovedForAll(msg.sender, address(this))) {
                revert NFTNotApproved();
            }
        }

        // mark accepted before any transfers
        offer.status = OfferStatus.Accepted;

        // transfer token from seller to buyer
        if (offer.tokenType == TokenType.ERC721) {
            IERC721(offer.contractAddress).safeTransferFrom(
                msg.sender,
                offer.buyer,
                offer.tokenId
            );
        } else {
            IERC1155(offer.contractAddress).safeTransferFrom(
                msg.sender,
                offer.buyer,
                offer.tokenId,
                offer.quantity,
                ""
            );
        }

        // release escrow → fee manager splits to seller + protocol
        feeManager.collectSaleFee{value: offer.amount}(
            msg.sender,   // seller
            offer.amount
        );

        emit OfferAccepted(offerId, msg.sender);
    }

    // ─────────────────────────────────────────
    //  CANCEL OFFER
    //  buyer cancels their offer
    //  escrowed INJ returned to buyer
    // ─────────────────────────────────────────

    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];

        if (offer.offerId == 0) revert OfferNotFound();
        if (offer.buyer != msg.sender) revert NotOfferMaker();
        if (offer.status != OfferStatus.Active) revert OfferAlreadyAccepted();

        offer.status = OfferStatus.Cancelled;

        // return escrowed INJ to buyer
        (bool ok, ) = msg.sender.call{value: offer.amount}("");
        if (!ok) revert TransferFailed();

        emit OfferCancelled(offerId);
    }

    // ─────────────────────────────────────────
    //  SWEEP EXPIRED OFFERS
    //  anyone can call this to clean up expired offers
    //  returns escrowed INJ to buyers whose offers expired
    //  incentivize keepers to call this by adding a small tip
    // ─────────────────────────────────────────

    function sweepExpiredOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];

        if (offer.offerId == 0) revert OfferNotFound();
        if (offer.status != OfferStatus.Active) revert OfferAlreadyAccepted();
        if (block.timestamp <= offer.expiresAt) revert OfferNotFound();

        offer.status = OfferStatus.Expired;

        // return escrowed INJ to original buyer
        (bool ok, ) = offer.buyer.call{value: offer.amount}("");
        if (!ok) revert TransferFailed();

        emit OfferCancelled(offerId);
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

    function getOffer(
        uint256 offerId
    ) external view returns (Offer memory) {
        if (_offers[offerId].offerId == 0) revert OfferNotFound();
        return _offers[offerId];
    }

    function getOffersByBuyer(
        address buyer
    ) external view returns (Offer[] memory) {
        uint256[] memory ids = _buyerOffers[buyer];
        Offer[] memory result = new Offer[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _offers[ids[i]];
        }
        return result;
    }

    function getOffersByToken(
        address contractAddress,
        uint256 tokenId
    ) external view returns (Offer[] memory) {
        uint256[] memory ids = _tokenOffers[contractAddress][tokenId];
        Offer[] memory result = new Offer[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _offers[ids[i]];
        }
        return result;
    }

    function isOfferActive(
        uint256 offerId
    ) external view returns (bool) {
        Offer memory offer = _offers[offerId];
        return
            offer.status == OfferStatus.Active &&
            block.timestamp <= offer.expiresAt;
    }

    // ─────────────────────────────────────────
    //  RECEIVE
    //  accept INJ sent with makeOffer
    // ─────────────────────────────────────────

    receive() external payable {}
}
