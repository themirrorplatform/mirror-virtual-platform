"""
Proposal Validator

Validates proposals against constitutional constraints.
Ensures proposals cannot violate axioms or weaken invariants.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Set
from datetime import datetime

from ..base import (
    GovernanceError,
    AxiomViolationError,
    InvariantWeakeningError,
)
from .schema import Proposal, ProposalChange, ChangeType


@dataclass
class ValidationResult:
    """Result of proposal validation."""
    valid: bool
    errors: List[str]
    warnings: List[str]

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class ProposalValidator:
    """
    Validates proposals against constitutional constraints.

    Key rules:
    1. Axioms CANNOT be changed (ever)
    2. Invariants can only be strengthened, never weakened
    3. Changes must have clear rationale
    4. Proposals must be complete (no empty changes)
    """

    # These are the 14 immutable axioms
    PROTECTED_AXIOMS = {
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

    # Invariants that can be modified (but only strengthened)
    MODIFIABLE_INVARIANTS = {
        "constitutional_alignment",
        "sovereignty_integrity",
        "reflection_purity",
        "fork_freedom",
        "user_control",
        "anti_manipulation",
    }

    def __init__(self, current_constitution: Dict[str, Any] = None):
        """
        Initialize validator.

        Args:
            current_constitution: Current constitution for comparison
        """
        self.constitution = current_constitution or {}

    def validate(self, proposal: Proposal) -> ValidationResult:
        """
        Validate a proposal.

        Returns ValidationResult with any errors or warnings.
        """
        errors = []
        warnings = []

        # Check basic requirements
        if not proposal.title or len(proposal.title) < 10:
            errors.append("Title must be at least 10 characters")

        if not proposal.summary or len(proposal.summary) < 50:
            errors.append("Summary must be at least 50 characters")

        if not proposal.rationale or len(proposal.rationale) < 100:
            errors.append("Rationale must be at least 100 characters")

        if not proposal.changes:
            errors.append("Proposal must include at least one change")

        # Check each change
        for i, change in enumerate(proposal.changes):
            change_errors, change_warnings = self._validate_change(change, i)
            errors.extend(change_errors)
            warnings.extend(change_warnings)

        # Check for axiom violations
        if proposal.touches_axioms():
            errors.append(
                "AXIOM VIOLATION: Proposals cannot modify axioms. "
                "Axioms are immutable constitutional constraints."
            )

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )

    def _validate_change(
        self,
        change: ProposalChange,
        index: int
    ) -> tuple:
        """Validate a single change."""
        errors = []
        warnings = []
        prefix = f"Change {index + 1}"

        # Check rationale
        if not change.rationale or len(change.rationale) < 20:
            errors.append(f"{prefix}: Rationale must be at least 20 characters")

        # Check target
        if not change.target:
            errors.append(f"{prefix}: Target must be specified")

        # Check for axiom modification
        target_lower = change.target.lower()
        for axiom in self.PROTECTED_AXIOMS:
            if axiom in target_lower:
                errors.append(
                    f"{prefix}: Cannot modify axiom '{axiom}'. "
                    "Axioms are immutable."
                )

        # Check invariant modifications
        if "invariant" in target_lower:
            is_strengthening = change.is_strengthening()
            if is_strengthening is False:
                errors.append(
                    f"{prefix}: Cannot weaken invariant '{change.target}'. "
                    "Invariants can only be strengthened."
                )
            elif is_strengthening is None:
                warnings.append(
                    f"{prefix}: Cannot automatically determine if this change "
                    "strengthens or weakens the invariant. Manual review required."
                )

        # Check for meaningful change
        if change.old_value == change.new_value:
            warnings.append(f"{prefix}: Old and new values are identical")

        return errors, warnings

    def check_axiom_compatibility(self, proposal: Proposal) -> bool:
        """
        Check if proposal is compatible with all axioms.

        This is a strict check - any axiom touch = incompatible.
        """
        return not proposal.touches_axioms()

    def check_invariant_strengthening(self, proposal: Proposal) -> List[str]:
        """
        Check all invariant changes for proper strengthening.

        Returns list of invariants that would be weakened (not allowed).
        """
        weakened = []

        for change in proposal.changes:
            if "invariant" in change.target.lower():
                if change.is_strengthening() is False:
                    weakened.append(change.target)

        return weakened

    def validate_for_submission(self, proposal: Proposal) -> ValidationResult:
        """
        Extended validation for submission.

        Adds checks that only apply at submission time.
        """
        result = self.validate(proposal)

        # Additional submission checks
        if proposal.status != "draft":
            result.errors.append("Only draft proposals can be submitted")

        if not proposal.proposer_id:
            result.errors.append("Proposer must be identified")

        # Update validity
        result.valid = len(result.errors) == 0

        return result

    def validate_for_enactment(self, proposal: Proposal) -> ValidationResult:
        """
        Final validation before enactment.

        Most strict check - proposal must be complete and approved.
        """
        result = self.validate(proposal)

        # Check status progression
        if proposal.status not in ["approved", "timelock"]:
            result.errors.append(
                "Proposal must be approved before enactment"
            )

        # Check votes
        if not proposal.user_vote_result:
            result.errors.append("User vote result missing")

        if not proposal.guardian_vote_result:
            result.errors.append("Guardian vote result missing")

        # Check court ruling
        if not proposal.court_ruling:
            result.errors.append("Court ruling missing")
        elif proposal.court_ruling.get("compatible") is False:
            result.errors.append("Court ruled proposal incompatible")

        # Check timelock
        if proposal.timelock_end:
            if datetime.utcnow() < proposal.timelock_end:
                result.errors.append("Timelock period not complete")

        result.valid = len(result.errors) == 0
        return result
