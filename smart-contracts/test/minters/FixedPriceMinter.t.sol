// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/minters/FixedPriceMinter.sol";
import "../../src/core/NFT.sol";
import "../../src/core/Edition.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract FixedPriceMinterTest is Test {

    FixedPriceMinter public fixedMinter;
    FeeManager       public feeManager;
    NFT              public nft;
    Edition          public edition;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public buyer    = makeAddr("buyer");

    uint256 public constant MINT_PRICE = 0.01 ether;

    function setUp() public {
        vm.startPrank(owner);

        feeManager  = new FeeManager(treasury, 250);
        fixedMinter = new FixedPriceMinter(address(feeManager), owner);

        // deploy NFT
        NFTConfig memory nftCfg = NFTConfig({
            name:            "Forge",
            symbol:          "FRG",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "",
            maxSupply:       100,
            mintPrice:       MINT_PRICE,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     10,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      true
        });
        nft = new NFT(nftCfg, owner);
        nft.setMinter(address(fixedMinter));

        // register NFT with minter
        fixedMinter.registerNFT(
            address(nft),
            FixedPriceConfig({ price: MINT_PRICE, maxPerWallet: 10 })
        );

        // deploy Edition
        edition = new Edition("Forge Editions", owner);
        EditionConfig memory edCfg = EditionConfig({
            name:            "Drop 1",
            uri:             "ipfs://QmEdition/",
            tokenId:         1,
            maxSupply:       500,
            mintPrice:       MINT_PRICE,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     10,
            royaltyBps:      500,
            royaltyReceiver: owner
        });
        edition.createEdition(edCfg);
        edition.setMinter(address(fixedMinter));

        fixedMinter.registerEdition(
            address(edition),
            FixedPriceConfig({ price: MINT_PRICE, maxPerWallet: 10 })
        );

        vm.stopPrank();
    }

    // ─────────────────────────────────────────
    //  MINT NFT
    // ─────────────────────────────────────────

    function test_MintNFT() public {
        uint256 flatFee  = feeManager.mintFlatFee();
        uint256 total    = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintNFT{value: total}(address(nft), buyer, 1);

        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.totalMinted(), 1);
    }

    function test_MintNFTBatch() public {
        uint256 qty     = 3;
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = (MINT_PRICE * qty) + (flatFee * qty);

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintNFT{value: total}(address(nft), buyer, qty);

        assertEq(nft.totalMinted(), qty);
    }

    function test_MintNFTRevertsWrongPayment() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert();
        fixedMinter.mintNFT{value: 0.001 ether}(address(nft), buyer, 1);
    }

    function test_MintNFTRevertsWhenPaused() public {
        vm.prank(owner);
        fixedMinter.pause(address(nft));

        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        vm.expectRevert(MintPaused.selector);
        fixedMinter.mintNFT{value: total}(address(nft), buyer, 1);
    }

    function test_MintNFTRevertsZeroQuantity() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(InvalidMintAmount.selector, 0));
        fixedMinter.mintNFT{value: 0}(address(nft), buyer, 0);
    }

    // ─────────────────────────────────────────
    //  MINT EDITION
    // ─────────────────────────────────────────

    function test_MintEdition() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintEdition{value: total}(address(edition), buyer, 1, 1);

        assertEq(edition.balanceOf(buyer, 1), 1);
        assertEq(edition.totalMinted(1), 1);
    }

    function test_MintEditionBatch() public {
        uint256 qty     = 5;
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = (MINT_PRICE * qty) + (flatFee * qty);

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintEdition{value: total}(address(edition), buyer, 1, qty);

        assertEq(edition.balanceOf(buyer, 1), qty);
    }

    // ─────────────────────────────────────────
    //  FEE ROUTING
    // ─────────────────────────────────────────

    function test_FeeRoutedToTreasury() public {
        uint256 flatFee        = feeManager.mintFlatFee();
        uint256 total          = MINT_PRICE + flatFee;
        uint256 treasuryBefore = treasury.balance;

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintNFT{value: total}(address(nft), buyer, 1);

        assertGt(treasury.balance, treasuryBefore);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function test_PauseAndUnpause() public {
        vm.prank(owner);
        fixedMinter.pause(address(nft));
        assertTrue(fixedMinter.isPaused(address(nft)));

        vm.prank(owner);
        fixedMinter.unpause(address(nft));
        assertFalse(fixedMinter.isPaused(address(nft)));
    }

    function test_GetMintPrice() public {
        assertEq(fixedMinter.getMintPrice(address(nft)), MINT_PRICE);
    }

    function test_MinterType() public {
        assertEq(uint8(fixedMinter.minterType()), uint8(MinterType.FixedPrice));
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MintNFTCorrectPayment(uint256 qty) public {
        vm.assume(qty > 0 && qty <= 10);
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = (MINT_PRICE * qty) + (flatFee * qty);

        vm.deal(buyer, total);
        vm.prank(buyer);
        fixedMinter.mintNFT{value: total}(address(nft), buyer, qty);
        assertEq(nft.totalMinted(), qty);
    }
}