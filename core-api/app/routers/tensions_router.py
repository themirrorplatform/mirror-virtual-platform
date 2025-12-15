"""
Core API - Tensions Router

REST endpoints for tension tracking, analysis, and evolution.
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

router = APIRouter(prefix="/api/tensions", tags=["tensions"])
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
async def list_tensions(
    request: Request,
    identity_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    min_intensity: float = Query(default=0.3, ge=0.0, le=1.0)
):
    """
    List tensions detected for an identity
    
    - **identity_id**: Identity UUID
    - **limit**: Max results (1-100)
    - **min_intensity**: Minimum intensity threshold (0.0-1.0)
    
    Returns list of unique tensions with average position/intensity
    """
    try:
        db = get_storage()
        
        # Check if identity exists
        identity = db.get_identity(identity_id)
        if not identity:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        # Get tensions
        tensions = db.get_tensions_for_identity(identity_id, limit=limit)
        
        # Group by tension name and calculate averages
        from collections import defaultdict
        
        tensions_grouped = defaultdict(list)
        for tension in tensions:
            name = tension["name"]
            tensions_grouped[name].append(tension)
        
        # Calculate aggregates
        tensions_summary = []
        for name, instances in tensions_grouped.items():
            avg_position = sum(t["position"] for t in instances) / len(instances)
            avg_intensity = sum(t.get("intensity", 0.5) for t in instances) / len(instances)
            
            if avg_intensity >= min_intensity:
                tensions_summary.append({
                    "name": name,
                    "axis_a": instances[0]["axis_a"],
                    "axis_b": instances[0]["axis_b"],
                    "average_position": round(avg_position, 2),
                    "average_intensity": round(avg_intensity, 2),
                    "occurrence_count": len(instances),
                    "first_detected": instances[-1]["detected_at"],
                    "last_detected": instances[0]["detected_at"]
                })
        
        # Sort by intensity descending
        tensions_summary.sort(key=lambda t: t["average_intensity"], reverse=True)
        
        return {
            "identity_id": identity_id,
            "tensions": tensions_summary,
            "unique_tensions": len(tensions_summary),
            "total_detections": len(tensions)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tension/{tension_name}", response_model=dict)
@limiter.limit("30/minute")
async def get_tension_detail(
    request: Request,
    tension_name: str,
    identity_id: str = Query(..., description="Identity UUID")
):
    """
    Get detailed information about a specific tension
    
    - **tension_name**: Name of the tension (e.g., "Control vs Surrender")
    - **identity_id**: Identity UUID
    
    Returns all instances of this tension with evolution data
    """
    try:
        db = get_storage()
        
        # Get all instances of this tension for the identity
        all_tensions = db.get_tensions_for_identity(identity_id, limit=1000)
        tension_instances = [t for t in all_tensions if t["name"] == tension_name]
        
        if not tension_instances:
            raise HTTPException(status_code=404, detail="Tension not found")
        
        # Calculate evolution (position over time)
        evolution_data = []
        for instance in reversed(tension_instances):  # Chronological order
            evolution_data.append({
                "detected_at": instance["detected_at"],
                "position": instance["position"],
                "intensity": instance.get("intensity", 0.5),
                "reflection_id": instance["reflection_id"]
            })
        
        # Calculate trend
        if len(evolution_data) >= 2:
            first_pos = evolution_data[0]["position"]
            last_pos = evolution_data[-1]["position"]
            
            first_tension = tension_instances[-1]
            axis_a = first_tension["axis_a"]
            axis_b = first_tension["axis_b"]
            
            if abs(last_pos - first_pos) < 0.1:
                trend = "stable"
            elif last_pos > first_pos:
                trend = f"moving toward {axis_b}"
            else:
                trend = f"moving toward {axis_a}"
        else:
            trend = "insufficient_data"
        
        return {
            "tension_name": tension_name,
            "axis_a": tension_instances[0]["axis_a"],
            "axis_b": tension_instances[0]["axis_b"],
            "instances": tension_instances,
            "evolution": evolution_data,
            "trend": trend,
            "occurrence_count": len(tension_instances)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{identity_id}", response_model=dict)
@limiter.limit("10/minute")
async def analyze_tensions(request: Request, identity_id: str):
    """
    Run tension analysis for an identity
    
    - **identity_id**: Identity UUID
    
    Analyzes all tensions, calculates trends, provides insights.
    Returns comprehensive tension report.
    """
    try:
        db = get_storage()
        eng = get_engine()
        
        # Check if identity exists
        identity = db.get_identity(identity_id)
        if not identity:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        # Run tension analysis
        result = eng.analyze_tensions(identity_id=identity_id)
        
        if result["status"] != "success":
            raise HTTPException(
                status_code=500,
                detail=f"Tension analysis failed: {result.get('error', 'Unknown error')}"
            )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mapping/{identity_id}", response_model=dict)
@limiter.limit("30/minute")
async def get_tension_mapping(request: Request, identity_id: str):
    """
    Get 2D tension mapping for visualization
    
    - **identity_id**: Identity UUID
    
    Returns tension positions for plotting on 2D chart.
    Each tension is a point with position (-1 to +1) and intensity (0 to 1).
    """
    try:
        db = get_storage()
        
        # Check if identity exists
        identity = db.get_identity(identity_id)
        if not identity:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        # Get all tensions
        tensions = db.get_tensions_for_identity(identity_id, limit=1000)
        
        # Group by tension name
        from collections import defaultdict
        tensions_grouped = defaultdict(list)
        for tension in tensions:
            tensions_grouped[tension["name"]].append(tension)
        
        # Calculate average position and intensity for each tension
        mapping_data = []
        for name, instances in tensions_grouped.items():
            avg_position = sum(t["position"] for t in instances) / len(instances)
            avg_intensity = sum(t.get("intensity", 0.5) for t in instances) / len(instances)
            
            mapping_data.append({
                "name": name,
                "axis_a": instances[0]["axis_a"],
                "axis_b": instances[0]["axis_b"],
                "position": round(avg_position, 2),
                "intensity": round(avg_intensity, 2),
                "occurrences": len(instances)
            })
        
        return {
            "identity_id": identity_id,
            "tensions": mapping_data,
            "count": len(mapping_data)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seed-tensions", response_model=dict)
@limiter.limit("60/minute")
async def get_seed_tensions(request: Request):
    """
    Get the 5 seed tensions
    
    Returns the archetypal tensions used as starting points for detection.
    """
    seed_tensions = [
        {
            "name": "Control vs Surrender",
            "axis_a": "Control",
            "axis_b": "Surrender",
            "description": "Tension between directing outcomes and trusting the process"
        },
        {
            "name": "Certainty vs Openness",
            "axis_a": "Certainty",
            "axis_b": "Openness",
            "description": "Tension between seeking answers and embracing questions"
        },
        {
            "name": "Individual vs Collective",
            "axis_a": "Individual",
            "axis_b": "Collective",
            "description": "Tension between personal autonomy and group belonging"
        },
        {
            "name": "Being vs Doing",
            "axis_a": "Being",
            "axis_b": "Doing",
            "description": "Tension between presence and productivity"
        },
        {
            "name": "Logic vs Intuition",
            "axis_a": "Logic",
            "axis_b": "Intuition",
            "description": "Tension between rational analysis and felt sense"
        }
    ]
    
    return {
        "seed_tensions": seed_tensions,
        "count": len(seed_tensions)
    }
