"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export function useINJPrice() {
  return useQuery({
    queryKey: ["inj-price"],
    staleTime: 60_000,
    queryFn: () => fetchJson<{ usd: number }>("/api/inj/price"),
  });
}
