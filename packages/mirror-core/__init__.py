"""
Mirror Core - The Constitutional Engine for Reflective Intelligence

This is the canonical implementation of the Mirror pattern:
A constitutional boundary layer for AI that enforces sovereignty,
prevents manipulation, and ensures post-action reflection only.

Mirror is not an app. It's a pattern - like REST for APIs or MVC for apps.
This package is the implementation of that pattern.
"""

__version__ = "0.1.0"
__genesis_hash__ = "97aa1848fe4b7b8b13cd30cb2e9f72c1c7c05c56bbd1d478685fef3c0cbe4075"

from .protocol.types import (
    MirrorRequest,
    MirrorResponse,
    InvocationMode,
    Violation,
    ViolationSeverity,
)
from .protocol.exceptions import (
    AxiomViolation,
    SafetyViolation,
    InvocationViolation,
)
from .engine.pipeline import MirrorEngine

__all__ = [
    "MirrorEngine",
    "MirrorRequest",
    "MirrorResponse",
    "InvocationMode",
    "Violation",
    "ViolationSeverity",
    "AxiomViolation",
    "SafetyViolation",
    "InvocationViolation",
    "__genesis_hash__",
]
