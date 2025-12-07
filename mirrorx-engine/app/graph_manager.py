"""
Graph Manager for MirrorX Identity Graph.

Manages the true graph layer with nodes, edges, weights, and time decay.
"""

import logging
import json
from typing import Optional, List, Dict, Any
from uuid import UUID

from conductor_models import (
    UserEmotion,
    SemanticAnalysis,
    OrchestratorBundle,
)

logger = logging.getLogger("mirrorx.graph_manager")


def calculate_emotional_boost(emotion: UserEmotion) -> float:
    """
    Calculate emotional boost from Hume emotion data.

    Formula: 0.5 * intensity + 0.5 * abs(valence)

    Args:
        emotion: UserEmotion from Hume or tone analysis

    Returns:
        float between 0 and 1
    """
    intensity = emotion.intensity or 0.0
    valence = abs(emotion.valence) if emotion.valence is not None else 0.0

    boost = 0.5 * intensity + 0.5 * valence
    return min(max(boost, 0.0), 1.0)


def update_graph_for_reflection(
    supabase_client,
    user_id: str,
    reflection_id: str,
    bundle: OrchestratorBundle,
    tension_ids: List[str] = None,
    loop_ids: List[str] = None,
    belief_ids: List[str] = None
) -> Dict[str, Any]:
    """
    Update the identity graph after a reflection.

    This creates/updates:
    - A reflection node
    - Nodes for all touched tensions, loops, beliefs, themes
    - Edges connecting reflection to everything it touched

    Args:
        supabase_client: Supabase client
        user_id: UUID of user
        reflection_id: UUID of reflection
        bundle: Complete OrchestratorBundle
        tension_ids: List of tension UUIDs touched
        loop_ids: List of loop UUIDs activated
        belief_ids: List of belief UUIDs expressed

    Returns:
        dict with node/edge counts and top nodes
    """
    try:
        logger.info(f"Updating graph for reflection {reflection_id}")

        # Calculate emotional boost
        emotional_boost = calculate_emotional_boost(bundle.emotion)

        # =======================================================================
        # STEP A: Create/update reflection node
        # =======================================================================

        reflection_node_result = supabase_client.rpc(
            "upsert_graph_node",
            {
                "p_user_id": user_id,
                "p_type": "reflection",
                "p_ref_id": reflection_id,
                "p_label": f"Reflection {reflection_id[:8]}",
                "p_emotional_intensity": bundle.emotion.intensity,
                "p_emotional_valence": bundle.emotion.valence,
                "p_base_weight": 0.5,
                "p_data": json.dumps({
                    "primary_emotion": bundle.emotion.primary,
                    "topics": bundle.semantic.topics[:5] if bundle.semantic.topics else []
                })
            }
        ).execute()

        reflection_node_id = reflection_node_result.data

        logger.info(f"Created/updated reflection node: {reflection_node_id}")

        # =======================================================================
        # STEP B: Create/update tension nodes and edges
        # =======================================================================

        tension_count = 0
        if tension_ids:
            for tension_id in tension_ids:
                # Get tension label from database
                tension_result = supabase_client.table("mirrorx_tensions") \
                    .select("label, type, pole_a, pole_b") \
                    .eq("id", tension_id) \
                    .execute()

                if tension_result.data:
                    tension = tension_result.data[0]

                    # Create/update tension node
                    tension_node_id = supabase_client.rpc(
                        "upsert_graph_node",
                        {
                            "p_user_id": user_id,
                            "p_type": "tension",
                            "p_ref_id": tension_id,
                            "p_label": tension["label"],
                            "p_base_weight": 0.5,
                            "p_data": json.dumps({
                                "tension_type": tension["type"],
                                "pole_a": tension.get("pole_a"),
                                "pole_b": tension.get("pole_b")
                            })
                        }
                    ).execute().data

                    # Create edge: reflection → tension
                    supabase_client.rpc(
                        "upsert_graph_edge",
                        {
                            "p_user_id": user_id,
                            "p_source_node_id": reflection_node_id,
                            "p_target_node_id": tension_node_id,
                            "p_type": "reflection_touches_tension",
                            "p_base_weight": 0.5,
                            "p_emotional_boost": emotional_boost * 0.2,
                            "p_data": json.dumps({})
                        }
                    ).execute()

                    tension_count += 1

        logger.info(f"Created/updated {tension_count} tension nodes and edges")

        # =======================================================================
        # STEP C: Create/update loop nodes and edges
        # =======================================================================

        loop_count = 0
        if loop_ids:
            for loop_id in loop_ids:
                # Get loop name from database
                loop_result = supabase_client.table("mirrorx_loops") \
                    .select("name, occurrence_count") \
                    .eq("id", loop_id) \
                    .execute()

                if loop_result.data:
                    loop = loop_result.data[0]

                    # Create/update loop node
                    loop_node_id = supabase_client.rpc(
                        "upsert_graph_node",
                        {
                            "p_user_id": user_id,
                            "p_type": "loop",
                            "p_ref_id": loop_id,
                            "p_label": loop["name"],
                            "p_base_weight": 0.5,
                            "p_data": json.dumps({
                                "occurrence_count": loop.get("occurrence_count", 1)
                            })
                        }
                    ).execute().data

                    # Create edge: reflection → loop
                    supabase_client.rpc(
                        "upsert_graph_edge",
                        {
                            "p_user_id": user_id,
                            "p_source_node_id": reflection_node_id,
                            "p_target_node_id": loop_node_id,
                            "p_type": "reflection_activates_loop",
                            "p_base_weight": 0.5,
                            "p_emotional_boost": emotional_boost * 0.2,
                            "p_data": json.dumps({})
                        }
                    ).execute()

                    loop_count += 1

        logger.info(f"Created/updated {loop_count} loop nodes and edges")

        # =======================================================================
        # STEP D: Create/update belief nodes and edges
        # =======================================================================

        belief_count = 0
        if belief_ids:
            for belief_id in belief_ids:
                # Get belief text from database
                belief_result = supabase_client.table("mirrorx_beliefs") \
                    .select("text, status, importance") \
                    .eq("id", belief_id) \
                    .execute()

                if belief_result.data:
                    belief = belief_result.data[0]

                    # Create/update belief node
                    belief_node_id = supabase_client.rpc(
                        "upsert_graph_node",
                        {
                            "p_user_id": user_id,
                            "p_type": "belief",
                            "p_ref_id": belief_id,
                            "p_label": belief["text"][:100],  # Truncate long beliefs
                            "p_base_weight": 0.5,
                            "p_data": json.dumps({
                                "status": belief["status"],
                                "importance": float(belief.get("importance", 0.5))
                            })
                        }
                    ).execute().data

                    # Create edge: reflection → belief
                    supabase_client.rpc(
                        "upsert_graph_edge",
                        {
                            "p_user_id": user_id,
                            "p_source_node_id": reflection_node_id,
                            "p_target_node_id": belief_node_id,
                            "p_type": "reflection_expresses_belief",
                            "p_base_weight": 0.5,
                            "p_emotional_boost": emotional_boost * 0.2,
                            "p_data": json.dumps({})
                        }
                    ).execute()

                    belief_count += 1

        logger.info(f"Created/updated {belief_count} belief nodes and edges")

        # =======================================================================
        # STEP E: Create/update theme nodes and edges
        # =======================================================================

        theme_count = 0
        if bundle.semantic.topics:
            for topic in bundle.semantic.topics[:5]:  # Top 5 topics
                # Create/update theme node (no ref_id)
                theme_node_id = supabase_client.rpc(
                    "upsert_graph_node",
                    {
                        "p_user_id": user_id,
                        "p_type": "theme",
                        "p_ref_id": None,
                        "p_label": topic,
                        "p_base_weight": 0.4,
                        "p_data": json.dumps({})
                    }
                ).execute().data

                # Create edge: reflection → theme
                supabase_client.rpc(
                    "upsert_graph_edge",
                    {
                        "p_user_id": user_id,
                        "p_source_node_id": reflection_node_id,
                        "p_target_node_id": theme_node_id,
                        "p_type": "reflection_in_theme",
                        "p_base_weight": 0.4,
                        "p_emotional_boost": emotional_boost * 0.1,
                        "p_data": json.dumps({})
                    }
                ).execute()

                theme_count += 1

        logger.info(f"Created/updated {theme_count} theme nodes and edges")

        # =======================================================================
        # STEP F: Get top nodes for this user (for graph_state)
        # =======================================================================

        top_nodes_result = supabase_client.table("mirrorx_graph_nodes") \
            .select("type, label, effective_weight, last_seen_at") \
            .eq("user_id", user_id) \
            .order("effective_weight", desc=True) \
            .limit(10) \
            .execute()

        top_nodes = [
            {
                "type": node["type"],
                "label": node["label"],
                "weight": float(node["effective_weight"])
            }
            for node in top_nodes_result.data
        ]

        logger.info(f"Graph update complete: {tension_count} tensions, {loop_count} loops, {belief_count} beliefs, {theme_count} themes")

        return {
            "reflection_node_id": reflection_node_id,
            "tension_count": tension_count,
            "loop_count": loop_count,
            "belief_count": belief_count,
            "theme_count": theme_count,
            "top_nodes": top_nodes
        }

    except Exception as e:
        logger.exception(f"Failed to update graph: {e}")
        raise


def get_graph_state(supabase_client, user_id: str) -> Dict[str, Any]:
    """
    Get current graph state for a user.

    Returns top nodes and edges by effective weight.

    Args:
        supabase_client: Supabase client
        user_id: UUID of user

    Returns:
        dict with top_nodes, recent_neighbors, edge_count, node_count
    """
    try:
        # Get top nodes
        top_nodes_result = supabase_client.table("mirrorx_graph_nodes") \
            .select("type, label, effective_weight, emotional_intensity, last_seen_at") \
            .eq("user_id", user_id) \
            .order("effective_weight", desc=True) \
            .limit(10) \
            .execute()

        top_nodes = [
            {
                "type": node["type"],
                "label": node["label"],
                "weight": float(node["effective_weight"]),
                "emotional_intensity": float(node["emotional_intensity"]) if node.get("emotional_intensity") else None,
                "last_seen": node["last_seen_at"]
            }
            for node in top_nodes_result.data
        ]

        # Get summary
        summary_result = supabase_client.from_("mirrorx_graph_summary") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        summary = summary_result.data[0] if summary_result.data else {}

        return {
            "top_nodes": top_nodes,
            "node_count": {
                "reflections": summary.get("reflection_nodes", 0),
                "tensions": summary.get("tension_nodes", 0),
                "loops": summary.get("loop_nodes", 0),
                "beliefs": summary.get("belief_nodes", 0),
                "themes": summary.get("theme_nodes", 0)
            },
            "avg_effective_weight": float(summary.get("avg_effective_weight", 0.0)),
            "max_effective_weight": float(summary.get("max_effective_weight", 0.0))
        }

    except Exception as e:
        logger.exception(f"Failed to get graph state: {e}")
        return {
            "top_nodes": [],
            "node_count": {},
            "avg_effective_weight": 0.0,
            "max_effective_weight": 0.0
        }


def recalculate_decay_for_user(supabase_client, user_id: str) -> Dict[str, int]:
    """
    Recalculate time decay for all nodes and edges for a user.

    This should be run periodically (e.g., daily) to update effective weights.

    Args:
        supabase_client: Supabase client
        user_id: UUID of user

    Returns:
        dict with nodes_updated and edges_updated counts
    """
    try:
        result = supabase_client.rpc(
            "recalculate_all_graph_weights",
            {
                "p_user_id": user_id,
                "p_decay_lambda": 0.05  # Decay parameter (0.05 = 5% per day)
            }
        ).execute()

        nodes_updated = result.data[0]["nodes_updated"] if result.data else 0
        edges_updated = result.data[0]["edges_updated"] if result.data else 0

        logger.info(f"Recalculated decay for user {user_id}: {nodes_updated} nodes, {edges_updated} edges")

        return {
            "nodes_updated": nodes_updated,
            "edges_updated": edges_updated
        }

    except Exception as e:
        logger.exception(f"Failed to recalculate decay: {e}")
        return {
            "nodes_updated": 0,
            "edges_updated": 0
        }
