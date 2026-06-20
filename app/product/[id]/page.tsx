import { StoreShell } from "@/components/StoreShell";
import { ProductClient } from "@/components/product/ProductClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <StoreShell>
      <ProductClient productId={Number(id)} />
    </StoreShell>
  );
}
