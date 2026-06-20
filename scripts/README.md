# Warehouse Store — scripts

Operator tools for the Store app (customers in `store.db`).

**Full guide:** [DOCUMENTATION.md](DOCUMENTATION.md) — users, orders, warehouse ping, troubleshooting.

**First sign-in:** no preset login. Create the one store owner account (name + email + password) on the sign-in page when the database is empty.

## Quick start

```powershell
cd Warehouse_store
.\dev.ps1
```

Or run UI and API separately:

```powershell
pnpm dev:api    # Store API :5004
pnpm dev        # Store UI  :5001
```

```powershell
cd Warehouse_store
python scripts/debug.py status
python scripts/debug.py users list
python scripts/debug.py users reset owner@example.com -p "NewPass123"
python scripts/debug.py warehouse ping
```

## Files

| File | Purpose |
|------|---------|
| `debug.py` | Main debug CLI |
| `DOCUMENTATION.md` | **How-to documentation** |
| `reset_customer_password.py` | Password reset shortcut |

Warehouse staff → `WarehouseDB/scripts/DOCUMENTATION.md`
