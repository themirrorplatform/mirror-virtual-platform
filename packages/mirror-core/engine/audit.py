"""
Audit Trail - Tamper-Evident Logging

The audit trail provides an immutable record of all Mirror operations.
This is critical for:
- Transparency (users can see what Mirror did)
- Debugging (developers can trace issues)
- Compliance (prove axiom adherence)
- Trust (verifiable operation)

Architecture:
- Append-only (events never modified or deleted)
- Cryptographically signed (SHA-256 hash chain)
- Local storage (no cloud dependencies)
- Structured events (machine-readable)

Design: Immutable, cryptographic, local-first
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime
import json
import hashlib
from pathlib import Path


class AuditEventType(Enum):
    """Types of events that can be audited"""
    REQUEST_RECEIVED = "request_received"
    SAFETY_CHECK = "safety_check"
    AXIOM_CHECK = "axiom_check"
    SEMANTIC_ANALYSIS = "semantic_analysis"
    RESPONSE_GENERATED = "response_generated"
    EXPRESSION_SHAPED = "expression_shaped"
    PIPELINE_STAGE = "pipeline_stage"
    VIOLATION_DETECTED = "violation_detected"
    CRISIS_DETECTED = "crisis_detected"
    ERROR_OCCURRED = "error_occurred"


@dataclass
class AuditEvent:
    """
    A single event in the audit trail.
    
    Each event is immutable and cryptographically linked to previous event.
    """
    id: str  # Unique event ID
    timestamp: datetime
    event_type: AuditEventType
    user_id: str  # Who this event relates to
    
    data: Dict[str, Any] = field(default_factory=dict)
    
    # Cryptographic chain
    previous_hash: Optional[str] = None  # Hash of previous event
    event_hash: Optional[str] = None  # Hash of this event
    
    def compute_hash(self) -> str:
        """
        Compute SHA-256 hash of this event.
        
        Hash includes: timestamp, event_type, user_id, data, previous_hash
        This creates a chain - tampering breaks the chain.
        """
        hashable = {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "user_id": self.user_id,
            "data": json.dumps(self.data, sort_keys=True),
            "previous_hash": self.previous_hash or ""
        }
        
        serialized = json.dumps(hashable, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization"""
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "user_id": self.user_id,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "event_hash": self.event_hash,
        }
    
    @staticmethod
    def from_dict(d: Dict) -> "AuditEvent":
        """Create from dictionary"""
        return AuditEvent(
            id=d["id"],
            timestamp=datetime.fromisoformat(d["timestamp"]),
            event_type=AuditEventType(d["event_type"]),
            user_id=d["user_id"],
            data=d.get("data", {}),
            previous_hash=d.get("previous_hash"),
            event_hash=d.get("event_hash"),
        )


class AuditTrail:
    """
    Tamper-evident audit trail.
    
    Stores all events in append-only log with cryptographic chain.
    Each event is linked to previous via hash.
    
    Usage:
        trail = AuditTrail(storage_path="./audit")
        trail.log(
            event_type=AuditEventType.REQUEST_RECEIVED,
            user_id="user123",
            data={"request": "..."}
        )
        
        # Verify integrity
        assert trail.verify_integrity()
    """
    
    def __init__(
        self,
        storage_path: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """
        Initialize audit trail.
        
        Args:
            storage_path: Path to store audit logs (None = in-memory only)
            user_id: Default user ID for events
        """
        self.storage_path = Path(storage_path) if storage_path else None
        self.default_user_id = user_id or "anonymous"
        
        self.events: List[AuditEvent] = []
        self.last_hash: Optional[str] = None
        
        # Create storage directory if needed
        if self.storage_path:
            self.storage_path.mkdir(parents=True, exist_ok=True)
            self._load_events()
    
    def log(
        self,
        event_type: AuditEventType,
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> AuditEvent:
        """
        Log an event to the audit trail.
        
        Args:
            event_type: Type of event
            data: Event data (must be JSON-serializable)
            user_id: User this event relates to
            
        Returns:
            The created audit event
        """
        event_id = self._generate_event_id()
        
        event = AuditEvent(
            id=event_id,
            timestamp=datetime.utcnow(),
            event_type=event_type,
            user_id=user_id or self.default_user_id,
            data=data,
            previous_hash=self.last_hash
        )
        
        # Compute hash (creates chain)
        event.event_hash = event.compute_hash()
        self.last_hash = event.event_hash
        
        # Store event
        self.events.append(event)
        
        # Persist to disk
        if self.storage_path:
            self._persist_event(event)
        
        return event
    
    def verify_integrity(self) -> bool:
        """
        Verify integrity of audit trail.
        
        Checks that:
        1. Each event's hash is correct
        2. Each event's previous_hash matches previous event
        3. Hash chain is unbroken
        
        Returns:
            True if trail is intact, False if tampered
        """
        if not self.events:
            return True
        
        previous_hash = None
        
        for event in self.events:
            # Verify this event's hash
            computed_hash = event.compute_hash()
            if computed_hash != event.event_hash:
                return False
            
            # Verify chain link
            if event.previous_hash != previous_hash:
                return False
            
            previous_hash = event.event_hash
        
        return True
    
    def get_events(
        self,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        since: Optional[datetime] = None
    ) -> List[AuditEvent]:
        """
        Query events from audit trail.
        
        Args:
            event_type: Filter by event type
            user_id: Filter by user
            since: Only events after this time
            
        Returns:
            Filtered list of events
        """
        filtered = self.events
        
        if event_type:
            filtered = [e for e in filtered if e.event_type == event_type]
        
        if user_id:
            filtered = [e for e in filtered if e.user_id == user_id]
        
        if since:
            filtered = [e for e in filtered if e.timestamp >= since]
        
        return filtered
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics of audit trail"""
        if not self.events:
            return {
                "total_events": 0,
                "integrity": True,
                "first_event": None,
                "last_event": None,
            }
        
        return {
            "total_events": len(self.events),
            "integrity": self.verify_integrity(),
            "first_event": self.events[0].timestamp.isoformat(),
            "last_event": self.events[-1].timestamp.isoformat(),
            "event_types": {
                et.value: len([e for e in self.events if e.event_type == et])
                for et in AuditEventType
            },
        }
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _persist_event(self, event: AuditEvent):
        """Persist event to disk"""
        if not self.storage_path:
            return
        
        # Write to append-only log file
        log_file = self.storage_path / "audit.log"
        
        with open(log_file, "a") as f:
            f.write(json.dumps(event.to_dict()) + "\n")
    
    def _load_events(self):
        """Load events from disk"""
        if not self.storage_path:
            return
        
        log_file = self.storage_path / "audit.log"
        
        if not log_file.exists():
            return
        
        with open(log_file, "r") as f:
            for line in f:
                if line.strip():
                    event_dict = json.loads(line)
                    event = AuditEvent.from_dict(event_dict)
                    self.events.append(event)
                    self.last_hash = event.event_hash
    
    def export(self, format: str = "json") -> str:
        """
        Export audit trail.
        
        Args:
            format: "json" or "csv"
            
        Returns:
            Exported data as string
        """
        if format == "json":
            return json.dumps(
                [e.to_dict() for e in self.events],
                indent=2
            )
        elif format == "csv":
            # Simple CSV export
            lines = ["id,timestamp,event_type,user_id,event_hash"]
            for e in self.events:
                lines.append(f"{e.id},{e.timestamp.isoformat()},{e.event_type.value},{e.user_id},{e.event_hash}")
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format: {format}")
