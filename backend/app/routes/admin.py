"""Admin: analytics dashboard, user mgmt, meal mgmt, activity logs."""
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from app.utils.auth import role_required, serialize

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/admin/stats")
@role_required("admin")
def stats():
    db = current_app.db
    now = datetime.utcnow()
    last_30 = now - timedelta(days=30)

    total_users = db.users.count_documents({})
    customers = db.users.count_documents({"role": "customer"})
    new_users_30 = db.users.count_documents({"created_at": {"$gte": last_30}})

    total_orders = db.orders.count_documents({})
    orders_30 = db.orders.count_documents({"created_at": {"$gte": last_30}})

    # Revenue (paid orders only)
    rev_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    rev = list(db.orders.aggregate(rev_pipeline))
    total_revenue = round(rev[0]["total"], 2) if rev else 0

    # Revenue per day, last 30 days
    daily_pipeline = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": last_30}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    daily = [{"date": d["_id"], "revenue": round(d["revenue"], 2), "orders": d["orders"]}
             for d in db.orders.aggregate(daily_pipeline)]

    # Top meals
    top_pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.meal_id",
            "name": {"$first": "$items.name"},
            "qty": {"$sum": "$items.quantity"},
            "revenue": {"$sum": "$items.subtotal"},
        }},
        {"$sort": {"qty": -1}},
        {"$limit": 5},
    ]
    top_meals = [{"meal_id": d["_id"], "name": d["name"], "qty": d["qty"],
                  "revenue": round(d["revenue"], 2)}
                 for d in db.orders.aggregate(top_pipeline)]

    # Orders by status
    status_pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_counts = {d["_id"]: d["count"] for d in db.orders.aggregate(status_pipeline)}

    return jsonify({
        "users": {"total": total_users, "customers": customers, "new_30d": new_users_30},
        "orders": {"total": total_orders, "last_30d": orders_30,
                   "by_status": status_counts},
        "revenue": {"total": total_revenue, "daily": daily},
        "top_meals": top_meals,
    })


# ============ USERS ============

@admin_bp.get("/admin/users")
@role_required("admin")
def list_users():
    db = current_app.db
    q = {}
    role = request.args.get("role")
    if role:
        q["role"] = role
    search = request.args.get("q")
    if search:
        q["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    docs = list(db.users.find(q, {"password_hash": 0, "verification_token": 0,
                                  "reset_token": 0}).sort("created_at", -1).limit(200))
    return jsonify([serialize(d) for d in docs])


@admin_bp.patch("/admin/users/<user_id>")
@role_required("admin")
def update_user(user_id):
    db = current_app.db
    data = request.get_json() or {}
    allowed = {"role", "suspended", "name"}
    update = {k: v for k, v in data.items() if k in allowed}
    if "role" in update and update["role"] not in ("customer", "admin", "dietitian", "delivery"):
        return jsonify({"error": "invalid_role"}), 400
    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    db.activity_log.insert_one({
        "type": "admin_user_update", "target": user_id, "fields": list(update.keys()),
        "at": datetime.utcnow(),
    })
    return jsonify({"updated": True})


@admin_bp.delete("/admin/users/<user_id>")
@role_required("admin")
def delete_user(user_id):
    db = current_app.db
    try:
        db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    db.activity_log.insert_one({
        "type": "admin_user_delete", "target": user_id, "at": datetime.utcnow(),
    })
    return jsonify({"deleted": True})


# ============ MEALS ============

@admin_bp.post("/admin/meals")
@role_required("admin")
def create_meal():
    db = current_app.db
    data = request.get_json() or {}
    required = ["name", "price", "calories", "category"]
    for r in required:
        if r not in data:
            return jsonify({"error": f"{r}_required"}), 400
    meal = {
        "name": data["name"],
        "description": data.get("description", ""),
        "price": float(data["price"]),
        "calories": int(data["calories"]),
        "protein": int(data.get("protein", 0)),
        "carbs": int(data.get("carbs", 0)),
        "fat": int(data.get("fat", 0)),
        "category": data["category"],
        "vegan": bool(data.get("vegan", False)),
        "image_url": data.get("image_url"),
        "ingredients": data.get("ingredients", []),
        "allergens": data.get("allergens", []),
        "rating_avg": 0,
        "rating_count": 0,
        "created_at": datetime.utcnow(),
    }
    res = db.meals.insert_one(meal)
    meal["_id"] = res.inserted_id
    return jsonify(serialize(meal)), 201


@admin_bp.patch("/admin/meals/<meal_id>")
@role_required("admin")
def update_meal(meal_id):
    db = current_app.db
    data = request.get_json() or {}
    allowed = {"name", "description", "price", "calories", "protein", "carbs",
               "fat", "category", "vegan", "image_url", "ingredients", "allergens"}
    update = {k: v for k, v in data.items() if k in allowed}
    try:
        db.meals.update_one({"_id": ObjectId(meal_id)}, {"$set": update})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    return jsonify({"updated": True})


@admin_bp.delete("/admin/meals/<meal_id>")
@role_required("admin")
def delete_meal(meal_id):
    db = current_app.db
    try:
        db.meals.delete_one({"_id": ObjectId(meal_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    return jsonify({"deleted": True})


# ============ ORDERS ============

@admin_bp.get("/admin/orders")
@role_required("admin")
def list_all_orders():
    db = current_app.db
    q = {}
    status = request.args.get("status")
    if status:
        q["status"] = status
    docs = list(db.orders.find(q).sort("created_at", -1).limit(200))
    # Attach user names
    user_ids = list({d["user_id"] for d in docs if d.get("user_id")})
    object_user_ids = []
    for uid in user_ids:
        try:
            object_user_ids.append(ObjectId(uid))
        except Exception:
            pass
    users = {str(u["_id"]): u for u in db.users.find(
        {"_id": {"$in": object_user_ids}}, {"name": 1, "email": 1})}
    out = []
    for d in docs:
        s = serialize(d)
        u = users.get(d.get("user_id"))
        if u:
            s["user_name"] = u.get("name")
            s["user_email"] = u.get("email")
        out.append(s)
    return jsonify(out)


@admin_bp.get("/admin/activity")
@role_required("admin")
def activity_log():
    db = current_app.db
    docs = list(db.activity_log.find().sort("at", -1).limit(100))
    return jsonify([serialize(d) for d in docs])
