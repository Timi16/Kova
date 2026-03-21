import { BaseError } from "viem";
import { injectiveExplorerUrl } from "@/lib/chains";

export function explorerTxUrl(hash: string) {
  return `${injectiveExplorerUrl}/tx/${hash}`;
}

export function getTxErrorMessage(error: unknown) {
  if (error instanceof BaseError) {
    const walked = error.walk((node) => node instanceof BaseError) as
      | BaseError
      | undefined;
    const details = [
      error.shortMessage,
      walked?.shortMessage,
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
