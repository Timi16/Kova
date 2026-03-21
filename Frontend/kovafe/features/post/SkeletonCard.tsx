export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-border p-4">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mt-3 h-5 w-40 rounded bg-muted" />
      <div className="mt-2 h-3 w-full rounded bg-muted" />
      <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
    </div>
  );
}
