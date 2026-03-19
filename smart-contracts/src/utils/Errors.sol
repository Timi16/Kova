// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────
//  MINT ERRORS
// ─────────────────────────────────────────
error MintNotStarted();
error MintEnded();
error MintPaused();
error MaxSupplyReached();
error WalletMintLimitReached();
error IncorrectPayment(uint256 expected, uint256 sent);
error InvalidMintAmount(uint256 amount);
error NotAllowlisted();
error InvalidMerkleProof();

// ─────────────────────────────────────────
//  OWNERSHIP / ACCESS ERRORS
// ─────────────────────────────────────────
error NotTokenOwner();
error NotCollectionOwner();
error NotAuthorizedMinter();
error ZeroAddress();

// ─────────────────────────────────────────
//  MARKETPLACE ERRORS
// ─────────────────────────────────────────
error ListingNotActive();
error ListingNotFound();
error OfferNotFound();
error OfferExpired();
error OfferAlreadyAccepted();
error NotListingOwner();
error NotOfferMaker();
error InsufficientOfferAmount();
error NFTNotApproved();
error TransferFailed();

// ─────────────────────────────────────────
//  FACTORY ERRORS
// ─────────────────────────────────────────
error InvalidMinterType();
error DeploymentFailed();

// ─────────────────────────────────────────
//  METADATA ERRORS & EVENTS
// ─────────────────────────────────────────
error MetadataFrozen();
error EmptyBaseURI();

event MetadataFrozenEvent();

// ─────────────────────────────────────────
//  FEE ERRORS
// ─────────────────────────────────────────
error FeeTooHigh();
error FeeTransferFailed();
error WithdrawFailed();

