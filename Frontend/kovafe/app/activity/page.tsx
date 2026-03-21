import { useState } from "react";
import { activityEvents } from "@/data/mockData";
import { ActivityItem } from "@/components/ActivityFeed";

const filters = ["All", "Mints", "Sales", "Listings", "Offers"] as const;

export default function ActivityPage() {
  const [active, setActive] = useState<string>("All");

  const filtered = active === "All"
    ? activityEvents
    : activityEvents.filter((e) => {
        if (active === "Mints") return e.type === "mint";
        if (active === "Sales") return e.type === "sale";
        if (active === "Listings") return e.type === "list";
        if (active === "Offers") return e.type === "offer";
        return true;
      });

  return (
    <div className="max-w-[800px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Global Activity</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default ${
              active === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground border border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card-surface p-2">
        {filtered.map((e) => (
          <ActivityItem key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
