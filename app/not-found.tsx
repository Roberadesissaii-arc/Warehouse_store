import { StoreShell } from "@/components/StoreShell";
import { StoreErrorPage } from "@/components/errors/StoreErrorPage";

export default function NotFound() {
  return (
    <StoreShell>
      <StoreErrorPage variant="notFound" />
    </StoreShell>
  );
}
