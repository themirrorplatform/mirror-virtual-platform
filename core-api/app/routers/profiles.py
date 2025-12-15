"""
Profiles Router - Identity management
"""
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
import os
import uuid
from supabase import create_client, Client
from app.models import Profile, ProfileCreate, ProfileUpdate
from app.db import execute_query, execute_one, execute_command
from app.auth import require_auth, get_user_from_token

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Initialize Supabase client for storage
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


def get_user_id_from_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Legacy function - Use app.auth.require_auth or get_user_from_token instead.
    """
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


@router.get("/me", response_model=Profile)
@limiter.limit("60/minute")
async def get_current_profile(request: Request, authorization: Optional[str] = Header(None)):
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
@limiter.limit("30/minute")
async def get_profile_by_username(request: Request, username: str):
    """Get a profile by username."""
    profile = await execute_one(
        "SELECT * FROM profiles WHERE username = $1",
        username
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(profile)


@router.post("/", response_model=Profile)
@limiter.limit("10/minute")
async def create_profile(
    request: Request,
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
@limiter.limit("20/minute")
async def update_profile(
    request: Request,
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
@limiter.limit("30/minute")
async def get_followers(request: Request, username: str):
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
@limiter.limit("30/minute")
async def get_following(request: Request, username: str):
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
@limiter.limit("10/minute")
async def follow_user(request: Request, username: str, authorization: Optional[str] = Header(None)):
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
@limiter.limit("10/minute")
async def unfollow_user(request: Request, username: str, authorization: Optional[str] = Header(None)):
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


@router.post("/upload-avatar")
@limiter.limit("5/minute")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(require_auth)
):
    """
    Upload a profile avatar image to Supabase Storage.
    Returns the public URL of the uploaded image.
    """
    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Storage not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (5MB max)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    
    try:
        # Upload to Supabase Storage
        response = supabase.storage.from_("avatars").upload(
            filename,
            content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("avatars").get_public_url(filename)
        
        # Update profile with new avatar URL
        profile = await execute_one(
            """
            UPDATE profiles
            SET avatar_url = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
            """,
            public_url,
            user_id
        )
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "success": True,
            "avatar_url": public_url,
            "profile": dict(profile)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload avatar: {str(e)}"
        )
