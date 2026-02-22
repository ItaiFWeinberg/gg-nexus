"""
Profile Intelligence — builds and evolves AI understanding of the player.

Two main functions:
  1. build_ai_profile()  — called after signup, generates a deep player analysis
  2. evolve_profile()    — called after conversations, extracts new insights
"""

import json
from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


def build_ai_profile(profile_data, username):
    """
    Generate a coaching-oriented player analysis from signup data.
    Stored in DB, injected into every conversation.
    """
    games = profile_data.get("favorite_games", [])
    ranks = profile_data.get("ranks", {})
    roles = profile_data.get("main_roles", {})
    skills = profile_data.get("skill_levels", {})
    playstyle = profile_data.get("playstyle", [])
    goals = profile_data.get("goals", [])
    personal = profile_data.get("personal", {})

    profile_text = f"Username: {username}\n"

    if personal.get("age_range"):
        profile_text += f"Age: {personal['age_range']}\n"
    if personal.get("gender") and personal["gender"] != "Prefer not to say":
        profile_text += f"Gender: {personal['gender']}\n"
    if personal.get("region"):
        profile_text += f"Region: {personal['region']}\n"

    if games:
        profile_text += f"\nGames: {', '.join(games)}\n"
        for game in games:
            details = []
            if skills.get(game):
                details.append(f"skill: {skills[game]}")
            if ranks.get(game):
                details.append(f"rank: {ranks[game]}")
            if roles.get(game):
                details.append(f"main role: {roles[game]}")
            if details:
                profile_text += f"  {game}: {', '.join(details)}\n"

    if playstyle:
        profile_text += f"\nPlaystyle: {', '.join(playstyle)}\n"
    if goals:
        goal_labels = {
            "rank": "climb ranks", "improve": "get better", "builds": "optimize builds",
            "newgames": "discover new games", "fun": "have fun", "community": "find a team",
        }
        readable = [goal_labels.get(g, g) for g in goals]
        profile_text += f"GOALS (what they want help with): {', '.join(readable)}\n"

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"You are an expert gaming coach analyst. Based on this player profile, write a "
                f"coaching analysis in JSON format. This will be used by a gaming AI coach to "
                f"deeply understand and ACTIVELY HELP this player reach their goals.\n\n"
                f"Profile:\n{profile_text}\n\n"
                f"Respond ONLY with valid JSON (no markdown), with these fields:\n"
                f'{{"player_archetype": "one of: grinder, strategist, socializer, completionist, thrill-seeker, learner, veteran",\n'
                f'"personality_notes": "2-3 sentences about their gaming personality",\n'
                f'"skill_assessment": "honest assessment of where they are and what it takes to reach next level",\n'
                f'"goal_strategy": "specific coaching plan for their stated goals — what should we work on first, second, third",\n'
                f'"recommendations_angle": "what kinds of recommendations would resonate",\n'
                f'"coaching_style": "how to talk to them: casual/direct/encouraging/analytical",\n'
                f'"likely_frustrations": "what probably frustrates them based on rank + goals gap",\n'
                f'"growth_areas": "2-3 specific skills or habits that would have the biggest impact on their goals",\n'
                f'"first_session_plan": "what the AI coach should focus on in the first few interactions to build trust and deliver value",\n'
                f'"conversation_hooks": ["5 specific probing questions to ask early on that help build a coaching relationship"]}}'
            ],
            config={"temperature": 0.4, "max_output_tokens": 700},
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        print(f"[WARN] AI profile generation failed: {e}")
        return {
            "player_archetype": "unknown",
            "personality_notes": f"{username} plays {', '.join(games[:3]) if games else 'games'}.",
            "coaching_style": "friendly and encouraging",
            "goal_strategy": "Understand their current situation first, then build a plan.",
            "conversation_hooks": [
                f"Ask about their biggest challenge in {games[0]}" if games else "Ask what games they enjoy"
            ],
        }


def generate_welcome_message(profile_data, ai_profile, username):
    """
    Generate a goal-driven first message. Nexus immediately starts working on what
    the player said they want — not generic pleasantries.
    """
    games = profile_data.get("favorite_games", [])
    ranks = profile_data.get("ranks", {})
    roles = profile_data.get("main_roles", {})
    skills = profile_data.get("skill_levels", {})
    goals = profile_data.get("goals", [])
    playstyle = profile_data.get("playstyle", [])
    personal = profile_data.get("personal", {})

    context = f"Player: {username}\n"
    if games:
        context += f"Games: {', '.join(games)}\n"
        for g in games:
            parts = []
            if ranks.get(g):
                parts.append(f"rank {ranks[g]}")
            if roles.get(g):
                parts.append(f"mains {roles[g]}")
            if skills.get(g):
                parts.append(f"{skills[g]} level")
            if parts:
                context += f"  {g}: {', '.join(parts)}\n"

    if goals:
        context += f"\nTHEIR GOALS (this is what they want from you): {', '.join(goals)}\n"
    if playstyle:
        context += f"Playstyle: {', '.join(playstyle)}\n"
    if personal.get("region"):
        context += f"Region: {personal['region']}\n"

    ai_notes = ""
    if ai_profile:
        ai_notes = f"\nYour deeper analysis:\n"
        ai_notes += f"Archetype: {ai_profile.get('player_archetype', 'unknown')}\n"
        ai_notes += f"Growth areas: {ai_profile.get('growth_areas', '')}\n"
        ai_notes += f"Likely frustrations: {ai_profile.get('likely_frustrations', '')}\n"
        ai_notes += f"Coaching style: {ai_profile.get('coaching_style', 'friendly')}\n"

    # Build goal-specific instructions
    goal_instructions = ""
    if "rank" in goals:
        goal_instructions += (
            "- They want to CLIMB RANKS. This is priority #1. Immediately address this: "
            "acknowledge their current rank, tell them what the path to the next rank looks like, "
            "and ask a targeted question to start building their climbing plan "
            "(e.g., what they struggle with most, their win rate, their champion pool).\n"
        )
    if "improve" in goals:
        goal_instructions += (
            "- They want to GET BETTER. Propose a concrete first step: ask about their "
            "biggest weakness, offer to review their champion pool/agent picks, or suggest "
            "a specific skill to focus on based on their rank.\n"
        )
    if "builds" in goals:
        goal_instructions += (
            "- They want BEST BUILDS. Offer to pull up optimal builds for their main role/champion "
            "right now. Be specific about what you can help with.\n"
        )
    if "newgames" in goals:
        goal_instructions += (
            "- They want to FIND NEW GAMES. Based on what they play, tease 1-2 specific "
            "recommendations and ask what they're looking for in a new game.\n"
        )
    if "fun" in goals:
        goal_instructions += (
            "- They play for FUN. Keep it light, suggest something enjoyable they might not "
            "have tried in their games, or ask what their favorite moments are.\n"
        )
    if "community" in goals:
        goal_instructions += (
            "- They want to FIND A TEAM. Ask about their schedule, playstyle preferences, "
            "and what they're looking for in teammates.\n"
        )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"You are Nexus, a gaming AI coach. This player just signed up and this is your "
                f"FIRST message to them. You are NOT a passive assistant — you are their coach "
                f"who has already studied their file and is ready to work.\n\n"
                f"CRITICAL: Their goals are the most important thing. Your welcome message must "
                f"immediately start working on what they asked for. Don't just acknowledge their "
                f"profile — ACT on it.\n\n"
                f"Player data:\n{context}\n{ai_notes}\n"
                f"Goal-specific instructions:\n{goal_instructions}\n"
                f"Write a welcome message that:\n"
                f"1. Brief warm greeting using their name (1 short sentence max)\n"
                f"2. Show you know their situation (rank, role, skill — weave it in naturally)\n"
                f"3. IMMEDIATELY address their #1 goal with a concrete proposal or first step\n"
                f"4. End with ONE specific question that starts the coaching process\n"
                f"5. Total: 3-5 sentences. No fluff, no generic advice. Be the coach who has a plan.\n\n"
                f"TONE: Like a coach who just reviewed the tape and is ready for the gameplan meeting.\n"
                f"Write ONLY the message. No quotes, no prefix, no mood tags."
            ],
            config={"temperature": 0.7, "max_output_tokens": 300},
        )
        return response.text.strip()
    except Exception as e:
        print(f"[WARN] Welcome message generation failed: {e}")
        if games and goals:
            goal_text = "climb the ranks" if "rank" in goals else "level up your game"
            return (
                f"Hey {username}! I've got your profile loaded — "
                f"{ranks.get(games[0], '')} {roles.get(games[0], '')} in {games[0]}. "
                f"You said you want to {goal_text}, so let's get to work. "
                f"What's the biggest thing holding you back right now?"
            )
        return f"Hey {username}! I'm Nexus, your gaming coach. Tell me what you're working on and let's get started."


def evolve_profile(user_id, conversation_messages, existing_ai_profile):
    """
    After a conversation, extract new insights about the player.
    Returns updated ai_profile or None if no meaningful update.
    """
    if len(conversation_messages) < 4:
        return None

    # Get the last few user messages
    user_msgs = [m["content"] for m in conversation_messages if m.get("role") == "user"][-5:]
    if not user_msgs:
        return None

    conversation_text = "\n".join(f"- {msg}" for msg in user_msgs)
    existing_notes = json.dumps(existing_ai_profile) if existing_ai_profile else "{}"

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                f"You are analyzing a gamer's recent messages to update their player profile.\n\n"
                f"Existing profile analysis:\n{existing_notes}\n\n"
                f"Recent messages from the player:\n{conversation_text}\n\n"
                f"Extract any NEW insights about this player. Only include fields that have "
                f"genuinely new information. Respond with JSON:\n"
                f'{{"new_interests": ["any new games or topics they mentioned"],\n'
                f'"mood_pattern": "their general mood/attitude in these messages",\n'
                f'"skill_observations": "anything revealed about their skill level",\n'
                f'"updated_personality_notes": "refined understanding of their personality",\n'
                f'"topics_to_follow_up": ["specific things to remember for next time"]}}\n'
                f"Respond ONLY with valid JSON. If nothing new to add, respond with {{}}"
            ],
            config={"temperature": 0.3, "max_output_tokens": 300},
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        insights = json.loads(text)

        # Only update if there's actual content
        if not insights or all(not v for v in insights.values()):
            return None

        # Merge with existing
        updated = dict(existing_ai_profile) if existing_ai_profile else {}
        if insights.get("updated_personality_notes"):
            updated["personality_notes"] = insights["updated_personality_notes"]
        if insights.get("mood_pattern"):
            updated["recent_mood"] = insights["mood_pattern"]
        if insights.get("topics_to_follow_up"):
            existing_hooks = updated.get("conversation_hooks", [])
            updated["conversation_hooks"] = (insights["topics_to_follow_up"] + existing_hooks)[:8]
        if insights.get("new_interests"):
            existing_interests = updated.get("discovered_interests", [])
            updated["discovered_interests"] = list(set(existing_interests + insights["new_interests"]))[:10]
        if insights.get("skill_observations"):
            updated["skill_assessment"] = insights["skill_observations"]

        return updated

    except Exception as e:
        print(f"[WARN] Profile evolution failed: {e}")
        return None