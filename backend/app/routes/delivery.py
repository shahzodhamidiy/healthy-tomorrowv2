"""Delivery: assigned orders, status updates, earnings, history."""
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import role_required, serialize

delivery_bp = Blueprint("delivery", __name__)


@delivery_bp.get("/delivery/orders")
@role_required("delivery")
def my_orders():
    db = current_app.db
    uid = get_jwt_identity()
    q = {"delivery_staff_id": uid}
    status = request.args.get("status")
    if status:
        q["status"] = status
    docs = list(db.orders.find(q).sort("created_at", -1).limit(100))
    return jsonify([serialize(d) for d in docs])


@delivery_bp.get("/delivery/active")
@role_required("delivery")
def active_orders():
    db = current_app.db
    uid = get_jwt_identity()
    docs = list(db.orders.find({
        "delivery_staff_id": uid,
        "status": {"$in": ["confirmed", "preparing", "out_for_delivery"]},
    }).sort("created_at", 1))
    return jsonify([serialize(d) for d in docs])


@delivery_bp.get("/delivery/earnings")
@role_required("delivery")
def earnings():
    """Sum of delivered orders, with per-day breakdown for the last 30 days."""
    db = current_app.db
    uid = get_jwt_identity()
    last_30 = datetime.utcnow() - timedelta(days=30)
    fee_per_delivery = 3.50

    total_delivered = db.orders.count_documents({
        "delivery_staff_id": uid, "status": "delivered",
    })
    delivered_30 = db.orders.count_documents({
        "delivery_staff_id": uid, "status": "delivered",
        "created_at": {"$gte": last_30},
    })

    daily_pipeline = [
        {"$match": {"delivery_staff_id": uid, "status": "delivered",
                    "created_at": {"$gte": last_30}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "deliveries": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    daily = [{"date": d["_id"], "deliveries": d["deliveries"],
              "earnings": round(d["deliveries"] * fee_per_delivery, 2)}
             for d in db.orders.aggregate(daily_pipeline)]

    return jsonify({
        "total_deliveries": total_delivered,
        "deliveries_30d": delivered_30,
        "total_earnings": round(total_delivered * fee_per_delivery, 2),
        "earnings_30d": round(delivered_30 * fee_per_delivery, 2),
        "fee_per_delivery": fee_per_delivery,
        "daily": daily,
    })


@delivery_bp.post("/delivery/location")
@role_required("delivery")
def update_location():
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    try:
        lat = float(data.get("lat"))
        lng = float(data.get("lng"))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_coords"}), 400
    db.users.update_one(
        {"_id": ObjectId(uid)},
        {"$set": {"location": {"lat": lat, "lng": lng, "at": datetime.utcnow()}}},
    )
    return jsonify({"updated": True})
