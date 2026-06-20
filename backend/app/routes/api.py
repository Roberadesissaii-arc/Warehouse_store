from flask import Blueprint, current_app, jsonify, request, session

from ..clients.warehouse import WarehouseError
from ..models import customer
from ..services import rate_limit

api_bp = Blueprint("api", __name__, url_prefix="/api")


def _customer_session():
    customer_id = session.get("customer_id")
    if not customer_id:
        return None
    return customer.get_by_id(customer_id)


@api_bp.get("/health")
def health():
    warehouse_ok = False
    client = current_app.extensions["warehouse_client"]
    try:
        data = client.health()
        warehouse_ok = bool(data.get("ok"))
    except WarehouseError:
        warehouse_ok = False

    # Public liveness probe — keep it free of paths, URLs, and other internals.
    return jsonify(
        ok=True,
        app="store-api",
        warehouse_ok=warehouse_ok,
    )


@api_bp.get("/auth/status")
def auth_status():
    return jsonify(
        needs_setup=customer.needs_setup(),
        signed_in=bool(_customer_session()),
    )


@api_bp.get("/me")
def me():
    row = _customer_session()
    if not row:
        return jsonify(signed_in=False)
    return jsonify(
        signed_in=True,
        email=row["email"],
        name=row["name"],
        member_since=row["created_at"],
        orders=customer.list_pick_orders(row["id"]),
        preferences=customer.get_preferences(row["id"]),
        bag=customer.get_bag(row["id"]),
    )


@api_bp.post("/auth/sign-in")
def sign_in():
    body = request.get_json(silent=True) or {}
    email = body.get("email") or ""
    password = body.get("password") or ""
    if not email or not password:
        return jsonify(error="Email and password are required"), 400

    throttle_key = f"signin:{email.strip().lower()}"
    locked_for = rate_limit.seconds_until_unlocked(throttle_key)
    if locked_for:
        resp = jsonify(error="Too many failed sign-in attempts. Wait a few minutes and try again.")
        resp.headers["Retry-After"] = str(locked_for)
        return resp, 429

    row = customer.verify_customer(email, password)
    if not row:
        rate_limit.record_failure(throttle_key)
        return jsonify(error="Incorrect email or password"), 401

    rate_limit.reset(throttle_key)
    session.clear()
    session.permanent = True
    session["customer_id"] = row["id"]
    session["customer_email"] = row["email"]
    return jsonify(
        signed_in=True,
        email=row["email"],
        name=row["name"],
        orders=customer.list_pick_orders(row["id"]),
    )


@api_bp.post("/auth/setup")
def setup_account():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    email = body.get("email") or ""
    password = body.get("password") or ""
    if not name or not email or not password:
        return jsonify(error="Name, email, and password are required"), 400
    if not customer.needs_setup():
        return jsonify(error="This Store server already has an owner account"), 403

    try:
        row = customer.create_customer(name, email, password)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    session.clear()
    session.permanent = True
    session["customer_id"] = row["id"]
    session["customer_email"] = row["email"]
    return jsonify(
        signed_in=True,
        email=row["email"],
        name=row["name"],
        orders=[],
    ), 201


@api_bp.post("/auth/sign-up")
def sign_up():
    """Alias for first-run setup."""
    return setup_account()


@api_bp.post("/auth/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@api_bp.put("/account/profile")
def update_profile():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    body = request.get_json(silent=True) or {}
    try:
        updated = customer.update_name(row["id"], body.get("name") or "")
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    return jsonify(email=updated["email"], name=updated["name"])


@api_bp.put("/account/password")
def update_password():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    body = request.get_json(silent=True) or {}
    current_password = body.get("current_password") or ""
    new_password = body.get("new_password") or ""
    if not current_password or not new_password:
        return jsonify(error="Current and new password are required"), 400
    try:
        customer.update_password(row["id"], current_password, new_password)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    return jsonify(ok=True)


@api_bp.get("/catalog")
def catalog():
    client = current_app.extensions["warehouse_client"]
    try:
        data = client.catalog()
        data["warehouse_connected"] = True
        return jsonify(data)
    except WarehouseError as exc:
        return jsonify(
            products=[],
            warehouse_connected=False,
            message="WarehouseDB is not reachable — add inventory there first.",
            error=str(exc),
        )


@api_bp.post("/checkout")
def checkout():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    body = request.get_json(silent=True) or {}
    lines = body.get("lines") or []
    if not lines:
        return jsonify(error="Bag is empty"), 400

    client = current_app.extensions["warehouse_client"]
    try:
        result = client.place_order(
            lines,
            customer_name=(body.get("customer_name") or "").strip(),
            note=(body.get("note") or "").strip(),
            order_ref=(body.get("order_ref") or "").strip(),
            priority=(body.get("priority") or "standard").strip().lower(),
        )
    except WarehouseError as exc:
        return jsonify(error=str(exc)), exc.status

    row = _customer_session()
    if row and result.get("order_ref"):
        from datetime import datetime, timezone

        placed_at = (body.get("placed_at") or "").strip() or datetime.now(timezone.utc).isoformat()
        customer.add_pick_order(
            row["id"],
            result["order_ref"],
            {
                "order_ref": result["order_ref"],
                "placed_at": placed_at,
                "lines": body.get("history_lines") or lines,
                "priority": body.get("priority") or "standard",
                "note": body.get("note") or "",
                "status": result.get("status") or "preparing",
            },
        )
        # The pick list has been ordered — clear the server-side bag.
        customer.set_bag(row["id"], [])

    return jsonify(result), 201


@api_bp.get("/orders/status")
def orders_status():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    refs_raw = (request.args.get("refs") or "").strip()
    if not refs_raw:
        return jsonify(error="refs query parameter is required"), 400
    refs = [r.strip() for r in refs_raw.split(",") if r.strip()]
    if not refs:
        return jsonify(error="refs query parameter is required"), 400

    client = current_app.extensions["warehouse_client"]
    try:
        data = client.orders_status_batch(refs)
    except WarehouseError as exc:
        return jsonify(error=str(exc)), exc.status

    row = _customer_session()
    if row:
        status_map = {
            item.get("order_ref"): item.get("status")
            for item in data.get("orders", [])
            if item.get("order_ref") and item.get("status")
        }
        customer.update_order_statuses(row["id"], status_map)

    return jsonify(data)


@api_bp.get("/account/orders")
def account_orders():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    return jsonify(orders=customer.list_pick_orders(row["id"]))


@api_bp.get("/bag")
def get_bag():
    row = _customer_session()
    if not row:
        return jsonify(lines=[])
    return jsonify(lines=customer.get_bag(row["id"]))


@api_bp.put("/bag")
def put_bag():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    body = request.get_json(silent=True) or {}
    lines = customer.set_bag(row["id"], body.get("lines") or [])
    return jsonify(lines=lines)


@api_bp.put("/account/preferences")
def update_preferences():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    body = request.get_json(silent=True) or {}
    prefs = customer.set_preferences(row["id"], body.get("priority") or "standard", body.get("note") or "")
    return jsonify(prefs)


@api_bp.post("/notifications/seen")
def notifications_seen():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    customer.mark_notifications_seen(row["id"])
    return jsonify(ok=True)


@api_bp.delete("/notifications/clear")
def notifications_clear():
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    customer.clear_notifications(row["id"])
    return jsonify(ok=True)


@api_bp.get("/system")
def system_info():
    """Owner-only: warehouse connection + app info for the settings page."""
    if not _customer_session():
        return jsonify(error="Sign in required"), 401
    warehouse_connected = False
    client = current_app.extensions["warehouse_client"]
    try:
        warehouse_connected = bool(client.health().get("ok"))
    except WarehouseError:
        warehouse_connected = False
    return jsonify(
        warehouse_url=current_app.config["WAREHOUSE_URL"],
        warehouse_connected=warehouse_connected,
        app_version=current_app.config.get("APP_VERSION", "1.0.0"),
    )


@api_bp.delete("/account/picks")
def clear_pick_history():
    """Danger zone: permanently delete the account's pick history."""
    row = _customer_session()
    if not row:
        return jsonify(error="Sign in required"), 401
    customer.clear_pick_orders(row["id"])
    return jsonify(ok=True)
