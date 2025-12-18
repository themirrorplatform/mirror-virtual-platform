"""
Commons Witnesses Service
Manages witness registry, verification, and proof-of-mirror
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
import asyncpg
from app.db import get_db_connection

# ============================================================================
# Witness Types
# ============================================================================

class WitnessType:
    IDENTITY = "identity"         # Identity verification
    EXPERIENCE = "experience"     # Witnessed experience
    TRANSFORMATION = "transformation"  # Growth/change witness
    GUARDIAN = "guardian"         # Guardian witness
    MIRROR = "mirror"            # Mirror instance verification

class WitnessStatus:
    PENDING = "pending"
    VERIFIED = "verified"
    CHALLENGED = "challenged"
    REVOKED = "revoked"

# ============================================================================
# Register Witness
# ============================================================================

async def register_witness(
    witness_id: UUID,
    witness_type: str,
    display_name: str,
    public_key: Optional[str] = None,
    genesis_hash: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Register a witness in the registry.
    
    Args:
        witness_id: Unique witness identifier
        witness_type: Type of witness
        display_name: Public display name
        public_key: Optional public key for verification
        genesis_hash: Optional genesis hash for mirror instances
        metadata: Optional metadata
    
    Returns:
        Witness record
    """
    conn = await get_connection()
    
    try:
        # Use recognition_registry table for witnesses
        witness = await conn.fetchrow("""
            INSERT INTO recognition_registry (
                id,
                instance_id,
                genesis_hash,
                public_key,
                signature,
                status,
                registered_at,
                verifications,
                challenges
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        """,
            uuid4(),
            f"{witness_type}:{str(witness_id)}",  # Store type in instance_id
            genesis_hash or "",
            public_key or "",
            display_name,  # Store name in signature field
            WitnessStatus.PENDING,
            datetime.utcnow(),
            [],
            []
        )
        
        return {
            "witness_id": str(witness_id),
            "witness_type": witness_type,
            "display_name": display_name,
            "status": witness["status"],
            "registered_at": witness["registered_at"].isoformat(),
            "verifications": witness["verifications"] or [],
            "challenges": witness["challenges"] or [],
            "public_key": public_key,
            "genesis_hash": genesis_hash,
            "metadata": metadata or {}
        }
    
    finally:
        await conn.close()

# ============================================================================
# Get Witness
# ============================================================================

async def get_witness(witness_id: UUID) -> Optional[Dict[str, Any]]:
    """Get a witness by ID."""
    conn = await get_connection()
    
    try:
        # Search by instance_id pattern
        witnesses = await conn.fetch("""
            SELECT * FROM recognition_registry
            WHERE instance_id LIKE $1
        """, f"%:{str(witness_id)}")
        
        if not witnesses:
            return None
        
        witness = witnesses[0]
        witness_type = witness["instance_id"].split(":")[0]
        
        return {
            "witness_id": str(witness_id),
            "witness_type": witness_type,
            "display_name": witness["signature"],
            "status": witness["status"],
            "registered_at": witness["registered_at"].isoformat(),
            "verifications": witness["verifications"] or [],
            "challenges": witness["challenges"] or [],
            "public_key": witness["public_key"],
            "genesis_hash": witness["genesis_hash"]
        }
    
    finally:
        await conn.close()

# ============================================================================
# List Witnesses
# ============================================================================

async def list_witnesses(
    witness_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    List witnesses with optional filters.
    
    Args:
        witness_type: Filter by witness type
        status: Filter by status
        limit: Max results
        offset: Pagination offset
    
    Returns:
        List of witnesses
    """
    conn = await get_connection()
    
    try:
        query = """
            SELECT * FROM recognition_registry
            WHERE 1=1
        """
        params = []
        param_count = 1
        
        if witness_type:
            query += f" AND instance_id LIKE ${param_count}"
            params.append(f"{witness_type}:%")
            param_count += 1
        
        if status:
            query += f" AND status = ${param_count}"
            params.append(status)
            param_count += 1
        
        query += f" ORDER BY registered_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        witnesses = []
        for row in rows:
            wtype = row["instance_id"].split(":")[0]
            wid = row["instance_id"].split(":")[1] if ":" in row["instance_id"] else ""
            
            witnesses.append({
                "witness_id": wid,
                "witness_type": wtype,
                "display_name": row["signature"],
                "status": row["status"],
                "registered_at": row["registered_at"].isoformat(),
                "verification_count": len(row["verifications"] or []),
                "challenge_count": len(row["challenges"] or [])
            })
        
        return witnesses
    
    finally:
        await conn.close()

# ============================================================================
# Verify Witness
# ============================================================================

async def verify_witness(
    witness_id: UUID,
    verifier_id: UUID,
    verification_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Add verification to a witness.
    
    Args:
        witness_id: Witness being verified
        verifier_id: User performing verification
        verification_data: Verification details
    
    Returns:
        Updated witness record
    """
    conn = await get_connection()
    
    try:
        # Find witness
        witnesses = await conn.fetch("""
            SELECT * FROM recognition_registry
            WHERE instance_id LIKE $1
        """, f"%:{str(witness_id)}")
        
        if not witnesses:
            raise ValueError("Witness not found")
        
        witness = witnesses[0]
        
        # Add verification
        verifications = list(witness["verifications"] or [])
        verifications.append({
            "verifier_id": str(verifier_id),
            "verified_at": datetime.utcnow().isoformat(),
            "data": verification_data
        })
        
        # Update witness
        updated = await conn.fetchrow("""
            UPDATE recognition_registry
            SET verifications = $1,
                status = CASE 
                    WHEN array_length($1, 1) >= 3 THEN 'verified'
                    ELSE status
                END
            WHERE id = $2
            RETURNING *
        """, verifications, witness["id"])
        
        witness_type = updated["instance_id"].split(":")[0]
        
        return {
            "witness_id": str(witness_id),
            "witness_type": witness_type,
            "display_name": updated["signature"],
            "status": updated["status"],
            "verifications": updated["verifications"],
            "verification_count": len(updated["verifications"] or [])
        }
    
    finally:
        await conn.close()

# ============================================================================
# Challenge Witness
# ============================================================================

async def challenge_witness(
    witness_id: UUID,
    challenger_id: UUID,
    challenge_reason: str,
    evidence: Optional[str] = None
) -> Dict[str, Any]:
    """
    Challenge a witness registration.
    
    Args:
        witness_id: Witness being challenged
        challenger_id: User making challenge
        challenge_reason: Reason for challenge
        evidence: Optional supporting evidence
    
    Returns:
        Challenge record
    """
    conn = await get_connection()
    
    try:
        # Find witness
        witnesses = await conn.fetch("""
            SELECT * FROM recognition_registry
            WHERE instance_id LIKE $1
        """, f"%:{str(witness_id)}")
        
        if not witnesses:
            raise ValueError("Witness not found")
        
        witness = witnesses[0]
        
        # Add challenge
        challenges = list(witness["challenges"] or [])
        challenge = {
            "challenger_id": str(challenger_id),
            "reason": challenge_reason,
            "evidence": evidence or "",
            "challenged_at": datetime.utcnow().isoformat(),
            "resolved": False
        }
        challenges.append(challenge)
        
        # Update witness status
        await conn.execute("""
            UPDATE recognition_registry
            SET challenges = $1,
                status = 'challenged'
            WHERE id = $2
        """, challenges, witness["id"])
        
        # Create verification challenge record
        challenge_record = await conn.fetchrow("""
            INSERT INTO verification_challenges (
                id,
                instance_id,
                challenger_id,
                claim,
                evidence,
                created_at,
                resolved,
                resolution
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """,
            uuid4(),
            witness["instance_id"],
            str(challenger_id),
            challenge_reason,
            evidence or "",
            datetime.utcnow(),
            False,
            None
        )
        
        return {
            "challenge_id": str(challenge_record["id"]),
            "witness_id": str(witness_id),
            "challenger_id": str(challenger_id),
            "reason": challenge_reason,
            "evidence": evidence,
            "created_at": challenge_record["created_at"].isoformat(),
            "resolved": False
        }
    
    finally:
        await conn.close()

# ============================================================================
# Resolve Challenge
# ============================================================================

async def resolve_challenge(
    challenge_id: UUID,
    resolution: str,
    resolved_by: UUID
) -> Dict[str, Any]:
    """
    Resolve a witness challenge.
    
    Args:
        challenge_id: Challenge to resolve
        resolution: Resolution details
        resolved_by: User resolving (must be guardian/admin)
    
    Returns:
        Resolved challenge record
    """
    conn = await get_connection()
    
    try:
        # Update challenge
        updated = await conn.fetchrow("""
            UPDATE verification_challenges
            SET resolved = TRUE,
                resolution = $1
            WHERE id = $2
            RETURNING *
        """, resolution, challenge_id)
        
        if not updated:
            raise ValueError("Challenge not found")
        
        return {
            "challenge_id": str(updated["id"]),
            "instance_id": updated["instance_id"],
            "resolved": updated["resolved"],
            "resolution": updated["resolution"],
            "resolved_at": datetime.utcnow().isoformat()
        }
    
    finally:
        await conn.close()

# ============================================================================
# Get Witness Stats
# ============================================================================

async def get_witness_stats(witness_type: Optional[str] = None) -> Dict[str, Any]:
    """Get witness statistics."""
    conn = await get_connection()
    
    try:
        if witness_type:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'challenged' THEN 1 ELSE 0 END) as challenged,
                    SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
                FROM recognition_registry
                WHERE instance_id LIKE $1
            """, f"{witness_type}:%")
        else:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'challenged' THEN 1 ELSE 0 END) as challenged,
                    SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
                FROM recognition_registry
            """)
        
        return {
            "total_witnesses": stats["total"] or 0,
            "verified": stats["verified"] or 0,
            "pending": stats["pending"] or 0,
            "challenged": stats["challenged"] or 0,
            "revoked": stats["revoked"] or 0
        }
    
    finally:
        await conn.close()

# ============================================================================
# Revoke Witness
# ============================================================================

async def revoke_witness(witness_id: UUID, reason: str, revoked_by: UUID) -> bool:
    """
    Revoke a witness (guardian/admin only).
    
    Args:
        witness_id: Witness to revoke
        reason: Revocation reason
        revoked_by: User revoking (must be guardian/admin)
    
    Returns:
        Success boolean
    """
    conn = await get_connection()
    
    try:
        # Find and update witness
        result = await conn.execute("""
            UPDATE recognition_registry
            SET status = 'revoked'
            WHERE instance_id LIKE $1
        """, f"%:{str(witness_id)}")
        
        return result is not None
    
    finally:
        await conn.close()
