import type { StoreProduct } from "./api";

const THUMB_PALETTES = [
  ["#0f766e", "#14b8a6"],
  ["#7c3aed", "#a78bfa"],
  ["#c2410c", "#fb923c"],
  ["#1d4ed8", "#60a5fa"],
  ["#be185d", "#f472b6"],
  ["#047857", "#34d399"],
  ["#b45309", "#fbbf24"],
  ["#4338ca", "#818cf8"],
] as const;

export function productInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function productPalette(id: number) {
  return THUMB_PALETTES[Math.abs(id) % THUMB_PALETTES.length];
}

export function stockLabel(qty: number) {
  if (qty <= 0) return "Out of stock";
  if (qty <= 3) return `Only ${qty} left`;
  return `${qty} in stock`;
}

export function stockBadge(qty: number) {
  if (qty <= 0) return { label: "Out of stock", tone: "out" as const };
  if (qty <= 3) return { label: `${qty} left`, tone: "low" as const };
  return { label: "In stock", tone: "in" as const };
}

export function productStockMeta(product: StoreProduct) {
  const loc = product.location;
  const parts = [loc?.section, loc?.shelf].filter(Boolean);
  const location = parts.join(" · ");
  const stock = stockLabel(product.quantity);
  return [location, stock].filter(Boolean).join(" · ");
}

export function aisleItemLabel(count: number) {
  return `${count} item${count === 1 ? "" : "s"} from the same aisle`;
}

export function locationLabel(product: StoreProduct) {
  const loc = product.location;
  if (!loc) return "";
  const parts = [loc.section, loc.shelf].filter(Boolean);
  return parts.join(" · ");
}

export function sortByNewest(products: StoreProduct[]) {
  return [...products].sort((a, b) => {
    const ta = Date.parse(a.created_at || "") || 0;
    const tb = Date.parse(b.created_at || "") || 0;
    if (tb !== ta) return tb - ta;
    return b.id - a.id;
  });
}

export function buildCategories(products: StoreProduct[]) {
  const counts = new Map<string, number>();
  for (const p of products) {
    const section = p.location?.section;
    if (!section) continue;
    counts.set(section, (counts.get(section) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
}

function searchScore(product: StoreProduct, term: string) {
  const name = product.name.toLowerCase();
  const sku = product.sku?.toLowerCase() || "";
  const section = product.location?.section?.toLowerCase() || "";
  if (name.startsWith(term)) return 0;
  if (name.includes(term)) return 1;
  if (sku.startsWith(term)) return 2;
  if (sku.includes(term)) return 3;
  if (section.includes(term)) return 4;
  return 5;
}

export function searchProducts(products: StoreProduct[], query: string, limit = 8) {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  return products
    .filter((p) => {
      const hay = `${p.name} ${p.sku || ""} ${p.location?.section || ""} ${p.location?.shelf || ""}`.toLowerCase();
      return hay.includes(term);
    })
    .sort((a, b) => searchScore(a, term) - searchScore(b, term) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function groupProductsBySection(products: StoreProduct[]) {
  const groups = new Map<string, StoreProduct[]>();
  for (const p of products) {
    const key = p.location?.section?.trim() || "Uncategorized";
    const list = groups.get(key) || [];
    list.push(p);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    })
    .map(([name, items]) => ({ name, items }));
}
