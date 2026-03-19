// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IFeeManager.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract FeeManager is IFeeManager, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    FeeConfig private _feeConfig;

    // max protocol fee is 10% — protects creators
    uint96 public constant MAX_FEE_BPS = 1000;

    // flat fee per mint on top of mint price
    // this is how Zora does it — small flat fee per token minted
    uint256 public mintFlatFee = 0.000777 ether;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address treasury, uint96 feeBps) Ownable(msg.sender) {
        if (treasury == address(0)) revert ZeroAddress();
        if (feeBps > MAX_FEE_BPS) revert FeeTooHigh();

        _feeConfig = FeeConfig({
            treasury: treasury,
            feeBps: feeBps
        });
    }

    // ─────────────────────────────────────────
    //  MINT FEE
    //  called by minter contracts on every mint
    //  splits payment → creator + protocol
    // ─────────────────────────────────────────

    function collectMintFee(
        address creator,
        uint256 totalPaid,
        uint256 quantity
    ) external payable nonReentrant returns (uint256 creatorAmount, uint256 protocolAmount) {
        if (msg.value != totalPaid) revert IncorrectPayment(totalPaid, msg.value);

        // flat fee per token minted goes to protocol
        protocolAmount = mintFlatFee * quantity;

        // everything above the flat fee goes to creator
        if (totalPaid < protocolAmount) revert IncorrectPayment(protocolAmount, totalPaid);
        creatorAmount = totalPaid - protocolAmount;

        // send protocol cut to treasury
        if (protocolAmount > 0) {
            (bool ok, ) = _feeConfig.treasury.call{value: protocolAmount}("");
            if (!ok) revert FeeTransferFailed();
        }

        // send creator cut to creator
        if (creatorAmount > 0) {
            (bool ok2, ) = creator.call{value: creatorAmount}("");
            if (!ok2) revert WithdrawFailed();
        }

        emit ProtocolFeeCollected(msg.sender, _feeConfig.treasury, protocolAmount);

        return (creatorAmount, protocolAmount);
    }

    // ─────────────────────────────────────────
    //  SALE FEE
    //  called by marketplace on every sale
    //  splits sale price → seller + protocol
    // ─────────────────────────────────────────

    function collectSaleFee(
        address seller,
        uint256 salePrice
    ) external payable nonReentrant returns (uint256 sellerAmount, uint256 protocolAmount) {
        if (msg.value != salePrice) revert IncorrectPayment(salePrice, msg.value);

        (uint256 fee, uint256 remainder) = calculateFee(salePrice);

        protocolAmount = fee;
        sellerAmount = remainder;

        // send protocol cut to treasury
        if (protocolAmount > 0) {
            (bool ok, ) = _feeConfig.treasury.call{value: protocolAmount}("");
            if (!ok) revert FeeTransferFailed();
        }

        // send seller their cut
        if (sellerAmount > 0) {
            (bool ok2, ) = seller.call{value: sellerAmount}("");
            if (!ok2) revert WithdrawFailed();
        }

        emit ProtocolFeeCollected(msg.sender, _feeConfig.treasury, protocolAmount);

        return (sellerAmount, protocolAmount);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function setFee(uint96 newBps) external onlyOwner {
        if (newBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeUpdated(_feeConfig.feeBps, newBps);
        _feeConfig.feeBps = newBps;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(_feeConfig.treasury, newTreasury);
        _feeConfig.treasury = newTreasury;
    }

    function setMintFlatFee(uint256 newFee) external onlyOwner {
        mintFlatFee = newFee;
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function feeConfig() external view returns (FeeConfig memory) {
        return _feeConfig;
    }

    function calculateFee(uint256 amount) public view returns (uint256 fee, uint256 remainder) {
        fee = (amount * _feeConfig.feeBps) / 10000;
        remainder = amount - fee;
        return (fee, remainder);
    }
}