const KALIESO_PROFILES_ABI = [
  {
    type: "function",
    name: "createProfile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "username", type: "string" },
      { name: "bio", type: "string" },
      { name: "avatarURI", type: "string" },
      { name: "websiteURL", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateProfile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "username", type: "string" },
      { name: "bio", type: "string" },
      { name: "websiteURL", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateAvatar",
    stateMutability: "nonpayable",
    inputs: [{ name: "avatarURI", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "wallet", type: "address" },
          { name: "username", type: "string" },
          { name: "bio", type: "string" },
          { name: "avatarURI", type: "string" },
          { name: "websiteURL", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getProfileByUsername",
    stateMutability: "view",
    inputs: [{ name: "username", type: "string" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "wallet", type: "address" },
          { name: "username", type: "string" },
          { name: "bio", type: "string" },
          { name: "avatarURI", type: "string" },
          { name: "websiteURL", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "hasProfile",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isUsernameTaken",
    stateMutability: "view",
    inputs: [{ name: "username", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getTotalProfiles",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAllProfiles",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "removeProfile",
    stateMutability: "nonpayable",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [],
  },
  {
    type: "event",
    name: "ProfileCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "wallet", type: "address" },
      { indexed: false, name: "username", type: "string" },
      { indexed: false, name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProfileUpdated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "wallet", type: "address" },
      { indexed: false, name: "username", type: "string" },
    ],
  },
  {
    type: "event",
    name: "AvatarUpdated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "wallet", type: "address" },
      { indexed: false, name: "avatarURI", type: "string" },
    ],
  },
] as const;

export default KALIESO_PROFILES_ABI;
