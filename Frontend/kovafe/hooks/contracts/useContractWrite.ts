"use client";

import { useCallback, useState } from "react";
import { useActiveWallet, useWallets } from "@privy-io/react-auth";
import type { WriteContractParameters } from "wagmi/actions";
import { toast } from "sonner";
import { useChainId, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { injectiveTestnet } from "@/lib/chains";
import { explorerTxUrl, getTxErrorMessage } from "@/lib/tx";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function parseHexChainId(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePrivyChainId(value?: string) {
  if (!value) return null;
  if (value.startsWith("eip155:")) {
    const parsed = Number.parseInt(value.slice("eip155:".length), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return parseHexChainId(value);
}

export function useContractWrite() {
  const publicClient = usePublicClient();
  const currentChainId = useChainId();
  const { wallet: activeWallet, setActiveWallet } = useActiveWallet();
  const { wallets } = useWallets();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const ensureActiveInjectiveWallet = useCallback(async () => {
    const walletOnInjective = wallets.find(
      (wallet) => parsePrivyChainId(wallet.chainId) === injectiveTestnet.id,
    );
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
    const preferredWallet = walletOnInjective ?? embeddedWallet ?? activeWallet;

    if (!preferredWallet) {
      return;
    }

    if (activeWallet?.address !== preferredWallet.address) {
      setActiveWallet(preferredWallet);
      await sleep(500);
    }

    if (parsePrivyChainId(preferredWallet.chainId) === injectiveTestnet.id) {
      return;
    }

    await preferredWallet.switchChain(injectiveTestnet.id);
    await sleep(500);
  }, [activeWallet, setActiveWallet, wallets]);

  const ensureInjectiveChain = useCallback(async () => {
    await ensureActiveInjectiveWallet();

    if (currentChainId === injectiveTestnet.id) {
      return;
    }

    await switchChainAsync({ chainId: injectiveTestnet.id });

    if (typeof window === "undefined" || typeof window.ethereum?.request !== "function") {
      await sleep(500);
      return;
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < 10_000) {
      try {
        const chainId = parseHexChainId(
          await window.ethereum.request({ method: "eth_chainId" }),
        );

        if (chainId === injectiveTestnet.id) {
          return;
        }
      } catch {
        // Ignore provider polling errors while waiting for the chain switch to settle.
      }

      await sleep(250);
    }

    throw new Error(
      `Please switch your wallet to ${injectiveTestnet.name} (chain ${injectiveTestnet.id}) and try again.`,
    );
  }, [currentChainId, ensureActiveInjectiveWallet, switchChainAsync]);

  const writeAndWait = useCallback(
    async (
      config: WriteContractParameters,
      pendingMessage = "Transaction submitted...",
    ) => {
      if (!publicClient) {
        throw new Error("Missing public client");
      }

      setIsLoading(true);
      setIsSuccess(false);
      setError(null);

      try {
        await ensureInjectiveChain();

        const hash = await writeContractAsync({
          ...config,
          chainId: injectiveTestnet.id,
        });
        setTxHash(hash);

        const loadingId = toast.loading(pendingMessage, {
          description: hash,
        });

        await publicClient.waitForTransactionReceipt({ hash });
        toast.dismiss(loadingId);
        toast.success("Done! View on Explorer ↗", {
          description: hash,
          action: {
            label: "Explorer ↗",
            onClick: () => window.open(explorerTxUrl(hash), "_blank", "noopener,noreferrer"),
          },
        });

        setIsLoading(false);
        setIsSuccess(true);
        return hash;
      } catch (caught) {
        const message = getTxErrorMessage(caught);
        const nextError = new Error(message);
        setError(nextError);
        setIsLoading(false);
        toast.error(message);
        throw nextError;
      }
    },
    [ensureInjectiveChain, publicClient, writeContractAsync],
  );

  const writeAndWaitForReceipt = useCallback(
    async (
      config: WriteContractParameters,
      pendingMessage = "Transaction submitted...",
    ) => {
      if (!publicClient) {
        throw new Error("Missing public client");
      }

      setIsLoading(true);
      setIsSuccess(false);
      setError(null);

      try {
        await ensureInjectiveChain();

        const hash = await writeContractAsync({
          ...config,
          chainId: injectiveTestnet.id,
        });
        setTxHash(hash);

        const loadingId = toast.loading(pendingMessage, {
          description: hash,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        toast.dismiss(loadingId);
        toast.success("Done! View on Explorer ↗", {
          description: hash,
          action: {
            label: "Explorer ↗",
            onClick: () => window.open(explorerTxUrl(hash), "_blank", "noopener,noreferrer"),
          },
        });

        setIsLoading(false);
        setIsSuccess(true);
        return receipt;
      } catch (caught) {
        const message = getTxErrorMessage(caught);
        const nextError = new Error(message);
        setError(nextError);
        setIsLoading(false);
        toast.error(message);
        throw nextError;
      }
    },
    [ensureInjectiveChain, publicClient, writeContractAsync],
  );

  return {
    writeAndWait,
    writeAndWaitForReceipt,
    isLoading,
    isSuccess,
    error,
    txHash,
  };
}
