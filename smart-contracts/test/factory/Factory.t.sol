// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/factory/Factory.sol";
import "../../src/core/NFT.sol";
import "../../src/core/Edition.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/minters/FreeMinter.sol";
import "../../src/minters/TimedMinter.sol";
import "../../src/minters/AllowlistMinter.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract FactoryTest is Test {

    Factory          public factory;
    FeeManager       public feeManager;
    FixedPriceMinter public fixedPriceMinter;
    FreeMinter       public freeMinter;
    TimedMinter      public timedMinter;
    AllowlistMinter  public allowlistMinter;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public creator  = makeAddr("creator");
    address public buyer    = makeAddr("buyer");

    uint256 public constant MINT_PRICE = 0.01 ether;

    // ─────────────────────────────────────────
    //  SETUP
    // ─────────────────────────────────────────

    function setUp() public {
        vm.startPrank(owner);

        feeManager       = new FeeManager(treasury, 250);
        fixedPriceMinter = new FixedPriceMinter(address(feeManager), owner);
        freeMinter       = new FreeMinter(address(feeManager), owner);
        timedMinter      = new TimedMinter(address(feeManager), owner);
        allowlistMinter  = new AllowlistMinter(address(feeManager), owner);

        factory = new Factory(
            address(feeManager),
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            owner
        );

        vm.stopPrank();
    }

    // ─────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────

    function _defaultNFTConfig() internal pure returns (NFTConfig memory) {
        return NFTConfig({
            name:            "Forge Drop",
            symbol:          "FRG",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "ipfs://QmHidden",
            maxSupply:       100,
            mintPrice:       MINT_PRICE,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     5,
            royaltyBps:      500,
            royaltyReceiver: address(0x1234),
            isRevealed:      false
        });
    }

    function _defaultEditionConfig() internal pure returns (EditionConfig memory) {
        return EditionConfig({
            name:            "Drop 1",
            uri:             "ipfs://QmEdition/",
            tokenId:         1,
            maxSupply:       0,
            mintPrice:       MINT_PRICE,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     0,
            royaltyBps:      500,
            royaltyReceiver: address(0x1234)
        });
    }

    function _fixedPriceMinterData() internal pure returns (bytes memory) {
        return abi.encode(
            FixedPriceConfig({ price: MINT_PRICE, maxPerWallet: 5 })
        );
    }

    function _freeMinterData() internal pure returns (bytes memory) {
        return abi.encode(uint256(5)); // walletLimit = 5
    }

    function _timedMinterData() internal view returns (bytes memory) {
        return abi.encode(
            TimedConfig({
                price:        MINT_PRICE,
                startTime:    block.timestamp,
                endTime:      block.timestamp + 1 days,
                maxPerWallet: 5
            })
        );
    }

    function _allowlistMinterData() internal pure returns (bytes memory) {
        return abi.encode(
            AllowlistConfig({
                price:        MINT_PRICE,
                merkleRoot:   keccak256(abi.encodePacked("root")),
                maxPerWallet: 1
            })
        );
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT TESTS
    // ─────────────────────────────────────────

    function test_DeploymentSetsAddresses() public view {
        assertEq(address(factory.feeManager()),       address(feeManager));
        assertEq(address(factory.fixedPriceMinter()), address(fixedPriceMinter));
        assertEq(address(factory.freeMinter()),       address(freeMinter));
        assertEq(address(factory.timedMinter()),      address(timedMinter));
        assertEq(address(factory.allowlistMinter()),  address(allowlistMinter));
    }

    function test_DeployRevertsZeroAddress() public {
        vm.expectRevert(ZeroAddress.selector);
        new Factory(
            address(0),
            address(fixedPriceMinter),
            address(freeMinter),
            address(timedMinter),
            address(allowlistMinter),
            owner
        );
    }

    // ─────────────────────────────────────────
    //  DEPLOY NFT DROP — FIXED PRICE
    // ─────────────────────────────────────────

    function test_DeployNFTDropFixedPrice() public {
        vm.prank(creator);
        address collection = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        // collection address returned
        assertTrue(collection != address(0));

        // minter set on NFT contract
        NFT nft = NFT(payable(collection));
        assertEq(nft.minter(), address(fixedPriceMinter));

        // factory stored the record
        DeployedCollection memory record = factory.getCollection(collection);
        assertEq(record.creator,         creator);
        assertEq(record.contractAddress, collection);
        assertEq(uint8(record.tokenType),   uint8(TokenType.ERC721));
        assertEq(uint8(record.minterType),  uint8(MinterType.FixedPrice));
    }

    function test_DeployNFTDropFree() public {
        vm.prank(creator);
        address collection = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        NFT nft = NFT(payable(collection));
        assertEq(nft.minter(), address(freeMinter));

        DeployedCollection memory record = factory.getCollection(collection);
        assertEq(uint8(record.minterType), uint8(MinterType.Free));
    }

    function test_DeployNFTDropTimed() public {
        vm.prank(creator);
        address collection = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.Timed,
            _timedMinterData()
        );

        NFT nft = NFT(payable(collection));
        assertEq(nft.minter(), address(timedMinter));

        DeployedCollection memory record = factory.getCollection(collection);
        assertEq(uint8(record.minterType), uint8(MinterType.Timed));
    }

    function test_DeployNFTDropAllowlist() public {
        vm.prank(creator);
        address collection = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.Allowlist,
            _allowlistMinterData()
        );

        NFT nft = NFT(payable(collection));
        assertEq(nft.minter(), address(allowlistMinter));

        DeployedCollection memory record = factory.getCollection(collection);
        assertEq(uint8(record.minterType), uint8(MinterType.Allowlist));
    }

    function test_DeployNFTDropRevertsEmptyName() public {
        NFTConfig memory cfg = _defaultNFTConfig();
        cfg.name = "";

        vm.prank(creator);
        vm.expectRevert(DeploymentFailed.selector);
        factory.deployNFTDrop(cfg, MinterType.FixedPrice, _fixedPriceMinterData());
    }

    // ─────────────────────────────────────────
    //  DEPLOY EDITION — ALL MINTER TYPES
    // ─────────────────────────────────────────

    function test_DeployEditionFixedPrice() public {
        vm.prank(creator);
        address collection = factory.deployEdition(
            "Forge Editions",
            _defaultEditionConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        assertTrue(collection != address(0));

        Edition edition = Edition(payable(collection));
        assertEq(edition.minter(), address(fixedPriceMinter));

        // first edition was created
        EditionConfig memory edCfg = edition.editionConfig(1);
        assertEq(edCfg.uri, "ipfs://QmEdition/");

        DeployedCollection memory record = factory.getCollection(collection);
        assertEq(uint8(record.tokenType),  uint8(TokenType.ERC1155));
        assertEq(uint8(record.minterType), uint8(MinterType.FixedPrice));
    }

    function test_DeployEditionFree() public {
        vm.prank(creator);
        address collection = factory.deployEdition(
            "Free Editions",
            _defaultEditionConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        Edition edition = Edition(payable(collection));
        assertEq(edition.minter(), address(freeMinter));
    }

    function test_DeployEditionTimed() public {
        vm.prank(creator);
        address collection = factory.deployEdition(
            "Timed Editions",
            _defaultEditionConfig(),
            MinterType.Timed,
            _timedMinterData()
        );

        Edition edition = Edition(payable(collection));
        assertEq(edition.minter(), address(timedMinter));
    }

    function test_DeployEditionRevertsEmptyName() public {
        vm.prank(creator);
        vm.expectRevert(DeploymentFailed.selector);
        factory.deployEdition(
            "",
            _defaultEditionConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );
    }

    // ─────────────────────────────────────────
    //  CREATOR COLLECTIONS TRACKING
    // ─────────────────────────────────────────

    function test_CreatorCollectionsTracked() public {
        vm.startPrank(creator);

        address col1 = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        address col2 = factory.deployEdition(
            "My Editions",
            _defaultEditionConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        vm.stopPrank();

        address[] memory collections = factory.getCreatorCollections(creator);
        assertEq(collections.length, 2);
        assertEq(collections[0], col1);
        assertEq(collections[1], col2);
    }

    function test_TotalCollectionsTracked() public {
        assertEq(factory.getTotalCollections(), 0);

        vm.prank(creator);
        factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        assertEq(factory.getTotalCollections(), 1);

        vm.prank(creator);
        factory.deployEdition(
            "My Editions",
            _defaultEditionConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        assertEq(factory.getTotalCollections(), 2);
    }

    function test_GetAllCollections() public {
        vm.startPrank(creator);

        factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        factory.deployEdition(
            "My Editions",
            _defaultEditionConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        vm.stopPrank();

        DeployedCollection[] memory all = factory.getAllCollections();
        assertEq(all.length, 2);
        assertEq(all[0].creator, creator);
        assertEq(all[1].creator, creator);
    }

    // ─────────────────────────────────────────
    //  MULTIPLE CREATORS
    // ─────────────────────────────────────────

    function test_MultipleCreatorsDeployIndependently() public {
        address creator2 = makeAddr("creator2");

        vm.prank(creator);
        factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        vm.prank(creator2);
        factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.Free,
            _freeMinterData()
        );

        address[] memory creator1Collections  = factory.getCreatorCollections(creator);
        address[] memory creator2Collections  = factory.getCreatorCollections(creator2);

        assertEq(creator1Collections.length, 1);
        assertEq(creator2Collections.length, 1);
        assertEq(factory.getTotalCollections(), 2);
    }

    // ─────────────────────────────────────────
    //  END TO END — DEPLOY + MINT
    //  full flow: factory deploys → buyer mints
    // ─────────────────────────────────────────

    function test_E2E_DeployAndMintNFT() public {
        // creator deploys collection via factory
        vm.prank(creator);
        address collection = factory.deployNFTDrop(
            _defaultNFTConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        // buyer mints from it
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedPriceMinter.mintNFT{value: total}(collection, buyer, 1);

        NFT nft = NFT(payable(collection));
        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.totalMinted(), 1);
    }

    function test_E2E_DeployAndMintEdition() public {
        // creator deploys edition via factory
        vm.prank(creator);
        address collection = factory.deployEdition(
            "Forge Editions",
            _defaultEditionConfig(),
            MinterType.FixedPrice,
            _fixedPriceMinterData()
        );

        // buyer mints from it
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedPriceMinter.mintEdition{value: total}(collection, buyer, 1, 1);

        Edition edition = Edition(payable(collection));
        assertEq(edition.balanceOf(buyer, 1), 1);
        assertEq(edition.totalMinted(1), 1);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function test_UpdateFeeManager() public {
        address newFeeManager = makeAddr("newFeeManager");
        vm.prank(owner);
        factory.updateFeeManager(newFeeManager);
        assertEq(address(factory.feeManager()), newFeeManager);
    }

    function test_UpdateFeeManagerRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        factory.updateFeeManager(address(0));
    }

    function test_UpdateFeeManagerRevertsIfNotOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        factory.updateFeeManager(makeAddr("newFeeManager"));
    }

    function test_UpdateMinters() public {
        address newMinter = makeAddr("newMinter");

        vm.startPrank(owner);
        factory.updateFixedPriceMinter(newMinter);
        factory.updateFreeMinter(newMinter);
        factory.updateTimedMinter(newMinter);
        factory.updateAllowlistMinter(newMinter);
        vm.stopPrank();

        assertEq(address(factory.fixedPriceMinter()), newMinter);
        assertEq(address(factory.freeMinter()),       newMinter);
        assertEq(address(factory.timedMinter()),      newMinter);
        assertEq(address(factory.allowlistMinter()),  newMinter);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MultipleDeploysTrackedCorrectly(
        uint8 numDrops
    ) public {
        vm.assume(numDrops > 0 && numDrops <= 20);

        for (uint8 i = 0; i < numDrops; i++) {
            NFTConfig memory cfg = _defaultNFTConfig();
            cfg.symbol = string(abi.encodePacked("FRG", i));

            vm.prank(creator);
            factory.deployNFTDrop(
                cfg,
                MinterType.FixedPrice,
                _fixedPriceMinterData()
            );
        }

        assertEq(factory.getTotalCollections(), numDrops);
        assertEq(
            factory.getCreatorCollections(creator).length,
            numDrops
        );
    }
}
