"""
Database operations for MirrorX Engine with comprehensive schema support.

Updated to use the new comprehensive Mirror schema with:
- profiles (was mx_users)
- reflections (was mx_reflections)
- mirrorbacks (was mx_mirrorbacks)
- identity_axes, identity_axis_values, identity_snapshots
- bias_insights, safety_events, regression_markers
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from dotenv import load_dotenv
from supabase import Client, create_client

from app.models import UserHistoryItem
from app.conductor_models import IdentitySnapshot, OrchestratorBundle

load_dotenv()

logger = logging.getLogger("mirrorx-db")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.warning(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment."
    )

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _require_client() -> Client:
    """Ensure the Supabase client is initialized."""
    if supabase is None:
        raise RuntimeError("Supabase client is not initialized.")
    return supabase


# ============================================================================
# User/Profile Operations
# ============================================================================

def create_user(display_name: Optional[str] = None) -> str:
    """
    Create a new profile in the comprehensive schema.
    
    Args:
        display_name: Optional display name for the user
        
    Returns:
        user_id as string (UUID)
    """
    client = _require_client()
    user_id = str(uuid4())
    
    payload = {
        "id": user_id,
        "display_name": display_name,
        "role": "Witness",
        "is_admin": False
    }
    
    logger.info(f"Creating new profile with id={user_id}")
    client.table("profiles").insert(payload).execute()
    return user_id


def get_profile(user_id: str) -> Optional[Dict]:
    """
    Get a user profile by ID.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Profile dict or None if not found
    """
    client = _require_client()
    
    resp = client.table("profiles").select("*").eq("id", user_id).execute()
    if resp.data and len(resp.data) > 0:
        return resp.data[0]
    return None


# ============================================================================
# Reflection Operations
# ============================================================================

def save_reflection(
    author_id: str,
    body: str,
    lens_key: Optional[str] = None,
    tone: str = "raw",
    visibility: str = "public",
    metadata: Optional[Dict] = None
) -> str:
    """
    Save a reflection to the database.
    
    Args:
        author_id: UUID of the author (profile)
        body: Reflection text
        lens_key: Optional lens (e.g., 'wealth', 'mind', 'belief')
        tone: Tone classification (raw, processing, clear)
        visibility: public, circle, or private
        metadata: Optional JSONB metadata
        
    Returns:
        reflection_id as string
    """
    client = _require_client()
    
    payload = {
        "author_id": author_id,
        "body": body,
        "lens_key": lens_key,
        "tone": tone,
        "visibility": visibility,
        "metadata": metadata or {}
    }
    
    logger.info(f"Saving reflection for author_id={author_id}")
    resp = client.table("reflections").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        reflection_id = str(resp.data[0]["id"])
        logger.info(f"Reflection saved with id={reflection_id}")
        return reflection_id
    
    raise RuntimeError("Failed to save reflection")


def get_recent_reflections(user_id: str, limit: int = 10) -> List[Dict]:
    """
    Get recent reflections for a user.
    
    Args:
        user_id: UUID of the user
        limit: Maximum number of reflections to return
        
    Returns:
        List of reflection dicts
    """
    client = _require_client()
    
    resp = (
        client.table("reflections")
        .select("*")
        .eq("author_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    
    return resp.data if resp.data else []


# ============================================================================
# Mirrorback Operations
# ============================================================================

def save_mirrorback(
    reflection_id: int,
    body: str,
    responder_id: Optional[str] = None,
    tone: str = "processing",
    source: str = "ai",
    metadata: Optional[Dict] = None
) -> int:
    """
    Save a mirrorback (AI or human response) to the database.
    
    Args:
        reflection_id: ID of the reflection being responded to
        body: Mirrorback text
        responder_id: Optional UUID of human responder (None for AI)
        tone: Tone of the mirrorback (raw, processing, clear)
        source: 'ai' or 'human'
        metadata: Optional JSONB metadata
        
    Returns:
        mirrorback_id as int
    """
    client = _require_client()
    
    payload = {
        "reflection_id": reflection_id,
        "responder_id": responder_id,
        "body": body,
        "tone": tone,
        "source": source,
        "metadata": metadata or {}
    }
    
    logger.info(f"Saving mirrorback for reflection_id={reflection_id}")
    resp = client.table("mirrorbacks").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        mirrorback_id = resp.data[0]["id"]
        logger.info(f"Mirrorback saved with id={mirrorback_id}")
        return mirrorback_id
    
    raise RuntimeError("Failed to save mirrorback")


# ============================================================================
# Identity Graph Operations
# ============================================================================

def save_identity_axis(
    identity_id: str,
    axis_key: str,
    origin: str = "user_created",
    label: Optional[str] = None
) -> int:
    """
    Save or update an identity axis.
    
    Args:
        identity_id: UUID of the user
        axis_key: Axis key (e.g., 'wealth.story', 'self.trust')
        origin: 'system_seed', 'llm_suggested', or 'user_created'
        label: Optional human-readable label
        
    Returns:
        axis_id as int
    """
    client = _require_client()
    
    payload = {
        "identity_id": identity_id,
        "axis_key": axis_key,
        "origin": origin,
        "label": label
    }
    
    # Upsert (insert or update if exists)
    resp = client.table("identity_axes").upsert(payload, on_conflict="identity_id,axis_key").execute()
    
    if resp.data and len(resp.data) > 0:
        return resp.data[0]["id"]
    
    raise RuntimeError(f"Failed to save identity axis: {axis_key}")


def save_identity_axis_value(
    axis_id: int,
    value: str,
    confidence: Optional[float] = None,
    source_reflection_id: Optional[int] = None
) -> int:
    """
    Save an identity axis value (belief, statement, etc.).
    
    Args:
        axis_id: ID of the identity axis
        value: The actual value/belief text
        confidence: Optional confidence score (0.0-1.0)
        source_reflection_id: Optional reflection that surfaced this value
        
    Returns:
        value_id as int
    """
    client = _require_client()
    
    payload = {
        "axis_id": axis_id,
        "value": value,
        "confidence": confidence,
        "source_reflection_id": source_reflection_id
    }
    
    resp = client.table("identity_axis_values").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        return resp.data[0]["id"]
    
    raise RuntimeError("Failed to save identity axis value")


def save_identity_snapshot(
    identity_id: str,
    summary: Dict
) -> int:
    """
    Save an identity snapshot (complete state at a point in time).
    
    Args:
        identity_id: UUID of the user
        summary: JSONB summary with tensions, themes, loops, etc.
        
    Returns:
        snapshot_id as int
    """
    client = _require_client()
    
    payload = {
        "identity_id": identity_id,
        "summary": summary
    }
    
    resp = client.table("identity_snapshots").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        snapshot_id = resp.data[0]["id"]
        logger.info(f"Identity snapshot saved with id={snapshot_id}")
        return snapshot_id
    
    raise RuntimeError("Failed to save identity snapshot")


def get_identity_snapshot(user_id: str) -> Optional[Dict]:
    """
    Get the most recent identity snapshot for a user.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Snapshot dict or None if not found
    """
    client = _require_client()
    
    resp = (
        client.table("identity_snapshots")
        .select("*")
        .eq("identity_id", user_id)
        .order("snapshot_at", desc=True)
        .limit(1)
        .execute()
    )
    
    if resp.data and len(resp.data) > 0:
        return resp.data[0]
    return None


# ============================================================================
# Bias Insights Operations
# ============================================================================

def save_bias_insight(
    identity_id: str,
    dimension: str,
    direction: str,
    reflection_id: Optional[int] = None,
    confidence: Optional[float] = None,
    notes: Optional[str] = None
) -> int:
    """
    Save a bias insight.
    
    Args:
        identity_id: UUID of the user
        dimension: Bias dimension (e.g., 'political', 'self-worth', 'religious')
        direction: Bias direction (e.g., 'self-blame', 'other-blame', 'absolutist')
        reflection_id: Optional reflection that surfaced this bias
        confidence: Optional confidence score
        notes: Optional notes
        
    Returns:
        insight_id as int
    """
    client = _require_client()
    
    payload = {
        "identity_id": identity_id,
        "reflection_id": reflection_id,
        "dimension": dimension,
        "direction": direction,
        "confidence": confidence,
        "notes": notes
    }
    
    resp = client.table("bias_insights").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        return resp.data[0]["id"]
    
    raise RuntimeError("Failed to save bias insight")


# ============================================================================
# Safety Events Operations
# ============================================================================

def save_safety_event(
    category: str,
    severity: str = "warning",
    identity_id: Optional[str] = None,
    reflection_id: Optional[int] = None,
    action_taken: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> int:
    """
    Save a safety event.
    
    Args:
        category: Event category (e.g., 'self-harm', 'harassment', 'hate', 'crisis')
        severity: 'info', 'warning', or 'critical'
        identity_id: Optional user UUID
        reflection_id: Optional reflection ID
        action_taken: Optional description of action taken
        metadata: Optional JSONB metadata
        
    Returns:
        event_id as int
    """
    client = _require_client()
    
    payload = {
        "identity_id": identity_id,
        "reflection_id": reflection_id,
        "category": category,
        "severity": severity,
        "action_taken": action_taken,
        "metadata": metadata or {}
    }
    
    resp = client.table("safety_events").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        event_id = resp.data[0]["id"]
        logger.warning(f"Safety event logged: {category} (severity={severity}, id={event_id})")
        return event_id
    
    raise RuntimeError("Failed to save safety event")


# ============================================================================
# Regression Markers Operations
# ============================================================================

def save_regression_marker(
    identity_id: str,
    kind: str,
    reflection_id: Optional[int] = None,
    description: Optional[str] = None,
    severity: int = 1
) -> int:
    """
    Save a regression marker (loop, self-attack, etc.).
    
    Args:
        identity_id: UUID of the user
        kind: Type of regression ('loop', 'self_attack', 'judgment_spike', 'avoidance')
        reflection_id: Optional reflection where regression was detected
        description: Optional description
        severity: Severity level (1-5)
        
    Returns:
        marker_id as int
    """
    client = _require_client()
    
    payload = {
        "identity_id": identity_id,
        "reflection_id": reflection_id,
        "kind": kind,
        "description": description,
        "severity": severity
    }
    
    resp = client.table("regression_markers").insert(payload).execute()
    
    if resp.data and len(resp.data) > 0:
        marker_id = resp.data[0]["id"]
        logger.info(f"Regression marker saved: {kind} (severity={severity}, id={marker_id})")
        return marker_id
    
    raise RuntimeError("Failed to save regression marker")


def get_regression_markers(user_id: str, kind: Optional[str] = None, limit: int = 20) -> List[Dict]:
    """
    Get regression markers for a user.
    
    Args:
        user_id: UUID of the user
        kind: Optional filter by kind
        limit: Maximum number of markers to return
        
    Returns:
        List of regression marker dicts
    """
    client = _require_client()
    
    query = (
        client.table("regression_markers")
        .select("*")
        .eq("identity_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    
    if kind:
        query = query.eq("kind", kind)
    
    resp = query.execute()
    return resp.data if resp.data else []


# ============================================================================
# User History (Combined View)
# ============================================================================

def get_user_history(user_id: str, limit: int = 10) -> List[UserHistoryItem]:
    """
    Get user history with reflections and mirrorbacks.
    
    Args:
        user_id: UUID of the user
        limit: Maximum number of items to return
        
    Returns:
        List of UserHistoryItem objects
    """
    client = _require_client()
    
    # Get reflections with their mirrorbacks
    resp = (
        client.table("reflections")
        .select("*, mirrorbacks(*)")
        .eq("author_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    
    history = []
    if resp.data:
        for reflection in resp.data:
            # Get first mirrorback if exists
            mirrorback_text = ""
            if reflection.get("mirrorbacks") and len(reflection["mirrorbacks"]) > 0:
                mirrorback_text = reflection["mirrorbacks"][0]["body"]
            
            history.append(UserHistoryItem(
                reflection_id=str(reflection["id"]),
                reflection_text=reflection["body"],
                mirrorback_text=mirrorback_text,
                tone=reflection.get("tone", "raw"),
                timestamp=reflection["created_at"]
            ))
    
    return history


# ============================================================================
# Backward Compatibility (for old code that uses mx_* tables)
# ============================================================================

# Alias old functions to new ones for backward compatibility
def save_reflection_and_mirrorback(
    user_id: str,
    reflection_text: str,
    mirrorback_text: str,
    tone: str = "raw"
) -> Tuple[str, int]:
    """
    Legacy function for backward compatibility.
    Saves both reflection and mirrorback in one call.
    
    Returns:
        (reflection_id, mirrorback_id)
    """
    reflection_id = save_reflection(
        author_id=user_id,
        body=reflection_text,
        tone=tone
    )
    
    mirrorback_id = save_mirrorback(
        reflection_id=int(reflection_id),
        body=mirrorback_text,
        tone="processing",
        source="ai"
    )
    
    return (reflection_id, mirrorback_id)


def build_context_object(user_id: str) -> Dict:
    """
    Build a context object for the conductor.
    Includes recent reflections, identity snapshot, and evolution data.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Context dict
    """
    recent_reflections = get_recent_reflections(user_id, limit=5)
    identity_snapshot = get_identity_snapshot(user_id)
    regression_loops = get_regression_markers(user_id, kind="loop", limit=5)
    
    return {
        "user_id": user_id,
        "recent_reflections": recent_reflections,
        "identity_snapshot": identity_snapshot,
        "loops": regression_loops
    }


def save_conductor_bundle(
    reflection_id: int,
    user_id: str,
    bundle: OrchestratorBundle
) -> None:
    """
    Save the complete conductor bundle to the database.
    This stores all the analytics from the 8-step pipeline.
    
    Args:
        reflection_id: ID of the reflection
        user_id: UUID of the user
        bundle: Complete OrchestratorBundle from conductor
    """
    # Store bundle metadata in reflection metadata field
    client = _require_client()
    
    bundle_dict = {
        "emotion": bundle.emotion.model_dump() if bundle.emotion else None,
        "semantic": bundle.semantic.model_dump() if bundle.semantic else None,
        "logic_map": bundle.logic_map.model_dump() if bundle.logic_map else None,
        "grounding": bundle.grounding.model_dump() if bundle.grounding else None,
        "tone_decision": bundle.tone_decision.model_dump() if bundle.tone_decision else None
    }
    
    client.table("reflections").update({"metadata": bundle_dict}).eq("id", reflection_id).execute()
    
    logger.info(f"Conductor bundle saved for reflection_id={reflection_id}")
