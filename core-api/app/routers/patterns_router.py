"""
Core API - Patterns Router

REST endpoints for pattern detection, listing, and evolution tracking.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from typing import Optional, List
import sys
import os

# Add project paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirrorx_engine.app.engine import MirrorXEngine

router = APIRouter(prefix="/api/patterns", tags=["patterns"])
limiter = Limiter(key_func=get_remote_address)

# Global storage and engine instances
storage = None
engine = None


def get_storage():
    """Get or create storage instance"""
    global storage
    if storage is None:
        storage = SQLiteStorage(
            "mirror.db",
            schema_path="mirror_os/schemas/sqlite/001_core.sql"
        )
    return storage


def get_engine():
    """Get or create engine instance"""
    global engine
    if engine is None:
        from examples.mirror_complete_example import MockLLM
        llm = MockLLM()
        engine = MirrorXEngine(
            storage=get_storage(),
            llm=llm,
            config={"version": "1.0.0"}
        )
    return engine


@router.get("/identity/{identity_id}", response_model=dict)
@limiter.limit("30/minute")
async def list_patterns(
    request: Request,
    identity_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    min_confidence: float = Query(default=0.5, ge=0.0, le=1.0)
):
    """
    List patterns detected for an identity
    
    - **identity_id**: Identity UUID
    - **limit**: Max results (1-100)
    - **min_confidence**: Minimum confidence threshold (0.0-1.0)
    
    Returns list of patterns with occurrence counts
    """
    try:
        db = get_storage()
        
        # Check if identity exists
        identity = db.get_identity(identity_id)
        if not identity:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        # Get patterns
        patterns = db.get_patterns_for_identity(identity_id, limit=limit)
        
        # Filter by confidence
        filtered_patterns = [
            p for p in patterns 
            if p.get("confidence", 0) >= min_confidence
        ]
        
        return {
            "identity_id": identity_id,
            "patterns": filtered_patterns,
            "count": len(filtered_patterns),
            "total_count": len(patterns)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pattern_id}", response_model=dict)
@limiter.limit("30/minute")
async def get_pattern_detail(request: Request, pattern_id: str):
    """
    Get detailed information about a pattern
    
    - **pattern_id**: Pattern UUID
    
    Returns pattern with all occurrences and evolution data
    """
    try:
        db = get_storage()
        
        pattern = db.get_pattern(pattern_id)
        if not pattern:
            raise HTTPException(status_code=404, detail="Pattern not found")
        
        # Get occurrences
        occurrences = db.get_pattern_occurrences(pattern_id)
        
        return {
            "pattern": pattern,
            "occurrences": occurrences,
            "occurrence_count": len(occurrences)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{identity_id}", response_model=dict)
@limiter.limit("10/minute")
async def analyze_patterns(request: Request, identity_id: str):
    """
    Run pattern analysis for an identity
    
    - **identity_id**: Identity UUID
    
    Detects new patterns and updates existing ones.
    Returns comprehensive pattern analysis report.
    """
    try:
        db = get_storage()
        eng = get_engine()
        
        # Check if identity exists
        identity = db.get_identity(identity_id)
        if not identity:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        # Run pattern analysis
        result = eng.analyze_patterns(identity_id=identity_id)
        
        if result["status"] != "success":
            raise HTTPException(
                status_code=500,
                detail=f"Pattern analysis failed: {result.get('error', 'Unknown error')}"
            )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pattern_id}/evolution", response_model=dict)
@limiter.limit("30/minute")
async def get_pattern_evolution(request: Request, pattern_id: str):
    """
    Get pattern evolution over time
    
    - **pattern_id**: Pattern UUID
    
    Returns timeline of pattern occurrences showing frequency trends
    """
    try:
        db = get_storage()
        
        pattern = db.get_pattern(pattern_id)
        if not pattern:
            raise HTTPException(status_code=404, detail="Pattern not found")
        
        occurrences = db.get_pattern_occurrences(pattern_id)
        
        # Group by time periods (simplified - would be more sophisticated in production)
        from collections import defaultdict
        from datetime import datetime
        
        by_month = defaultdict(int)
        for occ in occurrences:
            detected_at = occ.get("detected_at", "")
            if detected_at:
                try:
                    dt = datetime.fromisoformat(detected_at.replace('Z', '+00:00'))
                    month_key = dt.strftime("%Y-%m")
                    by_month[month_key] += 1
                except:
                    pass
        
        evolution_data = [
            {"period": month, "count": count}
            for month, count in sorted(by_month.items())
        ]
        
        # Calculate trend
        if len(evolution_data) >= 2:
            first_count = evolution_data[0]["count"]
            last_count = evolution_data[-1]["count"]
            if last_count > first_count:
                trend = "increasing"
            elif last_count < first_count:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "pattern_id": pattern_id,
            "pattern_name": pattern["name"],
            "evolution": evolution_data,
            "trend": trend,
            "total_occurrences": len(occurrences)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
