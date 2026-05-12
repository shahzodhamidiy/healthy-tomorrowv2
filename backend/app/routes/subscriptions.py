"""Subscriptions: plans, subscribe, my subscription."""
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import role_required, serialize

subscriptions_bp = Blueprint("subscriptions", __name__)

DEFAULT_PLANS = [
    {"plan_id": "starter", "name": "Starter", "price": 49.00,
     "interval": "week", "meals_per_week": 5,
     "features": ["5 chef-crafted meals", "Basic nutrition tracking", "Email support"]},
    {"plan_id": "balanced", "name": "Balanced", "price": 89.00,
     "interval": "week", "meals_per_week": 10,
     "features": ["10 meals weekly", "BMI & weight tracking", "Dietitian chat",
                  "Custom meal plans"]},
    {"plan_id": "premium", "name": "Premium", "price": 149.00,
     "interval": "week", "meals_per_week": 14,
     "features": ["14 meals weekly", "1-on-1 dietitian sessions",
                  "Personalized meal plans", "Priority delivery", "24/7 chat"]},
]


@subscriptions_bp.get("/subscriptions/plans")
def list_plans():
    return jsonify(DEFAULT_PLANS)


@subscriptions_bp.post("/subscriptions/subscribe")
@jwt_required()
def subscribe():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    plan_id = data.get("plan_id")
    plan = next((p for p in DEFAULT_PLANS if p["plan_id"] == plan_id), None)
    if not plan:
        return jsonify({"error": "invalid_plan"}), 400

    # Cancel any active subscription
    db.subscriptions.update_many(
        {"user_id": uid, "status": "active"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}},
    )
    sub = {
        "user_id": uid,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "price": plan["price"],
        "status": "active",
        "started_at": datetime.utcnow(),
        "next_billing": datetime.utcnow() + timedelta(days=7),
    }
    res = db.subscriptions.insert_one(sub)
    sub["_id"] = res.inserted_id
    return jsonify(serialize(sub)), 201


@subscriptions_bp.get("/subscriptions/mine")
@jwt_required()
def my_subscription():
    db = current_app.db
    uid = get_jwt_identity()
    sub = db.subscriptions.find_one({"user_id": uid, "status": "active"})
    if not sub:
        return jsonify({"active": False})
    return jsonify({"active": True, "subscription": serialize(sub)})


@subscriptions_bp.post("/subscriptions/cancel")
@jwt_required()
def cancel():
    db = current_app.db
    uid = get_jwt_identity()
    db.subscriptions.update_many(
        {"user_id": uid, "status": "active"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}},
    )
    return jsonify({"cancelled": True})
