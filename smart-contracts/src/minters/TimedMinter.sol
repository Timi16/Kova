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

contract TimedMinter is IMinter, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // collection → timed config
    mapping(address => TimedConfig) private _configs;

    // collection → paused
    mapping(address => bool) private _paused;

    // collection → wallet → minted quantity via this minter
    mapping(address => mapping(address => uint256)) private _walletMints;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address feeManager_, address owner_) Ownable(owner_) {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    // ─────────────────────────────────────────
    //  REGISTER COLLECTION
    // ─────────────────────────────────────────

    function registerNFT(
        address collection,
        TimedConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        if (config_.endTime <= config_.startTime) revert InvalidMintAmount(0);
        _configs[collection] = config_;
    }

    function registerEdition(
        address collection,
        TimedConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        if (config_.endTime <= config_.startTime) revert InvalidMintAmount(0);
        _configs[collection] = config_;
    }

    // ─────────────────────────────────────────
    //  MINT NFT  (ERC721)
    //  enforces time window at minter level
    //  on top of any window set in the NFT contract
    // ─────────────────────────────────────────

    function mintNFT(
        address collection,
        address to,
        uint256 quantity
    ) external payable nonReentrant {
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        TimedConfig memory cfg = _configs[collection];

        // enforce time window
        if (block.timestamp < cfg.startTime) revert MintNotStarted();
        if (block.timestamp > cfg.endTime) revert MintEnded();
        if (
            cfg.maxPerWallet != 0 &&
            _walletMints[collection][to] + quantity > cfg.maxPerWallet
        ) {
            revert WalletMintLimitReached();
        }

        uint256 totalCost = cfg.price * quantity;
        if (msg.value != totalCost) revert IncorrectPayment(totalCost, msg.value);

        feeManager.collectMintFee{value: msg.value}(
            INFT(collection).config().royaltyReceiver,
            msg.value,
            quantity
        );

        INFT(collection).mint(to, quantity);
        _walletMints[collection][to] += quantity;

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

        TimedConfig memory cfg = _configs[collection];

        if (block.timestamp < cfg.startTime) revert MintNotStarted();
        if (block.timestamp > cfg.endTime) revert MintEnded();
        if (
            cfg.maxPerWallet != 0 &&
            _walletMints[collection][to] + quantity > cfg.maxPerWallet
        ) {
            revert WalletMintLimitReached();
        }

        uint256 totalCost = cfg.price * quantity;
        if (msg.value != totalCost) revert IncorrectPayment(totalCost, msg.value);

        IEdition edition = IEdition(collection);
        EditionConfig memory edCfg = edition.editionConfig(tokenId);

        feeManager.collectMintFee{value: msg.value}(
            edCfg.royaltyReceiver,
            msg.value,
            quantity
        );

        edition.mint(to, tokenId, quantity);
        _walletMints[collection][to] += quantity;

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

    function updateWindow(
        address collection,
        uint256 newStart,
        uint256 newEnd
    ) external onlyOwner {
        if (newEnd <= newStart) revert InvalidMintAmount(0);
        _configs[collection].startTime = newStart;
        _configs[collection].endTime = newEnd;
    }

    function updateFeeManager(address feeManager_) external onlyOwner {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getMintPrice(address collection) external view returns (uint256) {
        return _configs[collection].price;
    }

    function isPaused(address collection) external view returns (bool) {
        return _paused[collection];
    }

    function isWindowOpen(address collection) external view returns (bool) {
        TimedConfig memory cfg = _configs[collection];
        return block.timestamp >= cfg.startTime && block.timestamp <= cfg.endTime;
    }

    function getConfig(
        address collection
    ) external view returns (TimedConfig memory) {
        return _configs[collection];
    }

    function minterType() external pure returns (MinterType) {
        return MinterType.Timed;
    }
}
