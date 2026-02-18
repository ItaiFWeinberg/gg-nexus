"""
GG Nexus — Main Flask Application
Phase 2: ReAct Agent with Tools + RAG
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.react_agent import run_react_agent
from routes.auth import auth_bp, token_required
from models.conversation import (
    save_message, get_conversation_history,
    get_user_sessions, get_user_context_summary
)
from models.user import find_user_by_id
from datetime import datetime, timezone
import time
import re
import traceback

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)

rate_limits = {}
RATE_LIMIT_SECONDS = 2


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "GG Nexus API is running!",
        "version": "2.0",
        "features": ["ReAct Agent", "RAG", "Tool Use", "Conversation Memory"]
    })


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
        # Short-term memory
        history = get_conversation_history(user_id, session_id)

        # Full user data for personalization
        full_user = find_user_by_id(user_id)

        # Run the ReAct agent
        result = run_react_agent(
            user_message=user_message,
            conversation_history=history,
            user_data=full_user,
            username=current_user.get("username", "Player"),
        )

        ai_response = result["response"]
        mood = result.get("mood", "idle")
        reasoning = result.get("reasoning_trace", [])
        tools_used = result.get("tools_used", [])

        # Strip any remaining mood tags from the response text
        mood_match = re.match(r'^\[MOOD:\w+\]\s*', ai_response)
        if mood_match:
            ai_response = ai_response[mood_match.end():].strip()

        # Save CLEAN messages to MongoDB (no mood tags)
        save_message(user_id, "user", user_message, session_id)
        save_message(user_id, "assistant", ai_response, session_id)

        return jsonify({
            "response": ai_response,
            "mood": mood,
            "session_id": session_id,
            "agent_info": {
                "reasoning_steps": len(reasoning),
                "tools_used": tools_used,
                "trace": reasoning
            }
        })

    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Chat endpoint: {error_msg}")
        traceback.print_exc()
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


@app.route("/api/admin/cache", methods=["GET"])
@token_required
def view_cache(current_user):
    from models.cache import list_cached_keys
    return jsonify({"cache": list_cached_keys()})


@app.route("/api/admin/cache/refresh", methods=["POST"])
@token_required
def refresh_cache(current_user):
    data = request.get_json()
    game = data.get("game")
    if not game:
        return jsonify({"error": "Provide a game name"}), 400

    from models.cache import invalidate_cache
    invalidate_cache(f"game:{game.lower().replace(' ', '_')}:meta")
    invalidate_cache(f"game:{game.lower().replace(' ', '_')}:general")

    return jsonify({"message": f"Cache cleared for {game}. Next query will fetch fresh data."})


if __name__ == "__main__":
    print("\n🎮 GG Nexus API v2.0 starting...")
    print(f"🤖 ReAct Agent loaded with tools:")
    print(f"   📚 search_game_info (RAG + live data)")
    print(f"   🎯 recommend_games")
    print(f"   👤 get_player_profile")
    print(f"   ⚖️  compare_games")
    print(f"🔐 JWT authentication enabled")
    print(f"💾 MongoDB connected")
    print(f"🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)