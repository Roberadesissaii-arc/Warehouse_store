"""Store-local SQLite schema (customer accounts — separate from WarehouseDB)."""
from .connection import get_db


def _column_exists(db, table: str, column: str) -> bool:
    return any(row["name"] == column for row in db.execute(f"PRAGMA table_info({table})"))


def ensure_schema():
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS pick_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            order_ref TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'placed',
            payload TEXT NOT NULL,
            placed_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            UNIQUE(customer_id, order_ref)
        );

        -- Pick list (bag). Persisted server-side per account, not in the browser.
        CREATE TABLE IF NOT EXISTS bag_items (
            customer_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            name TEXT,
            sku TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (customer_id, item_id),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        -- Per-account pick preferences (default fulfillment speed + floor note).
        CREATE TABLE IF NOT EXISTS customer_settings (
            customer_id INTEGER PRIMARY KEY,
            default_priority TEXT NOT NULL DEFAULT 'standard',
            default_note TEXT NOT NULL DEFAULT '',
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );
        """
    )
    # The status the customer last acknowledged for each pick (drives the unread
    # notification badge) — added idempotently for databases created earlier.
    if not _column_exists(db, "pick_orders", "seen_status"):
        db.execute("ALTER TABLE pick_orders ADD COLUMN seen_status TEXT")
    if not _column_exists(db, "pick_orders", "notification_hidden"):
        db.execute("ALTER TABLE pick_orders ADD COLUMN notification_hidden INTEGER NOT NULL DEFAULT 0")
    db.commit()
