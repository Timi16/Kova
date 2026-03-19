// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/NFT.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract NFTTest is Test {

    NFT public nft;
    FeeManager public feeManager;

    address public owner    = makeAddr("owner");
    address public minter   = makeAddr("minter");
    address public buyer    = makeAddr("buyer");
    address public treasury = makeAddr("treasury");

    NFTConfig public defaultConfig;

    function setUp() public {
        vm.prank(owner);
        feeManager = new FeeManager(treasury, 250);

        defaultConfig = NFTConfig({
            name:            "Forge Collection",
            symbol:          "FORGE",
            baseURI:         "ipfs://QmBaseHash/",
            hiddenURI:       "ipfs://QmHiddenHash",
            maxSupply:       100,
            mintPrice:       0.01 ether,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     5,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      false
        });

        vm.prank(owner);
        nft = new NFT(defaultConfig, owner);

        // assign minter
        vm.prank(owner);
        nft.setMinter(minter);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsConfig() public view {
        NFTConfig memory cfg = nft.config();
        assertEq(cfg.name,            "Forge Collection");
        assertEq(cfg.symbol,          "FORGE");
        assertEq(cfg.maxSupply,       100);
        assertEq(cfg.mintPrice,       0.01 ether);
        assertEq(cfg.royaltyBps,      500);
        assertEq(cfg.royaltyReceiver, owner);
    }

    function test_DeployRevertsZeroRoyaltyReceiver() public {
        defaultConfig.royaltyReceiver = address(0);
        vm.expectRevert(ZeroAddress.selector);
        new NFT(defaultConfig, owner);
    }

    function test_DeployRevertsEmptyBaseURI() public {
        defaultConfig.baseURI = "";
        vm.expectRevert(EmptyBaseURI.selector);
        new NFT(defaultConfig, owner);
    }

    function test_DeployRevertsRoyaltyTooHigh() public {
        defaultConfig.royaltyBps = 1001;
        vm.expectRevert(FeeTooHigh.selector);
        new NFT(defaultConfig, owner);
    }

    // ─────────────────────────────────────────
    //  MINTER ASSIGNMENT
    // ─────────────────────────────────────────

    function test_SetMinter() public view {
        assertEq(nft.minter(), minter);
    }

    function test_SetMinterRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        nft.setMinter(buyer);
    }

    function test_SetMinterRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        nft.setMinter(address(0));
    }

    // ─────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────

    function test_MintSingle() public {
        vm.prank(minter);
        nft.mint(buyer, 1);

        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.walletMints(buyer), 1);
    }

    function test_MintBatch() public {
        vm.prank(minter);
        nft.mint(buyer, 3);

        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.ownerOf(2), buyer);
        assertEq(nft.ownerOf(3), buyer);
        assertEq(nft.totalMinted(), 3);
        assertEq(nft.walletMints(buyer), 3);
    }

    function test_MintRevertsIfNotMinter() public {
        vm.prank(buyer);
        vm.expectRevert(NotAuthorizedMinter.selector);
        nft.mint(buyer, 1);
    }

    function test_MintRevertsZeroQuantity() public {
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(InvalidMintAmount.selector, 0));
        nft.mint(buyer, 0);
    }

    function test_MintRevertsMaxSupplyReached() public {
        NFTConfig memory cfg = defaultConfig;
        cfg.maxSupply = 2;
        cfg.walletLimit = 0; // disable wallet limit so maxSupply is the first failing condition

        vm.prank(owner);
        NFT supplyLimitedNFT = new NFT(cfg, owner);
        vm.prank(owner);
        supplyLimitedNFT.setMinter(minter);

        // mint up to max supply
        vm.prank(minter);
        supplyLimitedNFT.mint(buyer, 2);

        // one more should fail
        vm.prank(minter);
        vm.expectRevert(MaxSupplyReached.selector);
        supplyLimitedNFT.mint(buyer, 1);
    }

    function test_MintRevertsWalletLimitReached() public {
        vm.prank(minter);
        nft.mint(buyer, 5); // hits wallet limit

        vm.prank(minter);
        vm.expectRevert(WalletMintLimitReached.selector);
        nft.mint(buyer, 1);
    }

    function test_MintRevertsBeforeMintStart() public {
        // set mint start to future
        NFTConfig memory cfg = defaultConfig;
        cfg.mintStart = block.timestamp + 1 days;

        vm.prank(owner);
        NFT timedNFT = new NFT(cfg, owner);
        vm.prank(owner);
        timedNFT.setMinter(minter);

        vm.prank(minter);
        vm.expectRevert(MintNotStarted.selector);
        timedNFT.mint(buyer, 1);
    }

    function test_MintRevertsAfterMintEnd() public {
        NFTConfig memory cfg = defaultConfig;
        cfg.mintStart = block.timestamp;
        cfg.mintEnd   = block.timestamp + 1 days;

        vm.prank(owner);
        NFT timedNFT = new NFT(cfg, owner);
        vm.prank(owner);
        timedNFT.setMinter(minter);

        // warp past end
        vm.warp(block.timestamp + 2 days);

        vm.prank(minter);
        vm.expectRevert(MintEnded.selector);
        timedNFT.mint(buyer, 1);
    }

    function test_MintRevertsWhenPaused() public {
        vm.prank(owner);
        nft.pause();

        vm.prank(minter);
        vm.expectRevert();
        nft.mint(buyer, 1);
    }

    // ─────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────

    function test_TokenURIReturnsHiddenBeforeReveal() public {
        vm.prank(minter);
        nft.mint(buyer, 1);

        string memory uri = nft.tokenURI(1);
        assertEq(uri, "ipfs://QmHiddenHash");
    }

    function test_TokenURIReturnsRealAfterReveal() public {
        vm.prank(minter);
        nft.mint(buyer, 1);

        vm.prank(owner);
        nft.reveal("ipfs://QmRealHash/");

        string memory uri = nft.tokenURI(1);
        assertEq(uri, "ipfs://QmRealHash//1.json");
    }

    function test_RevealRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        nft.reveal("ipfs://QmRealHash/");
    }

    function test_FreezeMetadata() public {
        vm.prank(owner);
        nft.freezeMetadata();

        assertTrue(nft.isMetadataFrozen());

        vm.prank(owner);
        vm.expectRevert(MetadataFrozen.selector);
        nft.reveal("ipfs://QmRealHash/");
    }

    function test_SetBaseURIRevertsWhenFrozen() public {
        vm.prank(owner);
        nft.freezeMetadata();

        vm.prank(owner);
        vm.expectRevert(MetadataFrozen.selector);
        nft.setBaseURI("ipfs://QmNewHash/");
    }

    // ─────────────────────────────────────────
    //  WITHDRAW
    // ─────────────────────────────────────────

    function test_Withdraw() public {
        // send some ETH to contract
        vm.deal(address(nft), 1 ether);

        uint256 ownerBefore = owner.balance;

        vm.prank(owner);
        nft.withdraw();

        assertEq(owner.balance, ownerBefore + 1 ether);
        assertEq(address(nft).balance, 0);
    }

    function test_WithdrawRevertsIfNotOwner() public {
        vm.deal(address(nft), 1 ether);
        vm.prank(buyer);
        vm.expectRevert();
        nft.withdraw();
    }

    function test_WithdrawRevertsIfZeroBalance() public {
        vm.prank(owner);
        vm.expectRevert(WithdrawFailed.selector);
        nft.withdraw();
    }

    // ─────────────────────────────────────────
    //  ROYALTIES
    // ─────────────────────────────────────────

    function test_RoyaltyInfo() public {
        vm.prank(minter);
        nft.mint(buyer, 1);

        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1 ether);
        assertEq(receiver, owner);
        assertEq(amount, 0.05 ether); // 5% of 1 ether
    }

    // ─────────────────────────────────────────
    //  PAUSE / UNPAUSE
    // ─────────────────────────────────────────

    function test_PauseAndUnpause() public {
        vm.prank(owner);
        nft.pause();

        vm.prank(minter);
        vm.expectRevert();
        nft.mint(buyer, 1);

        vm.prank(owner);
        nft.unpause();

        vm.prank(minter);
        nft.mint(buyer, 1);
        assertEq(nft.totalMinted(), 1);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MintQuantityTracked(uint256 qty) public {
        vm.assume(qty > 0 && qty <= 5); // within wallet limit + supply
        vm.prank(minter);
        nft.mint(buyer, qty);
        assertEq(nft.totalMinted(), qty);
        assertEq(nft.walletMints(buyer), qty);
    }
}
