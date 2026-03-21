"use client";

import { usePublicClient } from "wagmi";
import NFT_ABI from "@/lib/abis/nft.abi";
import EDITION_ABI from "@/lib/abis/edition.abi";
import { useAuth } from "@/hooks/useAuth";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";

export function useApproval() {
  const publicClient = usePublicClient();
  const { address } = useAuth();
  const contractWrite = useContractWrite();

  async function isApprovedERC721(
    contract: `0x${string}`,
    tokenId: bigint,
    spender: `0x${string}`,
  ) {
    if (!publicClient || !address) return false;

    const [approved, approvedForAll] = await Promise.all([
      publicClient.readContract({
        address: contract,
        abi: NFT_ABI,
        functionName: "getApproved",
        args: [tokenId],
      }),
      publicClient.readContract({
        address: contract,
        abi: NFT_ABI,
        functionName: "isApprovedForAll",
        args: [address as `0x${string}`, spender],
      }),
    ]);

    return approved.toLowerCase() === spender.toLowerCase() || approvedForAll;
  }

  async function isApprovedERC1155(
    contract: `0x${string}`,
    owner: `0x${string}`,
    spender: `0x${string}`,
  ) {
    if (!publicClient) return false;
    return publicClient.readContract({
      address: contract,
      abi: EDITION_ABI,
      functionName: "isApprovedForAll",
      args: [owner, spender],
    });
  }

  async function approveERC721(
    contract: `0x${string}`,
    spender: `0x${string}`,
    tokenId: bigint,
  ) {
    return contractWrite.writeAndWait({
      address: contract,
      abi: NFT_ABI,
      functionName: "approve",
      args: [spender, tokenId],
    });
  }

  async function approveAllERC721(
    contract: `0x${string}`,
    spender: `0x${string}`,
  ) {
    return contractWrite.writeAndWait({
      address: contract,
      abi: NFT_ABI,
      functionName: "setApprovalForAll",
      args: [spender, true],
    });
  }

  async function approveAllERC1155(
    contract: `0x${string}`,
    spender: `0x${string}`,
  ) {
    return contractWrite.writeAndWait({
      address: contract,
      abi: EDITION_ABI,
      functionName: "setApprovalForAll",
      args: [spender, true],
    });
  }

  return {
    ...contractWrite,
    isApprovedERC721,
    isApprovedERC1155,
    approveERC721,
    approveAllERC721,
    approveAllERC1155,
  };
}
