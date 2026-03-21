'use client';

import { useState } from "react";
import { Zap, TrendingUp, User, ArrowUpRight, MessageCircle, Heart, Check } from "lucide-react";
import { notifications } from "@/data/mockData";
import { truncateAddress, formatTimeAgo } from "@/data/mockData";

const iconMap = {
  mint: Zap,
  trending: TrendingUp,
  follow: User,
  offer_accepted: ArrowUpRight,
  comment: MessageCircle,
  like: Heart,
};

const tabs = ["All", "Mints", "Offers", "Follows", "Sales"] as const;

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [readAll, setReadAll] = useState(false);

  const filtered = activeTab === "All"
    ? notifications
    : notifications.filter((n) => {
        if (activeTab === "Mints") return n.type === "mint";
        if (activeTab === "Follows") return n.type === "follow";
        if (activeTab === "Offers") return n.type === "offer_accepted";
        if (activeTab === "Sales") return n.type === "mint"; // mock
        return true;
      });

  return (
    <div className="max-w-[700px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
        <button onClick={() => setReadAll(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default ${
              activeTab === t ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground border border-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map((n) => {
          const Icon = iconMap[n.type];
          const unread = !n.read && !readAll;
          return (
            <div
              key={n.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-default ${
                unread ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-surface"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <img src={n.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-mono text-xs text-muted-foreground">{truncateAddress(n.actor.address)}</span>
                  {" "}{n.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(n.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
