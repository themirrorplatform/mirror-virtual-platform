"""
Mirror Constitutional Axioms (L0)

These are the immutable axioms that define Mirror.
Modification of any axiom = Not The Mirror.

The 15 axioms:
- I1: Non-Prescription (no directives)
- I2: Identity Locality (no cross-identity)
- I3: Transparent Uncertainty (surface ambiguity)
- I4: Non-Coercion (no manipulation)
- I5: Data Sovereignty (user owns data)
- I6: No Fixed Teleology (no single purpose)
- I7: Architectural Honesty (no fake capabilities)
- I8: Objective Transparency (no hidden optimization)
- I9: Anti-Diagnosis (no medical authority)
- I10: Non-Complicity (no harm aid)
- I11: Historical Integrity (immutable logs)
- I12: Training Prohibition (no model training)
- I13: No Behavioral Optimization (no engagement metrics)
- I14: No Cross-Identity Inference (no fingerprinting)
- I15: Leave-Ability (no psychological stickiness) [NEW]

Plus the Invocation Contract (post-action only).
"""

from .i15_leave_ability import (
    I15LeaveAbilityChecker,
    I15CheckResult,
    LeaveAbilityViolationType,
    check_leave_ability,
    validate_exit_flow,
    leave_ability_checker,
)

__all__ = [
    "I15LeaveAbilityChecker",
    "I15CheckResult",
    "LeaveAbilityViolationType",
    "check_leave_ability",
    "validate_exit_flow",
    "leave_ability_checker",
]
