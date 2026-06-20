import os

from app import create_app
from config import Config

app = create_app()

if __name__ == "__main__":
    print(f"Store API running at http://{Config.HOST}:{Config.PORT}")
    print(f"Warehouse -> {Config.WAREHOUSE_URL}")
    # The interactive debugger is remote code execution if exposed. Require an
    # explicit opt-in to enable it; production should run via waitress (start.sh).
    debug = os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes", "on")
    app.run(host=Config.HOST, port=Config.PORT, debug=debug)
