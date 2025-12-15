"""
Identity Router - Identity graph and evolution tracking
Proxies requests to MirrorX Engine for identity intelligence
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional, List, Dict, Any
import httpx
import os
from app.auth import require_auth

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

MIRRORX_ENGINE_URL = os.getenv("MIRRORX_ENGINE_URL", "http://localhost:8100")


@router.get("/{user_id}/graph")
@limiter.limit("30/minute")
async def get_identity_graph(
    request: Request,
    user_id: str,
    current_user: str = Depends(require_auth)
):
    """
    Get identity graph nodes and edges.
    Returns nodes (beliefs, values, tensions) and connections between them.
    """
    # Only allow users to access their own identity graph
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Can only access your own identity graph")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{MIRRORX_ENGINE_URL}/api/mirrorx/identity/{user_id}"
            )
            response.raise_for_status()
            data = response.json()
        
        # Transform to frontend format
        return {
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", []),
            "tensions": data.get("tensions", []),
            "loops": data.get("loops", [])
        }
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"MirrorX Engine unavailable: {str(e)}"
        )


@router.get("/{user_id}/tensions")
@limiter.limit("30/minute")
async def get_tensions(
    request: Request,
    user_id: str,
    current_user: str = Depends(require_auth)
):
    """
    Get active tensions with strength indicators.
    Tensions are contradictions or conflicts in the user's identity.
    """
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Can only access your own tensions")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{MIRRORX_ENGINE_URL}/api/mirrorx/identity/{user_id}"
            )
            response.raise_for_status()
            data = response.json()
        
        # Extract and format tensions
        tensions = data.get("tensions", [])
        
        # Mock strength calculation if not provided
        formatted_tensions = []
        for idx, tension in enumerate(tensions):
            if isinstance(tension, str):
                formatted_tensions.append({
                    "id": f"tension-{idx}",
                    "label": tension,
                    "strength": 0.5 + (idx % 5) * 0.1  # Mock strength
                })
            elif isinstance(tension, dict):
                formatted_tensions.append({
                    "id": tension.get("id", f"tension-{idx}"),
                    "label": tension.get("label", tension.get("name", "Unknown")),
                    "strength": tension.get("strength", 0.5)
                })
        
        return formatted_tensions
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"MirrorX Engine unavailable: {str(e)}"
        )


@router.get("/{user_id}/loops")
@limiter.limit("30/minute")
async def get_loops(
    request: Request,
    user_id: str,
    current_user: str = Depends(require_auth)
):
    """
    Get recurring behavior loops detected in reflections.
    Loops are patterns that repeat without evolution.
    """
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Can only access your own loops")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{MIRRORX_ENGINE_URL}/api/mirrorx/identity/{user_id}"
            )
            response.raise_for_status()
            data = response.json()
        
        # Extract and format loops
        loops = data.get("loops", [])
        
        formatted_loops = []
        for idx, loop in enumerate(loops):
            if isinstance(loop, str):
                formatted_loops.append({
                    "id": f"loop-{idx}",
                    "pattern": loop,
                    "occurrences": 3 + (idx % 5)  # Mock occurrence count
                })
            elif isinstance(loop, dict):
                formatted_loops.append({
                    "id": loop.get("id", f"loop-{idx}"),
                    "pattern": loop.get("pattern", loop.get("name", "Unknown")),
                    "occurrences": loop.get("occurrences", loop.get("count", 1))
                })
        
        return formatted_loops
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"MirrorX Engine unavailable: {str(e)}"
        )


@router.get("/{user_id}/evolution")
@limiter.limit("30/minute")
async def get_evolution_timeline(
    request: Request,
    user_id: str,
    current_user: str = Depends(require_auth),
    limit: int = 20
):
    """
    Get evolution events timeline (growth, breakthroughs, regressions).
    Shows the user's identity evolution over time.
    """
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Can only access your own evolution")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{MIRRORX_ENGINE_URL}/api/mirrorx/evolution/{user_id}",
                params={"limit": limit}
            )
            response.raise_for_status()
            data = response.json()
        
        # Format evolution events for frontend
        events = data.get("events", [])
        
        formatted_events = []
        for event in events:
            formatted_events.append({
                "id": event.get("id", ""),
                "type": event.get("type", "growth"),
                "date": event.get("date", event.get("timestamp", "")),
                "description": event.get("description", event.get("summary", ""))
            })
        
        return formatted_events
    except httpx.HTTPError as e:
        # Return empty list if MirrorX Engine unavailable
        return []
