// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../interfaces/IMinter.sol";
import "../interfaces/INFT.sol";
import "../interfaces/IEdition.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract AllowlistMinter is IMinter, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager public feeManager;

    // collection → allowlist config
    mapping(address => AllowlistConfig) private _configs;

    // collection → paused
    mapping(address => bool) private _paused;

    // collection → wallet → has claimed
    // prevents double claiming from allowlist
    mapping(address => mapping(address => bool)) private _claimed;

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
        AllowlistConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        if (config_.merkleRoot == bytes32(0)) revert InvalidMerkleProof();
        _configs[collection] = config_;
    }

    function registerEdition(
        address collection,
        AllowlistConfig calldata config_
    ) external onlyOwner {
        if (collection == address(0)) revert ZeroAddress();
        if (config_.merkleRoot == bytes32(0)) revert InvalidMerkleProof();
        _configs[collection] = config_;
    }

    // ─────────────────────────────────────────
    //  VERIFY PROOF
    //  leaf = keccak256(abi.encodePacked(wallet))
    //  merkle root is set per collection
    // ─────────────────────────────────────────

    function _verifyProof(
        address collection,
        address wallet,
        bytes32[] calldata proof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(wallet));
        return MerkleProof.verify(proof, _configs[collection].merkleRoot, leaf);
    }

    // ─────────────────────────────────────────
    //  MINT NFT  (ERC721)
    // ─────────────────────────────────────────

    function mintNFT(
        address collection,
        address to,
        uint256 quantity
    ) external payable nonReentrant {
        // use overloaded version with proof
        revert NotAllowlisted(); // must use mintNFTAllowlist
    }

    function mintNFTAllowlist(
        address collection,
        address to,
        uint256 quantity,
        bytes32[] calldata proof
    ) external payable nonReentrant {
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        // verify merkle proof
        if (!_verifyProof(collection, to, proof)) revert InvalidMerkleProof();

        // one claim per wallet
        if (_claimed[collection][to]) revert WalletMintLimitReached();
        _claimed[collection][to] = true;

        AllowlistConfig memory cfg = _configs[collection];

        uint256 totalCost = cfg.price * quantity;
        if (msg.value != totalCost) revert IncorrectPayment(totalCost, msg.value);

        feeManager.collectMintFee{value: msg.value}(
            INFT(collection).config().royaltyReceiver,
            msg.value,
            quantity
        );

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
        revert NotAllowlisted(); // must use mintEditionAllowlist
    }

    function mintEditionAllowlist(
        address collection,
        address to,
        uint256 tokenId,
        uint256 quantity,
        bytes32[] calldata proof
    ) external payable nonReentrant {
        if (_paused[collection]) revert MintPaused();
        if (quantity == 0) revert InvalidMintAmount(quantity);

        if (!_verifyProof(collection, to, proof)) revert InvalidMerkleProof();

        if (_claimed[collection][to]) revert WalletMintLimitReached();
        _claimed[collection][to] = true;

        AllowlistConfig memory cfg = _configs[collection];

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

    function updateMerkleRoot(
        address collection,
        bytes32 newRoot
    ) external onlyOwner {
        if (newRoot == bytes32(0)) revert InvalidMerkleProof();
        _configs[collection].merkleRoot = newRoot;
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

    function hasClaimed(
        address collection,
        address wallet
    ) external view returns (bool) {
        return _claimed[collection][wallet];
    }

    function getConfig(
        address collection
    ) external view returns (AllowlistConfig memory) {
        return _configs[collection];
    }

    function minterType() external pure returns (MinterType) {
        return MinterType.Allowlist;
    }
}
