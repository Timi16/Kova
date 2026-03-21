import { EmptyState } from "@/components/common/EmptyState";

export function ActivityFeed() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Activity</h1>
      <div className="mt-4">
        <EmptyState
          title="No activity yet"
          description="Recent follows, mints, and sales will appear here."
        />
      </div>
    </section>
  );
}
