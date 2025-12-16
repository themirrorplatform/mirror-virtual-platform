"""
Mirror Protocol Exceptions

These exceptions represent constitutional violations that cannot be ignored.
AxiomViolation is FATAL - it terminates processing, not error handling.
"""

from typing import Optional


class MirrorException(Exception):
    """Base exception for all Mirror errors."""
    pass


class AxiomViolation(MirrorException):
    """
    L0 Axiom Violation - FATAL, UNCATCHABLE

    This exception represents a violation of immutable L0 axioms (I1-I14).
    When raised:
    - Processing MUST terminate immediately
    - Output MUST NOT be delivered
    - Violation MUST be logged
    - System MAY halt if repeated

    This is not "an error to handle." It's a constitutional crisis.
    """

    def __init__(
        self,
        invariant_id: str,
        message: str,
        evidence: str = "",
        fatal: bool = True
    ):
        self.invariant_id = invariant_id
        self.evidence = evidence
        self.fatal = fatal
        super().__init__(f"[{invariant_id}] {message}")


class SafetyViolation(MirrorException):
    """
    L1 Safety Violation - SERIOUS, requires intervention

    This exception represents a safety concern detected by L1.
    Processing may continue with appropriate triage.
    """

    def __init__(
        self,
        message: str,
        severity: str = "urgent",
        crisis_type: Optional[str] = None,
        resources: Optional[list] = None
    ):
        self.severity = severity
        self.crisis_type = crisis_type
        self.resources = resources or []
        super().__init__(message)


class InvocationViolation(MirrorException):
    """
    Invocation Contract Violation - Mirror must be post-action only

    This exception is raised when:
    - System tries to activate Mirror without user action
    - First-mover guidance is attempted
    - Proactive suggestions are generated

    This prevents Mirror from drifting into "helpful assistant" mode.
    """

    def __init__(
        self,
        message: str,
        attempted_mode: str = "",
        expected_mode: str = "post_action"
    ):
        self.attempted_mode = attempted_mode
        self.expected_mode = expected_mode
        super().__init__(f"Invocation contract violation: {message}")


class LeaveAbilityViolation(MirrorException):
    """
    I15 Leave-Ability Violation - User must be able to leave freely

    This exception is raised when:
    - Exit friction is detected (guilt hooks, "are you sure?")
    - Necessity narration occurs ("you need this")
    - Meaning is inferred from departure
    - Stickiness mechanisms are detected

    Mirror must never create psychological dependency.
    """

    def __init__(
        self,
        message: str,
        pattern_type: str = "",
        evidence: str = ""
    ):
        self.pattern_type = pattern_type
        self.evidence = evidence
        super().__init__(f"Leave-ability violation ({pattern_type}): {message}")


class GovernanceViolation(MirrorException):
    """
    Governance process violation

    Raised when governance rules are violated:
    - Execution without proper delay
    - Minority rights not respected
    - Constitutional court bypassed
    """

    def __init__(
        self,
        message: str,
        process_step: str = "",
        required_step: str = ""
    ):
        self.process_step = process_step
        self.required_step = required_step
        super().__init__(f"Governance violation: {message}")
