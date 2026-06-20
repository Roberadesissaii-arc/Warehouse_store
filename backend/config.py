import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(*_args, **_kwargs):
        return False

BACKEND_ROOT = Path(__file__).resolve().parent
STORE_ROOT = BACKEND_ROOT.parent
# Next.js uses .env.local; load both (local overrides) so one file works for dev + API.
load_dotenv(STORE_ROOT / ".env")
load_dotenv(STORE_ROOT / ".env.local", override=True)


# Insecure defaults that must never reach production — see create_app().
DEFAULT_SECRET_KEY = "store-dev-secret"
DEFAULT_STORE_API_KEY = "store-dev-key"


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


class Config:
    APP_VERSION = "1.0.0"
    SECRET_KEY = os.environ.get("STORE_SECRET_KEY", DEFAULT_SECRET_KEY)
    WAREHOUSE_URL = os.environ.get("WAREHOUSE_URL", "http://127.0.0.1:8000").rstrip("/")
    STORE_API_KEY = os.environ.get("STORE_API_KEY", DEFAULT_STORE_API_KEY)
    # Send the session cookie only over HTTPS. Leave off for plain-HTTP LAN
    # deployments; set STORE_COOKIE_SECURE=true when serving behind HTTPS.
    SESSION_COOKIE_SECURE = _env_flag("STORE_COOKIE_SECURE", False)
    STORE_INSTANCE_PATH = os.environ.get(
        "STORE_INSTANCE_PATH",
        str(STORE_ROOT / "instance"),
    )
    DATABASE = os.environ.get(
        "STORE_DATABASE",
        str(Path(STORE_INSTANCE_PATH) / "store.db"),
    )
    DEBUG = os.environ.get("FLASK_ENV", "development").lower() != "production"
    HOST = os.environ.get("STORE_API_HOST", "127.0.0.1")
    PORT = int(os.environ.get("STORE_API_PORT", "5004"))
