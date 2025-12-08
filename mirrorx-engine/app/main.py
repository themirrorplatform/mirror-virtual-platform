import logging
import os
import re
from typing import List, Optional, Dict
from collections import Counter

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.models import (
    ReflectRequest,
    ReflectResponse,
    UserCreateRequest,
    UserCreateResponse,
    UserHistoryResponse,
)
from app.safety import safety_check, detect_tone
from app.mirrorcore import generate_mirrorback, mirrorcore_lint
from app.orchestrator import process_reflection_orchestrated
from app.database import (
    create_user,
    save_reflection_and_mirrorback,
    get_user_history,
    build_context_object,
    get_identity_snapshot,
    save_identity_snapshot,
    save_conductor_bundle,
    supabase,
)
from app.tone_orchestrator import analyze_text_tone
from app.conductor import handle_reflection as conductor_handle_reflection
from app.identity_graph import apply_identity_delta_to_db, get_identity_context_from_db
from app.evolution_engine import get_evolution_context_for_claude

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("mirrorx-engine")

# ---------------------------------------------------------------------------
# Rate Limiter
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Mirror-X API",
    description="Reflective intelligence API (reflection, not prescription).",
    version="0.1.0",
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handling middleware
@app.middleware("http")
async def log_requests_and_errors(request: Request, call_next):
    """
    Log all requests and catch unhandled exceptions.
    """
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.exception(f"Unhandled error in {request.method} {request.url.path}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error. The mirror cracked."},
        )

# Import and include comprehensive API routes
try:
    from api_routes_comprehensive import router as mirrorx_router
    app.include_router(mirrorx_router)
    logger.info("✓ MirrorX comprehensive routes loaded")
except ImportError as e:
    logger.warning(f"Could not load comprehensive routes: {e}")

# Import schemas for /mirrorback endpoint
try:
    from schemas import MirrorbackRequest, MirrorbackResponse
except ImportError:
    # Fallback definitions if schemas.py doesn't exist
    from pydantic import BaseModel
    
    class MirrorbackRequest(BaseModel):
        reflection_id: int
        reflection_body: str
        lens_key: Optional[str] = None
        identity_id: str
    
    class MirrorbackResponse(BaseModel):
        body: str
        tone: str
        tensions: List[str] = []
        metadata: Dict[str, Any] = {}


def extract_themes_from_history(text: str, max_themes: int = 5) -> List[str]:
    """Very small, local theme extractor used for quick frontend summaries.

    This is intentionally simple (token frequency minus stopwords).
    """
    stopwords = {
        "the",
        "and",
        "that",
        "this",
        "with",
        "for",
        "you",
        "your",
        "from",
        "have",
        "not",
        "are",
        "but",
        "was",
        "what",
        "when",
        "which",
        "them",
        "they",
        "their",
        "will",
        "would",
    }

    tokens = re.findall(r"\b[a-zA-Z][a-zA-Z']+\b", text.lower())
    filtered = [t for t in tokens if t not in stopwords and len(t) > 3]
    counts = Counter(filtered)
    return [w for w, _ in counts.most_common(max_themes)]

# ---------------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------------

frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin] if frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint with provider status.
    """
    provider_status = {
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "gemini": bool(os.getenv("GOOGLE_API_KEY")),
        "perplexity": bool(os.getenv("PERPLEXITY_API_KEY")),
        "hume": bool(os.getenv("HUME_API_KEY")),
    }
    
    return {
        "status": "healthy",
        "service": "mirrorx-engine",
        "version": "0.1.0",
        "providers_configured": sum(provider_status.values()),
        "providers": provider_status
    }


# ---------------------------------------------------------------------------
# API: Mirrorback Generation (Called by Core API)
# ---------------------------------------------------------------------------


@app.post("/mirrorback", response_model=MirrorbackResponse)
async def generate_mirrorback_endpoint(req: MirrorbackRequest):
    """
    Generate a mirrorback for a reflection.
    
    This endpoint is called by the Core API's mirrorbacks router.
    It runs the full MirrorCore pipeline and returns a reflective response.
    
    Args:
        req: MirrorbackRequest with reflection details
        
    Returns:
        MirrorbackResponse with mirrorback body, tone, tensions, metadata
    """
    try:
        logger.info(f"Generating mirrorback for reflection {req.reflection_id}")
        
        # Run conductor if enabled, otherwise use orchestrator
        use_conductor = os.getenv("USE_CONDUCTOR", "true").lower() == "true"
        
        if use_conductor:
            # Get previous identity snapshot
            previous_identity = get_identity_snapshot(req.identity_id)
            
            # Run conductor orchestration
            result = await conductor_handle_reflection(
                user_id=req.identity_id,
                text=req.reflection_body,
                previous_identity=previous_identity,
                audio_data=None
            )
            
            # Save identity snapshot
            if result.identity_updated:
                save_identity_snapshot(req.identity_id, result.identity_updated)
            
            # Save conductor bundle
            if result.bundle:
                save_conductor_bundle(
                    user_id=req.identity_id,
                    reflection_id=str(req.reflection_id),
                    bundle=result.bundle
                )
            
            return MirrorbackResponse(
                body=result.mirrorback,
                tone=result.bundle.tone.mirror_tone if result.bundle else "compassionate",
                tensions=result.identity_delta.new_tensions if result.identity_delta else [],
                metadata={
                    "lint_passed": result.lint_passed,
                    "lint_violations": result.lint_violations,
                    "conductor_used": True
                }
            )
        else:
            # Fallback to orchestrator
            orchestration = await process_reflection_orchestrated(
                user_id=req.identity_id,
                reflection_text=req.reflection_body
            )
            
            return MirrorbackResponse(
                body=orchestration.get("mirrorback", ""),
                tone=orchestration.get("tone", "unknown"),
                tensions=[],
                metadata={
                    "lint_passed": orchestration.get("lint_passed", False),
                    "lint_violations": orchestration.get("lint_violations", []),
                    "conductor_used": False
                }
            )
            
    except Exception as e:
        logger.exception(f"Error generating mirrorback: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mirrorback: {str(e)}"
        )


# ---------------------------------------------------------------------------
# API: User
# ---------------------------------------------------------------------------


@app.post("/api/user/create", response_model=UserCreateResponse)
async def api_create_user(payload: UserCreateRequest) -> UserCreateResponse:
    """
    Create a new user in the database.

    This is intentionally minimal: Mirror-X cares more about reflection history
    than profile richness.
    """
    try:
        user_id = create_user(name=payload.name)
        return UserCreateResponse(user_id=str(user_id))
    except Exception as exc:
        logger.exception("Failed to create user: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create user")


@app.get("/api/user/{user_id}/history", response_model=UserHistoryResponse)
async def api_get_user_history(user_id: str, limit: int = 20) -> UserHistoryResponse:
    """
    Return recent reflections and mirrorbacks for a user, plus simple extracted themes.

    Uses a lightweight local theme extractor for quick frontend display.
    """
    try:
        history_items = get_user_history(user_id=user_id, limit=limit)

        # Build combined text blocks for simple theme extraction
        history_blocks: List[str] = []
        for h in history_items:
            reflection = h.reflection_text or ""
            mirrorback = h.mirrorback_text or ""
            history_blocks.append(f"Reflection: {reflection}\nMirrorback: {mirrorback}")

        full_history_text = "\n\n".join(history_blocks)
        overall_themes: List[str] = []
        if full_history_text.strip():
            overall_themes = extract_themes_from_history(full_history_text, max_themes=5)

        return UserHistoryResponse(user_id=user_id, items=history_items, overall_themes=overall_themes)

    except Exception as exc:
        logger.exception("Failed to fetch user history: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch history")


# ---------------------------------------------------------------------------
# API: Identity & Graph
# ---------------------------------------------------------------------------


@app.get("/api/user/{user_id}/identity")
async def api_get_identity(user_id: str) -> Dict:
    """
    Return aggregated identity snapshot for a user:
    - Active tensions
    - Recurring loops
    - Beliefs
    - Dominant tension
    - Big question
    - Current emotional baseline
    - Graph state (top themes, connections)
    """
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        identity_ctx = get_identity_context_from_db(supabase, user_id)

        # Get identity snapshot
        snapshot_resp = supabase.table("mirrorx_identity_snapshots_v2") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        snapshot = snapshot_resp.data[0] if snapshot_resp.data else {}

        return {
            "user_id": user_id,
            "tensions": identity_ctx.get("tensions", []),
            "loops": identity_ctx.get("loops", []),
            "beliefs": identity_ctx.get("beliefs", []),
            "dominant_tension": identity_ctx.get("dominant_tension"),
            "big_question": identity_ctx.get("big_question"),
            "emotional_baseline": identity_ctx.get("emotional_baseline", []),
            "graph_state": snapshot.get("graph_state", {}),
            "oscillation_pattern": identity_ctx.get("oscillation_pattern"),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch identity: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch identity")


@app.get("/api/user/{user_id}/graph")
async def api_get_graph(user_id: str) -> Dict:
    """
    Return identity graph nodes and edges for visualization.

    Nodes: themes (concepts, tensions, beliefs)
    Edges: relationships with weights
    """
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        # Get nodes
        nodes_resp = supabase.table("mirrorx_graph_nodes") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("weight", desc=True) \
            .limit(50) \
            .execute()

        nodes = [
            {
                "id": n["id"],
                "label": n["label"],
                "node_type": n["node_type"],
                "weight": n["weight"],
                "metadata": n.get("metadata", {}),
            }
            for n in nodes_resp.data
        ]

        # Get edges
        edges_resp = supabase.table("mirrorx_graph_edges") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("weight", desc=True) \
            .limit(100) \
            .execute()

        edges = [
            {
                "source": e["source_node_id"],
                "target": e["target_node_id"],
                "edge_type": e["edge_type"],
                "weight": e["weight"],
            }
            for e in edges_resp.data
        ]

        return {
            "user_id": user_id,
            "nodes": nodes,
            "edges": edges,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch graph: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch graph")


@app.get("/api/user/{user_id}/evolution")
async def api_get_evolution_timeline(user_id: str, limit: int = 20) -> Dict:
    """
    Return evolution timeline: growth, stagnation, loops, tension shifts, etc.
    """
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        # Get evolution events
        events_resp = supabase.table("mirrorx_evolution_events") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("detected_at", desc=True) \
            .limit(limit) \
            .execute()

        events = [
            {
                "event_type": e["event_type"],
                "description": e.get("description"),
                "detected_at": e["detected_at"],
                "reflection_id": e.get("reflection_id"),
                "metadata": e.get("metadata", {}),
            }
            for e in events_resp.data
        ]

        return {
            "user_id": user_id,
            "events": events,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch evolution: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch evolution")


# ---------------------------------------------------------------------------
# API: Reflect
# ---------------------------------------------------------------------------


@app.post("/api/reflect", response_model=ReflectResponse)
async def api_reflect(payload: ReflectRequest) -> ReflectResponse:
    """
    Main reflection endpoint.

    Uses the Conductor for multi-provider orchestration if enabled,
    otherwise falls back to the legacy orchestrator.

    Flow (Conductor):
      1. Safety check
      2. Emotional scan (Hume)
      3. Semantic parse (OpenAI)
      4. Identity merge
      5. Logic & paradox map (Gemini)
      6. Conditional grounding (Perplexity)
      7. Tone decision
      8. Mirrorback draft (Claude)
      9. Safety & style filter
      10. Identity delta & storage

    The response is *purely reflective* and must not contain advice,
    prescriptions, or optimization language.
    """
    # Rate limiting hint:
    #   This is a good place to plug in a rate limiter (e.g., slowapi)
    #   keyed by user_id and/or IP in a production deployment.

    # Feature flag: enable conductor
    use_conductor = os.getenv("USE_CONDUCTOR", "true").lower() == "true"

    try:
        user_id = payload.user_id
        reflection_text = payload.reflection_text

        # ---------------------------------------------------------------------------
        # NEW PATH: Conductor-based orchestration
        # ---------------------------------------------------------------------------
        if use_conductor:
            logger.info(f"Using Conductor for user {user_id}")

            # Get previous identity snapshot
            previous_identity = get_identity_snapshot(user_id)

            # Run conductor orchestration
            result = await conductor_handle_reflection(
                user_id=user_id,
                text=reflection_text,
                previous_identity=previous_identity,
                audio_data=None  # TODO: Add audio support
            )

            # ═══════════════════════════════════════════════════════════════════════
            # CRITICAL INTEGRATION: Apply identity delta to database
            # This triggers: graph update, evolution detection, complete persistence
            # ═══════════════════════════════════════════════════════════════════════
            if supabase:
                try:
                    logger.info(f"Applying identity delta to database for user {user_id}")
                    apply_identity_delta_to_db(
                        supabase_client=supabase,
                        reflection_id=result.reflection_id,
                        user_id=user_id,
                        identity_delta=result.identity_delta,
                        bundle=result.bundle
                    )
                    logger.info(f"Identity delta applied successfully - graph and evolution updated")
                except Exception as e:
                    logger.exception(f"Failed to apply identity delta: {e}")
                    # Continue anyway - don't block user response
            else:
                logger.warning("Supabase not configured - skipping identity delta persistence")

            # Save identity snapshot
            save_identity_snapshot(user_id, result.identity_updated)

            # Save conductor bundle (for analysis/debugging)
            save_conductor_bundle(user_id, result.reflection_id, result.bundle)

            # Save reflection and mirrorback (traditional storage)
            tone_label = result.bundle.emotion.primary
            context = {
                "emotion": result.bundle.emotion.model_dump(),
                "semantic": result.bundle.semantic.model_dump(),
                "identity": result.bundle.identity.model_dump(),
                "logic": result.bundle.logic.model_dump(),
                "tone_decision": result.bundle.tone.model_dump(),
            }

            save_reflection_and_mirrorback(
                user_id=user_id,
                reflection_text=reflection_text,
                mirrorback_text=result.mirrorback,
                tone=tone_label,
                context=context,
                tone_snapshot=result.bundle.emotion.model_dump(),
            )

            # Retrieve evolution events from identity graph after delta application
            evolution_events = []
            if supabase:
                try:
                    # Get recent evolution events for this user
                    evo_resp = supabase.table("mirrorx_evolution_events") \
                        .select("event_type") \
                        .eq("user_id", user_id) \
                        .order("detected_at", desc=True) \
                        .limit(3) \
                        .execute()
                    evolution_events = [e["event_type"] for e in evo_resp.data]
                except Exception as e:
                    logger.warning(f"Failed to fetch evolution events: {e}")

            # Extract tensions and loops from identity
            tensions = result.identity_updated.tensions if result.identity_updated else []
            loops = result.identity_updated.recurring_loops if result.identity_updated else []

            # Build delta summary
            delta_summary = None
            if result.identity_delta:
                parts = []
                if result.identity_delta.new_tensions:
                    parts.append(f"New tensions: {', '.join(result.identity_delta.new_tensions[:2])}")
                if result.identity_delta.resolved_tensions:
                    parts.append(f"Resolved: {', '.join(result.identity_delta.resolved_tensions[:2])}")
                if result.identity_delta.new_loops:
                    parts.append(f"New loops: {', '.join(result.identity_delta.new_loops[:2])}")
                delta_summary = "; ".join(parts) if parts else None

            return ReflectResponse(
                reflection_id=result.reflection_id,
                mirrorback=result.mirrorback,
                tone=tone_label,
                lint_passed=result.lint_passed,
                lint_violations=result.lint_violations,
                evolution_events=evolution_events,
                tensions=tensions[:5],  # Top 5
                loops=loops[:5],  # Top 5
                identity_delta_summary=delta_summary,
            )

        # ---------------------------------------------------------------------------
        # LEGACY PATH: Original orchestrator
        # ---------------------------------------------------------------------------
        else:
            logger.info(f"Using legacy orchestrator for user {user_id}")

            # 1. Safety layer
            safety_result = safety_check(reflection_text)
            if safety_result.get("bypass_reflection"):
                logger.warning(
                    "Safety triggered for user_id=%s: %s",
                    user_id,
                    safety_result.get("response"),
                )
                return ReflectResponse(
                    reflection_id=None,
                    mirrorback=str(safety_result.get("response", "")),
                    tone="crisis",
                    lint_passed=True,
                    lint_violations=[],
                )

            # 2. Tone detection
            tone = detect_tone(reflection_text)
            logger.info("Detected tone for user %s: %s", user_id, tone)

            # 3. Build context
            context = build_context_object(
                user_id=user_id,
                current_reflection=reflection_text,
                user_tone=tone,
            )

            # 3b. Rich tone snapshot
            try:
                tone_snapshot = await analyze_text_tone(reflection_text)
                tone_snapshot_dict = tone_snapshot.to_dict() if tone_snapshot else None
            except Exception:
                tone_snapshot_dict = None

            # Delegate to orchestrator
            orchestration = await process_reflection_orchestrated(
                user_id=user_id, reflection_text=reflection_text, maybe_external_question=None
            )

            mirrorback_text = orchestration.get("mirrorback")
            lint_passed = bool(orchestration.get("lint_passed"))
            lint_violations = orchestration.get("lint_violations") or []

            # Store reflection + mirrorback
            reflection_id = save_reflection_and_mirrorback(
                user_id=user_id,
                reflection_text=reflection_text,
                mirrorback_text=str(mirrorback_text or ""),
                tone=tone,
                context=context,
                tone_snapshot=tone_snapshot_dict,
            )

            return ReflectResponse(
                reflection_id=str(reflection_id),
                mirrorback=str(mirrorback_text or ""),
                tone=tone,
                lint_passed=lint_passed,
                lint_violations=lint_violations,
            )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Reflection endpoint failure: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate mirrorback")
