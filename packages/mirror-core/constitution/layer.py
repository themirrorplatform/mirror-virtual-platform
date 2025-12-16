"""
Constitutional Layer - Aggregates all axiom checkers

This layer runs all 14 axiom checkers on requests and responses.
"""

from typing import List

from protocol.types import MirrorRequest, MirrorResponse, AxiomViolation
from .axioms import (
    CertaintyAxiom, SovereigntyAxiom, ManipulationAxiom, DiagnosisAxiom,
    PostActionAxiom, NecessityAxiom, ExitFreedomAxiom, DepartureInferenceAxiom,
    AdviceAxiom, ContextCollapseAxiom, CertaintySelfAxiom,
    OptimizationAxiom, CoercionAxiom, CaptureAxiom
)


class ConstitutionalLayer:
    """
    L0 Constitutional Layer - Enforces all 14 axioms.
    
    This is the foundation of Mirror's safety guarantees.
    """
    
    def __init__(self):
        self.checkers = [
            # Core axioms
            CertaintyAxiom(),
            SovereigntyAxiom(),
            ManipulationAxiom(),
            DiagnosisAxiom(),
            # Mirror-specific
            PostActionAxiom(),
            NecessityAxiom(),
            ExitFreedomAxiom(),
            DepartureInferenceAxiom(),
            # Interaction
            AdviceAxiom(),
            ContextCollapseAxiom(),
            CertaintySelfAxiom(),
            # System
            OptimizationAxiom(),
            CoercionAxiom(),
            CaptureAxiom(),
        ]
    
    def check_request(self, request: MirrorRequest) -> List[AxiomViolation]:
        """Check request against all axioms"""
        violations = []
        for checker in self.checkers:
            violations.extend(checker.check_request(request))
        return violations
    
    def check_response(self, request: MirrorRequest, response: MirrorResponse) -> List[AxiomViolation]:
        """Check response against all axioms"""
        violations = []
        for checker in self.checkers:
            violations.extend(checker.check_response(request, response))
        return violations
