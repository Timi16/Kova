import { formatINJ } from "@/data/mockData";

export function PriceTag({ amount, showUsd }: { amount: number; showUsd?: boolean }) {
  const isFree = amount === 0;
  return (
    <div>
      <span className={`font-mono text-sm font-semibold ${isFree ? "text-success" : "text-foreground"}`}>
        {isFree ? "FREE" : formatINJ(amount)}
      </span>
      {showUsd && !isFree && (
        <p className="text-xs font-mono text-muted-foreground">
          ~${(amount * 22.5).toFixed(2)}
        </p>
      )}
    </div>
  );
}
