export type MockPost = {
  id: string;
  title: string;
  body: string;
  author: string;
};

export const mockPosts: MockPost[] = [
  {
    id: "1",
    title: "Genesis drop is live",
    body: "Mint is open for early supporters.",
    author: "@kova",
  },
  {
    id: "2",
    title: "Marketplace update",
    body: "Batch listing support is now available.",
    author: "@team",
  },
];

export function truncateAddress(address: string, visible = 4): string {
  if (!address) return "";
  if (address.length <= visible * 2 + 2) return address;

  const prefix = address.slice(0, visible + 2);
  const suffix = address.slice(-visible);

  return `${prefix}...${suffix}`;
}

export function formatINJ(value: number): string {
  if (!Number.isFinite(value)) return "0.000 INJ";
  return `${value.toFixed(3)} INJ`;
}
