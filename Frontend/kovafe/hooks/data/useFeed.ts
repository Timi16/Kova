"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedPost } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

type FeedResponse = {
  posts: FeedPost[];
  nextCursor: number | null;
};

export function useForYouFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["feed", "for-you", limit],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam }) =>
      fetchJson<FeedResponse>(`/api/feed?cursor=${pageParam}&limit=${limit}`),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useFollowingFeed(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["feed", "following", address, limit],
    initialPageParam: 0,
    staleTime: 30_000,
    enabled: Boolean(address),
    queryFn: ({ pageParam }) =>
      fetchJson<FeedResponse>(
        `/api/feed/following?address=${address}&cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
