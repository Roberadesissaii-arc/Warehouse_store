"use client";

import { useAccount } from "@/components/AccountProvider";

/**
 * Thin wrapper over the shared AccountProvider. The `pollOrders` option is kept
 * for call-site compatibility but is now a no-op — the provider runs a single
 * poller for the whole app.
 */
export function useStoreAccount(options?: { pollOrders?: boolean }) {
  void options; // accepted for call-site compatibility; the provider owns polling
  const { account, signedIn, ready, refresh } = useAccount();
  return { account, signedIn, ready, refreshAccount: refresh };
}
