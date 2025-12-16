"""
Mirror Constitution - L0 Axiom Layer

This module contains the 14 immutable axioms that define Mirror.
Each axiom is a checker class that validates requests and responses.

Architecture:
- Pure logic, zero I/O
- Fail-closed: any violation blocks the request
- Stateless: axioms have no side effects
- Composable: axioms can be combined
"""

from .axioms.base import Axiom, AxiomChecker
from .axioms.core import CertaintyAxiom, SovereigntyAxiom, ManipulationAxiom, DiagnosisAxiom
from .axioms.mirror_specific import (
    PostActionAxiom,
    NecessityAxiom,
    ExitFreedomAxiom,
    DepartureInferenceAxiom,
)
from .axioms.interaction import AdviceAxiom, ContextCollapseAxiom, CertaintySelfAxiom
from .axioms.system import OptimizationAxiom, CoercionAxiom, CaptureAxiom

__all__ = [
    "Axiom",
    "AxiomChecker",
    # Core
    "CertaintyAxiom",
    "SovereigntyAxiom",
    "ManipulationAxiom",
    "DiagnosisAxiom",
    # Mirror-specific
    "PostActionAxiom",
    "NecessityAxiom",
    "ExitFreedomAxiom",
    "DepartureInferenceAxiom",
    # Interaction
    "AdviceAxiom",
    "ContextCollapseAxiom",
    "CertaintySelfAxiom",
    # System
    "OptimizationAxiom",
    "CoercionAxiom",
    "CaptureAxiom",
]
