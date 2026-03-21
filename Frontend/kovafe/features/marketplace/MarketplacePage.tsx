import { EmptyState } from "@/components/common/EmptyState";

export function MarketplacePage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <div className="mt-4">
        <EmptyState
          title="No listings yet"
          description="Your marketplace listings can be rendered here."
        />
      </div>
    </section>
  );
}
