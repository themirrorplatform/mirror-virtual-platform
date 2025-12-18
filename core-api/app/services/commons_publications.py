"""
Commons Publications Service
Manages published content, versioning, and community visibility
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import asyncpg
from app.db import get_db_connection

# ============================================================================
# Publication Types
# ============================================================================

class PublicationType:
    REFLECTION = "reflection"
    PATTERN = "pattern"
    INSIGHT = "insight"
    GUIDE = "guide"
    AMENDMENT = "amendment"

class PublicationStatus:
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    CHALLENGED = "challenged"

# ============================================================================
# Create Publication
# ============================================================================

async def create_publication(
    user_id: UUID,
    title: str,
    content: str,
    publication_type: str,
    tags: List[str] = None,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Create a new publication in the Commons.
    
    Args:
        user_id: Author's user ID
        title: Publication title
        content: Publication content
        publication_type: Type (reflection, pattern, insight, guide, amendment)
        tags: Optional tags for categorization
        metadata: Optional metadata (e.g., related reflections, sources)
    
    Returns:
        Publication record with ID and timestamps
    """
    conn = await get_connection()
    
    try:
        # Create publication using governance_proposals as base
        # We'll use this table as it has similar structure
        publication = await conn.fetchrow("""
            INSERT INTO governance_proposals (
                id,
                title,
                description,
                full_text,
                rationale,
                proposed_by,
                proposed_at,
                voting_deadline,
                status,
                votes_approve,
                votes_reject,
                votes_abstain
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0)
            RETURNING *
        """, 
            uuid4(),
            title,
            publication_type,  # Store type in description field
            content,
            str(tags or []) if tags else "[]",  # Store tags in rationale
            user_id,
            datetime.utcnow(),
            datetime.utcnow() + timedelta(days=365),  # Long expiry for publications
            PublicationStatus.DRAFT
        )
        
        return {
            "publication_id": str(publication["id"]),
            "author_id": str(publication["proposed_by"]),
            "title": publication["title"],
            "content": publication["full_text"],
            "publication_type": publication["description"],
            "status": publication["status"],
            "created_at": publication["proposed_at"].isoformat(),
            "tags": eval(publication["rationale"]) if publication["rationale"] else [],
            "attestations": 0,
            "views": 0,
            "metadata": metadata or {}
        }
    
    finally:
        await conn.close()

# ============================================================================
# Get Publication
# ============================================================================

async def get_publication(publication_id: UUID) -> Optional[Dict[str, Any]]:
    """Get a publication by ID."""
    conn = await get_connection()
    
    try:
        pub = await conn.fetchrow("""
            SELECT * FROM governance_proposals WHERE id = $1
        """, publication_id)
        
        if not pub:
            return None
        
        # Count attestations (votes as attestations)
        attestations = pub["votes_approve"] or 0
        
        return {
            "publication_id": str(pub["id"]),
            "author_id": str(pub["proposed_by"]),
            "title": pub["title"],
            "content": pub["full_text"],
            "publication_type": pub["description"],
            "status": pub["status"],
            "created_at": pub["proposed_at"].isoformat(),
            "tags": eval(pub["rationale"]) if pub["rationale"] else [],
            "attestations": attestations,
            "challenges": pub["votes_reject"] or 0,
            "views": pub["votes_abstain"] or 0,  # Use abstain for view count
            "guardian_review": pub.get("guardian_review"),
            "implementation_date": pub["implementation_date"].isoformat() if pub.get("implementation_date") else None
        }
    
    finally:
        await conn.close()

# ============================================================================
# List Publications
# ============================================================================

async def list_publications(
    user_id: Optional[UUID] = None,
    publication_type: Optional[str] = None,
    status: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    List publications with optional filters.
    
    Args:
        user_id: Filter by author
        publication_type: Filter by type
        status: Filter by status
        tags: Filter by tags
        limit: Max results
        offset: Pagination offset
    
    Returns:
        List of publication summaries
    """
    conn = await get_connection()
    
    try:
        query = """
            SELECT * FROM governance_proposals
            WHERE 1=1
        """
        params = []
        param_count = 1
        
        if user_id:
            query += f" AND proposed_by = ${param_count}"
            params.append(user_id)
            param_count += 1
        
        if publication_type:
            query += f" AND description = ${param_count}"
            params.append(publication_type)
            param_count += 1
        
        if status:
            query += f" AND status = ${param_count}"
            params.append(status)
            param_count += 1
        
        query += f" ORDER BY proposed_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        publications = []
        for row in rows:
            publications.append({
                "publication_id": str(row["id"]),
                "author_id": str(row["proposed_by"]),
                "title": row["title"],
                "publication_type": row["description"],
                "status": row["status"],
                "created_at": row["proposed_at"].isoformat(),
                "attestations": row["votes_approve"] or 0,
                "challenges": row["votes_reject"] or 0,
                "views": row["votes_abstain"] or 0
            })
        
        return publications
    
    finally:
        await conn.close()

# ============================================================================
# Update Publication
# ============================================================================

async def update_publication(
    publication_id: UUID,
    user_id: UUID,
    title: Optional[str] = None,
    content: Optional[str] = None,
    status: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Update a publication (only by author)."""
    conn = await get_connection()
    
    try:
        # Verify ownership
        pub = await conn.fetchrow("""
            SELECT * FROM governance_proposals WHERE id = $1
        """, publication_id)
        
        if not pub:
            raise ValueError("Publication not found")
        
        if pub["proposed_by"] != user_id:
            raise PermissionError("Only author can update publication")
        
        # Build update query
        updates = []
        params = [publication_id]
        param_count = 2
        
        if title:
            updates.append(f"title = ${param_count}")
            params.append(title)
            param_count += 1
        
        if content:
            updates.append(f"full_text = ${param_count}")
            params.append(content)
            param_count += 1
        
        if status:
            updates.append(f"status = ${param_count}")
            params.append(status)
            param_count += 1
        
        if tags:
            updates.append(f"rationale = ${param_count}")
            params.append(str(tags))
            param_count += 1
        
        if not updates:
            raise ValueError("No fields to update")
        
        query = f"""
            UPDATE governance_proposals
            SET {', '.join(updates)}
            WHERE id = $1
            RETURNING *
        """
        
        updated = await conn.fetchrow(query, *params)
        
        return {
            "publication_id": str(updated["id"]),
            "author_id": str(updated["proposed_by"]),
            "title": updated["title"],
            "content": updated["full_text"],
            "publication_type": updated["description"],
            "status": updated["status"],
            "created_at": updated["proposed_at"].isoformat(),
            "tags": eval(updated["rationale"]) if updated["rationale"] else []
        }
    
    finally:
        await conn.close()

# ============================================================================
# Delete Publication
# ============================================================================

async def delete_publication(publication_id: UUID, user_id: UUID) -> bool:
    """Delete a publication (only by author or if in draft)."""
    conn = await get_connection()
    
    try:
        pub = await conn.fetchrow("""
            SELECT * FROM governance_proposals WHERE id = $1
        """, publication_id)
        
        if not pub:
            return False
        
        # Can delete if author OR if still in draft
        if pub["proposed_by"] != user_id and pub["status"] != PublicationStatus.DRAFT:
            raise PermissionError("Cannot delete published content by others")
        
        await conn.execute("""
            DELETE FROM governance_proposals WHERE id = $1
        """, publication_id)
        
        return True
    
    finally:
        await conn.close()

# ============================================================================
# Publication Stats
# ============================================================================

async def get_publication_stats(user_id: Optional[UUID] = None) -> Dict[str, Any]:
    """Get publication statistics."""
    conn = await get_connection()
    
    try:
        if user_id:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
                    SUM(votes_approve) as total_attestations,
                    SUM(votes_reject) as total_challenges,
                    SUM(votes_abstain) as total_views
                FROM governance_proposals
                WHERE proposed_by = $1
            """, user_id)
        else:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
                    SUM(votes_approve) as total_attestations,
                    SUM(votes_reject) as total_challenges,
                    SUM(votes_abstain) as total_views
                FROM governance_proposals
            """)
        
        return {
            "total_publications": stats["total"] or 0,
            "published": stats["published"] or 0,
            "drafts": stats["drafts"] or 0,
            "total_attestations": stats["total_attestations"] or 0,
            "total_challenges": stats["total_challenges"] or 0,
            "total_views": stats["total_views"] or 0
        }
    
    finally:
        await conn.close()

# ============================================================================
# Increment View Count
# ============================================================================

async def increment_view_count(publication_id: UUID) -> int:
    """Increment view count for a publication."""
    conn = await get_connection()
    
    try:
        result = await conn.fetchrow("""
            UPDATE governance_proposals
            SET votes_abstain = COALESCE(votes_abstain, 0) + 1
            WHERE id = $1
            RETURNING votes_abstain
        """, publication_id)
        
        return result["votes_abstain"] if result else 0
    
    finally:
        await conn.close()
