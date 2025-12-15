"""
Feed Router - Reflection-first algorithm
The feed prioritizes reflection over engagement.
"""
from fastapi import APIRouter, HTTPException, Header, Query, Request
from typing import Optional, List
from pydantic import BaseModel
from app.models import FeedItem, FeedResponse, Reflection, Profile
from app.db import execute_query, execute_one
from app.auth import get_user_from_token
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class CursorFeedResponse(BaseModel):
    """Feed response with cursor-based pagination"""
    items: List[FeedItem]
    next_cursor: Optional[str] = None
    has_more: bool


async def score_reflection_for_user(reflection: dict, user_id: str) -> float:
    """
    Score a reflection for a specific user using reflection-first algorithm.

    Scoring principles:
    - Reflection > Reaction
    - Safety > Virality
    - Bias is studied, not hidden
    - Judgment is a signal of regression, not "truth"
    - Regression is logged, learned from, and fed back
    """
    score = 0.0

    # Base: recency (normalize to 0-10 range based on hours old)
    # Most recent = higher score
    import datetime
    created_at = reflection['created_at']
    hours_old = (datetime.datetime.now(datetime.timezone.utc) - created_at).total_seconds() / 3600
    recency_score = max(0, 10 - (hours_old / 24))  # Decay over days
    score += recency_score

    # Check if author is followed (+3)
    is_followed = await execute_one(
        "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
        user_id, reflection['author_id']
    )
    if is_followed:
        score += 3

    # Check lens alignment with user's identity axes (+2)
    if reflection.get('lens_key'):
        axis_match = await execute_one(
            """
            SELECT 1 FROM identity_axes
            WHERE identity_id = $1 AND lens_key = $2
            AND confidence > 0.5
            """,
            user_id, reflection['lens_key']
        )
        if axis_match:
            score += 2

    # Check for regression markers - surface content that might break loops (+2)
    regression_markers = await execute_query(
        """
        SELECT kind FROM regression_markers
        WHERE identity_id = $1
        AND created_at > NOW() - INTERVAL '7 days'
        """,
        user_id
    )

    if regression_markers:
        # If user has recent regression markers, prioritize reflections
        # from the same lens to help break patterns
        if reflection.get('lens_key'):
            score += 2

    # Check for bias insights alignment (+1)
    # Surface content that relates to user's own biases (for awareness)
    if reflection.get('lens_key'):
        bias_match = await execute_one(
            """
            SELECT 1 FROM bias_insights
            WHERE identity_id = $1
            AND created_at > NOW() - INTERVAL '30 days'
            """,
            user_id
        )
        if bias_match:
            score += 1

    # Penalize judgment spikes (-3)
    judgment_signals = await execute_one(
        """
        SELECT 1 FROM reflection_signals
        WHERE user_id = $1
        AND signal = 'judgment_spike'
        AND reflection_id IN (
            SELECT id FROM reflections
            WHERE author_id = $2
        )
        """,
        user_id, reflection['author_id']
    )
    if judgment_signals:
        score -= 3

    # Penalize skipped patterns (-2)
    skip_count = await execute_one(
        """
        SELECT COUNT(*) as count FROM reflection_signals
        WHERE user_id = $1
        AND signal = 'skipped'
        AND reflection_id IN (
            SELECT id FROM reflections
            WHERE author_id = $2
        )
        AND created_at > NOW() - INTERVAL '30 days'
        """,
        user_id, reflection['author_id']
    )
    if skip_count and skip_count['count'] > 3:
        score -= 2

    return score


@router.get("/", response_model=CursorFeedResponse)
@limiter.limit("60/minute")
async def get_feed(
    request: Request,
    limit: int = Query(20, le=50, description="Number of items to return"),
    before_id: Optional[int] = Query(None, description="Get items before this reflection ID"),
    authorization: Optional[str] = Header(None)
):
    """
    Get personalized feed for authenticated user with cursor-based pagination.
    Uses reflection-first algorithm.
    
    Pagination: Pass before_id from the last item to get the next page.
    """
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Get created_at timestamp for cursor if provided
    before_created_at = None
    if before_id is not None:
        cursor_ref = await execute_one(
            "SELECT created_at FROM reflections WHERE id = $1",
            before_id
        )
        if cursor_ref:
            before_created_at = cursor_ref['created_at']

    # Get candidate reflections (exclude critical safety events)
    query = """
        SELECT r.*
        FROM reflections r
        LEFT JOIN safety_events s ON s.reflection_id = r.id AND s.severity = 'critical'
        WHERE r.visibility = 'public'
        AND r.author_id != $1
        AND s.id IS NULL
    """
    params = [user_id]

    # Apply cursor filter (created_at + id for stable pagination)
    if before_created_at and before_id:
        query += " AND (r.created_at < $2 OR (r.created_at = $2 AND r.id < $3))"
        params.extend([before_created_at, before_id])

    query += " ORDER BY r.created_at DESC, r.id DESC LIMIT $" + str(len(params) + 1)
    params.append(limit * 3)  # Get more candidates for scoring

    candidates = await execute_query(query, *params)

    # Score each candidate
    scored_items = []
    for reflection in candidates:
        score = await score_reflection_for_user(dict(reflection), user_id)

        # Get author profile
        author = await execute_one(
            "SELECT * FROM profiles WHERE id = $1",
            reflection['author_id']
        )

        # Get mirrorback count
        mirrorback_count = await execute_one(
            "SELECT COUNT(*) as count FROM mirrorbacks WHERE reflection_id = $1",
            reflection['id']
        )

        # Get signal counts
        signal_counts_result = await execute_query(
            """
            SELECT signal, COUNT(*) as count
            FROM reflection_signals
            WHERE reflection_id = $1
            GROUP BY signal
            """,
            reflection['id']
        )
        signal_counts = {row['signal']: row['count'] for row in signal_counts_result}

        # Get user's signal
        user_signal = await execute_one(
            "SELECT signal FROM reflection_signals WHERE reflection_id = $1 AND user_id = $2",
            reflection['id'], user_id
        )

        scored_items.append({
            "reflection": dict(reflection),
            "author": dict(author) if author else None,
            "mirrorback_count": mirrorback_count['count'] if mirrorback_count else 0,
            "signal_counts": signal_counts,
            "user_signal": user_signal['signal'] if user_signal else None,
            "score": score
        })

    # Sort by score (highest first)
    scored_items.sort(key=lambda x: x['score'], reverse=True)

    # Take top N
    feed_items = scored_items[:limit]

    # Determine next cursor (before_id) and has_more
    next_cursor = None
    has_more = len(scored_items) > limit
    if feed_items:
        last_reflection = feed_items[-1]['reflection']
        next_cursor = str(last_reflection['id'])  # Simple ID-based cursor

    return {
        "items": feed_items,
        "next_cursor": next_cursor,
        "has_more": has_more
    }


@router.get("/public")
@limiter.limit("60/minute")
async def get_public_feed(
    request: Request,
    limit: int = 20,
    cursor: Optional[int] = None,
    lens_key: Optional[str] = None
):
    """
    Get public feed (no personalization, no auth required).
    Simple chronological feed with optional lens filter.
    """
    query = """
        SELECT r.*, p.username, p.display_name, p.avatar_url
        FROM reflections r
        JOIN profiles p ON p.id = r.author_id
        LEFT JOIN safety_events s ON s.reflection_id = r.id AND s.severity = 'critical'
        WHERE r.visibility = 'public'
        AND s.id IS NULL
    """
    params = []

    if lens_key:
        params.append(lens_key)
        query += f" AND r.lens_key = ${len(params)}"

    if cursor:
        params.append(cursor)
        query += f" AND r.id < ${len(params)}"

    params.append(limit)
    query += f" ORDER BY r.created_at DESC LIMIT ${len(params)}"

    reflections = await execute_query(query, *params)

    items = []
    for r in reflections:
        # Get mirrorback count
        mirrorback_count = await execute_one(
            "SELECT COUNT(*) as count FROM mirrorbacks WHERE reflection_id = $1",
            r['id']
        )

        items.append({
            "reflection": dict(r),
            "author": {
                "username": r['username'],
                "display_name": r['display_name'],
                "avatar_url": r['avatar_url']
            },
            "mirrorback_count": mirrorback_count['count'] if mirrorback_count else 0,
            "signal_counts": {},
            "user_signal": None,
            "score": 0.0
        })

    next_cursor = items[-1]['reflection']['id'] if items else None

    return {
        "items": items,
        "next_cursor": next_cursor
    }


@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_feed_state(
    request: Request,
    authorization: str = Header(None)
):
    """
    Manually refresh feed algorithm state for user.
    This recalculates identity axes, bias insights, etc.
    """
    user_id = None
    if authorization:
        user_id = get_user_from_token(authorization)

    # Update feed_state timestamp
    await execute_query(
        """
        INSERT INTO feed_state (user_id, updated_at)
        VALUES ($1, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET updated_at = NOW()
        """,
        user_id
    )

    return {"success": True, "message": "Feed state refreshed"}
