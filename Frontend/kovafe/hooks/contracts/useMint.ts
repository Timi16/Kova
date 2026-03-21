"use client";

import { useCallback } from "react";
import FIXED_PRICE_MINTER_ABI from "@/lib/abis/fixedPriceMinter.abi";
import FREE_MINTER_ABI from "@/lib/abis/freeMinter.abi";
import TIMED_MINTER_ABI from "@/lib/abis/timedMinter.abi";
import ALLOWLIST_MINTER_ABI from "@/lib/abis/allowlistMinter.abi";
import FEE_MANAGER_ABI from "@/lib/abis/feeManager.abi";
import { CONTRACTS } from "@/lib/contracts";
import { useAuth } from "@/hooks/useAuth";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";
import { usePublicClient } from "wagmi";

type MintableCollection = {
  address: `0x${string}`;
  minter_type?: "FixedPrice" | "Free" | "Timed" | "Allowlist" | null;
  edition_token_id?: number | null;
};

function getMinterAddress(minterType?: MintableCollection["minter_type"]) {
  switch (minterType) {
    case "Free":
      return CONTRACTS.FREE_MINTER;
    case "Timed":
      return CONTRACTS.TIMED_MINTER;
    case "Allowlist":
      return CONTRACTS.ALLOWLIST_MINTER;
    default:
      return CONTRACTS.FIXED_PRICE_MINTER;
  }
}

function getMinterAbi(minterType?: MintableCollection["minter_type"]) {
  switch (minterType) {
    case "Free":
      return FREE_MINTER_ABI;
    case "Timed":
      return TIMED_MINTER_ABI;
    case "Allowlist":
      return ALLOWLIST_MINTER_ABI;
    default:
      return FIXED_PRICE_MINTER_ABI;
  }
}

export function useMint() {
  const publicClient = usePublicClient();
  const { address } = useAuth();
  const contractWrite = useContractWrite();

  const getMintCost = useCallback(
    async (
      minterAddress: `0x${string}`,
      collection: `0x${string}`,
      qty: bigint,
      abi: typeof FIXED_PRICE_MINTER_ABI | typeof FREE_MINTER_ABI | typeof TIMED_MINTER_ABI =
        FIXED_PRICE_MINTER_ABI,
    ) => {
      if (!publicClient) {
        throw new Error("Missing public client");
      }

      const [price, flatFee] = await Promise.all([
        publicClient.readContract({
          address: minterAddress,
          abi: abi as typeof FIXED_PRICE_MINTER_ABI,
          functionName: "getMintPrice",
          args: [collection],
        }),
        publicClient.readContract({
          address: CONTRACTS.FEE_MANAGER,
          abi: FEE_MANAGER_ABI,
          functionName: "mintFlatFee",
        }),
      ]);

      return price * qty + flatFee * qty;
    },
    [publicClient],
  );

  const mintNFT = useCallback(
    async (
      collection: MintableCollection,
      quantity: bigint,
      proof?: readonly `0x${string}`[],
    ) => {
      if (!address) {
        throw new Error("Connect a wallet first");
      }

      const minterAddress = getMinterAddress(collection.minter_type);
      const abi = getMinterAbi(collection.minter_type);
      const totalCost = await getMintCost(minterAddress, collection.address, quantity, abi);

      if (collection.minter_type === "Allowlist") {
        return contractWrite.writeAndWait({
          address: minterAddress,
          abi: ALLOWLIST_MINTER_ABI,
          functionName: "mintNFTAllowlist",
          args: [collection.address, address as `0x${string}`, quantity, proof ?? []],
          value: totalCost,
        });
      }

      return contractWrite.writeAndWait({
        address: minterAddress,
        abi,
        functionName: "mintNFT",
        args: [collection.address, address as `0x${string}`, quantity],
        value: totalCost,
      });
    },
    [address, contractWrite, getMintCost],
  );

  const mintEdition = useCallback(
    async (
      collection: MintableCollection,
      tokenId: bigint,
      quantity: bigint,
      proof?: readonly `0x${string}`[],
    ) => {
      if (!address) {
        throw new Error("Connect a wallet first");
      }

      const minterAddress = getMinterAddress(collection.minter_type);
      const abi = getMinterAbi(collection.minter_type);
      const totalCost = await getMintCost(minterAddress, collection.address, quantity, abi);

      if (collection.minter_type === "Allowlist") {
        return contractWrite.writeAndWait({
          address: minterAddress,
          abi: ALLOWLIST_MINTER_ABI,
          functionName: "mintEditionAllowlist",
          args: [
            collection.address,
            address as `0x${string}`,
            tokenId,
            quantity,
            proof ?? [],
          ],
          value: totalCost,
        });
      }

      return contractWrite.writeAndWait({
        address: minterAddress,
        abi,
        functionName: "mintEdition",
        args: [collection.address, address as `0x${string}`, tokenId, quantity],
        value: totalCost,
      });
    },
    [address, contractWrite, getMintCost],
  );

  return {
    ...contractWrite,
    getMintCost,
    mintNFT,
    mintEdition,
    mint: mintNFT,
  };
}
