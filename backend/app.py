"""GG Nexus — Flask application entry point."""

import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.react_agent import run_react_agent
from agents.profile_intelligence import generate_welcome_message, evolve_profile
from routes.auth import auth_bp, token_required
from models.conversation import (
    save_message,
    get_conversation_history,
    get_user_sessions,
    get_user_context_summary,
)
from models.user import find_user_by_id, get_full_user, update_ai_profile
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
            "features": [
                "ReAct Agent", "RAG", "Tool Use", "Conversation Memory",
                "Live Dashboard", "AI Profile Intelligence",
            ],
        }
    )


# ── Chat ─────────────────────────────────────────────────────────


@app.route("/api/chat/welcome", methods=["GET"])
@token_required
def chat_welcome(current_user):
    """Generate a personalized AI welcome message using the full player profile."""
    import time as _time

    full_user = get_full_user(current_user["_id"])
    profile = full_user.get("profile", {})
    ai_profile = full_user.get("ai_profile")
    username = full_user.get("username", "Player")

    has_profile = bool(profile.get("favorite_games"))

    if not has_profile:
        return jsonify({
            "message": f"Hey {username}! I'm Nexus, your gaming AI. Tell me what games you play and I'll help with strategy, builds, recommendations — anything gaming!",
            "mood": "happy",
        })

    # If AI profile isn't ready yet, wait briefly and retry once
    if not ai_profile:
        _time.sleep(1.5)
        full_user = get_full_user(current_user["_id"])
        ai_profile = full_user.get("ai_profile")

    message = generate_welcome_message(profile, ai_profile, username)
    return jsonify({"message": message, "mood": "excited"})


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
        full_user = get_full_user(user_id)

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

        # Evolve profile in background every 6+ messages
        _maybe_evolve_profile(user_id, session_id, full_user)

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


def _maybe_evolve_profile(user_id, session_id, full_user):
    """Run profile evolution in background if enough messages have accumulated."""
    try:
        from models.conversation import conversations_collection
        msg_count = conversations_collection.count_documents(
            {"user_id": user_id, "session_id": session_id}
        )

        # Evolve after every 6 messages in a session
        if msg_count > 0 and msg_count % 6 == 0:
            messages = list(
                conversations_collection.find(
                    {"user_id": user_id, "session_id": session_id}
                ).sort("timestamp", -1).limit(10)
            )
            messages.reverse()

            formatted = [{"role": m["role"], "content": m["content"]} for m in messages]
            existing_ai = full_user.get("ai_profile")

            def _evolve():
                try:
                    updated = evolve_profile(user_id, formatted, existing_ai)
                    if updated:
                        update_ai_profile(user_id, updated)
                        print(f"[OK] Profile evolved for user {user_id}")
                except Exception as e:
                    print(f"[WARN] Profile evolution failed: {e}")

            thread = threading.Thread(target=_evolve)
            thread.daemon = True
            thread.start()
    except Exception:
        pass


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


# ── Dashboard ────────────────────────────────────────────────────


@app.route("/api/dashboard/games", methods=["GET"])
@token_required
def dashboard_games(current_user):
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
    meta = fetch_game_data(game_name, "meta")
    general = fetch_game_data(game_name, "general")
    recs = fetch_recommendations_for(game_name)

    for d in [meta, general]:
        d.pop("_cache", None)
        d.pop("_source", None)

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
    full_user = get_full_user(current_user["_id"])
    profile = full_user.get("profile", {})
    ai_profile = full_user.get("ai_profile", {})
    username = current_user.get("username", "Player")

    context = f"Username: {username}\n"
    context += f"Games: {', '.join(profile.get('favorite_games', []))}\n"

    if ai_profile:
        context += f"Player archetype: {ai_profile.get('player_archetype', 'unknown')}\n"
        context += f"Growth areas: {ai_profile.get('growth_areas', 'unknown')}\n"

    ranks = profile.get("ranks", {})
    if ranks:
        context += f"Ranks: {', '.join(f'{g}: {r}' for g, r in ranks.items())}\n"

    try:
        from google import genai
        tip_client = genai.Client(api_key=GEMINI_API_KEY)
        response = tip_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"Based on this gamer's profile, give ONE short, specific, actionable gaming tip "
                f"(2-3 sentences max). Be specific to their games and rank. Not generic.\n\n"
                f"Profile:\n{context}"
            ],
            config={"temperature": 0.8, "max_output_tokens": 150},
        )
        return jsonify({"tip": response.text.strip(), "username": username})
    except Exception as e:
        print(f"[WARN] Tip generation failed: {e}")
        return jsonify({"tip": f"Keep grinding, {username}! Consistency beats talent.", "username": username})


# ── Recommendations ──────────────────────────────────────────────


@app.route("/api/recommendations", methods=["GET"])
@token_required
def get_recommendations(current_user):
    """AI-powered game recommendations based on player profile."""
    full_user = get_full_user(current_user["_id"])
    profile = full_user.get("profile", {})
    ai_profile = full_user.get("ai_profile", {})
    games = profile.get("favorite_games", [])
    username = full_user.get("username", "Player")

    if not games:
        return jsonify({"recommendations": [], "message": "Set up your games first!"})

    context = f"Player: {username}\n"
    context += f"Currently plays: {', '.join(games)}\n"

    ranks = profile.get("ranks", {})
    if ranks:
        context += f"Ranks: {', '.join(f'{g}: {r}' for g, r in ranks.items())}\n"

    playstyle = profile.get("playstyle", [])
    if playstyle:
        context += f"Playstyle: {', '.join(playstyle)}\n"

    goals = profile.get("goals", [])
    if goals:
        context += f"Goals: {', '.join(goals)}\n"

    if ai_profile and ai_profile.get("player_archetype"):
        context += f"Player archetype: {ai_profile['player_archetype']}\n"
    if ai_profile and ai_profile.get("recommendations_angle"):
        context += f"What resonates: {ai_profile['recommendations_angle']}\n"

    try:
        from google import genai
        rec_client = genai.Client(api_key=GEMINI_API_KEY)
        response = rec_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"Based on this player's profile, suggest 6 games they would love.\n\n"
                f"Profile:\n{context}\n\n"
                f"For each game, explain WHY it fits THIS specific player (reference their games/rank/style).\n"
                f'Respond ONLY with valid JSON array: [{{"name": "Game Name", "reason": "personalized reason", "match_score": 85, "because_of": "which of their games this relates to"}}]\n'
                f"No markdown, just JSON."
            ],
            config={"temperature": 0.6, "max_output_tokens": 500},
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]

        import json as _json
        recs = _json.loads(text.strip())
        return jsonify({"recommendations": recs})
    except Exception as e:
        print(f"[WARN] Recommendations failed: {e}")
        return jsonify({"recommendations": [], "error": "Could not generate recommendations"})


# ── Guides ───────────────────────────────────────────────────────


@app.route("/api/guides/generate", methods=["POST"])
@token_required
def generate_guide(current_user):
    """Generate a personalized guide for a specific game/topic."""
    data = request.get_json()
    game = data.get("game", "")
    topic = data.get("topic", "general")

    if not game:
        return jsonify({"error": "Game name is required"}), 400

    full_user = get_full_user(current_user["_id"])
    profile = full_user.get("profile", {})
    rank = profile.get("ranks", {}).get(game, "unknown")
    role = profile.get("main_roles", {}).get(game)
    skill = profile.get("skill_levels", {}).get(game, "unknown")
    username = full_user.get("username", "Player")

    player_context = f"Player: {username}, {skill} level"
    if rank != "unknown":
        player_context += f", currently {rank}"
    if role:
        player_context += f", mains {role}"

    topic_prompts = {
        "general": f"Write a comprehensive strategy guide for {game}.",
        "climbing": f"Write a rank climbing guide for {game}.",
        "role": f"Write a {role or 'role-specific'} guide for {game}.",
        "meta": f"Explain the current meta for {game} and how to abuse it.",
        "beginner": f"Write a beginner-friendly intro guide for {game}.",
        "advanced": f"Write advanced tips and tricks for {game} that most players miss.",
    }

    prompt = topic_prompts.get(topic, topic_prompts["general"])

    try:
        from google import genai
        guide_client = genai.Client(api_key=GEMINI_API_KEY)
        response = guide_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"{prompt}\n\n"
                f"Tailor this specifically for: {player_context}\n\n"
                f"Format with clear sections. Use markdown headers (##). "
                f"Include specific champion/agent/character names, numbers, and actionable advice. "
                f"Keep it under 500 words. Make it feel like advice from a coach who knows them."
            ],
            config={"temperature": 0.5, "max_output_tokens": 800},
        )
        return jsonify({
            "guide": response.text.strip(),
            "game": game,
            "topic": topic,
            "tailored_for": player_context,
        })
    except Exception as e:
        print(f"[WARN] Guide generation failed: {e}")
        return jsonify({"error": "Could not generate guide"})


# ── Stats ────────────────────────────────────────────────────────


@app.route("/api/stats", methods=["GET"])
@token_required
def get_player_stats(current_user):
    """Aggregate player stats from conversations and profile."""
    from models.conversation import conversations_collection

    user_id = current_user["_id"]
    full_user = get_full_user(user_id)
    profile = full_user.get("profile", {})
    ai_profile = full_user.get("ai_profile", {})

    total_messages = conversations_collection.count_documents({"user_id": user_id, "role": "user"})
    total_sessions = len(list(conversations_collection.distinct("session_id", {"user_id": user_id})))

    # Get most discussed topics from recent messages
    recent_msgs = list(
        conversations_collection.find(
            {"user_id": user_id, "role": "user"}
        ).sort("timestamp", -1).limit(20)
    )

    return jsonify({
        "profile": {
            "games": profile.get("favorite_games", []),
            "ranks": profile.get("ranks", {}),
            "roles": profile.get("main_roles", {}),
            "skills": profile.get("skill_levels", {}),
            "playstyle": profile.get("playstyle", []),
            "goals": profile.get("goals", []),
        },
        "activity": {
            "total_messages": total_messages,
            "total_sessions": total_sessions,
            "member_since": full_user.get("created_at", "").isoformat() if full_user.get("created_at") else None,
        },
        "ai_insights": {
            "archetype": ai_profile.get("player_archetype"),
            "personality": ai_profile.get("personality_notes"),
            "growth_areas": ai_profile.get("growth_areas"),
            "coaching_style": ai_profile.get("coaching_style"),
            "recent_mood": ai_profile.get("recent_mood"),
            "discovered_interests": ai_profile.get("discovered_interests", []),
        },
    })


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
    print("🧠 Profile Intelligence active")
    print("🔐 JWT authentication enabled")
    print("💾 MongoDB connected")
    print("🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)