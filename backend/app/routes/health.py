"""Health: BMI history, weight logs, calorie tracking."""
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize

health_bp = Blueprint("health", __name__)


def _calc_bmi(height_cm: float, weight_kg: float) -> float:
    h_m = height_cm / 100
    return round(weight_kg / (h_m * h_m), 2)


@health_bp.post("/health/bmi")
@jwt_required()
def log_bmi():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    try:
        h = float(data.get("height_cm"))
        w = float(data.get("weight_kg"))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_input"}), 400
    if h <= 0 or w <= 0 or h > 300 or w > 500:
        return jsonify({"error": "out_of_range"}), 400
    bmi = _calc_bmi(h, w)
    doc = {
        "user_id": uid, "height_cm": h, "weight_kg": w, "bmi": bmi,
        "created_at": datetime.utcnow(),
    }
    db.bmi_logs.insert_one(doc)
    return jsonify(serialize(doc)), 201


@health_bp.get("/health/bmi")
@jwt_required()
def list_bmi():
    db = current_app.db
    uid = get_jwt_identity()
    docs = list(db.bmi_logs.find({"user_id": uid}).sort("created_at", -1).limit(50))
    return jsonify([serialize(d) for d in docs])


@health_bp.post("/health/weight")
@jwt_required()
def log_weight():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    try:
        w = float(data.get("weight_kg"))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_input"}), 400
    if w <= 0 or w > 500:
        return jsonify({"error": "out_of_range"}), 400
    doc = {"user_id": uid, "weight_kg": w, "created_at": datetime.utcnow()}
    db.weight_logs.insert_one(doc)
    return jsonify(serialize(doc)), 201


@health_bp.get("/health/weight")
@jwt_required()
def list_weight():
    db = current_app.db
    uid = get_jwt_identity()
    # Oldest first so charts read naturally
    docs = list(db.weight_logs.find({"user_id": uid}).sort("created_at", 1).limit(100))
    return jsonify([serialize(d) for d in docs])


@health_bp.post("/health/calories")
@jwt_required()
def log_calories():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    try:
        cal = int(data.get("calories"))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_input"}), 400
    note = data.get("note", "")
    doc = {"user_id": uid, "calories": cal, "note": note, "created_at": datetime.utcnow()}
    db.calorie_logs.insert_one(doc)
    return jsonify(serialize(doc)), 201


@health_bp.get("/health/calories/today")
@jwt_required()
def calories_today():
    db = current_app.db
    uid = get_jwt_identity()
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"user_id": uid, "created_at": {"$gte": start}}},
        {"$group": {"_id": None, "total": {"$sum": "$calories"}}},
    ]
    res = list(db.calorie_logs.aggregate(pipeline))
    total = res[0]["total"] if res else 0
    return jsonify({"total": total})
