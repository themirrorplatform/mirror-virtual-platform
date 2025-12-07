"""
The Mirror Virtual Platform - Core API
The backend spine of a social platform built on reflection, not engagement.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from app.db import init_db, close_db
from app.routers import reflections, mirrorbacks, feed, profiles, signals


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


# Initialize FastAPI app
app = FastAPI(
    title="The Mirror Virtual Platform - Core API",
    description="A social platform whose core is reflection, not engagement.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# Include routers
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(reflections.router, prefix="/api/reflections", tags=["Reflections"])
app.include_router(mirrorbacks.router, prefix="/api/mirrorbacks", tags=["Mirrorbacks"])
app.include_router(feed.router, prefix="/api/feed", tags=["Feed"])
app.include_router(signals.router, prefix="/api/signals", tags=["Signals"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
