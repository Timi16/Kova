// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/marketplace/Marketplace.sol";
import "../../src/core/NFT.sol";
import "../../src/core/Edition.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract MarketplaceTest is Test {

    Marketplace public marketplace;
    FeeManager  public feeManager;
    NFT         public nft;
    Edition     public edition;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public seller   = makeAddr("seller");
    address public buyer    = makeAddr("buyer");
    address public minter   = makeAddr("minter");

    uint256 public constant LIST_PRICE = 1 ether;

    function setUp() public {
        vm.startPrank(owner);

        feeManager  = new FeeManager(treasury, 250);
        marketplace = new Marketplace(address(feeManager), owner);

        // deploy + mint NFT to seller
        NFTConfig memory nftCfg = NFTConfig({
            name:            "Forge",
            symbol:          "FRG",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "",
            maxSupply:       100,
            mintPrice:       0.01 ether,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     10,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      true
        });
        nft = new NFT(nftCfg, owner);
        nft.setMinter(minter);

        // deploy + create edition
        edition = new Edition("Forge Editions", owner);
        EditionConfig memory edCfg = EditionConfig({
            name:            "Drop 1",
            uri:             "ipfs://QmEd/",
            tokenId:         1,
            maxSupply:       500,
            mintPrice:       0,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     0,
            royaltyBps:      500,
            royaltyReceiver: owner
        });
        edition.createEdition(edCfg);
        edition.setMinter(minter);

        vm.stopPrank();

        // mint token 1 to seller
        vm.prank(minter);
        nft.mint(seller, 1);

        // mint edition token to seller
        vm.prank(minter);
        edition.mint(seller, 1, 5);
    }

    // ─────────────────────────────────────────
    //  LIST ERC721
    // ─────────────────────────────────────────

    function test_ListNFT() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        Listing memory listing = marketplace.getListing(1);
        assertEq(listing.seller,          seller);
        assertEq(listing.price,           LIST_PRICE);
        assertEq(listing.contractAddress, address(nft));
        assertEq(listing.tokenId,         1);
        assertEq(uint8(listing.status),   uint8(ListingStatus.Active));
    }

    function test_ListRevertsIfNotOwner() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(buyer);
        vm.expectRevert(NotTokenOwner.selector);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);
    }

    function test_ListRevertsIfNotApproved() public {
        vm.prank(seller);
        vm.expectRevert(NFTNotApproved.selector);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);
    }

    function test_ListRevertsZeroPrice() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        vm.expectRevert();
        marketplace.list(address(nft), 1, 0, TokenType.ERC721, 1);
    }

    // ─────────────────────────────────────────
    //  LIST ERC1155
    // ─────────────────────────────────────────

    function test_ListEdition() public {
        vm.prank(seller);
        edition.setApprovalForAll(address(marketplace), true);

        vm.prank(seller);
        marketplace.list(address(edition), 1, LIST_PRICE, TokenType.ERC1155, 2);

        Listing memory listing = marketplace.getListing(1);
        assertEq(listing.quantity,       2);
        assertEq(uint8(listing.status),  uint8(ListingStatus.Active));
    }

    // ─────────────────────────────────────────
    //  BUY ERC721
    // ─────────────────────────────────────────

    function test_BuyNFT() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        uint256 sellerBefore = seller.balance;

        vm.deal(buyer, LIST_PRICE);
        vm.prank(buyer);
        marketplace.buy{value: LIST_PRICE}(1);

        // buyer owns the NFT
        assertEq(nft.ownerOf(1), buyer);

        // seller got paid minus protocol fee
        (uint256 fee, ) = feeManager.calculateFee(LIST_PRICE);
        assertEq(seller.balance, sellerBefore + LIST_PRICE - fee);

        // listing is sold
        Listing memory listing = marketplace.getListing(1);
        assertEq(uint8(listing.status), uint8(ListingStatus.Sold));
    }

    function test_BuyRevertsWrongPayment() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: 0.5 ether}(1);
    }

    function test_BuyRevertsListingNotActive() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        // cancel listing
        vm.prank(seller);
        marketplace.cancelListing(1);

        vm.deal(buyer, LIST_PRICE);
        vm.prank(buyer);
        vm.expectRevert(ListingNotActive.selector);
        marketplace.buy{value: LIST_PRICE}(1);
    }

    // ─────────────────────────────────────────
    //  BUY ERC1155
    // ─────────────────────────────────────────

    function test_BuyEdition() public {
        vm.prank(seller);
        edition.setApprovalForAll(address(marketplace), true);

        vm.prank(seller);
        marketplace.list(address(edition), 1, LIST_PRICE, TokenType.ERC1155, 2);

        vm.deal(buyer, LIST_PRICE);
        vm.prank(buyer);
        marketplace.buy{value: LIST_PRICE}(1);

        assertEq(edition.balanceOf(buyer, 1), 2);
    }

    // ─────────────────────────────────────────
    //  CANCEL LISTING
    // ─────────────────────────────────────────

    function test_CancelListing() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        vm.prank(seller);
        marketplace.cancelListing(1);

        Listing memory listing = marketplace.getListing(1);
        assertEq(uint8(listing.status), uint8(ListingStatus.Cancelled));
    }

    function test_CancelListingRevertsIfNotSeller() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        vm.prank(buyer);
        vm.expectRevert(NotListingOwner.selector);
        marketplace.cancelListing(1);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function test_IsListed() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        assertTrue(marketplace.isListed(address(nft), 1));

        vm.prank(seller);
        marketplace.cancelListing(1);

        assertFalse(marketplace.isListed(address(nft), 1));
    }

    function test_GetListingsBySeller() public {
        vm.prank(seller);
        nft.approve(address(marketplace), 1);

        vm.prank(seller);
        marketplace.list(address(nft), 1, LIST_PRICE, TokenType.ERC721, 1);

        Listing[] memory listings = marketplace.getListingsByseller(seller);
        assertEq(listings.length, 1);
        assertEq(listings[0].seller, seller);
    }

    function test_GetListingRevertsNotFound() public {
        vm.expectRevert(ListingNotFound.selector);
        marketplace.getListing(999);
    }
}