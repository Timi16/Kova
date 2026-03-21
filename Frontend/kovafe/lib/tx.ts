import { BaseError } from "viem";
import { injectiveExplorerUrl } from "@/lib/chains";

export function explorerTxUrl(hash: string) {
  return `${injectiveExplorerUrl}/tx/${hash}`;
}

export function getTxErrorMessage(error: unknown) {
  if (error instanceof BaseError) {
    const details = [
      error.shortMessage,
      error.walk((node) => node instanceof BaseError)?.shortMessage,
      error.details,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/^execution reverted:?\s*/i, "")
      .trim();

    if (details) return details;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Transaction failed";
}
