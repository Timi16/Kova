// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IFollow.sol";
import "../utils/Errors.sol";

contract KaliesoFollow is IFollow, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
    //  ERRORS (follow specific)
    // ─────────────────────────────────────────

    error CannotFollowSelf();
    error AlreadyFollowing();
    error NotFollowing();

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    // follower → creator → bool
    mapping(address => mapping(address => bool)) private _isFollowing;

    // creator → list of followers
    mapping(address => address[]) private _followers;

    // wallet → list of addresses they follow
    mapping(address => address[]) private _following;

    // follower → creator → index in _followers[creator]
    // for O(1) removal
    mapping(address => mapping(address => uint256)) private _followerIndex;

    // follower → creator → index in _following[follower]
    // for O(1) removal
    mapping(address => mapping(address => uint256)) private _followingIndex;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address owner_) Ownable(owner_) {}

    // ─────────────────────────────────────────
    //  FOLLOW
    //  cannot follow yourself
    //  cannot follow twice
    // ─────────────────────────────────────────

    function follow(address creator) external nonReentrant {
        if (creator == msg.sender) revert CannotFollowSelf();
        if (creator == address(0)) revert ZeroAddress();
        if (_isFollowing[msg.sender][creator]) revert AlreadyFollowing();

        _isFollowing[msg.sender][creator] = true;

        // track index before pushing for O(1) removal later
        _followerIndex[msg.sender][creator] = _followers[creator].length;
        _followers[creator].push(msg.sender);

        _followingIndex[msg.sender][creator] = _following[msg.sender].length;
        _following[msg.sender].push(creator);

        emit Followed(msg.sender, creator, block.timestamp);
    }

    // ─────────────────────────────────────────
    //  UNFOLLOW
    //  swap-and-pop to remove from arrays
    //  without leaving gaps
    // ─────────────────────────────────────────

    function unfollow(address creator) external nonReentrant {
        if (!_isFollowing[msg.sender][creator]) revert NotFollowing();

        _isFollowing[msg.sender][creator] = false;

        // remove from _followers[creator]
        _removeFromArray(
            _followers[creator],
            _followerIndex[msg.sender][creator],
            msg.sender,
            creator,
            true
        );

        // remove from _following[msg.sender]
        _removeFromArray(
            _following[msg.sender],
            _followingIndex[msg.sender][creator],
            creator,
            msg.sender,
            false
        );

        emit Unfollowed(msg.sender, creator, block.timestamp);
    }

    // ─────────────────────────────────────────
    //  INTERNAL — SWAP AND POP
    //  removes element at index by swapping
    //  with last element then popping
    //  updates the index mapping for moved element
    // ─────────────────────────────────────────

    function _removeFromArray(
        address[] storage arr,
        uint256 index,
        address toRemove,
        address mapKey,
        bool isFollowerArray
    ) internal {
        uint256 lastIndex = arr.length - 1;

        if (index != lastIndex) {
            address lastAddr = arr[lastIndex];
            arr[index] = lastAddr;

            // update index mapping for the moved element
            if (isFollowerArray) {
                // arr = _followers[mapKey]
                // moved element is a follower
                _followerIndex[lastAddr][mapKey] = index;
            } else {
                // arr = _following[mapKey]
                // moved element is a creator being followed
                _followingIndex[mapKey][lastAddr] = index;
            }
        }

        arr.pop();
        delete _followerIndex[toRemove][mapKey];
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function isFollowing(
        address follower,
        address creator
    ) external view returns (bool) {
        return _isFollowing[follower][creator];
    }

    function getFollowers(
        address creator
    ) external view returns (address[] memory) {
        return _followers[creator];
    }

    function getFollowing(
        address wallet
    ) external view returns (address[] memory) {
        return _following[wallet];
    }

    function followerCount(
        address creator
    ) external view returns (uint256) {
        return _followers[creator].length;
    }

    function followingCount(
        address wallet
    ) external view returns (uint256) {
        return _following[wallet].length;
    }
}