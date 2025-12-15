"""
Evolution Engine - Distributed evolution through voting and consensus

Enables the Mirror ecosystem to evolve patterns, tensions, and constitutional rules
through a democratic voting process with weighted consensus.

Key Concepts:
- Proposals: Any mirror can propose changes to shared knowledge (patterns, tensions)
- Voting: Weighted by activity (reflection count) to prevent Sybil attacks
- Consensus: 67% threshold for approval
- Gradual Rollout: Approved changes phase in slowly (10% → 50% → 100%)
- Version Management: Track evolution history and allow rollback
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import json
import uuid


class ProposalType(str, Enum):
    """Types of evolution proposals"""
    PATTERN_ADD = "pattern_add"           # Add new pattern definition
    PATTERN_MODIFY = "pattern_modify"     # Modify existing pattern
    PATTERN_REMOVE = "pattern_remove"     # Remove pattern
    TENSION_ADD = "tension_add"           # Add new tension axis
    TENSION_MODIFY = "tension_modify"     # Modify tension definition
    CONSTITUTIONAL_ADD = "constitutional_add"      # Add constitutional rule
    CONSTITUTIONAL_MODIFY = "constitutional_modify"  # Modify rule
    ENGINE_UPDATE = "engine_update"       # Update engine behavior


class ProposalStatus(str, Enum):
    """Lifecycle states of a proposal"""
    DRAFT = "draft"                # Being edited by proposer
    ACTIVE = "active"              # Open for voting
    APPROVED = "approved"          # Passed consensus threshold
    REJECTED = "rejected"          # Failed to reach consensus
    ROLLED_OUT = "rolled_out"      # Fully deployed
    ROLLED_BACK = "rolled_back"    # Reverted after deployment


class VoteChoice(str, Enum):
    """Vote options"""
    FOR = "for"
    AGAINST = "against"
    ABSTAIN = "abstain"


class EvolutionProposal:
    """
    Represents a proposal for evolving the mirror ecosystem
    """
    
    def __init__(
        self,
        proposal_id: Optional[str] = None,
        proposal_type: ProposalType = ProposalType.PATTERN_ADD,
        title: str = "",
        description: str = "",
        content: Dict[str, Any] = None,
        proposer_identity_id: str = "",
        status: ProposalStatus = ProposalStatus.DRAFT,
        votes_for: int = 0,
        votes_against: int = 0,
        votes_abstain: int = 0,
        total_vote_weight: float = 0.0,
        consensus_threshold: float = 0.67,
        created_at: Optional[datetime] = None,
        voting_ends_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = proposal_id or str(uuid.uuid4())
        self.type = proposal_type
        self.title = title
        self.description = description
        self.content = content or {}
        self.proposer_identity_id = proposer_identity_id
        self.status = status
        self.votes_for = votes_for
        self.votes_against = votes_against
        self.votes_abstain = votes_abstain
        self.total_vote_weight = total_vote_weight
        self.consensus_threshold = consensus_threshold
        self.created_at = created_at or datetime.utcnow()
        self.voting_ends_at = voting_ends_at or (self.created_at + timedelta(days=7))
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "id": self.id,
            "type": self.type.value,
            "title": self.title,
            "description": self.description,
            "changes": json.dumps(self.content),  # Store as 'changes' for schema compatibility
            "proposer_identity_id": self.proposer_identity_id,
            "status": self.status.value,
            "votes_for": self.votes_for,
            "votes_against": self.votes_against,
            "votes_abstain": self.votes_abstain,
            "total_vote_weight": self.total_vote_weight,
            "consensus_threshold": self.consensus_threshold,
            "created_at": self.created_at.isoformat() + 'Z',
            "voting_ends_at": self.voting_ends_at.isoformat() + 'Z',
            "metadata": json.dumps(self.metadata)
        }
    
    def get_vote_percentage(self) -> float:
        """Calculate percentage of votes in favor"""
        if self.total_vote_weight == 0:
            return 0.0
        return self.votes_for / self.total_vote_weight
    
    def has_reached_consensus(self) -> bool:
        """Check if proposal has reached consensus threshold"""
        return self.get_vote_percentage() >= self.consensus_threshold
    
    def is_voting_open(self) -> bool:
        """Check if voting period is still active"""
        return (
            self.status == ProposalStatus.ACTIVE and
            datetime.utcnow() < self.voting_ends_at
        )


class Vote:
    """
    Represents a vote on a proposal
    """
    
    def __init__(
        self,
        vote_id: Optional[str] = None,
        proposal_id: str = "",
        identity_id: str = "",
        choice: VoteChoice = VoteChoice.ABSTAIN,
        weight: float = 1.0,
        reasoning: str = "",
        created_at: Optional[datetime] = None
    ):
        self.id = vote_id or str(uuid.uuid4())
        self.proposal_id = proposal_id
        self.identity_id = identity_id
        self.choice = choice
        self.weight = weight
        self.reasoning = reasoning
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "identity_id": self.identity_id,
            "choice": self.choice.value,
            "weight": self.weight,
            "reasoning": self.reasoning,
            "created_at": self.created_at.isoformat() + 'Z'
        }


class EvolutionVersion:
    """
    Represents a version of the evolved ecosystem
    """
    
    def __init__(
        self,
        version_id: Optional[str] = None,
        version_number: str = "1.0.0",
        description: str = "",
        approved_proposals: List[str] = None,
        rollout_percentage: int = 0,
        is_active: bool = False,
        created_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = version_id or str(uuid.uuid4())
        self.version_number = version_number
        self.description = description
        self.approved_proposals = approved_proposals or []
        self.rollout_percentage = rollout_percentage
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "id": self.id,
            "version_number": self.version_number,
            "description": self.description,
            "approved_proposals": json.dumps(self.approved_proposals),
            "rollout_percentage": self.rollout_percentage,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() + 'Z',
            "metadata": json.dumps(self.metadata)
        }


class EvolutionEngine:
    """
    Main engine for managing distributed evolution
    
    Handles proposal lifecycle, voting, consensus, and version rollout.
    """
    
    def __init__(self, storage):
        """
        Initialize evolution engine with storage backend
        
        Args:
            storage: Storage implementation (SQLiteStorage, etc.)
        """
        self.storage = storage
        self.consensus_threshold = 0.67  # 67% for approval
        self.voting_period_days = 7      # 7 days to vote
        self.rollout_stages = [10, 50, 100]  # Gradual rollout percentages
    
    def create_proposal(
        self,
        proposal_type: ProposalType,
        title: str,
        description: str,
        content: Dict[str, Any],
        proposer_identity_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EvolutionProposal:
        """
        Create a new evolution proposal
        
        Args:
            proposal_type: Type of proposal (pattern, tension, constitutional)
            title: Short title describing the proposal
            description: Detailed description and rationale
            content: Proposal-specific data (pattern definition, rule text, etc.)
            proposer_identity_id: Identity creating the proposal
            metadata: Additional metadata
        
        Returns:
            Created proposal object
        """
        proposal = EvolutionProposal(
            proposal_type=proposal_type,
            title=title,
            description=description,
            content=content,
            proposer_identity_id=proposer_identity_id,
            status=ProposalStatus.DRAFT,
            consensus_threshold=self.consensus_threshold,
            metadata=metadata or {}
        )
        
        # Store in database
        proposal_dict = proposal.to_dict()
        cursor = self.storage.conn.execute(
            """
            INSERT INTO evolution_proposals (
                id, proposal_type, title, description, changes, proposer_identity_id,
                status, votes_for, votes_against, votes_abstain, total_vote_weight,
                consensus_threshold, created_at, voting_ends_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                proposal_dict["id"], proposal_dict["type"], proposal_dict["title"],
                proposal_dict["description"], proposal_dict["changes"],
                proposal_dict["proposer_identity_id"], proposal_dict["status"],
                proposal_dict["votes_for"], proposal_dict["votes_against"],
                proposal_dict["votes_abstain"], proposal_dict["total_vote_weight"],
                proposal_dict["consensus_threshold"], proposal_dict["created_at"],
                proposal_dict["voting_ends_at"], proposal_dict["metadata"]
            )
        )
        self.storage.conn.commit()
        
        return proposal
    
    def activate_proposal(self, proposal_id: str) -> bool:
        """
        Activate a proposal for voting
        
        Args:
            proposal_id: ID of proposal to activate
        
        Returns:
            True if activated successfully
        """
        cursor = self.storage.conn.execute(
            "UPDATE evolution_proposals SET status = ? WHERE id = ? AND status = ?",
            (ProposalStatus.ACTIVE.value, proposal_id, ProposalStatus.DRAFT.value)
        )
        self.storage.conn.commit()
        return cursor.rowcount > 0
    
    def cast_vote(
        self,
        proposal_id: str,
        identity_id: str,
        choice: VoteChoice,
        reasoning: str = ""
    ) -> Tuple[bool, str]:
        """
        Cast a vote on a proposal
        
        Args:
            proposal_id: ID of proposal to vote on
            identity_id: Identity casting the vote
            choice: Vote choice (for/against/abstain)
            reasoning: Optional reasoning for the vote
        
        Returns:
            (success: bool, message: str)
        """
        # Check if proposal exists and voting is open
        proposal = self.get_proposal(proposal_id)
        if not proposal:
            return False, "Proposal not found"
        
        if not proposal.is_voting_open():
            return False, "Voting is closed for this proposal"
        
        # Check if already voted
        existing_vote = self.storage.conn.execute(
            "SELECT id FROM evolution_votes WHERE proposal_id = ? AND identity_id = ?",
            (proposal_id, identity_id)
        ).fetchone()
        
        if existing_vote:
            return False, "Already voted on this proposal"
        
        # Calculate vote weight based on activity
        weight = self._calculate_vote_weight(identity_id)
        
        # Create vote
        vote = Vote(
            proposal_id=proposal_id,
            identity_id=identity_id,
            choice=choice,
            weight=weight,
            reasoning=reasoning
        )
        
        vote_dict = vote.to_dict()
        self.storage.conn.execute(
            """
            INSERT INTO evolution_votes (
                id, proposal_id, identity_id, choice, weight, reasoning, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vote_dict["id"], vote_dict["proposal_id"], vote_dict["identity_id"],
                vote_dict["choice"], vote_dict["weight"], vote_dict["reasoning"],
                vote_dict["created_at"]
            )
        )
        
        # Update proposal vote counts
        if choice == VoteChoice.FOR:
            self.storage.conn.execute(
                """
                UPDATE evolution_proposals 
                SET votes_for = votes_for + ?, total_vote_weight = total_vote_weight + ?
                WHERE id = ?
                """,
                (weight, weight, proposal_id)
            )
        elif choice == VoteChoice.AGAINST:
            self.storage.conn.execute(
                """
                UPDATE evolution_proposals 
                SET votes_against = votes_against + ?, total_vote_weight = total_vote_weight + ?
                WHERE id = ?
                """,
                (weight, weight, proposal_id)
            )
        else:  # ABSTAIN
            self.storage.conn.execute(
                """
                UPDATE evolution_proposals 
                SET votes_abstain = votes_abstain + ?
                WHERE id = ?
                """,
                (weight, proposal_id)
            )
        
        self.storage.conn.commit()
        
        # Check if consensus reached
        self._check_consensus(proposal_id)
        
        return True, "Vote cast successfully"
    
    def _calculate_vote_weight(self, identity_id: str) -> float:
        """
        Calculate vote weight based on activity
        
        More active users (more reflections) have higher weight,
        but with diminishing returns to prevent domination.
        
        Weight = log(1 + reflection_count) / log(1 + max_reflections_in_system)
        
        Args:
            identity_id: Identity to calculate weight for
        
        Returns:
            Vote weight between 0.1 and 1.0
        """
        import math
        
        # Get reflection count for this identity
        cursor = self.storage.conn.execute(
            "SELECT COUNT(*) FROM reflections WHERE identity_id = ?",
            (identity_id,)
        )
        reflection_count = cursor.fetchone()[0]
        
        # Get max reflection count in system
        cursor = self.storage.conn.execute(
            """
            SELECT COUNT(*) as count FROM reflections 
            GROUP BY identity_id 
            ORDER BY count DESC 
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        max_count = row[0] if row else 1
        
        # Calculate logarithmic weight
        if max_count == 0:
            return 0.1
        
        weight = math.log(1 + reflection_count) / math.log(1 + max_count)
        
        # Ensure minimum weight
        return max(0.1, weight)
    
    def _check_consensus(self, proposal_id: str):
        """
        Check if proposal has reached consensus and update status
        
        Args:
            proposal_id: ID of proposal to check
        """
        proposal = self.get_proposal(proposal_id)
        if not proposal:
            return
        
        # Check if voting period ended
        if datetime.utcnow() >= proposal.voting_ends_at:
            # Voting ended - determine outcome
            if proposal.has_reached_consensus():
                self.storage.conn.execute(
                    "UPDATE evolution_proposals SET status = ? WHERE id = ?",
                    (ProposalStatus.APPROVED.value, proposal_id)
                )
            else:
                self.storage.conn.execute(
                    "UPDATE evolution_proposals SET status = ? WHERE id = ?",
                    (ProposalStatus.REJECTED.value, proposal_id)
                )
            self.storage.conn.commit()
    
    def get_proposal(self, proposal_id: str) -> Optional[EvolutionProposal]:
        """
        Get proposal by ID
        
        Args:
            proposal_id: ID of proposal
        
        Returns:
            Proposal object or None
        """
        cursor = self.storage.conn.execute(
            "SELECT * FROM evolution_proposals WHERE id = ?",
            (proposal_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        
        return EvolutionProposal(
            proposal_id=row["id"],
            proposal_type=ProposalType(row["proposal_type"]),
            title=row["title"],
            description=row["description"],
            content=json.loads(row["changes"]) if row["changes"] else {},
            proposer_identity_id=row["proposer_identity_id"],
            status=ProposalStatus(row["status"]),
            votes_for=row["votes_for"],
            votes_against=row["votes_against"],
            votes_abstain=row["votes_abstain"],
            total_vote_weight=row["total_vote_weight"],
            consensus_threshold=row["consensus_threshold"],
            created_at=datetime.fromisoformat(row["created_at"].replace('Z', '')),
            voting_ends_at=datetime.fromisoformat(row["voting_ends_at"].replace('Z', '')),
            metadata=json.loads(row["metadata"]) if row["metadata"] else {}
        )
    
    def list_proposals(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[EvolutionProposal]:
        """
        List evolution proposals with optional filtering
        
        Args:
            limit: Maximum number of proposals to return
            offset: Number of proposals to skip (for pagination)
            status: Filter by status (active, approved, rejected, draft)
        
        Returns:
            List of proposal objects
        """
        query = "SELECT * FROM evolution_proposals"
        params = []
        
        if status:
            query += " WHERE status = ?"
            params.append(status)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = self.storage.conn.execute(query, params)
        rows = cursor.fetchall()
        
        proposals = []
        for row in rows:
            try:
                proposal = EvolutionProposal(
                    proposal_id=row["id"],
                    proposal_type=ProposalType(row["proposal_type"]),
                    title=row["title"],
                    description=row["description"],
                    content=json.loads(row["changes"]) if row["changes"] else {},
                    proposer_identity_id=row["proposer_identity_id"],
                    status=ProposalStatus(row["status"]),
                    votes_for=row["votes_for"],
                    votes_against=row["votes_against"],
                    votes_abstain=row["votes_abstain"],
                    total_vote_weight=row["total_vote_weight"],
                    consensus_threshold=row["consensus_threshold"],
                    created_at=datetime.fromisoformat(row["created_at"].replace('Z', '')),
                    voting_ends_at=datetime.fromisoformat(row["voting_ends_at"].replace('Z', '')),
                    metadata=json.loads(row["metadata"]) if row["metadata"] else {}
                )
                proposals.append(proposal)
            except Exception as e:
                # Skip malformed proposals
                continue
        
        return proposals
    
    def list_proposals(
        self,
        status: Optional[ProposalStatus] = None,
        proposal_type: Optional[ProposalType] = None,
        limit: int = 50
    ) -> List[EvolutionProposal]:
        """
        List proposals with optional filtering
        
        Args:
            status: Filter by status
            proposal_type: Filter by type
            limit: Maximum number to return
        
        Returns:
            List of proposals
        """
        query = "SELECT * FROM evolution_proposals WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status.value)
        
        if proposal_type:
            query += " AND proposal_type = ?"
            params.append(proposal_type.value)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor = self.storage.conn.execute(query, params)
        proposals = []
        
        for row in cursor.fetchall():
            proposals.append(EvolutionProposal(
                proposal_id=row["id"],
                proposal_type=ProposalType(row["proposal_type"]),
                title=row["title"],
                description=row["description"],
                content=json.loads(row["changes"]) if row["changes"] else {},
                proposer_identity_id=row["proposer_identity_id"],
                status=ProposalStatus(row["status"]),
                votes_for=row["votes_for"],
                votes_against=row["votes_against"],
                votes_abstain=row["votes_abstain"],
                total_vote_weight=row["total_vote_weight"],
                consensus_threshold=row["consensus_threshold"],
                created_at=datetime.fromisoformat(row["created_at"].replace('Z', '')),
                voting_ends_at=datetime.fromisoformat(row["voting_ends_at"].replace('Z', '')),
                metadata=json.loads(row["metadata"]) if row["metadata"] else {}
            ))
        
        return proposals
    
    def create_version(
        self,
        version_number: str,
        description: str,
        approved_proposals: List[str]
    ) -> EvolutionVersion:
        """
        Create a new evolution version from approved proposals
        
        Args:
            version_number: Version number (e.g., "2.0.0")
            description: Description of changes
            approved_proposals: List of approved proposal IDs
        
        Returns:
            Created version object
        """
        version = EvolutionVersion(
            version_number=version_number,
            description=description,
            approved_proposals=approved_proposals,
            rollout_percentage=0,
            is_active=False
        )
        
        version_dict = version.to_dict()
        self.storage.conn.execute(
            """
            INSERT INTO evolution_versions (
                id, version_number, description, approved_proposals,
                rollout_percentage, is_active, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                version_dict["id"], version_dict["version_number"],
                version_dict["description"], version_dict["approved_proposals"],
                version_dict["rollout_percentage"], version_dict["is_active"],
                version_dict["created_at"], version_dict["metadata"]
            )
        )
        self.storage.conn.commit()
        
        return version
    
    def rollout_version(
        self,
        version_id: str,
        target_percentage: int
    ) -> bool:
        """
        Gradually roll out a version to a percentage of users
        
        Args:
            version_id: ID of version to roll out
            target_percentage: Target rollout percentage (10, 50, or 100)
        
        Returns:
            True if rollout successful
        """
        if target_percentage not in self.rollout_stages:
            return False
        
        cursor = self.storage.conn.execute(
            "UPDATE evolution_versions SET rollout_percentage = ? WHERE id = ?",
            (target_percentage, version_id)
        )
        self.storage.conn.commit()
        
        # If 100%, mark as active
        if target_percentage == 100:
            self.storage.conn.execute(
                "UPDATE evolution_versions SET is_active = ? WHERE id = ?",
                (True, version_id)
            )
            self.storage.conn.commit()
        
        return cursor.rowcount > 0
    
    def get_active_version(self) -> Optional[EvolutionVersion]:
        """
        Get the currently active version
        
        Returns:
            Active version or None
        """
        cursor = self.storage.conn.execute(
            "SELECT * FROM evolution_versions WHERE is_active = ? ORDER BY created_at DESC LIMIT 1",
            (True,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        
        return EvolutionVersion(
            version_id=row["id"],
            version_number=row["version_number"],
            description=row["description"],
            approved_proposals=json.loads(row["approved_proposals"]) if row["approved_proposals"] else [],
            rollout_percentage=row["rollout_percentage"],
            is_active=row["is_active"],
            created_at=datetime.fromisoformat(row["created_at"].replace('Z', '')),
            metadata=json.loads(row["metadata"]) if row["metadata"] else {}
        )
