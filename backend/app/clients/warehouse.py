"""HTTP client for WarehouseDB store API."""
from __future__ import annotations

import requests


class WarehouseError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


class StoreWarehouseClient:
    def __init__(self, base_url: str, api_key: str, timeout: int = 20):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {"X-Store-Key": self.api_key, "Content-Type": "application/json"}

    def _request(self, method: str, path: str, **kwargs):
        url = f"{self.base_url}{path}"
        kwargs.setdefault("timeout", self.timeout)
        kwargs.setdefault("headers", self._headers())
        try:
            res = requests.request(method, url, **kwargs)
        except requests.RequestException as exc:
            raise WarehouseError(f"Cannot reach warehouse at {self.base_url}") from exc

        data = {}
        if res.content:
            try:
                data = res.json()
            except ValueError:
                data = {}
        if not res.ok:
            raise WarehouseError(data.get("error") or res.reason or "Request failed", res.status_code)
        return data

    def health(self) -> dict:
        return self._request("GET", "/api/health")

    def catalog(self) -> dict:
        return self._request("GET", "/api/store/catalog")

    def place_order(
        self,
        lines: list,
        customer_name: str = "",
        note: str = "",
        order_ref: str = "",
        priority: str = "standard",
    ) -> dict:
        return self._request(
            "POST",
            "/api/store/orders",
            json={
                "lines": lines,
                "customer_name": customer_name,
                "note": note,
                "order_ref": order_ref,
                "priority": priority,
            },
        )

    def orders_status_batch(self, order_refs: list[str]) -> dict:
        refs = [r.strip() for r in order_refs if r and str(r).strip()]
        if not refs:
            raise WarehouseError("order_refs is required")
        return self._request("GET", "/api/store/orders/status", params={"refs": ",".join(refs)})
