import { PriceTag } from "@/components/common/PriceTag";

type TokenDetailProps = {
  id: string;
};

export function TokenDetail({ id }: TokenDetailProps) {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Token {id}</h1>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Floor price</span>
        <PriceTag value={3.2} />
      </div>
    </section>
  );
}
