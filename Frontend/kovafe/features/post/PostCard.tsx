import Link from "next/link";

type PostCardProps = {
  id: string;
  title: string;
  body: string;
  author?: string;
};

export function PostCard({ id, title, body, author = "@creator" }: PostCardProps) {
  return (
    <article className="rounded-lg border border-border p-4">
      <div className="mb-2 text-xs text-muted-foreground">{author}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Link href={`/post/${id}`} className="mt-3 inline-block text-sm font-medium underline">
        View post
      </Link>
    </article>
  );
}
