"use client";

import { useCallback } from "react";
import MARKETPLACE_ABI from "@/lib/abis/marketplace.abi";
import { CONTRACTS } from "@/lib/contracts";
import { useApproval } from "@/hooks/contracts/useApproval";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";
import { TokenType } from "@/hooks/contracts/useFactory";
import { useAuth } from "@/hooks/useAuth";

export function useMarketplace() {
  const { address } = useAuth();
  const approval = useApproval();
  const contractWrite = useContractWrite();

  const listToken = useCallback(
    async (
      contract: `0x${string}`,
      tokenId: bigint,
      price: bigint,
      tokenType: TokenType,
      quantity: bigint,
    ) => {
      if (!address) throw new Error("Connect a wallet first");

      if (tokenType === TokenType.ERC721) {
        const approved = await approval.isApprovedERC721(
          contract,
          tokenId,
          CONTRACTS.MARKETPLACE,
        );

        if (!approved) {
          await approval.approveERC721(contract, CONTRACTS.MARKETPLACE, tokenId);
        }
      } else {
        const approved = await approval.isApprovedERC1155(
          contract,
          address as `0x${string}`,
          CONTRACTS.MARKETPLACE,
        );

        if (!approved) {
          await approval.approveAllERC1155(contract, CONTRACTS.MARKETPLACE);
        }
      }

      return contractWrite.writeAndWait({
        address: CONTRACTS.MARKETPLACE,
        abi: MARKETPLACE_ABI,
        functionName: "list",
        args: [contract, tokenId, price, tokenType, quantity],
      });
    },
    [address, approval, contractWrite],
  );

  const buyToken = useCallback(
    async (listingId: bigint, price: bigint) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.MARKETPLACE,
        abi: MARKETPLACE_ABI,
        functionName: "buy",
        args: [listingId],
        value: price,
      }),
    [contractWrite],
  );

  const cancelListing = useCallback(
    async (listingId: bigint) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.MARKETPLACE,
        abi: MARKETPLACE_ABI,
        functionName: "cancelListing",
        args: [listingId],
      }),
    [contractWrite],
  );

  return {
    ...contractWrite,
    listToken,
    buyToken,
    cancelListing,
  };
}
