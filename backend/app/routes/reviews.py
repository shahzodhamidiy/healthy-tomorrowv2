"""Reviews & ratings for meals."""
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.get("/meals/<meal_id>/reviews")
def list_reviews(meal_id):
    db = current_app.db
    docs = list(db.reviews.find({"meal_id": meal_id}).sort("created_at", -1).limit(50))
    # Attach user names
    user_ids = list({d["user_id"] for d in docs})
    object_user_ids = []
    for uid in user_ids:
        try:
            object_user_ids.append(ObjectId(uid))
        except Exception:
            pass
    users = {str(u["_id"]): u for u in db.users.find(
        {"_id": {"$in": object_user_ids}}, {"name": 1, "avatar_url": 1})}
    out = []
    for d in docs:
        s = serialize(d)
        u = users.get(d.get("user_id"))
        if u:
            s["user_name"] = u.get("name")
            s["user_avatar"] = u.get("avatar_url")
        out.append(s)
    return jsonify(out)


@reviews_bp.post("/meals/<meal_id>/reviews")
@jwt_required()
def add_review(meal_id):
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    try:
        rating = int(data.get("rating", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_rating"}), 400
    if rating < 1 or rating > 5:
        return jsonify({"error": "rating_out_of_range"}), 400
    text = (data.get("text") or "").strip()[:1000]

    # Upsert: one review per user per meal
    existing = db.reviews.find_one({"meal_id": meal_id, "user_id": uid})
    if existing:
        db.reviews.update_one(
            {"_id": existing["_id"]},
            {"$set": {"rating": rating, "text": text, "updated_at": datetime.utcnow()}},
        )
        action = "updated"
    else:
        db.reviews.insert_one({
            "meal_id": meal_id, "user_id": uid,
            "rating": rating, "text": text,
            "created_at": datetime.utcnow(),
        })
        action = "created"
    # Refresh meal rating cache
    pipeline = [
        {"$match": {"meal_id": meal_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    stat = list(db.reviews.aggregate(pipeline))
    if stat:
        try:
            db.meals.update_one(
                {"_id": ObjectId(meal_id)},
                {"$set": {"rating_avg": round(stat[0]["avg"], 2),
                          "rating_count": stat[0]["count"]}},
            )
        except Exception:
            pass
    return jsonify({"action": action})


@reviews_bp.delete("/reviews/<review_id>")
@jwt_required()
def delete_review(review_id):
    db = current_app.db
    uid = get_jwt_identity()
    try:
        oid = ObjectId(review_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    db.reviews.delete_one({"_id": oid, "user_id": uid})
    return jsonify({"deleted": True})
