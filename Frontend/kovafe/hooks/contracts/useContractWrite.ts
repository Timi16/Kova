"use client";

import { useCallback, useState } from "react";
import type { WriteContractParameters } from "wagmi/actions";
import { toast } from "sonner";
import { useChainId, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { injectiveTestnet } from "@/lib/chains";
import { explorerTxUrl, getTxErrorMessage } from "@/lib/tx";

export function useContractWrite() {
  const publicClient = usePublicClient();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

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
        if (currentChainId !== injectiveTestnet.id) {
          await switchChainAsync({ chainId: injectiveTestnet.id });
        }

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
    [currentChainId, publicClient, switchChainAsync, writeContractAsync],
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
        if (currentChainId !== injectiveTestnet.id) {
          await switchChainAsync({ chainId: injectiveTestnet.id });
        }

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
    [currentChainId, publicClient, switchChainAsync, writeContractAsync],
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
