"""
Mirror OS Governance Layer
=========================

The governance layer implements The Mirror's constitutional governance framework:
- Constitutional interpretation and enforcement
- Violation detection and remediation
- Multi-AI consensus mechanisms
- Amendment proposal system
- Guardian council oversight

This layer ensures the system remains aligned with its constitutional principles
while allowing for evolution through proper governance processes.
"""

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    InterpretationContext,
    ConstitutionalDecision,
    ViolationType,
    ViolationSeverity
)
from mirror_os.governance.violation_detector import (
    ViolationDetector,
    Violation,
    ViolationReport
)
from mirror_os.governance.consensus_engine import (
    ConsensusEngine,
    ConsensusRequest,
    ConsensusResult,
    AIParticipant
)

__all__ = [
    'ConstitutionalInterpreter',
    'InterpretationContext',
    'ConstitutionalDecision',
    'ViolationType',
    'ViolationSeverity',
    'ViolationDetector',
    'Violation',
    'ViolationReport',
    'ConsensusEngine',
    'ConsensusRequest',
    'ConsensusResult',
    'AIParticipant'
]
