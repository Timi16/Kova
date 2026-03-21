"use client";

import { useCallback } from "react";
import { encodeAbiParameters, parseAbiParameters, parseEventLogs } from "viem";
import FACTORY_ABI from "@/lib/abis/factory.abi";
import { CONTRACTS } from "@/lib/contracts";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";

export enum MinterType {
  FixedPrice = 0,
  Free = 1,
  Timed = 2,
  Allowlist = 3,
}

export enum TokenType {
  ERC721 = 0,
  ERC1155 = 1,
}

type FixedPriceConfig = {
  price: bigint;
  maxPerWallet: bigint;
};

type FreeConfig = {
  walletLimit: bigint;
};

type TimedConfig = {
  price: bigint;
  startTime: bigint;
  endTime: bigint;
  maxPerWallet: bigint;
};

type AllowlistConfig = {
  price: bigint;
  merkleRoot: `0x${string}`;
  maxPerWallet: bigint;
};

type NFTConfig = {
  name: string;
  symbol: string;
  baseURI: string;
  hiddenURI: string;
  maxSupply: bigint;
  mintPrice: bigint;
  mintStart: bigint;
  mintEnd: bigint;
  walletLimit: bigint;
  royaltyBps: number;
  royaltyReceiver: `0x${string}`;
  isRevealed: boolean;
};

type EditionConfig = {
  name: string;
  uri: string;
  tokenId: bigint;
  maxSupply: bigint;
  mintPrice: bigint;
  mintStart: bigint;
  mintEnd: bigint;
  walletLimit: bigint;
  royaltyBps: number;
  royaltyReceiver: `0x${string}`;
};

export function useFactory() {
  const contractWrite = useContractWrite();

  const encodeMinterData = useCallback(
    (
      minterType: MinterType,
      config: FixedPriceConfig | FreeConfig | TimedConfig | AllowlistConfig,
    ) => {
      switch (minterType) {
        case MinterType.FixedPrice:
          return encodeAbiParameters(
            parseAbiParameters("uint256 price, uint256 maxPerWallet"),
            [
              (config as FixedPriceConfig).price,
              (config as FixedPriceConfig).maxPerWallet,
            ],
          );
        case MinterType.Free:
          return encodeAbiParameters(parseAbiParameters("uint256 walletLimit"), [
            (config as FreeConfig).walletLimit,
          ]);
        case MinterType.Timed:
          return encodeAbiParameters(
            parseAbiParameters(
              "uint256 price, uint256 startTime, uint256 endTime, uint256 maxPerWallet",
            ),
            [
              (config as TimedConfig).price,
              (config as TimedConfig).startTime,
              (config as TimedConfig).endTime,
              (config as TimedConfig).maxPerWallet,
            ],
          );
        case MinterType.Allowlist:
          return encodeAbiParameters(
            parseAbiParameters(
              "uint256 price, bytes32 merkleRoot, uint256 maxPerWallet",
            ),
            [
              (config as AllowlistConfig).price,
              (config as AllowlistConfig).merkleRoot,
              (config as AllowlistConfig).maxPerWallet,
            ],
          );
      }
    },
    [],
  );

  const deployNFTDrop = useCallback(
    async (
      nftConfig: NFTConfig,
      minterType: MinterType,
      minterData: `0x${string}`,
    ) => {
      const receipt = await contractWrite.writeAndWaitForReceipt({
        address: CONTRACTS.FACTORY,
        abi: FACTORY_ABI,
        functionName: "deployNFTDrop",
        args: [nftConfig, minterType, minterData],
      });
      return parseDeploymentAddress(receipt, "NFTDropDeployed");
    },
    [contractWrite, parseDeploymentAddress],
  );

  const deployEdition = useCallback(
    async (
      name: string,
      editionConfig: EditionConfig,
      minterType: MinterType,
      minterData: `0x${string}`,
    ) => {
      const receipt = await contractWrite.writeAndWaitForReceipt({
        address: CONTRACTS.FACTORY,
        abi: FACTORY_ABI,
        functionName: "deployEdition",
        args: [name, editionConfig, minterType, minterData],
      });
      return parseDeploymentAddress(receipt, "EditionDeployed");
    },
    [contractWrite, parseDeploymentAddress],
  );

  const parseDeploymentAddress = useCallback(
    (receipt: { logs: readonly unknown[] }, eventName: "NFTDropDeployed" | "EditionDeployed") => {
      const [log] = parseEventLogs({
        abi: FACTORY_ABI,
        eventName,
        logs: receipt.logs as Parameters<typeof parseEventLogs>[0]["logs"],
      });

      if (!log?.args?.collection) {
        throw new Error("Collection deployment event not found");
      }

      return log.args.collection as `0x${string}`;
    },
    [],
  );

  return {
    ...contractWrite,
    encodeMinterData,
    deployNFTDrop,
    deployEdition,
    parseDeploymentAddress,
  };
}
