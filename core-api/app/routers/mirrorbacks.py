"""
Mirrorbacks Router - AI-powered reflective responses
"""
from fastapi import APIRouter, HTTPException, Header, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
import httpx
import os

from app.models import Mirrorback, MirrorbackCreate
from app.db import execute_query, execute_one, execute_command
from app.routers.profiles import get_user_id_from_auth

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

MIRRORX_ENGINE_URL = os.getenv("MIRRORX_ENGINE_URL", "http://localhost:8100")


@router.post("/", response_model=Mirrorback)
@limiter.limit("10/minute")
async def create_mirrorback(
    request: Request,
    mirrorback_data: MirrorbackCreate,
    authorization: Optional[str] = Header(None)
):
    """
    Create a mirrorback for a reflection.
    This triggers the MirrorX AI engine to generate a reflective response.
    """
    user_id = get_user_id_from_auth(authorization)

    # Get the reflection
    reflection = await execute_one(
        """
        SELECT * FROM reflections
        WHERE id = $1 AND author_id = $2
        """,
        mirrorback_data.reflection_id, user_id
    )

    if not reflection:
        raise HTTPException(
            status_code=404,
            detail="Reflection not found or you don't have permission"
        )

    # Check if mirrorback already exists
    existing = await execute_one(
        "SELECT id FROM mirrorbacks WHERE reflection_id = $1",
        mirrorback_data.reflection_id
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Mirrorback already exists for this reflection"
        )

    # Call MirrorX engine to generate mirrorback
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{MIRRORX_ENGINE_URL}/mirrorback",
                json={
                    "reflection_id": mirrorback_data.reflection_id,
                    "reflection_body": reflection['body'],
                    "lens_key": reflection['lens_key'],
                    "identity_id": user_id
                }
            )
            response.raise_for_status()
            mirrorx_result = response.json()

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"MirrorX engine unavailable: {str(e)}"
        )

    # Save mirrorback to database
    mirrorback = await execute_one(
        """
        INSERT INTO mirrorbacks (reflection_id, author_id, body, tone, tensions, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        mirrorback_data.reflection_id,
        user_id,
        mirrorx_result.get('body', ''),
        mirrorx_result.get('tone'),
        mirrorx_result.get('tensions', []),
        mirrorx_result.get('metadata', {})
    )

    return dict(mirrorback)


@router.get("/reflection/{reflection_id}")
@limiter.limit("30/minute")
async def get_mirrorbacks_for_reflection(
    request: Request,
    reflection_id: int,
    authorization: Optional[str] = Header(None)
):
    """Get all mirrorbacks for a specific reflection."""
    user_id = None
    try:
        user_id = get_user_id_from_auth(authorization)
    except HTTPException:
        pass

    # Check if user can view this reflection
    reflection = await execute_one(
        """
        SELECT * FROM reflections
        WHERE id = $1
        AND (visibility = 'public' OR author_id = $2)
        """,
        reflection_id, user_id
    )

    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    # Get mirrorbacks
    mirrorbacks = await execute_query(
        """
        SELECT m.*, p.username, p.display_name, p.avatar_url
        FROM mirrorbacks m
        JOIN profiles p ON p.id = m.author_id
        WHERE m.reflection_id = $1
        ORDER BY m.created_at DESC
        """,
        reflection_id
    )

    return [dict(m) for m in mirrorbacks]


@router.get("/{mirrorback_id}", response_model=Mirrorback)
@limiter.limit("30/minute")
async def get_mirrorback(request: Request, mirrorback_id: int):
    """Get a specific mirrorback by ID."""
    mirrorback = await execute_one(
        "SELECT * FROM mirrorbacks WHERE id = $1",
        mirrorback_id
    )

    if not mirrorback:
        raise HTTPException(status_code=404, detail="Mirrorback not found")

    return dict(mirrorback)


@router.delete("/{mirrorback_id}")
@limiter.limit("5/minute")
async def delete_mirrorback(
    request: Request,
    mirrorback_id: int,
    authorization: Optional[str] = Header(None)
):
    """Delete a mirrorback (only author can delete)."""
    user_id = get_user_id_from_auth(authorization)

    result = await execute_command(
        "DELETE FROM mirrorbacks WHERE id = $1 AND author_id = $2",
        mirrorback_id, user_id
    )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Mirrorback not found or unauthorized")

    return {"success": True, "message": "Mirrorback deleted"}
