"""
Commons Attestations Service
Manages attestation workflows, verification, and trust building
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
import asyncpg
from app.db import get_db_connection

# ============================================================================
# Attestation Types
# ============================================================================

class AttestationType:
    SUPPORT = "support"           # General support/agreement
    VERIFY = "verify"             # Verification of facts/claims
    WITNESS = "witness"           # Witnessed experience
    VOUCH = "vouch"              # Personal vouching
    CHALLENGE = "challenge"       # Respectful challenge/question
    AMPLIFY = "amplify"          # Amplifying reach

class AttestationStatus:
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"
    CHALLENGED = "challenged"
    VERIFIED = "verified"

# ============================================================================
# Create Attestation
# ============================================================================

async def create_attestation(
    publication_id: UUID,
    attester_id: UUID,
    attestation_type: str,
    comment: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create an attestation for a publication.
    
    Args:
        publication_id: Publication being attested
        attester_id: User making attestation
        attestation_type: Type of attestation
        comment: Optional comment
        metadata: Optional metadata (e.g., verification details)
    
    Returns:
        Attestation record
    """
    conn = await get_connection()
    
    try:
        # Use governance_votes table for attestations
        attestation = await conn.fetchrow("""
            INSERT INTO governance_votes (
                id,
                proposal_id,
                identity_id,
                choice,
                comment,
                voted_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """,
            uuid4(),
            publication_id,
            attester_id,
            attestation_type,  # Store type in choice field
            comment or "",
            datetime.utcnow()
        )
        
        # Update publication attestation count
        await conn.execute("""
            UPDATE governance_proposals
            SET votes_approve = COALESCE(votes_approve, 0) + 1
            WHERE id = $1
        """, publication_id)
        
        return {
            "attestation_id": str(attestation["id"]),
            "publication_id": str(attestation["proposal_id"]),
            "attester_id": str(attestation["identity_id"]),
            "attestation_type": attestation["choice"],
            "comment": attestation["comment"],
            "status": AttestationStatus.ACTIVE,
            "created_at": attestation["voted_at"].isoformat(),
            "metadata": metadata or {}
        }
    
    finally:
        await conn.close()

# ============================================================================
# Get Attestation
# ============================================================================

async def get_attestation(attestation_id: UUID) -> Optional[Dict[str, Any]]:
    """Get an attestation by ID."""
    conn = await get_connection()
    
    try:
        att = await conn.fetchrow("""
            SELECT * FROM governance_votes WHERE id = $1
        """, attestation_id)
        
        if not att:
            return None
        
        return {
            "attestation_id": str(att["id"]),
            "publication_id": str(att["proposal_id"]),
            "attester_id": str(att["identity_id"]),
            "attestation_type": att["choice"],
            "comment": att["comment"],
            "status": AttestationStatus.ACTIVE,
            "created_at": att["voted_at"].isoformat()
        }
    
    finally:
        await conn.close()

# ============================================================================
# List Attestations
# ============================================================================

async def list_attestations(
    publication_id: Optional[UUID] = None,
    attester_id: Optional[UUID] = None,
    attestation_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    List attestations with optional filters.
    
    Args:
        publication_id: Filter by publication
        attester_id: Filter by attester
        attestation_type: Filter by type
        limit: Max results
        offset: Pagination offset
    
    Returns:
        List of attestations
    """
    conn = await get_connection()
    
    try:
        query = """
            SELECT * FROM governance_votes
            WHERE 1=1
        """
        params = []
        param_count = 1
        
        if publication_id:
            query += f" AND proposal_id = ${param_count}"
            params.append(publication_id)
            param_count += 1
        
        if attester_id:
            query += f" AND identity_id = ${param_count}"
            params.append(attester_id)
            param_count += 1
        
        if attestation_type:
            query += f" AND choice = ${param_count}"
            params.append(attestation_type)
            param_count += 1
        
        query += f" ORDER BY voted_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        attestations = []
        for row in rows:
            attestations.append({
                "attestation_id": str(row["id"]),
                "publication_id": str(row["proposal_id"]),
                "attester_id": str(row["identity_id"]),
                "attestation_type": row["choice"],
                "comment": row["comment"],
                "status": AttestationStatus.ACTIVE,
                "created_at": row["voted_at"].isoformat()
            })
        
        return attestations
    
    finally:
        await conn.close()

# ============================================================================
# Withdraw Attestation
# ============================================================================

async def withdraw_attestation(attestation_id: UUID, attester_id: UUID) -> bool:
    """Withdraw an attestation (only by original attester)."""
    conn = await get_connection()
    
    try:
        # Verify ownership
        att = await conn.fetchrow("""
            SELECT * FROM governance_votes WHERE id = $1
        """, attestation_id)
        
        if not att:
            return False
        
        if att["identity_id"] != attester_id:
            raise PermissionError("Only attester can withdraw")
        
        # Delete attestation
        await conn.execute("""
            DELETE FROM governance_votes WHERE id = $1
        """, attestation_id)
        
        # Update publication count
        await conn.execute("""
            UPDATE governance_proposals
            SET votes_approve = GREATEST(COALESCE(votes_approve, 0) - 1, 0)
            WHERE id = $1
        """, att["proposal_id"])
        
        return True
    
    finally:
        await conn.close()

# ============================================================================
# Get Attestation Stats
# ============================================================================

async def get_attestation_stats(
    publication_id: Optional[UUID] = None,
    attester_id: Optional[UUID] = None
) -> Dict[str, Any]:
    """Get attestation statistics."""
    conn = await get_connection()
    
    try:
        if publication_id:
            # Stats for specific publication
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN choice = 'support' THEN 1 ELSE 0 END) as support,
                    SUM(CASE WHEN choice = 'verify' THEN 1 ELSE 0 END) as verify,
                    SUM(CASE WHEN choice = 'witness' THEN 1 ELSE 0 END) as witness,
                    SUM(CASE WHEN choice = 'vouch' THEN 1 ELSE 0 END) as vouch,
                    SUM(CASE WHEN choice = 'challenge' THEN 1 ELSE 0 END) as challenge,
                    SUM(CASE WHEN choice = 'amplify' THEN 1 ELSE 0 END) as amplify
                FROM governance_votes
                WHERE proposal_id = $1
            """, publication_id)
        elif attester_id:
            # Stats for specific attester
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN choice = 'support' THEN 1 ELSE 0 END) as support,
                    SUM(CASE WHEN choice = 'verify' THEN 1 ELSE 0 END) as verify,
                    SUM(CASE WHEN choice = 'witness' THEN 1 ELSE 0 END) as witness,
                    SUM(CASE WHEN choice = 'vouch' THEN 1 ELSE 0 END) as vouch,
                    SUM(CASE WHEN choice = 'challenge' THEN 1 ELSE 0 END) as challenge,
                    SUM(CASE WHEN choice = 'amplify' THEN 1 ELSE 0 END) as amplify
                FROM governance_votes
                WHERE identity_id = $1
            """, attester_id)
        else:
            # Global stats
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN choice = 'support' THEN 1 ELSE 0 END) as support,
                    SUM(CASE WHEN choice = 'verify' THEN 1 ELSE 0 END) as verify,
                    SUM(CASE WHEN choice = 'witness' THEN 1 ELSE 0 END) as witness,
                    SUM(CASE WHEN choice = 'vouch' THEN 1 ELSE 0 END) as vouch,
                    SUM(CASE WHEN choice = 'challenge' THEN 1 ELSE 0 END) as challenge,
                    SUM(CASE WHEN choice = 'amplify' THEN 1 ELSE 0 END) as amplify
                FROM governance_votes
            """)
        
        return {
            "total_attestations": stats["total"] or 0,
            "by_type": {
                "support": stats["support"] or 0,
                "verify": stats["verify"] or 0,
                "witness": stats["witness"] or 0,
                "vouch": stats["vouch"] or 0,
                "challenge": stats["challenge"] or 0,
                "amplify": stats["amplify"] or 0
            }
        }
    
    finally:
        await conn.close()

# ============================================================================
# Get Trust Score
# ============================================================================

async def get_trust_score(user_id: UUID) -> Dict[str, Any]:
    """
    Calculate trust score for a user based on attestations received.
    
    Trust score considers:
    - Number of attestations received
    - Diversity of attestors
    - Type distribution (verify/vouch weighted higher)
    - Challenge ratio
    """
    conn = await get_connection()
    
    try:
        # Get user's publications
        publications = await conn.fetch("""
            SELECT id FROM governance_proposals
            WHERE proposed_by = $1
        """, user_id)
        
        if not publications:
            return {
                "user_id": str(user_id),
                "trust_score": 0.0,
                "attestations_received": 0,
                "unique_attestors": 0,
                "challenge_ratio": 0.0
            }
        
        pub_ids = [p["id"] for p in publications]
        
        # Get attestation stats
        stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT identity_id) as unique_attestors,
                SUM(CASE WHEN choice = 'verify' THEN 2 ELSE 0 END) +
                SUM(CASE WHEN choice = 'vouch' THEN 2 ELSE 0 END) +
                SUM(CASE WHEN choice = 'witness' THEN 1.5 ELSE 0 END) +
                SUM(CASE WHEN choice = 'support' THEN 1 ELSE 0 END) +
                SUM(CASE WHEN choice = 'amplify' THEN 0.5 ELSE 0 END) as weighted_positive,
                SUM(CASE WHEN choice = 'challenge' THEN 1 ELSE 0 END) as challenges
            FROM governance_votes
            WHERE proposal_id = ANY($1)
        """, pub_ids)
        
        total = stats["total"] or 0
        unique = stats["unique_attestors"] or 0
        weighted = float(stats["weighted_positive"] or 0)
        challenges = stats["challenges"] or 0
        
        # Calculate trust score (0-100)
        if total == 0:
            trust_score = 0.0
        else:
            # Base score from weighted attestations
            base_score = min(weighted * 2, 70)  # Max 70 from attestations
            
            # Diversity bonus (up to 20 points)
            diversity_bonus = min(unique * 2, 20)
            
            # Challenge penalty (reduce score)
            challenge_ratio = challenges / total if total > 0 else 0
            challenge_penalty = challenge_ratio * 30
            
            trust_score = max(base_score + diversity_bonus - challenge_penalty, 0)
        
        return {
            "user_id": str(user_id),
            "trust_score": round(trust_score, 2),
            "attestations_received": total,
            "unique_attestors": unique,
            "challenge_ratio": round(challenges / total if total > 0 else 0, 3)
        }
    
    finally:
        await conn.close()

# ============================================================================
# Verify Attestation Chain
# ============================================================================

async def verify_attestation_chain(publication_id: UUID) -> Dict[str, Any]:
    """
    Verify the attestation chain for a publication.
    
    Checks:
    - Number of attestations
    - Diversity of attestors
    - Presence of verified attestors
    - Challenge/support ratio
    """
    conn = await get_connection()
    
    try:
        attestations = await conn.fetch("""
            SELECT * FROM governance_votes
            WHERE proposal_id = $1
        """, publication_id)
        
        if not attestations:
            return {
                "publication_id": str(publication_id),
                "verified": False,
                "verification_score": 0.0,
                "attestation_count": 0,
                "reason": "No attestations"
            }
        
        total = len(attestations)
        unique_attestors = len(set(a["identity_id"] for a in attestations))
        
        # Count by type
        verify_count = sum(1 for a in attestations if a["choice"] == "verify")
        vouch_count = sum(1 for a in attestations if a["choice"] == "vouch")
        challenge_count = sum(1 for a in attestations if a["choice"] == "challenge")
        
        # Calculate verification score
        verification_score = (
            (verify_count * 3) +
            (vouch_count * 2) +
            (unique_attestors * 1) -
            (challenge_count * 2)
        )
        
        verified = verification_score >= 10  # Threshold for verification
        
        return {
            "publication_id": str(publication_id),
            "verified": verified,
            "verification_score": verification_score,
            "attestation_count": total,
            "unique_attestors": unique_attestors,
            "verify_count": verify_count,
            "vouch_count": vouch_count,
            "challenge_count": challenge_count,
            "reason": "Verified" if verified else "Insufficient verification"
        }
    
    finally:
        await conn.close()
