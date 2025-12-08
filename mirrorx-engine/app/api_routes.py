"""
MirrorX API - FastAPI Routes for Frontend Integration

Connects the React frontend to the orchestrator and local models infrastructure.
"""

from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
from datetime import datetime

from .schemas import (
    MirrorbackRequest,
    MirrorbackResponse,
    ProfileResponse,
    ThreadsResponse,
    ThreadReflectionsResponse,
    TensionSummary,
    LoopMarker,
    EvolutionSignal,
    EmotionalState,
    ErrorResponse,
    HealthResponse,
    ThreadSummary,
    ReflectionSummary,
)

# ============================================================================
# DEPENDENCIES & GLOBALS
# ============================================================================

# These will be initialized on app startup
orchestrator = None
db_client = None


async def get_current_user(user_id: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from header.
    In production, validate JWT from Authorization header.
    For now, require X-User-Id header for local dev.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    return user_id


# ============================================================================
# APP INITIALIZATION & MIDDLEWARE
# ============================================================================

def create_app(orchestrator_instance, db_instance) -> FastAPI:
    """Factory function to create app with injected dependencies"""
    global orchestrator, db_client
    orchestrator = orchestrator_instance
    db_client = db_instance

    app = FastAPI(
        title="MirrorX API",
        description="Reflective intelligence service",
        version="1.0.0",
    )

    # CORS configuration
    cors_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*", "X-Offline", "X-User-Id"],
    )

    # ========================================================================
    # HEALTH & INFO
    # ========================================================================

    @app.get("/api/health", response_model=HealthResponse)
    async def health_check():
        """System health check"""
        try:
            # Check local models availability
            local_available = False
            providers_status = {}
            try:
                from .local.config import get_router

                router = get_router()
                local_available = True
                # Get provider health
                for name, provider in router.providers.items():
                    try:
                        info = await provider.health_check()
                        providers_status[name] = info.get("status") == "healthy"
                    except:
                        providers_status[name] = False
            except:
                pass

            return HealthResponse(
                status="ok",
                orchestrator="conductor" if hasattr(orchestrator, "conductor") else "legacy",
                local_models_available=local_available,
                providers=providers_status,
                timestamp=datetime.utcnow(),
            )
        except Exception as e:
            return HealthResponse(
                status="degraded",
                orchestrator="unknown",
                local_models_available=False,
                providers={},
                timestamp=datetime.utcnow(),
            )

    # ========================================================================
    # REFLECTION ENDPOINT
    # ========================================================================

    @app.post("/mirrorback", response_model=MirrorbackResponse)
    async def mirrorback(
        body: MirrorbackRequest,
        x_offline: Optional[str] = Header(None),
        user_id: str = Depends(get_current_user),
    ):
        """
        POST /mirrorback

        Send a reflection and get the mirrorback (generated reflection).

        Headers:
        - X-User-Id: User ID (required)
        - X-Offline: "1" to force offline-only mode (optional)

        Request body:
        {
            "user_id": "user-123",
            "text": "I notice I keep avoiding this conversation",
            "conversation_id": "thread-abc",
            "offline_only": false
        }
        """
        # Validate user consistency
        if body.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID mismatch",
            )

        offline_only = body.offline_only or (x_offline == "1")

        try:
            # Call orchestrator
            result = await orchestrator.process_reflection_orchestrated(
                user_id=body.user_id,
                input_text=body.text,
                offline_only=offline_only,
            )

            # Extract reflection ID and mirrorback
            reflection_id = result.get("reflection_id", f"ref-{datetime.utcnow().timestamp()}")
            conversation_id = body.conversation_id or reflection_id
            mirrorback_text = result.get("mirrorback", "")
            lint_passed = result.get("lint_passed", True)
            lint_violations = result.get("lint_violations", [])

            # Fetch light profile for UI (tensions, loops, emotional state)
            tensions = []
            loops = []
            evolution_signals = []
            emotional_state = None

            try:
                # Query user profile for aggregate tension summary
                profile_table = db_client.table("mirrorx_user_profiles")
                profile_result = await profile_table.select("*").eq("user_id", body.user_id).maybe_single().execute()
                if profile_result.data:
                    profile = profile_result.data
                    tensions = [
                        TensionSummary(**t) if isinstance(t, dict) else t
                        for t in profile.get("tensions_summary", [])
                    ]
                    loops = [
                        LoopMarker(**l) if isinstance(l, dict) else l
                        for l in profile.get("regression_markers", [])
                    ]
                    if profile.get("emotional_signature"):
                        emotional_state = EmotionalState(**profile["emotional_signature"])

                # Query evolution signals for this reflection
                evo_result = await db_client.table("mirrorx_evolution_events") \
                    .select("event_type, label, severity") \
                    .eq("reflection_id", reflection_id).execute()
                if evo_result.data:
                    evolution_signals = [
                        EvolutionSignal(
                            type=e.get("event_type", "growth"),
                            label=e.get("label", ""),
                            severity=e.get("severity", 0.5),
                        )
                        for e in evo_result.data
                    ]
            except Exception as e:
                # If DB queries fail, continue with empty summaries
                pass

            return MirrorbackResponse(
                reflection_id=reflection_id,
                conversation_id=conversation_id,
                mirrorback=mirrorback_text,
                created_at=datetime.utcnow(),
                tensions=tensions,
                loops=loops,
                evolution_signals=evolution_signals,
                emotional_state=emotional_state,
                lint_passed=lint_passed,
                lint_violations=lint_violations,
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Reflection failed: {str(e)}",
            )

    # ========================================================================
    # PROFILE ENDPOINTS
    # ========================================================================

    @app.get("/api/profile/me", response_model=ProfileResponse)
    async def get_profile_me(user_id: str = Depends(get_current_user)):
        """
        GET /api/profile/me

        Get current user's profile (tensions, themes, evolution markers, threads).
        """
        try:
            result = await db_client.table("mirrorx_user_profiles") \
                .select("*") \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()

            if not result.data:
                # Return default profile if not found
                return ProfileResponse(
                    user_id=user_id,
                    preferred_tone="warm",
                    openness_level=0.5,
                    tensions_summary=[],
                    contradictions_summary=[],
                    themes=[],
                    emotional_signature=None,
                    regression_markers=[],
                    progression_markers=[],
                    thread_history=[],
                )

            profile = result.data
            return ProfileResponse(
                user_id=profile.get("user_id", user_id),
                preferred_tone=profile.get("preferred_tone", "warm"),
                openness_level=profile.get("openness_level", 0.5),
                tensions_summary=[
                    TensionSummary(**t) if isinstance(t, dict) else t
                    for t in profile.get("tensions_summary", [])
                ],
                contradictions_summary=profile.get("contradictions_summary", []),
                themes=profile.get("themes", []),
                emotional_signature=EmotionalState(**profile["emotional_signature"])
                if profile.get("emotional_signature")
                else None,
                regression_markers=[
                    LoopMarker(**l) if isinstance(l, dict) else l
                    for l in profile.get("regression_markers", [])
                ],
                progression_markers=profile.get("progression_markers", []),
                thread_history=[
                    ThreadHistoryEntry(**t) if isinstance(t, dict) else t
                    for t in profile.get("thread_history", [])
                ],
                created_at=profile.get("created_at"),
                updated_at=profile.get("updated_at"),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch profile: {str(e)}",
            )

    # ========================================================================
    # THREAD ENDPOINTS
    # ========================================================================

    @app.get("/api/threads", response_model=ThreadsResponse)
    async def get_threads(user_id: str = Depends(get_current_user)):
        """
        GET /api/threads

        Get all conversation threads for current user.
        """
        try:
            result = await db_client.table("mirrorx_user_profiles") \
                .select("thread_history") \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()

            thread_history = result.data.get("thread_history", []) if result.data else []
            threads = [
                ThreadSummary(
                    id=t.get("thread_id", t.get("id", "")),
                    title=t.get("title", "Untitled Thread"),
                    last_active=t.get("last_active"),
                    reflection_count=t.get("reflection_count", 0),
                    created_at=t.get("created_at"),
                )
                for t in thread_history
            ]
            return ThreadsResponse(threads=threads)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch threads: {str(e)}",
            )

    @app.get("/api/threads/{thread_id}", response_model=ThreadSummary)
    async def get_thread(thread_id: str, user_id: str = Depends(get_current_user)):
        """
        GET /api/threads/{threadId}

        Get single thread by ID.
        """
        try:
            # Find thread in user's thread_history
            profile = await db_client.table("mirrorx_user_profiles") \
                .select("thread_history") \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()

            if not profile.data:
                raise HTTPException(status_code=404, detail="Thread not found")

            for t in profile.data.get("thread_history", []):
                if t.get("thread_id") == thread_id or t.get("id") == thread_id:
                    return ThreadSummary(
                        id=t.get("thread_id", thread_id),
                        title=t.get("title", "Untitled"),
                        last_active=t.get("last_active"),
                        reflection_count=t.get("reflection_count", 0),
                    )

            raise HTTPException(status_code=404, detail="Thread not found")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch thread: {str(e)}",
            )

    @app.get("/api/threads/{thread_id}/reflections", response_model=ThreadReflectionsResponse)
    async def get_thread_reflections(
        thread_id: str,
        user_id: str = Depends(get_current_user),
    ):
        """
        GET /api/threads/{threadId}/reflections

        Get all reflections in a conversation thread.
        """
        try:
            # Get reflections with this conversation_id
            reflections_result = await db_client.table("mirrorx_reflections") \
                .select("id, created_at, input_text, mirrorback_text, conversation_id") \
                .eq("user_id", user_id) \
                .eq("conversation_id", thread_id) \
                .order("created_at", ascending=True) \
                .execute()

            reflections = [
                ReflectionSummary(
                    id=r.get("id", ""),
                    created_at=r.get("created_at", datetime.utcnow().isoformat()),
                    input_text=r.get("input_text", ""),
                    mirrorback_text=r.get("mirrorback_text"),
                    conversation_id=r.get("conversation_id", thread_id),
                )
                for r in (reflections_result.data or [])
            ]

            # Build thread summary
            if reflections:
                last = reflections[-1]
                thread = ThreadSummary(
                    id=thread_id,
                    title=f"Thread {thread_id[:8]}",  # Could derive from topics
                    last_active=last.created_at,
                    reflection_count=len(reflections),
                )
            else:
                thread = ThreadSummary(
                    id=thread_id,
                    title="Empty Thread",
                    last_active=None,
                    reflection_count=0,
                )

            return ThreadReflectionsResponse(thread=thread, reflections=reflections)

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch reflections: {str(e)}",
            )

    @app.get("/api/reflections/{reflection_id}", response_model=ReflectionSummary)
    async def get_reflection(
        reflection_id: str,
        user_id: str = Depends(get_current_user),
    ):
        """
        GET /api/reflections/{reflectionId}

        Get single reflection by ID.
        """
        try:
            result = await db_client.table("mirrorx_reflections") \
                .select("*") \
                .eq("id", reflection_id) \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()

            if not result.data:
                raise HTTPException(status_code=404, detail="Reflection not found")

            r = result.data
            return ReflectionSummary(
                id=r.get("id", ""),
                created_at=r.get("created_at", datetime.utcnow().isoformat()),
                input_text=r.get("input_text", ""),
                mirrorback_text=r.get("mirrorback_text"),
                conversation_id=r.get("conversation_id", ""),
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch reflection: {str(e)}",
            )

    return app
