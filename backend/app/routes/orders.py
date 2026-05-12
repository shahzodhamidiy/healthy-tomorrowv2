"""Orders: create, list mine, track single, status updates."""
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize, current_user, role_required
from app import socketio

orders_bp = Blueprint("orders", __name__)

ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]


@orders_bp.post("/orders")
@jwt_required()
def create_order():
    """Create order from cart payload. Payment is processed separately."""
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    items_in = data.get("items") or []
    address = data.get("address") or {}
    if not items_in:
        return jsonify({"error": "cart_empty"}), 400

    # Re-fetch meals server-side so we trust server prices
    items = []
    total = 0.0
    for it in items_in:
        try:
            meal = db.meals.find_one({"_id": ObjectId(it["meal_id"])})
        except Exception:
            continue
        if not meal:
            continue
        qty = max(1, int(it.get("quantity", 1)))
        line = {
            "meal_id": str(meal["_id"]),
            "name": meal["name"],
            "price": meal["price"],
            "quantity": qty,
            "image_url": meal.get("image_url"),
            "subtotal": round(meal["price"] * qty, 2),
        }
        total += line["subtotal"]
        items.append(line)

    if not items:
        return jsonify({"error": "no_valid_items"}), 400

    order = {
        "user_id": uid,
        "items": items,
        "total": round(total, 2),
        "status": "pending",
        "address": address,
        "payment_status": "unpaid",
        "delivery_staff_id": None,
        "status_history": [{"status": "pending", "at": datetime.utcnow()}],
        "created_at": datetime.utcnow(),
    }
    res = db.orders.insert_one(order)
    order["_id"] = res.inserted_id
    # Notify admins
    socketio.emit("order:new", serialize(order), room="admins")
    return jsonify(serialize(order)), 201


@orders_bp.get("/orders")
@jwt_required()
def list_my_orders():
    db = current_app.db
    uid = get_jwt_identity()
    docs = list(db.orders.find({"user_id": uid}).sort("created_at", -1).limit(50))
    return jsonify([serialize(d) for d in docs])


@orders_bp.get("/orders/<order_id>")
@jwt_required()
def get_order(order_id):
    db = current_app.db
    uid = get_jwt_identity()
    user = current_user()
    try:
        doc = db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    if not doc:
        return jsonify({"error": "not_found"}), 404
    # Customer can only see their own; admin/delivery can see all
    if user["role"] == "customer" and doc.get("user_id") != uid:
        return jsonify({"error": "forbidden"}), 403
    if user["role"] == "delivery" and doc.get("delivery_staff_id") != uid:
        return jsonify({"error": "forbidden"}), 403
    return jsonify(serialize(doc))


@orders_bp.patch("/orders/<order_id>/status")
@role_required("admin", "delivery")
def update_status(order_id):
    db = current_app.db
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ORDER_STATUSES:
        return jsonify({"error": "invalid_status"}), 400
    try:
        oid = ObjectId(order_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    order = db.orders.find_one({"_id": oid})
    if not order:
        return jsonify({"error": "not_found"}), 404
    # Delivery can only move between out_for_delivery and delivered
    user = current_user()
    if user["role"] == "delivery":
        if order.get("delivery_staff_id") != str(user["_id"]):
            return jsonify({"error": "forbidden"}), 403
        if new_status not in ("out_for_delivery", "delivered"):
            return jsonify({"error": "forbidden_status"}), 403

    db.orders.update_one(
        {"_id": oid},
        {"$set": {"status": new_status},
         "$push": {"status_history": {"status": new_status, "at": datetime.utcnow()}}},
    )
    # Notify the customer
    socketio.emit("order:update", {"order_id": order_id, "status": new_status},
                  room=f"user:{order['user_id']}")
    return jsonify({"updated": True, "status": new_status})


@orders_bp.post("/orders/<order_id>/cancel")
@jwt_required()
def cancel_my_order(order_id):
    db = current_app.db
    uid = get_jwt_identity()
    try:
        oid = ObjectId(order_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    order = db.orders.find_one({"_id": oid, "user_id": uid})
    if not order:
        return jsonify({"error": "not_found"}), 404
    if order["status"] not in ("pending", "confirmed"):
        return jsonify({"error": "too_late_to_cancel"}), 400
    db.orders.update_one(
        {"_id": oid},
        {"$set": {"status": "cancelled"},
         "$push": {"status_history": {"status": "cancelled", "at": datetime.utcnow()}}},
    )
    return jsonify({"cancelled": True})


@orders_bp.post("/orders/<order_id>/assign")
@role_required("admin")
def assign_delivery(order_id):
    db = current_app.db
    data = request.get_json() or {}
    staff_id = data.get("delivery_staff_id")
    try:
        oid = ObjectId(order_id)
        staff = db.users.find_one({"_id": ObjectId(staff_id), "role": "delivery"})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    if not staff:
        return jsonify({"error": "delivery_staff_not_found"}), 404
    db.orders.update_one({"_id": oid}, {"$set": {"delivery_staff_id": staff_id}})
    socketio.emit("delivery:assigned", {"order_id": order_id},
                  room=f"user:{staff_id}")
    return jsonify({"assigned": True})


@orders_bp.post("/orders/<order_id>/refund")
@role_required("admin")
def refund(order_id):
    db = current_app.db
    try:
        oid = ObjectId(order_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    db.orders.update_one(
        {"_id": oid},
        {"$set": {"payment_status": "refunded", "status": "cancelled"},
         "$push": {"status_history": {"status": "refunded", "at": datetime.utcnow()}}},
    )
    return jsonify({"refunded": True})
