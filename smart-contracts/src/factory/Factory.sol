// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/NFT.sol";
import "../core/Edition.sol";
import "../minters/FixedPriceMinter.sol";
import "../minters/FreeMinter.sol";
import "../minters/TimedMinter.sol";
import "../minters/AllowlistMinter.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract Factory is Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IFeeManager      public feeManager;
    FixedPriceMinter public fixedPriceMinter;
    FreeMinter       public freeMinter;
    TimedMinter      public timedMinter;
    AllowlistMinter  public allowlistMinter;

    // all deployed collections
    DeployedCollection[] private _collections;

    // creator → their collection addresses
    mapping(address => address[]) private _creatorCollections;

    // collection address → DeployedCollection index
    mapping(address => uint256) private _collectionIndex;

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

    event NFTDropDeployed(
        address indexed collection,
        address indexed creator,
        address indexed minter,
        MinterType minterType,
        string name
    );

    event EditionDeployed(
        address indexed collection,
        address indexed creator,
        address indexed minter,
        MinterType minterType,
        string name
    );

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(
        address feeManager_,
        address fixedPriceMinter_,
        address freeMinter_,
        address timedMinter_,
        address allowlistMinter_,
        address owner_
    ) Ownable(owner_) {
        if (feeManager_       == address(0)) revert ZeroAddress();
        if (fixedPriceMinter_ == address(0)) revert ZeroAddress();
        if (freeMinter_       == address(0)) revert ZeroAddress();
        if (timedMinter_      == address(0)) revert ZeroAddress();
        if (allowlistMinter_  == address(0)) revert ZeroAddress();

        feeManager       = IFeeManager(feeManager_);
        fixedPriceMinter = FixedPriceMinter(fixedPriceMinter_);
        freeMinter       = FreeMinter(freeMinter_);
        timedMinter      = TimedMinter(timedMinter_);
        allowlistMinter  = AllowlistMinter(allowlistMinter_);
    }

    // ─────────────────────────────────────────
    //  DEPLOY NFT DROP  (ERC721)
    //  creator calls this once to spin up
    //  a new NFT collection with their chosen
    //  minting strategy
    // ─────────────────────────────────────────

    function deployNFTDrop(
        NFTConfig calldata nftConfig,
        MinterType minterType,
        bytes calldata minterData   // encoded minter config
    ) external nonReentrant returns (address collection) {
        if (bytes(nftConfig.name).length == 0) revert DeploymentFailed();

        // deploy with factory as temporary owner for initialization
        NFT nft = new NFT(nftConfig, address(this));
        collection = address(nft);

        // wire up the minter based on creator's choice
        address minterAddr = _registerNFTWithMinter(
            collection,
            minterType,
            minterData
        );

        // assign minter to NFT contract
        nft.setMinter(minterAddr);

        // hand ownership to creator after setup
        nft.transferOwnership(msg.sender);

        // store deployment record
        _storeCollection(
            collection,
            msg.sender,
            minterAddr,
            TokenType.ERC721,
            minterType
        );

        emit NFTDropDeployed(
            collection,
            msg.sender,
            minterAddr,
            minterType,
            nftConfig.name
        );

        return collection;
    }

    // ─────────────────────────────────────────
    //  DEPLOY EDITION  (ERC1155)
    //  deploys the Edition contract
    //  creator can then call createEdition()
    //  on it to add individual token drops
    // ─────────────────────────────────────────

    function deployEdition(
        string calldata name,
        EditionConfig calldata firstEdition,  // first edition created on deploy
        MinterType minterType,
        bytes calldata minterData
    ) external nonReentrant returns (address collection) {
        if (bytes(name).length == 0) revert DeploymentFailed();

        // deploy with factory as temporary owner for initialization
        Edition edition = new Edition(name, address(this));
        collection = address(edition);

        // create the first edition immediately
        edition.createEdition(firstEdition);

        // wire up minter
        address minterAddr = _registerEditionWithMinter(
            collection,
            minterType,
            minterData
        );

        // assign minter to Edition contract
        edition.setMinter(minterAddr);

        // hand ownership to creator after setup
        edition.transferOwnership(msg.sender);

        // store deployment record
        _storeCollection(
            collection,
            msg.sender,
            minterAddr,
            TokenType.ERC1155,
            minterType
        );

        emit EditionDeployed(
            collection,
            msg.sender,
            minterAddr,
            minterType,
            name
        );

        return collection;
    }

    // ─────────────────────────────────────────
    //  INTERNAL — REGISTER NFT WITH MINTER
    //  decodes minterData and calls the right
    //  register function on the right minter
    // ─────────────────────────────────────────

    function _registerNFTWithMinter(
        address collection,
        MinterType minterType,
        bytes calldata minterData
    ) internal returns (address minterAddr) {
        if (minterType == MinterType.FixedPrice) {
            FixedPriceConfig memory cfg = abi.decode(
                minterData,
                (FixedPriceConfig)
            );
            fixedPriceMinter.registerNFT(collection, cfg);
            return address(fixedPriceMinter);

        } else if (minterType == MinterType.Free) {
            uint256 walletLimit = abi.decode(minterData, (uint256));
            freeMinter.registerNFT(collection, walletLimit);
            return address(freeMinter);

        } else if (minterType == MinterType.Timed) {
            TimedConfig memory cfg = abi.decode(minterData, (TimedConfig));
            timedMinter.registerNFT(collection, cfg);
            return address(timedMinter);

        } else if (minterType == MinterType.Allowlist) {
            AllowlistConfig memory cfg = abi.decode(
                minterData,
                (AllowlistConfig)
            );
            allowlistMinter.registerNFT(collection, cfg);
            return address(allowlistMinter);

        } else {
            revert InvalidMinterType();
        }
    }

    // ─────────────────────────────────────────
    //  INTERNAL — REGISTER EDITION WITH MINTER
    // ─────────────────────────────────────────

    function _registerEditionWithMinter(
        address collection,
        MinterType minterType,
        bytes calldata minterData
    ) internal returns (address minterAddr) {
        if (minterType == MinterType.FixedPrice) {
            FixedPriceConfig memory cfg = abi.decode(
                minterData,
                (FixedPriceConfig)
            );
            fixedPriceMinter.registerEdition(collection, cfg);
            return address(fixedPriceMinter);

        } else if (minterType == MinterType.Free) {
            uint256 walletLimit = abi.decode(minterData, (uint256));
            freeMinter.registerEdition(collection, walletLimit);
            return address(freeMinter);

        } else if (minterType == MinterType.Timed) {
            TimedConfig memory cfg = abi.decode(minterData, (TimedConfig));
            timedMinter.registerEdition(collection, cfg);
            return address(timedMinter);

        } else if (minterType == MinterType.Allowlist) {
            AllowlistConfig memory cfg = abi.decode(
                minterData,
                (AllowlistConfig)
            );
            allowlistMinter.registerEdition(collection, cfg);
            return address(allowlistMinter);

        } else {
            revert InvalidMinterType();
        }
    }

    // ─────────────────────────────────────────
    //  INTERNAL — STORE COLLECTION RECORD
    // ─────────────────────────────────────────

    function _storeCollection(
        address collection,
        address creator,
        address minter,
        TokenType tokenType,
        MinterType minterType
    ) internal {
        uint256 index = _collections.length;

        _collections.push(DeployedCollection({
            contractAddress: collection,
            creator:         creator,
            minter:          minter,
            tokenType:       tokenType,
            minterType:      minterType,
            deployedAt:      block.timestamp
        }));

        _creatorCollections[creator].push(collection);
        _collectionIndex[collection] = index;
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function updateFeeManager(address feeManager_) external onlyOwner {
        if (feeManager_ == address(0)) revert ZeroAddress();
        feeManager = IFeeManager(feeManager_);
    }

    function updateFixedPriceMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        fixedPriceMinter = FixedPriceMinter(minter_);
    }

    function updateFreeMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        freeMinter = FreeMinter(minter_);
    }

    function updateTimedMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        timedMinter = TimedMinter(minter_);
    }

    function updateAllowlistMinter(address minter_) external onlyOwner {
        if (minter_ == address(0)) revert ZeroAddress();
        allowlistMinter = AllowlistMinter(minter_);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getCollection(
        address collection
    ) external view returns (DeployedCollection memory) {
        uint256 index = _collectionIndex[collection];
        return _collections[index];
    }

    function getCreatorCollections(
        address creator
    ) external view returns (address[] memory) {
        return _creatorCollections[creator];
    }

    function getAllCollections()
        external
        view
        returns (DeployedCollection[] memory)
    {
        return _collections;
    }

    function getTotalCollections() external view returns (uint256) {
        return _collections.length;
    }
}
