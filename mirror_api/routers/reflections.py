"""
Reflections API Router

Endpoints for reflection generation using MirrorCore orchestrator.

Constitutional Compliance:
- I2: All operations require mirror_id
- I9: No diagnostic language
- I13: No behavioral metrics
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from slowapi import Limiter
from slowapi.util import get_remote_address

from mirror_os.core import MirrorOrchestrator, GenerationStatus

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ReflectionRequest(BaseModel):
    """Request to generate reflection."""
    text: str = Field(..., min_length=1, max_length=5000, description="Reflection text")
    context: Optional[str] = Field(None, max_length=1000, description="Additional context")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I'm feeling uncertain about the path forward",
                "context": "Considering a career change"
            }
        }


class ReflectionResponse(BaseModel):
    """Reflection generation response."""
    reflection_id: str
    mirrorback: Optional[str]
    status: str
    detected_shapes: List[str]
    tension_count: int
    blocked: bool
    blocked_reason: Optional[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "reflection_id": "refl_123456",
                "mirrorback": "I hear the uncertainty you're holding...",
                "status": "success",
                "detected_shapes": ["uncertainty", "questioning"],
                "tension_count": 2,
                "blocked": False,
                "blocked_reason": None
            }
        }


@router.post("/reflect", response_model=ReflectionResponse)
@limiter.limit("10/minute")  # Rate limit to prevent abuse
async def generate_reflection(
    request: Request,
    reflection: ReflectionRequest
):
    """
    Generate mirrorback reflection.
    
    I2: Requires mirror_id in X-Mirror-Id header.
    I9: Non-diagnostic responses only.
    I13: No behavioral tracking.
    
    Args:
        reflection: Reflection text and optional context
        mirror_id: Mirror identity (from header)
        orchestrator: MirrorOrchestrator instance
        
    Returns:
        ReflectionResponse: Generated mirrorback and metadata
        
    Raises:
        HTTPException: If generation fails or blocked
    """
    # Get mirror_id from header
    mirror_id = request.headers.get("X-Mirror-Id")
    if not mirror_id:
        raise HTTPException(
            status_code=400,
            detail="I2: mirror_id required in X-Mirror-Id header"
        )
    
    # Get orchestrator from app state
    orchestrator = request.app.state.orchestrator
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not available")
    
    try:
        # Generate with orchestrator
        result = orchestrator.generate_with_context(
            reflection_text=reflection.text,
            mirror_id=mirror_id,
            additional_context=reflection.context,
            max_retries=3
        )
        
        # Build response
        return ReflectionResponse(
            reflection_id=result.reflection_id,
            mirrorback=result.mirrorback_text,
            status=result.status.value,
            detected_shapes=[s.shape_name for s in result.detected_shapes],
            tension_count=len(result.tension_measurements),
            blocked=result.blocked,
            blocked_reason=result.blocked_reason
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/reflections/recent", response_model=List[dict])
@limiter.limit("20/minute")
async def get_recent_reflections(
    request: Request,
    limit: int = 10
):
    """
    Get recent reflections for mirror.
    
    I2: Only returns reflections for specified mirror_id.
    I14: Never aggregates across identities.
    
    Args:
        limit: Maximum number of reflections to return
        mirror_id: Mirror identity (from header)
        
    Returns:
        List of recent reflection summaries
    """
    from datetime import datetime, timedelta
    
    # Get mirror_id from header
    mirror_id = request.headers.get("X-Mirror-Id")
    if not mirror_id:
        raise HTTPException(
            status_code=400,
            detail="I2: mirror_id required"
        )
    
    # Get orchestrator from app state
    orchestrator = request.app.state.orchestrator
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not available")
    
    try:
        # Get recent reflections (last 30 days)
        start_time = datetime.now() - timedelta(days=30)
        reflections = orchestrator.storage.get_reflections_by_mirror(
            mirror_id=mirror_id,
            start_time=start_time
        )
        
        # Sort by timestamp descending and limit
        reflections.sort(key=lambda r: r.timestamp, reverse=True)
        reflections = reflections[:limit]
        
        # Convert to response format
        return [
            {
                "reflection_id": r.reflection_id,
                "mirrorback": r.mirrorback_text,
                "timestamp": r.timestamp.isoformat(),
                "detected_shapes": r.language_shapes,
                "tension_count": len(r.tensions),
                "blocked": r.blocked
            }
            for r in reflections
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reflections: {str(e)}")


@router.get("/reflections/{reflection_id}", response_model=dict)
@limiter.limit("30/minute")
async def get_reflection(
    request: Request,
    reflection_id: str
):
    """
    Get specific reflection by ID.
    
    I2: Only returns if reflection belongs to mirror_id.
    
    Args:
        reflection_id: Reflection identifier
        mirror_id: Mirror identity (from header)
        
    Returns:
        Reflection details
        
    Raises:
        HTTPException: If not found or access denied
    """
    # Get mirror_id from header
    mirror_id = request.headers.get("X-Mirror-Id")
    if not mirror_id:
        raise HTTPException(
            status_code=400,
            detail="I2: mirror_id required"
        )
    
    # Get orchestrator from app state
    orchestrator = request.app.state.orchestrator
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not available")
    
    try:
        # Get reflection from storage
        reflection = orchestrator.storage.get_reflection(reflection_id)
        
        # I2: Verify reflection belongs to this mirror
        if not reflection or reflection.mirror_id != mirror_id:
            raise HTTPException(
                status_code=404,
                detail="Reflection not found or access denied"
            )
        
        # Return full reflection details
        return {
            "reflection_id": reflection.reflection_id,
            "mirror_id": reflection.mirror_id,
            "reflection_text": reflection.reflection_text,
            "mirrorback": reflection.mirrorback_text,
            "timestamp": reflection.timestamp.isoformat(),
            "detected_shapes": reflection.language_shapes,
            "tensions": [
                {
                    "pattern_type": t.pattern_type,
                    "magnitude": t.magnitude,
                    "holding_quality": t.holding_quality
                }
                for t in reflection.tensions
            ],
            "blocked": reflection.blocked,
            "blocked_reason": reflection.blocked_reason
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reflection: {str(e)}")
