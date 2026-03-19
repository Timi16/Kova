// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/minters/FreeMinter.sol";
import "../../src/core/NFT.sol";
import "../../src/core/Edition.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract FreeMinterTest is Test {

    FreeMinter  public freeMinter;
    FeeManager  public feeManager;
    NFT         public nft;
    Edition     public edition;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public buyer    = makeAddr("buyer");

    function setUp() public {
        vm.startPrank(owner);

        feeManager = new FeeManager(treasury, 250);
        freeMinter = new FreeMinter(address(feeManager), owner);

        NFTConfig memory nftCfg = NFTConfig({
            name:            "Free Drop",
            symbol:          "FREE",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "",
            maxSupply:       100,
            mintPrice:       0,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     5,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      true
        });
        nft = new NFT(nftCfg, owner);
        nft.setMinter(address(freeMinter));
        freeMinter.registerNFT(address(nft), 5);

        edition = new Edition("Free Editions", owner);
        EditionConfig memory edCfg = EditionConfig({
            name:            "Free Edition",
            uri:             "ipfs://QmFree/",
            tokenId:         1,
            maxSupply:       0,
            mintPrice:       0,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     0,
            royaltyBps:      500,
            royaltyReceiver: owner
        });
        edition.createEdition(edCfg);
        edition.setMinter(address(freeMinter));
        freeMinter.registerEdition(address(edition), 0);

        vm.stopPrank();
    }

    // ─────────────────────────────────────────
    //  MINT NFT
    // ─────────────────────────────────────────

    function test_MintNFTFree() public {
        // only flat protocol fee paid
        uint256 flatFee = feeManager.mintFlatFee();

        vm.deal(buyer, flatFee);
        vm.prank(buyer);
        freeMinter.mintNFT{value: flatFee}(address(nft), buyer, 1);

        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.totalMinted(), 1);
    }

    function test_MintNFTRevertsWrongFee() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert();
        freeMinter.mintNFT{value: 0.001 ether}(address(nft), buyer, 1);
    }

    function test_MintNFTRevertsUnregistered() public {
        address randomAddr = makeAddr("random");
        vm.prank(buyer);
        vm.expectRevert(NotAuthorizedMinter.selector);
        freeMinter.mintNFT{value: 0}(randomAddr, buyer, 1);
    }

    // ─────────────────────────────────────────
    //  MINT EDITION
    // ─────────────────────────────────────────

    function test_MintEditionFree() public {
        uint256 flatFee = feeManager.mintFlatFee();

        vm.deal(buyer, flatFee);
        vm.prank(buyer);
        freeMinter.mintEdition{value: flatFee}(address(edition), buyer, 1, 1);

        assertEq(edition.balanceOf(buyer, 1), 1);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function test_PauseRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        freeMinter.pause(address(nft));
    }

    function test_MinterType() public view {
        assertEq(uint8(freeMinter.minterType()), uint8(MinterType.Free));
    }

    function test_MintPriceIsZero() public view {
        assertEq(freeMinter.getMintPrice(address(nft)), 0);
    }
}
