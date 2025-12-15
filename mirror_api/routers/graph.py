"""
Identity Graph API Router

Endpoints for identity graph operations.

Constitutional Compliance:
- I2: All operations per-mirror only
- I14: No cross-identity aggregation
- I9: Themes are descriptive, not diagnostic
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from mirror_os.core import GraphManager

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class GraphStatsResponse(BaseModel):
    """Graph statistics response."""
    mirror_id: str
    node_count: int
    edge_count: int
    theme_count: int
    node_types: dict
    edge_types: dict
    average_degree: float


class ThemeResponse(BaseModel):
    """Theme response."""
    theme_id: str
    label: str
    description: str
    confidence: float
    node_count: int
    disclaimer: str


@router.get("/graph/stats", response_model=GraphStatsResponse)
@limiter.limit("30/minute")
async def get_graph_statistics(
    request: Request
):
    """
    Get identity graph statistics.
    
    I2: Statistics scoped to single mirror only.
    I14: Never aggregates across identities.
    
    Args:
        mirror_id: Mirror identity (from header)
        
    Returns:
        GraphStatsResponse: Graph statistics for mirror
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
        # Get stats from graph manager
        stats = orchestrator.graph_manager.get_statistics(mirror_id)
        
        return GraphStatsResponse(
            mirror_id=stats.get("mirror_id", mirror_id),
            node_count=stats.get("node_count", 0),
            edge_count=stats.get("edge_count", 0),
            theme_count=len(orchestrator.graph_manager.themes),
            node_types=stats.get("node_types", {}),
            edge_types=stats.get("edge_types", {}),
            average_degree=stats.get("average_degree", 0.0)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/graph/themes", response_model=List[ThemeResponse])
@limiter.limit("20/minute")
async def get_themes(
    request: Request,
    min_confidence: float = 0.5
):
    """
    Get detected themes for mirror.
    
    I2: Themes scoped to single mirror only.
    I9: Themes are descriptive, not diagnostic.
    
    Args:
        min_confidence: Minimum confidence threshold
        mirror_id: Mirror identity (from header)
        
    Returns:
        List[ThemeResponse]: Detected themes
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
        # Detect themes
        themes = orchestrator.graph_manager.detect_themes(
            mirror_id=mirror_id,
            min_nodes=3,
            min_confidence=min_confidence
        )
        
        # Convert to response format
        return [
            ThemeResponse(
                theme_id=theme.theme_id,
                label=theme.label,
                description=theme.description,
                confidence=theme.confidence,
                node_count=len(theme.node_ids),
                disclaimer=theme.disclaimer
            )
            for theme in themes
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect themes: {str(e)}")


@router.get("/graph/central-nodes", response_model=List[dict])
@limiter.limit("20/minute")
async def get_central_nodes(
    request: Request,
    top_k: int = 5
):
    """
    Get most central nodes in identity graph.
    
    I2: Centrality calculated per-mirror only.
    
    Args:
        top_k: Number of top nodes to return
        mirror_id: Mirror identity (from header)
        
    Returns:
        List of central nodes with scores
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
        # Get central nodes
        central = orchestrator.graph_manager.get_central_nodes(
            mirror_id=mirror_id,
            top_k=top_k
        )
        
        # Convert to response format
        return [
            {
                "node_id": node_id,
                "centrality_score": score
            }
            for node_id, score in central
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get central nodes: {str(e)}")


@router.delete("/graph", status_code=204)
@limiter.limit("5/hour")  # Stricter limit for destructive operations
async def clear_graph(
    request: Request
):
    """
    Clear all graph data for mirror.
    
    I1: Data sovereignty - user can delete their data.
    I2: Only clears specified mirror's data.
    
    Args:
        mirror_id: Mirror identity (from header)
        
    Returns:
        204 No Content on success
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
        # Clear graph data
        removed = orchestrator.graph_manager.clear_mirror_data(mirror_id)
        
        # Log for auditability (I7)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Cleared {removed} nodes for mirror {mirror_id}")
        
        return None  # 204 response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear graph: {str(e)}")
