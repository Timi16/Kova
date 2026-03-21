const ALLOWLIST_MINTER_ABI = [
  {
    type: "function",
    name: "mintNFTAllowlist",
    stateMutability: "payable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "to", type: "address" },
      { name: "quantity", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mintEditionAllowlist",
    stateMutability: "payable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
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
          { name: "merkleRoot", type: "bytes32" },
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
          { name: "merkleRoot", type: "bytes32" },
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
    name: "updateMerkleRoot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "newRoot", type: "bytes32" },
    ],
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
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [
      { name: "collection", type: "address" },
      { name: "wallet", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
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
          { name: "merkleRoot", type: "bytes32" },
          { name: "maxPerWallet", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "minterType",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export default ALLOWLIST_MINTER_ABI;
