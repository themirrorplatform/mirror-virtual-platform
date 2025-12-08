"""
Enhanced Claude mirrorback generation for the Conductor.

Claude is the Voice of MirrorX - the only AI allowed to speak to the user.
"""

import logging
import os
from typing import List

from anthropic import Anthropic, NotFoundError
from dotenv import load_dotenv

from app.conductor_models import (
    UserEmotion,
    IdentitySnapshot,
    SemanticAnalysis,
    LogicMap,
    GroundingContext,
    ToneDecision,
)
from app.conductor_tone import format_tone_for_claude

load_dotenv()

logger = logging.getLogger("mirrorx.conductor.claude")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


def _build_context_summary(
    emotion: UserEmotion,
    identity: IdentitySnapshot,
    semantic: SemanticAnalysis,
    logic: LogicMap,
    grounding: GroundingContext
) -> str:
    """Build a compact context summary for Claude."""

    context_parts = []

    # Emotion
    context_parts.append(f"EMOTIONAL STATE: {emotion.primary}")
    if emotion.secondary:
        context_parts.append(f"(also: {emotion.secondary})")
    context_parts.append(f"Valence: {emotion.valence:.2f}, Intensity: {emotion.intensity:.2f}")

    # Identity
    if identity.tensions:
        context_parts.append(f"\nACTIVE TENSIONS: {', '.join(identity.tensions[:3])}")
    if identity.paradoxes:
        context_parts.append(f"PARADOXES: {', '.join(identity.paradoxes[:3])}")
    if identity.recurring_loops:
        context_parts.append(f"RECURRING LOOPS: {', '.join(identity.recurring_loops[:2])}")
    if identity.dominant_tension:
        context_parts.append(f"DOMINANT TENSION: {identity.dominant_tension}")

    # Semantic
    if semantic.core_question:
        context_parts.append(f"\nEXPLICIT QUESTION: {semantic.core_question}")
    if semantic.hidden_questions:
        context_parts.append(f"HIDDEN QUESTIONS: {', '.join(semantic.hidden_questions[:2])}")

    # Logic
    if logic.paradoxes:
        context_parts.append(f"\nPARADOXES IN THIS REFLECTION: {', '.join(logic.paradoxes[:2])}")
    if logic.contradictions:
        contradictions_summary = "; ".join([
            f"'{c.claim_a}' vs '{c.claim_b}' ({c.contradiction_type})"
            for c in logic.contradictions[:2]
        ])
        context_parts.append(f"CONTRADICTIONS: {contradictions_summary}")

    # Grounding
    if grounding.needed and grounding.retrieved_facts:
        context_parts.append(f"\nEXTERNAL CONTEXT: {' | '.join(grounding.retrieved_facts[:3])}")

    return "\n".join(context_parts)


async def generate_mirrorback_with_conductor(
    text: str,
    emotion: UserEmotion,
    identity: IdentitySnapshot,
    semantic: SemanticAnalysis,
    logic: LogicMap,
    grounding: GroundingContext,
    tone_decision: ToneDecision,
    strict: bool = False
) -> str:
    """
    Generate a mirrorback using Claude with full conductor context.

    Args:
        text: User's reflection text
        emotion: Emotional state
        identity: Identity snapshot
        semantic: Semantic analysis
        logic: Logic map
        grounding: Grounding context
        tone_decision: How to respond tonally
        strict: If True, emphasize stricter constraints (for retries)

    Returns:
        Generated mirrorback text
    """

    if anthropic_client is None:
        logger.warning("Anthropic client not configured — using local fallback")
        return _fallback_mirrorback(text, emotion, tone_decision)

    # Load MirrorCore system prompt
    MIRRORCORE_SYSTEM_PROMPT = ""
    prompt_file = os.getenv("MIRRORCORE_PROMPT_FILE", "").strip()
    if prompt_file and os.path.exists(prompt_file):
        try:
            with open(prompt_file, "r", encoding="utf-8") as f:
                MIRRORCORE_SYSTEM_PROMPT = f.read().strip()
        except Exception as e:
            logger.warning(f"Failed to load MirrorCore prompt file: {e}")

    if not MIRRORCORE_SYSTEM_PROMPT:
        MIRRORCORE_SYSTEM_PROMPT = os.getenv("MIRRORCORE_SYSTEM_PROMPT", "").strip()

    if not MIRRORCORE_SYSTEM_PROMPT:
        logger.warning("MirrorCore system prompt is empty")

    # Build context summary
    context_summary = _build_context_summary(emotion, identity, semantic, logic, grounding)

    # Format tone instructions
    tone_instructions = format_tone_for_claude(tone_decision)

    # Build strict clause if needed
    strict_clause = ""
    if strict:
        strict_clause = """
⚠️ STRICT MODE: You have already violated the constraints once.
This time you MUST avoid ANY language that even hints at:
- Advice, suggestions, recommendations
- "You should/could/might want to"
- Improvement or optimization language
- Promises or outcomes
- Coaching voice

If unsure, stay on the side of pure observation and open-ended questioning.
"""

    # Build user prompt
    user_prompt = f"""You are Mirror-X, a reflective intelligence system.

CORE CONSTRAINTS:
- You NEVER give advice, suggestions, or prescriptions
- You NEVER optimize, fix, or improve the user
- You NEVER promise outcomes or paths forward
- You only reflect patterns, tensions, and contradictions back to them

{strict_clause}

{tone_instructions}

RESPONSE STRUCTURE:
Always structure your response as:

OBSERVATION: <what you notice in their words, patterns, tensions>

OPENING: <an open question or invitation back to them>

FORBIDDEN LANGUAGE:
Do not use: "try", "consider", "remember", "focus on", "you should", "it would be helpful"

CONTEXT:
{context_summary}

USER REFLECTION:
{text}
"""

    logger.debug("Sending prompt to Claude for Mirrorback generation")

    model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    try:
        response = anthropic_client.messages.create(
            model=model_name,
            max_tokens=1000,
            system=MIRRORCORE_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
        )
    except NotFoundError:
        logger.warning(f"Anthropic model not found: {model_name}. Attempting fallback.")
        try:
            models_page = anthropic_client.models.list()
            first_model = None
            if getattr(models_page, 'data', None):
                first_model = models_page.data[0].id
            elif isinstance(models_page, list) and models_page:
                first_model = models_page[0].id

            if first_model:
                logger.info(f"Retrying with fallback model: {first_model}")
                response = anthropic_client.messages.create(
                    model=first_model,
                    max_tokens=1000,
                    system=MIRRORCORE_SYSTEM_PROMPT,
                    messages=[
                        {
                            "role": "user",
                            "content": user_prompt,
                        }
                    ],
                )
            else:
                logger.error("No fallback model available from Anthropic.")
                raise
        except Exception:
            logger.exception("Failed to find or call a fallback Anthropic model.")
            raise

    # Extract text from response
    parts: List[str] = []
    for block in response.content:
        if getattr(block, "type", "") == "text":
            parts.append(block.text)

    mirrorback_text = "\n".join(parts).strip()
    logger.debug("Received Mirrorback text from Claude")
    return mirrorback_text


def _fallback_mirrorback(text: str, emotion: UserEmotion, tone_decision: ToneDecision) -> str:
    """Simple local fallback when Anthropic is not available."""

    observed = text.strip()
    if len(observed) > 200:
        observed = observed[:200].rsplit(" ", 1)[0] + "..."

    tone_map = {
        "soft": "I notice",
        "direct": "Here's what stands out:",
        "playful": "Something interesting here—",
        "austere": "What's present:",
        "silent": "You said:",
        "provocative": "There's a tension here:"
    }

    opening_map = {
        "soft": "What do you notice in yourself as you reread that?",
        "direct": "Where does this pattern show up most for you?",
        "playful": "What if both were true at once?",
        "austere": "What's underneath this?",
        "silent": "Where does that leave you?",
        "provocative": "Can that really be the whole story?"
    }

    observation_start = tone_map.get(tone_decision.mirror_tone, "I notice")
    opening_question = opening_map.get(tone_decision.mirror_tone, "What do you notice?")

    return f"""OBSERVATION: {observation_start} you said: "{observed}"

You seem to be feeling {emotion.primary}.

OPENING: {opening_question}"""
