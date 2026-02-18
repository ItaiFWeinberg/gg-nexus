import json
import os
import requests
from pathlib import Path
from google import genai
from config import GEMINI_API_KEY
from models.cache import get_cached, set_cached

client = genai.Client(api_key=GEMINI_API_KEY)

# Riot API key (optional — works without it using Gemini fallback)
RIOT_API_KEY = os.getenv("RIOT_API_KEY", "")

# Static fallback
KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"


def _load_static_fallback(game_key):
    filepath = KNOWLEDGE_DIR / "games.json"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get(game_key)
    return None


# === RIOT API INTEGRATION ===

def fetch_riot_lol_data():
    """Fetch live League of Legends data from Riot API."""
    if not RIOT_API_KEY:
        return None

    try:
        # Get current patch version
        version_url = "https://ddragon.leagueoflegends.com/api/versions.json"
        versions = requests.get(version_url, timeout=5).json()
        current_patch = versions[0] if versions else "unknown"

        # Get champion data (no API key needed for Data Dragon)
        champ_url = f"https://ddragon.leagueoflegends.com/cdn/{current_patch}/data/en_US/champion.json"
        champ_data = requests.get(champ_url, timeout=5).json()

        # Get free champion rotation (needs API key)
        rotation_url = "https://na1.api.riotgames.com/lol/platform/v3/champion-rotations"
        headers = {"X-Riot-Token": RIOT_API_KEY}
        rotation = requests.get(rotation_url, headers=headers, timeout=5).json()

        champion_names = {int(v["key"]): v["name"] for v in champ_data["data"].values()}
        free_champs = [champion_names.get(cid, f"ID:{cid}") for cid in rotation.get("freeChampionIds", [])]

        return {
            "source": "riot_api",
            "patch": current_patch,
            "total_champions": len(champ_data["data"]),
            "free_rotation": free_champs,
        }
    except Exception as e:
        print(f"[WARN] Riot API failed: {e}")
        return None


def fetch_riot_valorant_data():
    """Fetch live Valorant data from Riot/unofficial APIs."""
    try:
        # Valorant API (unofficial but reliable)
        agents_url = "https://valorant-api.com/v1/agents?isPlayableCharacter=true"
        response = requests.get(agents_url, timeout=5)
        if response.status_code == 200:
            agents_data = response.json().get("data", [])
            agents_by_role = {}
            for agent in agents_data:
                role = agent.get("role", {}).get("displayName", "Unknown")
                name = agent.get("displayName", "Unknown")
                if role not in agents_by_role:
                    agents_by_role[role] = []
                agents_by_role[role].append(name)

            return {
                "source": "valorant_api",
                "total_agents": len(agents_data),
                "agents_by_role": agents_by_role,
            }
    except Exception as e:
        print(f"[WARN] Valorant API failed: {e}")
    return None


# === GEMINI AI SEARCH (works for ANY game) ===

def fetch_via_gemini(game_name, query_type="meta"):
    """Use Gemini to get current game information.
    
    This is the universal fallback — works for ANY game because
    Gemini has broad knowledge. We structure the prompt to get
    consistent, parseable data back.
    """
    prompts = {
        "meta": f"""Provide the current meta information for {game_name} as of today. 
Include:
- Current patch/version/season
- Top tier characters/champions/agents/weapons (whatever applies)
- Current meta summary (2-3 sentences)
- 5 specific tips for ranked/competitive play

Respond in valid JSON format like this:
{{"patch": "...", "top_tier": {{"role1": ["char1", "char2"], "role2": ["char3"]}}, "meta_summary": "...", "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]}}
Only respond with JSON, no markdown formatting.""",

        "general": f"""Provide general information about {game_name}.
Include:
- Developer
- Genre (list)
- Platforms
- Player count format
- Brief description (2 sentences)
- Difficulty level
- Time per match
- Free to play or not
- 5 beginner tips

Respond in valid JSON format:
{{"developer": "...", "genre": ["..."], "platforms": ["..."], "player_count": "...", "description": "...", "difficulty": "...", "time_commitment": "...", "free_to_play": true, "beginner_tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]}}
Only respond with JSON, no markdown formatting.""",

        "recommendations": f"""Suggest 6 games similar to {game_name} and explain briefly why each is similar.
Respond in valid JSON format:
{{"similar_games": [{{"name": "...", "reason": "..."}}, ...]}}
Only respond with JSON, no markdown formatting.""",
    }

    prompt = prompts.get(query_type, prompts["general"])

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config={"temperature": 0.3, "max_output_tokens": 800}
        )

        text = response.text.strip()
        # Clean markdown code blocks if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError:
        # If JSON parsing fails, return the raw text
        return {"raw_response": response.text, "source": "gemini_raw"}
    except Exception as e:
        print(f"[WARN] Gemini fetch failed for {game_name}: {e}")
        return None


# === MAIN FETCH FUNCTION ===

def fetch_game_data(game_name, query_type="meta", force_refresh=False):
    """
    Fetch game data using the best available source.
    
    Priority chain:
    1. MongoDB cache (if fresh)
    2. Official API (Riot for LoL/Val/TFT)
    3. Gemini AI search (universal fallback)
    4. Static JSON (last resort)
    
    Returns dict with data + metadata about source.
    """
    cache_key = f"game:{game_name.lower().replace(' ', '_')}:{query_type}"

    # 1. Check cache first (unless force refresh)
    if not force_refresh:
        cached = get_cached(cache_key)
        if cached:
            cached["_cache"] = "hit"
            return cached

    # 2. Try official APIs for supported games
    api_data = None
    game_lower = game_name.lower()

    if any(g in game_lower for g in ["league", "lol"]):
        api_data = fetch_riot_lol_data()
    elif "valorant" in game_lower:
        api_data = fetch_riot_valorant_data()

    if api_data:
        # Merge API data with Gemini-generated meta
        gemini_data = fetch_via_gemini(game_name, query_type)
        if gemini_data:
            api_data.update(gemini_data)
        api_data["_source"] = "api+gemini"
        set_cached(cache_key, api_data, source="api+gemini")
        api_data["_cache"] = "miss"
        return api_data

    # 3. Gemini AI search (works for ANY game)
    gemini_data = fetch_via_gemini(game_name, query_type)
    if gemini_data:
        gemini_data["_source"] = "gemini"
        set_cached(cache_key, gemini_data, source="gemini")
        gemini_data["_cache"] = "miss"
        return gemini_data

    # 4. Static fallback
    normalized_key = game_name.lower().replace(" ", "_")
    static_data = _load_static_fallback(normalized_key)
    if static_data:
        static_data["_source"] = "static_fallback"
        static_data["_cache"] = "fallback"
        return static_data

    return {
        "_source": "none",
        "_cache": "miss",
        "error": f"Could not find data for '{game_name}'"
    }


def fetch_recommendations_for(game_name):
    """Get dynamic recommendations for a game."""
    cache_key = f"recs:{game_name.lower().replace(' ', '_')}"

    cached = get_cached(cache_key)
    if cached:
        cached["_cache"] = "hit"
        return cached

    data = fetch_via_gemini(game_name, "recommendations")
    if data:
        data["_source"] = "gemini"
        set_cached(cache_key, data, source="gemini")
        return data

    # Fallback to static recommendations
    filepath = KNOWLEDGE_DIR / "recommendations.json"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            recs = json.load(f)
            if_you_like = recs.get("if_you_like", {}).get(game_name, [])
            if if_you_like:
                return {"similar_games": [{"name": g, "reason": ""} for g in if_you_like]}

    return {"similar_games": [], "error": "No recommendations found"}