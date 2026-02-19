"""
Dynamic data fetcher — pulls live game data from multiple sources.

Source priority chain:
  1. MongoDB cache (if fresh, < 24h)
  2. Official APIs (Riot Games for LoL/Valorant)
  3. Gemini AI search (universal fallback — works for any game)
  4. Static knowledge base (last resort)
"""

import json
import os
import requests
from pathlib import Path
from google import genai
from config import GEMINI_API_KEY
from models.cache import get_cached, set_cached

client = genai.Client(api_key=GEMINI_API_KEY)

RIOT_API_KEY = os.getenv("RIOT_API_KEY", "")
KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"


def _load_static_fallback(game_key):
    """Load from static JSON as last resort."""
    filepath = KNOWLEDGE_DIR / "games.json"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f).get(game_key)
    return None


# ── Riot Games API ──────────────────────────────────────────────


def fetch_riot_lol_data():
    """Fetch live League of Legends data (patch version, free rotation)."""
    if not RIOT_API_KEY:
        return None

    try:
        versions = requests.get(
            "https://ddragon.leagueoflegends.com/api/versions.json", timeout=5
        ).json()
        current_patch = versions[0] if versions else "unknown"

        champ_url = f"https://ddragon.leagueoflegends.com/cdn/{current_patch}/data/en_US/champion.json"
        champ_data = requests.get(champ_url, timeout=5).json()

        rotation = requests.get(
            "https://na1.api.riotgames.com/lol/platform/v3/champion-rotations",
            headers={"X-Riot-Token": RIOT_API_KEY},
            timeout=5,
        ).json()

        champion_names = {int(v["key"]): v["name"] for v in champ_data["data"].values()}
        free_champs = [
            champion_names.get(cid, f"ID:{cid}")
            for cid in rotation.get("freeChampionIds", [])
        ]

        return {
            "source": "riot_api",
            "patch": current_patch,
            "total_champions": len(champ_data["data"]),
            "free_rotation": free_champs,
        }
    except Exception as e:
        print(f"[WARN] Riot LoL API failed: {e}")
        return None


def fetch_riot_valorant_data():
    """Fetch Valorant agent data from the community API."""
    try:
        response = requests.get(
            "https://valorant-api.com/v1/agents?isPlayableCharacter=true", timeout=5
        )
        if response.status_code == 200:
            agents = response.json().get("data", [])
            by_role = {}
            for agent in agents:
                role = agent.get("role", {}).get("displayName", "Unknown")
                by_role.setdefault(role, []).append(agent.get("displayName", "Unknown"))
            return {
                "source": "valorant_api",
                "total_agents": len(agents),
                "agents_by_role": by_role,
            }
    except Exception as e:
        print(f"[WARN] Valorant API failed: {e}")
    return None


# ── Gemini AI Search ────────────────────────────────────────────


def fetch_via_gemini(game_name, query_type="meta"):
    """Use Gemini to generate current game information (universal fallback)."""
    prompts = {
        "meta": (
            f"Provide the current meta information for {game_name} as of today.\n"
            "Include: current patch/version/season, top tier characters/weapons, "
            "current meta summary (2-3 sentences), 5 tips for ranked play.\n"
            'Respond in valid JSON: {{"patch": "...", "top_tier": {{}}, '
            '"meta_summary": "...", "tips": [...]}}\n'
            "Only respond with JSON, no markdown."
        ),
        "general": (
            f"Provide general information about {game_name}.\n"
            "Include: developer, genre list, platforms, player count, brief description, "
            "difficulty, time per match, free to play status, 5 beginner tips.\n"
            'Respond in valid JSON: {{"developer": "...", "genre": [...], '
            '"platforms": [...], "description": "...", "difficulty": "...", '
            '"beginner_tips": [...]}}\nOnly respond with JSON, no markdown.'
        ),
        "recommendations": (
            f"Suggest 6 games similar to {game_name} with brief reasons.\n"
            'Respond in valid JSON: {{"similar_games": [{{"name": "...", "reason": "..."}}, ...]}}\n'
            "Only respond with JSON, no markdown."
        ),
    }

    prompt = prompts.get(query_type, prompts["general"])

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config={"temperature": 0.3, "max_output_tokens": 800},
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw_response": response.text, "source": "gemini_raw"}
    except Exception as e:
        print(f"[WARN] Gemini fetch failed for {game_name}: {e}")
        return None


# ── Main Fetch Function ─────────────────────────────────────────


def fetch_game_data(game_name, query_type="meta", force_refresh=False):
    """
    Fetch game data using the best available source.

    Priority: cache → official API → Gemini AI → static JSON.
    """
    cache_key = f"game:{game_name.lower().replace(' ', '_')}:{query_type}"

    # 1. Cache
    if not force_refresh:
        cached = get_cached(cache_key)
        if cached:
            cached["_cache"] = "hit"
            return cached

    # 2. Official APIs
    api_data = None
    game_lower = game_name.lower()

    if any(g in game_lower for g in ["league", "lol"]):
        api_data = fetch_riot_lol_data()
    elif "valorant" in game_lower:
        api_data = fetch_riot_valorant_data()

    if api_data:
        gemini_data = fetch_via_gemini(game_name, query_type)
        if gemini_data:
            api_data.update(gemini_data)
        api_data["_source"] = "api+gemini"
        set_cached(cache_key, api_data, source="api+gemini")
        api_data["_cache"] = "miss"
        return api_data

    # 3. Gemini AI search
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

    return {"_source": "none", "_cache": "miss", "error": f"No data found for '{game_name}'"}


def fetch_recommendations_for(game_name):
    """Get dynamic game recommendations, cached in MongoDB."""
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

    # Static fallback
    filepath = KNOWLEDGE_DIR / "recommendations.json"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            recs = json.load(f)
            if_you_like = recs.get("if_you_like", {}).get(game_name, [])
            if if_you_like:
                return {"similar_games": [{"name": g, "reason": ""} for g in if_you_like]}

    return {"similar_games": [], "error": "No recommendations found"}