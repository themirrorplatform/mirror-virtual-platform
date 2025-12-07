"""
Authentication utilities for The Mirror Virtual Platform
Handles Supabase JWT verification and user extraction
"""
import os
import jwt
from typing import Optional
from fastapi import HTTPException, Header
from jwt import PyJWKClient


# Supabase JWT configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_JWT_ALGORITHM = "HS256"


def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT token and return the decoded payload.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        The decoded token payload containing user info
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_JWT_SECRET not configured"
        )
    
    try:
        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[SUPABASE_JWT_ALGORITHM],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


def get_user_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract user ID from Authorization header.
    
    Args:
        authorization: The Authorization header value (Bearer token)
        
    Returns:
        The user ID (UUID) if authenticated, None otherwise
        
    Raises:
        HTTPException: If token is invalid
    """
    if not authorization:
        return None
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Use: Bearer <token>"
        )
    
    token = parts[1]
    payload = verify_supabase_token(token)
    
    # Extract user ID from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Token does not contain user ID"
        )
    
    return user_id


def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Require authentication and return user ID.
    
    Args:
        authorization: The Authorization header value
        
    Returns:
        The authenticated user ID
        
    Raises:
        HTTPException: If not authenticated or token is invalid
    """
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    return user_id
