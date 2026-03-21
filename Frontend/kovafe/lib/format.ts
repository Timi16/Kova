import { formatEther } from "viem";

export function truncateAddress(address?: string | null) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatINJ(amount?: string | bigint | number | null) {
  if (amount === null || amount === undefined) return "0.0000 INJ";
  if (typeof amount === "number") {
    return `${amount.toFixed(4)} INJ`;
  }

  const value = typeof amount === "bigint" ? amount : BigInt(amount);
  return `${Number(formatEther(value)).toFixed(4)} INJ`;
}

export function normalizeAddress(address?: string | null) {
  return address?.toLowerCase() ?? "";
}

export function pinataGatewayUrl(uri?: string | null) {
  if (!uri) return "";
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY ??
    "https://jade-obvious-goose-24.mypinata.cloud";

  if (uri.startsWith("http")) return uri;
  if (uri.startsWith("ipfs://")) {
    return `${gateway}/ipfs/${uri.replace("ipfs://", "")}`;
  }

  return `${gateway}/ipfs/${uri}`;
}
