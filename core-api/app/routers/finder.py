"""
Mirror Finder Router - Constitutional Routing Intelligence
Connects users to reflective conditions based on their evolving identity.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging

from app.auth import require_auth
from app.db import get_db

logger = logging.getLogger("mirror.finder")

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ────────────────────────────────────────────────────────────────────────────
# REQUEST/RESPONSE MODELS
# ────────────────────────────────────────────────────────────────────────────

class PostureUpdate(BaseModel):
    """User declares their current posture"""
    declared: str  # unknown, overwhelmed, guarded, grounded, open, exploratory


class LensUsageEvent(BaseModel):
    """Record lens usage for TPV computation"""
    lens_id: str
    weight: float = 1.0


class MistakeReport(BaseModel):
    """Report a Finder mistake"""
    mistake_type: str  # consent_violation, timing_mismatch, corruption_risk, bandwidth_overload, discomfort
    node_id: str
    context: Optional[str] = None


class FinderConfigUpdate(BaseModel):
    """Update Finder configuration"""
    mode: str  # first_mirror, active, manual, random, off
    bandwidth_limit: Optional[int] = 3
    blocked_nodes: Optional[List[str]] = None


# ────────────────────────────────────────────────────────────────────────────
# POSTURE ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.get("/posture")
@limiter.limit("30/minute")
async def get_posture(
    request: Request,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Get user's current posture (declared and suggested).
    Posture affects what doors are shown and how they're presented.
    """
    result = await db.fetch_one(
        "SELECT declared, suggested, declared_at, suggested_at, divergence_count "
        "FROM posture_states WHERE user_id = $1",
        current_user
    )
    
    if not result:
        # Default posture: unknown
        return {
            "declared": "unknown",
            "suggested": None,
            "declared_at": None,
            "suggested_at": None,
            "divergence_count": 0
        }
    
    return dict(result)


@router.post("/posture")
@limiter.limit("10/minute")
async def update_posture(
    request: Request,
    posture: PostureUpdate,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    User declares their current posture.
    This is the CANONICAL posture - suggested is advisory only.
    """
    valid_postures = ['unknown', 'overwhelmed', 'guarded', 'grounded', 'open', 'exploratory']
    if posture.declared not in valid_postures:
        raise HTTPException(status_code=400, detail=f"Invalid posture. Must be one of: {valid_postures}")
    
    # Upsert posture state
    await db.execute(
        """
        INSERT INTO posture_states (user_id, declared, declared_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET declared = $2, declared_at = NOW()
        """,
        current_user, posture.declared
    )
    
    logger.info(f"User {current_user} declared posture: {posture.declared}")
    
    return {"success": True, "declared": posture.declared}


# ────────────────────────────────────────────────────────────────────────────
# LENS & TPV ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.post("/lens-usage")
@limiter.limit("60/minute")
async def record_lens_usage(
    request: Request,
    event: LensUsageEvent,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Record lens usage event for TPV computation.
    ONLY source of tension data - not inferred from content.
    """
    session_id = str(uuid.uuid4())  # Generate session ID (or get from request)
    
    await db.execute(
        """
        INSERT INTO lens_usage_events (user_id, lens_id, weight, session_id, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
        """,
        current_user, event.lens_id, event.weight, session_id
    )
    
    logger.info(f"Recorded lens usage: user={current_user}, lens={event.lens_id}, weight={event.weight}")
    
    return {"success": True}


@router.get("/tpv")
@limiter.limit("30/minute")
async def get_tension_proxy_vector(
    request: Request,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Get user's Tension Proxy Vector (TPV).
    Computed from lens usage, not inferred from content.
    """
    result = await db.fetch_one(
        """
        SELECT vector, is_manual_override, last_computed, ambiguity_score
        FROM tension_proxy_vectors
        WHERE user_id = $1
        """,
        current_user
    )
    
    if not result:
        return {
            "vector": {},
            "is_manual_override": False,
            "last_computed": None,
            "ambiguity_score": 1.0  # High ambiguity = no data
        }
    
    return dict(result)


# ────────────────────────────────────────────────────────────────────────────
# DOORS (RECOMMENDATIONS) ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.get("/doors")
@limiter.limit("30/minute")
async def get_doors(
    request: Request,
    limit: int = 3,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Get recommended doors (reflective conditions) for user.
    Respects bandwidth limit and timing preferences.
    """
    # Get user's Finder config
    config = await db.fetch_one(
        "SELECT mode, bandwidth_limit, blocked_nodes FROM finder_config WHERE user_id = $1",
        current_user
    )
    
    if not config or config['mode'] == 'off':
        return {"doors": [], "mode": "off"}
    
    bandwidth_limit = config['bandwidth_limit'] or limit
    blocked_nodes = config['blocked_nodes'] or []
    
    # Get candidate cards (simplified - real implementation would use scoring)
    query = """
        SELECT c.node_id, c.card_type, c.interaction_style, c.lens_tags, 
               c.title, c.description, c.attestation_count
        FROM candidate_cards c
        WHERE c.node_id != ALL($1::text[])
        ORDER BY c.attestation_count DESC, c.cached_at DESC
        LIMIT $2
    """
    
    doors = await db.fetch_all(query, blocked_nodes, bandwidth_limit)
    
    return {
        "doors": [dict(door) for door in doors],
        "mode": config['mode'],
        "bandwidth_limit": bandwidth_limit
    }


@router.post("/doors/{node_id}/view")
@limiter.limit("60/minute")
async def record_door_view(
    request: Request,
    node_id: str,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Record that a door was shown to user.
    Used for diversity/novelty tracking.
    """
    session_id = str(uuid.uuid4())
    
    await db.execute(
        """
        INSERT INTO doors_shown (user_id, node_id, session_id, shown_at)
        VALUES ($1, $2, $3, NOW())
        """,
        current_user, node_id, session_id
    )
    
    return {"success": True}


# ────────────────────────────────────────────────────────────────────────────
# IDENTITY GRAPH ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.get("/graph")
@limiter.limit("30/minute")
async def get_identity_graph(
    request: Request,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Get user's local identity graph (nodes + edges).
    NEVER sent to Commons - stays local.
    """
    # Get nodes
    nodes = await db.fetch_all(
        """
        SELECT id, node_type, label, content, lens_tags, 
               created_at, last_activated, activation_count
        FROM identity_graph_nodes
        WHERE user_id = $1
        ORDER BY last_activated DESC
        """,
        current_user
    )
    
    # Get edges
    edges = await db.fetch_all(
        """
        SELECT id, source_node_id, target_node_id, edge_type, 
               frequency, intensity, recency, confidence
        FROM identity_graph_edges
        WHERE user_id = $1
        """,
        current_user
    )
    
    # Get tensions
    tensions = await db.fetch_all(
        """
        SELECT id, node_a_id, node_b_id, name, energy, duration_days, lens_tags
        FROM tensions
        WHERE user_id = $1
        """,
        current_user
    )
    
    return {
        "nodes": [dict(n) for n in nodes],
        "edges": [dict(e) for e in edges],
        "tensions": [dict(t) for t in tensions]
    }


# ────────────────────────────────────────────────────────────────────────────
# MISTAKE REPORTING
# ────────────────────────────────────────────────────────────────────────────

@router.post("/mistakes")
@limiter.limit("20/minute")
async def report_mistake(
    request: Request,
    report: MistakeReport,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """
    Report a Finder mistake (delivery issue, not content critique).
    Used to improve Finder intelligence.
    """
    valid_types = [
        'consent_violation', 'timing_mismatch', 'corruption_risk',
        'bandwidth_overload', 'discomfort'
    ]
    
    if report.mistake_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid mistake_type. Must be one of: {valid_types}")
    
    await db.execute(
        """
        INSERT INTO mistake_reports (user_id, mistake_type, node_id, context, reported_at)
        VALUES ($1, $2, $3, $4, NOW())
        """,
        current_user, report.mistake_type, report.node_id, report.context
    )
    
    logger.warning(f"Mistake reported: user={current_user}, type={report.mistake_type}, node={report.node_id}")
    
    return {"success": True, "message": "Thank you for reporting. We'll learn from this."}


# ────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ────────────────────────────────────────────────────────────────────────────

@router.get("/config")
@limiter.limit("30/minute")
async def get_finder_config(
    request: Request,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """Get user's Finder configuration."""
    result = await db.fetch_one(
        """
        SELECT mode, bandwidth_limit, blocked_nodes, timing_preferences
        FROM finder_config
        WHERE user_id = $1
        """,
        current_user
    )
    
    if not result:
        # Default config
        return {
            "mode": "first_mirror",
            "bandwidth_limit": 3,
            "blocked_nodes": [],
            "timing_preferences": {}
        }
    
    return dict(result)


@router.put("/config")
@limiter.limit("10/minute")
async def update_finder_config(
    request: Request,
    config: FinderConfigUpdate,
    current_user: str = Depends(require_auth),
    db = Depends(get_db)
):
    """Update user's Finder configuration."""
    valid_modes = ['first_mirror', 'active', 'manual', 'random', 'off']
    if config.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")
    
    # Upsert config
    await db.execute(
        """
        INSERT INTO finder_config (user_id, mode, bandwidth_limit, blocked_nodes, last_updated)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
            mode = $2,
            bandwidth_limit = $3,
            blocked_nodes = $4,
            last_updated = NOW()
        """,
        current_user,
        config.mode,
        config.bandwidth_limit,
        config.blocked_nodes or []
    )
    
    logger.info(f"Finder config updated: user={current_user}, mode={config.mode}")
    
    return {"success": True, "mode": config.mode}


# ────────────────────────────────────────────────────────────────────────────
# ASYMMETRY REPORTS (PUBLIC METADATA)
# ────────────────────────────────────────────────────────────────────────────

@router.get("/asymmetry/{node_id}")
@limiter.limit("30/minute")
async def get_asymmetry_report(
    request: Request,
    node_id: str,
    db = Depends(get_db)
):
    """
    Get asymmetry report for a reflective condition (door).
    Structural risk metrics, not ideological judgment.
    """
    result = await db.fetch_one(
        """
        SELECT exit_friction, data_demand_ratio, opacity, identity_coercion,
               unilateral_control, lock_in_terms, evidence_tier, reported_at
        FROM asymmetry_reports
        WHERE node_id = $1
        ORDER BY reported_at DESC
        LIMIT 1
        """,
        node_id
    )
    
    if not result:
        return {
            "node_id": node_id,
            "exit_friction": "low",
            "data_demand_ratio": 0.0,
            "opacity": False,
            "identity_coercion": False,
            "unilateral_control": False,
            "lock_in_terms": False,
            "evidence_tier": "declared"
        }
    
    return dict(result)
