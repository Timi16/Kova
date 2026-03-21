// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/Types.sol";

interface IPosts {

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

    event PostCreated(
        uint256 indexed postId,
        address indexed creator,
        address indexed nftContract,
        TokenType tokenType,
        string title,
        uint256 createdAt
    );

    event PostDeleted(
        uint256 indexed postId,
        address indexed creator
    );

    event CommentAdded(
        uint256 indexed postId,
        uint256 indexed commentId,
        address indexed commenter,
        string content
    );

    event CommentDeleted(
        uint256 indexed postId,
        uint256 indexed commentId
    );

    event PostLiked(
        uint256 indexed postId,
        address indexed liker
    );

    event PostUnliked(
        uint256 indexed postId,
        address indexed liker
    );

    // ─────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────

    struct Post {
        uint256 postId;
        address creator;
        address nftContract;      // NFT or Edition deployed by Factory
        TokenType tokenType;      // ERC721 or ERC1155
        uint256 editionTokenId;   // only relevant for ERC1155
        string title;
        string description;
        string contentURI;        // ipfs hash of image/video
        string mediaType;         // "image" | "video"
        uint256 likeCount;
        uint256 commentCount;
        uint256 createdAt;
        bool deleted;
    }

    struct Comment {
        uint256 commentId;
        uint256 postId;
        address commenter;
        string content;
        uint256 createdAt;
        bool deleted;
    }

    // ─────────────────────────────────────────
    //  WRITE
    // ─────────────────────────────────────────

    function createPost(
        address nftContract,
        TokenType tokenType,
        uint256 editionTokenId,
        string calldata title,
        string calldata description,
        string calldata contentURI,
        string calldata mediaType
    ) external;

    function deletePost(uint256 postId) external;

    function addComment(
        uint256 postId,
        string calldata content
    ) external;

    function deleteComment(
        uint256 postId,
        uint256 commentId
    ) external;

    function likePost(uint256 postId) external;
    function unlikePost(uint256 postId) external;

    // ─────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────

    function getPost(
        uint256 postId
    ) external view returns (Post memory);

    function getPostsByCreator(
        address creator
    ) external view returns (Post[] memory);

    function getComments(
        uint256 postId
    ) external view returns (Comment[] memory);

    function hasLiked(
        uint256 postId,
        address wallet
    ) external view returns (bool);

    function totalPosts() external view returns (uint256);
}