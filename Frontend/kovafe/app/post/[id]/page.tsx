import { PostDetail } from "@/features/post/PostDetail";

type PostRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PostRoute({ params }: PostRouteProps) {
  const { id } = await params;

  return <PostDetail id={id} />;
}
