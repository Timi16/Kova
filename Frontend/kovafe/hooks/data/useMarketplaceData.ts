"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MarketplaceListing, TokenMarket } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

type ListingsResponse = {
  listings: MarketplaceListing[];
  nextCursor: number | null;
};

export type ListingFilters = {
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export function useListings(filters: ListingFilters = {}, limit = 20) {
  const search = new URLSearchParams();
  if (filters.type) search.set("type", filters.type);
  if (filters.minPrice) search.set("minPrice", filters.minPrice);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.sort) search.set("sort", filters.sort);

  return useInfiniteQuery({
    queryKey: ["listings", filters, limit],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<ListingsResponse>(
        `/api/marketplace?${search.toString()}&cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useTokenMarket(contract?: string | null, tokenId?: number | string) {
  return useQuery({
    queryKey: ["token-market", contract, tokenId],
    enabled: Boolean(contract && tokenId !== undefined),
    queryFn: () =>
      fetchJson<TokenMarket>(`/api/marketplace/${contract}/${tokenId}`),
  });
}
