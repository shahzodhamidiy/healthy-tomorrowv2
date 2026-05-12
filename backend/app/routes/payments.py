"""Payments: Stripe checkout. Falls back to a mock mode if STRIPE_SECRET unset."""
import os
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize

try:
    import stripe
except ImportError:
    stripe = None

payments_bp = Blueprint("payments", __name__)

STRIPE_SECRET = os.getenv("STRIPE_SECRET")
if stripe and STRIPE_SECRET:
    stripe.api_key = STRIPE_SECRET


def _mock_mode() -> bool:
    return not (stripe and STRIPE_SECRET)


@payments_bp.post("/payments/checkout")
@jwt_required()
def create_checkout():
    """Create Stripe checkout session for an order; mock mode auto-marks paid."""
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    order_id = data.get("order_id")
    success_url = data.get("success_url", "http://localhost:5173/checkout/success")
    cancel_url = data.get("cancel_url", "http://localhost:5173/cart")

    try:
        order = db.orders.find_one({"_id": ObjectId(order_id), "user_id": uid})
    except Exception:
        return jsonify({"error": "invalid_order"}), 400
    if not order:
        return jsonify({"error": "order_not_found"}), 404
    if order.get("payment_status") == "paid":
        return jsonify({"error": "already_paid"}), 400

    if _mock_mode():
        # Auto-confirm for development
        db.orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"payment_status": "paid", "status": "confirmed",
                      "paid_at": datetime.utcnow()}},
        )
        db.payments.insert_one({
            "order_id": str(order["_id"]),
            "user_id": uid,
            "amount": order["total"],
            "provider": "mock",
            "status": "succeeded",
            "created_at": datetime.utcnow(),
        })
        return jsonify({"mock": True, "url": f"{success_url}?order_id={order_id}&mock=1"})

    line_items = [{
        "price_data": {
            "currency": "usd",
            "product_data": {"name": it["name"]},
            "unit_amount": int(round(it["price"] * 100)),
        },
        "quantity": it["quantity"],
    } for it in order["items"]]

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=f"{success_url}?order_id={order_id}&session={{CHECKOUT_SESSION_ID}}",
        cancel_url=cancel_url,
        metadata={"order_id": str(order["_id"]), "user_id": uid},
    )
    db.orders.update_one(
        {"_id": order["_id"]},
        {"$set": {"stripe_session_id": session.id}},
    )
    return jsonify({"url": session.url, "session_id": session.id})


@payments_bp.post("/payments/webhook")
def webhook():
    """Stripe webhook: mark order paid on checkout.session.completed."""
    if _mock_mode():
        return jsonify({"mock": True}), 200
    db = current_app.db
    payload = request.data
    sig = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        if order_id:
            db.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"payment_status": "paid", "status": "confirmed",
                          "paid_at": datetime.utcnow()}},
            )
            db.payments.insert_one({
                "order_id": order_id,
                "user_id": session.get("metadata", {}).get("user_id"),
                "amount": session["amount_total"] / 100,
                "provider": "stripe",
                "status": "succeeded",
                "stripe_session_id": session["id"],
                "created_at": datetime.utcnow(),
            })
    return jsonify({"received": True})


@payments_bp.get("/payments/history")
@jwt_required()
def history():
    db = current_app.db
    uid = get_jwt_identity()
    docs = list(db.payments.find({"user_id": uid}).sort("created_at", -1).limit(50))
    return jsonify([serialize(d) for d in docs])
