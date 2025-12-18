"""
Commons API Router
Endpoints for publications, attestations, and witness registry
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.services import commons_publications as pubs
from app.services import commons_attestations as atts
from app.services import commons_witnesses as witnesses

router = APIRouter(prefix="/commons", tags=["commons"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

# --- Publication Models ---

class PublicationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    publication_type: str = Field(..., description="Type: reflection, pattern, insight, guide, amendment")
    tags: Optional[List[str]] = Field(default=None, max_items=20)
    metadata: Optional[Dict[str, Any]] = None

class PublicationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, description="Status: draft, published, archived, challenged")
    tags: Optional[List[str]] = Field(None, max_items=20)

class PublicationResponse(BaseModel):
    publication_id: str
    author_id: str
    title: str
    content: str
    publication_type: str
    status: str
    created_at: str
    tags: List[str]
    attestations: int = 0
    challenges: int = 0
    views: int = 0
    guardian_review: Optional[str] = None
    implementation_date: Optional[str] = None
    metadata: Dict[str, Any] = {}

class PublicationSummary(BaseModel):
    publication_id: str
    author_id: str
    title: str
    publication_type: str
    status: str
    created_at: str
    attestations: int
    challenges: int
    views: int

class PublicationStatsResponse(BaseModel):
    total_publications: int
    published: int
    drafts: int
    total_attestations: int
    total_challenges: int
    total_views: int

# --- Attestation Models ---

class AttestationCreate(BaseModel):
    publication_id: UUID
    attestation_type: str = Field(..., description="Type: support, verify, witness, vouch, challenge, amplify")
    comment: Optional[str] = Field(None, max_length=2000)
    metadata: Optional[Dict[str, Any]] = None

class AttestationResponse(BaseModel):
    attestation_id: str
    publication_id: str
    attester_id: str
    attestation_type: str
    comment: str
    status: str
    created_at: str
    metadata: Dict[str, Any] = {}

class AttestationStatsResponse(BaseModel):
    total_attestations: int
    by_type: Dict[str, int]

class TrustScoreResponse(BaseModel):
    user_id: str
    trust_score: float
    attestations_received: int
    unique_attestors: int
    challenge_ratio: float

class VerificationResponse(BaseModel):
    publication_id: str
    verified: bool
    verification_score: float
    attestation_count: int
    unique_attestors: int = 0
    verify_count: int = 0
    vouch_count: int = 0
    challenge_count: int = 0
    reason: str

# --- Witness Models ---

class WitnessRegister(BaseModel):
    witness_id: UUID
    witness_type: str = Field(..., description="Type: identity, experience, transformation, guardian, mirror")
    display_name: str = Field(..., min_length=1, max_length=200)
    public_key: Optional[str] = None
    genesis_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class WitnessResponse(BaseModel):
    witness_id: str
    witness_type: str
    display_name: str
    status: str
    registered_at: str
    verifications: List[Any] = []
    challenges: List[Any] = []
    public_key: Optional[str] = None
    genesis_hash: Optional[str] = None
    metadata: Dict[str, Any] = {}

class WitnessSummary(BaseModel):
    witness_id: str
    witness_type: str
    display_name: str
    status: str
    registered_at: str
    verification_count: int
    challenge_count: int

class WitnessVerify(BaseModel):
    verifier_id: UUID
    verification_data: Dict[str, Any]

class WitnessChallenge(BaseModel):
    challenger_id: UUID
    challenge_reason: str
    evidence: Optional[str] = None

class ChallengeResolve(BaseModel):
    resolution: str
    resolved_by: UUID

class ChallengeResponse(BaseModel):
    challenge_id: str
    witness_id: str
    challenger_id: str
    reason: str
    evidence: Optional[str]
    created_at: str
    resolved: bool

class WitnessStatsResponse(BaseModel):
    total_witnesses: int
    verified: int
    pending: int
    challenged: int
    revoked: int

# ============================================================================
# PUBLICATIONS ENDPOINTS
# ============================================================================

@router.post("/publications", response_model=PublicationResponse)
async def create_publication(pub: PublicationCreate, user_id: UUID = Query(...)):
    """Create a new publication in the Commons."""
    try:
        result = await pubs.create_publication(
            user_id=user_id,
            title=pub.title,
            content=pub.content,
            publication_type=pub.publication_type,
            tags=pub.tags,
            metadata=pub.metadata
        )
        return PublicationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/publications/{publication_id}", response_model=PublicationResponse)
async def get_publication(publication_id: UUID):
    """Get a publication by ID."""
    result = await pubs.get_publication(publication_id)
    if not result:
        raise HTTPException(status_code=404, detail="Publication not found")
    
    # Increment view count
    await pubs.increment_view_count(publication_id)
    
    return PublicationResponse(**result)

@router.get("/publications", response_model=List[PublicationSummary])
async def list_publications(
    user_id: Optional[UUID] = Query(None, description="Filter by author"),
    publication_type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List publications with optional filters."""
    try:
        results = await pubs.list_publications(
            user_id=user_id,
            publication_type=publication_type,
            status=status,
            limit=limit,
            offset=offset
        )
        return [PublicationSummary(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/publications/{publication_id}", response_model=PublicationResponse)
async def update_publication(
    publication_id: UUID,
    update: PublicationUpdate,
    user_id: UUID = Query(...)
):
    """Update a publication (only by author)."""
    try:
        result = await pubs.update_publication(
            publication_id=publication_id,
            user_id=user_id,
            title=update.title,
            content=update.content,
            status=update.status,
            tags=update.tags
        )
        return PublicationResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/publications/{publication_id}")
async def delete_publication(publication_id: UUID, user_id: UUID = Query(...)):
    """Delete a publication (only by author or if draft)."""
    try:
        success = await pubs.delete_publication(publication_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Publication not found")
        return {"message": "Publication deleted", "publication_id": str(publication_id)}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/publications/stats/summary", response_model=PublicationStatsResponse)
async def get_publication_stats(user_id: Optional[UUID] = Query(None)):
    """Get publication statistics."""
    try:
        result = await pubs.get_publication_stats(user_id)
        return PublicationStatsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ATTESTATIONS ENDPOINTS
# ============================================================================

@router.post("/attestations", response_model=AttestationResponse)
async def create_attestation(att: AttestationCreate, attester_id: UUID = Query(...)):
    """Create an attestation for a publication."""
    try:
        result = await atts.create_attestation(
            publication_id=att.publication_id,
            attester_id=attester_id,
            attestation_type=att.attestation_type,
            comment=att.comment,
            metadata=att.metadata
        )
        return AttestationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attestations/{attestation_id}", response_model=AttestationResponse)
async def get_attestation(attestation_id: UUID):
    """Get an attestation by ID."""
    result = await atts.get_attestation(attestation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Attestation not found")
    return AttestationResponse(**result)

@router.get("/attestations", response_model=List[AttestationResponse])
async def list_attestations(
    publication_id: Optional[UUID] = Query(None, description="Filter by publication"),
    attester_id: Optional[UUID] = Query(None, description="Filter by attester"),
    attestation_type: Optional[str] = Query(None, description="Filter by type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """List attestations with optional filters."""
    try:
        results = await atts.list_attestations(
            publication_id=publication_id,
            attester_id=attester_id,
            attestation_type=attestation_type,
            limit=limit,
            offset=offset
        )
        return [AttestationResponse(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/attestations/{attestation_id}")
async def withdraw_attestation(attestation_id: UUID, attester_id: UUID = Query(...)):
    """Withdraw an attestation (only by original attester)."""
    try:
        success = await atts.withdraw_attestation(attestation_id, attester_id)
        if not success:
            raise HTTPException(status_code=404, detail="Attestation not found")
        return {"message": "Attestation withdrawn", "attestation_id": str(attestation_id)}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attestations/stats/summary", response_model=AttestationStatsResponse)
async def get_attestation_stats(
    publication_id: Optional[UUID] = Query(None),
    attester_id: Optional[UUID] = Query(None)
):
    """Get attestation statistics."""
    try:
        result = await atts.get_attestation_stats(
            publication_id=publication_id,
            attester_id=attester_id
        )
        return AttestationStatsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trust-score/{user_id}", response_model=TrustScoreResponse)
async def get_trust_score(user_id: UUID):
    """Calculate trust score for a user."""
    try:
        result = await atts.get_trust_score(user_id)
        return TrustScoreResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{publication_id}", response_model=VerificationResponse)
async def verify_attestation_chain(publication_id: UUID):
    """Verify the attestation chain for a publication."""
    try:
        result = await atts.verify_attestation_chain(publication_id)
        return VerificationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# WITNESSES ENDPOINTS
# ============================================================================

@router.post("/witnesses", response_model=WitnessResponse)
async def register_witness(witness: WitnessRegister):
    """Register a new witness in the registry."""
    try:
        result = await witnesses.register_witness(
            witness_id=witness.witness_id,
            witness_type=witness.witness_type,
            display_name=witness.display_name,
            public_key=witness.public_key,
            genesis_hash=witness.genesis_hash,
            metadata=witness.metadata
        )
        return WitnessResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/witnesses/{witness_id}", response_model=WitnessResponse)
async def get_witness(witness_id: UUID):
    """Get a witness by ID."""
    result = await witnesses.get_witness(witness_id)
    if not result:
        raise HTTPException(status_code=404, detail="Witness not found")
    return WitnessResponse(**result)

@router.get("/witnesses", response_model=List[WitnessSummary])
async def list_witnesses(
    witness_type: Optional[str] = Query(None, description="Filter by witness type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """List witnesses with optional filters."""
    try:
        results = await witnesses.list_witnesses(
            witness_type=witness_type,
            status=status,
            limit=limit,
            offset=offset
        )
        return [WitnessSummary(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/witnesses/{witness_id}/verify", response_model=WitnessResponse)
async def verify_witness(witness_id: UUID, verify: WitnessVerify):
    """Add verification to a witness."""
    try:
        result = await witnesses.verify_witness(
            witness_id=witness_id,
            verifier_id=verify.verifier_id,
            verification_data=verify.verification_data
        )
        return WitnessResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/witnesses/{witness_id}/challenge", response_model=ChallengeResponse)
async def challenge_witness(witness_id: UUID, challenge: WitnessChallenge):
    """Challenge a witness registration."""
    try:
        result = await witnesses.challenge_witness(
            witness_id=witness_id,
            challenger_id=challenge.challenger_id,
            challenge_reason=challenge.challenge_reason,
            evidence=challenge.evidence
        )
        return ChallengeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/challenges/{challenge_id}/resolve")
async def resolve_challenge(challenge_id: UUID, resolve: ChallengeResolve):
    """Resolve a witness challenge (guardian/admin only)."""
    try:
        result = await witnesses.resolve_challenge(
            challenge_id=challenge_id,
            resolution=resolve.resolution,
            resolved_by=resolve.resolved_by
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/witnesses/stats/summary", response_model=WitnessStatsResponse)
async def get_witness_stats(witness_type: Optional[str] = Query(None)):
    """Get witness statistics."""
    try:
        result = await witnesses.get_witness_stats(witness_type)
        return WitnessStatsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/witnesses/{witness_id}/revoke")
async def revoke_witness(
    witness_id: UUID,
    reason: str = Query(...),
    revoked_by: UUID = Query(...)
):
    """Revoke a witness (guardian/admin only)."""
    try:
        success = await witnesses.revoke_witness(witness_id, reason, revoked_by)
        if not success:
            raise HTTPException(status_code=404, detail="Witness not found")
        return {"message": "Witness revoked", "witness_id": str(witness_id), "reason": reason}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Commons system health check."""
    return {
        "status": "healthy",
        "service": "commons",
        "endpoints": {
            "publications": 6,
            "attestations": 7,
            "witnesses": 8
        },
        "timestamp": datetime.utcnow().isoformat()
    }
