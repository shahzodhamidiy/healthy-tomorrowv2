"""User profile: edit, addresses, dietary preferences."""
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize, current_user

users_bp = Blueprint("users", __name__)


@users_bp.patch("/users/me")
@jwt_required()
def update_profile():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    allowed = {"name", "phone", "avatar_url", "dietary"}
    update = {k: v for k, v in data.items() if k in allowed}
    if not update:
        return jsonify({"error": "nothing_to_update"}), 400
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": update})
    user = db.users.find_one({"_id": ObjectId(uid)})
    user.pop("password_hash", None)
    return jsonify(serialize(user))


@users_bp.post("/users/me/addresses")
@jwt_required()
def add_address():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    addr = {
        "id": str(ObjectId()),
        "label": data.get("label", "Home"),
        "line1": data.get("line1", ""),
        "city": data.get("city", ""),
        "postal_code": data.get("postal_code", ""),
        "country": data.get("country", ""),
        "is_default": bool(data.get("is_default", False)),
    }
    if not addr["line1"]:
        return jsonify({"error": "line1_required"}), 400
    if addr["is_default"]:
        db.users.update_one(
            {"_id": ObjectId(uid)},
            {"$set": {"addresses.$[].is_default": False}},
        )
    db.users.update_one({"_id": ObjectId(uid)}, {"$push": {"addresses": addr}})
    return jsonify(addr), 201


@users_bp.delete("/users/me/addresses/<addr_id>")
@jwt_required()
def remove_address(addr_id):
    db = current_app.db
    uid = get_jwt_identity()
    db.users.update_one(
        {"_id": ObjectId(uid)},
        {"$pull": {"addresses": {"id": addr_id}}},
    )
    return jsonify({"removed": True})


@users_bp.post("/users/me/change-password")
@jwt_required()
def change_password():
    from app.utils.auth import check_password, hash_password
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    old = data.get("old_password") or ""
    new = data.get("new_password") or ""
    if len(new) < 6:
        return jsonify({"error": "password_too_short"}), 400
    user = db.users.find_one({"_id": ObjectId(uid)})
    if not check_password(old, user.get("password_hash", "")):
        return jsonify({"error": "wrong_password"}), 400
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"password_hash": hash_password(new)}})
    return jsonify({"changed": True})
