const FREE_MINTER_ABI = [
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
      { name: "walletLimit", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "registerEdition",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "walletLimit", type: "uint256" },
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
] as const;

export default FREE_MINTER_ABI;
