from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.chat import chat, SYSTEM_PROMPT
from routes.auth import auth_bp, token_required
from models.conversation import (
    save_message, get_conversation_history,
    get_user_sessions, get_user_context_summary
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register authentication routes (/api/auth/login, /api/auth/signup, etc.)
app.register_blueprint(auth_bp)


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

    try:
        # 1. Get conversation history from MongoDB (AGENT MEMORY)
        #    Instead of in-memory dict, we now persist conversations!
        history = get_conversation_history(user_id, session_id)

        # 2. Get user context summary (EPISODIC MEMORY)
        #    This tells the AI what the user has discussed recently
        context_summary = get_user_context_summary(user_id)

        # 3. Call our AI agent with history + context
        ai_response = chat(
            user_message,
            conversation_history=history,
            user_context=context_summary,
            username=current_user.get("username", "Player")
        )

        # 4. Save both messages to MongoDB (LONG-TERM MEMORY)
        save_message(user_id, "user", user_message, session_id)
        save_message(user_id, "assistant", ai_response, session_id)

        return jsonify({
            "response": ai_response,
            "session_id": session_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat/sessions", methods=["GET"])
@token_required
def get_sessions(current_user):
    """Get list of user's chat sessions (for session history sidebar)"""
    sessions = get_user_sessions(current_user["_id"])
    return jsonify({"sessions": sessions})


if __name__ == "__main__":
    print("\n🎮 GG Nexus API starting...")
    print(f"🤖 Nexus AI loaded with system prompt ({len(SYSTEM_PROMPT)} chars)")
    print(f"🔐 JWT authentication enabled")
    print(f"💾 MongoDB connected")
    print(f"🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)