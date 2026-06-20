"use client";

import { useEffect } from "react";

/** Adds standalone / mobile-app classes for PWA-native chrome. */
export function MobileAppHost() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    body.classList.add("mobile-app-host");
    sessionStorage.removeItem("warehouse-store-chunk-reload");

    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    const applyStandalone = () => {
      const iosStandalone = Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );
      const standalone = mqStandalone.matches || iosStandalone;
      root.classList.toggle("store-standalone", standalone);
    };

    applyStandalone();
    mqStandalone.addEventListener("change", applyStandalone);

    const onChunkError = (event: ErrorEvent) => {
      const message = event.message || "";
      if (message.includes("ChunkLoadError") || message.includes("Failed to load chunk")) {
        const key = "warehouse-store-chunk-reload";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        }
      }
    };
    window.addEventListener("error", onChunkError);

    return () => {
      mqStandalone.removeEventListener("change", applyStandalone);
      window.removeEventListener("error", onChunkError);
      body.classList.remove("mobile-app-host");
      root.classList.remove("store-standalone");
    };
  }, []);

  return null;
}
