import { StoreShell } from "@/components/StoreShell";
import { AccountClient } from "@/components/account/AccountClient";

export default function AccountPage() {
  return (
    <StoreShell>
      <AccountClient />
    </StoreShell>
  );
}
