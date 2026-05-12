"""Chat: rooms, message history (Socket.IO handles realtime delivery)."""
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import serialize, current_user

chat_bp = Blueprint("chat", __name__)


@chat_bp.get("/chat/rooms")
@jwt_required()
def my_rooms():
    """List chat rooms the current user belongs to (with peer info)."""
    db = current_app.db
    uid = get_jwt_identity()
    docs = list(db.chat_rooms.find({"participants": uid}).sort("updated_at", -1))
    # Resolve peers
    all_participants = set()
    for d in docs:
        for p in d.get("participants", []):
            if p != uid:
                all_participants.add(p)
    object_ids = []
    for p in all_participants:
        try:
            object_ids.append(ObjectId(p))
        except Exception:
            pass
    users = {str(u["_id"]): u for u in db.users.find(
        {"_id": {"$in": object_ids}}, {"name": 1, "role": 1, "avatar_url": 1})}
    out = []
    for d in docs:
        peers = [users.get(p) for p in d.get("participants", []) if p != uid]
        s = serialize(d)
        s["peers"] = [serialize(p) for p in peers if p]
        out.append(s)
    return jsonify(out)


@chat_bp.post("/chat/rooms")
@jwt_required()
def open_room():
    """Open or fetch a 1:1 room with another user."""
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    peer_id = data.get("peer_id")
    if not peer_id:
        # Customer-support default: open with first available dietitian or admin
        user = current_user()
        if user["role"] == "customer":
            peer = db.users.find_one({"role": "dietitian"})
            if not peer:
                peer = db.users.find_one({"role": "admin"})
            if peer:
                peer_id = str(peer["_id"])
    if not peer_id:
        return jsonify({"error": "peer_required"}), 400

    participants = sorted([uid, peer_id])
    room = db.chat_rooms.find_one({"participants": participants})
    if not room:
        room = {
            "participants": participants,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_message": "",
        }
        res = db.chat_rooms.insert_one(room)
        room["_id"] = res.inserted_id
    return jsonify(serialize(room))


@chat_bp.get("/chat/rooms/<room_id>/messages")
@jwt_required()
def room_messages(room_id):
    db = current_app.db
    uid = get_jwt_identity()
    try:
        room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    if not room or uid not in room.get("participants", []):
        return jsonify({"error": "forbidden"}), 403
    msgs = list(db.chat_messages.find({"room_id": room_id}).sort("created_at", 1).limit(500))
    return jsonify([serialize(m) for m in msgs])


@chat_bp.post("/chat/rooms/<room_id>/messages")
@jwt_required()
def send_message(room_id):
    """Send a message via HTTP (Socket.IO also broadcasts on the same room)."""
    from app import socketio
    db = current_app.db
    uid = get_jwt_identity()
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()[:4000]
    if not text:
        return jsonify({"error": "empty_message"}), 400
    try:
        room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
    except Exception:
        return jsonify({"error": "invalid_id"}), 400
    if not room or uid not in room.get("participants", []):
        return jsonify({"error": "forbidden"}), 403
    msg = {
        "room_id": room_id,
        "sender_id": uid,
        "text": text,
        "created_at": datetime.utcnow(),
    }
    res = db.chat_messages.insert_one(msg)
    msg["_id"] = res.inserted_id
    db.chat_rooms.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {"last_message": text, "updated_at": datetime.utcnow()}},
    )
    socketio.emit("chat:message", serialize(msg), room=f"chat:{room_id}")
    return jsonify(serialize(msg)), 201
