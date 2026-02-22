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
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password, hashed_password):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


DEFAULT_PROFILE = {
    "favorite_games": [],
    "playstyle": [],
    "platforms": ["PC"],
    "goals": [],
    "skill_levels": {},
    "ranks": {},
    "main_roles": {},
    "personal": {"age_range": "", "gender": "", "region": ""},
}


def create_user(username, email, password):
    if users_collection.find_one({"$or": [{"username": username}, {"email": email}]}):
        return None

    user = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "profile": dict(DEFAULT_PROFILE),
        "ai_profile": None,
        "preferences": {"genres": [], "play_sessions": "evening", "solo_vs_team": "both"},
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
    }

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    return sanitize_user(user)


def find_user_by_username(username):
    return users_collection.find_one({"username": username})


def find_user_by_id(user_id):
    from bson import ObjectId
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    return sanitize_user(user) if user else None


def update_user_profile(user_id, profile_data):
    """Merge incoming profile data into user's existing profile."""
    from bson import ObjectId

    current = users_collection.find_one({"_id": ObjectId(user_id)})
    if not current:
        return

    existing = current.get("profile", {})
    for key in DEFAULT_PROFILE:
        if key not in existing:
            existing[key] = DEFAULT_PROFILE[key]

    for key in DEFAULT_PROFILE:
        if key in profile_data:
            if key == "personal" and isinstance(profile_data[key], dict):
                existing_personal = existing.get("personal", {})
                existing_personal.update(profile_data[key])
                existing["personal"] = existing_personal
            else:
                existing[key] = profile_data[key]

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile": existing, "last_active": datetime.utcnow()}},
    )


def update_ai_profile(user_id, ai_profile_data):
    """Store or update the AI-generated player analysis."""
    from bson import ObjectId
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"ai_profile": ai_profile_data, "last_active": datetime.utcnow()}},
    )


def get_full_user(user_id):
    """Get user with all fields including ai_profile (for backend use only)."""
    from bson import ObjectId
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
    return user


def sanitize_user(user):
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
    return user