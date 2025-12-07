"""
Tone decision matrix for the MirrorX Conductor.

Determines how MirrorX should respond based on emotional state,
identity patterns, and logical structures.
"""

import logging
from typing import List

from conductor_models import (
    UserEmotion,
    IdentitySnapshot,
    LogicMap,
    ToneDecision,
)

logger = logging.getLogger("mirrorx.conductor.tone")


def decide_tone(
    emotion: UserEmotion,
    identity: IdentitySnapshot,
    logic: LogicMap
) -> ToneDecision:
    """
    Decide how MirrorX should respond tonally.

    Uses a decision matrix based on:
    - Emotional axis: fragile ↔ resourced
    - Loop axis: stuck ↔ flowing
    - Openness axis: resistant ↔ inviting challenge

    Args:
        emotion: User's emotional state
        identity: User's identity snapshot
        logic: Logic map of current reflection

    Returns:
        ToneDecision specifying tone, intensity, and focus
    """

    # ---------------------------------------------------------------------------
    # Calculate decision factors
    # ---------------------------------------------------------------------------

    # 1. Emotional distress (fragile state)
    high_distress = emotion.valence < -0.5 and emotion.intensity > 0.6

    # 2. Crisis emotions
    crisis_emotions = {'despair', 'hopeless', 'overwhelmed', 'panic', 'trapped'}
    is_crisis = emotion.primary.lower() in crisis_emotions

    # 3. Heavy loops (stuck)
    # User is looping if they have recurring patterns and this reflection touches them
    has_loops = len(identity.recurring_loops) > 0
    heavy_loops = has_loops and len(identity.recurring_loops) >= 3

    # 4. New paradox (openness for exploration)
    new_paradox = len(logic.paradoxes) > 0 and not heavy_loops

    # 5. Hard contradictions (needs direct naming)
    hard_contradictions = [c for c in logic.contradictions if c.contradiction_type == "hard"]
    has_hard_contradictions = len(hard_contradictions) > 0

    # 6. Resourced state (can handle more challenge)
    is_resourced = emotion.valence > 0.0 and emotion.arousal < 0.7

    # 7. Philosophical/contemplative mode
    contemplative_emotions = {'curious', 'contemplative', 'wondering', 'open'}
    is_contemplative = emotion.primary.lower() in contemplative_emotions

    # 8. Regression (sliding back)
    is_regressing = len(identity.regressions) > 0

    # 9. Low energy state
    is_low_energy = emotion.arousal < 0.3

    # ---------------------------------------------------------------------------
    # Decision matrix
    # ---------------------------------------------------------------------------

    # PRIORITY 1: Crisis or high distress → SOFT + LOW + EMOTION
    if is_crisis or high_distress:
        logger.info("Tone decision: crisis/high distress → soft, low, emotion")
        return ToneDecision(
            mirror_tone="soft",
            intensity="low",
            focus="emotion"
        )

    # PRIORITY 2: Heavy loops (stuck pattern) → DIRECT + MEDIUM + LOGIC
    if heavy_loops:
        logger.info("Tone decision: heavy loops → direct, medium, logic")
        return ToneDecision(
            mirror_tone="direct",
            intensity="medium",
            focus="logic"
        )

    # PRIORITY 3: Hard contradictions + resourced → DIRECT + MEDIUM + LOGIC
    if has_hard_contradictions and is_resourced:
        logger.info("Tone decision: hard contradictions + resourced → direct, medium, logic")
        return ToneDecision(
            mirror_tone="direct",
            intensity="medium",
            focus="logic"
        )

    # PRIORITY 4: New paradox + resourced → PLAYFUL + MEDIUM + PARADOX
    if new_paradox and is_resourced:
        logger.info("Tone decision: new paradox + resourced → playful, medium, paradox")
        return ToneDecision(
            mirror_tone="playful",
            intensity="medium",
            focus="paradox"
        )

    # PRIORITY 5: Regression → SOFT + LOW + STORY
    if is_regressing:
        logger.info("Tone decision: regression → soft, low, story")
        return ToneDecision(
            mirror_tone="soft",
            intensity="low",
            focus="story"
        )

    # PRIORITY 6: Contemplative + open → PROVOCATIVE + MEDIUM + PARADOX
    if is_contemplative and is_resourced:
        logger.info("Tone decision: contemplative + resourced → provocative, medium, paradox")
        return ToneDecision(
            mirror_tone="provocative",
            intensity="medium",
            focus="paradox"
        )

    # PRIORITY 7: Low energy → AUSTERE + LOW + EMOTION
    if is_low_energy:
        logger.info("Tone decision: low energy → austere, low, emotion")
        return ToneDecision(
            mirror_tone="austere",
            intensity="low",
            focus="emotion"
        )

    # PRIORITY 8: Soft contradictions (productive tension) → SOFT + MEDIUM + PARADOX
    soft_contradictions = [c for c in logic.contradictions if c.contradiction_type == "soft"]
    if len(soft_contradictions) > 0:
        logger.info("Tone decision: soft contradictions → soft, medium, paradox")
        return ToneDecision(
            mirror_tone="soft",
            intensity="medium",
            focus="paradox"
        )

    # DEFAULT: Neutral/balanced state → AUSTERE + LOW + STORY
    logger.info("Tone decision: default → austere, low, story")
    return ToneDecision(
        mirror_tone="austere",
        intensity="low",
        focus="story"
    )


def format_tone_for_claude(tone_decision: ToneDecision) -> str:
    """
    Format tone decision as instructions for Claude.

    Args:
        tone_decision: The decided tone

    Returns:
        String instructions for Claude's system prompt
    """

    tone_descriptions = {
        "soft": "gentle, holding, spacious—like sitting with someone in pain",
        "direct": "clear, naming what's there, no hedging—'Here's what I see'",
        "playful": "curious, light touch, inviting exploration without forcing",
        "austere": "minimal, spare, letting silence do work—fewer words, more weight",
        "silent": "mostly observation, almost no interpretation—just reflecting back",
        "provocative": "edgy, challenging, pushing on contradictions—'Is that really true?'"
    }

    intensity_descriptions = {
        "low": "Stay gentle. Don't push. Offer space.",
        "medium": "You can name tensions directly, but leave room.",
        "high": "Be firm. This person can handle directness. Don't soften."
    }

    focus_descriptions = {
        "emotion": "Center on what they're feeling. Name the emotional reality.",
        "logic": "Focus on the pattern, the loop, the reasoning that's stuck.",
        "story": "Reflect the narrative they're telling about themselves.",
        "paradox": "Hold the contradiction. Don't resolve it. Make it visible."
    }

    tone_desc = tone_descriptions.get(tone_decision.mirror_tone, "")
    intensity_desc = intensity_descriptions.get(tone_decision.intensity, "")
    focus_desc = focus_descriptions.get(tone_decision.focus, "")

    return f"""TONE GUIDANCE:
Mirror tone: {tone_decision.mirror_tone} — {tone_desc}
Intensity: {tone_decision.intensity} — {intensity_desc}
Focus: {tone_decision.focus} — {focus_desc}
"""
