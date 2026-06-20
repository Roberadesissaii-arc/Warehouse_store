import { post, type CheckoutResponse } from "@/lib/api";
import type { BagLine } from "@/lib/store";

export async function checkoutPick({
  lines,
  customerName,
  priority,
  note,
}: {
  lines: BagLine[];
  customerName: string;
  priority: "standard" | "rush";
  note: string;
}) {
  const placedAt = new Date().toISOString();
  const historyLines = lines.map((line) => ({
    item_id: line.item_id,
    name: line.name || `Item #${line.item_id}`,
    sku: line.sku,
    quantity: line.quantity,
  }));

  const result = await post<CheckoutResponse>("/api/checkout", {
    lines: lines.map((line) => ({ item_id: line.item_id, quantity: line.quantity })),
    customer_name: customerName,
    note: note.trim(),
    priority,
    placed_at: placedAt,
    history_lines: historyLines,
  });

  return result.order_ref;
}
