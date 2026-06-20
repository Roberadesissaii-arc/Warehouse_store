#!/usr/bin/env bash
#
# Start Warehouse Store in the foreground (production build).
set -euo pipefail

STORE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$STORE_ROOT"

if [ ! -d "$STORE_ROOT/.next" ]; then
  echo "!! Production build missing. Run: ./install.sh" >&2
  exit 1
fi

if [ -f "$STORE_ROOT/instance/install.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$STORE_ROOT/instance/install.env"
  set +a
fi

export STORE_VENV="${STORE_VENV:-}"
exec "$STORE_ROOT/start.sh"
