import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { injectiveRpcUrl, injectiveTestnet } from "@/lib/chains";

const config = createConfig({
  chains: [injectiveTestnet],
  transports: {
    [injectiveTestnet.id]: http(injectiveRpcUrl),
  },
});

export default config;
