"use client";

import { useState } from "react";

type FollowButtonProps = {
  initialFollowing?: boolean;
};

export function FollowButton({ initialFollowing = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);

  return (
    <button
      type="button"
      onClick={() => setFollowing((current) => !current)}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium"
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
