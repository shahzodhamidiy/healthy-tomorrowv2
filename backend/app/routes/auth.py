"""Authentication: register, login, current user, password reset."""
import secrets
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.utils.auth import hash_password, check_password, current_user, serialize

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    role = data.get("role", "customer")
    if role not in ("customer", "dietitian", "delivery"):
        role = "customer"  # admin only created manually
    if not email or not password or not name:
        return jsonify({"error": "email, password and name are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    db = current_app.db
    if db.users.find_one({"email": email}):
        return jsonify({"error": "email already registered"}), 409

    user = {
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "role": role,
        "avatar_url": None,
        "phone": None,
        "addresses": [],
        "email_verified": False,
        "verification_token": secrets.token_urlsafe(24),
        "suspended": False,
        "created_at": datetime.utcnow(),
    }
    res = db.users.insert_one(user)
    token = create_access_token(identity=str(res.inserted_id))
    user["_id"] = res.inserted_id
    user.pop("password_hash", None)
    user.pop("verification_token", None)
    return jsonify({"token": token, "user": serialize(user)}), 201


@auth_bp.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    db = current_app.db
    user = db.users.find_one({"email": email})
    if not user or not check_password(password, user.get("password_hash", "")):
        return jsonify({"error": "invalid credentials"}), 401
    if user.get("suspended"):
        return jsonify({"error": "account_suspended"}), 403
    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow()}})
    token = create_access_token(identity=str(user["_id"]))
    user.pop("password_hash", None)
    user.pop("verification_token", None)
    return jsonify({"token": token, "user": serialize(user)})


@auth_bp.get("/auth/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    user.pop("password_hash", None)
    user.pop("verification_token", None)
    user.pop("reset_token", None)
    return jsonify(serialize(user))


@auth_bp.post("/auth/forgot-password")
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    db = current_app.db
    user = db.users.find_one({"email": email})
    # Don't leak whether the email exists
    if user:
        token = secrets.token_urlsafe(32)
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "reset_token": token,
                "reset_token_expires": datetime.utcnow() + timedelta(hours=1),
            }},
        )
        # In production: email the token. For demo, return it.
        return jsonify({"sent": True, "reset_token_demo": token})
    return jsonify({"sent": True})


@auth_bp.post("/auth/reset-password")
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password") or ""
    if not token or len(new_password) < 6:
        return jsonify({"error": "invalid request"}), 400
    db = current_app.db
    user = db.users.find_one({"reset_token": token})
    if not user:
        return jsonify({"error": "invalid_token"}), 400
    if user.get("reset_token_expires") and user["reset_token_expires"] < datetime.utcnow():
        return jsonify({"error": "token_expired"}), 400
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(new_password)},
         "$unset": {"reset_token": "", "reset_token_expires": ""}},
    )
    return jsonify({"reset": True})


@auth_bp.post("/auth/verify-email")
def verify_email():
    data = request.get_json() or {}
    token = data.get("token")
    db = current_app.db
    user = db.users.find_one({"verification_token": token})
    if not user:
        return jsonify({"error": "invalid_token"}), 400
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}},
    )
    return jsonify({"verified": True})
