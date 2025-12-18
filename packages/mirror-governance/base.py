"""
Mirror Governance Base Types

Core types and enums for the governance system.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timedelta


class ProposalStatus(Enum):
    """Status of a governance proposal."""
    DRAFT = "draft"                    # Being written
    SUBMITTED = "submitted"            # Submitted for review
    REVIEW = "review"                  # In review period
    VOTING = "voting"                  # Active voting
    PASSED = "passed"                  # Passed all votes
    COURT_REVIEW = "court_review"      # Constitutional court review
    APPROVED = "approved"              # Approved by court
    TIMELOCK = "timelock"              # In timelock period
    ENACTED = "enacted"                # Live in constitution
    REJECTED = "rejected"              # Rejected at some stage
    WITHDRAWN = "withdrawn"            # Withdrawn by proposer


class VoteType(Enum):
    """Type of vote."""
    FOR = "for"
    AGAINST = "against"
    ABSTAIN = "abstain"


class ChamberType(Enum):
    """Type of voting chamber."""
    USER = "user"                      # Regular users
    GUARDIAN = "guardian"              # Technical maintainers
    COURT = "court"                    # Constitutional court


class RejectionReason(Enum):
    """Reason for proposal rejection."""
    AXIOM_VIOLATION = "axiom_violation"
    INVARIANT_WEAKENING = "invariant_weakening"
    QUORUM_NOT_MET = "quorum_not_met"
    MAJORITY_NOT_MET = "majority_not_met"
    SUPERMAJORITY_NOT_MET = "supermajority_not_met"
    COURT_REJECTED = "court_rejected"
    MINORITY_VETO = "minority_veto"
    TIMELOCK_EXPIRED = "timelock_expired"
    PROPOSER_WITHDRAWN = "proposer_withdrawn"


@dataclass
class VoteRecord:
    """Record of a single vote."""
    voter_id: str
    vote: VoteType
    weight: float  # For liquid democracy delegation
    chamber: ChamberType
    timestamp: datetime
    delegation_chain: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "voter_id": self.voter_id,
            "vote": self.vote.value,
            "weight": self.weight,
            "chamber": self.chamber.value,
            "timestamp": self.timestamp.isoformat(),
            "delegation_chain": self.delegation_chain,
        }


@dataclass
class VoteResult:
    """Result of a vote tally."""
    for_votes: float
    against_votes: float
    abstain_votes: float
    total_votes: float
    quorum_met: bool
    majority_met: bool
    supermajority_met: bool

    @property
    def for_percentage(self) -> float:
        if self.total_votes == 0:
            return 0.0
        return self.for_votes / self.total_votes

    @property
    def against_percentage(self) -> float:
        if self.total_votes == 0:
            return 0.0
        return self.against_votes / self.total_votes

    @property
    def passed(self) -> bool:
        return self.quorum_met and self.majority_met

    def to_dict(self) -> dict:
        return {
            "for_votes": self.for_votes,
            "against_votes": self.against_votes,
            "abstain_votes": self.abstain_votes,
            "total_votes": self.total_votes,
            "quorum_met": self.quorum_met,
            "majority_met": self.majority_met,
            "supermajority_met": self.supermajority_met,
            "for_percentage": self.for_percentage,
            "passed": self.passed,
        }


@dataclass
class GovernanceConfig:
    """Configuration for governance system."""

    # Timing
    min_review_days: int = 14           # Minimum review period
    voting_days: int = 7                # Voting period
    timelock_days: int = 14             # Timelock before enactment

    # Quorum requirements
    user_quorum: float = 0.10           # 10% of users must vote
    guardian_quorum: float = 0.50       # 50% of guardians must vote

    # Majority requirements
    simple_majority: float = 0.50       # >50% for normal proposals
    supermajority: float = 0.66         # >66% for minority-triggered

    # Minority protection
    minority_veto_threshold: float = 0.10  # 10% can trigger supermajority

    # Quadratic voting
    enable_quadratic: bool = True       # Enable quadratic voting
    max_vote_weight: float = 100.0      # Cap on individual vote weight

    def to_dict(self) -> dict:
        return {
            "min_review_days": self.min_review_days,
            "voting_days": self.voting_days,
            "timelock_days": self.timelock_days,
            "user_quorum": self.user_quorum,
            "guardian_quorum": self.guardian_quorum,
            "simple_majority": self.simple_majority,
            "supermajority": self.supermajority,
            "minority_veto_threshold": self.minority_veto_threshold,
            "enable_quadratic": self.enable_quadratic,
        }


@dataclass
class GovernanceState:
    """Current state of governance system."""
    active_proposals: List[str] = field(default_factory=list)
    pending_enactments: List[str] = field(default_factory=list)
    constitution_version: str = "1.0.0"

    # Statistics
    total_proposals: int = 0
    enacted_proposals: int = 0
    rejected_proposals: int = 0

    # Participants
    registered_users: int = 0
    registered_guardians: int = 0

    def to_dict(self) -> dict:
        return {
            "active_proposals": self.active_proposals,
            "pending_enactments": self.pending_enactments,
            "constitution_version": self.constitution_version,
            "total_proposals": self.total_proposals,
            "enacted_proposals": self.enacted_proposals,
            "rejected_proposals": self.rejected_proposals,
            "registered_users": self.registered_users,
            "registered_guardians": self.registered_guardians,
        }


# Exceptions

class GovernanceError(Exception):
    """Base governance exception."""
    pass


class AxiomViolationError(GovernanceError):
    """Proposal violates an immutable axiom."""
    pass


class InvariantWeakeningError(GovernanceError):
    """Proposal weakens an invariant (not allowed)."""
    pass


class QuorumNotMetError(GovernanceError):
    """Voting quorum not met."""
    pass


class TimelockError(GovernanceError):
    """Timelock-related error."""
    pass


class UnauthorizedError(GovernanceError):
    """Unauthorized governance action."""
    pass
