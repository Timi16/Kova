// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/INFT.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract NFT is INFT, ERC721, ERC721Royalty, Ownable, ReentrancyGuard, Pausable {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    NFTConfig private _config;

    // the minter contract — only this address can call mint()
    address public minter;

    // token id counter — starts at 1
    uint256 private _nextTokenId;

    // total minted so far
    uint256 private _totalMinted;

    // track mints per wallet
    mapping(address => uint256) private _walletMints;

    // metadata frozen flag
    bool private _metadataFrozen;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(
        NFTConfig memory config_,
        address creator
    )
        ERC721(config_.name, config_.symbol)
        Ownable(creator)
    {
        if (config_.royaltyReceiver == address(0)) revert ZeroAddress();
        if (bytes(config_.baseURI).length == 0) revert EmptyBaseURI();
        if (config_.royaltyBps > 1000) revert FeeTooHigh(); // max 10% royalty

        _config = config_;
        _nextTokenId = 1;

        // set default royalty via ERC2981
        _setDefaultRoyalty(config_.royaltyReceiver, config_.royaltyBps);
    }

    // ─────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotAuthorizedMinter();
        _;
    }

    // ─────────────────────────────────────────
    //  MINT
    //  only callable by the assigned minter contract
    //  minter handles all payment + validation logic
    //  NFT just handles token issuance
    // ─────────────────────────────────────────

    function mint(
        address to,
        uint256 quantity
    ) external payable onlyMinter whenNotPaused nonReentrant {
        if (quantity == 0) revert InvalidMintAmount(quantity);

        // check supply cap — 0 means unlimited
        if (_config.maxSupply != 0) {
            if (_totalMinted + quantity > _config.maxSupply) revert MaxSupplyReached();
        }

        // check wallet limit — 0 means no limit
        if (_config.walletLimit != 0) {
            if (_walletMints[to] + quantity > _config.walletLimit) {
                revert WalletMintLimitReached();
            }
        }

        // check mint window
        if (_config.mintStart != 0 && block.timestamp < _config.mintStart) {
            revert MintNotStarted();
        }
        if (_config.mintEnd != 0 && block.timestamp > _config.mintEnd) {
            revert MintEnded();
        }

        // mint tokens
        uint256 fromTokenId = _nextTokenId;

        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _nextTokenId);
            _nextTokenId++;
        }

        _totalMinted += quantity;
        _walletMints[to] += quantity;

        if (quantity == 1) {
            emit Minted(to, fromTokenId, 1);
        } else {
            emit BatchMinted(to, fromTokenId, _nextTokenId - 1);
        }
    }

    // ─────────────────────────────────────────
    //  MINTER ASSIGNMENT
    //  called by Factory right after deployment
    //  can only be set once — owner sets it, locked after
    // ─────────────────────────────────────────

    function setMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        minter = minter_;
        emit MinterSet(minter_);
    }

    // ─────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────

    function reveal(string calldata newBaseURI) external onlyOwner {
        if (_metadataFrozen) revert MetadataFrozen();
        if (bytes(newBaseURI).length == 0) revert EmptyBaseURI();
        _config.baseURI = newBaseURI;
        _config.isRevealed = true;
        emit Revealed(newBaseURI);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        if (_metadataFrozen) revert MetadataFrozen();
        if (bytes(newBaseURI).length == 0) revert EmptyBaseURI();
        _config.baseURI = newBaseURI;
    }

    function freezeMetadata() external onlyOwner {
        _metadataFrozen = true;
        emit MetadataFrozenEvent();
    }

    // ─────────────────────────────────────────
    //  FUNDS
    //  creator withdraws their balance
    //  minter contract sends ETH/INJ here during mint
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

    function config() external view returns (NFTConfig memory) {
        return _config;
    }

    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

    function walletMints(address wallet) external view returns (uint256) {
        return _walletMints[wallet];
    }

    function isMetadataFrozen() external view returns (bool) {
        return _metadataFrozen;
    }

    // ─────────────────────────────────────────
    //  INTERNAL OVERRIDES
    // ─────────────────────────────────────────

    // return hiddenURI if not revealed yet
    // return baseURI + tokenId if revealed
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        if (!_config.isRevealed && bytes(_config.hiddenURI).length > 0) {
            return _config.hiddenURI;
        }

        return string(abi.encodePacked(_config.baseURI, "/", _uint256ToString(tokenId), ".json"));
    }

    // required override — ERC721 + ERC721Royalty both define supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ─────────────────────────────────────────
    //  UTILS
    // ─────────────────────────────────────────

    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // allow contract to receive INJ/ETH from minter
    receive() external payable {}
}