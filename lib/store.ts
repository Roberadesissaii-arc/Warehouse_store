import type { CheckoutLine, SystemInfo } from "./api";
import { get, post, put } from "./api";

const AUTH_EVENT = "warehouse-store-auth";

export type BagLine = CheckoutLine & { name?: string; sku?: string };

export const storeAuthEventName = AUTH_EVENT;

/** Owner-only warehouse connection + app info for the settings page. */
export async function fetchSystemInfo(): Promise<SystemInfo> {
  return get<SystemInfo>("/api/system");
}

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function bagCount(lines: BagLine[]) {
  return lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
}

export function profileInitials(name: string) {
  const parts = String(name || "Guest")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name || "G").slice(0, 2).toUpperCase();
}

export function orderStatusLabel(status?: string) {
  const key = (status || "").trim().toLowerCase();
  return (
    {
      preparing: "Preparing",
      picking: "Picking now",
      delayed: "Waiting for floor",
      placed: "Placed",
      done: "Ready to collect",
      unknown: "Queued on floor",
      queued: "Queued",
      "in_progress": "In progress",
      cancelled: "Cancelled",
      complete: "Ready to collect",
      completed: "Ready to collect",
      picked: "Ready to collect",
      pending: "Pending",
    }[key] ||
    (key ? key.replace(/_/g, " ") : "Preparing")
  );
}

export function orderStatusKey(status?: string) {
  const key = (status || "preparing").trim().toLowerCase();
  if (key === "complete" || key === "completed" || key === "picked") return "done";
  if (key === "in_progress") return "picking";
  if (key === "queued" || key === "pending") return "preparing";
  return key || "preparing";
}

/** Display pick ID without the leading date prefix (e.g. 20260619-225417 → 225417). */
export function formatPickRef(orderRef: string) {
  const ref = (orderRef || "").trim();
  const match = ref.match(/^\d{8}-(.+)$/);
  return match ? match[1] : ref;
}

function formatPickDateTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Human-readable placed time for pick headers (no weekday clutter). */
export function formatPickPlacedAt(iso: string, orderRef?: string) {
  const parsed = iso ? new Date(iso) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return formatPickDateTime(parsed);
  }

  const ref = (orderRef || iso || "").trim();
  const match = ref.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    const fallback = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    if (!Number.isNaN(fallback.getTime())) {
      return formatPickDateTime(fallback);
    }
  }

  return "";
}

export function validatePassword(password: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must include at least one letter and one number");
  }
}

export async function signIn(email: string, password: string) {
  const data = await post<{ email: string; name: string }>("/api/auth/sign-in", { email, password });
  notifyAuthChange();
  return data;
}

export async function createAccount(name: string, email: string, password: string) {
  validatePassword(password);
  const data = await post<{ email: string; name: string }>("/api/auth/setup", { name, email, password });
  notifyAuthChange();
  return data;
}

export async function signOut() {
  await post("/api/auth/logout", {}).catch(() => {});
  notifyAuthChange();
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  validatePassword(newPassword);
  await put("/api/account/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

/** Pick list (bag) — persisted server-side per account in SQLite, not the browser. */
export async function fetchServerBag(): Promise<BagLine[]> {
  const data = await get<{ lines?: BagLine[] }>("/api/bag");
  return data.lines || [];
}

export async function saveServerBag(lines: BagLine[]): Promise<void> {
  await put("/api/bag", { lines });
}
