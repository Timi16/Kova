// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/social/KaliesoProfiles.sol";

contract ProfilesTest is Test {

    KaliesoProfiles public profiles;

    address public owner   = makeAddr("owner");
    address public alice   = makeAddr("alice");
    address public bob     = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    // ─────────────────────────────────────────
    //  SETUP
    // ─────────────────────────────────────────

    function setUp() public {
        vm.prank(owner);
        profiles = new KaliesoProfiles(owner);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsOwner() public {
        assertEq(profiles.owner(), owner);
    }

    function test_TotalProfilesStartsZero() public {
        assertEq(profiles.getTotalProfiles(), 0);
    }

    // ─────────────────────────────────────────
    //  CREATE PROFILE
    // ─────────────────────────────────────────

    function test_CreateProfile() public {
        vm.prank(alice);
        profiles.createProfile(
            "alice_art",
            "Digital artist on Injective",
            "ipfs://QmAvatarHash",
            "https://alice.xyz"
        );

        assertTrue(profiles.hasProfile(alice));

        IProfiles.Profile memory p = profiles.getProfile(alice);
        assertEq(p.wallet,     alice);
        assertEq(p.username,   "alice_art");
        assertEq(p.bio,        "Digital artist on Injective");
        assertEq(p.avatarURI,  "ipfs://QmAvatarHash");
        assertEq(p.websiteURL, "https://alice.xyz");
        assertTrue(p.exists);
        assertEq(p.createdAt,  block.timestamp);
    }

    function test_CreateProfileEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit IProfiles.ProfileCreated(alice, "alice_art", block.timestamp);
        profiles.createProfile(
            "alice_art",
            "Bio",
            "ipfs://QmHash",
            ""
        );
    }

    function test_CreateProfileIncrementsTotalCount() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(bob);
        profiles.createProfile("bob_photo", "Bob bio", "", "");

        assertEq(profiles.getTotalProfiles(), 2);
    }

    function test_CreateProfileRevertsIfAlreadyExists() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(alice);
        vm.expectRevert(
            KaliesoProfiles.ProfileAlreadyExists.selector
        );
        profiles.createProfile("alice_art2", "Bio", "", "");
    }

    function test_CreateProfileRevertsUsernameTaken() public {
        vm.prank(alice);
        profiles.createProfile("coolname", "Bio", "", "");

        // bob tries to take same username
        vm.prank(bob);
        vm.expectRevert(KaliesoProfiles.UsernameTaken.selector);
        profiles.createProfile("coolname", "Bob bio", "", "");
    }

    function test_CreateProfileUsernameIsCaseInsensitive() public {
        vm.prank(alice);
        profiles.createProfile("CoolName", "Bio", "", "");

        // bob tries lowercase version — should fail
        vm.prank(bob);
        vm.expectRevert(KaliesoProfiles.UsernameTaken.selector);
        profiles.createProfile("coolname", "Bob bio", "", "");
    }

    function test_CreateProfileRevertsEmptyUsername() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameEmpty.selector);
        profiles.createProfile("", "Bio", "", "");
    }

    function test_CreateProfileRevertsUsernameTooLong() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameTooLong.selector);
        profiles.createProfile(
            "this_username_is_way_too_long_for_kalieso",
            "Bio", "", ""
        );
    }

    function test_CreateProfileRevertsInvalidCharsInUsername() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameInvalidChars.selector);
        profiles.createProfile("alice art", "Bio", "", ""); // space
    }

    function test_CreateProfileRevertsInvalidCharsDash() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameInvalidChars.selector);
        profiles.createProfile("alice-art", "Bio", "", ""); // dash
    }

    function test_CreateProfileRevertsInvalidCharsAt() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameInvalidChars.selector);
        profiles.createProfile("@alice", "Bio", "", ""); // @
    }

    function test_CreateProfileAllowsUnderscore() public {
        vm.prank(alice);
        profiles.createProfile("alice_art_2024", "Bio", "", "");
        assertTrue(profiles.hasProfile(alice));
    }

    function test_CreateProfileAllowsNumbers() public {
        vm.prank(alice);
        profiles.createProfile("alice123", "Bio", "", "");
        assertTrue(profiles.hasProfile(alice));
    }

    // ─────────────────────────────────────────
    //  UPDATE PROFILE
    // ─────────────────────────────────────────

    function test_UpdateProfile() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Old bio", "", "");

        vm.prank(alice);
        profiles.updateProfile(
            "alice_updated",
            "New bio",
            "https://newalice.xyz"
        );

        IProfiles.Profile memory p = profiles.getProfile(alice);
        assertEq(p.username,   "alice_updated");
        assertEq(p.bio,        "New bio");
        assertEq(p.websiteURL, "https://newalice.xyz");
    }

    function test_UpdateProfileFreesOldUsername() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(alice);
        profiles.updateProfile("alice_new", "Bio", "");

        // old username should now be available
        assertFalse(profiles.isUsernameTaken("alice_art"));

        // bob can now take it
        vm.prank(bob);
        profiles.createProfile("alice_art", "Bob bio", "", "");
        assertTrue(profiles.hasProfile(bob));
    }

    function test_UpdateProfileKeepsSameUsername() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        // update with same username should work fine
        vm.prank(alice);
        profiles.updateProfile("alice_art", "New bio", "");

        IProfiles.Profile memory p = profiles.getProfile(alice);
        assertEq(p.username, "alice_art");
        assertEq(p.bio, "New bio");
    }

    function test_UpdateProfileRevertsIfNoProfile() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.ProfileDoesNotExist.selector);
        profiles.updateProfile("alice_art", "Bio", "");
    }

    function test_UpdateProfileRevertsUsernameTaken() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(bob);
        profiles.createProfile("bob_photo", "Bob bio", "", "");

        // alice tries to take bob's username
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.UsernameTaken.selector);
        profiles.updateProfile("bob_photo", "Bio", "");
    }

    function test_UpdateProfileEmitsEvent() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit IProfiles.ProfileUpdated(alice, "alice_new");
        profiles.updateProfile("alice_new", "Bio", "");
    }

    // ─────────────────────────────────────────
    //  UPDATE AVATAR
    // ─────────────────────────────────────────

    function test_UpdateAvatar() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "ipfs://OldHash", "");

        vm.prank(alice);
        profiles.updateAvatar("ipfs://NewHash");

        IProfiles.Profile memory p = profiles.getProfile(alice);
        assertEq(p.avatarURI, "ipfs://NewHash");
    }

    function test_UpdateAvatarEmitsEvent() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit IProfiles.AvatarUpdated(alice, "ipfs://NewHash");
        profiles.updateAvatar("ipfs://NewHash");
    }

    function test_UpdateAvatarRevertsIfNoProfile() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoProfiles.ProfileDoesNotExist.selector);
        profiles.updateAvatar("ipfs://NewHash");
    }

    // ─────────────────────────────────────────
    //  GET PROFILE BY USERNAME
    // ─────────────────────────────────────────

    function test_GetProfileByUsername() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        IProfiles.Profile memory p = profiles.getProfileByUsername("alice_art");
        assertEq(p.wallet, alice);
    }

    function test_GetProfileByUsernameCaseInsensitive() public {
        vm.prank(alice);
        profiles.createProfile("Alice_Art", "Bio", "", "");

        IProfiles.Profile memory p = profiles.getProfileByUsername("alice_art");
        assertEq(p.wallet, alice);
    }

    function test_GetProfileByUsernameRevertsNotFound() public {
        vm.expectRevert(KaliesoProfiles.ProfileDoesNotExist.selector);
        profiles.getProfileByUsername("nonexistent");
    }

    // ─────────────────────────────────────────
    //  IS USERNAME TAKEN
    // ─────────────────────────────────────────

    function test_IsUsernameTaken() public {
        assertFalse(profiles.isUsernameTaken("alice_art"));

        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        assertTrue(profiles.isUsernameTaken("alice_art"));
        assertTrue(profiles.isUsernameTaken("ALICE_ART")); // case insensitive
    }

    // ─────────────────────────────────────────
    //  ADMIN — REMOVE PROFILE
    // ─────────────────────────────────────────

    function test_AdminRemoveProfile() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(owner);
        profiles.removeProfile(alice);

        assertFalse(profiles.hasProfile(alice));
        // username freed
        assertFalse(profiles.isUsernameTaken("alice_art"));
    }

    function test_RemoveProfileRevertsIfNotOwner() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(bob);
        vm.expectRevert();
        profiles.removeProfile(alice);
    }

    function test_RemoveProfileRevertsIfNoProfile() public {
        vm.prank(owner);
        vm.expectRevert(KaliesoProfiles.ProfileDoesNotExist.selector);
        profiles.removeProfile(alice);
    }

    // ─────────────────────────────────────────
    //  GET ALL PROFILES
    // ─────────────────────────────────────────

    function test_GetAllProfiles() public {
        vm.prank(alice);
        profiles.createProfile("alice_art", "Bio", "", "");

        vm.prank(bob);
        profiles.createProfile("bob_photo", "Bio", "", "");

        address[] memory all = profiles.getAllProfiles();
        assertEq(all.length, 2);
        assertEq(all[0], alice);
        assertEq(all[1], bob);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_MultipleProfilesUnique(
        uint8 count
    ) public {
        vm.assume(count > 0 && count <= 20);

        for (uint8 i = 1; i <= count; i++) {
            address user = makeAddr(string(abi.encodePacked("user", i)));
            vm.prank(user);
            profiles.createProfile(
                string(abi.encodePacked("user_", i)),
                "Bio",
                "",
                ""
            );
        }

        assertEq(profiles.getTotalProfiles(), count);
    }
}