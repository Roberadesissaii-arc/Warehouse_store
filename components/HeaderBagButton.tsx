"use client";

import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";
import { useBag } from "./BagProvider";
import { pickListCopy } from "@/lib/pickList";

export function HeaderBagButton() {
  const router = useRouter();
  const { count, openDrawer } = useBag();

  function onClick() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push("/bag");
      return;
    }
    openDrawer();
  }

  return (
    <button
      type="button"
      className="store-cart-trigger"
      aria-label={pickListCopy.open}
      onClick={onClick}
    >
      <GalleryVerticalEnd size={22} strokeWidth={2} aria-hidden />
      {count > 0 ? (
        <span className="store-cart-badge">{count > 9 ? "9+" : count}</span>
      ) : null}
    </button>
  );
}
