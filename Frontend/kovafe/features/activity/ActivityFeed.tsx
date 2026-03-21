import { Zap, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ActivityEvent } from "@/data/mockData";
import { truncateAddress, formatINJ, formatTimeAgo } from "@/data/mockData";

const eventConfig = {
  mint: { label: "MINT", color: "bg-primary/20 text-primary", icon: Zap },
  sale: { label: "SALE", color: "bg-success/20 text-success", icon: ArrowUpRight },
  list: { label: "LIST", color: "bg-blue-500/20 text-blue-400", icon: TrendingUp },
  offer: { label: "OFFER", color: "bg-warning/20 text-warning", icon: TrendingUp },
};

export function ActivityItem({ event }: { event: ActivityEvent }) {
  const config = eventConfig[event.type];
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-surface rounded-lg transition-default animate-slide-in-top">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.color}`}>
        {config.label}
      </span>
      <Link href={`/post/${event.post.id}`}>
        <img src={event.post.media} alt="" className="w-8 h-8 rounded object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          <span className="font-mono text-xs">{truncateAddress(event.actor.address)}</span>
          {" "}
          {event.type === "mint" && "minted"}
          {event.type === "sale" && "bought"}
          {event.type === "list" && "listed"}
          {event.type === "offer" && "offered on"}
          {" "}
          <span className="font-medium">{event.post.title}</span>
        </p>
      </div>
      <span className="font-mono text-xs text-foreground whitespace-nowrap">{formatINJ(event.price)}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTimeAgo(event.timestamp)}
      </span>
    </div>
  );
}

export function ActivityFeed({ events, limit }: { events: ActivityEvent[]; limit?: number }) {
  const items = limit ? events.slice(0, limit) : events;
  return (
    <div className="space-y-0.5">
      {items.map((e) => (
        <ActivityItem key={e.id} event={e} />
      ))}
    </div>
  );
}
