"use client";

import { useEffect, useLayoutEffect, useState } from "react";

// Runs the layout effect before the browser paints on the client (so the
// mobile/desktop layout is resolved without a visible "Loading…" flash), while
// falling back to a normal effect during SSR where layout effects are a no-op.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useIsMobile(breakpoint = 767) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpoint]);

  return isMobile;
}
