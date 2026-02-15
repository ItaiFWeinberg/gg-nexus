"""
Conversation Model — Chat history + session summaries
"""

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
        .sort("timestamp", -1)
        .limit(limit)
    )
    messages.reverse()

    formatted = []
    for msg in messages:
        formatted.append({
            "role": msg["role"] if msg["role"] == "user" else "model",
            "parts": [{"text": msg["content"]}]
        })
    return formatted


def get_user_sessions(user_id, limit=20):
    """Get all sessions with preview and metadata."""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$session_id",
            "first_user_msg": {"$first": {
                "$cond": [{"$eq": ["$role", "user"]}, "$content", None]
            }},
            "last_message": {"$last": "$content"},
            "last_role": {"$last": "$role"},
            "first_time": {"$min": "$timestamp"},
            "last_time": {"$max": "$timestamp"},
            "message_count": {"$sum": 1},
            "all_user_msgs": {
                "$push": {
                    "$cond": [{"$eq": ["$role", "user"]}, "$content", "$$REMOVE"]
                }
            }
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": limit}
    ]

    sessions = list(conversations_collection.aggregate(pipeline))
    result = []
    for s in sessions:
        # Build a summary from user messages
        user_msgs = [m for m in s.get("all_user_msgs", []) if m]
        if user_msgs:
            # Use first user message as title, combine others for summary
            title = user_msgs[0][:80]
            topics = list(set([m[:50] for m in user_msgs[:5]]))
            summary = " | ".join(topics)
        else:
            title = "New conversation"
            summary = ""

        result.append({
            "session_id": s["_id"],
            "title": title,
            "summary": summary[:200],
            "preview": s["last_message"][:100] if s["last_message"] else "",
            "first_time": s["first_time"].isoformat() if s["first_time"] else None,
            "last_time": s["last_time"].isoformat() if s["last_time"] else None,
            "message_count": s["message_count"]
        })
    return result


def get_user_context_summary(user_id, limit=5):
    recent = list(
        conversations_collection.find(
            {"user_id": user_id, "role": "user"}
        ).sort("timestamp", -1).limit(limit)
    )

    if not recent:
        return ""

    summaries = [msg["content"][:100] for msg in recent]
    return "Recent user topics: " + " | ".join(summaries)