"""
Signals Router - Logging engagement as learning data
Signals are NOT likes/upvotes. They are data about how users relate to content.
"""
from fastapi import APIRouter, HTTPException, Header, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
from app.models import ReflectionSignal, ReflectionSignalCreate
from app.db import execute_query, execute_one, execute_command
from app.routers.profiles import get_user_id_from_auth

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/", response_model=ReflectionSignal)
@limiter.limit("30/minute")
async def create_signal(
    request: Request,
    signal_data: ReflectionSignalCreate,
    authorization: Optional[str] = Header(None)
):
    """
    Create a signal for a reflection.

    Signals are how the platform learns:
    - 'resonated': This reflection aligned with my thinking
    - 'challenged': This made me question something
    - 'skipped': I chose not to engage with this
    - 'saved': I want to return to this
    - 'judgment_spike': I felt judgmental (regression marker)
    """
    user_id = get_user_id_from_auth(authorization)

    # Check if reflection exists and is accessible
    reflection = await execute_one(
        """
        SELECT * FROM reflections
        WHERE id = $1
        AND (visibility = 'public' OR author_id = $2)
        """,
        signal_data.reflection_id, user_id
    )

    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    # If this is a judgment_spike, also log it as a regression marker
    if signal_data.signal.value == 'judgment_spike':
        await execute_command(
            """
            INSERT INTO regression_markers (identity_id, reflection_id, kind, description, severity)
            VALUES ($1, $2, 'judgment_spike', 'Felt judgmental toward content', 2)
            """,
            user_id, signal_data.reflection_id
        )

    # Create or update signal (upsert)
    signal = await execute_one(
        """
        INSERT INTO reflection_signals (reflection_id, user_id, signal, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (reflection_id, user_id, signal)
        DO UPDATE SET metadata = $4, created_at = NOW()
        RETURNING *
        """,
        signal_data.reflection_id,
        user_id,
        signal_data.signal.value,
        signal_data.metadata
    )

    return dict(signal)


@router.get("/reflection/{reflection_id}")
@limiter.limit("30/minute")
async def get_signals_for_reflection(request: Request, reflection_id: int):
    """Get all signals for a specific reflection (aggregated)."""
    signals = await execute_query(
        """
        SELECT signal, COUNT(*) as count
        FROM reflection_signals
        WHERE reflection_id = $1
        GROUP BY signal
        """,
        reflection_id
    )

    return {row['signal']: row['count'] for row in signals}


@router.get("/me")
@limiter.limit("30/minute")
async def get_my_signals(
    request: Request,
    limit: int = 50,
    authorization: Optional[str] = Header(None)
):
    """Get the authenticated user's recent signals."""
    user_id = get_user_id_from_auth(authorization)

    signals = await execute_query(
        """
        SELECT s.*, r.body as reflection_body, r.lens_key
        FROM reflection_signals s
        JOIN reflections r ON r.id = s.reflection_id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2
        """,
        user_id, limit
    )

    return [dict(s) for s in signals]


@router.delete("/{signal_id}")
@limiter.limit("10/minute")
async def delete_signal(
    request: Request,
    signal_id: int,
    authorization: Optional[str] = Header(None)
):
    """Delete a signal."""
    user_id = get_user_id_from_auth(authorization)

    result = await execute_command(
        "DELETE FROM reflection_signals WHERE id = $1 AND user_id = $2",
        signal_id, user_id
    )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Signal not found or unauthorized")

    return {"success": True, "message": "Signal deleted"}


@router.post("/batch")
@limiter.limit("20/minute")
async def create_batch_signals(
    request: Request,
    signals: list[ReflectionSignalCreate],
    authorization: Optional[str] = Header(None)
):
    """
    Create multiple signals at once.
    Useful for logging implicit feedback (e.g., scroll patterns, time spent).
    """
    user_id = get_user_id_from_auth(authorization)

    created = []
    for signal_data in signals:
        signal = await execute_one(
            """
            INSERT INTO reflection_signals (reflection_id, user_id, signal, metadata)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (reflection_id, user_id, signal)
            DO UPDATE SET metadata = $4, created_at = NOW()
            RETURNING *
            """,
            signal_data.reflection_id,
            user_id,
            signal_data.signal.value,
            signal_data.metadata
        )
        created.append(dict(signal))

    return {
        "success": True,
        "count": len(created),
        "signals": created
    }
