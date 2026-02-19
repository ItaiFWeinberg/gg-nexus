"""User model — handles user data, password hashing, and profile management."""

import bcrypt
from datetime import datetime
from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.gg_nexus

users_collection = db.users
conversations_collection = db.conversations


def hash_password(password):
    """Hash a password with bcrypt (auto-salted, 12 rounds)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password, hashed_password):
    """Verify a plaintext password against its bcrypt hash."""
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_user(username, email, password):
    """Create a new user. Returns sanitized user dict or None if duplicate."""
    if users_collection.find_one({"$or": [{"username": username}, {"email": email}]}):
        return None

    user = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "profile": {
            "favorite_games": [],
            "playstyle": [],
            "platforms": ["PC"],
            "goals": [],
            "skill_levels": {},
        },
        "preferences": {
            "genres": [],
            "play_sessions": "evening",
            "solo_vs_team": "both",
        },
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
    }

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    return sanitize_user(user)


def find_user_by_username(username):
    """Find user by username — includes password hash for verification."""
    return users_collection.find_one({"username": username})


def find_user_by_id(user_id):
    """Find user by ID — returns sanitized (no password)."""
    from bson import ObjectId

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    return sanitize_user(user) if user else None


def update_user_profile(user_id, profile_data):
    """Update a user's gaming profile."""
    from bson import ObjectId

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile": profile_data, "last_active": datetime.utcnow()}},
    )


def sanitize_user(user):
    """Strip sensitive fields before sending to the client."""
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
    return user
