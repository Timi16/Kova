// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/Edition.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract EditionTest is Test {

    Edition public edition;

    address public owner   = makeAddr("owner");
    address public minter  = makeAddr("minter");
    address public buyer   = makeAddr("buyer");

    EditionConfig public defaultEdition;

    function setUp() public {
        vm.prank(owner);
        edition = new Edition("Forge Editions", owner);

        defaultEdition = EditionConfig({
            name:            "Summer Drop",
            uri:             "ipfs://QmEditionHash",
            tokenId:         1,
            maxSupply:       500,
            mintPrice:       0.01 ether,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     10,
            royaltyBps:      500,
            royaltyReceiver: owner
        });

        // create edition + assign minter
        vm.prank(owner);
        edition.createEdition(defaultEdition);

        vm.prank(owner);
        edition.setMinter(minter);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsName() public {
        assertEq(edition.name(), "Forge Editions");
    }

    // ─────────────────────────────────────────
    //  CREATE EDITION
    // ─────────────────────────────────────────

    function test_CreateEdition() public {
        EditionConfig memory cfg = edition.editionConfig(1);
        assertEq(cfg.uri,       "ipfs://QmEditionHash");
        assertEq(cfg.maxSupply, 500);
        assertEq(cfg.mintPrice, 0.01 ether);
    }

    function test_CreateMultipleEditions() public {
        EditionConfig memory second = defaultEdition;
        second.tokenId = 2;
        second.uri     = "ipfs://QmEdition2Hash";

        vm.prank(owner);
        edition.createEdition(second);

        uint256[] memory ids = edition.getAllEditionIds();
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function test_CreateEditionRevertsIfNotOwner() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId = 99;
        vm.prank(buyer);
        vm.expectRevert();
        edition.createEdition(cfg);
    }

    function test_CreateEditionRevertsEmptyURI() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId = 3;
        cfg.uri     = "";
        vm.prank(owner);
        vm.expectRevert(EmptyBaseURI.selector);
        edition.createEdition(cfg);
    }

    function test_CreateEditionRevertsZeroRoyaltyReceiver() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId         = 3;
        cfg.royaltyReceiver = address(0);
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        edition.createEdition(cfg);
    }

    function test_CreateEditionRevertsOverwrite() public {
        // tokenId 1 already exists
        vm.prank(owner);
        vm.expectRevert(DeploymentFailed.selector);
        edition.createEdition(defaultEdition);
    }

    // ─────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────

    function test_MintSingle() public {
        vm.prank(minter);
        edition.mint(buyer, 1, 1);

        assertEq(edition.balanceOf(buyer, 1), 1);
        assertEq(edition.totalMinted(1), 1);
        assertEq(edition.walletMints(buyer, 1), 1);
    }

    function test_MintBatch() public {
        vm.prank(minter);
        edition.mint(buyer, 1, 5);

        assertEq(edition.balanceOf(buyer, 1), 5);
        assertEq(edition.totalMinted(1), 5);
    }

    function test_MintRevertsIfNotMinter() public {
        vm.prank(buyer);
        vm.expectRevert(NotAuthorizedMinter.selector);
        edition.mint(buyer, 1, 1);
    }

    function test_MintRevertsZeroQuantity() public {
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(InvalidMintAmount.selector, 0));
        edition.mint(buyer, 1, 0);
    }

    function test_MintRevertsMaxSupplyReached() public {
        vm.prank(minter);
        edition.mint(buyer, 1, 500);

        vm.prank(minter);
        vm.expectRevert(MaxSupplyReached.selector);
        edition.mint(buyer, 1, 1);
    }

    function test_MintRevertsWalletLimitReached() public {
        vm.prank(minter);
        edition.mint(buyer, 1, 10);

        vm.prank(minter);
        vm.expectRevert(WalletMintLimitReached.selector);
        edition.mint(buyer, 1, 1);
    }

    function test_MintRevertsBeforeStart() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId   = 2;
        cfg.mintStart = block.timestamp + 1 days;

        vm.prank(owner);
        edition.createEdition(cfg);

        vm.prank(minter);
        vm.expectRevert(MintNotStarted.selector);
        edition.mint(buyer, 2, 1);
    }

    function test_MintRevertsAfterEnd() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId  = 2;
        cfg.mintStart = block.timestamp;
        cfg.mintEnd   = block.timestamp + 1 days;

        vm.prank(owner);
        edition.createEdition(cfg);

        vm.warp(block.timestamp + 2 days);

        vm.prank(minter);
        vm.expectRevert(MintEnded.selector);
        edition.mint(buyer, 2, 1);
    }

    function test_MintRevertsWhenPaused() public {
        vm.prank(owner);
        edition.pause();

        vm.prank(minter);
        vm.expectRevert();
        edition.mint(buyer, 1, 1);
    }

    // ─────────────────────────────────────────
    //  CLOSE EDITION
    // ─────────────────────────────────────────

    function test_CloseEdition() public {
        vm.prank(owner);
        edition.closeEdition(1);

        assertFalse(edition.isEditionOpen(1));

        vm.prank(minter);
        vm.expectRevert(MintEnded.selector);
        edition.mint(buyer, 1, 1);
    }

    function test_CloseEditionRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        edition.closeEdition(1);
    }

    // ─────────────────────────────────────────
    //  IS EDITION OPEN
    // ─────────────────────────────────────────

    function test_IsEditionOpen() public {
        assertTrue(edition.isEditionOpen(1));
    }

    function test_IsEditionOpenReturnsFalseAfterEnd() public {
        EditionConfig memory cfg = defaultEdition;
        cfg.tokenId  = 2;
        cfg.mintEnd  = block.timestamp + 1 days;

        vm.prank(owner);
        edition.createEdition(cfg);

        assertTrue(edition.isEditionOpen(2));

        vm.warp(block.timestamp + 2 days);

        assertFalse(edition.isEditionOpen(2));
    }

    function test_IsEditionOpenReturnsFalseIfSupplyExhausted() public {
        vm.prank(minter);
        edition.mint(buyer, 1, 500);
        assertFalse(edition.isEditionOpen(1));
    }

    // ─────────────────────────────────────────
    //  URI
    // ─────────────────────────────────────────

    function test_URI() public {
        assertEq(edition.uri(1), "ipfs://QmEditionHash");
    }

    function test_URIRevertsForNonExistentEdition() public {
        vm.expectRevert(ListingNotFound.selector);
        edition.uri(999);
    }

    // ─────────────────────────────────────────
    //  WITHDRAW
    // ─────────────────────────────────────────

    function test_Withdraw() public {
        vm.deal(address(edition), 1 ether);
        uint256 ownerBefore = owner.balance;

        vm.prank(owner);
        edition.withdraw();

        assertEq(owner.balance, ownerBefore + 1 ether);
    }

    function test_WithdrawRevertsZeroBalance() public {
        vm.prank(owner);
        vm.expectRevert(WithdrawFailed.selector);
        edition.withdraw();
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MintTrackedCorrectly(uint256 qty) public {
        vm.assume(qty > 0 && qty <= 10);
        vm.prank(minter);
        edition.mint(buyer, 1, qty);
        assertEq(edition.totalMinted(1), qty);
        assertEq(edition.walletMints(buyer, 1), qty);
    }
}