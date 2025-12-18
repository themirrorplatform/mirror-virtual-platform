"""
Mirror Storage Base - Abstract Interface for Data Sovereignty

This module defines the canonical storage interface that all storage
backends must implement. The interface enforces:

1. User data ownership
2. Local-first operation
3. Export capability
4. Deletion capability
5. Audit trail integrity

All storage implementations MUST support these operations.
Cloud storage is ALWAYS optional and encrypted.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any, AsyncIterator
from datetime import datetime
import hashlib
import uuid


class StorageType(Enum):
    """Type of storage backend."""
    LOCAL = "local"      # Local filesystem (SQLite, file)
    CLOUD = "cloud"      # Cloud provider (Supabase, S3)
    MEMORY = "memory"    # In-memory (testing)


@dataclass(frozen=True)
class StorageCapabilities:
    """
    Declares what a storage backend can do.

    Used by sync engine to make decisions about data flow.
    """
    storage_type: StorageType = StorageType.LOCAL
    supports_sync: bool = False
    supports_realtime: bool = False
    supports_encryption: bool = True
    supports_compression: bool = True
    max_record_size: int = 10 * 1024 * 1024  # 10MB default
    requires_network: bool = False

    def to_dict(self) -> dict:
        return {
            "storage_type": self.storage_type.value,
            "supports_sync": self.supports_sync,
            "supports_realtime": self.supports_realtime,
            "supports_encryption": self.supports_encryption,
            "requires_network": self.requires_network,
        }


@dataclass
class StorageConfig:
    """Configuration for storage backends."""
    user_id: str
    base_path: Optional[str] = None  # For local storage
    encryption_key: Optional[bytes] = None
    encrypt_at_rest: bool = True
    compress_data: bool = True

    # Cloud settings (optional)
    cloud_url: Optional[str] = None
    cloud_key: Optional[str] = None
    sync_enabled: bool = False

    # Retention settings
    auto_backup: bool = True
    backup_retention_days: int = 30


# Data Models - These represent user's sovereign data

@dataclass
class Reflection:
    """
    A single reflection entry - user's thoughts/journal.

    This is the user's data. They own it completely.
    """
    id: str
    user_id: str
    content: str  # User's input
    response: Optional[str]  # Mirror's reflection (if any)
    mode: str  # POST_ACTION, GUIDANCE, etc.
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

    # Sync metadata
    local_only: bool = False  # If True, never syncs to cloud
    synced_at: Optional[datetime] = None

    # Integrity
    content_hash: str = field(default="")

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = hashlib.sha256(
                f"{self.content}{self.response or ''}".encode()
            ).hexdigest()

    @classmethod
    def create(
        cls,
        user_id: str,
        content: str,
        response: Optional[str] = None,
        mode: str = "POST_ACTION",
        metadata: Dict[str, Any] = None,
        local_only: bool = False
    ) -> "Reflection":
        """Factory method to create new reflection."""
        return cls(
            id=str(uuid.uuid4()),
            user_id=user_id,
            content=content,
            response=response,
            mode=mode,
            created_at=datetime.utcnow(),
            metadata=metadata or {},
            local_only=local_only,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "response": self.response,
            "mode": self.mode,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
            "local_only": self.local_only,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
            "content_hash": self.content_hash,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Reflection":
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            content=data["content"],
            response=data.get("response"),
            mode=data["mode"],
            created_at=datetime.fromisoformat(data["created_at"]),
            metadata=data.get("metadata", {}),
            local_only=data.get("local_only", False),
            synced_at=datetime.fromisoformat(data["synced_at"]) if data.get("synced_at") else None,
            content_hash=data.get("content_hash", ""),
        )


@dataclass
class Pattern:
    """
    A detected pattern in user's reflections.

    Patterns are observations, not diagnoses.
    """
    id: str
    user_id: str
    pattern_type: str  # emotion, topic, behavior
    name: str  # e.g., "anxiety", "work-life balance"
    occurrences: int
    confidence: float  # 0.0 to 1.0
    first_seen: datetime
    last_seen: datetime
    contexts: List[str] = field(default_factory=list)  # Reflection IDs

    local_only: bool = False
    synced_at: Optional[datetime] = None

    @classmethod
    def create(
        cls,
        user_id: str,
        pattern_type: str,
        name: str,
        confidence: float = 0.5,
        local_only: bool = False
    ) -> "Pattern":
        now = datetime.utcnow()
        return cls(
            id=str(uuid.uuid4()),
            user_id=user_id,
            pattern_type=pattern_type,
            name=name,
            occurrences=1,
            confidence=confidence,
            first_seen=now,
            last_seen=now,
            local_only=local_only,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "pattern_type": self.pattern_type,
            "name": self.name,
            "occurrences": self.occurrences,
            "confidence": self.confidence,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "contexts": self.contexts,
            "local_only": self.local_only,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Pattern":
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            pattern_type=data["pattern_type"],
            name=data["name"],
            occurrences=data["occurrences"],
            confidence=data["confidence"],
            first_seen=datetime.fromisoformat(data["first_seen"]),
            last_seen=datetime.fromisoformat(data["last_seen"]),
            contexts=data.get("contexts", []),
            local_only=data.get("local_only", False),
            synced_at=datetime.fromisoformat(data["synced_at"]) if data.get("synced_at") else None,
        )


@dataclass
class Tension:
    """
    A detected tension/contradiction in user's reflections.

    Tensions are observations about conflicts, not judgments.
    """
    id: str
    user_id: str
    tension_type: str  # value_conflict, desire_conflict, identity_tension
    description: str
    severity: float  # 0.0 to 1.0 (intensity, not "badness")
    first_detected: datetime
    last_detected: datetime
    evidence: List[str] = field(default_factory=list)  # Reflection IDs

    local_only: bool = False
    synced_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tension_type": self.tension_type,
            "description": self.description,
            "severity": self.severity,
            "first_detected": self.first_detected.isoformat(),
            "last_detected": self.last_detected.isoformat(),
            "evidence": self.evidence,
            "local_only": self.local_only,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Tension":
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            tension_type=data["tension_type"],
            description=data["description"],
            severity=data["severity"],
            first_detected=datetime.fromisoformat(data["first_detected"]),
            last_detected=datetime.fromisoformat(data["last_detected"]),
            evidence=data.get("evidence", []),
            local_only=data.get("local_only", False),
            synced_at=datetime.fromisoformat(data["synced_at"]) if data.get("synced_at") else None,
        )


@dataclass
class AuditEvent:
    """
    Tamper-evident audit trail entry.

    The audit trail is immutable and user-controlled.
    User can export it but cannot modify past entries.
    """
    id: str
    user_id: str
    event_type: str  # REQUEST, RESPONSE, VIOLATION, CRISIS, etc.
    timestamp: datetime
    data: Dict[str, Any]
    previous_hash: Optional[str]  # Hash chain
    event_hash: str

    def __post_init__(self):
        if not self.event_hash:
            self.event_hash = self._compute_hash()

    def _compute_hash(self) -> str:
        """Compute tamper-evident hash."""
        content = f"{self.id}{self.user_id}{self.event_type}"
        content += f"{self.timestamp.isoformat()}{self.data}"
        content += f"{self.previous_hash or ''}"
        return hashlib.sha256(content.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Verify this event hasn't been tampered with."""
        return self.event_hash == self._compute_hash()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "previous_hash": self.previous_hash,
            "event_hash": self.event_hash,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AuditEvent":
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            event_type=data["event_type"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            data=data["data"],
            previous_hash=data.get("previous_hash"),
            event_hash=data["event_hash"],
        )


# Exceptions

class StorageError(Exception):
    """Base storage exception."""
    pass


class DataNotFoundError(StorageError):
    """Requested data doesn't exist."""
    pass


class IntegrityError(StorageError):
    """Data integrity check failed."""
    pass


class EncryptionError(StorageError):
    """Encryption/decryption failed."""
    pass


class SyncError(StorageError):
    """Sync operation failed."""
    pass


class MirrorStorage(ABC):
    """
    Abstract base class for all storage backends.

    All implementations MUST support:
    1. CRUD for reflections, patterns, tensions
    2. Append-only audit trail
    3. Full data export
    4. Complete data deletion

    Implementations SHOULD support:
    1. Encryption at rest
    2. Compression
    3. Selective sync (for cloud backends)
    """

    def __init__(self, config: StorageConfig):
        self.config = config
        self._initialized = False

    @property
    @abstractmethod
    def capabilities(self) -> StorageCapabilities:
        """Declare storage capabilities."""
        pass

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize storage (create tables, connect, etc.)."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close storage connections."""
        pass

    # Reflections

    @abstractmethod
    async def save_reflection(self, reflection: Reflection) -> str:
        """Save a reflection. Returns the ID."""
        pass

    @abstractmethod
    async def get_reflection(self, reflection_id: str) -> Optional[Reflection]:
        """Get a single reflection by ID."""
        pass

    @abstractmethod
    async def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        since: Optional[datetime] = None
    ) -> List[Reflection]:
        """Get user's reflections with pagination."""
        pass

    @abstractmethod
    async def delete_reflection(self, reflection_id: str) -> bool:
        """Delete a reflection. Returns True if deleted."""
        pass

    # Patterns

    @abstractmethod
    async def save_pattern(self, pattern: Pattern) -> str:
        """Save or update a pattern. Returns the ID."""
        pass

    @abstractmethod
    async def get_patterns(self, user_id: str) -> List[Pattern]:
        """Get all patterns for a user."""
        pass

    @abstractmethod
    async def delete_pattern(self, pattern_id: str) -> bool:
        """Delete a pattern."""
        pass

    # Tensions

    @abstractmethod
    async def save_tension(self, tension: Tension) -> str:
        """Save or update a tension."""
        pass

    @abstractmethod
    async def get_tensions(self, user_id: str) -> List[Tension]:
        """Get all tensions for a user."""
        pass

    @abstractmethod
    async def delete_tension(self, tension_id: str) -> bool:
        """Delete a tension."""
        pass

    # Audit Trail (append-only)

    @abstractmethod
    async def append_audit_event(self, event: AuditEvent) -> str:
        """Append an audit event. Cannot be deleted or modified."""
        pass

    @abstractmethod
    async def get_audit_trail(
        self,
        user_id: str,
        limit: int = 100,
        since: Optional[datetime] = None
    ) -> List[AuditEvent]:
        """Get audit trail for a user."""
        pass

    @abstractmethod
    async def verify_audit_chain(self, user_id: str) -> bool:
        """Verify the integrity of the audit trail hash chain."""
        pass

    # Export & Deletion (Critical for sovereignty)

    @abstractmethod
    async def export_all(self, user_id: str) -> Dict[str, Any]:
        """
        Export ALL user data.

        This is a constitutional requirement - users must be able
        to export their complete data at any time.
        """
        pass

    @abstractmethod
    async def delete_all(self, user_id: str) -> bool:
        """
        Delete ALL user data.

        This is a constitutional requirement - users must be able
        to completely delete their data at any time.

        Returns True if deletion was complete.
        """
        pass

    # Statistics

    async def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get storage statistics for a user."""
        reflections = await self.get_reflections(user_id, limit=10000)
        patterns = await self.get_patterns(user_id)
        tensions = await self.get_tensions(user_id)
        audit = await self.get_audit_trail(user_id, limit=10000)

        return {
            "reflection_count": len(reflections),
            "pattern_count": len(patterns),
            "tension_count": len(tensions),
            "audit_event_count": len(audit),
            "capabilities": self.capabilities.to_dict(),
        }

    # Context manager support

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
