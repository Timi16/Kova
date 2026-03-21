'use client';

import { useAuth } from "@/hooks/useAuth";
import { useIsFollowing } from "@/hooks/data/useProfile";
import { useSocial } from "@/hooks/contracts/useSocial";

export function FollowButton({
  targetAddress,
  creatorId,
  small,
}: {
  targetAddress?: string;
  creatorId?: string;
  small?: boolean;
}) {
  const { login, isAuthenticated, address } = useAuth();
  const social = useSocial();
  const followingQuery = useIsFollowing(address, targetAddress);
  const following = Boolean(followingQuery.data?.isFollowing);

  const handleClick = async () => {
    if (!targetAddress || creatorId) return;
    if (!isAuthenticated) {
      login();
      return;
    }

    if (following) {
      await social.unfollow(targetAddress as `0x${string}`);
    } else {
      await social.follow(targetAddress as `0x${string}`);
    }

    await followingQuery.refetch();
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full font-semibold transition-default ${
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        following
          ? "bg-surface border border-border text-foreground hover:border-destructive hover:text-destructive"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
