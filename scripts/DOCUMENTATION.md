# Warehouse Store scripts — documentation

Operator and debug tools for the **Store app** (`Warehouse_store/`). Use these for customer/owner accounts in `store.db`, cached orders, and checking the warehouse API connection.

---

## Before you start

1. Open a terminal.
2. Go to the Store app folder:

```powershell
cd path\to\test\Warehouse_store
```

3. Use **Python 3.10+**.
4. Install Store API dependencies:

```powershell
pip install -r backend/requirements.txt
```

5. Built-in help:

```powershell
python scripts/debug.py --help
python scripts/debug.py users --help
```

---

## Database this folder touches

| File | Table | Purpose |
|------|-------|---------|
| `instance/store.db` | `customers` | Store owner / customer login (email + password) |
| `instance/store.db` | `pick_orders` | Cached pick order history per customer |

Catalog and live stock come from **WarehouseDB** (`WAREHOUSE_URL` + `STORE_API_KEY`). This folder does not edit `warehouse.db`.

---

## Environment (`.env` / `.env.local` in `Warehouse_store/`)

| Variable | Purpose |
|----------|---------|
| `WAREHOUSE_URL` | Warehouse API base |
| `STORE_API_KEY` | Must match `STORE_API_KEY` on WarehouseDB |
| `STORE_SECRET_KEY` | Session signing for Store API |
| `STORE_DATABASE` | Override path to `store.db` (optional) |
| `STORE_BACKEND_URL` | Next.js proxy target (default `http://127.0.0.1:5004`) |

```powershell
python scripts/debug.py env
```

---

## Main tool: `debug.py`

```powershell
python scripts/debug.py <command> [options]
```

### `status`

```powershell
python scripts/debug.py status
```

Shows store root, API port (default **5004**), database path, whether first-time setup is needed, customer count, warehouse URL.

---

### `env`

```powershell
python scripts/debug.py env
```

---

### `db`

```powershell
python scripts/debug.py db
```

Row counts for `customers` and `pick_orders`.

---

### `users` — customer accounts (email = login)

Store uses **email** as the username (not a separate username field).

#### List customer emails

```powershell
python scripts/debug.py users list
```

#### Show one customer

```powershell
python scripts/debug.py users show owner@example.com
```

Shows id, email, name, and how many orders are cached locally.

#### Verify password

```powershell
python scripts/debug.py users verify owner@example.com -p "your-password"
```

Prompted:

```powershell
python scripts/debug.py users verify owner@example.com
```

#### Reset password

```powershell
python scripts/debug.py users reset owner@example.com -p "NewPass123"
```

Prompted:

```powershell
python scripts/debug.py users reset owner@example.com
```

**Password rules:** 8+ characters, at least one letter and one number.

**First sign-in:** no preset email or password. The sign-in page creates the one store owner account (name + email + password) when the database is empty. Use `users list` to see which email exists after setup.

---

### `orders` — cached pick orders

Orders stored locally after checkout (not a full warehouse task dump):

```powershell
python scripts/debug.py orders list owner@example.com
python scripts/debug.py orders list owner@example.com --limit 10
```

---

### `warehouse` — connection to WarehouseDB

```powershell
python scripts/debug.py warehouse ping
```

**Use when:** store shows no products or checkout fails — confirm warehouse is up and `STORE_API_KEY` matches.

---

## Legacy script: `reset_customer_password.py`

```powershell
python scripts/reset_customer_password.py --list
python scripts/reset_customer_password.py --email owner@example.com --password "NewPass123"
```

`--email` is only required for reset, not for `--list`.

---

## Common tasks

| I want to… | Command |
|------------|---------|
| List store logins | `python scripts/debug.py users list` |
| Forgot store password | `python scripts/debug.py users reset email@example.com -p "…"` |
| Test if password works | `python scripts/debug.py users verify email@example.com -p "…"` |
| See cached orders | `python scripts/debug.py orders list email@example.com` |
| Store cannot reach warehouse | `python scripts/debug.py warehouse ping` |
| Check env keys | `python scripts/debug.py env` |

---

## Troubleshooting

**Customer not found**

- Emails are normalized to lowercase. Use the exact email from `users list`.

**`warehouse ping` fails**

- Start WarehouseDB on the warehouse host.
- Set `WAREHOUSE_URL` in `Warehouse_store/.env.local` to that host (e.g. `http://192.168.1.10:8000`).
- `STORE_API_KEY` must match WarehouseDB `.env`.

**Reset vs Warehouse staff**

- Resetting a **store customer** does not change WarehouseDB staff — those are separate apps and databases.

---

## Related documentation

- Warehouse staff / inventory: `WarehouseDB/scripts/DOCUMENTATION.md`
- Scan floor staff: `Warehouse_scan/scripts/DOCUMENTATION.md`
- Store app overview: `Warehouse_store/README.md`
