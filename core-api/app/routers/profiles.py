"""
Profiles Router - Identity management
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.models import Profile, ProfileCreate, ProfileUpdate
from app.db import execute_query, execute_one, execute_command

router = APIRouter()


def get_user_id_from_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from authorization header.
    In production, this would validate JWT from Supabase.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # TODO: Validate JWT and extract user ID
    # For now, assuming format: "Bearer {user_id}"
    if authorization.startswith("Bearer "):
        return authorization[7:]

    raise HTTPException(status_code=401, detail="Invalid authorization header")


@router.get("/me", response_model=Profile)
async def get_current_profile(authorization: Optional[str] = Header(None)):
    """Get the authenticated user's profile."""
    user_id = get_user_id_from_auth(authorization)

    profile = await execute_one(
        "SELECT * FROM profiles WHERE id = $1",
        user_id
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(profile)


@router.get("/{username}", response_model=Profile)
async def get_profile_by_username(username: str):
    """Get a profile by username."""
    profile = await execute_one(
        "SELECT * FROM profiles WHERE username = $1",
        username
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(profile)


@router.post("/", response_model=Profile)
async def create_profile(
    profile_data: ProfileCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new profile for the authenticated user."""
    user_id = get_user_id_from_auth(authorization)

    # Check if profile already exists
    existing = await execute_one(
        "SELECT id FROM profiles WHERE id = $1 OR username = $2",
        user_id, profile_data.username
    )

    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    # Create profile
    profile = await execute_one(
        """
        INSERT INTO profiles (id, username, display_name, bio, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        user_id, profile_data.username, profile_data.display_name,
        profile_data.bio, profile_data.avatar_url
    )

    return dict(profile)


@router.patch("/me", response_model=Profile)
async def update_profile(
    profile_data: ProfileUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update the authenticated user's profile."""
    user_id = get_user_id_from_auth(authorization)

    # Build update query dynamically
    updates = []
    values = []
    param_num = 1

    if profile_data.display_name is not None:
        updates.append(f"display_name = ${param_num}")
        values.append(profile_data.display_name)
        param_num += 1

    if profile_data.bio is not None:
        updates.append(f"bio = ${param_num}")
        values.append(profile_data.bio)
        param_num += 1

    if profile_data.avatar_url is not None:
        updates.append(f"avatar_url = ${param_num}")
        values.append(profile_data.avatar_url)
        param_num += 1

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    updates.append(f"updated_at = NOW()")
    values.append(user_id)

    query = f"""
        UPDATE profiles
        SET {', '.join(updates)}
        WHERE id = ${param_num}
        RETURNING *
    """

    profile = await execute_one(query, *values)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(profile)


@router.get("/{username}/followers")
async def get_followers(username: str):
    """Get a user's followers."""
    followers = await execute_query(
        """
        SELECT p.*
        FROM profiles p
        JOIN follows f ON f.follower_id = p.id
        JOIN profiles target ON target.id = f.following_id
        WHERE target.username = $1
        ORDER BY f.created_at DESC
        """,
        username
    )

    return [dict(f) for f in followers]


@router.get("/{username}/following")
async def get_following(username: str):
    """Get who a user is following."""
    following = await execute_query(
        """
        SELECT p.*
        FROM profiles p
        JOIN follows f ON f.following_id = p.id
        JOIN profiles follower ON follower.id = f.follower_id
        WHERE follower.username = $1
        ORDER BY f.created_at DESC
        """,
        username
    )

    return [dict(f) for f in following]


@router.post("/{username}/follow")
async def follow_user(username: str, authorization: Optional[str] = Header(None)):
    """Follow a user."""
    user_id = get_user_id_from_auth(authorization)

    # Get target user ID
    target = await execute_one(
        "SELECT id FROM profiles WHERE username = $1",
        username
    )

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target_id = target['id']

    if target_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Create follow
    try:
        await execute_command(
            "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
            user_id, target_id
        )
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Already following")
        raise

    return {"success": True, "message": f"Now following {username}"}


@router.delete("/{username}/follow")
async def unfollow_user(username: str, authorization: Optional[str] = Header(None)):
    """Unfollow a user."""
    user_id = get_user_id_from_auth(authorization)

    # Get target user ID
    target = await execute_one(
        "SELECT id FROM profiles WHERE username = $1",
        username
    )

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete follow
    result = await execute_command(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        user_id, target['id']
    )

    return {"success": True, "message": f"Unfollowed {username}"}
