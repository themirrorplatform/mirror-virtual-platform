"""
Notifications Router - User notifications for follows, mirrorbacks, etc.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.db import execute_query, execute_one, execute_command
from app.auth import require_auth

router = APIRouter()


class Notification(BaseModel):
    """Notification model"""
    id: int
    recipient_id: str
    actor_id: Optional[str]
    type: str
    reflection_id: Optional[int]
    mirrorback_id: Optional[int]
    is_read: bool
    metadata: dict
    created_at: str
    # Joined data
    actor_username: Optional[str] = None
    actor_display_name: Optional[str] = None
    actor_avatar_url: Optional[str] = None


@router.get("/", response_model=List[Notification])
async def get_notifications(
    user_id: str = Depends(require_auth),
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False
):
    """Get user's notifications."""
    
    where_clause = "WHERE n.recipient_id = $1"
    if unread_only:
        where_clause += " AND n.is_read = false"
    
    notifications = await execute_query(
        f"""
        SELECT 
            n.*,
            p.username as actor_username,
            p.display_name as actor_display_name,
            p.avatar_url as actor_avatar_url
        FROM notifications n
        LEFT JOIN profiles p ON p.id = n.actor_id
        {where_clause}
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id, limit, offset
    )
    
    return [dict(n) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(user_id: str = Depends(require_auth)):
    """Get count of unread notifications."""
    
    result = await execute_one(
        """
        SELECT COUNT(*) as count
        FROM notifications
        WHERE recipient_id = $1 AND is_read = false
        """,
        user_id
    )
    
    return {"count": result['count'] if result else 0}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user_id: str = Depends(require_auth)
):
    """Mark a notification as read."""
    
    result = await execute_one(
        """
        UPDATE notifications
        SET is_read = true
        WHERE id = $1 AND recipient_id = $2
        RETURNING *
        """,
        notification_id, user_id
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return dict(result)


@router.post("/mark-all-read")
async def mark_all_read(user_id: str = Depends(require_auth)):
    """Mark all notifications as read."""
    
    await execute_command(
        """
        UPDATE notifications
        SET is_read = true
        WHERE recipient_id = $1 AND is_read = false
        """,
        user_id
    )
    
    return {"success": True, "message": "All notifications marked as read"}


# Helper function to create notifications (used by other routers)
async def create_notification(
    recipient_id: str,
    notification_type: str,
    actor_id: Optional[str] = None,
    reflection_id: Optional[int] = None,
    mirrorback_id: Optional[int] = None,
    metadata: dict = None
):
    """Create a new notification."""
    
    await execute_command(
        """
        INSERT INTO notifications (recipient_id, actor_id, type, reflection_id, mirrorback_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        recipient_id,
        actor_id,
        notification_type,
        reflection_id,
        mirrorback_id,
        metadata or {}
    )
