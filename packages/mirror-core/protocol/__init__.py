"""
Mirror Protocol - Types, Events, and Exceptions

This module defines the canonical protocol for Mirror interactions.
All Mirror implementations must use these types to ensure constitutional compliance.
"""

from .types import (
    MirrorRequest,
    MirrorResponse,
    InvocationMode,
    TriggerSource,
    Violation,
    ViolationSeverity,
    AuditRecord,
    LayerResult,
)
from .events import (
    ConstitutionalEvent,
    AuditEvent,
    CrisisEvent,
    LeaveEvent,
)
from .exceptions import (
    AxiomViolation,
    SafetyViolation,
    InvocationViolation,
    LeaveAbilityViolation,
)

__all__ = [
    # Types
    "MirrorRequest",
    "MirrorResponse",
    "InvocationMode",
    "TriggerSource",
    "Violation",
    "ViolationSeverity",
    "AuditRecord",
    "LayerResult",
    # Events
    "ConstitutionalEvent",
    "AuditEvent",
    "CrisisEvent",
    "LeaveEvent",
    # Exceptions
    "AxiomViolation",
    "SafetyViolation",
    "InvocationViolation",
    "LeaveAbilityViolation",
]
