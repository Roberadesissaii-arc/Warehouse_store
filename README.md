# Warehouse Store

Customer-facing Next.js storefront with a Flask API. Connects to WarehouseDB for inventory.

## Server install (Ubuntu / Debian / Raspberry Pi)

**Prerequisites:** a Linux server (Ubuntu/Debian or Raspberry Pi OS) with `git` and `sudo`. The installer pulls in everything else (Node 22, pnpm, Python). **WarehouseDB** must be reachable — it provides the products.

Run this **once** after cloning — it installs everything and keeps the app running on every reboot:

```bash
git clone <your-repo-url> warehouse            # or copy the project onto the server
cd warehouse/Warehouse_store                    # the folder that holds install.sh
chmod +x install.sh run.sh start.sh
./install.sh
```

`./install.sh` will:

1. Ask for **sudo** (apt update/upgrade, Node 22, pnpm, cloudflared)
2. Create a Python virtualenv + install the API, and generate `.env.local` with a random secret
3. Pick free ports (storefront **5001**, API **5004**) and build the production app
4. Register a **systemd service** (`systemctl enable --now`) — so the storefront + API **start immediately and again automatically on every boot**, and restart on crash

Open **http://\<server-ip\>:5001**.

> You run `install.sh` **once**. After that the app is always on — **you never start it manually**.

```bash
# After pulling code updates — rebuild + restart:
git pull && ./install.sh

# Manage the always-on service:
systemctl status warehouse-store          # is it running?
sudo systemctl restart warehouse-store    # restart now
sudo systemctl stop warehouse-store       # stop until next boot
sudo systemctl disable warehouse-store    # stop auto-starting on boot
journalctl -u warehouse-store -f          # live logs
```

Install options:

```bash
./install.sh --no-service   # install only — start by hand with ./run.sh
./install.sh --docker       # Docker instead of native
```

**First sign-in:** no preset login. Create the one store owner account (name, email, password) on the sign-in page when the database is empty.

Set `WAREHOUSE_URL` in `.env.local` to your WarehouseDB host (or Cloudflare tunnel URL). Match `STORE_API_KEY` with WarehouseDB. Optional public domain: `deploy/CLOUDFLARE-TUNNEL.md`

## Run locally (development)

**Windows — always use these scripts** (not `pnpm dev` alone):

```powershell
cd Warehouse_store
.\status.ps1   # see what is running and which folder
.\stop.ps1     # stop Store UI + API
.\dev.ps1      # start API (new window) + UI together
```

**How to know it is the correct app**

- Browser tab title: **Warehouse Store**
- Header logo: **Warehouse Store** (teal square mark)
- Bottom bar: **Home · Browse · Bag · Account**
- URL: `http://127.0.0.1:5001` (or your PC IP `:5001`)
- API check: `http://127.0.0.1:5004/api/health` should show `app: store-api` and database under `Warehouse_store\instance\`

**Needs WarehouseDB** on port **8000** for products:

```powershell
cd ..\WarehouseDB
python run.py
```

```bash
cd Warehouse_store
cp .env.local.example .env.local
pnpm install
pnpm dev          # UI :5001
pnpm dev:api      # API :5004 (second terminal)
```

## Stack

| Layer | Tech |
|-------|------|
| UI | Next.js 16, React 19 |
| API | Flask (`backend/`) → WarehouseDB |

License: MIT — see `LICENSE`.
