import { injectiveTestnet } from "@/lib/chains";

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export const privyConfig = {
  defaultChain: injectiveTestnet,
  supportedChains: [injectiveTestnet],
  loginMethods: ["wallet", "email", "google", "twitter"],
  appearance: {
    theme: "dark" as const,
    accentColor: "#836EF9" as const,
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets" as const,
    requireUserPasswordOnCreate: false,
  },
};
