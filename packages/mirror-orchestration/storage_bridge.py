"""
Storage Bridge - Connects Orchestration to Storage Layer

Handles persistence of reflections, patterns, tensions, and audit trail
while enforcing data sovereignty (Axiom 2).

Constitutional Compliance:
- Axiom 2: User owns data (export, delete capabilities)
- Axiom 10: No context collapse (proper data isolation)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import uuid
import hashlib
import json


class StorageType(Enum):
    """Supported storage backends."""
    MEMORY = "memory"
    SQLITE = "sqlite"
    SUPABASE = "supabase"


@dataclass
class StoredReflection:
    """A stored reflection."""
    id: str
    user_id: str
    session_id: str
    user_input: str
    reflection_text: str
    patterns: List[Dict] = field(default_factory=list)
    tensions: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "user_input": self.user_input,
            "reflection_text": self.reflection_text,
            "patterns": self.patterns,
            "tensions": self.tensions,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class AuditEntry:
    """An audit trail entry."""
    id: str
    user_id: str
    event_type: str
    event_data: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    hash: str = ""

    def compute_hash(self, previous_hash: str = "") -> str:
        """Compute hash for this entry in the chain."""
        data = f"{previous_hash}{self.id}{self.user_id}{self.event_type}{self.timestamp.isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


class StorageBridge:
    """
    Bridges orchestration to storage layer.

    Provides a unified interface for persisting reflections,
    patterns, tensions, and maintaining the audit trail.
    """

    def __init__(self, storage_type: StorageType = StorageType.MEMORY):
        """
        Initialize storage bridge.

        Args:
            storage_type: Which backend to use
        """
        self.storage_type = storage_type
        self._backend = None
        self._initialized = False

        # In-memory storage (always available as fallback)
        self._reflections: Dict[str, StoredReflection] = {}
        self._audit_trail: List[AuditEntry] = []
        self._patterns: Dict[str, List[Dict]] = {}  # user_id -> patterns
        self._tensions: Dict[str, List[Dict]] = {}  # user_id -> tensions

    async def initialize(self) -> None:
        """Initialize the storage backend."""
        if self._initialized:
            return

        if self.storage_type == StorageType.SQLITE:
            await self._init_sqlite()
        elif self.storage_type == StorageType.SUPABASE:
            await self._init_supabase()
        # MEMORY doesn't need initialization

        self._initialized = True

    async def _init_sqlite(self) -> None:
        """Initialize SQLite backend."""
        try:
            from mirror_storage.local.sqlite import SQLiteBackend
            self._backend = SQLiteBackend()
            await self._backend.initialize()
        except ImportError:
            # Fall back to memory
            self.storage_type = StorageType.MEMORY

    async def _init_supabase(self) -> None:
        """Initialize Supabase backend."""
        try:
            from mirror_storage.cloud.supabase import SupabaseBackend
            self._backend = SupabaseBackend()
            await self._backend.initialize()
        except ImportError:
            # Fall back to memory
            self.storage_type = StorageType.MEMORY

    async def save_reflection(
        self,
        user_id: str,
        session_id: str,
        user_input: str,
        reflection_text: str,
        patterns: List[Dict] = None,
        tensions: List[Dict] = None,
        metadata: Dict[str, Any] = None,
    ) -> StoredReflection:
        """
        Save a reflection and its analysis.

        Args:
            user_id: User ID
            session_id: Session ID
            user_input: Original user input
            reflection_text: Generated reflection
            patterns: Detected patterns
            tensions: Detected tensions
            metadata: Additional metadata

        Returns:
            The stored reflection
        """
        reflection = StoredReflection(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            user_input=user_input,
            reflection_text=reflection_text,
            patterns=patterns or [],
            tensions=tensions or [],
            metadata=metadata or {},
        )

        # Store in memory (always)
        self._reflections[reflection.id] = reflection

        # Store patterns/tensions per user
        if user_id not in self._patterns:
            self._patterns[user_id] = []
        self._patterns[user_id].extend(patterns or [])

        if user_id not in self._tensions:
            self._tensions[user_id] = []
        self._tensions[user_id].extend(tensions or [])

        # Store in backend if available
        if self._backend and self.storage_type != StorageType.MEMORY:
            try:
                await self._backend.save_reflection(reflection.to_dict())
            except Exception:
                pass  # Graceful degradation

        # Add to audit trail
        await self._log_audit(
            user_id=user_id,
            event_type="reflection_saved",
            event_data={
                "reflection_id": reflection.id,
                "session_id": session_id,
                "patterns_count": len(patterns or []),
                "tensions_count": len(tensions or []),
            },
        )

        return reflection

    async def get_reflection(
        self,
        reflection_id: str,
    ) -> Optional[StoredReflection]:
        """Get a reflection by ID."""
        if reflection_id in self._reflections:
            return self._reflections[reflection_id]

        if self._backend and self.storage_type != StorageType.MEMORY:
            try:
                data = await self._backend.get_reflection(reflection_id)
                if data:
                    return StoredReflection(**data)
            except Exception:
                pass

        return None

    async def get_user_reflections(
        self,
        user_id: str,
        limit: int = 100,
    ) -> List[StoredReflection]:
        """Get reflections for a user."""
        reflections = [
            r for r in self._reflections.values()
            if r.user_id == user_id
        ]

        # Sort by created_at descending
        reflections.sort(key=lambda r: r.created_at, reverse=True)

        return reflections[:limit]

    async def get_session_reflections(
        self,
        session_id: str,
    ) -> List[StoredReflection]:
        """Get reflections for a session."""
        return [
            r for r in self._reflections.values()
            if r.session_id == session_id
        ]

    async def get_user_patterns(
        self,
        user_id: str,
    ) -> List[Dict]:
        """Get accumulated patterns for a user."""
        return self._patterns.get(user_id, [])

    async def get_user_tensions(
        self,
        user_id: str,
    ) -> List[Dict]:
        """Get accumulated tensions for a user."""
        return self._tensions.get(user_id, [])

    async def _log_audit(
        self,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any],
    ) -> AuditEntry:
        """Log an event to the audit trail."""
        entry = AuditEntry(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_type=event_type,
            event_data=event_data,
        )

        # Compute hash chain
        previous_hash = self._audit_trail[-1].hash if self._audit_trail else ""
        entry.hash = entry.compute_hash(previous_hash)

        self._audit_trail.append(entry)

        return entry

    async def get_audit_trail(
        self,
        user_id: str = None,
        limit: int = 100,
    ) -> List[AuditEntry]:
        """Get audit trail, optionally filtered by user."""
        if user_id:
            entries = [e for e in self._audit_trail if e.user_id == user_id]
        else:
            entries = self._audit_trail.copy()

        return entries[-limit:]

    async def verify_audit_integrity(self) -> bool:
        """Verify the audit trail hash chain is intact."""
        previous_hash = ""

        for entry in self._audit_trail:
            expected_hash = entry.compute_hash(previous_hash)
            if entry.hash != expected_hash:
                return False
            previous_hash = entry.hash

        return True

    # Data Sovereignty Methods (Axiom 2)

    async def export_user_data(
        self,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Export all data for a user.

        Returns complete data package for data sovereignty.
        """
        reflections = await self.get_user_reflections(user_id, limit=1000)
        patterns = await self.get_user_patterns(user_id)
        tensions = await self.get_user_tensions(user_id)
        audit = await self.get_audit_trail(user_id, limit=1000)

        return {
            "user_id": user_id,
            "exported_at": datetime.utcnow().isoformat(),
            "reflections": [r.to_dict() for r in reflections],
            "patterns": patterns,
            "tensions": tensions,
            "audit_trail": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "timestamp": e.timestamp.isoformat(),
                    "hash": e.hash,
                }
                for e in audit
            ],
        }

    async def delete_user_data(
        self,
        user_id: str,
    ) -> bool:
        """
        Delete all data for a user.

        Constitutional right under data sovereignty.
        """
        # Delete reflections
        to_delete = [
            rid for rid, r in self._reflections.items()
            if r.user_id == user_id
        ]
        for rid in to_delete:
            del self._reflections[rid]

        # Delete patterns and tensions
        if user_id in self._patterns:
            del self._patterns[user_id]
        if user_id in self._tensions:
            del self._tensions[user_id]

        # Log deletion (but don't delete audit - immutable)
        await self._log_audit(
            user_id=user_id,
            event_type="user_data_deleted",
            event_data={"reflections_deleted": len(to_delete)},
        )

        # Delete from backend if available
        if self._backend and self.storage_type != StorageType.MEMORY:
            try:
                await self._backend.delete_user_data(user_id)
            except Exception:
                pass

        return True

    async def close(self) -> None:
        """Close storage connections."""
        if self._backend and hasattr(self._backend, 'close'):
            await self._backend.close()


# Singleton instance
_bridge: Optional[StorageBridge] = None


async def get_storage_bridge(
    storage_type: StorageType = StorageType.MEMORY,
) -> StorageBridge:
    """Get or create the storage bridge singleton."""
    global _bridge

    if _bridge is None:
        _bridge = StorageBridge(storage_type)
        await _bridge.initialize()

    return _bridge
