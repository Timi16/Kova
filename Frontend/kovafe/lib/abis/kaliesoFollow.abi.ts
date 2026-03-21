const KALIESO_FOLLOW_ABI = [
  {
    type: "function",
    name: "follow",
    stateMutability: "nonpayable",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unfollow",
    stateMutability: "nonpayable",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "isFollowing",
    stateMutability: "view",
    inputs: [
      { name: "follower", type: "address" },
      { name: "creator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getFollowers",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "getFollowing",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "followerCount",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "followingCount",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Followed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "follower", type: "address" },
      { indexed: true, name: "following", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Unfollowed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "follower", type: "address" },
      { indexed: true, name: "following", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
] as const;

export default KALIESO_FOLLOW_ABI;
