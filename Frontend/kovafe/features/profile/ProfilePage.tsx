import { AddressChip } from "@/features/user/AddressChip";
import { FollowButton } from "@/features/user/FollowButton";

export function ProfilePage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AddressChip address="0x7a3b8c9d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b" />
        <FollowButton initialFollowing={false} />
      </div>
    </section>
  );
}
