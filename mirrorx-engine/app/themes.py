# themes.py
import os
import json
from typing import List

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def extract_themes_from_history(history_text: str, max_themes: int = 5) -> List[str]:
    """
    Uses OpenAI to extract a small set of recurring themes
    from a block of reflection history.

    This NEVER talks to the user directly; it only returns tags.
    If OPENAI_API_KEY is not set or parsing fails, it returns [].
    """
    if not client or not history_text.strip():
        return []

    prompt = f"""
You are helping build a reflective intelligence system.

You will be given a series of personal reflections and mirrorbacks
from one person. Your ONLY job is to extract up to {max_themes}
short, high-level THEMES that keep showing up.

Return them as a JSON array of short strings. Do NOT add any explanations
or keys, only a JSON list.

Reflections and mirrorbacks:
\"\"\"{history_text}\"\"\"
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",  # cheap/fast model; adjust if needed
        messages=[
            {"role": "system", "content": "Extract themes only. Respond with JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    try:
        themes = json.loads(content)
        if isinstance(themes, list):
            return [str(t).strip() for t in themes][:max_themes]
    except Exception:
        # fail-soft: no themes instead of crashing
        return []

    return []
