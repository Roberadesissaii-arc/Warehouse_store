#!/usr/bin/env bash
#
# Production supervisor: Flask store API + Next.js storefront.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ -f "$ROOT/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.local"
  set +a
fi

if [ -f "$ROOT/instance/install.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/instance/install.env"
  set +a
fi

find_waitress() {
  local candidate
  for candidate in \
    "${STORE_VENV:-}" \
    "$ROOT/.venv" \
    "$ROOT/../.venv"; do
    if [ -n "$candidate" ] && [ -x "$candidate/bin/waitress-serve" ]; then
      echo "$candidate/bin/waitress-serve"
      return
    fi
  done
  if command -v waitress-serve >/dev/null 2>&1; then
    command -v waitress-serve
    return
  fi
  echo "!! waitress-serve not found. Run ./install.sh first." >&2
  exit 1
}

WAITRESS="$(find_waitress)"
STORE_PORT="${STORE_PORT:-5001}"
STORE_HOST="${STORE_HOST:-0.0.0.0}"
STORE_API_HOST="${STORE_API_HOST:-127.0.0.1}"
STORE_API_PORT="${STORE_API_PORT:-5004}"
NEXT_BIN="$ROOT/node_modules/.bin/next"

if [ ! -x "$NEXT_BIN" ]; then
  echo "!! Next.js build missing. Run: pnpm install && pnpm build" >&2
  exit 1
fi

echo "==> Store API  http://${STORE_API_HOST}:${STORE_API_PORT}"
echo "==> Store UI   http://${STORE_HOST}:${STORE_PORT}"

cd "$ROOT/backend"
"$WAITRESS" --host="$STORE_API_HOST" --port="$STORE_API_PORT" wsgi:app &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT"
exec "$NEXT_BIN" start -p "$STORE_PORT" -H "$STORE_HOST"
