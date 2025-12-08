"""
GPT Safety and Style Filter - Post-Claude Polish

Removes prescriptive language, smooths tone, ensures guardrails compliance.
"""

import logging
import re
import os
from typing import List

from openai import OpenAI

from guardrails import GPT_FILTER_PROMPT, lint_for_guardrails, GuardrailsViolation

logger = logging.getLogger("mirrorx.gpt_filter")

openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key) if openai_api_key else None


async def filter_mirrorback_draft(draft: str) -> str:
    """
    Safety and style filter for Claude's mirrorback draft.

    Removes prescriptive language, ensures guardrails compliance, smooths tone.

    Args:
        draft: Raw text from Claude

    Returns:
        Polished, guardrails-compliant mirrorback text
    """
    # First, check if draft violates guardrails
    passed, violations = lint_for_guardrails(draft)

    if not passed and client:
        # Try GPT filter to fix violations
        logger.info(f"Draft has {len(violations)} guardrails violations. Applying GPT filter.")
        filtered = await _gpt_filter(draft, violations)
        return filtered
    elif not passed:
        # No GPT available; apply local fixes
        logger.warning("No GPT filter available. Applying local cleanup.")
        return _local_cleanup(draft)
    else:
        # Draft is already clean
        logger.info("Draft passed guardrails check. Minimal cleanup.")
        return _local_cleanup(draft)


async def _gpt_filter(draft: str, violations: List) -> str:  # type: ignore
    """Use GPT to clean up draft and remove violations."""
    violations_summary = "\n".join([str(v) for v in violations[:5]])  # type: ignore

    prompt = f"""
{GPT_FILTER_PROMPT}

Here is the draft text to filter:

{draft}

Known guardrails violations:

{violations_summary}

Now clean up the text and return ONLY the revised mirrorback text, no explanation.
"""

    try:
        response = client.messages.create(
            model="gpt-4-turbo-preview",
            max_tokens=2000,
            system=GPT_FILTER_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        filtered = response.content[0].text if response.content else draft
        return filtered
    except Exception as e:
        logger.exception(f"GPT filter failed: {e}")
        return _local_cleanup(draft)


def _local_cleanup(text: str) -> str:
    """Local regex-based cleanup when GPT is not available."""
    logger.info("Applying local cleanup.")

    # Remove common prescriptive phrases
    text = re.sub(r"\byou\s+should\b", "you might", text, flags=re.IGNORECASE)
    text = re.sub(r"\byou\s+need\s+to\b", "it might help to consider", text, flags=re.IGNORECASE)
    text = re.sub(r"\byou\s+must\b", "there's something here about", text, flags=re.IGNORECASE)

    # Remove outcome guarantees
    text = re.sub(
        r"\bwill\s+(work|improve|change|succeed|be\s+better)\b",
        "might unfold differently",
        text,
        flags=re.IGNORECASE,
    )

    # Remove step-by-step language
    text = re.sub(r"\bfirst,\s+second,\s+third\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\b(step\s+\d+|here's\s+what\s+to\s+do)\b", "", text, flags=re.IGNORECASE)

    # Ensure ends with a question
    text = text.rstrip()
    if not text.endswith("?"):
        if not text.endswith("."):
            text += "."
        text += "\n\nWhat do you notice in this?"

    return text
