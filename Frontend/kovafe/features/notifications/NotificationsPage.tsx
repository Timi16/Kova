import { EmptyState } from "@/components/common/EmptyState";

export function NotificationsPage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-4">
        <EmptyState
          title="No notifications"
          description="Updates from people and collections you follow appear here."
        />
      </div>
    </section>
  );
}
