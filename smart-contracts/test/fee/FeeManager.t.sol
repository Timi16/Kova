// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/fee/FeeManager.sol";
import "../../src/utils/Errors.sol";
import "../../src/utils/Types.sol";

contract FeeManagerTest is Test {

    FeeManager public feeManager;

    // actors
    address public owner    = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public creator  = makeAddr("creator");
    address public buyer    = makeAddr("buyer");

    // 250 bps = 2.5% sale fee
    uint96 public constant FEE_BPS = 250;

    // ─────────────────────────────────────────
    //  SETUP
    //  runs before every test
    // ─────────────────────────────────────────

    function setUp() public {
        vm.prank(owner);
        feeManager = new FeeManager(treasury, FEE_BPS);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsConfig() public {
        FeeConfig memory cfg = feeManager.feeConfig();
        assertEq(cfg.treasury, treasury);
        assertEq(cfg.feeBps, FEE_BPS);
    }

    function test_DeployRevertsZeroTreasury() public {
        vm.expectRevert(ZeroAddress.selector);
        new FeeManager(address(0), FEE_BPS);
    }

    function test_DeployRevertsFeeTooHigh() public {
        vm.expectRevert(FeeTooHigh.selector);
        new FeeManager(treasury, 1001); // over 10%
    }

    // ─────────────────────────────────────────
    //  CALCULATE FEE
    // ─────────────────────────────────────────

    function test_CalculateFee() public {
        // 2.5% of 1 ether = 0.025 ether
        (uint256 fee, uint256 remainder) = feeManager.calculateFee(1 ether);
        assertEq(fee, 0.025 ether);
        assertEq(remainder, 0.975 ether);
    }

    function test_CalculateFeeZeroAmount() public {
        (uint256 fee, uint256 remainder) = feeManager.calculateFee(0);
        assertEq(fee, 0);
        assertEq(remainder, 0);
    }

    function test_CalculateFeeSmallAmount() public {
        // 2.5% of 100 wei = 2 wei (rounds down)
        (uint256 fee, uint256 remainder) = feeManager.calculateFee(100);
        assertEq(fee, 2);
        assertEq(remainder, 98);
    }

    // fuzz test — fee + remainder always equals amount
    function testFuzz_CalculateFeeAlwaysAddsUp(uint256 amount) public {
        vm.assume(amount < 1_000_000 ether);
        (uint256 fee, uint256 remainder) = feeManager.calculateFee(amount);
        assertEq(fee + remainder, amount);
    }

    // ─────────────────────────────────────────
    //  COLLECT MINT FEE
    // ─────────────────────────────────────────

    function test_CollectMintFee() public {
        uint256 flatFee = feeManager.mintFlatFee(); // 0.000777 ether
        uint256 quantity = 2;
        uint256 mintPrice = 0.01 ether;
        uint256 totalPaid = (mintPrice * quantity) + (flatFee * quantity);

        // track balances before
        uint256 treasuryBefore = treasury.balance;
        uint256 creatorBefore  = creator.balance;

        vm.deal(buyer, totalPaid);
        vm.prank(buyer);
        (uint256 creatorAmount, uint256 protocolAmount) =
            feeManager.collectMintFee{value: totalPaid}(creator, totalPaid, quantity);

        // protocol gets flat fee × quantity
        assertEq(protocolAmount, flatFee * quantity);

        // creator gets everything else
        assertEq(creatorAmount, totalPaid - protocolAmount);

        // balances updated
        assertEq(treasury.balance, treasuryBefore + protocolAmount);
        assertEq(creator.balance,  creatorBefore  + creatorAmount);
    }

    function test_CollectMintFeeRevertsWrongValue() public {
        uint256 flatFee = feeManager.mintFlatFee();
        uint256 totalPaid = 0.01 ether;

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(IncorrectPayment.selector, totalPaid, 0.005 ether)
        );
        feeManager.collectMintFee{value: 0.005 ether}(creator, totalPaid, 1);
    }

    // ─────────────────────────────────────────
    //  COLLECT SALE FEE
    // ─────────────────────────────────────────

    function test_CollectSaleFee() public {
        uint256 salePrice = 1 ether;

        uint256 treasuryBefore = treasury.balance;
        uint256 sellerBefore   = creator.balance;

        vm.deal(buyer, salePrice);
        vm.prank(buyer);
        (uint256 sellerAmount, uint256 protocolAmount) =
            feeManager.collectSaleFee{value: salePrice}(creator, salePrice);

        // 2.5% to protocol
        assertEq(protocolAmount, 0.025 ether);
        // 97.5% to seller
        assertEq(sellerAmount, 0.975 ether);

        assertEq(treasury.balance, treasuryBefore + protocolAmount);
        assertEq(creator.balance,  sellerBefore   + sellerAmount);
    }

    function test_CollectSaleFeeRevertsWrongValue() public {
        uint256 salePrice = 1 ether;
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(IncorrectPayment.selector, salePrice, 0.5 ether)
        );
        feeManager.collectSaleFee{value: 0.5 ether}(creator, salePrice);
    }

    // fuzz — seller + protocol always equals sale price
    function testFuzz_SaleFeeAlwaysAddsUp(uint256 salePrice) public {
        vm.assume(salePrice > 0 && salePrice < 1_000_000 ether);
        vm.deal(buyer, salePrice);
        vm.prank(buyer);
        (uint256 sellerAmount, uint256 protocolAmount) =
            feeManager.collectSaleFee{value: salePrice}(creator, salePrice);
        assertEq(sellerAmount + protocolAmount, salePrice);
    }

    // ─────────────────────────────────────────
    //  ADMIN — SET FEE
    // ─────────────────────────────────────────

    function test_SetFee() public {
        vm.prank(owner);
        feeManager.setFee(500); // 5%
        assertEq(feeManager.feeConfig().feeBps, 500);
    }

    function test_SetFeeRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        feeManager.setFee(500);
    }

    function test_SetFeeRevertsTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(FeeTooHigh.selector);
        feeManager.setFee(1001);
    }

    function test_SetFeeEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit IFeeManager.FeeUpdated(FEE_BPS, 500);
        feeManager.setFee(500);
    }

    // ─────────────────────────────────────────
    //  ADMIN — SET TREASURY
    // ─────────────────────────────────────────

    function test_SetTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        feeManager.setTreasury(newTreasury);
        assertEq(feeManager.feeConfig().treasury, newTreasury);
    }

    function test_SetTreasuryRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        feeManager.setTreasury(address(0));
    }

    function test_SetTreasuryRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        feeManager.setTreasury(makeAddr("newTreasury"));
    }

    function test_SetTreasuryEmitsEvent() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit IFeeManager.TreasuryUpdated(treasury, newTreasury);
        feeManager.setTreasury(newTreasury);
    }

    // ─────────────────────────────────────────
    //  ADMIN — SET MINT FLAT FEE
    // ─────────────────────────────────────────

    function test_SetMintFlatFee() public {
        vm.prank(owner);
        feeManager.setMintFlatFee(0.001 ether);
        assertEq(feeManager.mintFlatFee(), 0.001 ether);
    }

    function test_SetMintFlatFeeRevertsIfNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        feeManager.setMintFlatFee(0.001 ether);
    }
}