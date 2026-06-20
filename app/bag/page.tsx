import { StoreShell } from "@/components/StoreShell";
import { BagClient } from "@/components/bag/BagClient";

export default function BagPage() {
  return (
    <StoreShell>
      <BagClient />
    </StoreShell>
  );
}
