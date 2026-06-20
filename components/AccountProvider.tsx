"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { get, post, put, del, type ApiError, type PickHistory, type StorePreferences } from "@/lib/api";
import type { BagLine } from "@/lib/store";

export type StoreAccount = {
  name: string;
  email: string;
  memberSince?: string | null;
  orders: PickHistory[];
};

type MeResponse = {
  signed_in: boolean;
  email?: string;
  name?: string;
  member_since?: string | null;
  orders?: PickHistory[];
  preferences?: StorePreferences;
  bag?: BagLine[];
};

const DEFAULT_PREFERENCES: StorePreferences = { priority: "standard", note: "" };

type AccountContextValue = {
  account: StoreAccount | null;
  preferences: StorePreferences;
  serverBag: BagLine[];
  signedIn: boolean;
  ready: boolean;
  refresh: () => Promise<StoreAccount | null>;
  updateProfileName: (name: string) => Promise<void>;
  updatePreferences: (prefs: StorePreferences) => Promise<void>;
  markNotificationsSeen: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  clearPickHistory: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

const POLL_MS = 12_000;

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<StoreAccount | null>(null);
  const [preferences, setPreferences] = useState<StorePreferences>(DEFAULT_PREFERENCES);
  const [serverBag, setServerBag] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);
  const signedIn = Boolean(account?.email);
  const accountRef = useRef<StoreAccount | null>(null);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const applyMe = useCallback((data: MeResponse) => {
    if (!data.signed_in || !data.email) {
      setAccount(null);
      setPreferences(DEFAULT_PREFERENCES);
      setServerBag([]);
      return;
    }
    setAccount({
      email: data.email,
      name: data.name || data.email,
      memberSince: data.member_since ?? null,
      orders: data.orders || [],
    });
    setPreferences(data.preferences || DEFAULT_PREFERENCES);
    setServerBag(data.bag || []);
  }, []);

  const refresh = useCallback(async (): Promise<StoreAccount | null> => {
    try {
      const data = await get<MeResponse>("/api/me");
      applyMe(data);
      if (!data.signed_in || !data.email) return null;
      return {
        email: data.email,
        name: data.name || data.email,
        memberSince: data.member_since ?? null,
        orders: data.orders || [],
      };
    } catch (err) {
      // Keep the cached session if the API is briefly unreachable; only clear on auth errors.
      const status = (err as ApiError).status;
      if (status === 401 || status === 403) {
        applyMe({ signed_in: false });
        return null;
      }
      return accountRef.current;
    } finally {
      setReady(true);
    }
  }, [applyMe]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await get<MeResponse>("/api/me");
        if (!cancelled) applyMe(data);
      } catch {
        /* leave defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  useEffect(() => {
    const onAuth = () => void refresh();
    window.addEventListener("warehouse-store-auth", onAuth);
    return () => window.removeEventListener("warehouse-store-auth", onAuth);
  }, [refresh]);

  // Single poller for live pick statuses (replaces per-component polling). Keyed
  // on sign-in only — current orders are read via accountRef so refreshing (which
  // creates a new account object) does not restart the interval.
  useEffect(() => {
    if (!ready || !signedIn) return;
    let cancelled = false;

    async function poll() {
      const current = accountRef.current;
      if (!current) return;
      const open = [
        ...new Set(
          current.orders
            .filter((o) => o.order_ref && o.status !== "done")
            .map((o) => o.order_ref),
        ),
      ];
      if (!open.length) return;
      try {
        await get(`/api/orders/status?refs=${encodeURIComponent(open.join(","))}`);
        if (!cancelled) await refresh();
      } catch {
        /* ignore transient errors */
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, signedIn, refresh]);

  const updateProfileName = useCallback(
    async (name: string) => {
      await put("/api/account/profile", { name });
      await refresh();
    },
    [refresh],
  );

  const updatePreferences = useCallback(async (prefs: StorePreferences) => {
    const saved = await put<StorePreferences>("/api/account/preferences", prefs);
    setPreferences(saved || prefs);
  }, []);

  const markNotificationsSeen = useCallback(async () => {
    if (!accountRef.current) return;
    try {
      await post("/api/notifications/seen", {});
    } finally {
      await refresh();
    }
  }, [refresh]);

  const clearNotifications = useCallback(async () => {
    if (!accountRef.current) return;
    try {
      await del("/api/notifications/clear");
    } finally {
      await refresh();
    }
  }, [refresh]);

  const clearPickHistory = useCallback(async () => {
    await del("/api/account/picks");
    await refresh();
  }, [refresh]);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      preferences,
      serverBag,
      signedIn,
      ready,
      refresh,
      updateProfileName,
      updatePreferences,
      markNotificationsSeen,
      clearNotifications,
      clearPickHistory,
    }),
    [account, preferences, serverBag, signedIn, ready, refresh, updateProfileName, updatePreferences, markNotificationsSeen, clearNotifications, clearPickHistory],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
