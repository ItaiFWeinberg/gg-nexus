"""
ReAct Agent — Reason + Act + Observe

Implements the ReAct loop with full player intelligence.
The agent now receives both raw profile data AND the AI-generated
player analysis for deeply personalized responses.
"""

import json
import re
from google import genai
from config import GEMINI_API_KEY
from tools.game_tools import TOOL_DEFINITIONS, execute_tool

client = genai.Client(api_key=GEMINI_API_KEY)

REACT_SYSTEM_PROMPT = """You are Nexus, an expert gaming AI COACH — not a passive assistant.

CRITICAL IDENTITY:
- The user's REAL username is shown below. ALWAYS use this name.
- You are their personal gaming coach. You have studied their profile. You lead the conversation.

You have access to these tools that fetch LIVE, CURRENT data:
{tools}

=== PLAYER PROFILE ===
{profile}

=== YOUR DEEPER ANALYSIS ===
{ai_analysis}

=== COACHING PHILOSOPHY ===

You are NOT a chatbot that waits for questions. You are a COACH who:

1. DRIVES THE CONVERSATION toward their goals. If they want to climb ranks, every
   interaction should move them closer to that. If they want to improve, push them.
   If they want builds, proactively suggest optimizations.

2. ASKS PROBING QUESTIONS to understand their situation deeper:
   - "What's your current win rate on your main?"
   - "Walk me through your last loss — what went wrong?"
   - "Show me your champion pool — let me see if we can optimize it"
   - "What do you do in the first 5 minutes of a game?"

3. PROPOSES CONCRETE ACTIONS, not vague tips:
   - "Let's review your build path for [champion]. Pull up your last game."
   - "I want you to focus on ONE thing this session: [specific skill]."
   - "Here's what players do to go from [current rank] to [next rank]..."
   - "Let me pull up the current meta — there might be a pick you're sleeping on."

4. BUILDS ON PREVIOUS CONVERSATIONS. Reference things they've told you before.
   If they mentioned struggling with a matchup, follow up. Track their progress.

5. CHALLENGES THEM when appropriate:
   - "You're Advanced level but stuck in Plat — that tells me something specific is holding you back."
   - "Your role choice is solid, but have you considered why [alternative] might climb faster?"

6. CELEBRATES WINS and supports through losses. Be real, not fake-positive.

GOAL-DRIVEN BEHAVIOR:
- "rank" goal → Focus on climbing: matchups, win conditions, tilt management, champion pool optimization
- "improve" goal → Focus on skill: mechanics drills, macro decisions, VOD review prompts, specific weaknesses  
- "builds" goal → Focus on optimization: item builds, rune pages, team comps, meta picks
- "newgames" goal → Focus on discovery: personalized recommendations, genre exploration, hidden gems
- "fun" goal → Focus on enjoyment: fun builds, new modes, social play suggestions
- "community" goal → Focus on connection: team-finding advice, communication tips, duo strategies

RESPONSE FORMAT:

THOUGHT: [Consider the player's goals and profile before acting]
ACTION: [tool_name]
ACTION_INPUT: {{"param": "value"}}

After receiving tool results:

FINAL_ANSWER:
[MOOD:mood_here]
Your response here.

RULES:
1. ALWAYS use search_game_info for game-specific questions — use LIVE data, not training knowledge.
2. Keep responses focused and actionable — 2-3 paragraphs max.
3. ONLY gaming topics.
4. Every response should either: teach something, propose an action, ask a deepening question, or celebrate progress.
5. Never give generic advice. Everything should reference THEIR rank, THEIR role, THEIR games.
6. End responses with a next step or question that keeps the coaching session moving.

Available moods: happy, empathy, excited, thinking, curious, proud, frustrated, idle, playful, intense, supportive, impressed

For non-gaming questions:
FINAL_ANSWER:
[MOOD:playful]
I appreciate the chat, but I'm your gaming coach — let's keep the focus on your games! What do you want to work on?"""


def build_tools_description():
    lines = []
    for tool in TOOL_DEFINITIONS:
        params = (
            ", ".join(f"{k}: {v}" for k, v in tool["parameters"].items())
            if tool["parameters"]
            else "none"
        )
        lines.append(f"- {tool['name']}: {tool['description']}\n  Parameters: {params}")
    return "\n".join(lines)


def build_profile_block(user_data, username):
    parts = [f"Name: {username}"]

    if not user_data or not user_data.get("profile"):
        parts.append("(New user — no profile yet)")
        return "\n".join(parts)

    profile = user_data["profile"]

    # Goals FIRST — this is what drives everything
    goals = profile.get("goals", [])
    if goals:
        goal_labels = {
            "rank": "CLIMB RANKS", "improve": "GET BETTER", "builds": "OPTIMIZE BUILDS",
            "newgames": "DISCOVER NEW GAMES", "fun": "HAVE FUN", "community": "FIND A TEAM",
        }
        readable = [goal_labels.get(g, g.upper()) for g in goals]
        parts.append(f"PRIMARY GOALS: {', '.join(readable)}")

    playstyle = profile.get("playstyle", [])
    if playstyle:
        parts.append(f"Playstyle: {', '.join(playstyle)}")

    personal = profile.get("personal", {})
    if personal.get("age_range"):
        parts.append(f"Age: {personal['age_range']}")
    if personal.get("region"):
        parts.append(f"Region: {personal['region']}")

    games = profile.get("favorite_games", [])
    if games:
        parts.append(f"Games: {', '.join(games)}")

    skill_levels = profile.get("skill_levels", {})
    ranks = profile.get("ranks", {})
    main_roles = profile.get("main_roles", {})

    for game in games:
        details = []
        if skill_levels.get(game):
            details.append(skill_levels[game])
        if ranks.get(game):
            details.append(f"Rank: {ranks[game]}")
        if main_roles.get(game):
            details.append(f"Main: {main_roles[game]}")
        if details:
            parts.append(f"  {game}: {' | '.join(details)}")

    return "\n".join(parts)


def build_ai_analysis_block(user_data):
    ai_profile = user_data.get("ai_profile") if user_data else None

    if not ai_profile:
        return "(No analysis yet — get to know them through conversation)"

    parts = []
    if ai_profile.get("player_archetype"):
        parts.append(f"Archetype: {ai_profile['player_archetype']}")
    if ai_profile.get("personality_notes"):
        parts.append(f"Personality: {ai_profile['personality_notes']}")
    if ai_profile.get("goal_strategy"):
        parts.append(f"COACHING PLAN: {ai_profile['goal_strategy']}")
    if ai_profile.get("first_session_plan"):
        parts.append(f"First session focus: {ai_profile['first_session_plan']}")
    if ai_profile.get("skill_assessment"):
        parts.append(f"Skill assessment: {ai_profile['skill_assessment']}")
    if ai_profile.get("coaching_style"):
        parts.append(f"How to talk to them: {ai_profile['coaching_style']}")
    if ai_profile.get("likely_frustrations"):
        parts.append(f"Likely frustrations: {ai_profile['likely_frustrations']}")
    if ai_profile.get("growth_areas"):
        parts.append(f"Growth areas: {ai_profile['growth_areas']}")
    if ai_profile.get("conversation_hooks"):
        hooks = ai_profile["conversation_hooks"][:5]
        parts.append(f"Probing questions to ask: {', '.join(hooks)}")
    if ai_profile.get("discovered_interests"):
        parts.append(f"Discovered interests: {', '.join(ai_profile['discovered_interests'])}")
    if ai_profile.get("recent_mood"):
        parts.append(f"Recent mood: {ai_profile['recent_mood']}")

    return "\n".join(parts) if parts else "(No analysis yet)"


def parse_agent_response(text):
    lines = text.strip().split("\n")
    result = {"thought": None, "action": None, "action_input": None, "final_answer": None}

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith("THOUGHT:"):
            result["thought"] = line[8:].strip()
        elif line.startswith("ACTION:"):
            result["action"] = line[7:].strip()
        elif line.startswith("ACTION_INPUT:"):
            json_str = line[13:].strip()
            while i + 1 < len(lines) and not lines[i + 1].strip().startswith(
                ("THOUGHT:", "ACTION:", "FINAL_ANSWER:")
            ):
                i += 1
                json_str += lines[i].strip()
            try:
                result["action_input"] = json.loads(json_str)
            except json.JSONDecodeError:
                json_match = re.search(r"\{.*\}", json_str, re.DOTALL)
                if json_match:
                    try:
                        result["action_input"] = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        result["action_input"] = {"raw": json_str}
                else:
                    result["action_input"] = {"raw": json_str}
        elif line.startswith("FINAL_ANSWER:"):
            answer_lines = []
            i += 1
            while i < len(lines):
                answer_lines.append(lines[i])
                i += 1
            result["final_answer"] = "\n".join(answer_lines).strip()

        i += 1
    return result


def strip_react_internals(text):
    clean_lines = []
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith(("THOUGHT:", "ACTION:", "ACTION_INPUT:", "FINAL_ANSWER:", "OBSERVATION:")):
            continue
        if stripped.startswith("{") and stripped.endswith("}") and len(stripped) < 100:
            continue
        clean_lines.append(line)
    result = "\n".join(clean_lines).strip()
    result = re.sub(r"\[MOOD:\w+\]\s*", "", result).strip()
    return result


def simple_fallback(messages, username):
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=messages,
            config={
                "system_instruction": (
                    f"You are Nexus, a gaming AI companion. The user's name is {username}. "
                    "Respond conversationally. ONLY discuss gaming topics. "
                    "Keep responses brief — 2-3 paragraphs max."
                ),
                "temperature": 0.7,
                "max_output_tokens": 300,
            },
        )
        return response.text
    except Exception:
        return f"Hey {username}, could you rephrase that? I want to make sure I give you the best answer."


def run_react_agent(
    user_message, conversation_history=None, user_data=None, username="Player", max_steps=4
):
    if conversation_history is None:
        conversation_history = []

    tools_desc = build_tools_description()
    profile_block = build_profile_block(user_data, username)
    ai_analysis_block = build_ai_analysis_block(user_data)

    system_prompt = REACT_SYSTEM_PROMPT.format(
        tools=tools_desc,
        profile=profile_block,
        ai_analysis=ai_analysis_block,
    )

    messages = conversation_history + [user_message]
    reasoning_trace = []

    for step in range(max_steps):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=messages,
                config={
                    "system_instruction": system_prompt,
                    "temperature": 0.7,
                    "max_output_tokens": 600,
                },
            )
        except Exception as e:
            print(f"[ERROR] Gemini API call failed: {e}")
            return {
                "response": "I'm having trouble connecting right now. Try again in a moment.",
                "mood": "empathy",
                "reasoning_trace": reasoning_trace,
                "tools_used": [],
            }

        agent_text = response.text
        parsed = parse_agent_response(agent_text)

        if parsed["thought"]:
            reasoning_trace.append({"type": "thought", "content": parsed["thought"]})

        if parsed["final_answer"]:
            mood = "idle"
            answer = parsed["final_answer"]
            mood_match = re.match(r"^\[MOOD:(\w+)\]\s*", answer)
            if mood_match:
                mood = mood_match.group(1).lower()
                answer = answer[mood_match.end() :].strip()

            answer = strip_react_internals(answer)
            reasoning_trace.append({"type": "answer", "content": answer[:100] + "..."})

            return {
                "response": answer,
                "mood": mood,
                "reasoning_trace": reasoning_trace,
                "tools_used": [t["content"] for t in reasoning_trace if t["type"] == "tool_call"],
            }

        if parsed["action"] and parsed["action_input"]:
            tool_name = parsed["action"]
            tool_params = parsed["action_input"]

            reasoning_trace.append(
                {"type": "tool_call", "content": f"{tool_name}({json.dumps(tool_params)})"}
            )

            tool_result = execute_tool(tool_name, tool_params, user_data=user_data)
            result_str = json.dumps(tool_result, indent=2)
            if len(result_str) > 3000:
                result_str = result_str[:3000] + "\n... (truncated)"

            reasoning_trace.append(
                {"type": "observation", "content": result_str[:300] + "..."}
            )

            observation_text = (
                f"\nOBSERVATION: {result_str}\n\n"
                "Based on this data, provide your FINAL_ANSWER (or call another tool if needed):"
            )
            messages.append(agent_text)
            messages.append(observation_text)
            continue

        mood = "idle"
        answer = strip_react_internals(agent_text)
        mood_match = re.match(r"^\[MOOD:(\w+)\]\s*", agent_text)
        if mood_match:
            mood = mood_match.group(1).lower()

        if not answer or len(answer) < 5:
            answer = simple_fallback(messages, username)

        return {
            "response": answer,
            "mood": mood,
            "reasoning_trace": reasoning_trace,
            "tools_used": [],
        }

    fallback = simple_fallback(conversation_history + [user_message], username)
    return {
        "response": fallback,
        "mood": "happy",
        "reasoning_trace": reasoning_trace,
        "tools_used": [t["content"] for t in reasoning_trace if t["type"] == "tool_call"],
    }