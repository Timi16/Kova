type PriceTagProps = {
  value: number;
  symbol?: string;
};

export function PriceTag({ value, symbol = "INJ" }: PriceTagProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      {new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
      }).format(value)}{" "}
      {symbol}
    </span>
  );
}
