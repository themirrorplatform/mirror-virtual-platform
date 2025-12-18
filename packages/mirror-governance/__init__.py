"""
Mirror Governance - Democratic Constitution Evolution

This package implements Mirror's governance system, enabling:

1. **Democratic Evolution**: Constitution changes via community voting
2. **Anti-Capture Protections**: Bicameral voting, timelocks, constitutional court
3. **Minority Protection**: Supermajority requirements, veto rights
4. **Fork Legitimacy**: Exit rights, recognized forks

Key Principles (from Mirror Constitution):
- Axioms are IMMUTABLE (cannot be changed by governance)
- Invariants can evolve (but only strengthen, never weaken)
- Changes require multi-layer consent (users + guardians + court)
- Minorities can trigger supermajority requirements
- Dissenters can fork legitimately

Usage:
    from mirror_governance import (
        GovernanceEngine,
        Proposal,
        ConstitutionalCourt,
        BicameralVoting,
    )

    # Create governance engine
    governance = GovernanceEngine(constitution)

    # Submit a proposal
    proposal = Proposal.create(
        title="Lower crisis threshold",
        changes={"crisis_threshold": 0.65},
        rationale="We missed 3 escalations last month"
    )

    # Proposal goes through:
    # 1. Validation (doesn't violate axioms)
    # 2. Review period (14 days minimum)
    # 3. Bicameral voting (users + guardians)
    # 4. Constitutional court review
    # 5. Timelock (14 days before activation)
    # 6. Enactment (new constitution version)
"""

from .base import (
    GovernanceConfig,
    GovernanceState,
    ProposalStatus,
    VoteType,
    VoteResult,
    VoteRecord,
    ChamberType,
    GovernanceError,
    AxiomViolationError,
    InvariantWeakeningError,
    QuorumNotMetError,
)

# Proposals
from .proposals.schema import Proposal, ProposalChange, ChangeType
from .proposals.validator import ProposalValidator, ValidationResult

# Voting
from .voting.engine import VotingEngine, VotingSession
from .voting.delegation import DelegationManager, Delegation
from .voting.quadratic import QuadraticCalculator, QuadraticConfig

# Anti-capture protections
from .anti_capture.bicameral import BicameralSystem, BicameralResult, ProposalCategory
from .anti_capture.court import ConstitutionalCourt, CourtRuling, RulingType
from .anti_capture.timelocks import TimelockManager, Timelock, TimelockStatus

# Constitution evolution
from .evolution.versioning import VersionManager, ConstitutionVersion, VersionDiff
from .evolution.migration import MigrationEngine, Migration, MigrationResult

# Identity and fork management
from .identity.fork import ForkManager, Fork, ForkType, ForkLegitimacy
from .identity.exit_rights import ExitRightsManager, ExitRequest, ExitResult, ExitType

__version__ = "1.0.0"
__all__ = [
    # Base types
    "GovernanceConfig",
    "GovernanceState",
    "ProposalStatus",
    "VoteType",
    "VoteResult",
    "VoteRecord",
    "ChamberType",
    "GovernanceError",
    "AxiomViolationError",
    "InvariantWeakeningError",
    "QuorumNotMetError",
    # Proposals
    "Proposal",
    "ProposalChange",
    "ChangeType",
    "ProposalValidator",
    "ValidationResult",
    # Voting
    "VotingEngine",
    "VotingSession",
    "DelegationManager",
    "Delegation",
    "QuadraticCalculator",
    "QuadraticConfig",
    # Anti-capture
    "BicameralSystem",
    "BicameralResult",
    "ProposalCategory",
    "ConstitutionalCourt",
    "CourtRuling",
    "RulingType",
    "TimelockManager",
    "Timelock",
    "TimelockStatus",
    # Evolution
    "VersionManager",
    "ConstitutionVersion",
    "VersionDiff",
    "MigrationEngine",
    "Migration",
    "MigrationResult",
    # Identity
    "ForkManager",
    "Fork",
    "ForkType",
    "ForkLegitimacy",
    "ExitRightsManager",
    "ExitRequest",
    "ExitResult",
    "ExitType",
]
