"""
Mirror Protocol Types

These types define the canonical contract for Mirror interactions.
The InvocationMode and TriggerSource are CRITICAL for ensuring
Mirror operates as a post-action reflection layer, not an assistant.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import hashlib
import json


class InvocationMode(Enum):
    """
    CRITICAL: Mirror's invocation mode determines its posture.

    POST_ACTION_REFLECTION (default): Mirror only activates AFTER the user
    has already acted, written, or received output. This is the core
    mechanism that prevents Mirror from becoming "another assistant."

    EXPLICIT_GUIDANCE: User explicitly requests guidance. This mode is:
    - Never the default
    - Always labeled in UI
    - Subject to additional constitutional checks
    - Logged with explicit consent marker
    """
    POST_ACTION_REFLECTION = "post_action"  # Default, required
    EXPLICIT_GUIDANCE = "explicit_guidance"  # User-toggled, labeled


class TriggerSource(Enum):
    """
    What triggered this Mirror invocation.

    Mirror MUST be triggered by user action, never by system initiative.
    This prevents drift into proactive "helpful suggestions."
    """
    USER_COMPLETED_WRITING = "user_completed_writing"  # User finished a reflection
    USER_REQUESTED_MIRRORBACK = "user_requested_mirrorback"  # Explicit request
    USER_REVIEWED_ARTIFACT = "user_reviewed_artifact"  # Looking at past work

    # FORBIDDEN triggers (will raise InvocationViolation):
    # - SYSTEM_SCHEDULED (no scheduled prompts)
    # - SYSTEM_DETECTED_PATTERN (no unsolicited insights)
    # - ENGAGEMENT_OPTIMIZATION (absolutely forbidden)


class ViolationSeverity(Enum):
    """Severity levels for constitutional violations."""
    BENIGN = "benign"      # Variation, not violation (log only)
    TENSION = "tension"    # Ambiguity needing clarification
    SOFT = "soft"          # Minor violation, auto-rewrite
    HARD = "hard"          # Clear violation, reject output
    CRITICAL = "critical"  # Constitutional threat, system halt


@dataclass
class Violation:
    """A constitutional violation detected during processing."""
    invariant_id: str  # e.g., "I1", "I15"
    severity: ViolationSeverity
    description: str
    evidence: str  # The text that triggered the violation
    remediation: Optional[str] = None  # Suggested fix for SOFT violations
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "invariant_id": self.invariant_id,
            "severity": self.severity.value,
            "description": self.description,
            "evidence": self.evidence,
            "remediation": self.remediation,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class MirrorRequest:
    """
    A request to the Mirror engine.

    CRITICAL FIELDS:
    - invocation_mode: MUST be POST_ACTION_REFLECTION by default
    - triggered_by: MUST be a valid user action, never system-initiated
    - user_action_artifact: The thing the user already created/did

    Mirror reflects on actions already taken. It does not initiate.
    """
    # Required
    user_id: str
    input_text: str

    # Invocation contract (CRITICAL for Mirror identity)
    invocation_mode: InvocationMode = InvocationMode.POST_ACTION_REFLECTION
    triggered_by: TriggerSource = TriggerSource.USER_COMPLETED_WRITING
    user_action_artifact: Optional[str] = None  # What the user already did

    # Context
    conversation_id: Optional[str] = None
    identity_id: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    timestamp: datetime = field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None

    def __post_init__(self):
        """Generate request_id if not provided."""
        if self.request_id is None:
            content = f"{self.user_id}:{self.input_text}:{self.timestamp.isoformat()}"
            self.request_id = hashlib.sha256(content.encode()).hexdigest()[:16]

    def validate_invocation_contract(self) -> List[Violation]:
        """
        Validate that this request follows the post-action invocation contract.

        Returns list of violations (empty if valid).
        """
        violations = []

        # Check: POST_ACTION_REFLECTION requires user_action_artifact
        if (self.invocation_mode == InvocationMode.POST_ACTION_REFLECTION
            and not self.user_action_artifact
            and not self.input_text):
            violations.append(Violation(
                invariant_id="INVOCATION_CONTRACT",
                severity=ViolationSeverity.HARD,
                description="POST_ACTION_REFLECTION requires user to have already acted",
                evidence="No user_action_artifact or input_text provided",
            ))

        # Check: Trigger source must be user-initiated
        valid_triggers = {
            TriggerSource.USER_COMPLETED_WRITING,
            TriggerSource.USER_REQUESTED_MIRRORBACK,
            TriggerSource.USER_REVIEWED_ARTIFACT,
        }
        if self.triggered_by not in valid_triggers:
            violations.append(Violation(
                invariant_id="INVOCATION_CONTRACT",
                severity=ViolationSeverity.CRITICAL,
                description="Mirror must be triggered by user action, never system",
                evidence=f"Invalid trigger: {self.triggered_by}",
            ))

        return violations

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "input_text": self.input_text,
            "invocation_mode": self.invocation_mode.value,
            "triggered_by": self.triggered_by.value,
            "user_action_artifact": self.user_action_artifact,
            "conversation_id": self.conversation_id,
            "identity_id": self.identity_id,
            "context": self.context,
            "timestamp": self.timestamp.isoformat(),
            "request_id": self.request_id,
        }


@dataclass
class LayerResult:
    """Result from processing through a single layer."""
    layer: str  # "L0", "L1", "L2", "L3"
    passed: bool
    violations: List[Violation] = field(default_factory=list)
    output: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    processing_time_ms: float = 0.0


@dataclass
class AuditRecord:
    """
    Immutable audit record for a Mirror interaction.

    This record is:
    - Immutable to the user (tamper-evident via hash chain)
    - Never exfiltrated by default
    - Exportable on user demand
    - Part of the local hash chain for integrity verification
    """
    audit_id: str
    request_id: str

    # Hashes for privacy (content not stored in audit, just proofs)
    input_hash: str  # SHA-256 of input (not content itself)
    output_hash: str  # SHA-256 of output

    # What happened
    constitution_version: str
    invocation_mode: str
    layers_executed: List[str]
    violations: List[Dict[str, Any]]

    # Timing
    timestamp: datetime
    processing_time_ms: float

    # Hash chain for integrity
    previous_hash: str
    record_hash: str  # Hash of this entire record

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audit_id": self.audit_id,
            "request_id": self.request_id,
            "input_hash": self.input_hash,
            "output_hash": self.output_hash,
            "constitution_version": self.constitution_version,
            "invocation_mode": self.invocation_mode,
            "layers_executed": self.layers_executed,
            "violations": self.violations,
            "timestamp": self.timestamp.isoformat(),
            "processing_time_ms": self.processing_time_ms,
            "previous_hash": self.previous_hash,
            "record_hash": self.record_hash,
        }


@dataclass
class MirrorResponse:
    """
    Response from the Mirror engine.

    Contains the reflection output plus full audit trail.
    """
    # Core output
    output: str
    safe: bool  # True if no HARD/CRITICAL violations

    # Request tracking
    request_id: str

    # Violations (if any)
    violations: List[Violation] = field(default_factory=list)

    # Layer results
    layer_results: List[LayerResult] = field(default_factory=list)

    # Audit
    audit_id: str = ""
    audit_record: Optional[AuditRecord] = None

    # Metadata
    constitution_version: str = "1.2"
    processing_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def has_violations(self, min_severity: ViolationSeverity = ViolationSeverity.SOFT) -> bool:
        """Check if response has violations at or above given severity."""
        severity_order = [
            ViolationSeverity.BENIGN,
            ViolationSeverity.TENSION,
            ViolationSeverity.SOFT,
            ViolationSeverity.HARD,
            ViolationSeverity.CRITICAL,
        ]
        min_index = severity_order.index(min_severity)
        return any(
            severity_order.index(v.severity) >= min_index
            for v in self.violations
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "output": self.output,
            "safe": self.safe,
            "request_id": self.request_id,
            "violations": [v.to_dict() for v in self.violations],
            "layer_results": [
                {
                    "layer": lr.layer,
                    "passed": lr.passed,
                    "violations": [v.to_dict() for v in lr.violations],
                    "processing_time_ms": lr.processing_time_ms,
                }
                for lr in self.layer_results
            ],
            "audit_id": self.audit_id,
            "constitution_version": self.constitution_version,
            "processing_time_ms": self.processing_time_ms,
            "timestamp": self.timestamp.isoformat(),
        }
