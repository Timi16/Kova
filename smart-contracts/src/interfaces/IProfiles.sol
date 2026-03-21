// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProfiles {

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

    event ProfileCreated(
        address indexed wallet,
        string username,
        uint256 createdAt
    );

    event ProfileUpdated(
        address indexed wallet,
        string username
    );

    event AvatarUpdated(
        address indexed wallet,
        string avatarURI
    );

    // ─────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────

    struct Profile {
        address wallet;
        string username;
        string bio;
        string avatarURI;     // ipfs hash
        string websiteURL;
        uint256 createdAt;
        bool exists;
    }

    // ─────────────────────────────────────────
    //  WRITE
    // ─────────────────────────────────────────

    function createProfile(
        string calldata username,
        string calldata bio,
        string calldata avatarURI,
        string calldata websiteURL
    ) external;

    function updateProfile(
        string calldata username,
        string calldata bio,
        string calldata websiteURL
    ) external;

    function updateAvatar(string calldata avatarURI) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getProfile(
        address wallet
    ) external view returns (Profile memory);

    function getProfileByUsername(
        string calldata username
    ) external view returns (Profile memory);

    function hasProfile(address wallet) external view returns (bool);

    function isUsernameTaken(
        string calldata username
    ) external view returns (bool);
}