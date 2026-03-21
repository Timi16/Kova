import { mockPosts } from "@/data/mockData";
import { PostCard } from "@/features/post/PostCard";

type PostDetailProps = {
  id: string;
};

export function PostDetail({ id }: PostDetailProps) {
  const post = mockPosts.find((item) => item.id === id);

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Post</h1>
        <p className="mt-3 text-sm text-muted-foreground">Post `{id}` was not found.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Post Detail</h1>
      <div className="mt-4">
        <PostCard id={post.id} title={post.title} body={post.body} author={post.author} />
      </div>
    </section>
  );
}
