"use client";

import { useCallback } from "react";
import OFFERS_ABI from "@/lib/abis/offers.abi";
import { CONTRACTS } from "@/lib/contracts";
import { TokenType } from "@/hooks/contracts/useFactory";
import { useApproval } from "@/hooks/contracts/useApproval";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";
import { useAuth } from "@/hooks/useAuth";

export function useOffers() {
  const { address } = useAuth();
  const approval = useApproval();
  const contractWrite = useContractWrite();

  const makeOffer = useCallback(
    async (
      contract: `0x${string}`,
      tokenId: bigint,
      amount: bigint,
      tokenType: TokenType,
      quantity: bigint,
      expiresAt: bigint,
    ) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.OFFERS,
        abi: OFFERS_ABI,
        functionName: "makeOffer",
        args: [contract, tokenId, tokenType, quantity, expiresAt],
        value: amount,
      }),
    [contractWrite],
  );

  const acceptOffer = useCallback(
    async (
      offerId: bigint,
      contract: `0x${string}`,
      tokenId: bigint,
      tokenType: TokenType,
    ) => {
      if (!address) throw new Error("Connect a wallet first");

      if (tokenType === TokenType.ERC721) {
        const approved = await approval.isApprovedERC721(
          contract,
          tokenId,
          CONTRACTS.OFFERS,
        );

        if (!approved) {
          await approval.approveERC721(contract, CONTRACTS.OFFERS, tokenId);
        }
      } else {
        const approved = await approval.isApprovedERC1155(
          contract,
          address as `0x${string}`,
          CONTRACTS.OFFERS,
        );

        if (!approved) {
          await approval.approveAllERC1155(contract, CONTRACTS.OFFERS);
        }
      }

      return contractWrite.writeAndWait({
        address: CONTRACTS.OFFERS,
        abi: OFFERS_ABI,
        functionName: "acceptOffer",
        args: [offerId],
      });
    },
    [address, approval, contractWrite],
  );

  const cancelOffer = useCallback(
    async (offerId: bigint) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.OFFERS,
        abi: OFFERS_ABI,
        functionName: "cancelOffer",
        args: [offerId],
      }),
    [contractWrite],
  );

  return {
    ...contractWrite,
    makeOffer,
    acceptOffer,
    cancelOffer,
  };
}
