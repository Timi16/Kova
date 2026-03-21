import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { injectiveTestnet } from "@/lib/chains";

const config = createConfig({
  chains: [injectiveTestnet],
  transports: {
    [injectiveTestnet.id]: http(
      "https://injectiveevm-testnet-rpc.polkachu.com",
    ),
  },
});

export default config;
