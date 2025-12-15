"""
MirrorX Engine API Routes - Comprehensive Integration

Endpoints for the full MirrorX AI pipeline with conductor orchestration.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import logging

from app.models import (
    ReflectRequest,
    ReflectResponse,
    UserCreateRequest,
    UserCreateResponse,
    UserHistoryResponse,
)
from app.database_comprehensive import (
    create_user,
    get_profile,
    save_reflection,
    save_mirrorback,
    get_user_history,
    save_identity_snapshot,
    get_identity_snapshot,
    save_bias_insight,
    save_safety_event,
    save_regression_marker,
    get_regression_markers,
    build_context_object,
    supabase,
)
from app.conductor import handle_reflection as conductor_handle_reflection
from app.identity_graph import apply_identity_delta_to_db, get_identity_context_from_db
from app.evolution_engine import detect_and_record_evolution
from app.safety import safety_check

logger = logging.getLogger("mirrorx.api")

router = APIRouter(prefix="/api/mirrorx", tags=["mirrorx"])


# ============================================================================
# Core Reflection Endpoint (Conductor Pipeline)
# ============================================================================

@router.post("/reflect", response_model=ReflectResponse)
async def reflect(req: ReflectRequest):
    """
    Main reflection endpoint using the 8-step conductor pipeline.
    
    Flow:
    1. Safety check
    2. Run conductor (8-step AI pipeline)
    3. Save reflection + mirrorback
    4. Update identity graph
    5. Detect evolution events
    6. Return response with context
    
    Args:
        req: ReflectRequest with user_id and reflection_text
        
    Returns:
        ReflectResponse with mirrorback, evolution events, tensions, loops
    """
    user_id = req.user_id
    reflection_text = req.reflection_text
    
    logger.info(f"Processing reflection for user_id={user_id}")
    
    # Step 1: Safety check
    safety_result = safety_check(reflection_text)
    if safety_result["is_crisis"]:
        # Log safety event
        save_safety_event(
            category="crisis",
            severity="critical",
            identity_id=user_id,
            action_taken="diverted_to_resources",
            metadata={"keywords": safety_result.get("matched_patterns", [])}
        )
        
        return ReflectResponse(
            reflection_id=None,
            mirrorback=safety_result["response"],
            tone="crisis",
            lint_passed=True,
            lint_violations=[],
            evolution_events=[],
            tensions=[],
            loops=[],
            identity_delta_summary="Safety intervention triggered"
        )
    
    # Step 2: Build context for conductor
    context = build_context_object(user_id)
    
    # Step 3: Run conductor pipeline (8 steps)
    try:
        conductor_result = conductor_handle_reflection(
            user_id=user_id,
            reflection_text=reflection_text,
            context=context
        )
    except Exception as e:
        logger.error(f"Conductor pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Conductor pipeline error: {str(e)}")
    
    # Step 4: Save reflection
    reflection_id = save_reflection(
        author_id=user_id,
        body=reflection_text,
        lens_key=context.get("lens_key"),  # Could be detected from semantic analysis
        tone=conductor_result.final_tone,
        visibility="public",
        metadata={
            "conductor_bundle": conductor_result.bundle.model_dump() if conductor_result.bundle else {}
        }
    )
    
    # Step 5: Save mirrorback
    mirrorback_id = save_mirrorback(
        reflection_id=int(reflection_id),
        body=conductor_result.final_mirrorback,
        tone=conductor_result.final_tone,
        source="ai",
        metadata={
            "lint_passed": conductor_result.lint_passed,
            "lint_violations": conductor_result.lint_violations
        }
    )
    
    # Step 6: Apply identity delta to database
    if conductor_result.identity_delta and conductor_result.bundle:
        try:
            apply_identity_delta_to_db(
                supabase_client=supabase,
                reflection_id=str(reflection_id),
                user_id=user_id,
                identity_delta=conductor_result.identity_delta,
                bundle=conductor_result.bundle
            )
            logger.info(f"Identity delta applied for reflection_id={reflection_id}")
        except Exception as e:
            logger.error(f"Failed to apply identity delta: {e}")
    
    # Step 7: Detect evolution events
    evolution_result = {"events_detected": [], "snapshot": {}}
    if conductor_result.identity_delta and conductor_result.bundle:
        try:
            evolution_result = detect_and_record_evolution(
                supabase_client=supabase,
                reflection_id=str(reflection_id),
                user_id=user_id,
                identity_delta=conductor_result.identity_delta,
                bundle=conductor_result.bundle
            )
            logger.info(f"Evolution detection complete: {len(evolution_result['events_detected'])} events")
        except Exception as e:
            logger.error(f"Evolution detection failed: {e}")
    
    # Step 8: Extract tensions and loops for response
    tensions = []
    loops = []
    
    if conductor_result.identity_delta:
        tensions = conductor_result.identity_delta.tensions or []
        loops = conductor_result.identity_delta.loops or []
    
    # Get recent regression markers
    regression_markers = get_regression_markers(user_id, kind="loop", limit=5)
    loop_descriptions = [m.get("description", "") for m in regression_markers if m.get("description")]
    
    return ReflectResponse(
        reflection_id=str(reflection_id),
        mirrorback=conductor_result.final_mirrorback,
        tone=conductor_result.final_tone,
        lint_passed=conductor_result.lint_passed,
        lint_violations=conductor_result.lint_violations,
        evolution_events=evolution_result.get("events_detected", []),
        tensions=tensions[:5],  # Top 5 tensions
        loops=loop_descriptions[:5],  # Top 5 loops
        identity_delta_summary=conductor_result.identity_delta.summary if conductor_result.identity_delta else None
    )


# ============================================================================
# Identity Graph Endpoints
# ============================================================================

@router.get("/identity/{user_id}")
async def get_identity(user_id: str):
    """
    Get identity graph data for a user.
    
    Returns:
        - Current identity snapshot
        - Recent axes and values
        - Tensions and loops
    """
    try:
        snapshot = get_identity_snapshot(user_id)
        context = get_identity_context_from_db(supabase, user_id)
        
        return {
            "user_id": user_id,
            "snapshot": snapshot,
            "context": context,
            "has_data": snapshot is not None
        }
    except Exception as e:
        logger.error(f"Failed to get identity for user_id={user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/identity/{user_id}/snapshot")
async def get_identity_snapshot_endpoint(user_id: str):
    """
    Get the most recent identity snapshot for a user.
    
    Returns:
        Identity snapshot with tensions, themes, loops, beliefs
    """
    snapshot = get_identity_snapshot(user_id)
    if not snapshot:
        return {
            "user_id": user_id,
            "snapshot": None,
            "message": "No identity snapshot found"
        }
    
    return {
        "user_id": user_id,
        "snapshot": snapshot,
        "timestamp": snapshot.get("snapshot_at")
    }


# ============================================================================
# Evolution & Regression Endpoints
# ============================================================================

@router.get("/evolution/{user_id}")
async def get_evolution(user_id: str, limit: int = 20):
    """
    Get evolution timeline for a user.
    
    Returns:
        - Growth events
        - Regression events  
        - Loop patterns
        - Breakthrough moments
    """
    try:
        # Get all types of regression markers
        loops = get_regression_markers(user_id, kind="loop", limit=limit)
        self_attacks = get_regression_markers(user_id, kind="self_attack", limit=limit)
        judgment_spikes = get_regression_markers(user_id, kind="judgment_spike", limit=limit)
        avoidance = get_regression_markers(user_id, kind="avoidance", limit=limit)
        
        return {
            "user_id": user_id,
            "loops": loops,
            "self_attacks": self_attacks,
            "judgment_spikes": judgment_spikes,
            "avoidance_patterns": avoidance,
            "total_markers": len(loops) + len(self_attacks) + len(judgment_spikes) + len(avoidance)
        }
    except Exception as e:
        logger.error(f"Failed to get evolution for user_id={user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/regression/{user_id}/loops")
async def get_loops(user_id: str, limit: int = 10):
    """
    Get detected loops for a user.
    
    Loops are recurring patterns in thinking or behavior.
    """
    loops = get_regression_markers(user_id, kind="loop", limit=limit)
    return {
        "user_id": user_id,
        "loops": loops,
        "count": len(loops)
    }


# ============================================================================
# Bias Insights Endpoint
# ============================================================================

@router.get("/bias/{user_id}")
async def get_bias_insights(user_id: str):
    """
    Get bias insights for a user.
    
    Bias is studied, not hidden. This shows dimensions and directions
    of cognitive bias detected in reflections.
    
    Returns:
        List of bias insights with dimensions, directions, confidence
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        resp = (
            supabase.table("bias_insights")
            .select("*")
            .eq("identity_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        
        return {
            "user_id": user_id,
            "bias_insights": resp.data if resp.data else [],
            "count": len(resp.data) if resp.data else 0
        }
    except Exception as e:
        logger.error(f"Failed to get bias insights for user_id={user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# User Management Endpoints
# ============================================================================

@router.post("/user/create", response_model=UserCreateResponse)
async def create_user_endpoint(req: UserCreateRequest):
    """
    Create a new user profile.
    
    Args:
        req: UserCreateRequest with optional name
        
    Returns:
        UserCreateResponse with user_id
    """
    try:
        user_id = create_user(display_name=req.name)
        logger.info(f"Created user with id={user_id}")
        return UserCreateResponse(user_id=user_id)
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user(user_id: str):
    """
    Get user profile by ID.
    
    Returns:
        User profile data
    """
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    return profile


@router.get("/user/{user_id}/history", response_model=UserHistoryResponse)
async def get_history(user_id: str, limit: int = 10):
    """
    Get user reflection history.
    
    Args:
        user_id: UUID of the user
        limit: Maximum number of items to return
        
    Returns:
        UserHistoryResponse with reflection/mirrorback pairs
    """
    try:
        history = get_user_history(user_id, limit=limit)
        return UserHistoryResponse(history=history)
    except Exception as e:
        logger.error(f"Failed to get history for user_id={user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the MirrorX engine.
    
    Returns:
        Status of database connection and AI providers
    """
    import os
    from datetime import datetime
    
    def check_api_key(env_var: str) -> dict:
        """Check if API key is present and return status"""
        key = os.getenv(env_var)
        return {
            "present": bool(key and len(key) > 0),
            "configured": bool(key and len(key) > 20),  # Basic sanity check
            "last_checked": datetime.utcnow().isoformat() + "Z"
        }
    
    status = {
        "status": "healthy",
        "database": "connected" if supabase else "not configured",
        "providers": {
            "anthropic": check_api_key("ANTHROPIC_API_KEY"),
            "openai": check_api_key("OPENAI_API_KEY"),
            "google": check_api_key("GOOGLE_API_KEY"),
            "perplexity": check_api_key("PERPLEXITY_API_KEY"),
            "hume": {
                "present": bool(os.getenv("HUME_API_KEY")),
                "optional": True
            }
        }
    }
    
    return status
