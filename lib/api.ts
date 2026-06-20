export type ApiError = Error & { status?: number };

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || res.statusText || "Request failed") as ApiError;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

export type StoreProduct = {
  id: number;
  name: string;
  sku?: string | null;
  quantity: number;
  location?: {
    warehouse?: string;
    section?: string;
    shelf?: string;
    path?: string;
  };
  created_at?: string;
};

export type CatalogResponse = {
  products: StoreProduct[];
  warehouse_connected?: boolean;
  message?: string;
};

export type CheckoutLine = { item_id: number; quantity: number };

export type CheckoutResponse = {
  order_ref: string;
  order_id?: string;
  status?: string;
};

export type PickHistoryLine = {
  item_id?: number;
  name: string;
  sku?: string;
  quantity: number;
};

export type PickHistory = {
  order_ref: string;
  placed_at: string;
  lines: PickHistoryLine[];
  priority?: string;
  note?: string;
  status?: string;
  seen_status?: string | null;
  notification_hidden?: boolean;
};

export type StorePreferences = {
  priority: "standard" | "rush";
  note: string;
};

export type SystemInfo = {
  warehouse_url: string;
  warehouse_connected: boolean;
  app_version: string;
};
