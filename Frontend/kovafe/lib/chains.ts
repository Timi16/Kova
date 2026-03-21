import type { Chain } from "viem";

export const injectiveTestnet = {
  id: 1439,
  name: "Injective Testnet",
  nativeCurrency: {
    name: "Injective",
    symbol: "INJ",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://injectiveevm-testnet-rpc.polkachu.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Injective Explorer",
      url: "https://explorer.injective.network",
    },
  },
  testnet: true,
} satisfies Chain;

export const injectiveExplorerUrl =
  process.env.NEXT_PUBLIC_INJECTIVE_EXPLORER ??
  injectiveTestnet.blockExplorers.default.url;
