import { CountdownTimer } from "@/components/common/CountdownTimer";
import { PriceTag } from "@/components/common/PriceTag";

const DROP_ENDS_AT = "2026-12-31T00:00:00.000Z";

export function DropsPage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Drops</h1>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">Genesis Collection</p>
          <CountdownTimer targetAt={DROP_ENDS_AT} />
        </div>
        <PriceTag value={12.5} />
      </div>
    </section>
  );
}
