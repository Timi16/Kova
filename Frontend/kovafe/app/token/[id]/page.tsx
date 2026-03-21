import { TokenDetail } from "@/features/token/TokenDetail";

type TokenRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function TokenRoute({ params }: TokenRouteProps) {
  const { id } = await params;

  return <TokenDetail id={id} />;
}
