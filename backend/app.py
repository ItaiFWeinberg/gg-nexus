"""GG Nexus — Flask application entry point."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.react_agent import run_react_agent
from routes.auth import auth_bp, token_required
from models.conversation import (
    save_message,
    get_conversation_history,
    get_user_sessions,
    get_user_context_summary,
)
from models.user import find_user_by_id
from tools.data_fetcher import fetch_game_data, fetch_recommendations_for
import re
import time
import traceback

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)

rate_limits = {}
RATE_LIMIT_SECONDS = 2


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "ok",
            "message": "GG Nexus API is running",
            "version": "2.0",
            "features": ["ReAct Agent", "RAG", "Tool Use", "Conversation Memory", "Live Dashboard"],
        }
    )


@app.route("/api/chat", methods=["POST"])
@token_required
def chat_endpoint(current_user):
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"]
    session_id = data.get("session_id", "default")
    user_id = current_user["_id"]

    now = time.time()
    if now - rate_limits.get(user_id, 0) < RATE_LIMIT_SECONDS:
        return jsonify({"error": "Please wait a moment before sending another message"}), 429
    rate_limits[user_id] = now

    try:
        history = get_conversation_history(user_id, session_id)
        full_user = find_user_by_id(user_id)

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

        mood_match = re.match(r"^\[MOOD:\w+\]\s*", ai_response)
        if mood_match:
            ai_response = ai_response[mood_match.end() :].strip()

        save_message(user_id, "user", user_message, session_id)
        save_message(user_id, "assistant", ai_response, session_id)

        return jsonify(
            {
                "response": ai_response,
                "mood": mood,
                "session_id": session_id,
                "agent_info": {
                    "reasoning_steps": len(reasoning),
                    "tools_used": tools_used,
                    "trace": reasoning,
                },
            }
        )

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

    formatted = [
        {
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat(),
        }
        for msg in messages
    ]

    return jsonify({"messages": formatted, "session_id": session_id})


# ── Dashboard API ────────────────────────────────────────────────


@app.route("/api/dashboard/games", methods=["GET"])
@token_required
def dashboard_games(current_user):
    """Fetch live data for each of the user's favorite games."""
    profile = current_user.get("profile", {})
    favorite_games = profile.get("favorite_games", [])

    if not favorite_games:
        return jsonify({"games": [], "message": "No favorite games set"})

    results = []
    for game_name in favorite_games[:8]:
        try:
            meta = fetch_game_data(game_name, "meta")
            meta.pop("_cache", None)
            meta.pop("_source", None)
            results.append({
                "name": game_name,
                "meta": meta,
                "rank": profile.get("ranks", {}).get(game_name),
                "role": profile.get("main_roles", {}).get(game_name),
                "skill": profile.get("skill_levels", {}).get(game_name),
            })
        except Exception as e:
            print(f"[WARN] Dashboard fetch failed for {game_name}: {e}")
            results.append({
                "name": game_name,
                "meta": {"error": "Could not fetch data"},
                "rank": profile.get("ranks", {}).get(game_name),
                "role": profile.get("main_roles", {}).get(game_name),
                "skill": profile.get("skill_levels", {}).get(game_name),
            })

    return jsonify({"games": results})


@app.route("/api/dashboard/game/<game_name>", methods=["GET"])
@token_required
def dashboard_single_game(current_user, game_name):
    """Fetch detailed live data for a single game."""
    meta = fetch_game_data(game_name, "meta")
    general = fetch_game_data(game_name, "general")
    recs = fetch_recommendations_for(game_name)

    meta.pop("_cache", None)
    meta.pop("_source", None)
    general.pop("_cache", None)
    general.pop("_source", None)

    profile = current_user.get("profile", {})

    return jsonify({
        "name": game_name,
        "meta": meta,
        "general": general,
        "recommendations": recs.get("similar_games", []),
        "user_rank": profile.get("ranks", {}).get(game_name),
        "user_role": profile.get("main_roles", {}).get(game_name),
        "user_skill": profile.get("skill_levels", {}).get(game_name),
    })


@app.route("/api/dashboard/tip", methods=["GET"])
@token_required
def dashboard_tip(current_user):
    """Generate a personalized daily tip using the AI agent."""
    from models.user import get_user_profile_summary

    profile_summary = get_user_profile_summary(current_user["_id"])
    username = current_user.get("username", "Player")

    try:
        from google import genai
        tip_client = genai.Client(api_key=GEMINI_API_KEY)
        response = tip_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"Based on this gamer's profile, give ONE short, specific, actionable gaming tip "
                f"(2-3 sentences max). Make it personalized to their games and skill level.\n\n"
                f"Profile:\n{profile_summary}"
            ],
            config={"temperature": 0.8, "max_output_tokens": 150},
        )
        return jsonify({"tip": response.text.strip(), "username": username})
    except Exception as e:
        print(f"[WARN] Tip generation failed: {e}")
        return jsonify({"tip": f"Keep grinding, {username}! Consistency beats talent.", "username": username})


# ── Admin ────────────────────────────────────────────────────────


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

    key = game.lower().replace(" ", "_")
    invalidate_cache(f"game:{key}:meta")
    invalidate_cache(f"game:{key}:general")

    return jsonify({"message": f"Cache cleared for {game}. Next query will fetch fresh data."})


if __name__ == "__main__":
    print("\n🎮 GG Nexus API v2.0 starting...")
    print("🤖 ReAct Agent loaded with tools:")
    print("   📚 search_game_info (RAG + live data)")
    print("   🎯 recommend_games")
    print("   👤 get_player_profile")
    print("   ⚖️  compare_games")
    print("🔐 JWT authentication enabled")
    print("💾 MongoDB connected")
    print("🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)