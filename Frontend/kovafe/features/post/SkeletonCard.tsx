export function SkeletonCard() {
  return (
    <div className="card-surface p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-elevated" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-surface-elevated" />
          <div className="h-2.5 w-32 rounded bg-surface-elevated" />
        </div>
      </div>
      <div className="aspect-square rounded-lg bg-surface-elevated" />
      <div className="h-4 w-3/4 rounded bg-surface-elevated" />
      <div className="h-3 w-1/2 rounded bg-surface-elevated" />
      <div className="flex justify-between">
        <div className="h-8 w-20 rounded bg-surface-elevated" />
        <div className="h-8 w-24 rounded-full bg-surface-elevated" />
      </div>
    </div>
  );
}
