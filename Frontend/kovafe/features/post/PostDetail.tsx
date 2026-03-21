type PostDetailProps = {
  id: string;
};

export function PostDetail({ id }: PostDetailProps) {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Post Detail</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Open `/post/{id}` to view the live post detail page.
      </p>
    </section>
  );
}
