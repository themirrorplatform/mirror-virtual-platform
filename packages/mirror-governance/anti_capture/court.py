"""
Constitutional Court

Reviews proposals for compatibility with constitutional constraints.
Acts as a check on majority power - even approved proposals can be
blocked if they violate axioms or weaken invariants.

Key principles:
1. Axioms are ABSOLUTE - no proposal can modify them
2. Invariants can only be STRENGTHENED, never weakened
3. Court reviews are binding
4. Court composition is designed to resist capture
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Set
from datetime import datetime
from enum import Enum
import uuid


class RulingType(Enum):
    """Types of court rulings."""
    COMPATIBLE = "compatible"  # Proposal is constitutional
    INCOMPATIBLE = "incompatible"  # Proposal violates constitution
    CONDITIONAL = "conditional"  # Compatible with modifications
    ABSTAIN = "abstain"  # Court declines to rule


class ViolationType(Enum):
    """Types of constitutional violations."""
    AXIOM_MODIFICATION = "axiom_modification"  # Attempts to change axiom
    INVARIANT_WEAKENING = "invariant_weakening"  # Weakens an invariant
    SCOPE_VIOLATION = "scope_violation"  # Outside governance scope
    PROCEDURAL = "procedural"  # Procedural requirement not met
    VAGUE = "vague"  # Too vague to evaluate


@dataclass
class Violation:
    """A specific constitutional violation."""
    type: ViolationType
    description: str
    target: str  # What was violated
    severity: str = "blocking"  # "blocking" or "advisory"

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "description": self.description,
            "target": self.target,
            "severity": self.severity,
        }


@dataclass
class JusticeVote:
    """A vote from a court justice."""
    justice_id: str
    ruling: RulingType
    reasoning: str
    violations_found: List[Violation] = field(default_factory=list)
    suggested_modifications: List[str] = field(default_factory=list)
    voted_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "justice_id": self.justice_id,
            "ruling": self.ruling.value,
            "reasoning": self.reasoning,
            "violations_found": [v.to_dict() for v in self.violations_found],
            "suggested_modifications": self.suggested_modifications,
            "voted_at": self.voted_at.isoformat(),
        }


@dataclass
class CourtRuling:
    """Official court ruling on a proposal."""
    id: str
    proposal_id: str
    ruling: RulingType
    majority_reasoning: str

    # Vote breakdown
    votes: List[JusticeVote] = field(default_factory=list)
    compatible_votes: int = 0
    incompatible_votes: int = 0
    conditional_votes: int = 0
    abstain_votes: int = 0

    # Violations found
    violations: List[Violation] = field(default_factory=list)

    # Conditions for conditional ruling
    required_modifications: List[str] = field(default_factory=list)

    # Timestamps
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    finalized: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "ruling": self.ruling.value,
            "majority_reasoning": self.majority_reasoning,
            "vote_breakdown": {
                "compatible": self.compatible_votes,
                "incompatible": self.incompatible_votes,
                "conditional": self.conditional_votes,
                "abstain": self.abstain_votes,
            },
            "violations": [v.to_dict() for v in self.violations],
            "required_modifications": self.required_modifications,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "finalized": self.finalized,
        }


class ConstitutionalCourt:
    """
    Constitutional court for governance review.

    Reviews proposals for constitutional compatibility.
    Has the power to block incompatible proposals even
    if they pass bicameral voting.

    Court composition:
    - Justices are appointed through special process
    - Terms are staggered to prevent mass replacement
    - Requires supermajority to modify court itself

    Anti-capture properties:
    1. Independent from voting chambers
    2. Focus only on constitutional issues
    3. Staggered terms prevent sudden takeover
    4. Transparent reasoning requirements

    Usage:
        court = ConstitutionalCourt()

        # Add justices
        court.appoint_justice(justice_id, term_years=6)

        # Open review
        ruling = court.open_review(proposal_id)

        # Justices vote
        court.cast_vote(ruling.id, justice_id, RulingType.COMPATIBLE, "No violations found")

        # Finalize when quorum reached
        final_ruling = court.finalize_review(ruling.id)

        if final_ruling.ruling == RulingType.COMPATIBLE:
            # Proposal can proceed
            pass
    """

    # The 14 immutable axioms
    AXIOMS = {
        "certainty",
        "sovereignty",
        "manipulation",
        "diagnosis",
        "post_action",
        "necessity",
        "exit_freedom",
        "departure_inference",
        "advice",
        "context_collapse",
        "certainty_self",
        "optimization",
        "coercion",
        "capture",
    }

    # Invariants (can only be strengthened)
    INVARIANTS = {
        "constitutional_alignment",
        "sovereignty_integrity",
        "reflection_purity",
        "fork_freedom",
        "user_control",
        "anti_manipulation",
    }

    def __init__(
        self,
        min_justices: int = 5,
        quorum: float = 0.60,
        review_days: int = 14
    ):
        self.min_justices = min_justices
        self.quorum = quorum
        self.review_days = review_days

        self._justices: Dict[str, dict] = {}  # justice_id -> info
        self._rulings: Dict[str, CourtRuling] = {}
        self._proposal_rulings: Dict[str, str] = {}  # proposal_id -> ruling_id

    def appoint_justice(
        self,
        justice_id: str,
        term_years: int = 6,
        appointed_by: str = None
    ):
        """
        Appoint a new justice to the court.

        In practice, justice appointment would require:
        - Supermajority approval from both chambers
        - Extensive public review period
        - Term limits and staggered terms
        """
        self._justices[justice_id] = {
            "id": justice_id,
            "appointed_at": datetime.utcnow(),
            "term_years": term_years,
            "term_ends": datetime.utcnow().replace(
                year=datetime.utcnow().year + term_years
            ),
            "appointed_by": appointed_by,
            "active": True,
        }

    def remove_justice(self, justice_id: str):
        """Remove a justice (term expiration or removal vote)."""
        if justice_id in self._justices:
            self._justices[justice_id]["active"] = False

    def get_active_justices(self) -> List[str]:
        """Get list of active justice IDs."""
        now = datetime.utcnow()
        return [
            j_id for j_id, info in self._justices.items()
            if info["active"] and info["term_ends"] > now
        ]

    def has_quorum(self) -> bool:
        """Check if court has enough justices."""
        return len(self.get_active_justices()) >= self.min_justices

    def open_review(self, proposal_id: str) -> CourtRuling:
        """
        Open a constitutional review for a proposal.

        Returns a new CourtRuling that justices can vote on.
        """
        if not self.has_quorum():
            raise ValueError("Court does not have quorum")

        ruling = CourtRuling(
            id=str(uuid.uuid4()),
            proposal_id=proposal_id,
            ruling=RulingType.ABSTAIN,  # Default until decided
            majority_reasoning="",
            opened_at=datetime.utcnow(),
        )

        self._rulings[ruling.id] = ruling
        self._proposal_rulings[proposal_id] = ruling.id

        return ruling

    def cast_vote(
        self,
        ruling_id: str,
        justice_id: str,
        ruling_type: RulingType,
        reasoning: str,
        violations: List[Violation] = None,
        modifications: List[str] = None
    ) -> JusticeVote:
        """
        Cast a vote on a constitutional review.

        Args:
            ruling_id: ID of the ruling
            justice_id: ID of the voting justice
            ruling_type: The justice's ruling
            reasoning: Required explanation
            violations: List of violations found (for INCOMPATIBLE)
            modifications: Required changes (for CONDITIONAL)
        """
        ruling = self._rulings.get(ruling_id)
        if not ruling:
            raise ValueError(f"Ruling not found: {ruling_id}")

        if ruling.finalized:
            raise ValueError("Ruling has been finalized")

        if justice_id not in self.get_active_justices():
            raise ValueError(f"Justice {justice_id} is not active")

        # Check for duplicate vote
        for vote in ruling.votes:
            if vote.justice_id == justice_id:
                raise ValueError(f"Justice {justice_id} has already voted")

        vote = JusticeVote(
            justice_id=justice_id,
            ruling=ruling_type,
            reasoning=reasoning,
            violations_found=violations or [],
            suggested_modifications=modifications or [],
        )

        ruling.votes.append(vote)

        # Update vote counts
        if ruling_type == RulingType.COMPATIBLE:
            ruling.compatible_votes += 1
        elif ruling_type == RulingType.INCOMPATIBLE:
            ruling.incompatible_votes += 1
            # Collect violations
            ruling.violations.extend(vote.violations_found)
        elif ruling_type == RulingType.CONDITIONAL:
            ruling.conditional_votes += 1
            # Collect required modifications
            ruling.required_modifications.extend(vote.suggested_modifications)
        else:
            ruling.abstain_votes += 1

        return vote

    def get_ruling(self, ruling_id: str) -> Optional[CourtRuling]:
        """Get a ruling by ID."""
        return self._rulings.get(ruling_id)

    def get_proposal_ruling(self, proposal_id: str) -> Optional[CourtRuling]:
        """Get the ruling for a proposal."""
        ruling_id = self._proposal_rulings.get(proposal_id)
        if ruling_id:
            return self._rulings.get(ruling_id)
        return None

    def can_finalize(self, ruling_id: str) -> bool:
        """Check if a ruling can be finalized."""
        ruling = self._rulings.get(ruling_id)
        if not ruling or ruling.finalized:
            return False

        total_justices = len(self.get_active_justices())
        total_votes = len(ruling.votes)

        # Need quorum of justices to vote
        return total_votes >= (total_justices * self.quorum)

    def finalize_review(self, ruling_id: str) -> CourtRuling:
        """
        Finalize a constitutional review.

        Determines the final ruling based on justice votes.
        """
        ruling = self._rulings.get(ruling_id)
        if not ruling:
            raise ValueError(f"Ruling not found: {ruling_id}")

        if ruling.finalized:
            return ruling

        if not self.can_finalize(ruling_id):
            raise ValueError("Cannot finalize - quorum not met")

        # Determine ruling
        # INCOMPATIBLE takes precedence if any blocking violations
        # Then CONDITIONAL if modifications required
        # Then COMPATIBLE if majority agree

        blocking_violations = [
            v for v in ruling.violations
            if v.severity == "blocking"
        ]

        if blocking_violations:
            ruling.ruling = RulingType.INCOMPATIBLE
            ruling.majority_reasoning = self._synthesize_reasoning(
                ruling, RulingType.INCOMPATIBLE
            )
        elif ruling.conditional_votes > 0 and ruling.required_modifications:
            ruling.ruling = RulingType.CONDITIONAL
            ruling.majority_reasoning = self._synthesize_reasoning(
                ruling, RulingType.CONDITIONAL
            )
        elif ruling.compatible_votes > ruling.incompatible_votes:
            ruling.ruling = RulingType.COMPATIBLE
            ruling.majority_reasoning = self._synthesize_reasoning(
                ruling, RulingType.COMPATIBLE
            )
        else:
            ruling.ruling = RulingType.INCOMPATIBLE
            ruling.majority_reasoning = self._synthesize_reasoning(
                ruling, RulingType.INCOMPATIBLE
            )

        ruling.closed_at = datetime.utcnow()
        ruling.finalized = True

        return ruling

    def _synthesize_reasoning(
        self,
        ruling: CourtRuling,
        ruling_type: RulingType
    ) -> str:
        """Synthesize majority reasoning from individual votes."""
        relevant_votes = [
            v for v in ruling.votes
            if v.ruling == ruling_type
        ]

        if not relevant_votes:
            # Fallback to all reasoning
            relevant_votes = ruling.votes

        if not relevant_votes:
            return "No reasoning provided."

        # Combine reasoning
        reasons = [v.reasoning for v in relevant_votes if v.reasoning]
        if len(reasons) == 1:
            return reasons[0]

        return "Majority opinion: " + " Additionally: ".join(reasons[:3])

    # Constitutional Analysis Helpers

    def check_axiom_compatibility(self, proposal) -> List[Violation]:
        """Check if proposal violates any axioms."""
        violations = []

        for change in proposal.changes:
            target_lower = change.target.lower()
            for axiom in self.AXIOMS:
                if axiom in target_lower:
                    violations.append(Violation(
                        type=ViolationType.AXIOM_MODIFICATION,
                        description=f"Proposal attempts to modify axiom: {axiom}",
                        target=axiom,
                        severity="blocking",
                    ))

        return violations

    def check_invariant_strengthening(self, proposal) -> List[Violation]:
        """Check if any invariants are weakened."""
        violations = []

        for change in proposal.changes:
            target_lower = change.target.lower()
            for invariant in self.INVARIANTS:
                if invariant in target_lower:
                    # Check if it's a strengthening
                    if change.is_strengthening() is False:
                        violations.append(Violation(
                            type=ViolationType.INVARIANT_WEAKENING,
                            description=f"Proposal weakens invariant: {invariant}",
                            target=invariant,
                            severity="blocking",
                        ))
                    elif change.is_strengthening() is None:
                        violations.append(Violation(
                            type=ViolationType.VAGUE,
                            description=f"Cannot determine if invariant change strengthens or weakens: {invariant}",
                            target=invariant,
                            severity="advisory",
                        ))

        return violations

    def automatic_review(self, proposal) -> CourtRuling:
        """
        Perform automatic constitutional review.

        This is a preliminary check that can flag obvious violations.
        Human review is still required for final ruling.
        """
        ruling = CourtRuling(
            id=str(uuid.uuid4()),
            proposal_id=proposal.id,
            ruling=RulingType.ABSTAIN,
            majority_reasoning="Automatic review - human review required",
            opened_at=datetime.utcnow(),
        )

        # Check axioms
        axiom_violations = self.check_axiom_compatibility(proposal)
        ruling.violations.extend(axiom_violations)

        # Check invariants
        invariant_violations = self.check_invariant_strengthening(proposal)
        ruling.violations.extend(invariant_violations)

        # Preliminary ruling
        blocking = [v for v in ruling.violations if v.severity == "blocking"]
        if blocking:
            ruling.ruling = RulingType.INCOMPATIBLE
            ruling.majority_reasoning = (
                f"Automatic review found {len(blocking)} blocking violation(s). "
                "This proposal cannot proceed as written."
            )
        elif ruling.violations:
            ruling.ruling = RulingType.CONDITIONAL
            ruling.majority_reasoning = (
                "Automatic review found advisory issues. "
                "Human review required before proceeding."
            )
        else:
            ruling.ruling = RulingType.COMPATIBLE
            ruling.majority_reasoning = (
                "Automatic review found no violations. "
                "Human review recommended but not required."
            )

        self._rulings[ruling.id] = ruling
        self._proposal_rulings[proposal.id] = ruling.id

        return ruling
