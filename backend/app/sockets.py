"""Socket.IO live events: chat rooms, order tracking, delivery location."""
from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room
from app import socketio


def _user_from_token(token: str):
    try:
        decoded = decode_token(token)
        return decoded["sub"]
    except Exception:
        return None


@socketio.on("connect")
def on_connect(auth):
    token = (auth or {}).get("token") if isinstance(auth, dict) else None
    uid = _user_from_token(token) if token else None
    if uid:
        join_room(f"user:{uid}")
        emit("connected", {"user_id": uid})


@socketio.on("chat:join")
def chat_join(data):
    room_id = (data or {}).get("room_id")
    if room_id:
        join_room(f"chat:{room_id}")
        emit("chat:joined", {"room_id": room_id})


@socketio.on("chat:leave")
def chat_leave(data):
    room_id = (data or {}).get("room_id")
    if room_id:
        leave_room(f"chat:{room_id}")


@socketio.on("chat:typing")
def chat_typing(data):
    room_id = (data or {}).get("room_id")
    user_id = (data or {}).get("user_id")
    if room_id:
        emit("chat:typing", {"user_id": user_id}, room=f"chat:{room_id}",
             include_self=False)


@socketio.on("admin:join")
def admin_join(data):
    token = (data or {}).get("token")
    uid = _user_from_token(token) if token else None
    if uid:
        # Trust-but-verify; role is checked when admin actions run via REST
        join_room("admins")
        emit("admin:joined", {"ok": True})


@socketio.on("delivery:location")
def delivery_location(data):
    """Delivery staff broadcasts their location on the order's tracking room."""
    order_id = (data or {}).get("order_id")
    lat = (data or {}).get("lat")
    lng = (data or {}).get("lng")
    if order_id is not None and lat is not None and lng is not None:
        emit("delivery:location", {"order_id": order_id, "lat": lat, "lng": lng},
             room=f"order:{order_id}")


@socketio.on("order:track")
def order_track(data):
    order_id = (data or {}).get("order_id")
    if order_id:
        join_room(f"order:{order_id}")
        emit("order:tracking", {"order_id": order_id})
