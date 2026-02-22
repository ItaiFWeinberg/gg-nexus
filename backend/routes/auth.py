"""Authentication routes — JWT-based signup, login, and token verification."""

import jwt
import threading
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from functools import wraps
from models.user import (
    create_user, find_user_by_username, find_user_by_id,
    verify_password, update_user_profile, update_ai_profile,
)
from config import JWT_SECRET, JWT_EXPIRATION_HOURS

auth_bp = Blueprint("auth", __name__)


def generate_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication required"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = find_user_by_id(payload["user_id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired — please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def _build_ai_profile_async(user_id, profile_data, username):
    """Run AI profile building in a background thread so signup doesn't block."""
    try:
        from agents.profile_intelligence import build_ai_profile
        ai_profile = build_ai_profile(profile_data, username)
        update_ai_profile(user_id, ai_profile)
        print(f"[OK] AI profile built for {username}: {ai_profile.get('player_archetype', '?')}")
    except Exception as e:
        print(f"[WARN] Background AI profile build failed for {username}: {e}")


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = create_user(username, email, password)
    if not user:
        return jsonify({"error": "Username or email already exists"}), 409

    token = generate_token(user["_id"])
    return jsonify({"user": user, "token": token}), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = find_user_by_username(username)
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid username or password"}), 401

    token = generate_token(user["_id"])
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)

    return jsonify({"user": user, "token": token})


@auth_bp.route("/api/auth/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return jsonify({"user": current_user})


@auth_bp.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    profile_data = data.get("profile", data)
    print(f"[DEBUG] Profile update for {current_user.get('username')}: games={profile_data.get('favorite_games', [])}")
    update_user_profile(current_user["_id"], profile_data)

    # Build AI profile in background (non-blocking)
    has_games = bool(profile_data.get("favorite_games"))
    if has_games:
        thread = threading.Thread(
            target=_build_ai_profile_async,
            args=(current_user["_id"], profile_data, current_user.get("username", "Player")),
        )
        thread.daemon = True
        thread.start()

    updated_user = find_user_by_id(current_user["_id"])
    return jsonify({"message": "Profile updated", "user": updated_user})