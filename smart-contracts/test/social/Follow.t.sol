// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/social/KaliesoFollow.sol";

contract FollowTest is Test {

    KaliesoFollow public followContract;

    address public owner   = makeAddr("owner");
    address public alice   = makeAddr("alice");
    address public bob     = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public diana   = makeAddr("diana");

    // ─────────────────────────────────────────
    //  SETUP
    // ─────────────────────────────────────────

    function setUp() public {
        vm.prank(owner);
        followContract = new KaliesoFollow(owner);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsOwner() public {
        assertEq(followContract.owner(), owner);
    }

    function test_InitialCountsAreZero() public {
        assertEq(followContract.followerCount(alice), 0);
        assertEq(followContract.followingCount(alice), 0);
    }

    // ─────────────────────────────────────────
    //  FOLLOW
    // ─────────────────────────────────────────

    function test_Follow() public {
        vm.prank(alice);
        followContract.follow(bob);

        assertTrue(followContract.isFollowing(alice, bob));
        assertEq(followContract.followerCount(bob), 1);
        assertEq(followContract.followingCount(alice), 1);
    }

    function test_FollowEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IFollow.Followed(alice, bob, block.timestamp);
        followContract.follow(bob);
    }

    function test_FollowMultipleCreators() public {
        vm.startPrank(alice);
        followContract.follow(bob);
        followContract.follow(charlie);
        followContract.follow(diana);
        vm.stopPrank();

        assertEq(followContract.followingCount(alice), 3);
        assertTrue(followContract.isFollowing(alice, bob));
        assertTrue(followContract.isFollowing(alice, charlie));
        assertTrue(followContract.isFollowing(alice, diana));
    }

    function test_MultipleFollowersOnCreator() public {
        vm.prank(alice);
        followContract.follow(charlie);

        vm.prank(bob);
        followContract.follow(charlie);

        vm.prank(diana);
        followContract.follow(charlie);

        assertEq(followContract.followerCount(charlie), 3);
    }

    function test_FollowRevertsCannotFollowSelf() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoFollow.CannotFollowSelf.selector);
        followContract.follow(alice);
    }

    function test_FollowRevertsZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert(ZeroAddress.selector);
        followContract.follow(address(0));
    }

    function test_FollowRevertsAlreadyFollowing() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(alice);
        vm.expectRevert(KaliesoFollow.AlreadyFollowing.selector);
        followContract.follow(bob);
    }

    // ─────────────────────────────────────────
    //  UNFOLLOW
    // ─────────────────────────────────────────

    function test_Unfollow() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(alice);
        followContract.unfollow(bob);

        assertFalse(followContract.isFollowing(alice, bob));
        assertEq(followContract.followerCount(bob), 0);
        assertEq(followContract.followingCount(alice), 0);
    }

    function test_UnfollowEmitsEvent() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IFollow.Unfollowed(alice, bob, block.timestamp);
        followContract.unfollow(bob);
    }

    function test_UnfollowRevertsIfNotFollowing() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoFollow.NotFollowing.selector);
        followContract.unfollow(bob);
    }

    function test_UnfollowAndRefollowWorks() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(alice);
        followContract.unfollow(bob);

        vm.prank(alice);
        followContract.follow(bob);

        assertTrue(followContract.isFollowing(alice, bob));
        assertEq(followContract.followerCount(bob), 1);
    }

    // ─────────────────────────────────────────
    //  UNFOLLOW — ARRAY INTEGRITY
    //  tests the swap and pop logic
    //  ensures array stays clean after removal
    // ─────────────────────────────────────────

    function test_UnfollowMiddleElementArrayIntegrity() public {
        // alice follows bob, charlie, diana
        vm.startPrank(alice);
        followContract.follow(bob);
        followContract.follow(charlie);
        followContract.follow(diana);
        vm.stopPrank();

        // unfollow charlie (middle element)
        vm.prank(alice);
        followContract.unfollow(charlie);

        // check array integrity
        address[] memory following = followContract.getFollowing(alice);
        assertEq(following.length, 2);

        // should not contain charlie
        for (uint256 i = 0; i < following.length; i++) {
            assertTrue(following[i] != charlie);
        }

        assertFalse(followContract.isFollowing(alice, charlie));
        assertTrue(followContract.isFollowing(alice, bob));
        assertTrue(followContract.isFollowing(alice, diana));
    }

    function test_UnfollowFirstElementArrayIntegrity() public {
        vm.startPrank(alice);
        followContract.follow(bob);
        followContract.follow(charlie);
        followContract.follow(diana);
        vm.stopPrank();

        // unfollow first element
        vm.prank(alice);
        followContract.unfollow(bob);

        address[] memory following = followContract.getFollowing(alice);
        assertEq(following.length, 2);

        for (uint256 i = 0; i < following.length; i++) {
            assertTrue(following[i] != bob);
        }
    }

    function test_UnfollowLastElementArrayIntegrity() public {
        vm.startPrank(alice);
        followContract.follow(bob);
        followContract.follow(charlie);
        followContract.follow(diana);
        vm.stopPrank();

        // unfollow last element
        vm.prank(alice);
        followContract.unfollow(diana);

        address[] memory following = followContract.getFollowing(alice);
        assertEq(following.length, 2);

        for (uint256 i = 0; i < following.length; i++) {
            assertTrue(following[i] != diana);
        }
    }

    function test_FollowerArrayIntegrityAfterUnfollow() public {
        // three users follow charlie
        vm.prank(alice);
        followContract.follow(charlie);

        vm.prank(bob);
        followContract.follow(charlie);

        vm.prank(diana);
        followContract.follow(charlie);

        // bob unfollows charlie
        vm.prank(bob);
        followContract.unfollow(charlie);

        address[] memory followers = followContract.getFollowers(charlie);
        assertEq(followers.length, 2);

        // should not contain bob
        for (uint256 i = 0; i < followers.length; i++) {
            assertTrue(followers[i] != bob);
        }

        assertEq(followContract.followerCount(charlie), 2);
    }

    // ─────────────────────────────────────────
    //  GET FOLLOWERS / FOLLOWING
    // ─────────────────────────────────────────

    function test_GetFollowers() public {
        vm.prank(alice);
        followContract.follow(charlie);

        vm.prank(bob);
        followContract.follow(charlie);

        address[] memory followers = followContract.getFollowers(charlie);
        assertEq(followers.length, 2);
        assertEq(followers[0], alice);
        assertEq(followers[1], bob);
    }

    function test_GetFollowing() public {
        vm.startPrank(alice);
        followContract.follow(bob);
        followContract.follow(charlie);
        vm.stopPrank();

        address[] memory following = followContract.getFollowing(alice);
        assertEq(following.length, 2);
        assertEq(following[0], bob);
        assertEq(following[1], charlie);
    }

    function test_GetFollowersReturnsEmptyIfNone() public {
        address[] memory followers = followContract.getFollowers(alice);
        assertEq(followers.length, 0);
    }

    function test_GetFollowingReturnsEmptyIfNone() public {
        address[] memory following = followContract.getFollowing(alice);
        assertEq(following.length, 0);
    }

    // ─────────────────────────────────────────
    //  IS FOLLOWING
    // ─────────────────────────────────────────

    function test_IsFollowingReturnsFalseInitially() public {
        assertFalse(followContract.isFollowing(alice, bob));
    }

    function test_IsFollowingReturnsTrueAfterFollow() public {
        vm.prank(alice);
        followContract.follow(bob);
        assertTrue(followContract.isFollowing(alice, bob));
    }

    function test_IsFollowingReturnsFalseAfterUnfollow() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(alice);
        followContract.unfollow(bob);

        assertFalse(followContract.isFollowing(alice, bob));
    }

    function test_IsFollowingIsDirectional() public {
        // alice follows bob
        vm.prank(alice);
        followContract.follow(bob);

        // bob does NOT follow alice
        assertTrue(followContract.isFollowing(alice, bob));
        assertFalse(followContract.isFollowing(bob, alice));
    }

    // ─────────────────────────────────────────
    //  MUTUAL FOLLOW
    // ─────────────────────────────────────────

    function test_MutualFollow() public {
        vm.prank(alice);
        followContract.follow(bob);

        vm.prank(bob);
        followContract.follow(alice);

        assertTrue(followContract.isFollowing(alice, bob));
        assertTrue(followContract.isFollowing(bob, alice));

        assertEq(followContract.followerCount(alice), 1);
        assertEq(followContract.followerCount(bob), 1);
        assertEq(followContract.followingCount(alice), 1);
        assertEq(followContract.followingCount(bob), 1);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_FollowCountAccurate(uint8 count) public {
        vm.assume(count > 0 && count <= 20);

        for (uint8 i = 1; i <= count; i++) {
            address user = makeAddr(string(abi.encodePacked("follower", i)));
            vm.prank(user);
            followContract.follow(alice);
        }

        assertEq(followContract.followerCount(alice), count);
    }
}