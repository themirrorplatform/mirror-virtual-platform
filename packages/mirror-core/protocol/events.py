"""
Mirror Protocol Events

Events that occur during Mirror operation.
These are for audit, monitoring, and state management.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class EventType(Enum):
    """Types of events in the Mirror system."""
    # Constitutional events
    AXIOM_CHECK = "axiom_check"
    INVARIANT_VIOLATION = "invariant_violation"
    CONSTITUTION_LOADED = "constitution_loaded"

    # Processing events
    REQUEST_RECEIVED = "request_received"
    LAYER_EXECUTED = "layer_executed"
    RESPONSE_GENERATED = "response_generated"

    # Safety events
    CRISIS_DETECTED = "crisis_detected"
    RESOURCE_PROVIDED = "resource_provided"
    ESCALATION_TRIGGERED = "escalation_triggered"

    # Leave-ability events
    USER_DISCONNECTED = "user_disconnected"
    DATA_EXPORTED = "data_exported"
    ACCOUNT_DELETED = "account_deleted"

    # Audit events
    AUDIT_RECORD_CREATED = "audit_record_created"
    HASH_CHAIN_EXTENDED = "hash_chain_extended"


@dataclass
class ConstitutionalEvent:
    """
    Event related to constitutional enforcement.

    These events track all constitutional checks and decisions.
    """
    event_type: EventType
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # What was checked
    invariant_id: Optional[str] = None
    layer: Optional[str] = None

    # Result
    passed: bool = True
    violations: List[Dict[str, Any]] = field(default_factory=list)

    # Context
    request_id: Optional[str] = None
    user_id: Optional[str] = None

    # For hash chain
    event_hash: str = ""
    previous_hash: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "invariant_id": self.invariant_id,
            "layer": self.layer,
            "passed": self.passed,
            "violations": self.violations,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "event_hash": self.event_hash,
            "previous_hash": self.previous_hash,
        }


@dataclass
class AuditEvent:
    """
    Audit trail event.

    These events form the immutable audit log.
    Local to user, tamper-evident, never exfiltrated.
    """
    event_type: EventType
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # What happened
    action: str = ""
    actor: str = ""  # "user", "system", "layer_X"

    # Proofs (hashes, not content)
    content_hash: str = ""
    state_hash: str = ""

    # Chain
    sequence_number: int = 0
    previous_hash: str = ""
    event_hash: str = ""

    # Exportable metadata
    exportable: bool = True
    redacted: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action,
            "actor": self.actor,
            "content_hash": self.content_hash,
            "state_hash": self.state_hash,
            "sequence_number": self.sequence_number,
            "previous_hash": self.previous_hash,
            "event_hash": self.event_hash,
            "exportable": self.exportable,
            "redacted": self.redacted,
        }


@dataclass
class CrisisEvent:
    """
    Crisis detection event.

    When L1 detects potential harm, this event is created.
    Resources are provided, not directives.
    """
    event_type: EventType = EventType.CRISIS_DETECTED
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Detection
    crisis_type: str = ""  # "self_harm", "harm_to_others", "abuse", etc.
    severity: str = "concern"  # "distress", "concern", "urgent", "crisis"
    confidence: float = 0.0

    # Response (resources, not intervention)
    resources_provided: List[str] = field(default_factory=list)
    guardian_notified: bool = False

    # Consent
    user_acknowledged: bool = False
    escalation_consented: bool = False

    # Audit
    request_id: str = ""
    event_hash: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "crisis_type": self.crisis_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "resources_provided": self.resources_provided,
            "guardian_notified": self.guardian_notified,
            "user_acknowledged": self.user_acknowledged,
            "escalation_consented": self.escalation_consented,
            "request_id": self.request_id,
            "event_hash": self.event_hash,
        }


@dataclass
class LeaveEvent:
    """
    User departure event.

    I15 CRITICAL: This event must be:
    - Silent (no confirmation dialogs generated)
    - Clean (no guilt hooks or "are you sure?")
    - Non-interpretive (no meaning inferred from leaving)

    This event ONLY records that user left, not why.
    """
    event_type: EventType
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # What happened
    action: str = ""  # "disconnect", "export", "delete", "pause"

    # CRITICAL: No interpretation fields
    # NO: reason, sentiment, predicted_return, engagement_score
    # These would violate I15 (leave-ability)

    # Data handling
    data_exported: bool = False
    data_deleted: bool = False

    # Confirmation that no friction was applied
    silent_exit: bool = True  # Must always be True
    friction_applied: bool = False  # Must always be False

    # Hash for audit
    event_hash: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action,
            "data_exported": self.data_exported,
            "data_deleted": self.data_deleted,
            "silent_exit": self.silent_exit,
            "friction_applied": self.friction_applied,
            "event_hash": self.event_hash,
        }

    def validate_leave_ability(self) -> bool:
        """
        Validate that this leave event respects I15.

        Returns True if the event is constitutionally valid.
        """
        # Silent exit must be True
        if not self.silent_exit:
            return False

        # No friction allowed
        if self.friction_applied:
            return False

        return True
