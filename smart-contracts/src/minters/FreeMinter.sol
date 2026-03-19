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

contract FreeMinter is IMinter, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // collection → registered
    mapping(address => bool) private _registered;

    // collection → max per wallet
    mapping(address => uint256) private _walletLimits;

    // collection → wallet → minted quantity
    mapping(address => mapping(address => uint256)) private _walletMints;

    // collection → paused
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
    // ─────────────────────────────────────────

    function registerNFT(
        address collection,
        uint256 walletLimit
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        _registered[collection] = true;
        _walletLimits[collection] = walletLimit;
    }

    function registerEdition(
        address collection,
        uint256 walletLimit
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        _registered[collection] = true;
        _walletLimits[collection] = walletLimit;
    }

    // ─────────────────────────────────────────
    //  MINT NFT  (ERC721)
    //  caller only pays the flat protocol fee
    //  creator gets nothing from mint — free drop
    // ─────────────────────────────────────────

    function mintNFT(
        address collection,
        address to,
        uint256 quantity
    ) external payable nonReentrant {
        if (!_registered[collection]) revert NotAuthorizedMinter();
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        uint256 walletLimit = _walletLimits[collection];
        uint256 walletMinted = _walletMints[collection][to];
        if (
            walletLimit != 0 &&
            walletMinted + quantity > walletLimit
        ) {
            revert WalletMintLimitReached();
        }

        // caller only pays flat fee × quantity
        IFeeManager fm = feeManager;
        uint256 flatFee = fm.mintFlatFee();
        uint256 totalFee = flatFee * quantity;

        if (msg.value != totalFee) revert IncorrectPayment(totalFee, msg.value);

        // all payment goes to protocol — creator gets 0 from mint
        if (msg.value > 0) {
            fm.collectMintFee{value: msg.value}(
                address(0), // no creator payout
                msg.value,
                quantity
            );
        }

        INFT(collection).mint(to, quantity);
        unchecked {
            _walletMints[collection][to] = walletMinted + quantity;
        }

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
        if (!_registered[collection]) revert NotAuthorizedMinter();
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        uint256 walletLimit = _walletLimits[collection];
        uint256 walletMinted = _walletMints[collection][to];
        if (
            walletLimit != 0 &&
            walletMinted + quantity > walletLimit
        ) {
            revert WalletMintLimitReached();
        }

        IFeeManager fm = feeManager;
        uint256 flatFee = fm.mintFlatFee();
        uint256 totalFee = flatFee * quantity;

        if (msg.value != totalFee) revert IncorrectPayment(totalFee, msg.value);

        if (msg.value > 0) {
            fm.collectMintFee{value: msg.value}(
                address(0),
                msg.value,
                quantity
            );
        }

        IEdition(collection).mint(to, tokenId, quantity);
        unchecked {
            _walletMints[collection][to] = walletMinted + quantity;
        }

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

    function getMintPrice(address) external pure returns (uint256) {
        return 0; // free
    }

    function isPaused(address collection) external view returns (bool) {
        return _paused[collection];
    }

    function minterType() external pure returns (MinterType) {
        return MinterType.Free;
    }
}
