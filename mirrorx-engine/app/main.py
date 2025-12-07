"""
MirrorX Engine - FastAPI Application
The AI brain of The Mirror Virtual Platform.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import asyncpg

from app.orchestrator import MirrorCoreOrchestrator
from app.mirrorback_generator import MirrorbackGenerator

# Database pool
db_pool: Optional[asyncpg.Pool] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    global db_pool

    print("🧠 MirrorX Engine Starting...")

    # Initialize database connection
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        db_pool = await asyncpg.create_pool(
            database_url,
            min_size=2,
            max_size=10
        )
        print("✓ Database connected")
    else:
        print("⚠️  No DATABASE_URL - running without DB connection")

    print("✓ MirrorX Engine ready")

    yield

    # Shutdown
    print("🧠 MirrorX Engine shutting down...")
    if db_pool:
        await db_pool.close()
    print("✓ Shutdown complete")


# Initialize FastAPI
app = FastAPI(
    title="MirrorX Engine",
    description="The AI brain of The Mirror Virtual Platform - reflective intelligence, not manipulative optimization.",
    version="1.0.0",
    lifespan=lifespan
)


# ════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ════════════════════════════════════════════════════════════════════════════

class MirrorbackRequest(BaseModel):
    reflection_id: int
    reflection_body: str
    lens_key: Optional[str] = None
    identity_id: str


class MirrorbackResponse(BaseModel):
    body: str
    tone: str
    tensions: List[str]
    metadata: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    mirrorcore: str
    database: str
    ai_providers: Dict[str, bool]


# ════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "MirrorX Engine",
        "version": "1.0.0",
        "philosophy": "Reflection over reaction. Safety over virality. Understanding over optimization."
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return {
        "status": "operational",
        "mirrorcore": "active",
        "database": "connected" if db_pool else "disconnected",
        "ai_providers": {
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "google": bool(os.getenv("GOOGLE_API_KEY"))
        }
    }


@app.post("/mirrorback", response_model=MirrorbackResponse)
async def generate_mirrorback(request: MirrorbackRequest):
    """
    Generate a mirrorback for a reflection.

    This endpoint runs the full MirrorCore pipeline:
    1. Safety checks
    2. Tone & tension analysis
    3. Bias detection
    4. Regression detection
    5. Mirrorback generation
    """
    # Initialize orchestrator with DB pool
    orchestrator = MirrorCoreOrchestrator(db_pool=db_pool)

    # Build reflection dict
    reflection = {
        "id": request.reflection_id,
        "body": request.reflection_body,
        "lens_key": request.lens_key
    }

    # Process through MirrorCore pipeline
    try:
        pipeline_result = await orchestrator.process_reflection(
            reflection,
            request.identity_id
        )

        # Check if safety blocked
        if pipeline_result['type'] == 'safety':
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "safety_check_failed",
                    "message": pipeline_result['body']
                }
            )

        # Generate mirrorback
        generator = MirrorbackGenerator()
        mirrorback = await generator.generate(
            reflection,
            pipeline_result['tone'],
            pipeline_result['tensions'],
            pipeline_result['bias_info'],
            pipeline_result['regression']
        )

        return mirrorback

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating mirrorback: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.post("/analyze")
async def analyze_reflection(request: MirrorbackRequest):
    """
    Analyze a reflection without generating a mirrorback.
    Returns tone, tensions, bias insights, and regression markers.
    """
    orchestrator = MirrorCoreOrchestrator(db_pool=db_pool)

    reflection = {
        "id": request.reflection_id,
        "body": request.reflection_body,
        "lens_key": request.lens_key
    }

    try:
        result = await orchestrator.process_reflection(
            reflection,
            request.identity_id
        )

        return {
            "tone": result.get('tone'),
            "tensions": result.get('tensions', []),
            "bias_insights": result.get('bias_info', []),
            "regression_markers": result.get('regression', []),
            "metadata": result.get('metadata', {})
        }

    except Exception as e:
        print(f"❌ Error analyzing reflection: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8100)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
