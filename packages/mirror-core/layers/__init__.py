"""
Mirror Core - Safety & Semantic Layers

L1: Safety Layer - Crisis detection and escalation
L2: Semantic Layer - Pattern detection and tension mapping
L3: Expression Layer - Tone adaptation and leave-ability
"""

from .l1_safety import (
    CrisisLevel,
    CrisisSignal,
    SafetyCheck,
    EscalationProtocol,
    SafetyLayer,
)

from .l2_semantic import (
    PatternType,
    Pattern,
    Tension,
    TensionType,
    SemanticContext,
    PatternDetector,
    TensionMapper,
    SemanticLayer,
)

__all__ = [
    "CrisisLevel",
    "CrisisSignal",
    "SafetyCheck",
    "EscalationProtocol",
    "SafetyLayer",
    "PatternType",
    "Pattern",
    "Tension",
    "TensionType",
    "SemanticContext",
    "PatternDetector",
    "TensionMapper",
    "SemanticLayer",
]
