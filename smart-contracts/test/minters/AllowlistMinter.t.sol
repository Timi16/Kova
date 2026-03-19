// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/minters/AllowlistMinter.sol";
import "../../src/core/NFT.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AllowlistMinterTest is Test {

    AllowlistMinter public allowlistMinter;
    FeeManager      public feeManager;
    NFT             public nft;

    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");

    // allowlisted wallets
    address public allowed1 = makeAddr("allowed1");
    address public allowed2 = makeAddr("allowed2");
    address public notAllowed = makeAddr("notAllowed");

    bytes32 public merkleRoot;
    bytes32[] public proof1;
    bytes32[] public proof2;

    uint256 public constant MINT_PRICE = 0.01 ether;

    function setUp() public {
        // build merkle tree from two allowed addresses
        bytes32 leaf1 = keccak256(abi.encodePacked(allowed1));
        bytes32 leaf2 = keccak256(abi.encodePacked(allowed2));

        // simple two-leaf tree
        // root = hash(sorted(leaf1, leaf2))
        if (leaf1 < leaf2) {
            merkleRoot = keccak256(abi.encodePacked(leaf1, leaf2));
            proof1 = new bytes32[](1);
            proof1[0] = leaf2;
            proof2 = new bytes32[](1);
            proof2[0] = leaf1;
        } else {
            merkleRoot = keccak256(abi.encodePacked(leaf2, leaf1));
            proof1 = new bytes32[](1);
            proof1[0] = leaf2;
            proof2 = new bytes32[](1);
            proof2[0] = leaf1;
        }

        vm.startPrank(owner);

        feeManager      = new FeeManager(treasury, 250);
        allowlistMinter = new AllowlistMinter(address(feeManager), owner);

        NFTConfig memory nftCfg = NFTConfig({
            name:            "Allowlist Drop",
            symbol:          "AL",
            baseURI:         "ipfs://QmHash/",
            hiddenURI:       "",
            maxSupply:       100,
            mintPrice:       MINT_PRICE,
            mintStart:       0,
            mintEnd:         0,
            walletLimit:     1,
            royaltyBps:      500,
            royaltyReceiver: owner,
            isRevealed:      true
        });
        nft = new NFT(nftCfg, owner);
        nft.setMinter(address(allowlistMinter));

        allowlistMinter.registerNFT(
            address(nft),
            AllowlistConfig({
                price:        MINT_PRICE,
                merkleRoot:   merkleRoot,
                maxPerWallet: 1
            })
        );

        vm.stopPrank();
    }

    // ─────────────────────────────────────────
    //  MINT WITH VALID PROOF
    // ─────────────────────────────────────────

    function test_MintWithValidProof() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(allowed1, total);
        vm.prank(allowed1);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            allowed1,
            1,
            proof1
        );

        assertEq(nft.ownerOf(1), allowed1);
        assertEq(nft.totalMinted(), 1);
    }

    function test_SecondAllowedAddressCanMint() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(allowed2, total);
        vm.prank(allowed2);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            allowed2,
            1,
            proof2
        );

        assertEq(nft.ownerOf(1), allowed2);
    }

    // ─────────────────────────────────────────
    //  REVERT CASES
    // ─────────────────────────────────────────

    function test_MintRevertsInvalidProof() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        bytes32[] memory badProof = new bytes32[](1);
        badProof[0] = bytes32(0);

        vm.deal(notAllowed, total);
        vm.prank(notAllowed);
        vm.expectRevert(InvalidMerkleProof.selector);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            notAllowed,
            1,
            badProof
        );
    }

    function test_MintRevertsDoubleClaim() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        vm.deal(allowed1, total * 2);
        vm.prank(allowed1);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            allowed1,
            1,
            proof1
        );

        // second claim should fail
        vm.prank(allowed1);
        vm.expectRevert(WalletMintLimitReached.selector);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            allowed1,
            1,
            proof1
        );
    }

    function test_BaseMintNFTRevertsAlways() public {
        vm.deal(allowed1, 1 ether);
        vm.prank(allowed1);
        vm.expectRevert(NotAllowlisted.selector);
        allowlistMinter.mintNFT{value: 0}(address(nft), allowed1, 1);
    }

    // ─────────────────────────────────────────
    //  UPDATE MERKLE ROOT
    // ─────────────────────────────────────────

    function test_UpdateMerkleRoot() public {
        bytes32 newRoot = keccak256(abi.encodePacked("newroot"));
        vm.prank(owner);
        allowlistMinter.updateMerkleRoot(address(nft), newRoot);

        AllowlistConfig memory cfg = allowlistMinter.getConfig(address(nft));
        assertEq(cfg.merkleRoot, newRoot);
    }

    function test_UpdateMerkleRootRevertsZero() public {
        vm.prank(owner);
        vm.expectRevert(InvalidMerkleProof.selector);
        allowlistMinter.updateMerkleRoot(address(nft), bytes32(0));
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function test_HasClaimed() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 total   = MINT_PRICE + flatFee;

        assertFalse(allowlistMinter.hasClaimed(address(nft), allowed1));

        vm.deal(allowed1, total);
        vm.prank(allowed1);
        allowlistMinter.mintNFTAllowlist{value: total}(
            address(nft),
            allowed1,
            1,
            proof1
        );

        assertTrue(allowlistMinter.hasClaimed(address(nft), allowed1));
    }

    function test_MinterType() public view {
        assertEq(uint8(allowlistMinter.minterType()), uint8(MinterType.Allowlist));
    }
}