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

if [ -t 1 ]; then
  GREEN=$'\033[1;32m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  GREEN=''; BOLD=''; DIM=''; RESET=''
fi

printf '\n%s' "$GREEN"
cat <<'ART'
__      ___   ___ ___ _  _  ___  _   _ ___ ___   ___ _____ ___  ___ ___
\ \    / /_\ | _ \ __| || |/ _ \| | | / __| __| / __|_   _/ _ \| _ \ __|
 \ \/\/ / _ \|   / _|| __ | (_) | |_| \__ \ _|  \__ \ | || (_) |   / _|
  \_/\_/_/ \_\_|_\___|_||_|\___/ \___/|___/___| |___/ |_| \___/|_|_\___|
ART
printf '%s\n' "$RESET"
echo "  ${DIM}Customer storefront for your warehouse — your shop, your control.${RESET}"
echo "  ${DIM}store app: $STORE_ROOT${RESET}"
echo

ensure_sudo
apt_bootstrap
ensure_node
ensure_pnpm
install_cloudflared

UI_PORT="$(find_free_port 5001)"
API_PORT="$(find_free_port 5004)"
if [ "$UI_PORT" = "$API_PORT" ]; then
  API_PORT="$(find_free_port $((UI_PORT + 1)))"
fi
echo "==> Ports: storefront $UI_PORT, API $API_PORT"

if $USE_DOCKER; then
  install_docker_engine
  ENV_FILE="$STORE_ROOT/.env.local"
  if [ ! -f "$ENV_FILE" ]; then
    SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
    cat >"$ENV_FILE" <<EOF
WAREHOUSE_URL=http://127.0.0.1:8000
STORE_API_KEY=store-dev-key
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
  echo "==> Starting Store with Docker"
  cd "$STORE_ROOT"
  sudo docker compose up -d --build
  echo
  echo "==> Done (Docker). Storefront: http://127.0.0.1:${UI_PORT}"
  echo "    logs: docker compose logs -f store"
  exit 0
fi

VENV="$STORE_ROOT/.venv"
echo "==> Python virtualenv: $VENV"
if [ ! -d "$VENV" ]; then
  "$PYTHON" -m venv "$VENV"
fi
"$VENV/bin/pip" install --upgrade pip >/dev/null
"$VENV/bin/pip" install -r "$STORE_ROOT/backend/requirements.txt"

ENV_FILE="$STORE_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  SECRET="$("$VENV/bin/python" -c 'import secrets; print(secrets.token_hex(32))')"
  cat >"$ENV_FILE" <<EOF
WAREHOUSE_URL=http://127.0.0.1:8000
STORE_API_KEY=store-dev-key
STORE_BACKEND_URL=http://127.0.0.1:$API_PORT
STORE_SECRET_KEY=$SECRET
STORE_PORT=$UI_PORT
STORE_HOST=0.0.0.0
STORE_API_HOST=127.0.0.1
STORE_API_PORT=$API_PORT
EOF
  chmod 600 "$ENV_FILE"
  echo "==> Created $ENV_FILE"
else
  echo "==> Updating ports in $ENV_FILE"
  set_env_kv "$ENV_FILE" STORE_PORT "$UI_PORT"
  set_env_kv "$ENV_FILE" STORE_API_PORT "$API_PORT"
  set_env_kv "$ENV_FILE" STORE_BACKEND_URL "http://127.0.0.1:$API_PORT"
fi

mkdir -p "$STORE_ROOT/instance"
INSTALL_META="$STORE_ROOT/instance/install.env"
cat >"$INSTALL_META" <<EOF
STORE_ROOT=$STORE_ROOT
STORE_VENV=$VENV
EOF
chmod 600 "$INSTALL_META"

"$VENV/bin/python" -c "
import sys
sys.path.insert(0, '$STORE_ROOT/backend')
from app import create_app
create_app()
"

cd "$STORE_ROOT"
pnpm install --frozen-lockfile
pnpm build

chmod +x "$STORE_ROOT/start.sh" "$STORE_ROOT/run.sh"

if $INSTALL_SERVICE; then
  RUN_USER="${SUDO_USER:-$(whoami)}"
  install_systemd warehouse-store "$STORE_ROOT/deploy/warehouse-store.service" "$STORE_ROOT" "$RUN_USER" \
    -e "s|@VENV@|$VENV|g"
  echo "    logs: journalctl -u warehouse-store -f"
else
  echo "Start manually: $STORE_ROOT/run.sh"
fi

echo
echo "  ${GREEN}${BOLD}✓ Warehouse Store ready${RESET}"
echo
echo "    ${BOLD}Storefront${RESET}     http://<server-ip>:${UI_PORT}"
echo "    ${BOLD}API${RESET}            http://127.0.0.1:${API_PORT}/api/health"
echo "    ${BOLD}Service${RESET}        systemctl status warehouse-store"
echo "    ${BOLD}Public domain${RESET}  deploy/CLOUDFLARE-TUNNEL.md"
echo
