from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GEMINI_API_KEY
from agents.chat import chat, SYSTEM_PROMPT

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow React frontend to connect

# Store conversation histories per session (in-memory for now)
# In Phase 2, we'll move this to MongoDB
conversations = {}


@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "ok", "message": "GG Nexus API is running!"})


@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    """
    Main chat endpoint.
    
    Receives: { "message": "user's message", "session_id": "optional-session-id" }
    Returns:  { "response": "AI's response", "session_id": "session-id" }
    """
    data = request.get_json()

    # Validate input
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"]
    session_id = data.get("session_id", "default")

    # Get or create conversation history for this session
    if session_id not in conversations:
        conversations[session_id] = []

    try:
        # Call our AI agent
        ai_response = chat(user_message, conversations[session_id])

        # Update conversation history (short-term memory)
        conversations[session_id].append({"role": "user", "parts": [{"text": user_message}]})
        conversations[session_id].append({"role": "model", "parts": [{"text": ai_response}]})

        # Keep only last 20 messages to avoid token limits
        if len(conversations[session_id]) > 20:
            conversations[session_id] = conversations[session_id][-20:]

        return jsonify({
            "response": ai_response,
            "session_id": session_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("\n🎮 GG Nexus API starting...")
    print(f"🤖 Nexus AI loaded with system prompt ({len(SYSTEM_PROMPT)} chars)")
    print(f"🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)