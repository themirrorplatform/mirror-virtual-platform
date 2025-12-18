"""
Proposal Schema

Defines the structure of governance proposals.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import hashlib


class ChangeType(Enum):
    """Type of constitutional change."""
    INVARIANT_MODIFY = "invariant_modify"      # Modify invariant threshold
    INVARIANT_ADD = "invariant_add"            # Add new invariant
    FEATURE_ADD = "feature_add"                # Add new feature
    FEATURE_MODIFY = "feature_modify"          # Modify existing feature
    GOVERNANCE_MODIFY = "governance_modify"    # Modify governance rules
    DOCUMENTATION = "documentation"            # Documentation only


@dataclass
class ProposalChange:
    """
    A single change proposed to the constitution.

    Changes can only strengthen invariants, never weaken them.
    Axioms cannot be changed at all.
    """
    change_type: ChangeType
    target: str  # e.g., "invariants.crisis_threshold"
    old_value: Any
    new_value: Any
    rationale: str

    def to_dict(self) -> dict:
        return {
            "change_type": self.change_type.value,
            "target": self.target,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "rationale": self.rationale,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ProposalChange":
        return cls(
            change_type=ChangeType(data["change_type"]),
            target=data["target"],
            old_value=data["old_value"],
            new_value=data["new_value"],
            rationale=data["rationale"],
        )

    def is_strengthening(self) -> Optional[bool]:
        """
        Check if this change strengthens (vs weakens) a constraint.

        Returns:
            True if strengthening
            False if weakening
            None if not applicable (e.g., documentation)
        """
        if self.change_type == ChangeType.DOCUMENTATION:
            return None

        # For thresholds, compare values
        if isinstance(self.old_value, (int, float)) and isinstance(self.new_value, (int, float)):
            # Lower thresholds = more strict (for detection)
            if "threshold" in self.target.lower():
                return self.new_value <= self.old_value
            # Higher minimums = more strict
            if "minimum" in self.target.lower():
                return self.new_value >= self.old_value

        return None  # Cannot determine


@dataclass
class Proposal:
    """
    A governance proposal for constitutional change.

    Proposals go through a multi-stage lifecycle:
    1. Draft → Submitted → Review → Voting → Court Review → Timelock → Enacted
    """
    id: str
    title: str
    summary: str
    rationale: str
    changes: List[ProposalChange]

    # Authorship
    proposer_id: str
    created_at: datetime
    submitted_at: Optional[datetime] = None

    # Status
    status: str = "draft"  # ProposalStatus value

    # Timing
    review_start: Optional[datetime] = None
    review_end: Optional[datetime] = None
    voting_start: Optional[datetime] = None
    voting_end: Optional[datetime] = None
    timelock_start: Optional[datetime] = None
    timelock_end: Optional[datetime] = None
    enacted_at: Optional[datetime] = None

    # Results
    user_vote_result: Optional[Dict] = None
    guardian_vote_result: Optional[Dict] = None
    court_ruling: Optional[Dict] = None
    rejection_reason: Optional[str] = None

    # Metadata
    discussion_url: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    supporters: List[str] = field(default_factory=list)

    # Integrity
    content_hash: str = field(default="")

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = self._compute_hash()

    def _compute_hash(self) -> str:
        """Compute content hash for integrity."""
        content = f"{self.title}{self.summary}{self.rationale}"
        for change in self.changes:
            content += f"{change.target}{change.new_value}"
        return hashlib.sha256(content.encode()).hexdigest()

    @classmethod
    def create(
        cls,
        title: str,
        summary: str,
        rationale: str,
        changes: List[ProposalChange],
        proposer_id: str,
        tags: List[str] = None
    ) -> "Proposal":
        """Create a new proposal."""
        return cls(
            id=str(uuid.uuid4()),
            title=title,
            summary=summary,
            rationale=rationale,
            changes=changes,
            proposer_id=proposer_id,
            created_at=datetime.utcnow(),
            tags=tags or [],
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "rationale": self.rationale,
            "changes": [c.to_dict() for c in self.changes],
            "proposer_id": self.proposer_id,
            "created_at": self.created_at.isoformat(),
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "status": self.status,
            "review_start": self.review_start.isoformat() if self.review_start else None,
            "review_end": self.review_end.isoformat() if self.review_end else None,
            "voting_start": self.voting_start.isoformat() if self.voting_start else None,
            "voting_end": self.voting_end.isoformat() if self.voting_end else None,
            "timelock_start": self.timelock_start.isoformat() if self.timelock_start else None,
            "timelock_end": self.timelock_end.isoformat() if self.timelock_end else None,
            "enacted_at": self.enacted_at.isoformat() if self.enacted_at else None,
            "user_vote_result": self.user_vote_result,
            "guardian_vote_result": self.guardian_vote_result,
            "court_ruling": self.court_ruling,
            "rejection_reason": self.rejection_reason,
            "discussion_url": self.discussion_url,
            "tags": self.tags,
            "supporters": self.supporters,
            "content_hash": self.content_hash,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Proposal":
        def parse_dt(s):
            return datetime.fromisoformat(s) if s else None

        return cls(
            id=data["id"],
            title=data["title"],
            summary=data["summary"],
            rationale=data["rationale"],
            changes=[ProposalChange.from_dict(c) for c in data["changes"]],
            proposer_id=data["proposer_id"],
            created_at=parse_dt(data["created_at"]),
            submitted_at=parse_dt(data.get("submitted_at")),
            status=data.get("status", "draft"),
            review_start=parse_dt(data.get("review_start")),
            review_end=parse_dt(data.get("review_end")),
            voting_start=parse_dt(data.get("voting_start")),
            voting_end=parse_dt(data.get("voting_end")),
            timelock_start=parse_dt(data.get("timelock_start")),
            timelock_end=parse_dt(data.get("timelock_end")),
            enacted_at=parse_dt(data.get("enacted_at")),
            user_vote_result=data.get("user_vote_result"),
            guardian_vote_result=data.get("guardian_vote_result"),
            court_ruling=data.get("court_ruling"),
            rejection_reason=data.get("rejection_reason"),
            discussion_url=data.get("discussion_url"),
            tags=data.get("tags", []),
            supporters=data.get("supporters", []),
            content_hash=data.get("content_hash", ""),
        )

    def add_supporter(self, user_id: str) -> bool:
        """Add a supporter (co-sponsor)."""
        if user_id not in self.supporters:
            self.supporters.append(user_id)
            return True
        return False

    def get_all_targets(self) -> List[str]:
        """Get all change targets for validation."""
        return [c.target for c in self.changes]

    def touches_axioms(self) -> bool:
        """Check if proposal touches any axioms (not allowed)."""
        for change in self.changes:
            if "axiom" in change.target.lower():
                return True
        return False

    def touches_invariants(self) -> bool:
        """Check if proposal touches any invariants."""
        for change in self.changes:
            if "invariant" in change.target.lower():
                return True
        return False

    def is_documentation_only(self) -> bool:
        """Check if proposal is documentation-only."""
        return all(
            c.change_type == ChangeType.DOCUMENTATION
            for c in self.changes
        )
