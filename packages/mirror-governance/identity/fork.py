"""
Fork Management

Manages legitimate forks of the Mirror platform.

Key principles:
1. Fork freedom is a constitutional right (Axiom 7: Exit Freedom)
2. Legitimate forks inherit constitutional protections
3. "Mirror" name is NOT trademarked - cannot be monopolized
4. Users can migrate between forks with their data

Legitimacy criteria:
- Must preserve constitutional axioms
- Must not impersonate original while weakening protections
- Must allow user exit with data
- May strengthen invariants (not weaken)
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Set
from datetime import datetime
from enum import Enum
import hashlib
import uuid


class ForkType(Enum):
    """Types of forks."""
    # Technical fork - same constitution, different implementation
    TECHNICAL = "technical"
    # Governance fork - modified governance rules (invariants strengthened)
    GOVERNANCE = "governance"
    # Community fork - new community with compatible constitution
    COMMUNITY = "community"
    # Hostile fork - attempts to weaken protections (illegitimate)
    HOSTILE = "hostile"


class ForkLegitimacy(Enum):
    """Legitimacy status of a fork."""
    LEGITIMATE = "legitimate"  # Fully compatible
    CONDITIONAL = "conditional"  # Compatible with conditions
    ILLEGITIMATE = "illegitimate"  # Violates axioms or weakens invariants
    UNKNOWN = "unknown"  # Not yet evaluated


@dataclass
class Fork:
    """A fork of the Mirror platform."""
    id: str
    name: str
    fork_type: ForkType
    legitimacy: ForkLegitimacy

    # Origin
    parent_fork_id: Optional[str] = None  # None for root
    forked_at: datetime = field(default_factory=datetime.utcnow)
    forked_from_version: Optional[str] = None

    # Constitution hash (to verify axiom preservation)
    constitution_hash: str = ""

    # Metadata
    description: str = ""
    maintainers: List[str] = field(default_factory=list)
    url: Optional[str] = None

    # Legitimacy tracking
    axioms_preserved: bool = True
    invariants_only_strengthened: bool = True
    allows_exit: bool = True
    legitimacy_notes: List[str] = field(default_factory=list)

    # User migration
    users_migrated_from: int = 0
    users_migrated_to: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "fork_type": self.fork_type.value,
            "legitimacy": self.legitimacy.value,
            "parent_fork_id": self.parent_fork_id,
            "forked_at": self.forked_at.isoformat(),
            "forked_from_version": self.forked_from_version,
            "constitution_hash": self.constitution_hash,
            "description": self.description,
            "maintainers": self.maintainers,
            "url": self.url,
            "axioms_preserved": self.axioms_preserved,
            "invariants_only_strengthened": self.invariants_only_strengthened,
            "allows_exit": self.allows_exit,
            "legitimacy_notes": self.legitimacy_notes,
        }


class ForkManager:
    """
    Manages fork registration and legitimacy.

    The Mirror constitutional framework explicitly allows forking
    (Axiom 7: Exit Freedom). This manager tracks forks and
    determines their legitimacy based on constitutional compatibility.

    A fork is LEGITIMATE if:
    1. All 14 axioms are preserved unchanged
    2. Invariants are only strengthened (never weakened)
    3. Users can exit with their data
    4. No impersonation of original while reducing protections

    Usage:
        manager = ForkManager()

        # Register a fork
        fork = manager.register_fork(
            name="Mirror Enhanced",
            constitution=fork_constitution,
            parent_fork_id="root",
            description="Fork with stronger privacy guarantees"
        )

        # Check legitimacy
        legitimacy = manager.evaluate_legitimacy(fork.id)

        # Get legitimate forks for user migration
        legitimate = manager.get_legitimate_forks()
    """

    # The 14 immutable axioms that MUST be preserved
    REQUIRED_AXIOMS = {
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

    def __init__(self, root_constitution: Dict = None):
        self._forks: Dict[str, Fork] = {}
        self._root_constitution = root_constitution or {}
        self._root_axiom_hash = self._hash_axioms(root_constitution) if root_constitution else ""

        # Register root fork
        if root_constitution:
            self._register_root(root_constitution)

    def _hash_axioms(self, constitution: Dict) -> str:
        """Hash the axioms for comparison."""
        axioms = constitution.get("axioms", {})
        # Sort and hash for deterministic comparison
        axiom_str = str(sorted(axioms.items()))
        return hashlib.sha256(axiom_str.encode()).hexdigest()

    def _register_root(self, constitution: Dict):
        """Register the root/original fork."""
        root = Fork(
            id="root",
            name="Mirror",
            fork_type=ForkType.TECHNICAL,
            legitimacy=ForkLegitimacy.LEGITIMATE,
            parent_fork_id=None,
            constitution_hash=self._hash_axioms(constitution),
            description="Original Mirror platform",
        )
        self._forks["root"] = root

    def register_fork(
        self,
        name: str,
        constitution: Dict,
        parent_fork_id: str = "root",
        description: str = "",
        maintainers: List[str] = None,
        url: str = None,
        forked_from_version: str = None
    ) -> Fork:
        """
        Register a new fork.

        The fork will be evaluated for legitimacy based on its constitution.
        """
        fork_id = str(uuid.uuid4())

        fork = Fork(
            id=fork_id,
            name=name,
            fork_type=ForkType.TECHNICAL,  # Will be updated by evaluation
            legitimacy=ForkLegitimacy.UNKNOWN,
            parent_fork_id=parent_fork_id,
            forked_from_version=forked_from_version,
            constitution_hash=self._hash_axioms(constitution),
            description=description,
            maintainers=maintainers or [],
            url=url,
        )

        # Evaluate legitimacy
        self._evaluate_fork(fork, constitution)

        self._forks[fork_id] = fork
        return fork

    def _evaluate_fork(self, fork: Fork, constitution: Dict):
        """Evaluate fork legitimacy based on constitution."""
        notes = []

        # Check axiom preservation
        fork_axioms = set(constitution.get("axioms", {}).keys())
        missing_axioms = self.REQUIRED_AXIOMS - fork_axioms

        if missing_axioms:
            fork.axioms_preserved = False
            notes.append(f"Missing axioms: {missing_axioms}")

        # Check if axioms are modified (beyond just missing)
        fork_axiom_hash = self._hash_axioms(constitution)
        if fork_axiom_hash != self._root_axiom_hash and self._root_axiom_hash:
            # Different hash could mean added axioms (ok) or modified (not ok)
            root_axioms = self._root_constitution.get("axioms", {})
            for axiom_name in self.REQUIRED_AXIOMS:
                root_value = root_axioms.get(axiom_name)
                fork_value = constitution.get("axioms", {}).get(axiom_name)
                if root_value and fork_value and root_value != fork_value:
                    fork.axioms_preserved = False
                    notes.append(f"Axiom '{axiom_name}' was modified")

        # Check invariant strengthening (only if root constitution available)
        if self._root_constitution:
            weakened = self._check_invariant_weakening(
                self._root_constitution.get("invariants", {}),
                constitution.get("invariants", {})
            )
            if weakened:
                fork.invariants_only_strengthened = False
                notes.append(f"Weakened invariants: {weakened}")

        # Check exit allowance
        governance = constitution.get("governance", {})
        if governance.get("allows_exit", True) is False:
            fork.allows_exit = False
            notes.append("Fork does not allow user exit")

        # Determine fork type and legitimacy
        fork.legitimacy_notes = notes

        if not fork.axioms_preserved:
            fork.legitimacy = ForkLegitimacy.ILLEGITIMATE
            fork.fork_type = ForkType.HOSTILE
        elif not fork.allows_exit:
            fork.legitimacy = ForkLegitimacy.ILLEGITIMATE
            fork.fork_type = ForkType.HOSTILE
        elif not fork.invariants_only_strengthened:
            fork.legitimacy = ForkLegitimacy.ILLEGITIMATE
            fork.fork_type = ForkType.HOSTILE
        elif notes:
            fork.legitimacy = ForkLegitimacy.CONDITIONAL
            fork.fork_type = ForkType.GOVERNANCE
        else:
            fork.legitimacy = ForkLegitimacy.LEGITIMATE
            fork.fork_type = ForkType.COMMUNITY

    def _check_invariant_weakening(
        self,
        root_invariants: Dict,
        fork_invariants: Dict
    ) -> List[str]:
        """Check if any invariants were weakened."""
        weakened = []

        for name, root_inv in root_invariants.items():
            fork_inv = fork_invariants.get(name)

            if not fork_inv:
                # Invariant removed entirely = weakening
                weakened.append(f"{name} (removed)")
                continue

            # Check constraints
            root_constraints = set(root_inv.get("constraints", []))
            fork_constraints = set(fork_inv.get("constraints", []))

            # All root constraints must still exist
            removed = root_constraints - fork_constraints
            if removed:
                weakened.append(f"{name} (removed constraints: {removed})")

        return weakened

    def get_fork(self, fork_id: str) -> Optional[Fork]:
        """Get a fork by ID."""
        return self._forks.get(fork_id)

    def get_all_forks(self) -> List[Fork]:
        """Get all registered forks."""
        return list(self._forks.values())

    def get_legitimate_forks(self) -> List[Fork]:
        """Get all legitimate forks."""
        return [
            f for f in self._forks.values()
            if f.legitimacy in [ForkLegitimacy.LEGITIMATE, ForkLegitimacy.CONDITIONAL]
        ]

    def get_illegitimate_forks(self) -> List[Fork]:
        """Get all illegitimate forks."""
        return [
            f for f in self._forks.values()
            if f.legitimacy == ForkLegitimacy.ILLEGITIMATE
        ]

    def get_fork_lineage(self, fork_id: str) -> List[Fork]:
        """Get the lineage of a fork back to root."""
        lineage = []
        current = self._forks.get(fork_id)

        while current:
            lineage.append(current)
            if current.parent_fork_id:
                current = self._forks.get(current.parent_fork_id)
            else:
                break

        return list(reversed(lineage))

    def record_migration(
        self,
        from_fork_id: str,
        to_fork_id: str,
        user_count: int = 1
    ):
        """Record user migration between forks."""
        from_fork = self._forks.get(from_fork_id)
        to_fork = self._forks.get(to_fork_id)

        if from_fork:
            from_fork.users_migrated_to += user_count

        if to_fork:
            to_fork.users_migrated_from += user_count

    def verify_fork_compatibility(
        self,
        source_fork_id: str,
        target_fork_id: str
    ) -> tuple:
        """
        Verify compatibility between two forks for migration.

        Returns (compatible, issues).
        """
        source = self._forks.get(source_fork_id)
        target = self._forks.get(target_fork_id)

        if not source or not target:
            return False, ["Fork not found"]

        issues = []

        # Can always migrate TO legitimate forks
        if target.legitimacy == ForkLegitimacy.ILLEGITIMATE:
            issues.append("Target fork is illegitimate")

        # Check exit allowance
        if not source.allows_exit:
            issues.append("Source fork does not allow exit")

        return len(issues) == 0, issues
