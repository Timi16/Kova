// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IMinter.sol";
import "../interfaces/INFT.sol";
import "../interfaces/IEdition.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract FixedPriceMinter is IMinter, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // collection address → fixed price config
    mapping(address => FixedPriceConfig) private _configs;

    // collection address → paused state
    mapping(address => bool) private _paused;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address feeManager_, address owner_) Ownable(owner_) {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    // ─────────────────────────────────────────
    //  REGISTER COLLECTION
    //  called by Factory after deploying NFT/Edition
    //  sets the price config for that collection
    // ─────────────────────────────────────────

    function registerNFT(
        address collection,
        FixedPriceConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        _configs[collection] = config_;
    }

    function registerEdition(
        address collection,
        FixedPriceConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        _configs[collection] = config_;
    }

    // ─────────────────────────────────────────
    //  MINT NFT  (ERC721)
    // ─────────────────────────────────────────

    function mintNFT(
        address collection,
        address to,
        uint256 quantity
    ) external payable nonReentrant {
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        FixedPriceConfig memory cfg = _configs[collection];

        uint256 totalCost = cfg.price * quantity;
        if (msg.value != totalCost) revert IncorrectPayment(totalCost, msg.value);

        // route payment through fee manager
        // fee manager splits → creator + protocol
        feeManager.collectMintFee{value: msg.value}(
            INFT(collection).config().royaltyReceiver,
            msg.value,
            quantity
        );

        // tell NFT contract to issue tokens
        INFT(collection).mint(to, quantity);

        emit MintExecuted(collection, to, 0, quantity, msg.value);
    }

    // ─────────────────────────────────────────
    //  MINT EDITION  (ERC1155)
    // ─────────────────────────────────────────

    function mintEdition(
        address collection,
        address to,
        uint256 tokenId,
        uint256 quantity
    ) external payable nonReentrant {
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        FixedPriceConfig memory cfg = _configs[collection];

        uint256 totalCost = cfg.price * quantity;
        if (msg.value != totalCost) revert IncorrectPayment(totalCost, msg.value);

        // get creator from edition config
        IEdition edition = IEdition(collection);
        EditionConfig memory edCfg = edition.editionConfig(tokenId);

        // route payment through fee manager
        feeManager.collectMintFee{value: msg.value}(
            edCfg.royaltyReceiver,
            msg.value,
            quantity
        );

        // tell Edition contract to issue tokens
        edition.mint(to, tokenId, quantity);

        emit MintExecuted(collection, to, tokenId, quantity, msg.value);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function pause(address collection) external onlyOwner {
        _paused[collection] = true;
        emit MintPausedEvent(collection);
    }

    function unpause(address collection) external onlyOwner {
        _paused[collection] = false;
        emit MintUnpaused(collection);
    }

    function updateFeeManager(address feeManager_) external onlyOwner {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getMintPrice(
        address collection
    ) external view returns (uint256) {
        return _configs[collection].price;
    }

    function isPaused(
        address collection
    ) external view returns (bool) {
        return _paused[collection];
    }

    function minterType() external pure returns (MinterType) {
        return MinterType.FixedPrice;
    }

    function getConfig(
        address collection
    ) external view returns (FixedPriceConfig memory) {
        return _configs[collection];
    }
}
