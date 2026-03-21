const FIXED_PRICE_MINTER_ABI = [
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "payable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "to", type: "address" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mintEdition",
    stateMutability: "payable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "registerNFT",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collection", type: "address" },
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "price", type: "uint256" },
          { name: "maxPerWallet", type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "registerEdition",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collection", type: "address" },
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "price", type: "uint256" },
          { name: "maxPerWallet", type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [{ name: "collection", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [{ name: "collection", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getMintPrice",
    stateMutability: "view",
    inputs: [{ name: "collection", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "isPaused",
    stateMutability: "view",
    inputs: [{ name: "collection", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "minterType",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "getConfig",
    stateMutability: "view",
    inputs: [{ name: "collection", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "price", type: "uint256" },
          { name: "maxPerWallet", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "MintExecuted",
    anonymous: false,
    inputs: [
      { indexed: true, name: "collection", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "quantity", type: "uint256" },
      { indexed: false, name: "totalPaid", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "MintPausedEvent",
    anonymous: false,
    inputs: [{ indexed: true, name: "collection", type: "address" }],
  },
  {
    type: "event",
    name: "MintUnpaused",
    anonymous: false,
    inputs: [{ indexed: true, name: "collection", type: "address" }],
  },
] as const;

export default FIXED_PRICE_MINTER_ABI;
