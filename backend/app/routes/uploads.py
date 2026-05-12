"""Secure file uploads: validates type and extension, stores in /uploads."""
import os
import uuid
from flask import Blueprint, jsonify, request, current_app, url_for
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)

ALLOWED_IMAGE = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_BYTES = 8 * 1024 * 1024


def _ext_ok(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE


@uploads_bp.post("/upload/image")
@jwt_required()
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400
    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"error": "empty_file"}), 400
    if not _ext_ok(file.filename):
        return jsonify({"error": "invalid_type"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    target = os.path.join(current_app.config["UPLOAD_FOLDER"], safe_name)
    file.save(target)
    return jsonify({
        "url": f"/uploads/{safe_name}",
        "filename": safe_name,
    })
