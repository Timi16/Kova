const FEE_MANAGER_ABI = [
  {
    type: "function",
    name: "collectMintFee",
    stateMutability: "payable",
    inputs: [
      { name: "creator", type: "address" },
      { name: "totalPaid", type: "uint256" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [
      { name: "creatorAmount", type: "uint256" },
      { name: "protocolAmount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "collectSaleFee",
    stateMutability: "payable",
    inputs: [
      { name: "seller", type: "address" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "sellerAmount", type: "uint256" },
      { name: "protocolAmount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "setFee",
    stateMutability: "nonpayable",
    inputs: [{ name: "newBps", type: "uint96" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setTreasury",
    stateMutability: "nonpayable",
    inputs: [{ name: "newTreasury", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setMintFlatFee",
    stateMutability: "nonpayable",
    inputs: [{ name: "newFee", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "feeConfig",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "treasury", type: "address" },
          { name: "feeBps", type: "uint96" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "calculateFee",
    stateMutability: "view",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [
      { name: "fee", type: "uint256" },
      { name: "remainder", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "mintFlatFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export default FEE_MANAGER_ABI;
