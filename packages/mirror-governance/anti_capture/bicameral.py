"""
Bicameral Governance System

Two chambers with different constituencies:
- User Chamber: All users (one person, one vote with quadratic modulation)
- Guardian Chamber: Technical maintainers (weighted by contribution)

Both chambers must approve for changes to pass.
This prevents capture by either technical insiders OR populist movements.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List
from datetime import datetime
from enum import Enum

from ..base import (
    ChamberType,
    VoteResult,
    GovernanceConfig,
    QuorumNotMetError,
)
from ..voting import VotingEngine


class ProposalCategory(Enum):
    """Categories that determine voting requirements."""
    # Minor changes - simple majority both chambers
    MINOR = "minor"
    # Standard changes - 60% both chambers
    STANDARD = "standard"
    # Major changes - supermajority + longer timelock
    MAJOR = "major"
    # Constitutional - touches invariants, highest bar
    CONSTITUTIONAL = "constitutional"


@dataclass
class ChamberRequirements:
    """Voting requirements for a chamber."""
    quorum: float  # Minimum participation
    threshold: float  # Required approval percentage
    timelock_days: int  # Cooling-off period


@dataclass
class BicameralResult:
    """Result of bicameral voting process."""
    proposal_id: str
    user_result: VoteResult
    guardian_result: VoteResult
    category: ProposalCategory

    # Both chambers must pass
    user_passed: bool = False
    guardian_passed: bool = False
    both_passed: bool = False

    # Minority protection triggered
    minority_protection_triggered: bool = False
    requires_supermajority: bool = False

    # Timestamps
    user_vote_completed: Optional[datetime] = None
    guardian_vote_completed: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "proposal_id": self.proposal_id,
            "category": self.category.value,
            "user_result": self.user_result.to_dict(),
            "guardian_result": self.guardian_result.to_dict(),
            "user_passed": self.user_passed,
            "guardian_passed": self.guardian_passed,
            "both_passed": self.both_passed,
            "minority_protection_triggered": self.minority_protection_triggered,
            "requires_supermajority": self.requires_supermajority,
            "user_vote_completed": self.user_vote_completed.isoformat() if self.user_vote_completed else None,
            "guardian_vote_completed": self.guardian_vote_completed.isoformat() if self.guardian_vote_completed else None,
        }


class BicameralSystem:
    """
    Bicameral governance system.

    Both chambers (users and guardians) must approve proposals.
    Different proposal categories have different requirements.

    Anti-capture properties:
    1. Guardians can block populist capture
    2. Users can block technical insider capture
    3. Minority protection prevents steamrolling
    4. Graduated thresholds for importance

    Usage:
        bicameral = BicameralSystem(config)

        # Categorize proposal
        category = bicameral.categorize_proposal(proposal)

        # Get requirements
        user_reqs = bicameral.get_requirements(category, ChamberType.USER)
        guardian_reqs = bicameral.get_requirements(category, ChamberType.GUARDIAN)

        # After voting completes
        result = bicameral.evaluate_proposal(
            proposal_id,
            user_result,
            guardian_result,
            category
        )

        if result.both_passed:
            # Proceed to timelock
            pass
    """

    # Default requirements by category
    CATEGORY_REQUIREMENTS = {
        ProposalCategory.MINOR: {
            ChamberType.USER: ChamberRequirements(
                quorum=0.05,
                threshold=0.50,
                timelock_days=3,
            ),
            ChamberType.GUARDIAN: ChamberRequirements(
                quorum=0.30,
                threshold=0.50,
                timelock_days=3,
            ),
        },
        ProposalCategory.STANDARD: {
            ChamberType.USER: ChamberRequirements(
                quorum=0.10,
                threshold=0.60,
                timelock_days=7,
            ),
            ChamberType.GUARDIAN: ChamberRequirements(
                quorum=0.40,
                threshold=0.60,
                timelock_days=7,
            ),
        },
        ProposalCategory.MAJOR: {
            ChamberType.USER: ChamberRequirements(
                quorum=0.15,
                threshold=0.66,
                timelock_days=14,
            ),
            ChamberType.GUARDIAN: ChamberRequirements(
                quorum=0.50,
                threshold=0.66,
                timelock_days=14,
            ),
        },
        ProposalCategory.CONSTITUTIONAL: {
            ChamberType.USER: ChamberRequirements(
                quorum=0.20,
                threshold=0.75,
                timelock_days=30,
            ),
            ChamberType.GUARDIAN: ChamberRequirements(
                quorum=0.60,
                threshold=0.75,
                timelock_days=30,
            ),
        },
    }

    def __init__(
        self,
        config: GovernanceConfig = None,
        custom_requirements: Dict = None
    ):
        self.config = config or GovernanceConfig()

        # Allow custom requirements override
        self.requirements = dict(self.CATEGORY_REQUIREMENTS)
        if custom_requirements:
            for category, chambers in custom_requirements.items():
                if category in self.requirements:
                    self.requirements[category].update(chambers)

    def get_requirements(
        self,
        category: ProposalCategory,
        chamber: ChamberType
    ) -> ChamberRequirements:
        """Get voting requirements for a category and chamber."""
        return self.requirements[category][chamber]

    def categorize_proposal(self, proposal) -> ProposalCategory:
        """
        Determine proposal category based on what it changes.

        Categories:
        - CONSTITUTIONAL: Touches invariants or core axiom-adjacent code
        - MAJOR: Significant architectural changes
        - STANDARD: Normal feature changes
        - MINOR: Bug fixes, documentation, minor tweaks
        """
        # Check for constitutional changes (invariants)
        if proposal.touches_axioms():
            # Should be blocked by validator, but categorize anyway
            return ProposalCategory.CONSTITUTIONAL

        if proposal.touches_invariants():
            return ProposalCategory.CONSTITUTIONAL

        # Check change types
        major_keywords = {
            "architecture", "security", "encryption", "authentication",
            "authorization", "privacy", "data_model", "protocol",
            "migration", "breaking_change"
        }

        minor_keywords = {
            "typo", "documentation", "readme", "comment", "style",
            "formatting", "lint", "test_only"
        }

        # Analyze all changes
        all_targets = [c.target.lower() for c in proposal.changes]
        all_rationales = " ".join([c.rationale.lower() for c in proposal.changes])

        # Check for constitutional indicators
        if any("invariant" in t for t in all_targets):
            return ProposalCategory.CONSTITUTIONAL

        # Check for major indicators
        for keyword in major_keywords:
            if any(keyword in t for t in all_targets):
                return ProposalCategory.MAJOR
            if keyword in all_rationales:
                return ProposalCategory.MAJOR

        # Check for minor indicators
        is_minor = True
        for keyword in minor_keywords:
            if any(keyword in t for t in all_targets):
                return ProposalCategory.MINOR
            if keyword in all_rationales:
                return ProposalCategory.MINOR

        # Default to standard
        return ProposalCategory.STANDARD

    def evaluate_chamber_vote(
        self,
        result: VoteResult,
        requirements: ChamberRequirements,
        minority_protection: bool = False
    ) -> tuple:
        """
        Evaluate if a chamber vote passed.

        Returns:
            (passed, requires_supermajority)
        """
        # Check quorum
        if not result.quorum_met:
            return False, False

        # Determine required threshold
        threshold = requirements.threshold

        # Minority protection: if triggered, require supermajority
        requires_super = False
        if minority_protection and result.against_votes > 0:
            total = result.for_votes + result.against_votes
            against_pct = result.against_votes / total if total > 0 else 0

            if against_pct >= self.config.minority_veto_threshold:
                threshold = max(threshold, self.config.supermajority)
                requires_super = True

        # Calculate approval percentage
        votes_cast = result.for_votes + result.against_votes
        if votes_cast == 0:
            return False, requires_super

        approval_pct = result.for_votes / votes_cast
        passed = approval_pct >= threshold

        return passed, requires_super

    def evaluate_proposal(
        self,
        proposal_id: str,
        user_result: VoteResult,
        guardian_result: VoteResult,
        category: ProposalCategory,
        check_minority_protection: bool = True
    ) -> BicameralResult:
        """
        Evaluate bicameral voting results for a proposal.

        Both chambers must pass for the proposal to proceed.
        """
        user_reqs = self.get_requirements(category, ChamberType.USER)
        guardian_reqs = self.get_requirements(category, ChamberType.GUARDIAN)

        # Evaluate user chamber
        user_passed, user_minority = self.evaluate_chamber_vote(
            user_result,
            user_reqs,
            check_minority_protection
        )

        # Evaluate guardian chamber
        guardian_passed, guardian_minority = self.evaluate_chamber_vote(
            guardian_result,
            guardian_reqs,
            check_minority_protection
        )

        # Both must pass
        both_passed = user_passed and guardian_passed

        return BicameralResult(
            proposal_id=proposal_id,
            user_result=user_result,
            guardian_result=guardian_result,
            category=category,
            user_passed=user_passed,
            guardian_passed=guardian_passed,
            both_passed=both_passed,
            minority_protection_triggered=user_minority or guardian_minority,
            requires_supermajority=user_minority or guardian_minority,
            user_vote_completed=datetime.utcnow() if user_result else None,
            guardian_vote_completed=datetime.utcnow() if guardian_result else None,
        )

    def get_timelock_days(self, category: ProposalCategory) -> int:
        """Get the required timelock period for a category."""
        # Use the longer of the two chamber timelocks
        user_reqs = self.get_requirements(category, ChamberType.USER)
        guardian_reqs = self.get_requirements(category, ChamberType.GUARDIAN)
        return max(user_reqs.timelock_days, guardian_reqs.timelock_days)

    def can_fast_track(self, category: ProposalCategory) -> bool:
        """
        Check if a category can be fast-tracked.

        Only MINOR proposals can potentially be fast-tracked,
        and only with unanimous guardian approval.
        """
        return category == ProposalCategory.MINOR

    def evaluate_fast_track(
        self,
        guardian_result: VoteResult
    ) -> bool:
        """
        Check if fast-track conditions are met.

        Requires 100% guardian approval (of those who voted).
        """
        if not guardian_result.quorum_met:
            return False

        # Must be unanimous (no against votes)
        return guardian_result.against_votes == 0
