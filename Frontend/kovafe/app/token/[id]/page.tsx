import { PostDetail } from "@/features/post/PostDetail";

// Token detail reuses post detail layout with secondary market focus
export default async function TokenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PostDetail id={id} />;
}
