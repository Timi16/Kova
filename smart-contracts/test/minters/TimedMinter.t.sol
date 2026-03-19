// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/minters/TimedMinter.sol";
import "../../src/core/NFT.sol";
import "../../src/core/Edition.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract TimedMinterTest is Test {

    TimedMinter public timedMinter;
    FeeManager  public feeManager;
    NFT         public nft;
    Edition     public edition;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public buyer    = makeAddr("buyer");

    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public mintStart;
    uint256 public mintEnd;

    function setUp() public {
        mintStart = block.timestamp;
        mintEnd   = block.timestamp + 1 days;

        vm.startPrank(owner);

        feeManager  = new FeeManager(treasury, 250);
        timedMinter = new TimedMinter(address(feeManager), owner);

        NFTConfig memory nftCfg = NFTConfig({
            name:            "Timed Drop",
            symbol:          "TIME",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "",
            maxSupply:       100,
            mintPrice:       MINT_PRICE,
            mintStart:       mintStart,
            mintEnd:         mintEnd,
            walletLimit:     10,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      true
        });
        nft = new NFT(nftCfg, owner);
        nft.setMinter(address(timedMinter));

        timedMinter.registerNFT(
            address(nft),
            TimedConfig({
                price:        MINT_PRICE,
                startTime:    mintStart,
                endTime:      mintEnd,
                maxPerWallet: 10
            })
        );

        edition = new Edition("Timed Editions", owner);
        EditionConfig memory edCfg = EditionConfig({
            name:            "Timed Edition",
            uri:             "ipfs://QmTimed/",
            tokenId:         1,
            maxSupply:       0,
            mintPrice:       MINT_PRICE,
            mintStart:       mintStart,
            mintEnd:         mintEnd,
            walletLimit:     0,
            royaltyBps:      500,
            royaltyReceiver: owner
        });
        edition.createEdition(edCfg);
        edition.setMinter(address(timedMinter));

        timedMinter.registerEdition(
            address(edition),
            TimedConfig({
                price:        MINT_PRICE,
                startTime:    mintStart,
                endTime:      mintEnd,
                maxPerWallet: 0
            })
        );

        vm.stopPrank();
    }

    // ─────────────────────────────────────────
    //  MINT DURING WINDOW
    // ─────────────────────────────────────────

    function test_MintNFTDuringWindow() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        timedMinter.mintNFT{value: total}(address(nft), buyer, 1);

        assertEq(nft.ownerOf(1), buyer);
    }

    function test_MintEditionDuringWindow() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        timedMinter.mintEdition{value: total}(address(edition), buyer, 1, 1);

        assertEq(edition.balanceOf(buyer, 1), 1);
    }

    // ─────────────────────────────────────────
    //  WINDOW ENFORCEMENT
    // ─────────────────────────────────────────

    function test_MintRevertsBeforeWindow() public {
        // warp to before start
        vm.warp(mintStart - 1);

        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        vm.expectRevert(MintNotStarted.selector);
        timedMinter.mintNFT{value: total}(address(nft), buyer, 1);
    }

    function test_MintRevertsAfterWindow() public {
        vm.warp(mintEnd + 1);

        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        vm.expectRevert(MintEnded.selector);
        timedMinter.mintNFT{value: total}(address(nft), buyer, 1);
    }

    // ─────────────────────────────────────────
    //  UPDATE WINDOW
    // ─────────────────────────────────────────

    function test_UpdateWindow() public {
        uint256 newEnd = block.timestamp + 7 days;

        vm.prank(owner);
        timedMinter.updateWindow(address(nft), mintStart, newEnd);

        TimedConfig memory cfg = timedMinter.getConfig(address(nft));
        assertEq(cfg.startTime, mintStart);
        assertEq(cfg.endTime, newEnd);

        // Mint while still inside the NFT window; update is validated via config above.
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.warp(block.timestamp + 12 hours);
        vm.deal(buyer, total);
        vm.prank(buyer);
        timedMinter.mintNFT{value: total}(address(nft), buyer, 1);

        assertEq(nft.totalMinted(), 1);
    }

    function test_UpdateWindowRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        timedMinter.updateWindow(address(nft), mintStart, mintEnd + 1 days);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function test_IsWindowOpen() public {
        assertTrue(timedMinter.isWindowOpen(address(nft)));

        vm.warp(mintEnd + 1);
        assertFalse(timedMinter.isWindowOpen(address(nft)));
    }

    function test_MinterType() public view {
        assertEq(uint8(timedMinter.minterType()), uint8(MinterType.Timed));
    }
}
