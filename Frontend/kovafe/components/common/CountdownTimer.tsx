"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownTimerProps = {
  targetAt: string;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Ended";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function CountdownTimer({ targetAt }: CountdownTimerProps) {
  const targetMs = useMemo(() => new Date(targetAt).getTime(), [targetAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {formatRemaining(targetMs - now)}
    </span>
  );
}
