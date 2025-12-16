"""
Axioms Package

Contains all 14 axiom checker classes.
"""

from .base import Axiom, AxiomChecker
from .core import CertaintyAxiom, SovereigntyAxiom, ManipulationAxiom, DiagnosisAxiom
from .mirror_specific import (
    PostActionAxiom,
    NecessityAxiom,
    ExitFreedomAxiom,
    DepartureInferenceAxiom,
)
from .interaction import AdviceAxiom, ContextCollapseAxiom, CertaintySelfAxiom
from .system import OptimizationAxiom, CoercionAxiom, CaptureAxiom

__all__ = [
    "Axiom",
    "AxiomChecker",
    "CertaintyAxiom",
    "SovereigntyAxiom",
    "ManipulationAxiom",
    "DiagnosisAxiom",
    "PostActionAxiom",
    "NecessityAxiom",
    "ExitFreedomAxiom",
    "DepartureInferenceAxiom",
    "AdviceAxiom",
    "ContextCollapseAxiom",
    "CertaintySelfAxiom",
    "OptimizationAxiom",
    "CoercionAxiom",
    "CaptureAxiom",
]
