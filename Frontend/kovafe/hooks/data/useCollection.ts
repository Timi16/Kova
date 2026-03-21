"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { CollectionDetails, MintRow } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

export function useCollection(address?: string | null) {
  return useQuery({
    queryKey: ["collection", address],
    enabled: Boolean(address),
    queryFn: () => fetchJson<CollectionDetails>(`/api/collections/${address}`),
  });
}

export function useCollectionTokens(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["collection-tokens", address, limit],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<{ mints: MintRow[]; nextCursor: number | null }>(
        `/api/collections/${address}/tokens?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
