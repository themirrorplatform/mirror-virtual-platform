"""
Mirror Constitution Module

The constitution defines what Mirror IS.
It is not configuration - it is architectural law.

Layers:
- L0: Meta-Axioms (I1-I15) - IMMUTABLE
- L1: Safety & Legality - Modifiable via declaration process
- L2: Philosophical Stances - Modifiable via amendment
- L3: Implementation - Freely evolvable

The Invocation Contract is part of L0:
- Mirror ONLY activates after user action
- Mirror NEVER initiates guidance
- Mirror reflects, never directs
"""

from .axioms import (
    I15LeaveAbilityChecker,
    I15CheckResult,
    check_leave_ability,
    validate_exit_flow,
)

__all__ = [
    "I15LeaveAbilityChecker",
    "I15CheckResult",
    "check_leave_ability",
    "validate_exit_flow",
]
