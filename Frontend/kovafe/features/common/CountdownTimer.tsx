'use client';

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Ended");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(h === 0);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${urgent ? "text-destructive" : "text-muted-foreground"}`}>
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  );
}
