// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFollow {

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

    event Followed(
        address indexed follower,
        address indexed following,
        uint256 timestamp
    );

    event Unfollowed(
        address indexed follower,
        address indexed following,
        uint256 timestamp
    );

    // ─────────────────────────────────────────
    //  WRITE
    // ─────────────────────────────────────────

    function follow(address creator) external;
    function unfollow(address creator) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function isFollowing(
        address follower,
        address creator
    ) external view returns (bool);

    function getFollowers(
        address creator
    ) external view returns (address[] memory);

    function getFollowing(
        address wallet
    ) external view returns (address[] memory);

    function followerCount(
        address creator
    ) external view returns (uint256);

    function followingCount(
        address wallet
    ) external view returns (uint256);
}