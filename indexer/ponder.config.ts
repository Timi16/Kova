import { createConfig } from "@ponder/core";
import { http } from "viem";
import FACTORY_ABI from "../Frontend/kovafe/lib/abis/factory.abi";
import FIXED_PRICE_MINTER_ABI from "../Frontend/kovafe/lib/abis/fixedPriceMinter.abi";
import MARKETPLACE_ABI from "../Frontend/kovafe/lib/abis/marketplace.abi";
import OFFERS_ABI from "../Frontend/kovafe/lib/abis/offers.abi";
import KALIESO_PROFILES_ABI from "../Frontend/kovafe/lib/abis/kaliesoProfiles.abi";
import KALIESO_FOLLOW_ABI from "../Frontend/kovafe/lib/abis/kaliesoFollow.abi";
import KALIESO_POSTS_ABI from "../Frontend/kovafe/lib/abis/kaliesoPosts.abi";

export default createConfig({
  networks: {
    injective: {
      chainId: 1439,
      transport: http("https://injectiveevm-testnet-rpc.polkachu.com"),
    },
  },
  contracts: {
    Factory: {
      network: "injective",
      abi: FACTORY_ABI,
      address: "0x5fcE9Db69fbeEB5D14C020C2c391874DbC6281C8",
      startBlock: 118000000,
    },
    FixedPriceMinter: {
      network: "injective",
      abi: FIXED_PRICE_MINTER_ABI,
      address: "0x487963Cf2046977E0D3176E8a7b6FC81ac7f7851",
      startBlock: 118000000,
    },
    Marketplace: {
      network: "injective",
      abi: MARKETPLACE_ABI,
      address: "0xBD60d7F02DDd6990e0564c4da9DC58F37F2e95e4",
      startBlock: 118000000,
    },
    Offers: {
      network: "injective",
      abi: OFFERS_ABI,
      address: "0xf8D4c292449D801D30c8f8697f5aed00933d414B",
      startBlock: 118000000,
    },
    KaliesoProfiles: {
      network: "injective",
      abi: KALIESO_PROFILES_ABI,
      address: "0xf8c11cb13f0B5396b47D516d5706E6feC5B0A3d7",
      startBlock: 118126655,
    },
    KaliesoFollow: {
      network: "injective",
      abi: KALIESO_FOLLOW_ABI,
      address: "0x31C3f25ecc7D414b14c960B6a0e0cd85e1C12aA3",
      startBlock: 118126655,
    },
    KaliesoPosts: {
      network: "injective",
      abi: KALIESO_POSTS_ABI,
      address: "0x99DeEe4b6840c757305Bb4f5a8fCbb2d05266a42",
      startBlock: 118126655,
    },
  },
});
