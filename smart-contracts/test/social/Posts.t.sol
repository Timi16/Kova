// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/social/KaliesoPosts.sol";
import "../../src/social/KaliesoProfiles.sol";
import "../../src/utils/Types.sol";

contract PostsTest is Test {

    KaliesoPosts    public posts;
    KaliesoProfiles public profiles;

    address public owner   = makeAddr("owner");
    address public alice   = makeAddr("alice");
    address public bob     = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    address public mockNFT     = makeAddr("mockNFT");
    address public mockNFT2    = makeAddr("mockNFT2");
    address public mockNFT3    = makeAddr("mockNFT3");

    // ─────────────────────────────────────────
    //  SETUP
    // ─────────────────────────────────────────

    function setUp() public {
        vm.startPrank(owner);
        profiles = new KaliesoProfiles(owner);
        posts    = new KaliesoPosts(address(profiles), owner);
        vm.stopPrank();

        // create profiles for test users
        vm.prank(alice);
        profiles.createProfile("alice_art", "Artist", "ipfs://QmAlice", "");

        vm.prank(bob);
        profiles.createProfile("bob_photo", "Photographer", "ipfs://QmBob", "");
    }

    // ─────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────

    function _createAlicePost(
        address nftContract
    ) internal returns (uint256 postId) {
        vm.prank(alice);
        posts.createPost(
            nftContract,
            TokenType.ERC721,
            0,
            "Summer Void",
            "A visual exploration of summer",
            "ipfs://QmContentHash",
            "image"
        );
        return posts.getPostIdByNFT(nftContract);
    }

    // ─────────────────────────────────────────
    //  DEPLOYMENT
    // ─────────────────────────────────────────

    function test_DeploymentSetsProfilesContract() public {
        assertEq(
            address(posts.profilesContract()),
            address(profiles)
        );
    }

    function test_TotalPostsStartsZero() public {
        assertEq(posts.totalPosts(), 0);
    }

    function test_DeployRevertsZeroProfilesAddress() public {
        vm.expectRevert(ZeroAddress.selector);
        new KaliesoPosts(address(0), owner);
    }

    // ─────────────────────────────────────────
    //  CREATE POST
    // ─────────────────────────────────────────

    function test_CreatePost() public {
        vm.prank(alice);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "Summer Void",
            "A visual exploration",
            "ipfs://QmContentHash",
            "image"
        );

        assertEq(posts.totalPosts(), 1);

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.postId,      1);
        assertEq(post.creator,     alice);
        assertEq(post.nftContract, mockNFT);
        assertEq(uint8(post.tokenType), uint8(TokenType.ERC721));
        assertEq(post.title,       "Summer Void");
        assertEq(post.description, "A visual exploration");
        assertEq(post.contentURI,  "ipfs://QmContentHash");
        assertEq(post.mediaType,   "image");
        assertEq(post.likeCount,   0);
        assertEq(post.commentCount, 0);
        assertFalse(post.deleted);
    }

    function test_CreatePostEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit IPosts.PostCreated(
            1,
            alice,
            mockNFT,
            TokenType.ERC721,
            "Summer Void",
            block.timestamp
        );
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "Summer Void",
            "Description",
            "ipfs://QmHash",
            "image"
        );
    }

    function test_CreatePostERC1155() public {
        vm.prank(alice);
        posts.createPost(
            mockNFT,
            TokenType.ERC1155,
            3,
            "Open Edition",
            "Time limited drop",
            "ipfs://QmEdition",
            "video"
        );

        IPosts.Post memory post = posts.getPost(1);
        assertEq(uint8(post.tokenType),    uint8(TokenType.ERC1155));
        assertEq(post.editionTokenId,      3);
        assertEq(post.mediaType,           "video");
    }

    function test_CreateMultiplePosts() public {
        _createAlicePost(mockNFT);
        _createAlicePost(mockNFT2);

        assertEq(posts.totalPosts(), 2);

        IPosts.Post[] memory alicePosts = posts.getPostsByCreator(alice);
        assertEq(alicePosts.length, 2);
    }

    function test_CreatePostRevertsNoProfile() public {
        // charlie has no profile
        vm.prank(charlie);
        vm.expectRevert(KaliesoPosts.NoProfileFound.selector);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "Title",
            "",
            "ipfs://QmHash",
            "image"
        );
    }

    function test_CreatePostRevertsZeroNFTAddress() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.InvalidNFTContract.selector);
        posts.createPost(
            address(0),
            TokenType.ERC721,
            0,
            "Title",
            "",
            "ipfs://QmHash",
            "image"
        );
    }

    function test_CreatePostRevertsNFTAlreadyPosted() public {
        _createAlicePost(mockNFT);

        // same nft contract cannot be posted twice
        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.InvalidNFTContract.selector);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "Duplicate",
            "",
            "ipfs://QmHash2",
            "image"
        );
    }

    function test_CreatePostRevertsEmptyTitle() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.EmptyContent.selector);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "",
            "",
            "ipfs://QmHash",
            "image"
        );
    }

    function test_CreatePostRevertsEmptyContentURI() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.EmptyContent.selector);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            "Title",
            "",
            "",
            "image"
        );
    }

    function test_CreatePostRevertsTitleTooLong() public {
        string memory longTitle = "This title is way too long and "
            "should fail the validation check because "
            "it exceeds one hundred characters easily";

        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.ContentTooLong.selector);
        posts.createPost(
            mockNFT,
            TokenType.ERC721,
            0,
            longTitle,
            "",
            "ipfs://QmHash",
            "image"
        );
    }

    // ─────────────────────────────────────────
    //  DELETE POST
    // ─────────────────────────────────────────

    function test_DeletePost() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        posts.deletePost(1);

        IPosts.Post memory post = posts.getPost(1);
        assertTrue(post.deleted);
    }

    function test_DeletePostEmitsEvent() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit IPosts.PostDeleted(1, alice);
        posts.deletePost(1);
    }

    function test_DeletePostRevertsIfNotCreator() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        vm.expectRevert(KaliesoPosts.NotPostCreator.selector);
        posts.deletePost(1);
    }

    function test_OwnerCanDeleteAnyPost() public {
        _createAlicePost(mockNFT);

        vm.prank(owner);
        posts.deletePost(1);

        IPosts.Post memory post = posts.getPost(1);
        assertTrue(post.deleted);
    }

    function test_DeletePostRevertsIfAlreadyDeleted() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        posts.deletePost(1);

        vm.prank(alice);
        vm.expectRevert();
        posts.deletePost(1);
    }

    function test_DeletePostRevertsNonExistent() public {
        vm.prank(alice);
        vm.expectRevert(KaliesoPosts.PostDoesNotExist.selector);
        posts.deletePost(999);
    }

    // ─────────────────────────────────────────
    //  COMMENTS
    // ─────────────────────────────────────────

    function test_AddComment() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "Love this work!");

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertEq(comments.length, 1);
        assertEq(comments[0].commentId, 1);
        assertEq(comments[0].commenter, bob);
        assertEq(comments[0].content,   "Love this work!");
        assertEq(comments[0].postId,    1);
        assertFalse(comments[0].deleted);
    }

    function test_AddCommentEmitsEvent() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit IPosts.CommentAdded(1, 1, bob, "Love this!");
        posts.addComment(1, "Love this!");
    }

    function test_AddCommentIncrementsCount() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "Comment 1");

        vm.prank(alice);
        posts.addComment(1, "Comment 2");

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.commentCount, 2);
    }

    function test_AddCommentRevertsNoProfile() public {
        _createAlicePost(mockNFT);

        vm.prank(charlie); // no profile
        vm.expectRevert(KaliesoPosts.NoProfileFound.selector);
        posts.addComment(1, "test");
    }

    function test_AddCommentRevertsEmptyContent() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        vm.expectRevert(KaliesoPosts.EmptyContent.selector);
        posts.addComment(1, "");
    }

    function test_AddCommentRevertsContentTooLong() public {
        _createAlicePost(mockNFT);

        // build a string > 500 chars
        string memory longComment = "a";
        for (uint256 i = 0; i < 10; i++) {
            longComment = string(abi.encodePacked(
                longComment, longComment
            ));
        }

        vm.prank(bob);
        vm.expectRevert(KaliesoPosts.ContentTooLong.selector);
        posts.addComment(1, longComment);
    }

    function test_AddCommentRevertsOnDeletedPost() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        posts.deletePost(1);

        vm.prank(bob);
        vm.expectRevert();
        posts.addComment(1, "comment");
    }

    function test_DeleteComment() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "A comment");

        vm.prank(bob);
        posts.deleteComment(1, 1);

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertTrue(comments[0].deleted);
    }

    function test_DeleteCommentDecrementsCount() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "A comment");

        vm.prank(bob);
        posts.deleteComment(1, 1);

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.commentCount, 0);
    }

    function test_PostCreatorCanDeleteAnyComment() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "Bob comment");

        // alice is post creator, can delete bob's comment
        vm.prank(alice);
        posts.deleteComment(1, 1);

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertTrue(comments[0].deleted);
    }

    function test_OwnerCanDeleteAnyComment() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "Bob comment");

        vm.prank(owner);
        posts.deleteComment(1, 1);

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertTrue(comments[0].deleted);
    }

    function test_DeleteCommentRevertsIfNotCommenter() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.addComment(1, "Bob comment");

        // charlie did not write the comment
        vm.prank(charlie);
        vm.expectRevert(KaliesoPosts.NotCommenter.selector);
        posts.deleteComment(1, 1);
    }

    function test_MultipleCommentsOnPost() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        posts.addComment(1, "First comment");

        vm.prank(bob);
        posts.addComment(1, "Second comment");

        vm.prank(alice);
        posts.addComment(1, "Third comment");

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertEq(comments.length, 3);
        assertEq(comments[0].commenter, alice);
        assertEq(comments[1].commenter, bob);
        assertEq(comments[2].commenter, alice);
    }

    // ─────────────────────────────────────────
    //  LIKES
    // ─────────────────────────────────────────

    function test_LikePost() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.likePost(1);

        assertTrue(posts.hasLiked(1, bob));

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount, 1);
    }

    function test_LikePostEmitsEvent() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        vm.expectEmit(true, true, false, false);
        emit IPosts.PostLiked(1, bob);
        posts.likePost(1);
    }

    function test_MultipleLikes() public {
        _createAlicePost(mockNFT);

        vm.prank(alice);
        posts.likePost(1);

        vm.prank(bob);
        posts.likePost(1);

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount, 2);
    }

    function test_LikeRevertsAlreadyLiked() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.likePost(1);

        vm.prank(bob);
        vm.expectRevert(KaliesoPosts.AlreadyLiked.selector);
        posts.likePost(1);
    }

    function test_UnlikePost() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.likePost(1);

        vm.prank(bob);
        posts.unlikePost(1);

        assertFalse(posts.hasLiked(1, bob));

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount, 0);
    }

    function test_UnlikeEmitsEvent() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.likePost(1);

        vm.prank(bob);
        vm.expectEmit(true, true, false, false);
        emit IPosts.PostUnliked(1, bob);
        posts.unlikePost(1);
    }

    function test_UnlikeRevertsNotLiked() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        vm.expectRevert(KaliesoPosts.NotLiked.selector);
        posts.unlikePost(1);
    }

    function test_LikeUnlikeAndLikeAgain() public {
        _createAlicePost(mockNFT);

        vm.prank(bob);
        posts.likePost(1);

        vm.prank(bob);
        posts.unlikePost(1);

        vm.prank(bob);
        posts.likePost(1);

        assertTrue(posts.hasLiked(1, bob));

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount, 1);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function test_GetPostsByCreator() public {
        _createAlicePost(mockNFT);
        _createAlicePost(mockNFT2);

        IPosts.Post[] memory alicePosts = posts.getPostsByCreator(alice);
        assertEq(alicePosts.length, 2);
        assertEq(alicePosts[0].creator, alice);
        assertEq(alicePosts[1].creator, alice);
    }

    function test_GetPostsByCreatorReturnsEmptyIfNone() public {
        IPosts.Post[] memory result = posts.getPostsByCreator(charlie);
        assertEq(result.length, 0);
    }

    function test_GetPostByNFTContract() public {
        _createAlicePost(mockNFT);

        IPosts.Post memory post = posts.getPostByNFTContract(mockNFT);
        assertEq(post.nftContract, mockNFT);
        assertEq(post.creator,     alice);
    }

    function test_GetPostByNFTRevertsIfNotFound() public {
        vm.expectRevert(KaliesoPosts.PostDoesNotExist.selector);
        posts.getPostByNFTContract(makeAddr("unknown"));
    }

    function test_GetPostIdByNFT() public {
        _createAlicePost(mockNFT);
        assertEq(posts.getPostIdByNFT(mockNFT), 1);
    }

    function test_GetCommentsReturnsEmptyIfNone() public {
        _createAlicePost(mockNFT);
        IPosts.Comment[] memory comments = posts.getComments(1);
        assertEq(comments.length, 0);
    }

    function test_HasLikedReturnsFalseInitially() public {
        _createAlicePost(mockNFT);
        assertFalse(posts.hasLiked(1, bob));
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function test_UpdateProfilesContract() public {
        address newProfiles = makeAddr("newProfiles");
        vm.prank(owner);
        posts.updateProfilesContract(newProfiles);
        assertEq(address(posts.profilesContract()), newProfiles);
    }

    function test_UpdateProfilesContractRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        posts.updateProfilesContract(address(0));
    }

    function test_UpdateProfilesContractRevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        posts.updateProfilesContract(makeAddr("newProfiles"));
    }

    // ─────────────────────────────────────────
    //  END TO END
    // ─────────────────────────────────────────

    function test_E2E_FullPostLifecycle() public {
        // alice creates a post
        _createAlicePost(mockNFT);

        // bob and alice like it
        vm.prank(bob);
        posts.likePost(1);

        vm.prank(alice);
        posts.likePost(1);

        // bob comments
        vm.prank(bob);
        posts.addComment(1, "Amazing work Alice!");

        // alice replies
        vm.prank(alice);
        posts.addComment(1, "Thank you Bob!");

        // check state
        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount,    2);
        assertEq(post.commentCount, 2);

        IPosts.Comment[] memory comments = posts.getComments(1);
        assertEq(comments.length, 2);

        // bob unlikes
        vm.prank(bob);
        posts.unlikePost(1);

        post = posts.getPost(1);
        assertEq(post.likeCount, 1);

        // alice deletes the post
        vm.prank(alice);
        posts.deletePost(1);

        post = posts.getPost(1);
        assertTrue(post.deleted);
    }

    // ─────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────

    function testFuzz_LikeCountAccurate(uint8 likerCount) public {
        vm.assume(likerCount > 0 && likerCount <= 20);

        _createAlicePost(mockNFT);

        for (uint8 i = 1; i <= likerCount; i++) {
            address liker = makeAddr(
                string(abi.encodePacked("liker", i))
            );
            vm.prank(liker);
            posts.likePost(1);
        }

        IPosts.Post memory post = posts.getPost(1);
        assertEq(post.likeCount, likerCount);
    }
}