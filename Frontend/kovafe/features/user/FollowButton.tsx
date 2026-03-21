'use client';

import { useStore } from "@/store/useStore";

export function FollowButton({ creatorId, small }: { creatorId: string; small?: boolean }) {
  const { followedCreators, toggleFollow, isSignedIn, signIn } = useStore();
  const following = followedCreators.has(creatorId);

  const handleClick = () => {
    if (!isSignedIn) { signIn(); return; }
    toggleFollow(creatorId);
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
