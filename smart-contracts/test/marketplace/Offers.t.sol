// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/marketplace/Offers.sol";
import "../../src/core/NFT.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract OffersTest is Test {

    Offers     public offers;
    FeeManager public feeManager;
    NFT        public nft;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public seller   = makeAddr("seller");
    address public buyer    = makeAddr("buyer");
    address public minter   = makeAddr("minter");

    uint256 public constant OFFER_AMOUNT = 0.5 ether;

    function setUp() public {
        vm.startPrank(owner);

        feeManager = new FeeManager(treasury, 250);
        offers     = new Offers(address(feeManager), owner);

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

        vm.stopPrank();

        // mint token 1 to seller
        vm.prank(minter);
        nft.mint(seller, 1);
    }

    // ─────────────────────────────────────────
    //  MAKE OFFER
    // ─────────────────────────────────────────

    function test_MakeOffer() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft),
            1,
            TokenType.ERC721,
            1,
            expiry
        );

        Offer memory offer = offers.getOffer(1);
        assertEq(offer.buyer,           buyer);
        assertEq(offer.amount,          OFFER_AMOUNT);
        assertEq(offer.contractAddress, address(nft));
        assertEq(offer.tokenId,         1);
        assertEq(uint8(offer.status),   uint8(OfferStatus.Active));

        // INJ locked in contract
        assertEq(address(offers).balance, OFFER_AMOUNT);
    }

    function test_MakeOfferRevertsZeroAmount() public {
        vm.prank(buyer);
        vm.expectRevert(InsufficientOfferAmount.selector);
        offers.makeOffer{value: 0}(
            address(nft),
            1,
            TokenType.ERC721,
            1,
            block.timestamp + 1 days
        );
    }

    function test_MakeOfferRevertsExpiredExpiry() public {
        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        vm.expectRevert(OfferExpired.selector);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft),
            1,
            TokenType.ERC721,
            1,
            block.timestamp // expiry = now = expired
        );
    }

    function test_MultipleOffersOnSameToken() public {
        address buyer2 = makeAddr("buyer2");
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        vm.deal(buyer2, OFFER_AMOUNT * 2);
        vm.prank(buyer2);
        offers.makeOffer{value: OFFER_AMOUNT * 2}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        Offer[] memory tokenOffers = offers.getOffersByToken(address(nft), 1);
        assertEq(tokenOffers.length, 2);
    }

    // ─────────────────────────────────────────
    //  ACCEPT OFFER
    // ─────────────────────────────────────────

    function test_AcceptOffer() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        // seller approves + accepts
        vm.prank(seller);
        nft.approve(address(offers), 1);

        uint256 sellerBefore = seller.balance;

        vm.prank(seller);
        offers.acceptOffer(1);

        // buyer got the NFT
        assertEq(nft.ownerOf(1), buyer);

        // seller got paid minus fee
        (uint256 fee, ) = feeManager.calculateFee(OFFER_AMOUNT);
        assertEq(seller.balance, sellerBefore + OFFER_AMOUNT - fee);

        // offer is accepted
        Offer memory offer = offers.getOffer(1);
        assertEq(uint8(offer.status), uint8(OfferStatus.Accepted));

        // escrow empty
        assertEq(address(offers).balance, 0);
    }

    function test_AcceptOfferRevertsIfNotOwner() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        address random = makeAddr("random");
        vm.prank(random);
        vm.expectRevert(NotTokenOwner.selector);
        offers.acceptOffer(1);
    }

    function test_AcceptOfferRevertsIfExpired() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        vm.warp(expiry + 1);

        vm.prank(seller);
        nft.approve(address(offers), 1);

        vm.prank(seller);
        vm.expectRevert(OfferExpired.selector);
        offers.acceptOffer(1);
    }

    function test_AcceptOfferRevertsIfNotApproved() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        // seller does NOT approve
        vm.prank(seller);
        vm.expectRevert(NFTNotApproved.selector);
        offers.acceptOffer(1);
    }

    // ─────────────────────────────────────────
    //  CANCEL OFFER
    // ─────────────────────────────────────────

    function test_CancelOffer() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        uint256 buyerBefore = buyer.balance;

        vm.prank(buyer);
        offers.cancelOffer(1);

        // INJ returned
        assertEq(buyer.balance, buyerBefore + OFFER_AMOUNT);

        Offer memory offer = offers.getOffer(1);
        assertEq(uint8(offer.status), uint8(OfferStatus.Cancelled));
    }

    function test_CancelOfferRevertsIfNotBuyer() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        vm.prank(seller);
        vm.expectRevert(NotOfferMaker.selector);
        offers.cancelOffer(1);
    }

    // ─────────────────────────────────────────
    //  SWEEP EXPIRED
    // ─────────────────────────────────────────

    function test_SweepExpiredOffer() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        vm.warp(expiry + 1);

        uint256 buyerBefore = buyer.balance;

        // anyone can sweep
        address sweeper = makeAddr("sweeper");
        vm.prank(sweeper);
        offers.sweepExpiredOffer(1);

        // buyer got INJ back
        assertEq(buyer.balance, buyerBefore + OFFER_AMOUNT);

        Offer memory offer = offers.getOffer(1);
        assertEq(uint8(offer.status), uint8(OfferStatus.Expired));
    }

    function test_SweepRevertsIfNotExpired() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, OFFER_AMOUNT);
        vm.prank(buyer);
        offers.makeOffer{value: OFFER_AMOUNT}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        vm.prank(makeAddr("sweeper"));
        vm.expectRevert(OfferNotFound.selector);
        offers.sweepExpiredOffer(1);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MakeOfferLocksCorrectAmount(uint256 amount) public {
        vm.assume(amount > 0 && amount < 1000 ether);
        uint256 expiry = block.timestamp + 1 days;

        vm.deal(buyer, amount);
        vm.prank(buyer);
        offers.makeOffer{value: amount}(
            address(nft), 1, TokenType.ERC721, 1, expiry
        );

        assertEq(address(offers).balance, amount);
        assertEq(offers.getOffer(1).amount, amount);
    }
}