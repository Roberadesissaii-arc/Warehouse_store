#!/usr/bin/env python3
"""Warehouse Store operator/debug CLI — customers, orders, warehouse API."""
from __future__ import annotations

import argparse
import getpass
import os
import sqlite3
import sys
from pathlib import Path

STORE_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = STORE_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app  # noqa: E402
from app.clients.warehouse import StoreWarehouseClient, WarehouseError  # noqa: E402
from app.models import customer  # noqa: E402


def _mask(value: str | None, show: int = 12) -> str:
    if not value:
        return "(not set)"
    if len(value) <= show:
        return value
    return f"{value[:show]}… ({len(value)} chars)"


def _db_path(app) -> Path:
    return Path(app.config["DATABASE"])


def _db_size(path: Path) -> str:
    if not path.is_file():
        return "missing"
    kb = path.stat().st_size / 1024
    return f"{kb:.1f} KB"


def _table_counts(db_path: Path, tables: list[str]) -> list[tuple[str, int | str]]:
    if not db_path.is_file():
        return [(t, "—") for t in tables]
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    out: list[tuple[str, int | str]] = []
    for name in tables:
        try:
            n = conn.execute(f"SELECT COUNT(*) c FROM {name}").fetchone()["c"]
            out.append((name, int(n)))
        except sqlite3.Error:
            out.append((name, "missing"))
    conn.close()
    return out


def _warehouse_client(app) -> StoreWarehouseClient:
    return StoreWarehouseClient(app.config["WAREHOUSE_URL"], app.config["STORE_API_KEY"])


def cmd_status(app) -> int:
    cfg = app.config
    db = _db_path(app)
    print("=== Warehouse Store status ===")
    print(f"Store root:     {STORE_ROOT}")
    print(f"FLASK_ENV:      {os.environ.get('FLASK_ENV', 'development')}")
    print(f"API host:port:  {cfg.get('HOST')}:{cfg.get('PORT')}")
    print(f"Database:       {db}")
    print(f"DB size:        {_db_size(db)}")
    print(f"Setup needed:   {customer.needs_setup()}")
    print(f"Customers:      {len(customer.list_usernames())}")
    print(f"Warehouse URL:  {cfg.get('WAREHOUSE_URL')}")
    return 0


def cmd_env(app) -> int:
    cfg = app.config
    print("=== Store environment ===")
    print(f"STORE_SECRET_KEY: {_mask(cfg.get('SECRET_KEY'))}")
    print(f"STORE_API_KEY:    {_mask(cfg.get('STORE_API_KEY'))}")
    print(f"WAREHOUSE_URL:    {cfg.get('WAREHOUSE_URL')}")
    print(f"STORE_DATABASE:   {cfg.get('DATABASE')}")
    return 0


def cmd_db(app) -> int:
    db = _db_path(app)
    tables = ["customers", "pick_orders"]
    print(f"=== Database: {db} ===")
    print(f"Size: {_db_size(db)}")
    print("Table rows:")
    for name, count in _table_counts(db, tables):
        print(f"  {name:16} {count}")
    return 0


def cmd_warehouse_ping(app) -> int:
    client = _warehouse_client(app)
    url = app.config["WAREHOUSE_URL"]
    try:
        data = client.health()
    except WarehouseError as exc:
        print(f"FAIL — cannot reach warehouse at {url}")
        print(f"       {exc}", file=sys.stderr)
        return 1
    print(f"OK — warehouse health at {url}")
    for key in sorted(data):
        print(f"  {key}: {data[key]}")
    return 0


def cmd_users_list(_app) -> int:
    emails = customer.list_usernames()
    if not emails:
        print("No customer accounts.")
        return 0
    print("Store customer accounts:")
    for email in emails:
        print(f"  - {email}")
    return 0


def cmd_users_show(_app, email: str) -> int:
    row = customer.get_by_email(email)
    if not row:
        print(f"No customer for {email!r}", file=sys.stderr)
        return 1
    orders = customer.list_pick_orders(row["id"])
    print(f"id:     {row['id']}")
    print(f"email:  {row['email']}")
    print(f"name:   {row.get('name') or '—'}")
    print(f"hash:   {_mask(row['password_hash'], 16)}")
    print(f"orders: {len(orders)} cached locally")
    return 0


def cmd_users_verify(_app, email: str, password: str | None) -> int:
    if not password:
        password = getpass.getpass("Password to test: ")
    ok = customer.verify_customer(email, password)
    if ok:
        print(f"OK — password matches {ok['email']!r} (id={ok['id']})")
        return 0
    print(f"FAIL — password does not match {email!r}", file=sys.stderr)
    return 1


def cmd_users_reset(_app, email: str, password: str | None) -> int:
    if not password:
        password = getpass.getpass("New password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords do not match.", file=sys.stderr)
            return 1
    try:
        customer.reset_password(email, password)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    print(f"Password updated for {email}")
    return 0


def cmd_orders_list(_app, email: str, limit: int) -> int:
    row = customer.get_by_email(email)
    if not row:
        print(f"No customer for {email!r}", file=sys.stderr)
        return 1
    orders = customer.list_pick_orders(row["id"])[:limit]
    if not orders:
        print(f"No pick orders for {row['email']}.")
        return 0
    print(f"Pick orders for {row['email']} (up to {limit}):")
    for order in orders:
        ref = order.get("order_ref") or order.get("ref") or "—"
        status = order.get("status") or "—"
        placed = order.get("placed_at") or order.get("created_at") or "—"
        print(f"  {ref}  {status}  {placed}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Warehouse Store debug / operator tools")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="App and database summary")
    sub.add_parser("env", help="Loaded config (secrets masked)")
    sub.add_parser("db", help="SQLite file and table row counts")

    wh = sub.add_parser("warehouse", help="WarehouseDB HTTP checks")
    wh_sub = wh.add_subparsers(dest="wh_cmd", required=True)
    wh_sub.add_parser("ping", help="GET /api/health")

    users = sub.add_parser("users", help="Customer account tools")
    users_sub = users.add_subparsers(dest="users_cmd", required=True)
    users_sub.add_parser("list", help="List customer emails")
    show_p = users_sub.add_parser("show", help="Show one customer")
    show_p.add_argument("email")
    verify_p = users_sub.add_parser("verify", help="Test email/password")
    verify_p.add_argument("email")
    verify_p.add_argument("-p", "--password")
    reset_p = users_sub.add_parser("reset", help="Reset customer password")
    reset_p.add_argument("email")
    reset_p.add_argument("-p", "--password")

    orders = sub.add_parser("orders", help="Cached pick orders in store.db")
    orders_sub = orders.add_subparsers(dest="orders_cmd", required=True)
    orders_list = orders_sub.add_parser("list", help="List orders for a customer")
    orders_list.add_argument("email")
    orders_list.add_argument("--limit", type=int, default=20)

    args = parser.parse_args()
    app = create_app()

    with app.app_context():
        if args.command == "status":
            return cmd_status(app)
        if args.command == "env":
            return cmd_env(app)
        if args.command == "db":
            return cmd_db(app)
        if args.command == "warehouse" and args.wh_cmd == "ping":
            return cmd_warehouse_ping(app)
        if args.command == "users":
            if args.users_cmd == "list":
                return cmd_users_list(app)
            if args.users_cmd == "show":
                return cmd_users_show(app, args.email)
            if args.users_cmd == "verify":
                return cmd_users_verify(app, args.email, args.password)
            if args.users_cmd == "reset":
                return cmd_users_reset(app, args.email, args.password)
        if args.command == "orders" and args.orders_cmd == "list":
            return cmd_orders_list(app, args.email, args.limit)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
