"""
Threads Router - Conversation thread management
Groups reflections into thematic conversations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.db import execute_query, execute_one, execute_command
from app.auth import require_auth

router = APIRouter()


class ThreadCreate(BaseModel):
    """Model for creating a thread"""
    title: str
    tone: Optional[str] = "soft"


class ThreadUpdate(BaseModel):
    """Model for updating a thread"""
    title: Optional[str] = None
    tone: Optional[str] = None


class Thread(BaseModel):
    """Thread response model"""
    id: str
    user_id: str
    title: str
    tone: Optional[str]
    reflection_count: int
    last_activity: str
    created_at: str


@router.post("/", response_model=Thread)
async def create_thread(
    thread_data: ThreadCreate,
    user_id: str = Depends(require_auth)
):
    """Create a new reflection thread."""
    thread = await execute_one(
        """
        INSERT INTO threads (user_id, title, tone)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, title, tone, 
                  0 as reflection_count,
                  created_at as last_activity,
                  created_at
        """,
        user_id,
        thread_data.title,
        thread_data.tone
    )
    
    if not thread:
        raise HTTPException(status_code=500, detail="Failed to create thread")
    
    return Thread(**dict(thread))


@router.get("/", response_model=List[Thread])
async def list_threads(
    user_id: str = Depends(require_auth),
    limit: int = 50,
    offset: int = 0
):
    """List user's threads with reflection counts."""
    threads = await execute_query(
        """
        SELECT 
            t.id,
            t.user_id,
            t.title,
            t.tone,
            COUNT(r.id) as reflection_count,
            COALESCE(MAX(r.created_at), t.created_at) as last_activity,
            t.created_at
        FROM threads t
        LEFT JOIN reflections r ON r.metadata->>'thread_id' = t.id::text
        WHERE t.user_id = $1
        GROUP BY t.id, t.user_id, t.title, t.tone, t.created_at
        ORDER BY last_activity DESC
        LIMIT $2 OFFSET $3
        """,
        user_id, limit, offset
    )
    
    return [Thread(**dict(t)) for t in threads]


@router.get("/{thread_id}", response_model=Thread)
async def get_thread(
    thread_id: str,
    user_id: str = Depends(require_auth)
):
    """Get a specific thread with its reflection count."""
    thread = await execute_one(
        """
        SELECT 
            t.id,
            t.user_id,
            t.title,
            t.tone,
            COUNT(r.id) as reflection_count,
            COALESCE(MAX(r.created_at), t.created_at) as last_activity,
            t.created_at
        FROM threads t
        LEFT JOIN reflections r ON r.metadata->>'thread_id' = t.id::text
        WHERE t.id = $1 AND t.user_id = $2
        GROUP BY t.id, t.user_id, t.title, t.tone, t.created_at
        """,
        thread_id, user_id
    )
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    return Thread(**dict(thread))


@router.get("/{thread_id}/reflections")
async def get_thread_reflections(
    thread_id: str,
    user_id: str = Depends(require_auth),
    limit: int = 50,
    offset: int = 0
):
    """Get reflections in a thread with their mirrorbacks."""
    # Verify thread ownership
    thread = await execute_one(
        "SELECT id FROM threads WHERE id = $1 AND user_id = $2",
        thread_id, user_id
    )
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    reflections = await execute_query(
        """
        SELECT 
            r.*,
            m.body as mirrorback_body,
            m.tone as mirrorback_tone,
            m.metadata as mirrorback_metadata
        FROM reflections r
        LEFT JOIN mirrorbacks m ON m.reflection_id = r.id
        WHERE r.author_id = $1 
          AND r.metadata->>'thread_id' = $2
        ORDER BY r.created_at ASC
        LIMIT $3 OFFSET $4
        """,
        user_id, thread_id, limit, offset
    )
    
    return [dict(r) for r in reflections]


@router.patch("/{thread_id}", response_model=Thread)
async def update_thread(
    thread_id: str,
    thread_data: ThreadUpdate,
    user_id: str = Depends(require_auth)
):
    """Update thread metadata."""
    # Build dynamic update query
    updates = []
    values = []
    param_count = 1
    
    if thread_data.title is not None:
        updates.append(f"title = ${param_count}")
        values.append(thread_data.title)
        param_count += 1
    
    if thread_data.tone is not None:
        updates.append(f"tone = ${param_count}")
        values.append(thread_data.tone)
        param_count += 1
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    values.extend([thread_id, user_id])
    
    query = f"""
        UPDATE threads
        SET {', '.join(updates)}
        WHERE id = ${param_count} AND user_id = ${param_count + 1}
        RETURNING id, user_id, title, tone, created_at
    """
    
    thread = await execute_one(query, *values)
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Get reflection count
    count_result = await execute_one(
        "SELECT COUNT(*) as count FROM reflections WHERE metadata->>'thread_id' = $1",
        thread_id
    )
    
    return Thread(
        **dict(thread),
        reflection_count=count_result['count'] if count_result else 0,
        last_activity=thread['created_at']
    )


@router.delete("/{thread_id}")
async def delete_thread(
    thread_id: str,
    user_id: str = Depends(require_auth)
):
    """Delete a thread (reflections remain but are unlinked)."""
    result = await execute_command(
        "DELETE FROM threads WHERE id = $1 AND user_id = $2",
        thread_id, user_id
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    return {"success": True, "message": "Thread deleted"}
