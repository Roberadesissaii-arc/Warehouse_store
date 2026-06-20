import os

from flask import Flask

from config import Config, DEFAULT_SECRET_KEY, DEFAULT_STORE_API_KEY
from app.clients.warehouse import StoreWarehouseClient
from app.database import init_app as init_db
from app.routes.api import api_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    if os.environ.get("FLASK_ENV", "development").lower() == "production":
        insecure = []
        if app.config.get("SECRET_KEY") == DEFAULT_SECRET_KEY:
            insecure.append("STORE_SECRET_KEY")
        if app.config.get("STORE_API_KEY") == DEFAULT_STORE_API_KEY:
            insecure.append("STORE_API_KEY")
        if insecure:
            raise RuntimeError(
                "Refusing to start in production with default "
                + ", ".join(insecure)
                + ". Set strong values in Warehouse_store/.env.local."
            )

    # Direct assignment, not setdefault: Flask pre-populates this key with None,
    # so setdefault would never apply "Lax".
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config.setdefault("SESSION_COOKIE_HTTPONLY", True)
    os.makedirs(app.config["STORE_INSTANCE_PATH"], exist_ok=True)
    init_db(app)
    app.extensions["warehouse_client"] = StoreWarehouseClient(
        app.config["WAREHOUSE_URL"],
        app.config["STORE_API_KEY"],
    )
    app.register_blueprint(api_bp)
    return app
