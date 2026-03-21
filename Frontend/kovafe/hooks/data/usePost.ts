"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { CommentWithProfile, PostDetails } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

type CommentsResponse = {
  comments: CommentWithProfile[];
  nextCursor: number | null;
};

export function usePost(postId?: number | string, viewer?: string | null) {
  return useQuery({
    queryKey: ["post", postId, viewer],
    enabled: Boolean(postId),
    queryFn: () =>
      fetchJson<PostDetails>(
        `/api/posts/${postId}${viewer ? `?viewer=${viewer}` : ""}`,
      ),
  });
}

export function usePostComments(postId?: number | string, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["post-comments", postId, limit],
    enabled: Boolean(postId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<CommentsResponse>(
        `/api/posts/${postId}/comments?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
