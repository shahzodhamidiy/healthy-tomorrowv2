"""Shared auth helpers."""
from functools import wraps
from datetime import datetime
import bcrypt
from bson import ObjectId
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def current_user():
    """Return the user document for the JWT identity, or None."""
    uid = get_jwt_identity()
    if not uid:
        return None
    try:
        return current_app.db.users.find_one({"_id": ObjectId(uid)})
    except Exception:
        return None


def role_required(*roles):
    """Decorator: require JWT + one of the given roles."""
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if not user:
                return jsonify({"error": "unauthorized"}), 401
            if user.get("suspended"):
                return jsonify({"error": "account_suspended"}), 403
            if user.get("role") not in roles:
                return jsonify({"error": "forbidden", "required": list(roles)}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper


def serialize(doc: dict) -> dict:
    """Convert Mongo doc to JSON-safe dict (ObjectId/datetime → str)."""
    if not doc:
        return doc
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = serialize(v)
        elif isinstance(v, list):
            out[k] = [serialize(x) if isinstance(x, dict) else
                      (str(x) if isinstance(x, ObjectId) else
                       (x.isoformat() if isinstance(x, datetime) else x))
                      for x in v]
        else:
            out[k] = v
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out
