from datetime import datetime
from bson import ObjectId
from models.user import db

conversations_collection = db.conversations


def save_message(user_id, role, content, session_id=None):
    message = {
        "user_id": user_id,
        "session_id": session_id or str(ObjectId()),
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    conversations_collection.insert_one(message)
    return message


def get_conversation_history(user_id, session_id=None, limit=20):
    query = {"user_id": user_id}
    if session_id:
        query["session_id"] = session_id

    messages = list(
        conversations_collection.find(query)
        .sort("timestamp", -1)  # Most recent first
        .limit(limit)
    )

    # Reverse so oldest is first (chronological order)
    messages.reverse()

    # Format for Gemini API
    formatted = []
    for msg in messages:
        formatted.append({
            "role": msg["role"] if msg["role"] == "user" else "model",
            "parts": [{"text": msg["content"]}]
        })

    return formatted


def get_user_sessions(user_id, limit=10):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$last": "$content"},
            "last_time": {"$max": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": limit}
    ]

    sessions = list(conversations_collection.aggregate(pipeline))
    return [{
        "session_id": s["_id"],
        "preview": s["last_message"][:100] + "..." if len(s["last_message"]) > 100 else s["last_message"],
        "last_time": s["last_time"].isoformat(),
        "message_count": s["message_count"]
    } for s in sessions]


def get_user_context_summary(user_id, limit=5):
    recent = list(
        conversations_collection.find(
            {"user_id": user_id, "role": "user"}
        ).sort("timestamp", -1).limit(limit)
    )

    if not recent:
        return "This is a new user with no conversation history."

    summaries = [msg["content"][:150] for msg in recent]
    return "Recent topics the user discussed: " + " | ".join(summaries)