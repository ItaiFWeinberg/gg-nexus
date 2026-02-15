"""
GG Nexus — Main Flask Application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.chat import chat, SYSTEM_PROMPT
from routes.auth import auth_bp, token_required
from models.conversation import (
    save_message, get_conversation_history,
    get_user_sessions, get_user_context_summary
)
from datetime import datetime, timezone
import time

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)

# Simple rate limiting per user
rate_limits = {}
RATE_LIMIT_SECONDS = 2  # Min seconds between messages


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "GG Nexus API is running!"})


@app.route("/api/chat", methods=["POST"])
@token_required
def chat_endpoint(current_user):
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"]
    session_id = data.get("session_id", "default")
    user_id = current_user["_id"]

    # Rate limiting
    now = time.time()
    last_request = rate_limits.get(user_id, 0)
    if now - last_request < RATE_LIMIT_SECONDS:
        return jsonify({"error": "Please wait a moment before sending another message"}), 429
    rate_limits[user_id] = now

    try:
        history = get_conversation_history(user_id, session_id)
        context_summary = get_user_context_summary(user_id)

        ai_response = chat(
            user_message,
            conversation_history=history,
            user_context=context_summary,
            username=current_user.get("username", "Player")
        )

        save_message(user_id, "user", user_message, session_id)
        save_message(user_id, "assistant", ai_response, session_id)

        return jsonify({
            "response": ai_response,
            "session_id": session_id
        })

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return jsonify({"error": "AI is busy — please try again in a few seconds"}), 429
        return jsonify({"error": "Something went wrong. Please try again."}), 500


@app.route("/api/chat/sessions", methods=["GET"])
@token_required
def get_sessions(current_user):
    sessions = get_user_sessions(current_user["_id"])
    return jsonify({"sessions": sessions})


@app.route("/api/chat/history/<session_id>", methods=["GET"])
@token_required
def get_session_history(current_user, session_id):
    """Load conversation history for a specific session — enables refresh persistence."""
    from models.conversation import conversations_collection

    messages = list(
        conversations_collection.find(
            {"user_id": current_user["_id"], "session_id": session_id}
        ).sort("timestamp", 1)
    )

    formatted = []
    for msg in messages:
        formatted.append({
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat()
        })

    return jsonify({"messages": formatted, "session_id": session_id})


if __name__ == "__main__":
    print("\n🎮 GG Nexus API starting...")
    print(f"🤖 Nexus AI loaded ({len(SYSTEM_PROMPT)} chars)")
    print(f"🔐 JWT authentication enabled")
    print(f"💾 MongoDB connected")
    print(f"🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)