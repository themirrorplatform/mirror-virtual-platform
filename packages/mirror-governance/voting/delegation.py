"""
Delegation Manager

Implements liquid democracy - vote delegation.

Users can:
- Vote directly on proposals
- Delegate their vote to a trusted person
- Delegate to different people for different topics
- Revoke delegation at any time
- See how their delegate voted
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from datetime import datetime
import uuid


@dataclass
class Delegation:
    """A vote delegation from one user to another."""
    id: str
    delegator_id: str  # Who is delegating
    delegate_id: str   # Who receives the delegation
    topic: Optional[str] = None  # None = all topics
    weight: float = 1.0  # Portion of vote delegated
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None

    @property
    def is_active(self) -> bool:
        """Check if delegation is currently active."""
        if self.revoked_at:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "delegator_id": self.delegator_id,
            "delegate_id": self.delegate_id,
            "topic": self.topic,
            "weight": self.weight,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "is_active": self.is_active,
        }


class DelegationManager:
    """
    Manages vote delegations for liquid democracy.

    Liquid democracy allows:
    - Direct voting on any proposal
    - Delegating vote to trusted experts
    - Topic-specific delegation
    - Transitive delegation (A → B → C)
    - Revocation at any time

    Prevents:
    - Circular delegations (A → B → A)
    - Self-delegation
    - Delegating to inactive users
    """

    # Maximum delegation chain length (prevents infinite loops)
    MAX_CHAIN_LENGTH = 10

    def __init__(self):
        self._delegations: Dict[str, Delegation] = {}
        # Index by delegator for quick lookup
        self._by_delegator: Dict[str, List[str]] = {}
        # Index by delegate for quick lookup
        self._by_delegate: Dict[str, List[str]] = {}

    def create_delegation(
        self,
        delegator_id: str,
        delegate_id: str,
        topic: Optional[str] = None,
        weight: float = 1.0,
        expires_at: Optional[datetime] = None
    ) -> Delegation:
        """
        Create a new delegation.

        Args:
            delegator_id: User delegating their vote
            delegate_id: User receiving the delegation
            topic: Optional topic filter
            weight: Portion of vote to delegate (0-1)
            expires_at: Optional expiration

        Returns:
            Created delegation

        Raises:
            ValueError: On invalid delegation
        """
        # Validate
        if delegator_id == delegate_id:
            raise ValueError("Cannot delegate to self")

        if weight <= 0 or weight > 1:
            raise ValueError("Weight must be between 0 and 1")

        # Check for circular delegation
        if self._would_create_cycle(delegator_id, delegate_id, topic):
            raise ValueError("Delegation would create a cycle")

        # Check total delegated weight
        existing_weight = self._get_delegated_weight(delegator_id, topic)
        if existing_weight + weight > 1:
            raise ValueError(
                f"Total delegated weight would exceed 1 "
                f"(existing: {existing_weight}, new: {weight})"
            )

        # Create delegation
        delegation = Delegation(
            id=str(uuid.uuid4()),
            delegator_id=delegator_id,
            delegate_id=delegate_id,
            topic=topic,
            weight=weight,
            expires_at=expires_at,
        )

        self._delegations[delegation.id] = delegation
        self._index_delegation(delegation)

        return delegation

    def revoke_delegation(self, delegation_id: str) -> bool:
        """Revoke a delegation."""
        if delegation_id not in self._delegations:
            return False

        delegation = self._delegations[delegation_id]
        delegation.revoked_at = datetime.utcnow()
        return True

    def revoke_all_delegations(self, delegator_id: str) -> int:
        """Revoke all delegations from a user."""
        count = 0
        delegation_ids = self._by_delegator.get(delegator_id, [])
        for did in delegation_ids:
            if self.revoke_delegation(did):
                count += 1
        return count

    def get_delegation(self, delegation_id: str) -> Optional[Delegation]:
        """Get a specific delegation."""
        return self._delegations.get(delegation_id)

    def get_delegations_from(
        self,
        delegator_id: str,
        topic: Optional[str] = None,
        active_only: bool = True
    ) -> List[Delegation]:
        """Get all delegations from a user."""
        delegation_ids = self._by_delegator.get(delegator_id, [])
        delegations = [self._delegations[did] for did in delegation_ids]

        if active_only:
            delegations = [d for d in delegations if d.is_active]

        if topic:
            delegations = [
                d for d in delegations
                if d.topic is None or d.topic == topic
            ]

        return delegations

    def get_delegations_to(
        self,
        delegate_id: str,
        topic: Optional[str] = None,
        active_only: bool = True
    ) -> List[Delegation]:
        """Get all delegations to a user."""
        delegation_ids = self._by_delegate.get(delegate_id, [])
        delegations = [self._delegations[did] for did in delegation_ids]

        if active_only:
            delegations = [d for d in delegations if d.is_active]

        if topic:
            delegations = [
                d for d in delegations
                if d.topic is None or d.topic == topic
            ]

        return delegations

    def get_effective_weight(
        self,
        voter_id: str,
        topic: Optional[str] = None
    ) -> float:
        """
        Get the effective voting weight for a user.

        Includes their own weight plus all delegated weights.
        Follows the delegation chain transitively.
        """
        visited: Set[str] = set()
        return self._calculate_weight_recursive(voter_id, topic, visited, 0)

    def _calculate_weight_recursive(
        self,
        voter_id: str,
        topic: Optional[str],
        visited: Set[str],
        depth: int
    ) -> float:
        """Recursively calculate weight following delegation chain."""
        if voter_id in visited:
            return 0.0  # Cycle detected

        if depth > self.MAX_CHAIN_LENGTH:
            return 0.0  # Chain too long

        visited.add(voter_id)

        # Start with base weight of 1
        total_weight = 1.0

        # Subtract weight that this user has delegated out
        delegated_out = self._get_delegated_weight(voter_id, topic)
        total_weight -= delegated_out

        # Add weight delegated to this user
        delegations_to = self.get_delegations_to(voter_id, topic)
        for delegation in delegations_to:
            # Get the delegator's remaining weight (after their own delegations)
            delegator_weight = self._calculate_weight_recursive(
                delegation.delegator_id,
                topic,
                visited.copy(),  # Copy to allow branching
                depth + 1
            )
            # Add the delegated portion
            total_weight += delegation.weight * delegator_weight

        return max(0.0, total_weight)

    def get_delegation_chain(
        self,
        voter_id: str,
        topic: Optional[str] = None
    ) -> List[str]:
        """Get the chain of delegates for a voter."""
        chain = [voter_id]
        current = voter_id

        for _ in range(self.MAX_CHAIN_LENGTH):
            delegations = self.get_delegations_from(current, topic)
            if not delegations:
                break

            # Get the primary delegate (highest weight)
            primary = max(delegations, key=lambda d: d.weight)
            if primary.delegate_id in chain:
                break  # Cycle

            chain.append(primary.delegate_id)
            current = primary.delegate_id

        return chain

    def _would_create_cycle(
        self,
        delegator_id: str,
        delegate_id: str,
        topic: Optional[str]
    ) -> bool:
        """Check if adding this delegation would create a cycle."""
        # Follow the chain from delegate to see if we get back to delegator
        visited = {delegator_id}
        current = delegate_id

        for _ in range(self.MAX_CHAIN_LENGTH):
            if current in visited:
                return True

            visited.add(current)
            delegations = self.get_delegations_from(current, topic)
            if not delegations:
                return False

            # Check if any delegation points to visited node
            for d in delegations:
                if d.delegate_id in visited:
                    return True

            # Follow primary delegation
            primary = max(delegations, key=lambda d: d.weight)
            current = primary.delegate_id

        return False

    def _get_delegated_weight(
        self,
        delegator_id: str,
        topic: Optional[str]
    ) -> float:
        """Get total weight delegated by a user."""
        delegations = self.get_delegations_from(delegator_id, topic)
        return sum(d.weight for d in delegations)

    def _index_delegation(self, delegation: Delegation):
        """Add delegation to indexes."""
        if delegation.delegator_id not in self._by_delegator:
            self._by_delegator[delegation.delegator_id] = []
        self._by_delegator[delegation.delegator_id].append(delegation.id)

        if delegation.delegate_id not in self._by_delegate:
            self._by_delegate[delegation.delegate_id] = []
        self._by_delegate[delegation.delegate_id].append(delegation.id)
