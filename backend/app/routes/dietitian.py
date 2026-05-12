"""Dietitian panel: appointments, user health overview, meal plans."""
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import role_required, serialize

dietitian_bp = Blueprint("dietitian", __name__)


@dietitian_bp.get("/dietitian/appointments")
@role_required("dietitian", "admin")
def list_appointments():
    db = current_app.db
    uid = get_jwt_identity()
    q = {}
    user = db.users.find_one({"_id": ObjectId(uid)})
    if user["role"] == "dietitian":
        q["dietitian_id"] = uid
    docs = list(db.appointments.find(q).sort("scheduled_at", 1).limit(100))
    return jsonify([serialize(d) for d in docs])


@dietitian_bp.post("/appointments")
@jwt_required()
def book_appointment():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    dietitian_id = data.get("dietitian_id")
    if not dietitian_id:
        # Pick first available
        d = db.users.find_one({"role": "dietitian"})
        if not d:
            return jsonify({"error": "no_dietitians_available"}), 400
        dietitian_id = str(d["_id"])
    appt = {
        "user_id": uid,
        "dietitian_id": dietitian_id,
        "scheduled_at": datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at")
                        else datetime.utcnow(),
        "topic": data.get("topic", "Nutrition consultation"),
        "status": "scheduled",
        "notes": "",
        "created_at": datetime.utcnow(),
    }
    res = db.appointments.insert_one(appt)
    appt["_id"] = res.inserted_id
    return jsonify(serialize(appt)), 201


@dietitian_bp.patch("/dietitian/appointments/<appt_id>")
@role_required("dietitian", "admin")
def update_appointment(appt_id):
    db = current_app.db
    data = request.get_json() or {}
    allowed = {"status", "notes", "scheduled_at"}
    update = {k: v for k, v in data.items() if k in allowed}
    try:
        db.appointments.update_one({"_id": ObjectId(appt_id)}, {"$set": update})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    return jsonify({"updated": True})


@dietitian_bp.get("/dietitian/users/<user_id>/health")
@role_required("dietitian", "admin")
def user_health(user_id):
    """Aggregate health profile of a user for dietitian review."""
    db = current_app.db
    user = db.users.find_one({"_id": ObjectId(user_id)},
                             {"password_hash": 0, "verification_token": 0})
    if not user:
        return jsonify({"error": "not_found"}), 404
    bmi = list(db.bmi_logs.find({"user_id": user_id}).sort("created_at", -1).limit(20))
    weights = list(db.weight_logs.find({"user_id": user_id}).sort("created_at", 1).limit(50))
    return jsonify({
        "user": serialize(user),
        "bmi_logs": [serialize(b) for b in bmi],
        "weight_logs": [serialize(w) for w in weights],
    })


@dietitian_bp.post("/dietitian/meal-plans")
@role_required("dietitian", "admin")
def create_meal_plan():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    plan = {
        "dietitian_id": uid,
        "user_id": data.get("user_id"),
        "title": data.get("title", "Meal Plan"),
        "notes": data.get("notes", ""),
        "days": data.get("days", []),
        "created_at": datetime.utcnow(),
    }
    res = db.meal_plans.insert_one(plan)
    plan["_id"] = res.inserted_id
    return jsonify(serialize(plan)), 201


@dietitian_bp.get("/dietitian/meal-plans")
@jwt_required()
def list_meal_plans():
    db = current_app.db
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)})
    if user["role"] == "customer":
        q = {"user_id": uid}
    elif user["role"] == "dietitian":
        q = {"dietitian_id": uid}
    else:
        q = {}
    docs = list(db.meal_plans.find(q).sort("created_at", -1))
    return jsonify([serialize(d) for d in docs])


@dietitian_bp.get("/dietitian/list")
def public_dietitian_list():
    """Public list of dietitians for booking UI."""
    db = current_app.db
    docs = list(db.users.find({"role": "dietitian"},
                              {"name": 1, "avatar_url": 1, "bio": 1, "specialties": 1}))
    return jsonify([serialize(d) for d in docs])
