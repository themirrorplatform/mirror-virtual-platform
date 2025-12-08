import logging
from typing import Any, Dict, List

from safety import safety_check
from providers import (
    generate_mirrorback as claude_generate_mirrorback,
    summarize_history as openai_summarize_history,
    extract_patterns as gemini_extract_patterns,
    get_web_context as perplexity_get_web_context,
)
from database import retrieve_recent_reflections, retrieve_belief_states
from mirrorcore import mirrorcore_lint

logger = logging.getLogger("mirrorx.orchestrator")


async def process_reflection_orchestrated(user_id: str, reflection_text: str, maybe_external_question: str | None = None) -> Dict[str, Any]:
    """Run the multi-provider orchestration and return the mirrorback result.

    Returns a dict with keys:
      - mirrorback: str
      - tone: str (if available)
      - lint_passed: bool
      - lint_violations: list
    """
    # 0. Safety
    safe = safety_check(reflection_text)
    if safe.get("bypass_reflection"):
        logger.warning("Safety bypass for orchestration: %s", safe.get("response"))
        return {"mirrorback": str(safe.get("response")), "tone": "crisis", "lint_passed": True, "lint_violations": []}

    # 1. Basic context pulls
    recent_texts: List[str] = retrieve_recent_reflections(user_id=user_id, limit=5)
    belief_texts: List[str] = retrieve_belief_states(user_id=user_id)

    # 2. OpenAI: summarize history
    history_summary = await openai_summarize_history(recent_texts)
    recurring_themes = history_summary.get("themes", []) if isinstance(history_summary, dict) else []

    # 3. Gemini: pattern extraction (DISABLED: REST endpoint has persistent auth scope errors)
    # gemini_info = await gemini_extract_patterns(reflection_text)
    gemini_info = {}  # fallback empty dict

    # 4. Perplexity: optional web context
    web_context = ""
    if maybe_external_question:
        web_context = await perplexity_get_web_context(maybe_external_question)

    # 5. Build context for Claude
    context: Dict[str, Any] = {
        "recent_reflections": recent_texts,
        "active_beliefs": belief_texts,
        "recurring_themes": recurring_themes,
        "user_tone": None,
        "held_tensions": gemini_info.get("tensions", []) if isinstance(gemini_info, dict) else [],
        "gemini_patterns": gemini_info,
        "web_context": web_context,
    }

    # 6. Ask Claude (mirrorcore) to generate Mirrorback
    mirrorback_text = await claude_generate_mirrorback(reflection_text, context)

    # 7. Lint
    lint = mirrorcore_lint(mirrorback_text)

    return {
        "mirrorback": mirrorback_text,
        "tone": context.get("user_tone") or "unknown",
        "lint_passed": bool(lint.get("passed")),
        "lint_violations": lint.get("violations") or [],
    }
