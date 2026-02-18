import json
from tools.data_fetcher import fetch_game_data, fetch_recommendations_for
from models.cache import get_cached, set_cached, get_cache_info


# === TOOL DEFINITIONS ===

TOOL_DEFINITIONS = [
    {
        "name": "search_game_info",
        "description": "Search for information about a specific game. This fetches LIVE data — current meta, tips, character/weapon info. Use this whenever users ask about any game. Works for ANY game, not just popular ones.",
        "parameters": {
            "game": "The game name (e.g., 'League of Legends', 'Valorant', 'Elden Ring', 'Palworld')",
            "query_type": "What to look for: 'meta' (current meta/tier list), 'general' (overview/tips), or 'recommendations' (similar games)"
        }
    },
    {
        "name": "recommend_games",
        "description": "Get personalized game recommendations. Can recommend based on a game the user likes, or based on their playstyle. Returns live data.",
        "parameters": {
            "based_on": "A game name (for 'similar to X') OR a playstyle ('competitive', 'casual', 'explorer', 'social')",
        }
    },
    {
        "name": "get_player_profile",
        "description": "Get the user's gaming profile — their favorite games, playstyle, and goals. Use this to personalize any recommendation or advice.",
        "parameters": {}
    },
    {
        "name": "compare_games",
        "description": "Compare two games side by side with live data. Use when users ask 'should I play X or Y' or 'difference between X and Y'.",
        "parameters": {
            "game1": "First game name",
            "game2": "Second game name"
        }
    }
]


# === TOOL IMPLEMENTATIONS ===

def search_game_info(game, query_type="meta"):
    """Dynamic game info search — fetches live data."""
    data = fetch_game_data(game, query_type)

    if not data or data.get("error"):
        return {
            "found": False,
            "message": data.get("error", f"No data found for '{game}'"),
        }

    # Clean internal metadata for the AI
    source = data.pop("_source", "unknown")
    cache_status = data.pop("_cache", "unknown")

    return {
        "found": True,
        "game": game,
        "data": data,
        "data_source": source,
        "cache_status": cache_status,
    }


def recommend_games(based_on):
    """Dynamic game recommendations."""
    # Try as a game name first
    recs = fetch_recommendations_for(based_on)
    if recs and recs.get("similar_games"):
        return {
            "found": True,
            "based_on": based_on,
            "recommendations": recs["similar_games"],
            "source": recs.get("_source", "gemini"),
        }

    # Try as a playstyle — use Gemini to generate
    from tools.data_fetcher import fetch_via_gemini
    prompt_data = fetch_via_gemini(
        f"games for {based_on} players",
        "recommendations"
    )
    if prompt_data and prompt_data.get("similar_games"):
        return {
            "found": True,
            "based_on": based_on,
            "recommendations": prompt_data["similar_games"],
            "source": "gemini",
        }

    return {
        "found": False,
        "message": f"Couldn't generate recommendations for '{based_on}'",
    }


def get_player_profile(user_data):
    """Get user's gaming profile for personalization."""
    if not user_data:
        return {"found": False, "message": "No user profile available"}

    profile = user_data.get("profile", {})
    return {
        "found": True,
        "username": user_data.get("username", "Player"),
        "favorite_games": profile.get("favorite_games", []),
        "playstyle": profile.get("playstyle", []),
        "goals": profile.get("goals", []),
        "platforms": profile.get("platforms", []),
    }


def compare_games(game1, game2):
    """Compare two games with live data."""
    data1 = fetch_game_data(game1, "general")
    data2 = fetch_game_data(game2, "general")

    result = {"found": True, "comparison": {}}

    for name, data in [(game1, data1), (game2, data2)]:
        if data and not data.get("error"):
            data.pop("_source", None)
            data.pop("_cache", None)
            result["comparison"][name] = data
        else:
            result["comparison"][name] = {"error": f"Could not fetch data for {name}"}

    return result


def execute_tool(tool_name, params, user_data=None):
    """Execute a tool by name — called by the ReAct agent."""
    if tool_name == "search_game_info":
        return search_game_info(
            params.get("game", ""),
            params.get("query_type", "meta")
        )
    elif tool_name == "recommend_games":
        return recommend_games(params.get("based_on", ""))
    elif tool_name == "get_player_profile":
        return get_player_profile(user_data)
    elif tool_name == "compare_games":
        return compare_games(
            params.get("game1", ""),
            params.get("game2", "")
        )
    # Legacy tool names (backward compat)
    elif tool_name == "search_knowledge_base":
        return search_game_info(
            params.get("game", ""),
            params.get("query", "meta")
        )
    elif tool_name == "get_game_meta":
        return search_game_info(params.get("game", ""), "meta")
    else:
        return {"error": f"Unknown tool: {tool_name}"}