"""
Mirror REST API

HTTP API for web and mobile integrations.

Endpoints:
    POST   /sessions              - Start a new session
    GET    /sessions/{id}         - Get session info
    DELETE /sessions/{id}         - End a session
    POST   /sessions/{id}/reflect - Submit reflection

    GET    /health                - Health check
    GET    /axioms                - Get constitutional axioms
"""

from typing import Optional, Dict, Any
from datetime import datetime

try:
    from fastapi import FastAPI, HTTPException, Depends, Header
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    FastAPI = None
    BaseModel = object

from .config import MirrorPlatformConfig, load_config
from .platform import MirrorInstance


# Request/Response Models
if FASTAPI_AVAILABLE:

    class StartSessionRequest(BaseModel):
        """Request to start a new session."""
        user_id: str = Field(default="default", description="User identifier")

    class StartSessionResponse(BaseModel):
        """Response with session information."""
        session_id: str
        user_id: str
        started_at: str
        message: str = "Session started. Remember: you can leave at any time."

    class SessionInfoResponse(BaseModel):
        """Session information response."""
        session_id: str
        user_id: str
        active: bool
        started_at: str
        duration_minutes: float
        message_count: int
        reflection_count: int
        patterns_detected: list

    class EndSessionResponse(BaseModel):
        """Response when ending a session."""
        session_id: str
        message: str  # Departure celebration

    class ReflectRequest(BaseModel):
        """Request for a reflection."""
        text: str = Field(..., min_length=1, description="User input text")

    class ReflectResponse(BaseModel):
        """Response with reflection."""
        success: bool
        text: Optional[str] = None
        patterns: list = []
        tensions: list = []
        break_suggested: bool = False
        break_message: Optional[str] = None
        session_should_end: bool = False
        error: Optional[str] = None
        duration_ms: float = 0.0

    class HealthResponse(BaseModel):
        """Health check response."""
        status: str
        running: bool
        environment: str
        timestamp: str

    class AxiomsResponse(BaseModel):
        """Constitutional axioms response."""
        count: int
        axioms: Dict[str, str]


# API Factory
def create_app(config: MirrorPlatformConfig = None) -> "FastAPI":
    """Create the FastAPI application."""
    if not FASTAPI_AVAILABLE:
        raise ImportError("FastAPI is required for the API server")

    config = config or load_config()

    app = FastAPI(
        title="Mirror API",
        description="Constitutional Boundary Layer for Intelligence",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.api.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Instance storage (in production, use proper session management)
    instance = MirrorInstance(config)

    @app.on_event("startup")
    async def startup():
        await instance.start()

    @app.on_event("shutdown")
    async def shutdown():
        await instance.stop()

    # Health endpoint
    @app.get("/health", response_model=HealthResponse, tags=["System"])
    async def health_check():
        """Check API health status."""
        health = instance.health_check()
        return HealthResponse(
            status=health.get("status", "unknown"),
            running=health.get("running", False),
            environment=config.environment,
            timestamp=datetime.utcnow().isoformat(),
        )

    # Axioms endpoint
    @app.get("/axioms", response_model=AxiomsResponse, tags=["System"])
    async def get_axioms():
        """Get the 14 constitutional axioms."""
        axioms = instance.get_axioms()
        return AxiomsResponse(
            count=len(axioms),
            axioms={str(k): v for k, v in axioms.items()},
        )

    # Session endpoints
    @app.post(
        "/sessions",
        response_model=StartSessionResponse,
        tags=["Sessions"],
        summary="Start a new session"
    )
    async def start_session(request: StartSessionRequest):
        """
        Start a new Mirror session.

        Sessions are time-limited (45-minute warning, 90-minute limit)
        to encourage healthy usage patterns.
        """
        if not instance.is_running:
            raise HTTPException(status_code=503, detail="Mirror is not running")

        session = await instance.start_session(request.user_id)

        return StartSessionResponse(
            session_id=session.id,
            user_id=session.user_id,
            started_at=session.started_at.isoformat(),
        )

    @app.get(
        "/sessions/{session_id}",
        response_model=SessionInfoResponse,
        tags=["Sessions"],
        summary="Get session information"
    )
    async def get_session(session_id: str):
        """Get information about a session."""
        session = instance.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionInfoResponse(
            session_id=session.id,
            user_id=session.user_id,
            active=session.active,
            started_at=session.started_at.isoformat(),
            duration_minutes=session.duration_minutes,
            message_count=session.message_count,
            reflection_count=session.reflection_count,
            patterns_detected=session.patterns_detected,
        )

    @app.delete(
        "/sessions/{session_id}",
        response_model=EndSessionResponse,
        tags=["Sessions"],
        summary="End a session"
    )
    async def end_session(session_id: str):
        """
        End a session.

        Endings are celebrated, not mourned. The departure message
        is designed to be positive and affirming.
        """
        session = instance.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        message = await instance.end_session(session_id)

        return EndSessionResponse(
            session_id=session_id,
            message=message,
        )

    @app.post(
        "/sessions/{session_id}/reflect",
        response_model=ReflectResponse,
        tags=["Reflection"],
        summary="Submit input for reflection"
    )
    async def reflect(session_id: str, request: ReflectRequest):
        """
        Submit user input for reflection.

        Mirror will analyze the input and provide a reflection
        that respects all 14 constitutional axioms.

        The response may include:
        - Patterns detected in the input
        - Tensions between expressed ideas
        - Break suggestions if session is long
        """
        session = instance.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if not session.active:
            raise HTTPException(status_code=400, detail="Session is not active")

        result = await instance.reflect(session_id, request.text)

        return ReflectResponse(
            success=result.success,
            text=result.text,
            patterns=result.patterns,
            tensions=result.tensions,
            break_suggested=result.break_suggested,
            break_message=result.break_message,
            session_should_end=result.session_should_end,
            error=result.error,
            duration_ms=result.duration_ms,
        )

    return app


# Simple server for testing
def run_server(host: str = "127.0.0.1", port: int = 8000):
    """Run the API server."""
    if not FASTAPI_AVAILABLE:
        print("FastAPI is required for the API server")
        print("Install with: pip install fastapi uvicorn")
        return

    try:
        import uvicorn
    except ImportError:
        print("uvicorn is required for the API server")
        print("Install with: pip install uvicorn")
        return

    app = create_app()
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_server()
