import bcrypt
from datetime import datetime
from pymongo import MongoClient
from config import MONGO_URI

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client.gg_nexus  # Database name

# Collections (like tables in SQL)
users_collection = db.users
conversations_collection = db.conversations


def hash_password(password):
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password, hashed_password):
    """
    Check if a password matches its hash.
    
    This is the ONLY way to verify — you can't "unhash" the password.
    bcrypt.checkpw handles the salt extraction and comparison.
    """
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def create_user(username, email, password):
    # Check if username or email already exists
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
            "skill_levels": {}
        },
        "preferences": {
            "genres": [],
            "play_sessions": "evening",
            "solo_vs_team": "both"
        },
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow()
    }

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id

    # Return user without password hash (never send passwords to frontend!)
    return sanitize_user(user)


def find_user_by_username(username):
    return users_collection.find_one({"username": username})


def find_user_by_id(user_id):
    from bson import ObjectId
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    return sanitize_user(user) if user else None


def update_user_profile(user_id, profile_data):
    from bson import ObjectId
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile": profile_data, "last_active": datetime.utcnow()}}
    )


def sanitize_user(user):
    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        user.pop("password_hash", None)  # Remove password hash
    return user