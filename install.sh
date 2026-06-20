#!/usr/bin/env bash
#
# Warehouse Store — Ubuntu / Debian installer
#
#   ./install.sh              # deps + build + systemd (UI + API together)
#   ./install.sh --no-service # install only, start with ./run.sh
#   ./install.sh --docker     # Docker instead of native
#
set -euo pipefail

STORE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$STORE_ROOT/deploy/lib.sh"

PYTHON="${PYTHON:-python3}"
INSTALL_SERVICE=true
USE_DOCKER=false

usage() {
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --service) INSTALL_SERVICE=true ;;
    --no-service) INSTALL_SERVICE=false ;;
    --docker) USE_DOCKER=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

trap stop_sudo_keepalive EXIT

TOTAL_STEPS=8
if [ -t 1 ]; then clear 2>/dev/null || true; fi
printf '\n  %sW A R E H O U S E%s\n%s' "$DIM" "$RESET" "$GREEN"
cat <<'ART'
  ███████╗████████╗ ██████╗ ██████╗ ███████╗
  ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
  ███████╗   ██║   ██║   ██║██████╔╝█████╗
  ╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝
  ███████║   ██║   ╚██████╔╝██║  ██║███████╗
  ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
ART
printf '%s\n' "$RESET"
echo "  ${BOLD}Warehouse Store${RESET}  ${DIM}— customer storefront${RESET}                    ${DIM}self-hosted${RESET}"
echo "  ${DIM}──────────────────────────────────────────────────────────${RESET}"
echo

step "System packages & toolchain"
ensure_sudo
apt_bootstrap
ensure_node
ensure_pnpm
install_cloudflared

step "Network ports"
UI_PORT="$(find_free_port 5001)"
API_PORT="$(find_free_port 5004)"
if [ "$UI_PORT" = "$API_PORT" ]; then
  API_PORT="$(find_free_port $((UI_PORT + 1)))"
fi
ok "Ports — storefront $UI_PORT, API $API_PORT"

# STORE_API_KEY must match WarehouseDB's. Reuse the hub's key if WarehouseDB is on
# this machine; otherwise generate a strong one (set the same value on WarehouseDB).
WH_ENV="$(cd "$STORE_ROOT/.." && pwd)/WarehouseDB/instance/warehousedb.env"
if [ -f "$WH_ENV" ] && grep -q '^STORE_API_KEY=' "$WH_ENV"; then
  STORE_KEY="$(grep '^STORE_API_KEY=' "$WH_ENV" | cut -d= -f2-)"
  STORE_KEY_SRC="matched WarehouseDB on this machine"
else
  STORE_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(24))')"
  STORE_KEY_SRC="generated — set STORE_API_KEY=$STORE_KEY in WarehouseDB to match"
fi

if $USE_DOCKER; then
  install_docker_engine
  ENV_FILE="$STORE_ROOT/.env.local"
  if [ ! -f "$ENV_FILE" ]; then
    SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
    cat >"$ENV_FILE" <<EOF
WAREHOUSE_URL=http://127.0.0.1:8000
STORE_API_KEY=$STORE_KEY
STORE_BACKEND_URL=http://127.0.0.1:$API_PORT
STORE_SECRET_KEY=$SECRET
STORE_PORT=$UI_PORT
STORE_HOST=0.0.0.0
STORE_API_HOST=0.0.0.0
STORE_API_PORT=$API_PORT
EOF
    chmod 600 "$ENV_FILE"
  else
    set_env_kv "$ENV_FILE" STORE_PORT "$UI_PORT"
    set_env_kv "$ENV_FILE" STORE_API_PORT "$API_PORT"
    set_env_kv "$ENV_FILE" STORE_BACKEND_URL "http://127.0.0.1:$API_PORT"
  fi
  step "Docker"
  note "starting Store with Docker…"
  cd "$STORE_ROOT"
  sudo docker compose up -d --build
  echo
  ok "Store running (Docker) — http://127.0.0.1:${UI_PORT}"
  open_firewall_port "$UI_PORT" "Warehouse Store"
  note "logs: docker compose logs -f store"
  exit 0
fi

step "Python environment"
VENV="$STORE_ROOT/.venv"
note "virtualenv: $VENV"
if [ ! -d "$VENV" ]; then
  "$PYTHON" -m venv "$VENV"
fi
"$VENV/bin/pip" install --upgrade pip >/dev/null 2>&1 || true
spin_ok "Installing API dependencies…" "API dependencies installed" \
  "$VENV/bin/pip" install -r "$STORE_ROOT/backend/requirements.txt"

step "Configuration"
ENV_FILE="$STORE_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  SECRET="$("$VENV/bin/python" -c 'import secrets; print(secrets.token_hex(32))')"
  cat >"$ENV_FILE" <<EOF
WAREHOUSE_URL=http://127.0.0.1:8000
STORE_API_KEY=$STORE_KEY
STORE_BACKEND_URL=http://127.0.0.1:$API_PORT
STORE_SECRET_KEY=$SECRET
STORE_PORT=$UI_PORT
STORE_HOST=0.0.0.0
STORE_API_HOST=127.0.0.1
STORE_API_PORT=$API_PORT
EOF
  chmod 600 "$ENV_FILE"
  ok "Created $ENV_FILE — STORE_API_KEY $STORE_KEY_SRC"
else
  note "updating ports in $ENV_FILE"
  set_env_kv "$ENV_FILE" STORE_PORT "$UI_PORT"
  set_env_kv "$ENV_FILE" STORE_API_PORT "$API_PORT"
  set_env_kv "$ENV_FILE" STORE_BACKEND_URL "http://127.0.0.1:$API_PORT"
  if grep -q '^STORE_API_KEY=store-dev-key$' "$ENV_FILE"; then
    set_env_kv "$ENV_FILE" STORE_API_KEY "$STORE_KEY"
    warn "Updated STORE_API_KEY ($STORE_KEY_SRC)"
  fi
fi

mkdir -p "$STORE_ROOT/instance"
INSTALL_META="$STORE_ROOT/instance/install.env"
cat >"$INSTALL_META" <<EOF
STORE_ROOT=$STORE_ROOT
STORE_VENV=$VENV
EOF
chmod 600 "$INSTALL_META"

step "Database"
note "initialising SQLite database…"
"$VENV/bin/python" -c "
import sys
sys.path.insert(0, '$STORE_ROOT/backend')
from app import create_app
create_app()
"
ok "Database ready"

step "Build"
cd "$STORE_ROOT"
spin_ok "Installing Node dependencies…" "Node dependencies installed" \
  pnpm install --frozen-lockfile
spin_ok "Building production app…" "Production build ready" \
  pnpm build

chmod +x "$STORE_ROOT/start.sh" "$STORE_ROOT/run.sh"

step "Service (auto-start on boot)"
if $INSTALL_SERVICE; then
  RUN_USER="${SUDO_USER:-$(whoami)}"
  install_systemd warehouse-store "$STORE_ROOT/deploy/warehouse-store.service" "$STORE_ROOT" "$RUN_USER" \
    -e "s|@VENV@|$VENV|g"
  note "logs: journalctl -u warehouse-store -f"
else
  note "Start manually: $STORE_ROOT/run.sh"
fi

step "Firewall"
open_firewall_port "$UI_PORT" "Warehouse Store"

echo
echo "  ${GREEN}${BOLD}✓ Warehouse Store ready${RESET}"
echo
echo "    ${BOLD}Storefront${RESET}     http://<server-ip>:${UI_PORT}"
echo "    ${BOLD}API${RESET}            http://127.0.0.1:${API_PORT}/api/health"
echo "    ${BOLD}Service${RESET}        systemctl status warehouse-store"
echo "    ${BOLD}Public domain${RESET}  deploy/CLOUDFLARE-TUNNEL.md"
echo
