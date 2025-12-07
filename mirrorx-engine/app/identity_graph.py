"""
Identity Graph Management for MirrorX.

This module handles the identity memory system using the
comprehensive database schema with tensions, loops, and beliefs.

Now includes TRUE GRAPH LAYER with nodes, edges, weights, and time decay.
"""

import logging
import json
from typing import Optional
from uuid import UUID

from conductor_models import (
    IdentityDelta,
    OrchestratorBundle,
)
from graph_manager import update_graph_for_reflection, get_graph_state
from evolution_engine import detect_and_record_evolution

logger = logging.getLogger("mirrorx.identity_graph")


def apply_identity_delta_to_db(
    supabase_client,
    reflection_id: str,
    user_id: str,
    identity_delta: IdentityDelta,
    bundle: OrchestratorBundle
) -> None:
    """
    Apply identity delta and orchestrator bundle to the database.

    This calls the SQL stored procedure that:
    1. Inserts all analytics (emotion, semantic, logic, tone, grounding)
    2. Applies the identity delta (tensions, loops, beliefs)
    3. Creates link tables
    4. Rebuilds identity snapshot
    5. Updates the GRAPH LAYER with nodes, edges, and weights

    Args:
        supabase_client: Supabase client instance
        reflection_id: UUID of the reflection
        user_id: UUID of the user
        identity_delta: IdentityDelta with changes to apply
        bundle: Complete OrchestratorBundle
    """
    try:
        # Convert models to JSON
        delta_json = identity_delta.model_dump()
        emotion_json = bundle.emotion.model_dump()
        semantic_json = bundle.semantic.model_dump()
        logic_json = bundle.logic.model_dump()
        grounding_json = bundle.grounding.model_dump()
        tone_json = bundle.tone.model_dump()

        logger.info(f"Applying identity delta for reflection {reflection_id}")

        # =======================================================================
        # STEP 1: Apply delta to relational tables (tensions, loops, beliefs)
        # =======================================================================

        result = supabase_client.rpc(
            "apply_identity_delta",
            {
                "p_reflection_id": reflection_id,
                "p_user_id": user_id,
                "p_identity_delta": json.dumps(delta_json),
            }
        ).execute()

        # Get IDs of touched entities
        if result.data and len(result.data) > 0:
            tension_ids = result.data[0].get("tension_ids", [])
            loop_ids = result.data[0].get("loop_ids", [])
            belief_ids = result.data[0].get("belief_ids", [])
        else:
            tension_ids = []
            loop_ids = []
            belief_ids = []

        logger.info(f"Delta applied: {len(tension_ids)} tensions, {len(loop_ids)} loops, {len(belief_ids)} beliefs")

        # =======================================================================
        # STEP 2: Update GRAPH LAYER (nodes, edges, weights)
        # =======================================================================

        graph_result = update_graph_for_reflection(
            supabase_client=supabase_client,
            user_id=user_id,
            reflection_id=reflection_id,
            bundle=bundle,
            tension_ids=tension_ids,
            loop_ids=loop_ids,
            belief_ids=belief_ids
        )

        logger.info(f"Graph updated: {graph_result.get('theme_count', 0)} themes, {len(graph_result.get('top_nodes', []))} top nodes")

        # =======================================================================
        # STEP 3: DETECT EVOLUTION (growth, stagnation, loops, etc.)
        # =======================================================================

        evolution_result = detect_and_record_evolution(
            supabase_client=supabase_client,
            reflection_id=reflection_id,
            user_id=user_id,
            identity_delta=identity_delta,
            bundle=bundle
        )

        logger.info(f"Evolution detection: {len(evolution_result.get('events_detected', []))} events")

        # =======================================================================
        # STEP 4: Update identity snapshot with graph_state
        # =======================================================================

        graph_state = get_graph_state(supabase_client, user_id)

        supabase_client.table("mirrorx_identity_snapshots_v2").upsert({
            "user_id": user_id,
            "graph_state": json.dumps(graph_state),
            "updated_at": "now()"
        }).execute()

        logger.info(f"Identity delta + graph + evolution complete for user {user_id}")

    except Exception as e:
        logger.exception(f"Failed to apply identity delta: {e}")
        raise


def get_identity_context_from_db(supabase_client, user_id: str) -> dict:
    """
    Retrieve identity context for the conductor.

    Fetches:
    - Active tensions
    - Active loops
    - Recent beliefs
    - Identity snapshot

    Args:
        supabase_client: Supabase client instance
        user_id: UUID of the user

    Returns:
        dict with identity context for the conductor
    """
    try:
        # Get identity snapshot
        snapshot_resp = supabase_client.table("mirrorx_identity_snapshots_v2") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        snapshot = snapshot_resp.data[0] if snapshot_resp.data else None

        # Get active tensions
        tensions_resp = supabase_client.table("mirrorx_tensions") \
            .select("label, type, pole_a, pole_b, strength") \
            .eq("user_id", user_id) \
            .is_("resolved_at", "null") \
            .order("strength", desc=True) \
            .limit(10) \
            .execute()

        tensions = [
            f"{t['label']} ({t['pole_a']} vs {t['pole_b']})" if t['pole_a'] and t['pole_b'] else t['label']
            for t in tensions_resp.data
        ]

        # Get active loops
        loops_resp = supabase_client.table("mirrorx_loops") \
            .select("name, occurrence_count") \
            .eq("user_id", user_id) \
            .eq("active", True) \
            .order("occurrence_count", desc=True) \
            .limit(10) \
            .execute()

        loops = [f"{l['name']} (x{l['occurrence_count']})" for l in loops_resp.data]

        # Get recent beliefs
        beliefs_resp = supabase_client.table("mirrorx_beliefs") \
            .select("text, status, importance") \
            .eq("user_id", user_id) \
            .in_("status", ["stated", "implied", "questioned"]) \
            .order("importance", desc=True) \
            .limit(10) \
            .execute()

        beliefs = [b['text'] for b in beliefs_resp.data]

        # Get recent reflections (last 5)
        reflections_resp = supabase_client.table("mirrorx_reflections") \
            .select("mirrorback_text") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()

        last_reflections = [
            r['mirrorback_text'][:100] + "..." if len(r['mirrorback_text']) > 100 else r['mirrorback_text']
            for r in reflections_resp.data
            if r['mirrorback_text']
        ]

        context = {
            "tensions": tensions,
            "loops": loops,
            "beliefs": beliefs,
            "last_reflections": last_reflections,
            "dominant_tension": None,
            "big_question": None,
            "emotional_baseline": None,
            "oscillation_pattern": None,
        }

        if snapshot:
            context["big_question"] = snapshot.get("current_big_question")
            context["emotional_baseline"] = snapshot.get("emotional_baseline", {}).get("recent_emotions", [])
            context["oscillation_pattern"] = snapshot.get("oscillation_pattern", {}).get("primary_poles")

        logger.info(f"Retrieved identity context for user {user_id}: {len(tensions)} tensions, {len(loops)} loops")

        return context

    except Exception as e:
        logger.exception(f"Failed to get identity context: {e}")
        # Return empty context on error
        return {
            "tensions": [],
            "loops": [],
            "beliefs": [],
            "last_reflections": [],
            "dominant_tension": None,
            "big_question": None,
            "emotional_baseline": None,
            "oscillation_pattern": None,
        }


def create_reflection_record(
    supabase_client,
    user_id: str,
    input_text: str,
    mirrorback_text: str,
    conversation_id: Optional[str] = None,
    source: str = "web"
) -> str:
    """
    Create a reflection record in the database.

    Args:
        supabase_client: Supabase client instance
        user_id: UUID of the user
        input_text: User's input text
        mirrorback_text: Generated mirrorback
        conversation_id: Optional conversation grouping ID
        source: Source of reflection ('web', 'app', etc.)

    Returns:
        UUID of created reflection
    """
    try:
        result = supabase_client.table("mirrorx_reflections").insert({
            "user_id": user_id,
            "input_text": input_text,
            "mirrorback_text": mirrorback_text,
            "conversation_id": conversation_id,
            "source": source,
        }).execute()

        reflection_id = result.data[0]["id"]
        logger.info(f"Created reflection {reflection_id} for user {user_id}")

        return reflection_id

    except Exception as e:
        logger.exception(f"Failed to create reflection: {e}")
        raise


def ensure_user_exists(supabase_client, user_id: str, handle: Optional[str] = None) -> None:
    """
    Ensure user exists in mirrorx_users table.

    Args:
        supabase_client: Supabase client instance
        user_id: UUID of the user
        handle: Optional handle/display name
    """
    try:
        # Check if user exists
        result = supabase_client.table("mirrorx_users") \
            .select("id") \
            .eq("id", user_id) \
            .execute()

        if not result.data:
            # Create user
            supabase_client.table("mirrorx_users").insert({
                "id": user_id,
                "handle": handle,
            }).execute()

            logger.info(f"Created mirrorx_users record for {user_id}")

    except Exception as e:
        logger.exception(f"Failed to ensure user exists: {e}")
        # Non-critical, continue


def get_recent_reflections_with_analysis(supabase_client, user_id: str, limit: int = 10) -> list:
    """
    Get recent reflections with their full analysis (emotion, tone, etc.).

    Args:
        supabase_client: Supabase client instance
        user_id: UUID of the user
        limit: Max number of reflections to return

    Returns:
        List of dicts with reflection data and analysis
    """
    try:
        # Use the view we created
        result = supabase_client.from_("mirrorx_recent_reflections_with_emotion") \
            .select("*") \
            .eq("user_id", user_id) \
            .limit(limit) \
            .execute()

        return result.data

    except Exception as e:
        logger.exception(f"Failed to get recent reflections: {e}")
        return []
