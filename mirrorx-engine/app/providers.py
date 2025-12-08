"""
Stub providers for orchestrator multi-provider functionality.
These are placeholders until full provider integrations are implemented.
"""
import logging
from typing import Any, Dict, List

logger = logging.getLogger("mirrorx.providers")


async def generate_mirrorback(reflection_text: str, context: Dict[str, Any]) -> str:
    """
    Placeholder for Claude-based mirrorback generation.
    Currently returns a simple acknowledgment.
    """
    logger.info("Stub generate_mirrorback called")
    return f"Thank you for sharing. I'm processing your reflection: {reflection_text[:50]}..."


async def summarize_history(recent_texts: List[str]) -> Dict[str, Any]:
    """
    Placeholder for OpenAI-based history summarization.
    Currently returns empty themes.
    """
    logger.info("Stub summarize_history called with %d texts", len(recent_texts))
    return {"themes": []}


async def extract_patterns(reflection_text: str) -> Dict[str, Any]:
    """
    Placeholder for Gemini-based pattern extraction.
    Currently returns empty patterns.
    """
    logger.info("Stub extract_patterns called")
    return {"tensions": [], "patterns": []}


async def get_web_context(question: str) -> str:
    """
    Placeholder for Perplexity-based web context retrieval.
    Currently returns empty string.
    """
    logger.info("Stub get_web_context called for: %s", question[:50])
    return ""
