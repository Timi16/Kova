"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ActivityRow } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

type ActivityResponse = {
  activity: ActivityRow[];
  nextCursor: number | null;
};

export function useGlobalActivity(type?: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["activity", type, limit],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<ActivityResponse>(
        `/api/activity?cursor=${pageParam}&limit=${limit}${type ? `&type=${type}` : ""}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useWalletActivity(address?: string | null) {
  return useQuery({
    queryKey: ["wallet-activity", address],
    enabled: Boolean(address),
    queryFn: () =>
      fetchJson<{ activity: ActivityRow[] }>(`/api/activity/${address}`),
  });
}
