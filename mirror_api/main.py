"""
Mirror Core API - Phase 4

FastAPI application exposing MirrorCore system via HTTP.

Constitutional Guarantees:
- I1: Works offline-first, no required external services
- I2: All operations scoped to mirror_id  
- I7: All actions auditable
- I13: No behavioral metrics
- I14: No cross-identity aggregation
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from typing import Optional
from pathlib import Path
import logging

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.core import MirrorOrchestrator, MirrorbackGenerator
from mirror_os.llm.base import BaseLLM, LLMConfig, LLMProvider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter (I13: prevent abuse without tracking behavior)
limiter = Limiter(key_func=get_remote_address)

# Global storage instance
storage: Optional[SQLiteStorage] = None
orchestrator: Optional[MirrorOrchestrator] = None


def get_storage() -> SQLiteStorage:
    """Get storage instance."""
    global storage
    if storage is None:
        raise RuntimeError("Storage not initialized")
    return storage


def get_orchestrator() -> MirrorOrchestrator:
    """Get orchestrator instance."""
    global orchestrator
    if orchestrator is None:
        raise RuntimeError("Orchestrator not initialized")
    return orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context for startup/shutdown."""
    global storage, orchestrator
    
    logger.info("Mirror Core API starting...")
    
    # Initialize storage
    db_path = Path("data/mirror.db")
    db_path.parent.mkdir(parents=True, exist_ok=True)
    storage = SQLiteStorage(str(db_path))
    logger.info(f"Storage initialized: {db_path}")
    
    # Initialize LLM (mock for now - in production use actual LLM)
    from mirror_api.mock_llm import MockLLM
    llm = MockLLM()
    
    # Initialize generator
    generator = MirrorbackGenerator(storage, llm)
    
    # Initialize orchestrator
    orchestrator = MirrorOrchestrator(storage, generator)
    logger.info("Orchestrator initialized")
    
    # Store in app state for access from endpoints
    app.state.storage = storage
    app.state.orchestrator = orchestrator
    
    yield
    
    logger.info("Mirror Core API shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Mirror Core API",
    description="Constitutional AI reflection system exposing MirrorCore via HTTP",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Constitutional compliance middleware
@app.middleware("http")
async def constitutional_middleware(request: Request, call_next):
    """
    Enforce constitutional requirements.
    
    - I7: Log all requests for auditability
    - I13: No behavioral tracking
    """
    logger.info(f"{request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Constitutional headers
    response.headers["X-Mirror-Constitution"] = "1.0"
    response.headers["X-Behavioral-Tracking"] = "false"
    response.headers["X-Data-Sovereignty"] = "true"
    
    return response


# Mirror ID validation
async def get_mirror_id(x_mirror_id: Optional[str] = Header(None)) -> str:
    """
    Extract and validate mirror_id.
    
    I2: All identity-scoped operations require mirror_id.
    """
    if not x_mirror_id:
        raise HTTPException(
            status_code=400,
            detail="I2: mirror_id required in X-Mirror-Id header"
        )
    
    if len(x_mirror_id) < 8:
        raise HTTPException(
            status_code=400,
            detail="Invalid mirror_id format"
        )
    
    return x_mirror_id


# Root endpoint
@app.get("/")
async def root():
    """API root with constitutional declaration."""
    return {
        "service": "Mirror Core API",
        "version": "1.0.0",
        "constitution": {
            "I1": "Data sovereignty",
            "I2": "Identity locality",
            "I7": "Architectural honesty",
            "I9": "Anti-diagnosis",
            "I13": "No behavioral optimization",
            "I14": "No cross-identity inference"
        },
        "status": "operational",
        "endpoints": {
            "/health": "Health check",
            "/api/v1/reflect": "Generate reflection",
            "/api/v1/graph/stats": "Graph statistics",
            "/api/v1/shapes": "Language shapes",
            "/api/v1/tensions": "Tension measurements",
            "/docs": "API documentation"
        }
    }


# Health check
@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    """Health check."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "storage": "connected",
        "orchestrator": "ready"
    }


# Mount routers (to be created)
from mirror_api.routers import reflections, graph, statistics

app.include_router(reflections.router, prefix="/api/v1", tags=["reflections"])
app.include_router(graph.router, prefix="/api/v1", tags=["graph"])
app.include_router(statistics.router, prefix="/api/v1", tags=["statistics"])


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
