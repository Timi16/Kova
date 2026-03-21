// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IPosts.sol";
import "../interfaces/IProfiles.sol";
import "../utils/Errors.sol";
import "../utils/Types.sol";

contract KaliesoPosts is IPosts, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────
        //  ERRORS (posts specific)
        // ─────────────────────────────────────────
    
        error PostDoesNotExist();
        error PostAlreadyDeleted();
        error NotPostCreator();
    error CommentDoesNotExist();
    error NotCommenter();
    error AlreadyLiked();
    error NotLiked();
    error EmptyContent();
    error ContentTooLong();
    error NoProfileFound();
    error InvalidNFTContract();

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    // profiles contract — creator must have a profile to post
    IProfiles public profilesContract;

    // auto incrementing post id — starts at 1
    uint256 private _nextPostId;

    // auto incrementing comment id
    uint256 private _nextCommentId;

    // postId → Post
    mapping(uint256 => Post) private _posts;

    // creator → postIds
    mapping(address => uint256[]) private _creatorPosts;

    // nftContract → postId
    // one NFT contract maps to one post
    mapping(address => uint256) private _nftToPost;

    // postId → commentIds
    mapping(uint256 => uint256[]) private _postComments;

    // commentId → Comment
    mapping(uint256 => Comment) private _comments;

    // postId → wallet → hasLiked
    mapping(uint256 => mapping(address => bool)) private _liked;

    // max comment length
    uint256 public constant MAX_COMMENT_LENGTH = 500;

    // max title length
    uint256 public constant MAX_TITLE_LENGTH = 100;

    // max description length
    uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(
        address profilesContract_,
        address owner_
    ) Ownable(owner_) {
        if (profilesContract_ == address(0)) revert ZeroAddress();
        profilesContract = IProfiles(profilesContract_);
        _nextPostId      = 1;
        _nextCommentId   = 1;
    }

    // ─────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────

    modifier postExists(uint256 postId) {
        if (_posts[postId].postId == 0) revert PostDoesNotExist();
        if (_posts[postId].deleted) revert PostAlreadyDeleted();
        _;
    }

    modifier requiresProfile() {
        if (!profilesContract.hasProfile(msg.sender)) revert NoProfileFound();
        _;
    }

    // ─────────────────────────────────────────
    //  CREATE POST
    //  creator must have a Kalieso profile
    //  links directly to deployed NFT/Edition contract
    //  one post per NFT contract address
    // ─────────────────────────────────────────

    function createPost(
        address nftContract,
        TokenType tokenType,
        uint256 editionTokenId,
        string calldata title,
        string calldata description,
        string calldata contentURI,
        string calldata mediaType
    ) external nonReentrant requiresProfile {
        if (nftContract == address(0)) revert InvalidNFTContract();
        if (_nftToPost[nftContract] != 0) revert InvalidNFTContract();
        if (bytes(title).length == 0) revert EmptyContent();
        if (bytes(title).length > MAX_TITLE_LENGTH) revert ContentTooLong();
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert ContentTooLong();
        if (bytes(contentURI).length == 0) revert EmptyContent();

        uint256 postId = _nextPostId++;

        _posts[postId] = Post({
            postId:          postId,
            creator:         msg.sender,
            nftContract:     nftContract,
            tokenType:       tokenType,
            editionTokenId:  editionTokenId,
            title:           title,
            description:     description,
            contentURI:      contentURI,
            mediaType:       mediaType,
            likeCount:       0,
            commentCount:    0,
            createdAt:       block.timestamp,
            deleted:         false
        });

        _creatorPosts[msg.sender].push(postId);
        _nftToPost[nftContract] = postId;

        emit PostCreated(
            postId,
            msg.sender,
            nftContract,
            tokenType,
            title,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────
    //  DELETE POST
    //  soft delete — marks deleted = true
    //  onchain data stays, just hidden in UI
    //  only creator or protocol owner can delete
    // ─────────────────────────────────────────

    function deletePost(
        uint256 postId
    ) external postExists(postId) {
        Post storage post = _posts[postId];
        if (
            post.creator != msg.sender &&
            owner() != msg.sender
        ) revert NotPostCreator();

        post.deleted = true;

        emit PostDeleted(postId, post.creator);
    }

    // ─────────────────────────────────────────
    //  ADD COMMENT
    //  requires profile to comment
    //  max 500 chars
    // ─────────────────────────────────────────

    function addComment(
        uint256 postId,
        string calldata content
    ) external nonReentrant requiresProfile postExists(postId) {
        if (bytes(content).length == 0) revert EmptyContent();
        if (bytes(content).length > MAX_COMMENT_LENGTH) revert ContentTooLong();

        uint256 commentId = _nextCommentId++;

        _comments[commentId] = Comment({
            commentId:  commentId,
            postId:     postId,
            commenter:  msg.sender,
            content:    content,
            createdAt:  block.timestamp,
            deleted:    false
        });

        _postComments[postId].push(commentId);
        _posts[postId].commentCount++;

        emit CommentAdded(postId, commentId, msg.sender, content);
    }

    // ─────────────────────────────────────────
    //  DELETE COMMENT
    //  commenter or post creator or owner can delete
    // ─────────────────────────────────────────

    function deleteComment(
        uint256 postId,
        uint256 commentId
    ) external postExists(postId) {
        Comment storage comment = _comments[commentId];

        if (comment.commentId == 0) revert CommentDoesNotExist();
        if (comment.deleted) revert CommentDoesNotExist();

        bool isCommenter   = comment.commenter == msg.sender;
        bool isPostCreator = _posts[postId].creator == msg.sender;
        bool isOwner       = owner() == msg.sender;

        if (!isCommenter && !isPostCreator && !isOwner) {
            revert NotCommenter();
        }

        comment.deleted = true;

        if (_posts[postId].commentCount > 0) {
            _posts[postId].commentCount--;
        }

        emit CommentDeleted(postId, commentId);
    }

    // ─────────────────────────────────────────
    //  LIKE / UNLIKE
    //  purely social — not onchain value
    //  one like per wallet per post
    // ─────────────────────────────────────────

    function likePost(
        uint256 postId
    ) external nonReentrant postExists(postId) {
        if (_liked[postId][msg.sender]) revert AlreadyLiked();

        _liked[postId][msg.sender] = true;
        _posts[postId].likeCount++;

        emit PostLiked(postId, msg.sender);
    }

    function unlikePost(
        uint256 postId
    ) external nonReentrant postExists(postId) {
        if (!_liked[postId][msg.sender]) revert NotLiked();

        _liked[postId][msg.sender] = false;

        if (_posts[postId].likeCount > 0) {
            _posts[postId].likeCount--;
        }

        emit PostUnliked(postId, msg.sender);
    }

    // ─────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────

    function updateProfilesContract(
        address profilesContract_
    ) external onlyOwner {
        if (profilesContract_ == address(0)) revert ZeroAddress();
        profilesContract = IProfiles(profilesContract_);
    }

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getPost(
        uint256 postId
    ) external view returns (Post memory) {
        if (_posts[postId].postId == 0) revert PostDoesNotExist();
        return _posts[postId];
    }

    function getPostsByCreator(
        address creator
    ) external view returns (Post[] memory) {
        uint256[] memory ids = _creatorPosts[creator];
        Post[] memory result = new Post[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _posts[ids[i]];
        }

        return result;
    }

    function getPostByNFTContract(
        address nftContract
    ) external view returns (Post memory) {
        uint256 postId = _nftToPost[nftContract];
        if (postId == 0) revert PostDoesNotExist();
        return _posts[postId];
    }

    function getComments(
        uint256 postId
    ) external view returns (Comment[] memory) {
        uint256[] memory ids = _postComments[postId];
        Comment[] memory result = new Comment[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _comments[ids[i]];
        }

        return result;
    }

    function hasLiked(
        uint256 postId,
        address wallet
    ) external view returns (bool) {
        return _liked[postId][wallet];
    }

    function totalPosts() external view returns (uint256) {
        return _nextPostId - 1;
    }

    function getPostIdByNFT(
        address nftContract
    ) external view returns (uint256) {
        return _nftToPost[nftContract];
    }
}