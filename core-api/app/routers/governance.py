"""
Governance Router - Evolution proposals, voting, system status

Exposes MirrorX governance capabilities via REST API:
- Submit evolution proposals
- Vote on proposals
- Get system status
- Guardian operations (amendments)
- Encryption management
- Disconnect from Commons
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.auth import require_auth
import logging

logger = logging.getLogger("mirror.governance")

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ────────────────────────────────────────────────────────────────────────────
# REQUEST/RESPONSE MODELS
# ────────────────────────────────────────────────────────────────────────────

class ProposalCreate(BaseModel):
    """Evolution proposal submission"""
    proposal_type: str  # pattern_add, pattern_modify, tension_add, etc.
    title: str
    description: str
    changes: Dict[str, Any]


class VoteCreate(BaseModel):
    """Vote on a proposal"""
    vote: str  # for, against, abstain
    reasoning: str


class AmendmentCreate(BaseModel):
    """Constitutional amendment proposal"""
    amendment_type: str
    title: str
    description: str
    proposed_changes: Dict[str, Any]


class EncryptionInit(BaseModel):
    """Initialize encryption"""
    passphrase: str


class EncryptionUnlock(BaseModel):
    """Unlock encryption"""
    passphrase: str


# ────────────────────────────────────────────────────────────────────────────
# ORCHESTRATOR DEPENDENCY
# ────────────────────────────────────────────────────────────────────────────

_orchestrator = None

def get_orchestrator():
    """Get or initialize the MirrorX orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        from mirrorx.orchestrator import MirrorXOrchestrator
        from mirror_os.storage.sqlite_storage import SQLiteStorage
        from pathlib import Path
        import os
        
        # Get database path from environment or use default
        # The orchestrator uses its own SQLite database separate from the main PostgreSQL DB
        db_path = os.getenv("MIRRORX_DB_PATH", "mirror_os.db")
        
        # Get schema path
        schema_path = Path(__file__).parent.parent.parent.parent / 'mirror_os' / 'schemas' / 'sqlite' / '001_core.sql'
        
        # Initialize storage
        storage = SQLiteStorage(db_path, schema_path=str(schema_path))
        
        # Initialize orchestrator
        _orchestrator = MirrorXOrchestrator(storage)
        logger.info(f"Orchestrator initialized with database: {db_path}")
    
    return _orchestrator


# ────────────────────────────────────────────────────────────────────────────
# EVOLUTION ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.post("/proposals")
@limiter.limit("10/minute")
async def submit_proposal(
    request: Request,
    proposal: ProposalCreate,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Submit an evolution proposal.
    
    The proposal goes through constitutional checks before being accepted.
    """
    try:
        result = orchestrator.submit_evolution_proposal(
            identity_id=user_id,
            proposal_type=proposal.proposal_type,
            title=proposal.title,
            description=proposal.description,
            changes=proposal.changes
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error submitting proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proposals/{proposal_id}/vote")
@limiter.limit("10/minute")
async def vote_on_proposal(
    request: Request,
    proposal_id: str,
    vote: VoteCreate,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Vote on an evolution proposal.
    
    Includes integrity checks to prevent manipulation.
    """
    try:
        result = orchestrator.vote_on_proposal(
            identity_id=user_id,
            proposal_id=proposal_id,
            vote=vote.vote,
            reasoning=vote.reasoning
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error voting on proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proposals")
@limiter.limit("30/minute")
async def list_proposals(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    List evolution proposals with optional filtering.
    
    Query parameters:
    - limit: Maximum number of proposals to return (default: 50)
    - offset: Number of proposals to skip (default: 0)
    - status: Filter by status (active, approved, rejected, draft)
    """
    try:
        from mirror_os.services.evolution_engine import EvolutionEngine
        engine = EvolutionEngine(orchestrator.storage)
        
        # Query proposals from storage
        proposals = engine.list_proposals(limit=limit, offset=offset, status=status)
        
        # Convert to dict format
        proposal_dicts = [p.to_dict() for p in proposals]
        
        return {
            "proposals": proposal_dicts,
            "total": len(proposal_dicts),
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        logger.error(f"Error listing proposals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proposals/{proposal_id}")
@limiter.limit("30/minute")
async def get_proposal(
    request: Request,
    proposal_id: str,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """Get details of a specific proposal"""
    try:
        from mirror_os.services.evolution_engine import EvolutionEngine
        engine = EvolutionEngine(orchestrator.storage)
        proposal = engine.get_proposal(proposal_id)
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return proposal.to_dict()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ────────────────────────────────────────────────────────────────────────────
# GUARDIAN ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.post("/guardians/appoint")
@limiter.limit("5/minute")
async def appoint_guardian(
    request: Request,
    guardian_id: str,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Appoint a new guardian (requires existing guardian status).
    
    Guardians can propose constitutional amendments.
    """
    try:
        result = orchestrator.appoint_guardian(
            proposer_id=user_id,
            candidate_id=guardian_id
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error appointing guardian: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/amendments")
@limiter.limit("5/minute")
async def propose_amendment(
    request: Request,
    amendment: AmendmentCreate,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Propose a constitutional amendment (guardians only).
    
    Requires 75% supermajority to pass.
    """
    try:
        result = orchestrator.propose_constitutional_amendment(
            proposer_id=user_id,
            amendment_type=amendment.amendment_type,
            title=amendment.title,
            description=amendment.description,
            proposed_changes=amendment.proposed_changes
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error proposing amendment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ────────────────────────────────────────────────────────────────────────────
# SYSTEM STATUS ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.get("/status")
@limiter.limit("30/minute")
async def get_system_status(
    request: Request,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Get comprehensive system status.
    
    Returns status of all governance subsystems:
    - Encryption
    - Learning exclusion
    - Model verification
    - Multimodal processing
    - Evolution system (frozen/active)
    - Commons connection
    - Guardian status
    """
    try:
        status = orchestrator.get_system_status(user_id)
        return status
    
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ────────────────────────────────────────────────────────────────────────────
# ENCRYPTION ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.post("/encryption/init")
@limiter.limit("5/minute")
async def initialize_encryption(
    request: Request,
    data: EncryptionInit,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """Initialize local encryption for user's data"""
    try:
        result = orchestrator.encryption.initialize_encryption(
            identity_id=user_id,
            passphrase=data.passphrase
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error initializing encryption: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/encryption/unlock")
@limiter.limit("10/minute")
async def unlock_encryption(
    request: Request,
    data: EncryptionUnlock,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """Unlock encryption to access encrypted data"""
    try:
        result = orchestrator.encryption.unlock_encryption(
            identity_id=user_id,
            passphrase=data.passphrase
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error unlocking encryption: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/encryption/status")
@limiter.limit("30/minute")
async def get_encryption_status(
    request: Request,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """Get encryption status for user"""
    try:
        status = orchestrator.encryption.get_encryption_status(user_id)
        return status
    
    except Exception as e:
        logger.error(f"Error getting encryption status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ────────────────────────────────────────────────────────────────────────────
# DISCONNECT ENDPOINT
# ────────────────────────────────────────────────────────────────────────────

@router.post("/disconnect")
@limiter.limit("5/minute")
async def disconnect_from_commons(
    request: Request,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """
    Disconnect from Commons and generate cryptographic proof.
    
    This is irreversible. User's data remains local but will not
    participate in shared evolution.
    """
    try:
        result = orchestrator.disconnect_from_commons(user_id)
        return result
    
    except Exception as e:
        logger.error(f"Error disconnecting from Commons: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/disconnect/status")
@limiter.limit("30/minute")
async def get_disconnect_status(
    request: Request,
    user_id: str = Depends(require_auth),
    orchestrator = Depends(get_orchestrator)
):
    """Check if user is disconnected from Commons"""
    try:
        is_disconnected = orchestrator.disconnect_proof.is_user_disconnected(user_id)
        return {
            "disconnected": is_disconnected,
            "connected_to_commons": not is_disconnected
        }
    
    except Exception as e:
        logger.error(f"Error checking disconnect status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
