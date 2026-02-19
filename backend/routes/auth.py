"""Authentication routes — JWT-based signup, login, and token verification."""

import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from functools import wraps
from models.user import create_user, find_user_by_username, find_user_by_id, verify_password
from config import JWT_SECRET, JWT_EXPIRATION_HOURS

auth_bp = Blueprint("auth", __name__)


def generate_token(user_id):
    """Create a signed JWT token with user_id and expiration."""
    payload = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    """Decorator — validates JWT and injects current_user into the route."""

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


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    """Create a new user account and return a JWT."""
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
    """Authenticate a user and return a JWT."""
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
    """Return the authenticated user's profile."""
    return jsonify({"user": current_user})


@auth_bp.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    """Update the user's gaming profile (onboarding & settings)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    from models.user import update_user_profile

    profile_data = data.get("profile", data)
    update_user_profile(current_user["_id"], profile_data)

    updated_user = find_user_by_id(current_user["_id"])
    return jsonify({"message": "Profile updated", "user": updated_user})