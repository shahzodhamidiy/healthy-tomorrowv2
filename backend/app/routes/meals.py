"""Meals: browse, filter, search, single, favorites."""
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize, current_user

meals_bp = Blueprint("meals", __name__)


@meals_bp.get("/meals")
def list_meals():
    db = current_app.db
    q = {}
    category = request.args.get("category")
    if category and category != "all":
        q["category"] = category
    vegan = request.args.get("vegan")
    if vegan in ("1", "true"):
        q["vegan"] = True
    search = request.args.get("q")
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    sort = request.args.get("sort", "name")
    sort_dir = 1
    if sort.startswith("-"):
        sort_dir = -1
        sort = sort[1:]
    if sort not in ("name", "price", "calories", "created_at"):
        sort = "name"
    docs = list(db.meals.find(q).sort(sort, sort_dir).limit(200))
    return jsonify([serialize(d) for d in docs])


@meals_bp.get("/meals/categories")
def categories():
    db = current_app.db
    cats = db.meals.distinct("category")
    return jsonify(sorted([c for c in cats if c]))


@meals_bp.get("/meals/<meal_id>")
def get_meal(meal_id):
    db = current_app.db
    try:
        doc = db.meals.find_one({"_id": ObjectId(meal_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    if not doc:
        return jsonify({"error": "not_found"}), 404
    # Attach rating summary
    pipeline = [
        {"$match": {"meal_id": str(doc["_id"])}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    stat = list(db.reviews.aggregate(pipeline))
    doc["rating_avg"] = round(stat[0]["avg"], 2) if stat else 0
    doc["rating_count"] = stat[0]["count"] if stat else 0
    return jsonify(serialize(doc))


@meals_bp.get("/meals/recommended")
@jwt_required()
def recommended():
    """Recommend based on user's latest BMI and dietary prefs."""
    db = current_app.db
    user = current_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    # Latest BMI
    bmi_doc = db.bmi_logs.find_one({"user_id": str(user["_id"])}, sort=[("created_at", -1)])
    bmi = bmi_doc["bmi"] if bmi_doc else None

    q = {}
    if bmi is not None:
        if bmi >= 25:
            q["calories"] = {"$lte": 500}
        elif bmi < 18.5:
            q["calories"] = {"$gte": 500}
    # Honour vegan pref if set on user
    if user.get("dietary", {}).get("vegan"):
        q["vegan"] = True

    docs = list(db.meals.find(q).sort("rating_avg", -1).limit(8))
    return jsonify([serialize(d) for d in docs])


@meals_bp.post("/meals/<meal_id>/favorite")
@jwt_required()
def toggle_favorite(meal_id):
    db = current_app.db
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)}) or {}
    favs = set(user.get("favorites", []))
    if meal_id in favs:
        favs.remove(meal_id)
        action = "removed"
    else:
        favs.add(meal_id)
        action = "added"
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"favorites": list(favs)}})
    return jsonify({"favorited": action == "added", "action": action})


@meals_bp.get("/meals/favorites/list")
@jwt_required()
def list_favorites():
    db = current_app.db
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)}) or {}
    ids = user.get("favorites", [])
    object_ids = []
    for i in ids:
        try:
            object_ids.append(ObjectId(i))
        except Exception:
            pass
    docs = list(db.meals.find({"_id": {"$in": object_ids}}))
    return jsonify([serialize(d) for d in docs])
