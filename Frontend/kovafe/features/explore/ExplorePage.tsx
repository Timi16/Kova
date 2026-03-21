import { EmptyState } from "@/components/common/EmptyState";

export function ExplorePage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Explore</h1>
      <div className="mt-4">
        <EmptyState
          title="No explore feed yet"
          description="Add your feed query and discovery cards here."
        />
      </div>
    </section>
  );
}
