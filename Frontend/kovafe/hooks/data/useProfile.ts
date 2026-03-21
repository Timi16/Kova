"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FeedPost, MintRow, ProfileDetails } from "@/lib/api-types";
import { fetchJson } from "@/lib/fetcher";

type ProfilePostsResponse = {
  posts: FeedPost[];
  nextCursor: number | null;
};

type ProfileCollectedResponse = {
  mints: MintRow[];
  nextCursor: number | null;
};

type FollowersResponse = {
  followers: Array<{
    follower: string;
    following: string;
    created_at: string;
    profile: ProfileDetails | null;
  }>;
  nextCursor: number | null;
};

export function useProfile(address?: string | null) {
  return useQuery({
    queryKey: ["profile", address],
    enabled: Boolean(address),
    queryFn: () => fetchJson<ProfileDetails>(`/api/profiles/${address}`),
  });
}

export function useProfilePosts(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["profile-posts", address, limit],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<ProfilePostsResponse>(
        `/api/profiles/${address}/posts?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useProfileCollected(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["profile-collected", address, limit],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<ProfileCollectedResponse>(
        `/api/profiles/${address}/collected?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useIsFollowing(
  myAddress?: string | null,
  theirAddress?: string | null,
) {
  return useQuery({
    queryKey: ["is-following", myAddress, theirAddress],
    enabled: Boolean(myAddress && theirAddress),
    queryFn: () =>
      fetchJson<{ isFollowing: boolean }>(
        `/api/profiles/${theirAddress}/followers?check=${myAddress}`,
      ),
  });
}

export function useFollowerCount(address?: string | null) {
  const profile = useProfile(address);
  return {
    ...profile,
    data: profile.data?.follower_count ?? 0,
  };
}

export function useFollowers(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["followers", address, limit],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<FollowersResponse>(
        `/api/profiles/${address}/followers?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useFollowing(address?: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["following", address, limit],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJson<{
        following: FollowersResponse["followers"];
        nextCursor: number | null;
      }>(
        `/api/profiles/${address}/following?cursor=${pageParam}&limit=${limit}`,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
