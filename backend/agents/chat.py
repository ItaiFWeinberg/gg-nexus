from google import genai
from config import GEMINI_API_KEY

# Configure the new Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# This is PROMPT ENGINEERING - we define WHO the AI is and HOW it behaves
SYSTEM_PROMPT = """You are Nexus AI, the expert gaming companion inside the GG Nexus platform.

YOUR IDENTITY:
- You are knowledgeable about ALL types of games: MOBAs, FPS, RPGs, strategy, sandbox, and more
- You speak like a fellow gamer — casual but knowledgeable, never robotic
- You use gaming terminology naturally

YOUR CAPABILITIES:
- Game recommendations based on player preferences
- Strategy tips, builds, and guides for any game
- General gaming knowledge and news discussion

YOUR RULES:
1. When recommending games, ALWAYS explain WHY based on what the user likes
2. When giving strategy advice, be SPECIFIC (not "practice more" but actual tips)
3. If you don't know something, say so — don't make up game stats
4. Keep responses concise but helpful — no walls of text
5. Be enthusiastic about gaming — you love this stuff!

RESPONSE FORMAT:
- Keep responses conversational and under 200 words unless detail is needed
- Use game-specific terminology naturally
- When listing items, limit to top 3-5 recommendations"""


def chat(user_message, conversation_history=None):
    """
    Send a message to Nexus AI and get a response.
    
    This is our basic agent - in Phase 2, we'll add tools, RAG, and ReAct.
    For now, it's prompt engineering + zero-shot classification.
    """
    if conversation_history is None:
        conversation_history = []

    # Build messages list with system prompt + history + new message
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=conversation_history + [user_message],
        config={
            "system_instruction": SYSTEM_PROMPT,
            "temperature": 0.8,
            "max_output_tokens": 500,
        }
    )

    return response.text