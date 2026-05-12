"""
Healthy Tomorrow — Flask app factory.
Wires MongoDB, JWT auth, CORS, Socket.IO and all REST blueprints.
"""
import os
import re
from datetime import timedelta
from urllib.parse import quote_plus
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet")
jwt = JWTManager()
mongo_client = None
db = None


def create_app():
    global mongo_client, db
    app = Flask(__name__, static_folder="../uploads", static_url_path="/uploads")

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


    mongo_user = os.getenv("MONGO_USER", "")
    mongo_pass = os.getenv("MONGO_PASS", "")
    mongo_host = os.getenv("MONGO_HOST", "")
    if mongo_user and mongo_pass and mongo_host:
        mongo_uri = f"mongodb+srv://{quote_plus(mongo_user)}:{quote_plus(mongo_pass)}@{mongo_host}/?retryWrites=true&w=majority"
    else:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    print(f"DEBUG mongo host: '{mongo_host}'", flush=True)
    db_name = os.getenv("MONGO_DB", "healthy_tomorrow")
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = mongo_client[db_name]
    app.db = db

    try:
        db.users.create_index("email", unique=True)
        db.meals.create_index("name")
        db.orders.create_index([("user_id", 1), ("created_at", -1)])
        db.reviews.create_index([("meal_id", 1), ("user_id", 1)], unique=True)
    except Exception as e:
        print(f"Index creation warning: {e}")

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    jwt.init_app(app)
    socketio.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.meals import meals_bp
    from app.routes.orders import orders_bp
    from app.routes.health import health_bp
    from app.routes.users import users_bp
    from app.routes.admin import admin_bp
    from app.routes.dietitian import dietitian_bp
    from app.routes.delivery import delivery_bp
    from app.routes.payments import payments_bp
    from app.routes.subscriptions import subscriptions_bp
    from app.routes.reviews import reviews_bp
    from app.routes.chat import chat_bp
    from app.routes.uploads import uploads_bp
    from app.routes.reports import reports_bp

    for bp in [
        auth_bp, meals_bp, orders_bp, health_bp, users_bp, admin_bp,
        dietitian_bp, delivery_bp, payments_bp, subscriptions_bp,
        reviews_bp, chat_bp, uploads_bp, reports_bp,
    ]:
        app.register_blueprint(bp, url_prefix="/api")

    from app import sockets  # noqa: F401

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "healthy-tomorrow-api"})

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "not_found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "server_error", "message": str(e)}), 500

    return app