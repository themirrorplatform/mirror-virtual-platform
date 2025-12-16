"""
Mirror Core - Constitutional AI Engine

This is the canonical implementation of Mirror's constitutional engine.
It enforces the 14 immutable axioms through a multi-layer pipeline.

Layers:
- L0: Invocation Contract & Axiom Checker (constitutional layer)
- L1: Safety Layer (crisis detection, escalation)
- L2: Semantic Layer (pattern detection, tension mapping)
- L3: Expression Layer (tone adaptation, leave-ability)

Version: 1.0.0
Date: 2025-12-16
"""

from .protocol import (
    InvocationMode,
    AxiomViolation,
    MirrorRequest,
    MirrorResponse,
    InvocationContract,
)

__version__ = "1.0.0"

__all__ = [
    "InvocationMode",
    "AxiomViolation",
    "MirrorRequest",
    "MirrorResponse",
    "InvocationContract",
]
