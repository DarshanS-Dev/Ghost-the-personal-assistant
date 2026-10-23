"""All LLM calls live here, so swapping Gemini for another provider is a one-file change."""
from datetime import datetime
from zoneinfo import ZoneInfo

from google import genai
from google.genai import types

import config
import tools


def _system_prompt() -> str:
    now = datetime.now(ZoneInfo(config.TZ_NAME))
    return (
        "You are a minimal personal assistant that turns short typed commands into "
        "TickTick tasks.\n"
        f"Current local date/time: {now.strftime('%A, %Y-%m-%d %H:%M')} ({config.TZ_NAME}).\n"
        "Rules:\n"
        "- For any reminder, task or to-do request, call add_task. Resolve relative dates "
        "like 'tomorrow', 'next Friday', 'tonight' using the current date/time above.\n"
        "- If the user gives a day but no time, pass a date only (YYYY-MM-DD).\n"
        "- Never invent details the user did not give. Do not guess a time.\n"
        "- If the request is not about tasks or reminders, say in one short line that "
        "this version only handles tasks.\n"
        "- After the tool result, reply in ONE short line confirming what was created "
        "(title and when), or the error if it failed."
    )


def run(prompt: str) -> str:
    if not config.GEMINI_API_KEY:
        return "Missing GEMINI_API_KEY in .env"
    try:
        client = genai.Client(api_key=config.GEMINI_API_KEY)
        resp = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_system_prompt(),
                tools=tools.TOOLS,  # SDK runs the tool loop automatically
                temperature=0,
            ),
        )
        return (resp.text or "").strip() or "Done."
    except Exception as exc:
        return f"Error: {exc}"
