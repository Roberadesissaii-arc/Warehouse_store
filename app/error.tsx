"use client";

import { StoreShell } from "@/components/StoreShell";
import { StoreErrorPage } from "@/components/errors/StoreErrorPage";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StoreShell>
      <StoreErrorPage variant="server" onRetry={reset} />
    </StoreShell>
  );
}
