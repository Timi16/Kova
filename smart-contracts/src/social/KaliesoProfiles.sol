// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IProfiles.sol";
import "../utils/Errors.sol";

contract KaliesoProfiles is IProfiles, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  ERRORS (profile specific)
    // ─────────────────────────────────────────

    error ProfileAlreadyExists();
    error ProfileDoesNotExist();
    error UsernameTaken();
    error UsernameEmpty();
    error UsernameTooLong();
    error UsernameInvalidChars();
    error NotProfileOwner();

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    // wallet → profile
    mapping(address => Profile) private _profiles;

    // username (lowercased) → wallet
    // for username lookup + uniqueness check
    mapping(string => address) private _usernameToWallet;

    // all registered wallets — for enumeration
    address[] private _allProfiles;

    // max username length
    uint256 public constant MAX_USERNAME_LENGTH = 30;

    // max bio length
    uint256 public constant MAX_BIO_LENGTH = 160;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address owner_) Ownable(owner_) {}

    // ─────────────────────────────────────────
    //  CREATE PROFILE
    //  one profile per wallet
    //  username must be unique + valid
    // ─────────────────────────────────────────

    function createProfile(
        string calldata username,
        string calldata bio,
        string calldata avatarURI,
        string calldata websiteURL
    ) external nonReentrant {
        if (_profiles[msg.sender].exists) revert ProfileAlreadyExists();

        _validateUsername(username);

        string memory lowerUsername = _toLower(username);
        if (_usernameToWallet[lowerUsername] != address(0)) revert UsernameTaken();

        if (bytes(bio).length > MAX_BIO_LENGTH) revert UsernameInvalidChars();

        _profiles[msg.sender] = Profile({
            wallet:     msg.sender,
            username:   username,
            bio:        bio,
            avatarURI:  avatarURI,
            websiteURL: websiteURL,
            createdAt:  block.timestamp,
            exists:     true
        });

        _usernameToWallet[lowerUsername] = msg.sender;
        _allProfiles.push(msg.sender);

        emit ProfileCreated(msg.sender, username, block.timestamp);
    }

    // ─────────────────────────────────────────
    //  UPDATE PROFILE
    //  can change username if new one is available
    //  cannot change wallet address
    // ─────────────────────────────────────────

    function updateProfile(
        string calldata username,
        string calldata bio,
        string calldata websiteURL
    ) external nonReentrant {
        if (!_profiles[msg.sender].exists) revert ProfileDoesNotExist();
        if (bytes(bio).length > MAX_BIO_LENGTH) revert UsernameInvalidChars();

        _validateUsername(username);

        string memory newLower = _toLower(username);
        string memory oldLower = _toLower(_profiles[msg.sender].username);

        // if username is changing check availability
        if (
            keccak256(bytes(newLower)) != keccak256(bytes(oldLower))
        ) {
            if (_usernameToWallet[newLower] != address(0)) revert UsernameTaken();
            // free old username
            delete _usernameToWallet[oldLower];
            // claim new username
            _usernameToWallet[newLower] = msg.sender;
        }

        _profiles[msg.sender].username   = username;
        _profiles[msg.sender].bio        = bio;
        _profiles[msg.sender].websiteURL = websiteURL;

        emit ProfileUpdated(msg.sender, username);
    }

    // ─────────────────────────────────────────
    //  UPDATE AVATAR
    //  separate function — avatar updates
    //  happen more frequently than profile edits
    // ─────────────────────────────────────────

    function updateAvatar(string calldata avatarURI) external {
        if (!_profiles[msg.sender].exists) revert ProfileDoesNotExist();
        _profiles[msg.sender].avatarURI = avatarURI;
        emit AvatarUpdated(msg.sender, avatarURI);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    //  protocol can remove abusive profiles
    // ─────────────────────────────────────────

    function removeProfile(address wallet) external onlyOwner {
        if (!_profiles[wallet].exists) revert ProfileDoesNotExist();

        string memory lowerUsername = _toLower(_profiles[wallet].username);
        delete _usernameToWallet[lowerUsername];
        delete _profiles[wallet];
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getProfile(
        address wallet
    ) external view returns (Profile memory) {
        if (!_profiles[wallet].exists) revert ProfileDoesNotExist();
        return _profiles[wallet];
    }

    function getProfileByUsername(
        string calldata username
    ) external view returns (Profile memory) {
        string memory lower = _toLower(username);
        address wallet = _usernameToWallet[lower];
        if (wallet == address(0)) revert ProfileDoesNotExist();
        return _profiles[wallet];
    }

    function hasProfile(address wallet) external view returns (bool) {
        return _profiles[wallet].exists;
    }

    function isUsernameTaken(
        string calldata username
    ) external view returns (bool) {
        string memory lower = _toLower(username);
        return _usernameToWallet[lower] != address(0);
    }

    function getTotalProfiles() external view returns (uint256) {
        return _allProfiles.length;
    }

    function getAllProfiles() external view returns (address[] memory) {
        return _allProfiles;
    }

    // ─────────────────────────────────────────
    //  INTERNAL — VALIDATE USERNAME
    //  3-30 chars, alphanumeric + underscore only
    // ─────────────────────────────────────────

    function _validateUsername(string calldata username) internal pure {
        bytes memory b = bytes(username);

        if (b.length == 0) revert UsernameEmpty();
        if (b.length > MAX_USERNAME_LENGTH) revert UsernameTooLong();

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            bool isLower   = char >= 0x61 && char <= 0x7a; // a-z
            bool isUpper   = char >= 0x41 && char <= 0x5a; // A-Z
            bool isDigit   = char >= 0x30 && char <= 0x39; // 0-9
            bool isUnderscore = char == 0x5f;               // _

            if (!isLower && !isUpper && !isDigit && !isUnderscore) {
                revert UsernameInvalidChars();
            }
        }
    }

    // ─────────────────────────────────────────
    //  INTERNAL — TO LOWERCASE
    //  for case-insensitive username uniqueness
    // ─────────────────────────────────────────

    function _toLower(
        string memory str
    ) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        bytes memory lower = new bytes(b.length);

        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x41 && b[i] <= 0x5a) {
                lower[i] = bytes1(uint8(b[i]) + 32);
            } else {
                lower[i] = b[i];
            }
        }

        return string(lower);
    }
}