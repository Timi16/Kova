"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchResults } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useSearch(query: string) {
  const debounced = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["search", debounced],
    enabled: debounced.trim().length > 1,
    queryFn: () =>
      fetchJson<SearchResults>(`/api/search?q=${encodeURIComponent(debounced)}`),
  });
}
