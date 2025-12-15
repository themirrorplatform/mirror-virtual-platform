"""
Statistics API Router

Endpoints for mirror statistics and evolution analysis.

Constitutional Compliance:
- I2: All statistics per-mirror only
- I13: No behavioral tracking or engagement metrics
- I14: No cross-identity aggregation
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ShapeStatsResponse(BaseModel):
    """Language shape statistics."""
    mirror_id: str
    total_reflections: int
    shape_frequencies: Dict[str, int]
    shape_percentages: Dict[str, float]
    period_days: int


class TensionStatsResponse(BaseModel):
    """Tension statistics."""
    mirror_id: str
    total_tensions: int
    tension_frequencies: Dict[str, int]
    average_tension_count: float
    period_days: int


class EvolutionResponse(BaseModel):
    """Evolution quality analysis."""
    mirror_id: str
    total_reflections: int
    constitutional_compliance: float
    l0_pass_rate: float
    average_shapes_per_reflection: float
    average_tensions_per_reflection: float
    period_days: int
    interpretation: str


@router.get("/statistics/shapes", response_model=ShapeStatsResponse)
@limiter.limit("30/minute")
async def get_shape_statistics(
    request: Request,
    days: int = 30
):
    """
    Get language shape frequency statistics.
    
    I2: Statistics for single mirror only.
    I13: Analytical only, not behavioral tracking.
    
    Args:
        days: Number of days to analyze (default 30)
        mirror_id: Mirror identity (from header)
        
    Returns:
        ShapeStatsResponse: Language shape statistics
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
        # Get recent reflections
        start_time = datetime.now() - timedelta(days=days)
        reflections = orchestrator.storage.get_reflections_by_mirror(
            mirror_id=mirror_id,
            start_time=start_time
        )
        
        # Count shapes
        shape_frequencies = {}
        for reflection in reflections:
            for shape in reflection.language_shapes:
                shape_frequencies[shape] = shape_frequencies.get(shape, 0) + 1
        
        # Calculate percentages
        total_shapes = sum(shape_frequencies.values())
        shape_percentages = {
            shape: (count / total_shapes * 100) if total_shapes > 0 else 0
            for shape, count in shape_frequencies.items()
        }
        
        return ShapeStatsResponse(
            mirror_id=mirror_id,
            total_reflections=len(reflections),
            shape_frequencies=shape_frequencies,
            shape_percentages=shape_percentages,
            period_days=days
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shape statistics: {str(e)}")


@router.get("/statistics/tensions", response_model=TensionStatsResponse)
@limiter.limit("30/minute")
async def get_tension_statistics(
    request: Request,
    days: int = 30
):
    """
    Get tension measurement statistics.
    
    I2: Statistics for single mirror only.
    I13: Analytical only, not behavioral tracking.
    
    Args:
        days: Number of days to analyze (default 30)
        mirror_id: Mirror identity (from header)
        
    Returns:
        TensionStatsResponse: Tension statistics
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
        # Get recent reflections
        start_time = datetime.now() - timedelta(days=days)
        reflections = orchestrator.storage.get_reflections_by_mirror(
            mirror_id=mirror_id,
            start_time=start_time
        )
        
        # Count tensions
        tension_frequencies = {}
        total_tension_count = 0
        
        for reflection in reflections:
            tension_count = len(reflection.tensions)
            total_tension_count += tension_count
            
            for tension in reflection.tensions:
                tension_type = tension.pattern_type
                tension_frequencies[tension_type] = tension_frequencies.get(tension_type, 0) + 1
        
        # Calculate average
        average = total_tension_count / len(reflections) if reflections else 0.0
        
        return TensionStatsResponse(
            mirror_id=mirror_id,
            total_tensions=total_tension_count,
            tension_frequencies=tension_frequencies,
            average_tension_count=average,
            period_days=days
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tension statistics: {str(e)}")


@router.get("/statistics/evolution", response_model=EvolutionResponse)
@limiter.limit("20/minute")
async def get_evolution_statistics(
    request: Request,
    days: int = 30
):
    """
    Get evolution quality analysis.
    
    I2: Analysis for single mirror only.
    I13: Constitutional compliance only, not engagement metrics.
    
    Args:
        days: Number of days to analyze (default 30)
        mirror_id: Mirror identity (from header)
        
    Returns:
        EvolutionResponse: Evolution quality metrics
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
        # Get recent reflections
        start_time = datetime.now() - timedelta(days=days)
        reflections = orchestrator.storage.get_reflections_by_mirror(
            mirror_id=mirror_id,
            start_time=start_time
        )
        
        if not reflections:
            return EvolutionResponse(
                mirror_id=mirror_id,
                total_reflections=0,
                constitutional_compliance=0.0,
                l0_pass_rate=0.0,
                average_shapes_per_reflection=0.0,
                average_tensions_per_reflection=0.0,
                period_days=days,
                interpretation="No reflections in period"
            )
        
        # Calculate metrics
        total = len(reflections)
        blocked = sum(1 for r in reflections if r.blocked)
        l0_pass_rate = ((total - blocked) / total * 100) if total > 0 else 0.0
        
        total_shapes = sum(len(r.language_shapes) for r in reflections)
        avg_shapes = total_shapes / total if total > 0 else 0.0
        
        total_tensions = sum(len(r.tensions) for r in reflections)
        avg_tensions = total_tensions / total if total > 0 else 0.0
        
        # Constitutional compliance (based on L0 pass rate)
        compliance = l0_pass_rate
        
        # Interpretation based on metrics
        if compliance >= 95:
            interpretation = "Excellent constitutional compliance. Reflections consistently non-prescriptive."
        elif compliance >= 80:
            interpretation = "Good constitutional compliance. Occasional violations detected."
        elif compliance >= 60:
            interpretation = "Moderate constitutional compliance. Consider reviewing reflection patterns."
        else:
            interpretation = "Low constitutional compliance. Significant violations detected."
        
        return EvolutionResponse(
            mirror_id=mirror_id,
            total_reflections=total,
            constitutional_compliance=compliance,
            l0_pass_rate=l0_pass_rate,
            average_shapes_per_reflection=avg_shapes,
            average_tensions_per_reflection=avg_tensions,
            period_days=days,
            interpretation=interpretation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get evolution statistics: {str(e)}")


@router.get("/statistics/graph", response_model=Dict)
@limiter.limit("30/minute")
async def get_graph_statistics(
    request: Request
):
    """
    Get identity graph statistics.
    
    I2: Statistics for single mirror only.
    I14: No cross-identity metrics.
    
    Args:
        mirror_id: Mirror identity (from header)
        
    Returns:
        Graph statistics dictionary
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
        # Get graph stats
        stats = orchestrator.graph_manager.get_statistics(mirror_id)
        
        return {
            "mirror_id": mirror_id,
            "node_count": stats.get("node_count", 0),
            "edge_count": stats.get("edge_count", 0),
            "theme_count": len(orchestrator.graph_manager.themes),
            "node_types": stats.get("node_types", {}),
            "edge_types": stats.get("edge_types", {}),
            "average_degree": stats.get("average_degree", 0.0)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get graph statistics: {str(e)}")
