"""
The Conductor: Multi-provider orchestration for MirrorX.

This is the main orchestration layer that coordinates all AI providers
to create layered, reflective intelligence.

Flow:
  0. Ingest & normalize
  1. Emotional scan (Hume)
  2. Semantic parse (OpenAI)
  3. Identity merge (OpenAI)
  4. Logic & paradox map (Gemini)
  5. Conditional grounding (Perplexity)
  6. Tone decision
  7. Mirrorback draft (Claude)
  8a. Safety & style filter (OpenAI)
  8b. Identity delta computation (OpenAI)
"""

import logging
from typing import Optional
from uuid import uuid4

from conductor_models import (
    UserEmotion,
    IdentitySnapshot,
    IdentityDelta,
    SemanticAnalysis,
    LogicMap,
    GroundingContext,
    ToneDecision,
    OrchestratorBundle,
    ConductorResult,
)
from conductor_providers import (
    analyze_emotion,
    semantic_analysis,
    merge_identity,
    build_logic_map,
    maybe_get_grounding,
    safety_and_style_filter,
    compute_identity_delta,
)
from conductor_tone import decide_tone
from conductor_claude import generate_mirrorback_with_conductor
from mirrorcore import mirrorcore_lint
from safety import safety_check

logger = logging.getLogger("mirrorx.conductor")


def apply_identity_delta(identity: IdentitySnapshot, delta: IdentityDelta) -> IdentitySnapshot:
    """
    Apply an IdentityDelta to an IdentitySnapshot.

    Args:
        identity: Current identity snapshot
        delta: Changes to apply

    Returns:
        Updated identity snapshot
    """
    # Start with current state
    updated = identity.model_copy(deep=True)

    # Add new items
    updated.tensions.extend(delta.new_tensions)
    updated.paradoxes.extend(delta.new_paradoxes)
    updated.recurring_loops.extend(delta.new_loops)

    # Remove resolved items
    updated.tensions = [t for t in updated.tensions if t not in delta.resolved_tensions]
    updated.recurring_loops = [l for l in updated.recurring_loops if l not in delta.resolved_loops]

    # Intensify paradoxes (move to front of list)
    for p in delta.intensified_paradoxes:
        if p in updated.paradoxes:
            updated.paradoxes.remove(p)
            updated.paradoxes.insert(0, p)

    # Update dominant tension
    if delta.updated_dominant_tension:
        updated.dominant_tension = delta.updated_dominant_tension

    # Update big question
    if delta.updated_big_question:
        updated.big_question = delta.updated_big_question

    # Deduplicate
    updated.tensions = list(dict.fromkeys(updated.tensions))
    updated.paradoxes = list(dict.fromkeys(updated.paradoxes))
    updated.recurring_loops = list(dict.fromkeys(updated.recurring_loops))

    # Keep only recent items (prevent unbounded growth)
    updated.tensions = updated.tensions[:10]
    updated.paradoxes = updated.paradoxes[:10]
    updated.recurring_loops = updated.recurring_loops[:10]

    return updated


async def handle_reflection(
    user_id: str,
    text: str,
    previous_identity: Optional[IdentitySnapshot] = None,
    audio_data: Optional[bytes] = None
) -> ConductorResult:
    """
    Main conductor orchestration function.

    This coordinates all AI providers to generate a reflective response.

    Args:
        user_id: User UUID
        text: User's reflection text
        previous_identity: Previous identity snapshot (if any)
        audio_data: Optional audio data for richer emotion detection

    Returns:
        ConductorResult with mirrorback, bundle, and updated identity
    """

    logger.info(f"Starting conductor orchestration for user {user_id}")

    # ---------------------------------------------------------------------------
    # STEP 0: Safety check
    # ---------------------------------------------------------------------------

    safety_result = safety_check(text)
    if safety_result.get("bypass_reflection"):
        logger.warning(f"Safety bypass for user {user_id}: {safety_result.get('response')}")

        # Return crisis response without full orchestration
        empty_identity = previous_identity or IdentitySnapshot()

        return ConductorResult(
            mirrorback=str(safety_result.get("response", "")),
            reflection_id=str(uuid4()),
            bundle=OrchestratorBundle(
                emotion=UserEmotion(
                    primary="crisis",
                    valence=-1.0,
                    arousal=1.0,
                    intensity=1.0
                ),
                identity=empty_identity,
                semantic=SemanticAnalysis(),
                logic=LogicMap(),
                grounding=GroundingContext(needed=False),
                tone=ToneDecision(mirror_tone="soft", intensity="low", focus="emotion")
            ),
            identity_updated=empty_identity,
            lint_passed=True,
            lint_violations=[]
        )

    # ---------------------------------------------------------------------------
    # STEP 1: Emotional scan (Hume)
    # ---------------------------------------------------------------------------

    logger.info("Step 1: Analyzing emotion")
    emotion = await analyze_emotion(text, audio_data)
    logger.info(f"Emotion detected: {emotion.primary} (valence: {emotion.valence}, intensity: {emotion.intensity})")

    # ---------------------------------------------------------------------------
    # STEP 2: Semantic parse (OpenAI)
    # ---------------------------------------------------------------------------

    logger.info("Step 2: Semantic analysis")
    semantic = await semantic_analysis(text)
    logger.info(f"Topics: {semantic.topics}, Core question: {semantic.core_question}")

    # ---------------------------------------------------------------------------
    # STEP 3: Identity merge (OpenAI)
    # ---------------------------------------------------------------------------

    logger.info("Step 3: Identity merge")
    previous_identity = previous_identity or IdentitySnapshot()
    identity = await merge_identity(previous_identity, semantic, text)
    logger.info(f"Active tensions: {identity.tensions[:3]}, Loops: {identity.recurring_loops[:3]}")

    # ---------------------------------------------------------------------------
    # STEP 4: Logic & paradox map (Gemini)
    # ---------------------------------------------------------------------------

    logger.info("Step 4: Building logic map")
    logic = await build_logic_map(text, semantic, identity)
    logger.info(f"Contradictions: {len(logic.contradictions)}, Paradoxes: {len(logic.paradoxes)}")

    # ---------------------------------------------------------------------------
    # STEP 5: Conditional grounding (Perplexity)
    # ---------------------------------------------------------------------------

    logger.info("Step 5: Checking if grounding needed")
    grounding = await maybe_get_grounding(text, semantic)
    if grounding.needed:
        logger.info(f"Grounding: {len(grounding.retrieved_facts)} facts retrieved")

    # ---------------------------------------------------------------------------
    # STEP 6: Tone decision
    # ---------------------------------------------------------------------------

    logger.info("Step 6: Deciding tone")
    tone_decision = decide_tone(emotion, identity, logic)
    logger.info(f"Tone: {tone_decision.mirror_tone}, Intensity: {tone_decision.intensity}, Focus: {tone_decision.focus}")

    # ---------------------------------------------------------------------------
    # STEP 7: Mirrorback draft (Claude)
    # ---------------------------------------------------------------------------

    logger.info("Step 7: Generating mirrorback with Claude")
    draft_mirrorback = await generate_mirrorback_with_conductor(
        text=text,
        emotion=emotion,
        identity=identity,
        semantic=semantic,
        logic=logic,
        grounding=grounding,
        tone_decision=tone_decision,
        strict=False
    )

    # ---------------------------------------------------------------------------
    # STEP 8a: Safety & style filter (OpenAI)
    # ---------------------------------------------------------------------------

    logger.info("Step 8a: Safety and style filtering")
    final_mirrorback = await safety_and_style_filter(draft_mirrorback)

    # ---------------------------------------------------------------------------
    # STEP 8a.5: Lint check
    # ---------------------------------------------------------------------------

    logger.info("Step 8a.5: Running MirrorCore lint")
    lint_result = mirrorcore_lint(final_mirrorback)
    lint_passed = bool(lint_result.get("passed"))
    lint_violations = lint_result.get("violations") or []

    if not lint_passed:
        logger.warning(f"Lint failed with violations: {lint_violations}")
        # Retry with strict mode
        logger.info("Retrying mirrorback generation in strict mode")
        draft_mirrorback = await generate_mirrorback_with_conductor(
            text=text,
            emotion=emotion,
            identity=identity,
            semantic=semantic,
            logic=logic,
            grounding=grounding,
            tone_decision=tone_decision,
            strict=True
        )
        final_mirrorback = await safety_and_style_filter(draft_mirrorback)

        # Check again
        lint_result = mirrorcore_lint(final_mirrorback)
        lint_passed = bool(lint_result.get("passed"))
        lint_violations = lint_result.get("violations") or []

    # ---------------------------------------------------------------------------
    # STEP 8b: Identity delta computation (OpenAI)
    # ---------------------------------------------------------------------------

    logger.info("Step 8b: Computing identity delta")
    delta = await compute_identity_delta(
        identity=identity,
        text=text,
        final_mirrorback=final_mirrorback,
        semantic=semantic,
        logic=logic,
        emotion=emotion
    )

    # Apply delta
    identity_updated = apply_identity_delta(identity, delta)
    logger.info(f"Identity updated: {len(delta.new_tensions)} new tensions, {len(delta.resolved_tensions)} resolved")

    # ---------------------------------------------------------------------------
    # Build result
    # ---------------------------------------------------------------------------

    bundle = OrchestratorBundle(
        emotion=emotion,
        identity=identity_updated,
        semantic=semantic,
        logic=logic,
        grounding=grounding,
        tone=tone_decision
    )

    reflection_id = str(uuid4())

    result = ConductorResult(
        mirrorback=final_mirrorback,
        reflection_id=reflection_id,
        bundle=bundle,
        identity_updated=identity_updated,
        identity_delta=delta,
        lint_passed=lint_passed,
        lint_violations=lint_violations
    )

    logger.info(f"Conductor orchestration complete for user {user_id}")
    return result
