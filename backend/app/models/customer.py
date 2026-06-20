"""Warehouse Store owner account (store/instance/store.db only)."""
import json
import re

from werkzeug.security import check_password_hash, generate_password_hash

from ..database import get_db

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Used to equalize verify timing when an email does not exist, so response time
# can't be used to enumerate valid accounts.
_DUMMY_HASH = generate_password_hash("timing-equalizer-not-a-real-password")


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ValueError("Password must include at least one letter and one number")


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def needs_setup() -> bool:
    return get_db().execute("SELECT COUNT(*) c FROM customers").fetchone()["c"] == 0


def create_customer(name: str, email: str, password: str):
    if not needs_setup():
        raise ValueError("An account already exists for this Store server.")
    name = (name or "").strip()
    email = normalize_email(email)
    if not name:
        raise ValueError("Name is required")
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email")
    validate_password(password)

    db = get_db()
    if db.execute("SELECT id FROM customers WHERE email=?", (email,)).fetchone():
        raise ValueError("An account with this email already exists")

    db.execute(
        "INSERT INTO customers(email, name, password_hash) VALUES (?, ?, ?)",
        (email, name, generate_password_hash(password)),
    )
    db.commit()
    return get_by_email(email)


def verify_customer(email: str, password: str):
    row = get_by_email(email)
    if not row:
        check_password_hash(_DUMMY_HASH, password)  # equalize timing
        return None
    if not check_password_hash(row["password_hash"], password):
        return None
    return row


def get_by_id(customer_id: int):
    return get_db().execute("SELECT * FROM customers WHERE id=?", (customer_id,)).fetchone()


def get_by_email(email: str):
    return get_db().execute(
        "SELECT * FROM customers WHERE email=?",
        (normalize_email(email),),
    ).fetchone()


def update_name(customer_id: int, name: str):
    name = (name or "").strip()
    if not name:
        raise ValueError("Name is required")
    db = get_db()
    db.execute("UPDATE customers SET name=? WHERE id=?", (name, customer_id))
    db.commit()
    return get_by_id(customer_id)


def update_password(customer_id: int, current_password: str, new_password: str):
    row = get_by_id(customer_id)
    if not row:
        raise ValueError("Account not found")
    if not check_password_hash(row["password_hash"], current_password or ""):
        raise ValueError("Current password is incorrect")
    validate_password(new_password)
    db = get_db()
    db.execute(
        "UPDATE customers SET password_hash=? WHERE id=?",
        (generate_password_hash(new_password), customer_id),
    )
    db.commit()
    return get_by_id(customer_id)


def list_usernames():
    rows = get_db().execute("SELECT email FROM customers ORDER BY email").fetchall()
    return [row["email"] for row in rows]


def reset_password(email: str, password: str):
    validate_password(password)
    row = get_by_email(email)
    if not row:
        raise ValueError(f"No customer account for {email!r}")
    db = get_db()
    db.execute(
        "UPDATE customers SET password_hash=? WHERE id=?",
        (generate_password_hash(password), row["id"]),
    )
    db.commit()
    return row["email"]


def add_pick_order(customer_id: int, order_ref: str, payload: dict):
    db = get_db()
    db.execute(
        """
        INSERT INTO pick_orders(customer_id, order_ref, status, payload, placed_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(customer_id, order_ref) DO UPDATE SET
            status=excluded.status,
            payload=excluded.payload,
            notification_hidden=0
        """,
        (
            customer_id,
            order_ref,
            payload.get("status") or "placed",
            json.dumps(payload),
            payload.get("placed_at") or payload.get("created_at") or "",
        ),
    )
    db.commit()


def list_pick_orders(customer_id: int):
    rows = get_db().execute(
        """
        SELECT order_ref, status, payload, placed_at, seen_status, notification_hidden
        FROM pick_orders
        WHERE customer_id=?
        ORDER BY datetime(placed_at) DESC, id DESC
        LIMIT 50
        """,
        (customer_id,),
    ).fetchall()
    orders = []
    for row in rows:
        try:
            payload = json.loads(row["payload"] or "{}")
        except json.JSONDecodeError:
            payload = {}
        payload.setdefault("order_ref", row["order_ref"])
        payload["status"] = row["status"] or payload.get("status")
        payload.setdefault("placed_at", row["placed_at"])
        # Always present so the client never crashes mapping lines.
        if not isinstance(payload.get("lines"), list):
            payload["lines"] = []
        payload["seen_status"] = row["seen_status"]
        payload["notification_hidden"] = bool(row["notification_hidden"])
        orders.append(payload)
    return orders


def mark_notifications_seen(customer_id: int) -> None:
    """Acknowledge current pick statuses so they stop counting as unread."""
    db = get_db()
    db.execute(
        "UPDATE pick_orders SET seen_status=status WHERE customer_id=?",
        (customer_id,),
    )
    db.commit()


def clear_notifications(customer_id: int) -> None:
    """Hide all picks from the notification panel until status changes again."""
    db = get_db()
    db.execute(
        "UPDATE pick_orders SET notification_hidden=1, seen_status=status WHERE customer_id=?",
        (customer_id,),
    )
    db.commit()


def clear_pick_orders(customer_id: int) -> None:
    """Permanently delete the account's pick history (danger zone)."""
    db = get_db()
    db.execute("DELETE FROM pick_orders WHERE customer_id=?", (customer_id,))
    db.commit()


# --- Pick list (bag) -------------------------------------------------------

def get_bag(customer_id: int):
    rows = get_db().execute(
        "SELECT item_id, quantity, name, sku FROM bag_items WHERE customer_id=? ORDER BY rowid",
        (customer_id,),
    ).fetchall()
    return [
        {"item_id": r["item_id"], "quantity": r["quantity"], "name": r["name"], "sku": r["sku"]}
        for r in rows
    ]


def set_bag(customer_id: int, lines) -> list:
    """Replace the whole bag with the provided lines (item_id + quantity > 0)."""
    db = get_db()
    db.execute("DELETE FROM bag_items WHERE customer_id=?", (customer_id,))
    for line in lines or []:
        try:
            item_id = int(line.get("item_id"))
            quantity = int(line.get("quantity"))
        except (TypeError, ValueError, AttributeError):
            continue
        if item_id <= 0 or quantity <= 0:
            continue
        db.execute(
            "INSERT OR REPLACE INTO bag_items(customer_id, item_id, quantity, name, sku) "
            "VALUES (?, ?, ?, ?, ?)",
            (customer_id, item_id, quantity, line.get("name"), line.get("sku")),
        )
    db.commit()
    return get_bag(customer_id)


# --- Preferences -----------------------------------------------------------

def get_preferences(customer_id: int) -> dict:
    row = get_db().execute(
        "SELECT default_priority, default_note FROM customer_settings WHERE customer_id=?",
        (customer_id,),
    ).fetchone()
    if not row:
        return {"priority": "standard", "note": ""}
    return {
        "priority": "rush" if row["default_priority"] == "rush" else "standard",
        "note": row["default_note"] or "",
    }


def set_preferences(customer_id: int, priority: str, note: str) -> dict:
    priority = "rush" if (priority or "").strip().lower() == "rush" else "standard"
    note = (note or "").strip()[:240]
    db = get_db()
    db.execute(
        """
        INSERT INTO customer_settings(customer_id, default_priority, default_note)
        VALUES (?, ?, ?)
        ON CONFLICT(customer_id) DO UPDATE SET
            default_priority=excluded.default_priority,
            default_note=excluded.default_note
        """,
        (customer_id, priority, note),
    )
    db.commit()
    return get_preferences(customer_id)


def update_order_statuses(customer_id: int, status_map: dict[str, str]) -> bool:
    if not status_map:
        return False
    db = get_db()
    changed = False
    rows = db.execute(
        "SELECT id, order_ref, status, payload FROM pick_orders WHERE customer_id=?",
        (customer_id,),
    ).fetchall()
    for row in rows:
        ref = row["order_ref"]
        next_status = status_map.get(ref)
        if not next_status or next_status == row["status"]:
            continue
        try:
            payload = json.loads(row["payload"] or "{}")
        except json.JSONDecodeError:
            payload = {}
        payload["status"] = next_status
        db.execute(
            "UPDATE pick_orders SET status=?, payload=?, notification_hidden=0 WHERE id=?",
            (next_status, json.dumps(payload), row["id"]),
        )
        changed = True
    if changed:
        db.commit()
    return changed
