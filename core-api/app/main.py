"""
The Mirror Virtual Platform - Core API
The backend spine of a social platform built on reflection, not engagement.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.db import init_db, close_db
from app.routers import reflections, mirrorbacks, feed, profiles, signals, notifications, search, threads, identity, governance, finder

# Configure logging
logger = logging.getLogger("mirror-core-api")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: startup and shutdown events.
    """
    # Startup
    print("🪞 The Mirror Virtual Platform - Core API Starting...")
    await init_db()
    print("✓ Core API ready")

    yield

    # Shutdown
    print("🪞 Core API shutting down...")
    await close_db()
    print("✓ Shutdown complete")


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="The Mirror Virtual Platform - Core API",
    description="A social platform whose core is reflection, not engagement.",
    version="1.0.0",
    lifespan=lifespan
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
    Log all requests and catch unhandled exceptions to prevent stack trace leaks.
    """
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.exception(f"Unhandled error in {request.method} {request.url.path}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error. Please try again later."},
        )


# ────────────────────────────────────────────────────────────────────────────
# EXCEPTION HANDLERS
# ────────────────────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc) if os.getenv("DEBUG") == "true" else None
        }
    )


# ────────────────────────────────────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": "The Mirror Virtual Platform - Core API",
        "status": "operational",
        "philosophy": "Reflection over engagement. Understanding over optimization."
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "mirrorx": "available"
    }


# API v1 router - versioned endpoints
from fastapi.routing import APIRouter

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_v1.include_router(reflections.router, prefix="/reflections", tags=["Reflections"])
api_v1.include_router(mirrorbacks.router, prefix="/mirrorbacks", tags=["Mirrorbacks"])
api_v1.include_router(feed.router, prefix="/feed", tags=["Feed"])
api_v1.include_router(signals.router, prefix="/signals", tags=["Signals"])
api_v1.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_v1.include_router(search.router, prefix="/search", tags=["Search"])
api_v1.include_router(threads.router, prefix="/threads", tags=["Threads"])
api_v1.include_router(identity.router, prefix="/identity", tags=["Identity"])
api_v1.include_router(governance.router, prefix="/governance", tags=["Governance"])
api_v1.include_router(finder.router, prefix="/finder", tags=["Mirror Finder"])

app.include_router(api_v1)

# Legacy routes (backward compatibility - will deprecate)
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles (Legacy)"])
app.include_router(reflections.router, prefix="/api/reflections", tags=["Reflections (Legacy)"])
app.include_router(mirrorbacks.router, prefix="/api/mirrorbacks", tags=["Mirrorbacks (Legacy)"])
app.include_router(feed.router, prefix="/api/feed", tags=["Feed (Legacy)"])
app.include_router(signals.router, prefix="/api/signals", tags=["Signals (Legacy)"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications (Legacy)"])
app.include_router(search.router, prefix="/api/search", tags=["Search (Legacy)"])
app.include_router(threads.router, prefix="/api/threads", tags=["Threads (Legacy)"])
app.include_router(identity.router, prefix="/api/identity", tags=["Identity (Legacy)"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
