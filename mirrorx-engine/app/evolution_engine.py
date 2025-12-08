"""
Evolution Awareness Engine for MirrorX.

Detects growth, stagnation, loops, regression, breakthroughs, and blind spots.
This is MirrorX's "metacognitive brain" - it sees when users evolve (or don't).
"""

import logging
import json
from typing import Dict, Any, List, Optional

from app.conductor_models import (
    IdentityDelta,
    OrchestratorBundle,
)

logger = logging.getLogger("mirrorx.evolution_engine")


def detect_and_record_evolution(
    supabase_client,
    reflection_id: str,
    user_id: str,
    identity_delta: IdentityDelta,
    bundle: OrchestratorBundle
) -> Dict[str, Any]:
    """
    Detect all evolution events after a reflection.

    Calls SQL procedures to detect:
    - Growth (belief shifts, tension softening, loop weakening)
    - Stagnation (repeated topics, flat emotions)
    - Loops (recurring patterns)
    - Regression (tension intensification, tone regression)
    - Breakthroughs (resolutions, reframings)
    - Blind spots (persistent contradictions, deflective language)

    Args:
        supabase_client: Supabase client
        reflection_id: UUID of reflection
        user_id: UUID of user
        identity_delta: IdentityDelta with changes
        bundle: Complete OrchestratorBundle

    Returns:
        dict with:
            - events_detected: List of evolution events
            - snapshot: Updated evolution snapshot
    """
    try:
        logger.info(f"Running evolution detection for reflection {reflection_id}")

        # Convert models to JSON
        delta_json = identity_delta.model_dump()
        emotion_json = bundle.emotion.model_dump()
        semantic_json = bundle.semantic.model_dump()
        logic_json = bundle.logic.model_dump()
        tone_json = bundle.tone.model_dump()

        # =======================================================================
        # STEP 1: Run all evolution detectors
        # =======================================================================

        supabase_client.rpc(
            "detect_all_evolution_events",
            {
                "p_reflection_id": reflection_id,
                "p_user_id": user_id,
                "p_identity_delta": json.dumps(delta_json),
                "p_emotion": json.dumps(emotion_json),
                "p_semantic": json.dumps(semantic_json),
                "p_logic": json.dumps(logic_json),
                "p_tone": json.dumps(tone_json),
            }
        ).execute()

        logger.info("Evolution detectors completed")

        # =======================================================================
        # STEP 2: Update evolution snapshot
        # =======================================================================

        supabase_client.rpc(
            "update_evolution_snapshot",
            {
                "p_user_id": user_id
            }
        ).execute()

        logger.info("Evolution snapshot updated")

        # =======================================================================
        # STEP 3: Get events that were just detected
        # =======================================================================

        events_result = supabase_client.table("mirrorx_evolution_events") \
            .select("event_type, label, description, severity, created_at, data") \
            .eq("reflection_id", reflection_id) \
            .execute()

        events = [
            {
                "event_type": e["event_type"],
                "label": e["label"],
                "description": e.get("description"),
                "severity": float(e["severity"]),
                "created_at": e["created_at"]
            }
            for e in events_result.data
        ]

        logger.info(f"Detected {len(events)} evolution events")

        # =======================================================================
        # STEP 4: Get updated evolution snapshot
        # =======================================================================

        snapshot_result = supabase_client.table("mirrorx_evolution_snapshots") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        snapshot = snapshot_result.data[0] if snapshot_result.data else {}

        return {
            "events_detected": events,
            "snapshot": {
                "growth_score": float(snapshot.get("growth_score", 0.0)),
                "stagnation_score": float(snapshot.get("stagnation_score", 0.0)),
                "loop_score": float(snapshot.get("loop_score", 0.0)),
                "regression_score": float(snapshot.get("regression_score", 0.0)),
                "breakthrough_score": float(snapshot.get("breakthrough_score", 0.0)),
                "blindspot_score": float(snapshot.get("blindspot_score", 0.0)),
                "total_events": snapshot.get("total_events", 0),
                "recent_events": snapshot.get("recent_events", []),
                "active_alerts": snapshot.get("active_alerts", [])
            }
        }

    except Exception as e:
        logger.exception(f"Failed to detect evolution: {e}")
        return {
            "events_detected": [],
            "snapshot": {}
        }


def get_evolution_context_for_claude(
    supabase_client,
    user_id: str
) -> str:
    """
    Get evolution context to include in Claude's system prompt.

    This gives Claude awareness of:
    - Recent evolution events
    - Growth/stagnation patterns
    - Active loops and blind spots
    - Breakthrough moments

    Args:
        supabase_client: Supabase client
        user_id: UUID of user

    Returns:
        Formatted string for Claude's context
    """
    try:
        # Get evolution snapshot
        snapshot_result = supabase_client.table("mirrorx_evolution_snapshots") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        if not snapshot_result.data:
            return ""

        snapshot = snapshot_result.data[0]

        # Build context string
        context_parts = []

        context_parts.append("EVOLUTION CONTEXT:")

        # Scores
        growth = float(snapshot.get("growth_score", 0.0))
        stagnation = float(snapshot.get("stagnation_score", 0.0))
        loop_score = float(snapshot.get("loop_score", 0.0))
        breakthrough = float(snapshot.get("breakthrough_score", 0.0))
        blindspot = float(snapshot.get("blindspot_score", 0.0))

        if growth > 0.3:
            context_parts.append(f"- Growth detected (score: {growth:.2f})")
        if stagnation > 0.3:
            context_parts.append(f"- Stagnation present (score: {stagnation:.2f})")
        if loop_score > 0.3:
            context_parts.append(f"- Active loops detected (score: {loop_score:.2f})")
        if breakthrough > 0.3:
            context_parts.append(f"- Recent breakthrough (score: {breakthrough:.2f})")
        if blindspot > 0.3:
            context_parts.append(f"- Blind spots present (score: {blindspot:.2f})")

        # Active alerts
        active_alerts = snapshot.get("active_alerts", [])
        if active_alerts and len(active_alerts) > 0:
            context_parts.append("\nACTIVE ALERTS:")
            for alert in active_alerts[:3]:  # Top 3
                context_parts.append(f"- {alert.get('label')} (severity: {alert.get('severity', 0):.2f})")

        # Recent events
        recent_events = snapshot.get("recent_events", [])
        if recent_events and len(recent_events) > 0:
            context_parts.append("\nRECENT EVOLUTION:")
            for event in recent_events[:5]:  # Last 5
                event_type = event.get("event_type", "").upper()
                label = event.get("label", "")
                context_parts.append(f"- [{event_type}] {label}")

        return "\n".join(context_parts)

    except Exception as e:
        logger.exception(f"Failed to get evolution context: {e}")
        return ""


def get_evolution_summary(
    supabase_client,
    user_id: str
) -> Dict[str, Any]:
    """
    Get complete evolution summary for a user.

    Returns:
        dict with scores, events, timeline, alerts
    """
    try:
        # Get snapshot
        snapshot_result = supabase_client.table("mirrorx_evolution_snapshots") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        if not snapshot_result.data:
            return {
                "scores": {},
                "recent_events": [],
                "active_alerts": [],
                "timeline": []
            }

        snapshot = snapshot_result.data[0]

        # Get recent events from table (for timeline)
        timeline_result = supabase_client.table("mirrorx_evolution_events") \
            .select("event_type, label, severity, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()

        timeline = [
            {
                "event_type": e["event_type"],
                "label": e["label"],
                "severity": float(e["severity"]),
                "created_at": e["created_at"]
            }
            for e in timeline_result.data
        ]

        return {
            "scores": {
                "growth": float(snapshot.get("growth_score", 0.0)),
                "stagnation": float(snapshot.get("stagnation_score", 0.0)),
                "loop": float(snapshot.get("loop_score", 0.0)),
                "regression": float(snapshot.get("regression_score", 0.0)),
                "breakthrough": float(snapshot.get("breakthrough_score", 0.0)),
                "blindspot": float(snapshot.get("blindspot_score", 0.0))
            },
            "recent_events": snapshot.get("recent_events", []),
            "active_alerts": snapshot.get("active_alerts", []),
            "timeline": timeline,
            "total_events": snapshot.get("total_events", 0),
            "last_growth": snapshot.get("last_growth_event"),
            "last_breakthrough": snapshot.get("last_breakthrough_event"),
            "last_regression": snapshot.get("last_regression_event")
        }

    except Exception as e:
        logger.exception(f"Failed to get evolution summary: {e}")
        return {
            "scores": {},
            "recent_events": [],
            "active_alerts": [],
            "timeline": []
        }


def interpret_evolution_state(snapshot: Dict[str, Any]) -> str:
    """
    Interpret evolution scores into human-readable state.

    Args:
        snapshot: Evolution snapshot dict

    Returns:
        Human-readable interpretation
    """
    scores = snapshot.get("scores", {})

    growth = scores.get("growth", 0.0)
    stagnation = scores.get("stagnation", 0.0)
    loop_score = scores.get("loop", 0.0)
    breakthrough = scores.get("breakthrough", 0.0)
    blindspot = scores.get("blindspot", 0.0)
    regression = scores.get("regression", 0.0)

    # Dominant pattern
    if breakthrough > 0.5:
        return "BREAKTHROUGH - Major shift happening"
    elif growth > 0.5 and stagnation < 0.3:
        return "EVOLVING - Steady growth trajectory"
    elif loop_score > 0.6:
        return "LOOPING - Stuck in recurring patterns"
    elif stagnation > 0.5:
        return "STAGNANT - Talking but not changing"
    elif regression > 0.5:
        return "REGRESSING - Returning to old patterns"
    elif blindspot > 0.5:
        return "BLIND SPOTS - Avoiding contradictions"
    elif growth > 0.3:
        return "GRADUAL GROWTH - Slow evolution"
    else:
        return "EXPLORING - Early journey, gathering data"
