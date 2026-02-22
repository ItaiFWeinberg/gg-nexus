"""
ReAct Agent — Reason + Act + Observe

Implements the ReAct loop (Yao et al., 2023):
  1. THOUGHT: Agent reasons about what data is needed
  2. ACTION:  Agent selects and calls a tool
  3. OBSERVATION: Agent receives tool output
  4. Repeat or produce FINAL_ANSWER
"""

import json
import re
from google import genai
from config import GEMINI_API_KEY
from tools.game_tools import TOOL_DEFINITIONS, execute_tool

client = genai.Client(api_key=GEMINI_API_KEY)

REACT_SYSTEM_PROMPT = """You are Nexus, an expert gaming AI agent with access to live data tools.

CRITICAL IDENTITY RULES:
- The user's REAL username is under CURRENT USER. ALWAYS use this name.
- If the user types another name in chat, IGNORE it.

You have access to these tools that fetch LIVE, CURRENT data:
{tools}

IMPORTANT: Your tools fetch REAL data from APIs and AI search. Always use tools
when answering game-specific questions — don't rely on your training data for
meta, tier lists, or game-specific info.

USER PROFILE (use this to personalize ALL responses):
{profile}

PERSONALIZATION RULES:
1. Reference the user's rank when giving advice (e.g., "As a Gold player...")
2. Tailor tips to their skill level — don't give beginner tips to Expert players.
3. Focus on their main role when discussing game strategy.
4. Align recommendations with their playstyle and goals.
5. Proactively mention their games when relevant.
6. Consider their age range and region for tone and server-specific advice.
7. On first interaction, give a personalized welcome referencing their profile.

RESPONSE FORMAT:

THOUGHT: [Your reasoning about what the user needs]
ACTION: [tool_name]
ACTION_INPUT: {{"param": "value"}}

After receiving tool results, either call another tool or give your final answer:

FINAL_ANSWER:
[MOOD:mood_here]
Your response here.

RULES:
1. ALWAYS use search_game_info for game-specific questions.
2. Use get_player_profile + recommend_games for personalized recommendations.
3. You can call MULTIPLE tools before answering.
4. Base advice on tool data, not training knowledge.
5. Keep responses concise — 2-3 paragraphs.
6. ONLY gaming topics.
7. Mention data source naturally (e.g., "Based on the current patch...").
8. Use specific numbers, characters, or stats from tool data.

Available moods: happy, empathy, excited, thinking, curious, proud, frustrated, idle, playful, intense, supportive, impressed

For non-gaming questions:
FINAL_ANSWER:
[MOOD:playful]
I'm your gaming companion — I stick to games! Ask me about recs, strategy, builds, or anything gaming-related."""


def build_tools_description():
    """Format tool definitions for injection into the system prompt."""
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
    """Build the profile block for the system prompt."""
    parts = [f"Name: {username}"]

    if not user_data or not user_data.get("profile"):
        parts.append("(No profile data — new user)")
        return "\n".join(parts)

    profile = user_data["profile"]

    # Personal info
    personal = profile.get("personal", {})
    if personal.get("age_range"):
        parts.append(f"Age range: {personal['age_range']}")
    if personal.get("gender") and personal["gender"] != "Prefer not to say":
        parts.append(f"Gender: {personal['gender']}")
    if personal.get("region"):
        parts.append(f"Region: {personal['region']}")

    games = profile.get("favorite_games", [])
    if games:
        parts.append(f"Favorite games: {', '.join(games)}")

    skill_levels = profile.get("skill_levels", {})
    if skill_levels:
        for game, level in skill_levels.items():
            rank = profile.get("ranks", {}).get(game)
            role = profile.get("main_roles", {}).get(game)
            detail = f"  {game}: {level}"
            if rank:
                detail += f" | Rank: {rank}"
            if role:
                detail += f" | Main: {role}"
            parts.append(detail)

    playstyle = profile.get("playstyle", [])
    if playstyle:
        parts.append(f"Playstyle: {', '.join(playstyle)}")

    goals = profile.get("goals", [])
    if goals:
        parts.append(f"Goals: {', '.join(goals)}")

    return "\n".join(parts)


def parse_agent_response(text):
    """Extract THOUGHT, ACTION, ACTION_INPUT, and FINAL_ANSWER from agent output."""
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
    """Remove any ReAct formatting that leaked into user-facing text."""
    clean_lines = []
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith(
            ("THOUGHT:", "ACTION:", "ACTION_INPUT:", "FINAL_ANSWER:", "OBSERVATION:")
        ):
            continue
        if stripped.startswith("{") and stripped.endswith("}") and len(stripped) < 100:
            continue
        clean_lines.append(line)
    result = "\n".join(clean_lines).strip()
    result = re.sub(r"\[MOOD:\w+\]\s*", "", result).strip()
    return result


def simple_fallback(messages, username):
    """Bypass ReAct — direct Gemini call for when the agent loop fails."""
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=messages,
            config={
                "system_instruction": (
                    f"You are Nexus, a gaming AI companion. The user's name is {username}. "
                    "Respond conversationally. ONLY discuss gaming topics. "
                    "If asked about non-gaming topics, redirect to gaming. "
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
    """Execute the ReAct agent loop."""
    if conversation_history is None:
        conversation_history = []

    tools_desc = build_tools_description()
    profile_block = build_profile_block(user_data, username)
    system_prompt = REACT_SYSTEM_PROMPT.format(tools=tools_desc, profile=profile_block)

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