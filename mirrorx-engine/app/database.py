import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from dotenv import load_dotenv
from supabase import Client, create_client

from models import UserHistoryItem
from conductor_models import IdentitySnapshot, OrchestratorBundle

import threading

load_dotenv()

logger = logging.getLogger("mirrorx-db")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_KEY in your environment."
    )

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# If Supabase is not configured, provide a lightweight in-memory
# fallback datastore for local development so the app remains usable
# without external services.
use_in_memory = supabase is None
_in_memory_lock: Optional[threading.Lock] = None
_in_memory: Optional[Dict[str, Dict]] = None
if use_in_memory:
    _in_memory_lock = threading.Lock()
    _in_memory = {
        "users": {},  # user_id -> payload
        "reflections": {},  # reflection_id -> payload
        "mirrorbacks": {},  # mirrorback_id -> payload
        "user_reflections": {},  # user_id -> [reflection_id...]
        "identity_snapshots": {},  # user_id -> IdentitySnapshot
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_client() -> Client:
    """
    Ensure the Supabase client is initialized.

    Returns:
        Supabase Client instance.

    Raises:
        RuntimeError: If the client is not configured.
    """
    if supabase is None:
        raise RuntimeError("Supabase client is not initialized.")
    return supabase


# ---------------------------------------------------------------------------
# User operations  (mx_users)
# ---------------------------------------------------------------------------


def create_user(name: Optional[str]) -> str:
    """
    Create a new Mirror-X user record in mx_users.

    Args:
        name: Optional display name for the user.

    Returns:
        user_id as string.
    """

    # In-memory fallback for local development
    if use_in_memory:
        user_id = str(uuid4())
        payload = {"id": user_id, "name": name, "calibration_complete": False}
        if _in_memory_lock is None or _in_memory is None:
            raise RuntimeError("In-memory DB not initialized")
        with _in_memory_lock:
            _in_memory["users"][user_id] = payload
            _in_memory["user_reflections"].setdefault(user_id, [])
        logger.info("(in-memory) Created new Mirror-X user with id=%s", user_id)
        return user_id

    client = _require_client()

    user_id = str(uuid4())
    payload = {
        "id": user_id,
        "name": name,
        "calibration_complete": False,
    }

    logger.info("Creating new Mirror-X user with id=%s", user_id)

    client.table("mx_users").insert(payload).execute()
    return user_id


# ---------------------------------------------------------------------------
# Context retrieval  (mx_reflections, mx_belief_states, mx_mirrorbacks)
# ---------------------------------------------------------------------------


def retrieve_recent_reflections(user_id: str, limit: int = 5) -> List[str]:
    """
    Retrieve recent reflection texts for a Mirror-X user.

    Args:
        user_id: User UUID (mx_users.id).
        limit: Max number of reflections.

    Returns:
        List of reflection content strings.
    """

    if use_in_memory:
        if _in_memory_lock is None or _in_memory is None:
            return []
        with _in_memory_lock:
            ids = list(_in_memory["user_reflections"].get(user_id, []))
            # reflections stored with timestamps in payload
            items = [
                _in_memory["reflections"][rid]
                for rid in ids
                if rid in _in_memory["reflections"]
            ]
        # sort by timestamp desc
        items.sort(key=lambda r: r.get("timestamp") or "", reverse=True)
        return [r.get("content", "") for r in items[:limit]]

    client = _require_client()

    resp = (
        client.table("mx_reflections")
        .select("content, timestamp")
        .eq("user_id", user_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )

    data = resp.data or []
    return [row["content"] for row in data]


def retrieve_belief_states(user_id: str) -> List[str]:
    """
    Retrieve belief texts for a Mirror-X user.

    Args:
        user_id: User UUID (mx_users.id).

    Returns:
        List of belief_text strings.
    """

    if use_in_memory:
        # no belief state storage in-memory yet; return empty list
        return []

    client = _require_client()

    resp = (
        client.table("mx_belief_states")
        .select("belief_text")
        .eq("user_id", user_id)
        .order("last_expressed", desc=True)
        .execute()
    )

    data = resp.data or []
    return [row["belief_text"] for row in data if row.get("belief_text")]


def retrieve_recurring_themes(user_id: str, limit: int = 10) -> List[str]:
    """
    Derive recurring themes from Mirror-X mirrorbacks.

    Currently simple: flattens 'themes_surfaced' arrays and returns
    the most recent up to 'limit'. In the future, this can be upgraded
    to frequency-based or clustering logic.

    Args:
        user_id: User UUID (mx_users.id).
        limit: Max number of unique themes.

    Returns:
        List of theme strings.
    """

    if use_in_memory:
        if _in_memory_lock is None or _in_memory is None:
            return []
        with _in_memory_lock:
            ids = list(_in_memory["user_reflections"].get(user_id, []))
            # gather mirrorback themes for those reflections
            themes: List[str] = []
            seen = set()
            # iterate in reverse (most recent first)
            for rid in reversed(ids):
                # find mirrorback by reflection_id
                for mb in _in_memory["mirrorbacks"].values():
                    if mb.get("reflection_id") == rid:
                        for t in mb.get("themes_surfaced", []):
                            if t not in seen:
                                seen.add(t)
                                themes.append(t)
                                if len(themes) >= limit:
                                    return themes
            return themes

    client = _require_client()

    # Join mx_reflections -> mx_mirrorbacks via reflection_id.
    # Supabase Python client doesn't support SQL joins directly here,
    # so we fetch recent reflections first, then their mirrorbacks.
    reflections_resp = (
        client.table("mx_reflections")
        .select("id")
        .eq("user_id", user_id)
        .order("timestamp", desc=True)
        .limit(50)
        .execute()
    )
    reflections = reflections_resp.data or []
    reflection_ids = [r["id"] for r in reflections]

    if not reflection_ids:
        return []

    mirrorbacks_resp = (
        client.table("mx_mirrorbacks")
        .select("themes_surfaced")
        .in_("reflection_id", reflection_ids)
        .order("timestamp", desc=True)
        .execute()
    )

    themes: List[str] = []
    seen = set()
    for row in mirrorbacks_resp.data or []:
        row_themes = row.get("themes_surfaced") or []
        for t in row_themes:
            if t not in seen:
                seen.add(t)
                themes.append(t)
                if len(themes) >= limit:
                    return themes
    return themes


def build_context_object(user_id: str, current_reflection: str, user_tone: str) -> Dict:
    """
    Build the context dict for MirrorCore.

    Structure:
        {
            "recent_reflections": [...],
            "active_beliefs": [...],
            "held_tensions": [...],
            "recurring_themes": [...],
            "user_tone": "...",
        }
    """
    recent_reflections = retrieve_recent_reflections(user_id=user_id, limit=5)
    beliefs = retrieve_belief_states(user_id=user_id)
    themes = retrieve_recurring_themes(user_id=user_id)

    # Placeholder: Tensions could later be inferred from dedicated tables
    # or via additional model passes. For now, we leave this as an empty list.
    held_tensions: List[str] = []

    context = {
        "recent_reflections": recent_reflections,
        "active_beliefs": beliefs,
        "held_tensions": held_tensions,
        "recurring_themes": themes,
        "user_tone": user_tone,
    }

    return context


# ---------------------------------------------------------------------------
# Persistence: mx_reflections + mx_mirrorbacks
# ---------------------------------------------------------------------------


def save_reflection_and_mirrorback(
    user_id: str,
    reflection_text: str,
    mirrorback_text: str,
    tone: str,
    context: Dict,
    tone_snapshot: Optional[Dict] = None,
) -> str:
    """
    Save the reflection and its mirrorback to the Mirror-X tables.

    Args:
        user_id: User UUID (mx_users.id).
        reflection_text: Raw user reflection.
        mirrorback_text: Generated mirrorback string.
        tone: Detected tone label.
        context: Context object used to generate the mirrorback.

    Returns:
        reflection_id as string (mx_reflections.id).
    """

    if use_in_memory:
        reflection_id = str(uuid4())
        mirrorback_id = str(uuid4())
        now = datetime.utcnow().isoformat()
        reflection_payload = {
            "id": reflection_id,
            "user_id": user_id,
            "content": reflection_text,
            "tone": tone,
            "tone_snapshot": tone_snapshot,
            "felt_intensity": None,
            "timestamp": now,
        }
        mirrorback_payload = {
            "id": mirrorback_id,
            "reflection_id": reflection_id,
            "content": mirrorback_text,
            "themes_surfaced": [],
            "timestamp": now,
        }
        if _in_memory_lock is None or _in_memory is None:
            raise RuntimeError("In-memory DB not initialized")
        with _in_memory_lock:
            _in_memory["reflections"][reflection_id] = reflection_payload
            _in_memory["mirrorbacks"][mirrorback_id] = mirrorback_payload
            _in_memory["user_reflections"].setdefault(user_id, []).append(reflection_id)

        logger.info("(in-memory) Saved reflection %s and mirrorback %s for user %s", reflection_id, mirrorback_id, user_id)
        return reflection_id

    client = _require_client()

    reflection_id = str(uuid4())
    mirrorback_id = str(uuid4())

    logger.info(
        "Saving Mirror-X reflection (%s) and mirrorback (%s) for user %s",
        reflection_id,
        mirrorback_id,
        user_id,
    )

    # 1. Insert reflection
    reflection_payload = {
        "id": reflection_id,
        "user_id": user_id,
        "content": reflection_text,
        "tone": tone,
        "tone_snapshot": tone_snapshot,
        "felt_intensity": None,  # could be inferred later
        "timestamp": datetime.utcnow().isoformat(),
    }
    client.table("mx_reflections").insert(reflection_payload).execute()

    # 2. Insert mirrorback
    # Themes are currently not extracted here. Could be added via an
    # additional Claude pass that tags the mirrorback.
    mirrorback_payload = {
        "id": mirrorback_id,
        "reflection_id": reflection_id,
        "content": mirrorback_text,
        "themes_surfaced": [],  # placeholder
        "timestamp": datetime.utcnow().isoformat(),
    }
    client.table("mx_mirrorbacks").insert(mirrorback_payload).execute()

    return reflection_id


# ---------------------------------------------------------------------------
# History retrieval
# ---------------------------------------------------------------------------


def get_user_history(user_id: str, limit: int = 50) -> List[UserHistoryItem]:
    """
    Fetch recent Mirror-X reflections + their mirrorbacks for a user.

    Args:
        user_id: User UUID (mx_users.id).
        limit: Max reflections to return.

    Returns:
        List of UserHistoryItem records, sorted by reflection timestamp desc.
    """
    client = _require_client()

    reflections_resp = (
        client.table("mx_reflections")
        .select("id, content, tone, tone_snapshot, timestamp")
        .eq("user_id", user_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )

    reflections = reflections_resp.data or []
    reflection_ids = [r["id"] for r in reflections]

    mirrorbacks_map: Dict[str, Dict] = {}

    if reflection_ids:
        mirrorbacks_resp = (
            client.table("mx_mirrorbacks")
            .select("reflection_id, content, themes_surfaced, timestamp")
            .in_("reflection_id", reflection_ids)
            .execute()
        )
        for mb in mirrorbacks_resp.data or []:
            mirrorbacks_map[mb["reflection_id"]] = mb

        if use_in_memory:
            with _in_memory_lock:
                ids = list(_in_memory["user_reflections"].get(user_id, []))
                # get reflections data
                reflections = [
                    _in_memory["reflections"][rid]
                    for rid in ids
                    if rid in _in_memory["reflections"]
                ]
                # build mirrorbacks map by reflection_id
                mirrorbacks_map: Dict[str, Dict] = {}
                for mb in _in_memory["mirrorbacks"].values():
                    mirrorbacks_map[mb.get("reflection_id")] = mb

            # sort reflections by timestamp desc
            reflections.sort(key=lambda r: r.get("timestamp") or "", reverse=True)
            history_items: List[UserHistoryItem] = []
            for ref in reflections[:limit]:
                ref_id = ref["id"]
                mb = mirrorbacks_map.get(ref_id)
                history_items.append(
                    UserHistoryItem(
                        reflection_id=ref_id,
                        reflection_text=ref["content"],
                        reflection_tone=ref.get("tone"),
                        reflection_timestamp=ref.get("timestamp"),
                        mirrorback_text=mb.get("content") if mb else None,
                        mirrorback_themes=mb.get("themes_surfaced") if mb else [],
                        mirrorback_timestamp=mb.get("timestamp") if mb else None,
                        reflection_tone_snapshot=ref.get("tone_snapshot"),
                    )
                )
            return history_items

        client = _require_client()

        reflections_resp = (
            client.table("mx_reflections")
            .select("id, content, tone, tone_snapshot, timestamp")
            .eq("user_id", user_id)
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )

        reflections = reflections_resp.data or []
        reflection_ids = [r["id"] for r in reflections]

        mirrorbacks_map: Dict[str, Dict] = {}

        if reflection_ids:
            mirrorbacks_resp = (
                client.table("mx_mirrorbacks")
                .select("reflection_id, content, themes_surfaced, timestamp")
                .in_("reflection_id", reflection_ids)
                .execute()
            )
            for mb in mirrorbacks_resp.data or []:
                mirrorbacks_map[mb["reflection_id"]] = mb

        history_items: List[UserHistoryItem] = []

        for ref in reflections:
            ref_id = ref["id"]
            mb = mirrorbacks_map.get(ref_id)

            history_items.append(
                UserHistoryItem(
                    reflection_id=ref_id,
                    reflection_text=ref["content"],
                    reflection_tone=ref.get("tone"),
                    reflection_timestamp=ref.get("timestamp"),
                    mirrorback_text=mb.get("content") if mb else None,
                    mirrorback_themes=mb.get("themes_surfaced") if mb else [],
                    mirrorback_timestamp=mb.get("timestamp") if mb else None,
                    reflection_tone_snapshot=ref.get("tone_snapshot"),
                )
            )

        return history_items
    mirrorbacks_resp = (
        supabase.table("mirrorbacks")
        .select("*")
        .in_("reflection_id", reflection_ids)
        .execute()
    )

    mirrorbacks_by_reflection = {
        m["reflection_id"]: m for m in (mirrorbacks_resp.data or [])
    }

    pairs: List[Tuple[dict, dict]] = []
    for r in reflections:
        m = mirrorbacks_by_reflection.get(r["id"])
        if m:
            pairs.append((r, m))

    return pairs

    return history_items


# ---------------------------------------------------------------------------
# Identity Snapshot Management (Conductor)
# ---------------------------------------------------------------------------


def get_identity_snapshot(user_id: str) -> Optional[IdentitySnapshot]:
    """
    Retrieve the current identity snapshot for a user.

    Args:
        user_id: User UUID (mx_users.id)

    Returns:
        IdentitySnapshot if found, None otherwise
    """
    if use_in_memory:
        if _in_memory_lock is None or _in_memory is None:
            return None
        with _in_memory_lock:
            snapshot_dict = _in_memory["identity_snapshots"].get(user_id)
            if snapshot_dict:
                return IdentitySnapshot(**snapshot_dict)
            return None

    client = _require_client()

    resp = (
        client.table("mx_identity_snapshots")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )

    if resp.data and len(resp.data) > 0:
        snapshot_data = resp.data[0]
        # Remove metadata fields
        snapshot_data.pop("id", None)
        snapshot_data.pop("user_id", None)
        snapshot_data.pop("created_at", None)
        snapshot_data.pop("updated_at", None)
        return IdentitySnapshot(**snapshot_data)

    return None


def save_identity_snapshot(user_id: str, snapshot: IdentitySnapshot) -> None:
    """
    Save or update identity snapshot for a user.

    Args:
        user_id: User UUID (mx_users.id)
        snapshot: IdentitySnapshot to save
    """
    if use_in_memory:
        if _in_memory_lock is None or _in_memory is None:
            raise RuntimeError("In-memory DB not initialized")
        with _in_memory_lock:
            _in_memory["identity_snapshots"][user_id] = snapshot.model_dump()
        logger.info(f"(in-memory) Saved identity snapshot for user {user_id}")
        return

    client = _require_client()

    snapshot_dict = snapshot.model_dump()
    snapshot_dict["user_id"] = user_id
    snapshot_dict["updated_at"] = datetime.utcnow().isoformat()

    # Check if snapshot exists
    existing = (
        client.table("mx_identity_snapshots")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        # Update existing
        snapshot_id = existing.data[0]["id"]
        client.table("mx_identity_snapshots").update(snapshot_dict).eq("id", snapshot_id).execute()
        logger.info(f"Updated identity snapshot for user {user_id}")
    else:
        # Insert new
        snapshot_dict["id"] = str(uuid4())
        snapshot_dict["created_at"] = datetime.utcnow().isoformat()
        client.table("mx_identity_snapshots").insert(snapshot_dict).execute()
        logger.info(f"Created identity snapshot for user {user_id}")


def save_conductor_bundle(
    user_id: str,
    reflection_id: str,
    bundle: OrchestratorBundle
) -> None:
    """
    Save orchestrator bundle for analysis and debugging.

    Args:
        user_id: User UUID
        reflection_id: Reflection UUID
        bundle: OrchestratorBundle to save
    """
    if use_in_memory:
        # Don't store bundles in memory (too much data)
        return

    client = _require_client()

    bundle_dict = bundle.model_dump()
    bundle_dict["id"] = str(uuid4())
    bundle_dict["user_id"] = user_id
    bundle_dict["reflection_id"] = reflection_id
    bundle_dict["created_at"] = datetime.utcnow().isoformat()

    try:
        client.table("mx_conductor_bundles").insert(bundle_dict).execute()
        logger.info(f"Saved conductor bundle for reflection {reflection_id}")
    except Exception as e:
        logger.warning(f"Failed to save conductor bundle: {e}")
        # Non-critical, continue anyway
