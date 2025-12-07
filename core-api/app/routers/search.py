"""
Search Router - Search reflections and users
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from app.db import execute_query
from app.auth import get_user_from_token

router = APIRouter()


class SearchResult(BaseModel):
    """Generic search result"""
    type: str  # 'reflection' or 'profile'
    id: str
    content: str
    metadata: dict


class ReflectionSearchResult(BaseModel):
    """Reflection search result"""
    id: int
    author_id: str
    author_username: str
    author_display_name: Optional[str]
    author_avatar_url: Optional[str]
    body: str
    lens_key: Optional[str]
    created_at: str


class ProfileSearchResult(BaseModel):
    """Profile search result"""
    id: str
    username: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]


@router.get("/reflections", response_model=List[ReflectionSearchResult])
async def search_reflections(
    q: str = Query(..., min_length=2, description="Search query"),
    lens_key: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    authorization: Optional[str] = None
):
    """Search public reflections using full-text search."""
    
    user_id = get_user_from_token(authorization) if authorization else None
    
    # Build the where clause
    where_parts = ["r.visibility = 'public'"]
    params = []
    param_num = 1
    
    # Add full-text search
    where_parts.append(f"to_tsvector('english', r.body) @@ plainto_tsquery('english', ${param_num})")
    params.append(q)
    param_num += 1
    
    # Optional lens filter
    if lens_key:
        where_parts.append(f"r.lens_key = ${param_num}")
        params.append(lens_key)
        param_num += 1
    
    params.extend([limit, offset])
    
    query = f"""
        SELECT 
            r.id,
            r.author_id,
            r.body,
            r.lens_key,
            r.created_at,
            p.username as author_username,
            p.display_name as author_display_name,
            p.avatar_url as author_avatar_url,
            ts_rank(to_tsvector('english', r.body), plainto_tsquery('english', $1)) as rank
        FROM reflections r
        JOIN profiles p ON p.id = r.author_id
        WHERE {' AND '.join(where_parts)}
        ORDER BY rank DESC, r.created_at DESC
        LIMIT ${param_num} OFFSET ${param_num + 1}
    """
    
    results = await execute_query(query, *params)
    return [dict(r) for r in results]


@router.get("/profiles", response_model=List[ProfileSearchResult])
async def search_profiles(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = 20,
    offset: int = 0
):
    """Search user profiles."""
    
    profiles = await execute_query(
        """
        SELECT 
            id,
            username,
            display_name,
            bio,
            avatar_url,
            ts_rank(
                to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || username),
                plainto_tsquery('english', $1)
            ) as rank
        FROM profiles
        WHERE to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || username)
              @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2 OFFSET $3
        """,
        q, limit, offset
    )
    
    return [dict(p) for p in profiles]


@router.get("/")
async def search_all(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = 10
):
    """Search both reflections and profiles (combined)."""
    
    # Search reflections
    reflections = await execute_query(
        """
        SELECT 
            'reflection' as type,
            r.id::text,
            r.body as content,
            jsonb_build_object(
                'author_username', p.username,
                'author_display_name', p.display_name,
                'lens_key', r.lens_key,
                'created_at', r.created_at
            ) as metadata
        FROM reflections r
        JOIN profiles p ON p.id = r.author_id
        WHERE r.visibility = 'public'
          AND to_tsvector('english', r.body) @@ plainto_tsquery('english', $1)
        ORDER BY ts_rank(to_tsvector('english', r.body), plainto_tsquery('english', $1)) DESC
        LIMIT $2
        """,
        q, limit
    )
    
    # Search profiles
    profiles = await execute_query(
        """
        SELECT 
            'profile' as type,
            id::text,
            username as content,
            jsonb_build_object(
                'display_name', display_name,
                'bio', bio,
                'avatar_url', avatar_url
            ) as metadata
        FROM profiles
        WHERE to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || username)
              @@ plainto_tsquery('english', $1)
        ORDER BY ts_rank(
            to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || username),
            plainto_tsquery('english', $1)
        ) DESC
        LIMIT $2
        """,
        q, limit
    )
    
    return {
        "reflections": [dict(r) for r in reflections],
        "profiles": [dict(p) for p in profiles]
    }
