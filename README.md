# Warehouse Store

**Your shop, your control.** Self-hosted.

The customer-facing storefront for your warehouse — browse products, fill a bag, and place
orders that drop straight into the **WarehouseDB** pick queue for the robots. A Next.js front
end with a small Flask API for customer accounts and checkout.

> Needs **WarehouseDB** reachable (it provides the products and receives orders).

| App | Folder | Port |
|-----|--------|------|
| **Store** (this repo) | `.` | 5001 storefront · 5004 API |
| WarehouseDB | `../WarehouseDB` | 8000 |
| Scan | `../Warehouse_scan` | 5002 · 5003 |

## What you get

| Area | Description |
|------|-------------|
| Storefront | Home, product browsing, and search backed by WarehouseDB inventory |
| Bag & checkout | Add to bag, place an order — lines queue as robot picks in WarehouseDB |
| Accounts | Customer sign-up / sign-in, stored in a local SQLite database |
| Account settings | Profile, preferences, password, notifications, and pick history |
| Order history | Per-customer pick history with live status |
| Public access | Optional Cloudflare tunnel for a public storefront URL |

## Prerequisites

A Linux server or Raspberry Pi (Debian/Ubuntu) with `git` and `sudo`. The installer pulls in
everything else (Node 22, pnpm, Python). **WarehouseDB** must be reachable — it provides the
products. (Windows is supported for local development — see below.)

## Quick start

**You do not install Node, pnpm, Python, or anything else first — `./install.sh` installs the
whole toolchain for you.** Just clone and run it:

```bash
git clone https://github.com/Roberadesissaii-arc/Warehouse_store.git
cd Warehouse_store
./install.sh
```

`./install.sh` will, in one shot:

1. Install system deps (apt update, Node 22, pnpm, Python venv, `cloudflared`)
2. Create the Python virtualenv and install the API
3. Generate `.env.local` with a random secret and free ports (storefront **5001**, API **5004**)
4. Build the production app
5. Register a **systemd service** (`systemctl enable --now warehouse-store`) — it **starts now
   and again on every boot**, and restarts on crash

When it finishes it prints the URL, e.g. `http://<server-ip>:5001`.

> You run `install.sh` **once**. After that the storefront is always on — **you never start
> it by hand.** Re-run it anytime to update after `git pull`.

```bash
./install.sh --no-service   # install only — start by hand with ./run.sh
./install.sh --docker       # run with Docker instead of native
```

After install, point `WAREHOUSE_URL` in `.env.local` at your WarehouseDB host (LAN URL or its
Cloudflare tunnel) and make sure `STORE_API_KEY` matches WarehouseDB.

**First sign-in:** no preset login — create the store owner account (name, email, password)
on the sign-in page when the database is empty.

## Managing the service

```bash
systemctl status warehouse-store          # is it running?
sudo systemctl restart warehouse-store    # restart now
sudo systemctl stop warehouse-store       # stop until next boot
sudo systemctl disable warehouse-store    # stop auto-starting on boot
journalctl -u warehouse-store -f          # live logs

git pull && ./install.sh                  # update after pulling new code
```

## Public access (Cloudflare tunnel)

Optional public domain: see [deploy/CLOUDFLARE-TUNNEL.md](deploy/CLOUDFLARE-TUNNEL.md).

## Development (Windows / macOS / Linux)

> For a **server install you do not need this section** — use **Quick start** above, which
> installs Node and Python for you. These steps are for hacking on the code locally.

Two processes — the Next.js UI and the Flask API. **Needs WarehouseDB on port 8000** for products.

**Windows — use the scripts** (not `pnpm dev` alone):

```powershell
cd Warehouse_store
.\status.ps1   # what is running and from which folder
.\dev.ps1      # start API (new window) + UI together
.\stop.ps1     # stop Store UI + API
```

**macOS / Linux — two terminals:**

```bash
cd Warehouse_store
cp .env.local.example .env.local
pnpm install
pnpm dev          # storefront → http://localhost:5001
pnpm dev:api      # API → http://localhost:5004 (second terminal)
```

**Confirm it's the right app:** tab title **Warehouse Store**, teal square logo, bottom bar
**Home · Browse · Bag · Account**, and `http://127.0.0.1:5004/api/health` shows `app: store-api`.

## Environment (`.env.local`)

Generated on install. Key values:

| Variable | Default | Purpose |
|----------|---------|---------|
| `WAREHOUSE_URL` | `http://127.0.0.1:8000` | WarehouseDB host (products + orders) |
| `STORE_API_KEY` | `store-dev-key` | Must match WarehouseDB's `STORE_API_KEY` |
| `STORE_SECRET_KEY` | *(generated)* | Flask session signing |
| `STORE_PORT` / `STORE_HOST` | `5001` / `0.0.0.0` | Storefront port and bind |
| `STORE_API_PORT` | `5004` | Flask API (proxied by Next.js) |
| `STORE_BACKEND_URL` | `http://127.0.0.1:5004` | API origin used by the Next.js proxy |

See `.env.local.example` for the full list.

## Project layout

```
Warehouse_store/
├── app/                  # Next.js App Router (storefront UI)
│   └── api/[[...path]]/   # Proxy route → Flask API
├── components/           # React UI (browse, bag, account/settings)
├── backend/              # Flask API
│   └── app/              # routes, models (customer, picks), services
├── deploy/               # install lib, systemd unit, Cloudflare guide
├── install.sh            # one-shot installer
└── instance/             # SQLite database (gitignored)
```

| Layer | Tech |
|-------|------|
| UI | Next.js 16, React 19 |
| API | Flask + SQLite (`backend/`) → WarehouseDB |

License: [MIT](LICENSE)

Warehouse Store — built for the warehouse you own.
