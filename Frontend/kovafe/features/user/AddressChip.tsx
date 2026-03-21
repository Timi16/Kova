import { truncateAddress } from "@/data/mockData";

type AddressChipProps = {
  address: string;
};

export function AddressChip({ address }: AddressChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-mono">
      {truncateAddress(address)}
    </span>
  );
}
