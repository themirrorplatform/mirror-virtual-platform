import logging
import os
import re
from typing import Dict, List

from anthropic import Anthropic, NotFoundError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("mirrorx-mirrorcore")

# ---------------------------------------------------------------------------
# Anthropic / Claude client
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY is not set. Claude calls will fail.")

# Only instantiate the Anthropic client when an API key is present.
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# ---------------------------------------------------------------------------
# MirrorCore system prompt
# ---------------------------------------------------------------------------

# We prefer loading the huge MirrorCore prompt from a file.
# .env should contain: MIRRORCORE_PROMPT_FILE=mirrorcore_system_prompt.txt
MIRRORCORE_SYSTEM_PROMPT = ""

prompt_file = os.getenv("MIRRORCORE_PROMPT_FILE", "").strip()
if prompt_file and os.path.exists(prompt_file):
    try:
        with open(prompt_file, "r", encoding="utf-8") as f:
            MIRRORCORE_SYSTEM_PROMPT = f.read().strip()
            logger.info("Loaded MirrorCore system prompt from %s", prompt_file)
    except Exception as e:
        logger.warning("Failed to load MirrorCore prompt file %s: %s", prompt_file, e)
else:
    # Fallback: allow small prompt from env if absolutely necessary
    MIRRORCORE_SYSTEM_PROMPT = os.getenv("MIRRORCORE_SYSTEM_PROMPT", "").strip()

if not MIRRORCORE_SYSTEM_PROMPT:
    logger.warning(
        "MirrorCore system prompt is empty. "
        "Set MIRRORCORE_PROMPT_FILE or MIRRORCORE_SYSTEM_PROMPT."
    )

# ---------------------------------------------------------------------------
# Linting / Forbidden Language
# ---------------------------------------------------------------------------

FORBIDDEN_PATTERNS = [
    r"\btry\b",
    r"\btrying\b",
    r"\bshould\b",
    r"\bcould\b",
    r"\bwould\b",
    r"\bhelpful\b",
    r"\bhelp you\b",
    r"\bclearly\b",
    r"\bobviously\b",
    r"\bactually\b",
    r"\bimprove\b",
    r"\bbetter\b",
    r"\bfix\b",
    r"\bmight want to\b",
    r"\bit would be\b",
    r"\bconsider\b",
    r"\bfocus on\b",
    r"\bremember\b",
]


def mirrorcore_lint(text: str) -> Dict[str, object]:
    """
    Check generated text for forbidden patterns.

    Returns:
        {
            "passed": bool,
            "violations": List[str],
        }
    """
    violations: List[str] = []

    if not text:
        return {"passed": False, "violations": ["empty_output"]}

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            violations.append(pattern)

    return {"passed": len(violations) == 0, "violations": violations}


# ---------------------------------------------------------------------------
# MirrorCore generation
# ---------------------------------------------------------------------------


def _build_claude_messages(
    user_input: str, context: Dict, strict: bool = False
) -> List[Dict]:
    """
    Construct the messages payload for Anthropic Claude.

    Mirror-X constraint:
      - Always respond in the structure:
          OBSERVATION: ...
          OPENING: ...
      - No advice, no prescriptions, no optimization language.
    """

    # Encode stricter constraints on retries
    strict_clause = (
        "You have already violated the constraints once. This time you MUST avoid "
        "any language that even hints at advice, suggestions, recommendations, "
        "or improvement. If unsure, stay on the side of pure observation and "
        "open-ended questioning.\n\n"
        if strict
        else ""
    )

    context_summary = (
        f"Recent reflections: {context.get('recent_reflections', [])}\n"
        f"Active beliefs: {context.get('active_beliefs', [])}\n"
        f"Held tensions: {context.get('held_tensions', [])}\n"
        f"Recurring themes: {context.get('recurring_themes', [])}\n"
        f"User tone: {context.get('user_tone', 'unknown')}\n"
    )

    user_prompt = (
        "You are Mirror-X, a reflective intelligence system.\n"
        "You NEVER give advice, suggestions, or prescriptions.\n"
        "You NEVER optimize, fix, or improve the user.\n"
        "You only reflect patterns, tensions, and contradictions back to them.\n\n"
        f"{strict_clause}"
        "Structure your response **exactly** as:\n\n"
        "OBSERVATION: <what you notice in their words, patterns, tensions>\n"
        "OPENING: <an open question/invitation back to them>\n\n"
        "Do not use imperative verbs like 'try', 'consider', 'remember', "
        "'focus on', or 'you should'. Do not promise help or outcomes.\n\n"
        "Context snapshot:\n"
        f"{context_summary}\n\n"
        "User reflection:\n"
        f"{user_input}\n"
    )

    return [
        {
            "role": "user",
            "content": user_prompt,
        }
    ]


def generate_mirrorback(user_input: str, context: Dict, strict: bool = False) -> str:
    """
    Generate a Mirrorback for a given user input and context using Anthropic Claude.

    Args:
        user_input: Raw reflection text from the user.
        context: Context dict with recent_reflections, active_beliefs, etc.
        strict: If True, emphasize even stronger constraints against advice.

    Returns:
        Generated mirrorback text.
    """
    # If no Anthropic client is configured, return a simple deterministic
    # local fallback so the app can be used for development without API keys.
    if anthropic_client is None:
        logger.info("Anthropic client not configured — using local fallback mirrorback.")
        observed = user_input.strip()
        if len(observed) > 200:
            observed = observed[:200].rsplit(" ", 1)[0] + "..."

        mirrorback_text = (
            f"OBSERVATION: I notice you said: \"{observed}\"\n\n"
            "OPENING: What do you notice in yourself as you reread that?"
        )
        return mirrorback_text

    if not MIRRORCORE_SYSTEM_PROMPT:
        logger.warning(
            "MIRRORCORE_SYSTEM_PROMPT is empty. Using only runtime constraints."
        )

    messages = _build_claude_messages(
        user_input=user_input,
        context=context,
        strict=strict,
    )

    logger.debug("Sending prompt to Claude for Mirrorback generation.")

    model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    try:
        response = anthropic_client.messages.create(
            model=model_name,
            max_tokens=800,
            system=MIRRORCORE_SYSTEM_PROMPT,
            messages=messages,
        )
    except NotFoundError:
        logger.warning("Anthropic model not found: %s. Attempting fallback.", model_name)
        # Try to list available models and pick the first one as a fallback
        try:
            models_page = anthropic_client.models.list()
            first_model = None
            if getattr(models_page, 'data', None):
                first_model = models_page.data[0].id
            elif isinstance(models_page, list) and models_page:
                first_model = models_page[0].id

            if first_model:
                logger.info("Retrying with fallback model: %s", first_model)
                response = anthropic_client.messages.create(
                    model=first_model,
                    max_tokens=800,
                    system=MIRRORCORE_SYSTEM_PROMPT,
                    messages=messages,
                )
            else:
                logger.error("No fallback model available from Anthropic.")
                raise
        except Exception:
            logger.exception("Failed to find or call a fallback Anthropic model.")
            raise

    # Anthropic's content is a list of blocks; we concatenate text blocks.
    parts: List[str] = []
    for block in response.content:
        if getattr(block, "type", "") == "text":
            parts.append(block.text)

    mirrorback_text = "\n".join(parts).strip()
    logger.debug("Received Mirrorback text from Claude.")
    return mirrorback_text
