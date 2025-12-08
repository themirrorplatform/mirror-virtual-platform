"""
Mirrorback Engine Orchestrator - Complete ceremony pipeline

Orchestrates: Workers → Safety → Synthesis → Claude → Filter → Response
"""

import logging
import os
from typing import Dict, Any, Optional

from app.mirrorback_models import (
    OrchestratorBundle,
    MirrorbackResponse,
    EmotionSnapshot,
    IdentitySnapshot,
    SemanticSnapshot,
    LogicSnapshot,
    GroundingSnapshot,
    ToneDecision,
    EvolutionSnapshot,
)
from app.guardrails import lint_for_guardrails, CLAUDE_SYSTEM_PROMPT
from app.gpt_synthesis import synthesize_for_mirrorback
from app.gpt_filter import filter_mirrorback_draft

logger = logging.getLogger("mirrorx.mirrorback_engine")

USE_CONDUCTOR = os.getenv("USE_CONDUCTOR", "true").lower() == "true"


async def orchestrate_mirrorback(
    user_id: str,
    user_text: str,
    bundle: Optional[OrchestratorBundle] = None,
) -> MirrorbackResponse:
    """
    Complete Mirrorback Engine ceremony.

    Input: user_text and optional pre-built bundle (from orchestrator)
    Output: Polished, guardrails-compliant mirrorback

    Pipeline:
    1. Build bundle (if not provided)
    2. Synthesize to MirrorbackPlan (GPT)
    3. Generate draft (Claude)
    4. Filter and polish (GPT)
    5. Lint and return

    Args:
        user_id: User identifier
        user_text: Raw reflection text
        bundle: Optional pre-built OrchestratorBundle

    Returns:
        MirrorbackResponse with polished text and metadata
    """
    logger.info(f"Starting Mirrorback ceremony for user {user_id}")

    # If no bundle provided, build a minimal one
    if not bundle:
        logger.info("No bundle provided; using fallback minimal bundle")
        bundle = _build_minimal_bundle(user_text)

    # Step 1: Synthesize bundle into MirrorbackPlan
    logger.info("Step 1: Synthesizing bundle into plan...")
    try:
        synthesis = await synthesize_for_mirrorback(bundle)
        logger.info("Synthesis complete")
    except Exception as e:
        logger.exception(f"Synthesis failed: {e}")
        return MirrorbackResponse(
            text="I'm having trouble reflecting on this right now. Please try again.",
            lint_passed=False,
            lint_violations=["synthesis_failed"],
        )

    # Step 2: Generate draft (Claude)
    logger.info("Step 2: Generating draft via Claude...")
    try:
        draft = await _generate_draft_with_claude(user_text, bundle, synthesis)
        logger.info("Draft generated")
    except Exception as e:
        logger.exception(f"Claude generation failed: {e}")
        return MirrorbackResponse(
            text="I couldn't generate a reflection at this moment. Please try again.",
            lint_passed=False,
            lint_violations=["claude_failed"],
        )

    # Step 3: Filter and polish (GPT)
    logger.info("Step 3: Filtering and polishing...")
    try:
        polished = await filter_mirrorback_draft(draft)
        logger.info("Filtering complete")
    except Exception as e:
        logger.exception(f"Filtering failed: {e}")
        polished = draft

    # Step 4: Final lint check
    logger.info("Step 4: Running final guardrails lint...")
    lint_passed, violations = lint_for_guardrails(polished)

    if not lint_passed:
        logger.warning(f"Lint failed with {len(violations)} violations")
        for v in violations[:3]:
            logger.debug(str(v))

    # Return response
    response = MirrorbackResponse(
        text=polished,
        ceremony_used=["observation", "opening", "threading", "contradiction", "expansion", "return"],
        synthesis_json=synthesis.model_dump(),
        lint_passed=lint_passed,
        lint_violations=[v.pattern for v in violations],
    )

    logger.info("Mirrorback ceremony complete")
    return response


async def _generate_draft_with_claude(
    user_text: str,
    bundle: OrchestratorBundle,
    synthesis,
) -> str:
    """
    Call Claude to generate the mirrorback draft.

    Claude receives:
    - System prompt (CLAUDE_SYSTEM_PROMPT with Core Doctrine)
    - User message with raw text, bundle, and synthesis
    """
    try:
        from anthropic import Anthropic

        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            logger.warning("ANTHROPIC_API_KEY not set; returning fallback")
            return _fallback_draft(user_text, bundle, synthesis)

        client = Anthropic(api_key=anthropic_api_key)

        # Build user message
        user_message = f"""
Here is the user's reflection:

{user_text}

---

Orchestrator Bundle Summary:
- Emotional State: {bundle.emotion.primary_emotion} (valence: {bundle.emotion.valence:.2f}, intensity: {bundle.emotion.intensity:.2f})
- Core Question: {bundle.semantic.core_question}
- Hidden Question: {bundle.semantic.hidden_question}
- Themes: {', '.join(bundle.identity.themes[:3])}
- Tone: {bundle.tone_decision.mirror_tone}

---

Mirrorback Synthesis Plan (guides your structure and emphasis):

{synthesis.model_dump_json(indent=2)}

---

Now write the mirrorback following the six-step ceremony. Let the synthesis guide you, but let your voice come through naturally.
Write as ONE flowing piece of text. Do NOT label sections explicitly.
"""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1200,
            system=CLAUDE_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
        )

        draft = ""
        if response.content:
            for block in response.content:
                if hasattr(block, "text"):
                    draft += block.text

        return draft.strip()

    except Exception as e:
        logger.exception(f"Claude generation failed: {e}")
        return _fallback_draft(user_text, bundle, synthesis)


def _fallback_draft(user_text: str, bundle: OrchestratorBundle, synthesis) -> str:
    """Fallback draft when Claude is not available."""
    logger.info("Using fallback draft generation")

    # Simple structure following the ceremony
    observation = f"I notice you're bringing {bundle.emotion.primary_emotion} energy to this."
    opening = f"There's something real here worth staying with: your question about {bundle.semantic.core_question}"
    threading = f"This echoes a familiar territory for you—around {', '.join(bundle.identity.themes[:2])}."
    expansion = f"One way to hold this is: it's not just about this moment, but about what it reveals about you."
    return_step = f"What would it mean to sit with this without needing to resolve it right now?"

    draft = f"{observation}\n\n{opening}\n\n{threading}\n\n{expansion}\n\n{return_step}"
    return draft


def _build_minimal_bundle(user_text: str) -> OrchestratorBundle:
    """Build a minimal bundle when none is provided."""
    return OrchestratorBundle(
        user_text=user_text,
        emotion=EmotionSnapshot(
            primary_emotion="present",
            valence=0.0,
            arousal=0.5,
            intensity=0.5,
        ),
        identity=IdentitySnapshot(),
        semantic=SemanticSnapshot(
            core_question="What is this about?",
            topics=[],
        ),
        logic=LogicSnapshot(),
        grounding=GroundingSnapshot(),
        tone_decision=ToneDecision(mirror_tone="soft", intensity="medium", focus="story"),
        evolution=EvolutionSnapshot(),
    )
