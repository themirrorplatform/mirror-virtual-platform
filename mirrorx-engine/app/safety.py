import logging
import os
from typing import Dict

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("mirrorx-safety")

CRISIS_KEYWORDS = [
    "kill myself",
    "end it all",
    "suicide",
    "not worth living",
    "better off dead",
]

# ---------------------------------------------------------------------------
# Anthropic client for tone detection
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


def safety_check(user_input: str) -> Dict[str, object]:
    """
    Check input for crisis indicators.

    Args:
        user_input: Raw text from the user.

    Returns:
        {
            "bypass_reflection": bool,
            "response": str
        }

    If bypass_reflection is True, the caller MUST NOT call the AI engine
    and instead return the provided response directly.
    """
    lowered = user_input.lower()

    for phrase in CRISIS_KEYWORDS:
        if phrase in lowered:
            logger.warning("Crisis keyword detected: %s", phrase)
            # NOTE: This is a placeholder; customize with localized resources.
            crisis_message = (
                "OBSERVATION: Something in what you wrote sounds like you might be in "
                "real pain and possibly considering harming yourself.\n\n"
                "OPENING: Before anything else, this is the moment to reach a human "
                "who can respond in real time.\n\n"
                "If you are in immediate danger, contact your local emergency number.\n"
                "You can also reach a crisis line:\n"
                "- In the US & Canada: call or text 988\n"
                "- In the UK & Ireland: Samaritans at 116 123\n"
                "- In Australia: Lifeline at 13 11 14\n\n"
                "If you’re elsewhere, you can find international helplines at "
                "https://www.opencounseling.com/suicide-hotlines.\n\n"
                "You are not alone in this. Another human voice matters more than an AI right now."
            )
            return {
                "bypass_reflection": True,
                "response": crisis_message,
            }

    return {"bypass_reflection": False, "response": ""}


def detect_tone(user_input: str) -> str:
    """
    Detect tone of the user input using a lightweight classification prompt.

    Returns one of:
        - "raw"
        - "analytical"
        - "philosophical"
        - "confused"
        - "neutral"

    If the classification call fails, falls back to "neutral".
    """
    if not anthropic_client:
        logger.warning("ANTHROPIC_API_KEY not set; falling back to 'neutral' tone.")
        return "neutral"

    prompt = (
        "Classify the tone of the following reflection into exactly one of:\n"
        "- raw\n"
        "- analytical\n"
        "- philosophical\n"
        "- confused\n"
        "- neutral\n\n"
        "Return only the single word label, nothing else.\n\n"
        f"Reflection:\n{user_input}\n"
    )

    try:
        response = anthropic_client.messages.create(
            model=os.getenv("ANTHROPIC_TONE_MODEL", "claude-3-haiku-20240307"),
            max_tokens=10,
            system="You are a precise, minimal tone classifier.",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        # Extract label text
        label_text = ""
        for block in response.content:
            if getattr(block, "type", "") == "text":
                label_text += block.text

        label = label_text.strip().lower()

        allowed = {"raw", "analytical", "philosophical", "confused", "neutral"}
        if label not in allowed:
            logger.warning("Unexpected tone label from Claude: %s", label)
            return "neutral"

        return label

    except Exception as exc:
        logger.exception("Tone detection failed: %s", exc)
        return "neutral"
