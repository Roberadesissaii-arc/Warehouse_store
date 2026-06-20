"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BagLine } from "@/lib/store";
import { bagCount, saveServerBag } from "@/lib/store";
import { useAccount } from "@/components/AccountProvider";

type BagContextValue = {
  lines: BagLine[];
  count: number;
  drawerOpen: boolean;
  draftPriority: "standard" | "rush";
  draftNote: string;
  setDraftPriority: (value: "standard" | "rush") => void;
  setDraftNote: (value: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: BagLine) => void;
  setQty: (itemId: number, quantity: number) => void;
  remove: (itemId: number) => void;
  clear: () => void;
};

const BagContext = createContext<BagContextValue | null>(null);

function mergeBags(server: BagLine[], guest: BagLine[]): BagLine[] {
  const map = new Map<number, BagLine>();
  for (const line of server) map.set(line.item_id, { ...line });
  for (const g of guest) {
    const existing = map.get(g.item_id);
    if (existing) {
      map.set(g.item_id, { ...existing, ...g, quantity: existing.quantity + g.quantity });
    } else {
      map.set(g.item_id, { ...g });
    }
  }
  return [...map.values()];
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const { ready, signedIn, serverBag, preferences } = useAccount();
  const [lines, setLines] = useState<BagLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftPriority, setDraftPriority] = useState<"standard" | "rush">("standard");
  const [draftNote, setDraftNote] = useState("");
  const [draftSeeded, setDraftSeeded] = useState(false);
  // Tracks which session the local bag was seeded for ("in" / "out") so we seed
  // exactly once per sign-in and merge guest items into the server bag.
  const [seededFor, setSeededFor] = useState<"in" | "out" | null>(null);

  useEffect(() => {
    if (!ready) return;
    const session = signedIn ? "in" : "out";
    if (session === seededFor) return;
    void (async () => {
      setSeededFor(session);
      if (!signedIn) {
        setLines((prev) => (prev.length ? [] : prev));
        return;
      }
      let guest: BagLine[] = [];
      setLines((prev) => {
        guest = prev;
        return prev;
      });
      const merged = guest.length ? mergeBags(serverBag, guest) : serverBag;
      setLines(merged);
      if (guest.length) await saveServerBag(merged);
    })();
  }, [ready, signedIn, serverBag, seededFor]);

  // Seed the draft speed/note from saved preferences once they load (render-time
  // sync avoids the cascading-render lint of setting state inside an effect).
  if (ready && !draftSeeded) {
    setDraftSeeded(true);
    setDraftPriority(preferences.priority);
    setDraftNote(preferences.note);
  }

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const persist = useCallback(
    (next: BagLine[]) => {
      setLines(next);
      if (signedIn) void saveServerBag(next);
    },
    [signedIn],
  );

  const add = useCallback(
    (line: BagLine) => {
      const next = [...lines];
      const idx = next.findIndex((l) => l.item_id === line.item_id);
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...line, quantity: next[idx].quantity + line.quantity };
      } else {
        next.push(line);
      }
      persist(next);
    },
    [lines, persist],
  );

  const setQty = useCallback(
    (itemId: number, quantity: number) => {
      if (quantity <= 0) {
        persist(lines.filter((l) => l.item_id !== itemId));
        return;
      }
      persist(lines.map((l) => (l.item_id === itemId ? { ...l, quantity } : l)));
    },
    [lines, persist],
  );

  const remove = useCallback(
    (itemId: number) => {
      persist(lines.filter((l) => l.item_id !== itemId));
    },
    [lines, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      lines,
      count: bagCount(lines),
      drawerOpen,
      draftPriority,
      draftNote,
      setDraftPriority,
      setDraftNote,
      openDrawer,
      closeDrawer,
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, drawerOpen, draftPriority, draftNote, openDrawer, closeDrawer, add, setQty, remove, clear],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used within BagProvider");
  return ctx;
}
