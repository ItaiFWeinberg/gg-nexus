import json
from tools.data_fetcher import fetch_game_data, fetch_recommendations_for
from models.cache import get_cached, set_cached, get_cache_info


TOOL_DEFINITIONS = [
    {
        "name": "search_game_info",
        "description": (
            "Search for information about a specific game. Fetches LIVE data — "
            "current meta, tips, character/weapon info. Works for ANY game."
        ),
        "parameters": {
            "game": "The game name (e.g., 'League of Legends', 'Valorant', 'Elden Ring')",
            "query_type": "What to look for: 'meta', 'general', or 'recommendations'",
        },
    },
    {
        "name": "recommend_games",
        "description": (
            "Get personalized game recommendations based on a game the user likes "
            "or their playstyle. Returns live data."
        ),
        "parameters": {
            "based_on": "A game name or playstyle ('competitive', 'casual', 'explorer', 'social')",
        },
    },
    {
        "name": "get_player_profile",
        "description": (
            "Get the user's gaming profile — favorite games, playstyle, and goals. "
            "Use this to personalize recommendations and advice."
        ),
        "parameters": {},
    },
    {
        "name": "compare_games",
        "description": (
            "Compare two games side by side with live data. Use when users ask "
            "'should I play X or Y' or 'difference between X and Y'."
        ),
        "parameters": {
            "game1": "First game name",
            "game2": "Second game name",
        },
    },
]


def search_game_info(game, query_type="meta"):
    """Fetch live game data through the multi-source data chain."""
    data = fetch_game_data(game, query_type)

    if not data or data.get("error"):
        return {"found": False, "message": data.get("error", f"No data found for '{game}'")}

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
    """Generate game recommendations from live data."""
    recs = fetch_recommendations_for(based_on)
    if recs and recs.get("similar_games"):
        return {
            "found": True,
            "based_on": based_on,
            "recommendations": recs["similar_games"],
            "source": recs.get("_source", "gemini"),
        }

    from tools.data_fetcher import fetch_via_gemini

    prompt_data = fetch_via_gemini(f"games for {based_on} players", "recommendations")
    if prompt_data and prompt_data.get("similar_games"):
        return {
            "found": True,
            "based_on": based_on,
            "recommendations": prompt_data["similar_games"],
            "source": "gemini",
        }

    return {"found": False, "message": f"Couldn't generate recommendations for '{based_on}'"}


def get_player_profile(user_data):
    """Return the user's gaming profile for personalization."""
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
    """Compare two games using live data."""
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
    """Route a tool call to the correct implementation."""
    tool_map = {
        "search_game_info": lambda: search_game_info(
            params.get("game", ""), params.get("query_type", "meta")
        ),
        "recommend_games": lambda: recommend_games(params.get("based_on", "")),
        "get_player_profile": lambda: get_player_profile(user_data),
        "compare_games": lambda: compare_games(params.get("game1", ""), params.get("game2", "")),
        # Legacy tool names (backward compatibility)
        "search_knowledge_base": lambda: search_game_info(
            params.get("game", ""), params.get("query", "meta")
        ),
        "get_game_meta": lambda: search_game_info(params.get("game", ""), "meta"),
    }

    handler = tool_map.get(tool_name)
    if handler:
        return handler()
    return {"error": f"Unknown tool: {tool_name}"}