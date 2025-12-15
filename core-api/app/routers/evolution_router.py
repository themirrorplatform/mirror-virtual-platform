"""
Evolution API Router - REST endpoints for distributed evolution

Provides HTTP API for:
- Creating and managing proposals
- Casting votes on proposals
- Viewing proposal status and results
- Managing evolution versions
- Syncing with commons
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.services.evolution_engine import (
    EvolutionEngine, EvolutionProposal, ProposalType, ProposalStatus,
    VoteChoice, EvolutionVersion
)
from mirror_os.services.commons_sync import CommonsSync


# Pydantic models for request/response

class ProposalCreate(BaseModel):
    """Request model for creating a proposal"""
    type: str = Field(..., description="Proposal type (pattern_add, tension_add, etc.)")
    title: str = Field(..., min_length=5, max_length=200, description="Proposal title")
    description: str = Field(..., min_length=20, description="Detailed description and rationale")
    content: Dict[str, Any] = Field(..., description="Proposal-specific content")
    proposer_identity_id: str = Field(..., description="Identity creating the proposal")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class VoteCreate(BaseModel):
    """Request model for casting a vote"""
    identity_id: str = Field(..., description="Identity casting the vote")
    choice: str = Field(..., description="Vote choice: for, against, or abstain")
    reasoning: Optional[str] = Field(None, description="Optional reasoning for the vote")


class ProposalResponse(BaseModel):
    """Response model for a proposal"""
    id: str
    type: str
    title: str
    description: str
    content: Dict[str, Any]
    proposer_identity_id: str
    status: str
    votes_for: int
    votes_against: int
    votes_abstain: int
    total_vote_weight: float
    vote_percentage: float
    consensus_threshold: float
    has_reached_consensus: bool
    is_voting_open: bool
    created_at: str
    voting_ends_at: str
    metadata: Dict[str, Any]


class VersionCreate(BaseModel):
    """Request model for creating a version"""
    version_number: str = Field(..., description="Version number (e.g., 2.0.0)")
    description: str = Field(..., description="Description of changes")
    approved_proposals: List[str] = Field(..., description="List of approved proposal IDs")


class VersionResponse(BaseModel):
    """Response model for a version"""
    id: str
    version_number: str
    description: str
    approved_proposals: List[str]
    rollout_percentage: int
    is_active: bool
    created_at: str


# Router setup
router = APIRouter(prefix="/api/evolution", tags=["evolution"])
limiter = Limiter(key_func=get_remote_address)


# Dependency for getting storage
def get_storage():
    """Get storage instance"""
    # In production, this would use dependency injection
    # For now, create new instance
    storage = SQLiteStorage("mirror.db", schema_path="mirror_os/schemas/sqlite/001_core.sql")
    try:
        yield storage
    finally:
        storage.close()


def get_evolution_engine(storage: SQLiteStorage = Depends(get_storage)):
    """Get evolution engine instance"""
    return EvolutionEngine(storage)


def get_commons_sync(
    storage: SQLiteStorage = Depends(get_storage),
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """Get commons sync instance"""
    return CommonsSync(storage, engine)


# Proposal Endpoints

@router.post("/proposals", response_model=ProposalResponse, status_code=201)
@limiter.limit("10/minute")
def create_proposal(
    request: Request,
    proposal: ProposalCreate,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Create a new evolution proposal
    
    Creates a proposal in DRAFT status. Use activate endpoint to open for voting.
    """
    try:
        created = engine.create_proposal(
            proposal_type=ProposalType(proposal.type),
            title=proposal.title,
            description=proposal.description,
            content=proposal.content,
            proposer_identity_id=proposal.proposer_identity_id,
            metadata=proposal.metadata
        )
        
        return ProposalResponse(
            id=created.id,
            type=created.type.value,
            title=created.title,
            description=created.description,
            content=created.content,
            proposer_identity_id=created.proposer_identity_id,
            status=created.status.value,
            votes_for=created.votes_for,
            votes_against=created.votes_against,
            votes_abstain=created.votes_abstain,
            total_vote_weight=created.total_vote_weight,
            vote_percentage=created.get_vote_percentage(),
            consensus_threshold=created.consensus_threshold,
            has_reached_consensus=created.has_reached_consensus(),
            is_voting_open=created.is_voting_open(),
            created_at=created.created_at.isoformat() + 'Z',
            voting_ends_at=created.voting_ends_at.isoformat() + 'Z',
            metadata=created.metadata
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/proposals", response_model=List[ProposalResponse])
@limiter.limit("30/minute")
def list_proposals(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status"),
    proposal_type: Optional[str] = Query(None, description="Filter by type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    List evolution proposals with optional filtering
    """
    try:
        status_filter = ProposalStatus(status) if status else None
        type_filter = ProposalType(proposal_type) if proposal_type else None
        
        proposals = engine.list_proposals(
            status=status_filter,
            proposal_type=type_filter,
            limit=limit
        )
        
        return [
            ProposalResponse(
                id=p.id,
                type=p.type.value,
                title=p.title,
                description=p.description,
                content=p.content,
                proposer_identity_id=p.proposer_identity_id,
                status=p.status.value,
                votes_for=p.votes_for,
                votes_against=p.votes_against,
                votes_abstain=p.votes_abstain,
                total_vote_weight=p.total_vote_weight,
                vote_percentage=p.get_vote_percentage(),
                consensus_threshold=p.consensus_threshold,
                has_reached_consensus=p.has_reached_consensus(),
                is_voting_open=p.is_voting_open(),
                created_at=p.created_at.isoformat() + 'Z',
                voting_ends_at=p.voting_ends_at.isoformat() + 'Z',
                metadata=p.metadata
            )
            for p in proposals
        ]
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid filter value: {str(e)}")


@router.get("/proposals/{proposal_id}", response_model=ProposalResponse)
@limiter.limit("30/minute")
def get_proposal(
    request: Request,
    proposal_id: str,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Get a specific proposal by ID
    """
    proposal = engine.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    return ProposalResponse(
        id=proposal.id,
        type=proposal.type.value,
        title=proposal.title,
        description=proposal.description,
        content=proposal.content,
        proposer_identity_id=proposal.proposer_identity_id,
        status=proposal.status.value,
        votes_for=proposal.votes_for,
        votes_against=proposal.votes_against,
        votes_abstain=proposal.votes_abstain,
        total_vote_weight=proposal.total_vote_weight,
        vote_percentage=proposal.get_vote_percentage(),
        consensus_threshold=proposal.consensus_threshold,
        has_reached_consensus=proposal.has_reached_consensus(),
        is_voting_open=proposal.is_voting_open(),
        created_at=proposal.created_at.isoformat() + 'Z',
        voting_ends_at=proposal.voting_ends_at.isoformat() + 'Z',
        metadata=proposal.metadata
    )


@router.post("/proposals/{proposal_id}/activate")
@limiter.limit("10/minute")
def activate_proposal(
    request: Request,
    proposal_id: str,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Activate a proposal for voting
    
    Changes status from DRAFT to ACTIVE, opening it for community votes.
    """
    success = engine.activate_proposal(proposal_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Cannot activate proposal (not found or not in draft status)"
        )
    
    return {"status": "success", "message": "Proposal activated for voting", "proposal_id": proposal_id}


# Voting Endpoints

@router.post("/proposals/{proposal_id}/vote")
@limiter.limit("10/minute")
def cast_vote(
    request: Request,
    proposal_id: str,
    vote: VoteCreate,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Cast a vote on a proposal
    
    Vote is weighted based on identity's activity (reflection count).
    """
    try:
        choice = VoteChoice(vote.choice)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid vote choice. Must be: for, against, or abstain"
        )
    
    success, message = engine.cast_vote(
        proposal_id=proposal_id,
        identity_id=vote.identity_id,
        choice=choice,
        reasoning=vote.reasoning or ""
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Get updated proposal
    proposal = engine.get_proposal(proposal_id)
    
    return {
        "status": "success",
        "message": message,
        "proposal_id": proposal_id,
        "vote_percentage": proposal.get_vote_percentage() if proposal else 0,
        "has_reached_consensus": proposal.has_reached_consensus() if proposal else False
    }


@router.get("/proposals/{proposal_id}/votes")
@limiter.limit("30/minute")
def get_proposal_votes(
    request: Request,
    proposal_id: str,
    storage: SQLiteStorage = Depends(get_storage)
):
    """
    Get all votes for a proposal
    """
    cursor = storage.conn.execute(
        "SELECT * FROM evolution_votes WHERE proposal_id = ? ORDER BY created_at DESC",
        (proposal_id,)
    )
    votes = []
    
    for row in cursor.fetchall():
        votes.append({
            "id": row["id"],
            "identity_id": row["identity_id"],
            "choice": row["choice"],
            "weight": row["weight"],
            "reasoning": row["reasoning"],
            "created_at": row["created_at"]
        })
    
    return {
        "proposal_id": proposal_id,
        "total_votes": len(votes),
        "votes": votes
    }


# Version Endpoints

@router.post("/versions", response_model=VersionResponse, status_code=201)
@limiter.limit("5/minute")
def create_version(
    request: Request,
    version: VersionCreate,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Create a new evolution version from approved proposals
    """
    created = engine.create_version(
        version_number=version.version_number,
        description=version.description,
        approved_proposals=version.approved_proposals
    )
    
    return VersionResponse(
        id=created.id,
        version_number=created.version_number,
        description=created.description,
        approved_proposals=created.approved_proposals,
        rollout_percentage=created.rollout_percentage,
        is_active=created.is_active,
        created_at=created.created_at.isoformat() + 'Z'
    )


@router.get("/versions")
@limiter.limit("30/minute")
def list_versions(
    request: Request,
    storage: SQLiteStorage = Depends(get_storage)
):
    """
    List all evolution versions
    """
    cursor = storage.conn.execute(
        "SELECT * FROM evolution_versions ORDER BY created_at DESC"
    )
    versions = []
    
    for row in cursor.fetchall():
        import json
        versions.append(VersionResponse(
            id=row["id"],
            version_number=row["version_number"],
            description=row["description"],
            approved_proposals=json.loads(row["approved_proposals"]) if row["approved_proposals"] else [],
            rollout_percentage=row["rollout_percentage"],
            is_active=row["is_active"],
            created_at=row["created_at"]
        ))
    
    return {"versions": versions, "total": len(versions)}


@router.get("/versions/active", response_model=VersionResponse)
@limiter.limit("30/minute")
def get_active_version(
    request: Request,
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Get the currently active version
    """
    version = engine.get_active_version()
    if not version:
        raise HTTPException(status_code=404, detail="No active version found")
    
    return VersionResponse(
        id=version.id,
        version_number=version.version_number,
        description=version.description,
        approved_proposals=version.approved_proposals,
        rollout_percentage=version.rollout_percentage,
        is_active=version.is_active,
        created_at=version.created_at.isoformat() + 'Z'
    )


@router.post("/versions/{version_id}/rollout")
@limiter.limit("5/minute")
def rollout_version(
    request: Request,
    version_id: str,
    target_percentage: int = Query(..., ge=0, le=100, description="Target rollout percentage"),
    engine: EvolutionEngine = Depends(get_evolution_engine)
):
    """
    Gradually roll out a version
    
    Supported percentages: 10, 50, 100
    """
    success = engine.rollout_version(version_id, target_percentage)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid rollout percentage. Must be: 10, 50, or 100"
        )
    
    return {
        "status": "success",
        "message": f"Version rolled out to {target_percentage}%",
        "version_id": version_id,
        "rollout_percentage": target_percentage
    }


# Commons Sync Endpoints

@router.post("/proposals/{proposal_id}/broadcast")
@limiter.limit("10/minute")
def broadcast_proposal(
    request: Request,
    proposal_id: str,
    commons_sync: CommonsSync = Depends(get_commons_sync)
):
    """
    Broadcast a proposal to the commons for wider voting
    """
    result = commons_sync.broadcast_proposal(proposal_id)
    
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/proposals/{proposal_id}/aggregate-votes")
@limiter.limit("10/minute")
def aggregate_votes(
    request: Request,
    proposal_id: str,
    commons_sync: CommonsSync = Depends(get_commons_sync)
):
    """
    Aggregate votes from the commons for a proposal
    """
    result = commons_sync.aggregate_votes(proposal_id)
    
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to aggregate votes"))
    
    return result


@router.get("/sync/status")
@limiter.limit("30/minute")
def get_sync_status(
    request: Request,
    commons_sync: CommonsSync = Depends(get_commons_sync)
):
    """
    Get current sync status with commons
    """
    return commons_sync.get_sync_status()


@router.post("/sync/enable")
@limiter.limit("5/minute")
def enable_sync(
    request: Request,
    commons_url: str = Query(..., description="URL of commons API"),
    commons_sync: CommonsSync = Depends(get_commons_sync)
):
    """
    Enable sync with commons
    """
    commons_sync.enable_sync(commons_url)
    return {"status": "success", "message": "Sync enabled", "commons_url": commons_url}


@router.post("/sync/disable")
@limiter.limit("5/minute")
def disable_sync(
    request: Request,
    commons_sync: CommonsSync = Depends(get_commons_sync)
):
    """
    Disable sync with commons
    """
    commons_sync.disable_sync()
    return {"status": "success", "message": "Sync disabled"}


# Statistics Endpoints

@router.get("/stats")
@limiter.limit("30/minute")
def get_evolution_stats(
    request: Request,
    storage: SQLiteStorage = Depends(get_storage)
):
    """
    Get evolution system statistics
    """
    # Count proposals by status
    cursor = storage.conn.execute(
        """
        SELECT status, COUNT(*) as count 
        FROM evolution_proposals 
        GROUP BY status
        """
    )
    proposals_by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
    
    # Count total votes
    cursor = storage.conn.execute("SELECT COUNT(*) as count FROM evolution_votes")
    total_votes = cursor.fetchone()["count"]
    
    # Count versions
    cursor = storage.conn.execute("SELECT COUNT(*) as count FROM evolution_versions")
    total_versions = cursor.fetchone()["count"]
    
    # Get active proposals
    cursor = storage.conn.execute(
        "SELECT COUNT(*) as count FROM evolution_proposals WHERE status = ?",
        (ProposalStatus.ACTIVE.value,)
    )
    active_proposals = cursor.fetchone()["count"]
    
    return {
        "proposals_by_status": proposals_by_status,
        "total_proposals": sum(proposals_by_status.values()),
        "active_proposals": active_proposals,
        "total_votes": total_votes,
        "total_versions": total_versions
    }
