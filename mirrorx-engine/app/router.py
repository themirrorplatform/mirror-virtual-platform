"""
Central Router for MirrorX Orchestration.

This is the brain that:
- Receives user inputs
- Decides which workers to activate
- Passes outputs downstream in order
- Coordinates timing and dependencies
- Detects contradictions between models
- Resolves contradictions (with optional manual oversight)
- Chooses final output

Worker Architecture:
- Claude: The Voice (only one who speaks to user)
- GPT: The Scribe (structure, safety, delta)
- Gemini: The Logician (logic maps, paradoxes)
- Perplexity: The Grounder (facts, citations)
- Hume: The Sensor (emotions only)
"""

import logging
import json
from typing import Optional, Dict, Any, List
from uuid import UUID

from app.conductor_models import (
    UserEmotion,
    SemanticAnalysis,
    IdentitySnapshot,
    LogicMap,
    GroundingContext,
    ToneDecision,
    OrchestratorBundle,
    IdentityDelta,
)
from app.conductor_providers import (
    analyze_emotion,
    semantic_analysis,
    merge_identity,
    build_logic_map,
    maybe_get_grounding,
    safety_and_style_filter,
    compute_identity_delta,
)
from app.conductor_tone import decide_tone
from app.conductor_claude import generate_mirrorback_with_conductor
from app.mirrorcore import mirrorcore_lint
from app.safety import safety_check

logger = logging.getLogger("mirrorx.router")


class RouterConfig:
    """Configuration for which workers to activate."""

    def __init__(
        self,
        enable_hume: bool = True,
        enable_gpt: bool = True,
        enable_gemini: bool = True,
        enable_perplexity: bool = True,
        enable_claude: bool = True,
        mode: str = "full_analysis"
    ):
        self.enable_hume = enable_hume
        self.enable_gpt = enable_gpt
        self.enable_gemini = enable_gemini
        self.enable_perplexity = enable_perplexity
        self.enable_claude = enable_claude
        self.mode = mode

    @classmethod
    def full_analysis(cls) -> "RouterConfig":
        """All workers enabled."""
        return cls(mode="full_analysis")

    @classmethod
    def light_mode(cls) -> "RouterConfig":
        """Skip Gemini and Perplexity for faster responses."""
        return cls(
            enable_gemini=False,
            enable_perplexity=False,
            mode="light_mode"
        )

    @classmethod
    def emergency_mode(cls) -> "RouterConfig":
        """Only safety check and direct response."""
        return cls(
            enable_hume=False,
            enable_gemini=False,
            enable_perplexity=False,
            mode="emergency_mode"
        )


def decide_worker_config(
    text: str,
    user_history: Optional[Dict] = None,
    user_preferences: Optional[Dict] = None
) -> RouterConfig:
    """
    Decide which workers to activate based on input and context.

    Args:
        text: User's reflection text
        user_history: Optional user history context
        user_preferences: Optional user preferences

    Returns:
        RouterConfig specifying which workers to activate
    """
    # Heuristics for worker selection

    # 1. Check if user wants fast mode
    if user_preferences and user_preferences.get("fast_mode"):
        return RouterConfig.light_mode()

    # 2. Check for crisis keywords (emergency mode)
    crisis_keywords = ["suicide", "kill myself", "end it all"]
    if any(keyword in text.lower() for keyword in crisis_keywords):
        return RouterConfig.emergency_mode()

    # 3. Check if external grounding likely needed
    external_keywords = [
        "what should i do about", "how does", "what is",
        "explain", "research", "studies", "science",
        "market", "economy", "medical", "diagnosis"
    ]
    needs_grounding = any(keyword in text.lower() for keyword in external_keywords)

    # 4. Check if deep logic analysis needed
    logic_keywords = [
        "contradiction", "paradox", "doesn't make sense",
        "on one hand", "but then", "conflicts with"
    ]
    needs_logic = any(keyword in text.lower() for keyword in logic_keywords)

    # 5. Short reflections might not need full analysis
    if len(text.split()) < 20:
        return RouterConfig.light_mode()

    # 6. If user has no history, do full analysis to build baseline
    if not user_history or len(user_history.get("tensions", [])) == 0:
        return RouterConfig.full_analysis()

    # Default: full analysis
    return RouterConfig.full_analysis()


async def route_reflection(
    user_id: str,
    text: str,
    previous_identity: Optional[IdentitySnapshot] = None,
    audio_data: Optional[bytes] = None,
    config: Optional[RouterConfig] = None,
    supabase_client: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Central router function that orchestrates all workers.

    This is the brain of MirrorX's AI orchestration.

    Args:
        user_id: User UUID
        text: User's reflection text
        previous_identity: Previous identity snapshot
        audio_data: Optional audio data
        config: Router configuration (auto-decided if None)
        supabase_client: Supabase client for logging

    Returns:
        dict with:
            - mirrorback: Final response
            - bundle: OrchestratorBundle
            - delta: IdentityDelta
            - model_outputs: List of all model outputs
            - contradictions: List of detected contradictions
            - finalization_mode: 'auto' | 'deferred'
    """

    logger.info(f"Router starting for user {user_id}")

    # Auto-decide config if not provided
    if config is None:
        config = decide_worker_config(text)
        logger.info(f"Auto-selected config: {config.mode}")

    model_outputs = []
    contradictions = []

    # ---------------------------------------------------------------------------
    # STEP 0: Safety Check (always runs)
    # ---------------------------------------------------------------------------

    safety_result = safety_check(text)
    if safety_result.get("bypass_reflection"):
        logger.warning(f"Safety bypass for user {user_id}")
        return {
            "mirrorback": str(safety_result.get("response", "")),
            "bundle": None,
            "delta": None,
            "model_outputs": [],
            "contradictions": [],
            "finalization_mode": "auto",
            "bypass_reason": "safety"
        }

    # ---------------------------------------------------------------------------
    # STEP 1: Emotional Scan (Hume)
    # ---------------------------------------------------------------------------

    if config.enable_hume:
        logger.info("Step 1: Emotional scan (Hume)")
        emotion = await analyze_emotion(text, audio_data)
        model_outputs.append({
            "model_name": "hume",
            "role": "emotion",
            "raw_output": emotion.model_dump()
        })
    else:
        # Fallback
        emotion = UserEmotion(
            primary="neutral",
            valence=0.0,
            arousal=0.2,
            intensity=0.3
        )

    # ---------------------------------------------------------------------------
    # STEP 2: Semantic Parse (GPT)
    # ---------------------------------------------------------------------------

    if config.enable_gpt:
        logger.info("Step 2: Semantic parse (GPT)")
        semantic = await semantic_analysis(text)
        model_outputs.append({
            "model_name": "gpt",
            "role": "semantic",
            "raw_output": semantic.model_dump()
        })
    else:
        semantic = SemanticAnalysis()

    # ---------------------------------------------------------------------------
    # STEP 3: Identity Merge (GPT)
    # ---------------------------------------------------------------------------

    if config.enable_gpt:
        logger.info("Step 3: Identity merge (GPT)")
        previous_identity = previous_identity or IdentitySnapshot()
        identity = await merge_identity(previous_identity, semantic, text)
        model_outputs.append({
            "model_name": "gpt",
            "role": "identity_merge",
            "raw_output": identity.model_dump()
        })
    else:
        identity = previous_identity or IdentitySnapshot()

    # ---------------------------------------------------------------------------
    # STEP 4: Logic & Paradox Map (Gemini)
    # ---------------------------------------------------------------------------

    if config.enable_gemini:
        logger.info("Step 4: Logic map (Gemini)")
        logic = await build_logic_map(text, semantic, identity)
        model_outputs.append({
            "model_name": "gemini",
            "role": "logic",
            "raw_output": logic.model_dump()
        })

        # Detect contradictions from logic map
        if logic.contradictions:
            for contradiction in logic.contradictions:
                contradictions.append({
                    "source": "logic_map",
                    "summary": f"{contradiction.claim_a} vs {contradiction.claim_b}",
                    "type": contradiction.contradiction_type,
                    "options": [
                        {"position": "hold_both", "description": "Honor both as true"},
                        {"position": "explore_tension", "description": "Explore the tension"},
                    ]
                })
    else:
        logic = LogicMap()

    # ---------------------------------------------------------------------------
    # STEP 5: Conditional Grounding (Perplexity)
    # ---------------------------------------------------------------------------

    if config.enable_perplexity:
        logger.info("Step 5: Grounding check (Perplexity)")
        grounding = await maybe_get_grounding(text, semantic)
        if grounding.needed:
            model_outputs.append({
                "model_name": "perplexity",
                "role": "grounding",
                "raw_output": grounding.model_dump()
            })

            # Check for contradictions between grounding and beliefs
            if grounding.retrieved_facts and semantic.beliefs_stated:
                contradictions.append({
                    "source": "cross_model",
                    "summary": "External facts vs stated beliefs",
                    "type": "soft",
                    "options": [
                        {"position": "acknowledge_both", "description": "Acknowledge external context without overriding belief"},
                        {"position": "invite_reflection", "description": "Invite reflection on the gap"},
                    ]
                })
    else:
        grounding = GroundingContext(needed=False)

    # ---------------------------------------------------------------------------
    # STEP 6: Tone Decision
    # ---------------------------------------------------------------------------

    logger.info("Step 6: Tone decision")
    tone_decision = decide_tone(emotion, identity, logic)
    model_outputs.append({
        "model_name": "conductor",
        "role": "tone_decision",
        "raw_output": tone_decision.model_dump()
    })

    # ---------------------------------------------------------------------------
    # STEP 7: Mirrorback Draft (Claude)
    # ---------------------------------------------------------------------------

    if config.enable_claude:
        logger.info("Step 7: Mirrorback draft (Claude)")
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
        model_outputs.append({
            "model_name": "claude",
            "role": "mirrorback_draft",
            "raw_output": {"text": draft_mirrorback}
        })
    else:
        draft_mirrorback = "I hear you."

    # ---------------------------------------------------------------------------
    # STEP 8a: Safety & Style Filter (GPT)
    # ---------------------------------------------------------------------------

    if config.enable_gpt:
        logger.info("Step 8a: Safety filter (GPT)")
        final_mirrorback = await safety_and_style_filter(draft_mirrorback)
        model_outputs.append({
            "model_name": "gpt",
            "role": "safety_filter",
            "raw_output": {"text": final_mirrorback}
        })
    else:
        final_mirrorback = draft_mirrorback

    # ---------------------------------------------------------------------------
    # STEP 8a.5: Lint Check
    # ---------------------------------------------------------------------------

    logger.info("Step 8a.5: MirrorCore lint")
    lint_result = mirrorcore_lint(final_mirrorback)
    lint_passed = bool(lint_result.get("passed"))

    if not lint_passed:
        logger.warning(f"Lint failed: {lint_result.get('violations')}")
        # Retry with strict mode
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
        lint_result = mirrorcore_lint(final_mirrorback)

    # ---------------------------------------------------------------------------
    # STEP 8b: Identity Delta (GPT)
    # ---------------------------------------------------------------------------

    if config.enable_gpt:
        logger.info("Step 8b: Identity delta (GPT)")
        delta = await compute_identity_delta(
            identity=identity,
            text=text,
            final_mirrorback=final_mirrorback,
            semantic=semantic,
            logic=logic,
            emotion=emotion
        )
        model_outputs.append({
            "model_name": "gpt",
            "role": "identity_delta",
            "raw_output": delta.model_dump()
        })
    else:
        delta = IdentityDelta()

    # ---------------------------------------------------------------------------
    # Build Bundle
    # ---------------------------------------------------------------------------

    bundle = OrchestratorBundle(
        emotion=emotion,
        identity=identity,
        semantic=semantic,
        logic=logic,
        grounding=grounding,
        tone=tone_decision
    )

    # ---------------------------------------------------------------------------
    # Decide Finalization Mode
    # ---------------------------------------------------------------------------

    finalization_mode = "auto"

    # Defer if there are hard contradictions unresolved
    hard_contradictions = [c for c in contradictions if c.get("type") == "hard"]
    if hard_contradictions:
        finalization_mode = "deferred"
        logger.info("Deferring finalization due to hard contradictions")

    # Defer if lint failed twice
    if not lint_passed:
        finalization_mode = "deferred"
        logger.warning("Deferring finalization due to lint failures")

    # ---------------------------------------------------------------------------
    # Log to Database (if client provided)
    # ---------------------------------------------------------------------------

    if supabase_client:
        try:
            for output in model_outputs:
                supabase_client.rpc("log_model_output", {
                    "p_reflection_id": None,  # Set by caller
                    "p_model_name": output["model_name"],
                    "p_role": output["role"],
                    "p_raw_output": json.dumps(output["raw_output"])
                })

            for contradiction in contradictions:
                supabase_client.rpc("log_contradiction_resolution", {
                    "p_reflection_id": None,  # Set by caller
                    "p_source": contradiction["source"],
                    "p_summary": contradiction["summary"],
                    "p_options": json.dumps(contradiction["options"]),
                    "p_mode": "auto" if finalization_mode == "auto" else "deferred"
                })
        except Exception as e:
            logger.exception(f"Failed to log to database: {e}")

    # ---------------------------------------------------------------------------
    # Return Result
    # ---------------------------------------------------------------------------

    logger.info(f"Router complete for user {user_id}: {len(model_outputs)} outputs, {len(contradictions)} contradictions")

    return {
        "mirrorback": final_mirrorback,
        "bundle": bundle,
        "delta": delta,
        "model_outputs": model_outputs,
        "contradictions": contradictions,
        "finalization_mode": finalization_mode,
        "lint_passed": lint_passed,
        "lint_violations": lint_result.get("violations", [])
    }
