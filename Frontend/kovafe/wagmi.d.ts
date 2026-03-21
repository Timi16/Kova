import "wagmi";
import wagmiConfig from "@/lib/wagmi";

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
