// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IEdition.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract Edition is IEdition, ERC1155, ERC2981, Ownable, ReentrancyGuard, Pausable {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    // contract level name — ERC1155 has no name by default
    string public name;

    // the minter contract — only this can call mint()
    address public minter;

    // tokenId → edition config
    mapping(uint256 => EditionConfig) private _editions;

    // tokenId → total minted for that edition
    mapping(uint256 => uint256) private _totalMinted;

    // tokenId → wallet → mints for that edition
    mapping(uint256 => mapping(address => uint256)) private _walletMints;

    // tokenId → whether edition is manually closed
    mapping(uint256 => bool) private _closed;

    // track all edition token ids created
    uint256[] private _editionIds;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(
        string memory name_,
        address creator
    )
        ERC1155("")
        Ownable(creator)
    {
        name = name_;
    }

    // ─────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotAuthorizedMinter();
        _;
    }

    modifier editionExists(uint256 tokenId) {
        if (bytes(_editions[tokenId].uri).length == 0) revert ListingNotFound();
        _;
    }

    // ─────────────────────────────────────────
    //  EDITION MANAGEMENT
    //  creator can have multiple editions in one contract
    //  each edition is a different tokenId
    //  e.g tokenId 1 = "Summer Collection"
    //      tokenId 2 = "Winter Collection"
    // ─────────────────────────────────────────

    function createEdition(
        EditionConfig calldata config_
    ) external onlyOwner {
        if (bytes(config_.uri).length == 0) revert EmptyBaseURI();
        if (config_.royaltyReceiver == address(0)) revert ZeroAddress();
        if (config_.royaltyBps > 1000) revert FeeTooHigh();

        // dont allow overwriting an existing edition
        if (bytes(_editions[config_.tokenId].uri).length != 0) revert DeploymentFailed();

        _editions[config_.tokenId] = config_;
        _editionIds.push(config_.tokenId);

        // set per token royalty via ERC2981
        _setTokenRoyalty(
            config_.tokenId,
            config_.royaltyReceiver,
            config_.royaltyBps
        );

        emit EditionCreated(config_.tokenId, config_.uri, config_.maxSupply);
    }

    function closeEdition(
        uint256 tokenId
    ) external onlyOwner editionExists(tokenId) {
        _closed[tokenId] = true;
        emit EditionClosed(tokenId);
    }

    // ─────────────────────────────────────────
    //  MINTER ASSIGNMENT
    // ─────────────────────────────────────────

    function setMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        minter = minter_;
        emit MinterSet(minter_);
    }

    // ─────────────────────────────────────────
    //  MINT
    //  only callable by assigned minter contract
    //  minter handles all payment + strategy logic
    // ─────────────────────────────────────────

    function mint(
        address to,
        uint256 tokenId,
        uint256 quantity
    ) external payable onlyMinter whenNotPaused nonReentrant editionExists(tokenId) {
        if (quantity == 0) revert InvalidMintAmount(quantity);

        EditionConfig memory ed = _editions[tokenId];

        // check if edition is manually closed
        if (_closed[tokenId]) revert MintEnded();

        // check mint window
        if (ed.mintStart != 0 && block.timestamp < ed.mintStart) {
            revert MintNotStarted();
        }
        if (ed.mintEnd != 0 && block.timestamp > ed.mintEnd) {
            revert MintEnded();
        }

        // check max supply — 0 means unlimited open edition
        if (ed.maxSupply != 0) {
            if (_totalMinted[tokenId] + quantity > ed.maxSupply) {
                revert MaxSupplyReached();
            }
        }

        // check wallet limit — 0 means no limit
        if (ed.walletLimit != 0) {
            if (_walletMints[tokenId][to] + quantity > ed.walletLimit) {
                revert WalletMintLimitReached();
            }
        }

        // mint
        _mint(to, tokenId, quantity, "");

        _totalMinted[tokenId] += quantity;
        _walletMints[tokenId][to] += quantity;

        emit EditionMinted(to, tokenId, quantity);
    }

    // ─────────────────────────────────────────
    //  FUNDS
    // ─────────────────────────────────────────

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert WithdrawFailed();
        (bool ok, ) = owner().call{value: balance}("");
        if (!ok) revert WithdrawFailed();
        emit Withdrawn(owner(), balance);
    }

    // ─────────────────────────────────────────
    //  PAUSE
    // ─────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function editionConfig(
        uint256 tokenId
    ) external view returns (EditionConfig memory) {
        return _editions[tokenId];
    }

    function totalMinted(
        uint256 tokenId
    ) external view returns (uint256) {
        return _totalMinted[tokenId];
    }

    function walletMints(
        address wallet,
        uint256 tokenId
    ) external view returns (uint256) {
        return _walletMints[tokenId][wallet];
    }

    function isEditionOpen(
        uint256 tokenId
    ) external view returns (bool) {
        if (_closed[tokenId]) return false;

        EditionConfig memory ed = _editions[tokenId];

        if (bytes(ed.uri).length == 0) return false;

        if (ed.mintStart != 0 && block.timestamp < ed.mintStart) return false;
        if (ed.mintEnd != 0 && block.timestamp > ed.mintEnd) return false;

        if (ed.maxSupply != 0 && _totalMinted[tokenId] >= ed.maxSupply) return false;

        return true;
    }

    function getAllEditionIds() external view returns (uint256[] memory) {
        return _editionIds;
    }

    // ─────────────────────────────────────────
    //  METADATA
    //  each tokenId has its own URI
    //  set in EditionConfig at creation time
    // ─────────────────────────────────────────

    function uri(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (bytes(_editions[tokenId].uri).length == 0) revert ListingNotFound();
        return _editions[tokenId].uri;
    }

    // ─────────────────────────────────────────
    //  OVERRIDES
    // ─────────────────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // allow contract to receive INJ/ETH from minter
    receive() external payable {}
}