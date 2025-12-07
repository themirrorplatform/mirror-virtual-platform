"""
Reflections Router - Core content creation and retrieval
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, List
from pydantic import BaseModel
from app.models import Reflection, ReflectionCreate
from app.db import execute_query, execute_one, execute_command
from app.auth import require_auth, get_user_from_token

router = APIRouter()


class ReflectionUpdate(BaseModel):
    """Model for updating a reflection"""
    body: Optional[str] = None
    lens_key: Optional[str] = None
    visibility: Optional[str] = None
    metadata: Optional[dict] = None


@router.post("/", response_model=Reflection)
async def create_reflection(
    reflection_data: ReflectionCreate,
    user_id: str = Depends(require_auth)
):
    """Create a new reflection."""

    reflection = await execute_one(
        """
        INSERT INTO reflections (author_id, body, lens_key, visibility, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        user_id,
        reflection_data.body,
        reflection_data.lens_key,
        reflection_data.visibility.value,
        reflection_data.metadata
    )

    return dict(reflection)


@router.get("/{reflection_id}", response_model=Reflection)
async def get_reflection(
    reflection_id: int,
    authorization: Optional[str] = Header(None)
):
    """Get a specific reflection by ID."""
    user_id = get_user_from_token(authorization)

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

    return dict(reflection)


@router.get("/user/{username}")
async def get_user_reflections(
    username: str,
    limit: int = 20,
    offset: int = 0,
    authorization: Optional[str] = Header(None)
):
    """Get reflections by a specific user."""
    user_id = get_user_from_token(authorization)

    # Get target user
    target = await execute_one(
        "SELECT id FROM profiles WHERE username = $1",
        username
    )

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target_id = target['id']

    reflections = await execute_query(
        """
        SELECT r.*
        FROM reflections r
        WHERE r.author_id = $1
        AND (r.visibility = 'public' OR r.author_id = $2)
        ORDER BY r.created_at DESC
        LIMIT $3 OFFSET $4
        """,
        target_id, user_id, limit, offset
    )

    return [dict(r) for r in reflections]


@router.get("/lens/{lens_key}")
async def get_reflections_by_lens(
    lens_key: str,
    limit: int = 20,
    offset: int = 0
):
    """Get public reflections by lens (e.g., 'wealth', 'mind', 'belief')."""
    reflections = await execute_query(
        """
        SELECT r.*, p.username, p.display_name, p.avatar_url
        FROM reflections r
        JOIN profiles p ON p.id = r.author_id
        WHERE r.lens_key = $1
        AND r.visibility = 'public'
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
        """,
        lens_key, limit, offset
    )

    return [dict(r) for r in reflections]


@router.patch("/{reflection_id}", response_model=Reflection)
async def update_reflection(
    reflection_id: int,
    update_data: ReflectionUpdate,
    user_id: str = Depends(require_auth)
):
    """Update a reflection (only author can update)."""
    
    # Build update query dynamically
    updates = []
    values = []
    param_num = 1

    if update_data.body is not None:
        updates.append(f"body = ${param_num}")
        values.append(update_data.body)
        param_num += 1

    if update_data.lens_key is not None:
        updates.append(f"lens_key = ${param_num}")
        values.append(update_data.lens_key)
        param_num += 1

    if update_data.visibility is not None:
        updates.append(f"visibility = ${param_num}")
        values.append(update_data.visibility)
        param_num += 1
    
    if update_data.metadata is not None:
        updates.append(f"metadata = ${param_num}")
        values.append(update_data.metadata)
        param_num += 1

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    values.extend([reflection_id, user_id])

    query = f"""
        UPDATE reflections
        SET {', '.join(updates)}
        WHERE id = ${param_num} AND author_id = ${param_num + 1}
        RETURNING *
    """

    reflection = await execute_one(query, *values)

    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found or unauthorized")

    return dict(reflection)


@router.delete("/{reflection_id}")
async def delete_reflection(
    reflection_id: int,
    user_id: str = Depends(require_auth)
):
    """Delete a reflection (only author can delete)."""

    result = await execute_command(
        "DELETE FROM reflections WHERE id = $1 AND author_id = $2",
        reflection_id, user_id
    )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Reflection not found or unauthorized")

    return {"success": True, "message": "Reflection deleted"}
