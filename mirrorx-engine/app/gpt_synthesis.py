"""
GPT Synthesis Engine - Compresses OrchestratorBundle into MirrorbackPlan

Takes all the raw data from orchestrator and produces a clean JSON blueprint
for Claude to use when writing the mirrorback.
"""

import logging
import json
from typing import Dict, Any, Optional

from openai import OpenAI

from app.mirrorback_models import (
    OrchestratorBundle,
    MirrorbackSynthesis,
    SynthesisSummary,
    SynthesisThreading,
    TensionReference,
    SynthesisContradictions,
    ExpansionDirections,
    SynthesisReturn,
    SynthesisTone,
)
from app.guardrails import GPT_SYNTHESIS_PROMPT

logger = logging.getLogger("mirrorx.gpt_synthesis")

OPENAI_API_KEY = None
try:
    import os
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
except Exception:
    pass

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def synthesize_for_mirrorback(bundle: OrchestratorBundle) -> MirrorbackSynthesis:
    """
    Convert OrchestratorBundle into MirrorbackSynthesis using GPT.

    Args:
        bundle: Complete orchestrator data

    Returns:
        MirrorbackSynthesis JSON blueprint for Claude
    """
    if not client:
        logger.warning("OpenAI client not configured. Using fallback synthesis.")
        return _fallback_synthesis(bundle)

    # Convert bundle to dict for JSON
    bundle_dict = bundle.model_dump()

    prompt = f"""
{GPT_SYNTHESIS_PROMPT}

Here is the input bundle:

{json.dumps(bundle_dict, indent=2)}

Now produce the MirrorbackSynthesis JSON. Output ONLY valid JSON, no explanation.
"""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Using Claude via OpenAI
            max_tokens=2000,
            system=GPT_SYNTHESIS_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
    except Exception as e:
        logger.exception(f"GPT synthesis failed: {e}")
        return _fallback_synthesis(bundle)

    # Extract text
    try:
        text = response.content[0].text if response.content else ""
    except Exception:
        text = ""

    # Parse JSON
    try:
        synthesis_dict = json.loads(text)
        synthesis = MirrorbackSynthesis(**synthesis_dict)
        return synthesis
    except Exception as e:
        logger.exception(f"Failed to parse synthesis JSON: {e}")
        return _fallback_synthesis(bundle)


def _fallback_synthesis(bundle: OrchestratorBundle) -> MirrorbackSynthesis:
    """
    Fallback synthesis when GPT is not available.
    Builds a basic plan from bundle data.
    """
    logger.info("Using fallback synthesis.")

    # Summarize emotion and semantics
    emotional_state = (
        f"{bundle.emotion.primary_emotion} "
        f"(valence: {bundle.emotion.valence:.2f}, intensity: {bundle.emotion.intensity:.2f})"
    )

    # Extract key beliefs
    key_beliefs = bundle.semantic.explicit_beliefs[:3] + bundle.semantic.implicit_beliefs[:2]

    # Extract tensions
    relevant_tensions = []
    for tension in bundle.identity.tensions_summary[:2]:
        relevant_tensions.append(
            TensionReference(
                label=tension.get("label", "unknown"),
                pole_a=tension.get("pole_a"),
                pole_b=tension.get("pole_b"),
            )
        )

    # Growth/regression signals
    growth_signals = bundle.identity.progression_markers[:2] if bundle.identity.progression_markers else []
    regression_signals = bundle.identity.regression_markers[:2] if bundle.identity.regression_markers else []

    # Expansion directions
    inner_directions = []
    if bundle.semantic.core_question:
        inner_directions.append(f"Reframing the core question: '{bundle.semantic.core_question}'")

    outer_directions = []
    if bundle.grounding.retrieved_facts:
        outer_directions.append(f"Situating in context: {bundle.grounding.retrieved_facts[0]}")

    # Return step
    return_step = SynthesisReturn(
        question_type=_best_question_type(bundle),
        suggested_questions=[
            f"What do you notice when you sit with this: '{bundle.semantic.hidden_question or bundle.semantic.core_question}'?",
            "What part of you needs to be seen right now?",
        ],
    )

    # Tone notes
    notes = f"Tone: {bundle.tone_decision.mirror_tone}. "
    if bundle.emotion.intensity > 0.7:
        notes += "User is highly activated; prioritize safety and presence."
    elif bundle.evolution.stagnation_score > 0.6:
        notes += "User is stagnating; gently surface loops and patterns."
    else:
        notes += "User appears resourced; can handle sharper mirror."

    synthesis = MirrorbackSynthesis(
        summary=SynthesisSummary(
            emotional_state=emotional_state,
            surface_question=bundle.semantic.core_question,
            hidden_question=bundle.semantic.hidden_question,
            key_beliefs=key_beliefs,
        ),
        threading=SynthesisThreading(
            relevant_tensions=relevant_tensions,
            relevant_loops=bundle.identity.regression_markers[:2],
            themes=bundle.identity.themes[:3],
            growth_signals=growth_signals,
            regression_signals=regression_signals,
        ),
        contradictions_and_paradoxes=SynthesisContradictions(
            hard_contradictions=[
                f"{c[0]} vs {c[1]}" if isinstance(c, (tuple, list)) and len(c) >= 2 else str(c)
                for c in (bundle.logic.contradictions[:2] if bundle.logic.contradictions else [])
            ],
            soft_paradoxes=bundle.logic.paradoxes[:2],
        ),
        expansion_directions=ExpansionDirections(
            inner_directions=inner_directions,
            outer_directions=outer_directions,
            grounding_points=bundle.grounding.retrieved_facts[:2],
        ),
        return_step=return_step,
        tone=SynthesisTone(
            mirror_tone=bundle.tone_decision.mirror_tone,
            intensity=bundle.tone_decision.intensity,
            focus=bundle.tone_decision.focus,
            notes_for_voice=notes,
        ),
    )

    return synthesis


def _best_question_type(bundle: OrchestratorBundle) -> str:
    """Heuristic to choose best question type based on bundle."""
    if bundle.emotion.intensity > 0.8:
        return "locating"
    elif bundle.evolution.loop_score > 0.6:
        return "paradox"
    elif bundle.evolution.breakthrough_score > 0.5:
        return "choice"
    elif bundle.evolution.blindspot_score > 0.6:
        return "paradox"
    else:
        return "locating"
