"""
In-Memory Storage Adapter

For testing and development. Data is not persisted.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from collections import defaultdict

from ..base import (
    MirrorStorage,
    StorageConfig,
    StorageCapabilities,
    StorageType,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    DataNotFoundError,
)


class MemoryStorage(MirrorStorage):
    """
    In-memory storage for testing.

    All data is lost when the process ends.
    Useful for unit tests and development.
    """

    def __init__(self, config: Optional[StorageConfig] = None):
        if config is None:
            config = StorageConfig(user_id="test")
        super().__init__(config)

        self._reflections: Dict[str, Reflection] = {}
        self._patterns: Dict[str, Pattern] = {}
        self._tensions: Dict[str, Tension] = {}
        self._audit_events: List[AuditEvent] = []

    @property
    def capabilities(self) -> StorageCapabilities:
        return StorageCapabilities(
            storage_type=StorageType.MEMORY,
            supports_sync=False,
            supports_realtime=False,
            supports_encryption=False,
            requires_network=False,
        )

    async def initialize(self) -> None:
        self._initialized = True

    async def close(self) -> None:
        pass

    # Reflections

    async def save_reflection(self, reflection: Reflection) -> str:
        self._reflections[reflection.id] = reflection
        return reflection.id

    async def get_reflection(self, reflection_id: str) -> Optional[Reflection]:
        return self._reflections.get(reflection_id)

    async def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        since: Optional[datetime] = None
    ) -> List[Reflection]:
        user_reflections = [
            r for r in self._reflections.values()
            if r.user_id == user_id
        ]

        if since:
            user_reflections = [
                r for r in user_reflections
                if r.created_at > since
            ]

        user_reflections.sort(key=lambda r: r.created_at, reverse=True)
        return user_reflections[offset:offset + limit]

    async def delete_reflection(self, reflection_id: str) -> bool:
        if reflection_id in self._reflections:
            del self._reflections[reflection_id]
            return True
        return False

    # Patterns

    async def save_pattern(self, pattern: Pattern) -> str:
        self._patterns[pattern.id] = pattern
        return pattern.id

    async def get_patterns(self, user_id: str) -> List[Pattern]:
        return [
            p for p in self._patterns.values()
            if p.user_id == user_id
        ]

    async def delete_pattern(self, pattern_id: str) -> bool:
        if pattern_id in self._patterns:
            del self._patterns[pattern_id]
            return True
        return False

    # Tensions

    async def save_tension(self, tension: Tension) -> str:
        self._tensions[tension.id] = tension
        return tension.id

    async def get_tensions(self, user_id: str) -> List[Tension]:
        return [
            t for t in self._tensions.values()
            if t.user_id == user_id
        ]

    async def delete_tension(self, tension_id: str) -> bool:
        if tension_id in self._tensions:
            del self._tensions[tension_id]
            return True
        return False

    # Audit Trail

    async def append_audit_event(self, event: AuditEvent) -> str:
        self._audit_events.append(event)
        return event.id

    async def get_audit_trail(
        self,
        user_id: str,
        limit: int = 100,
        since: Optional[datetime] = None
    ) -> List[AuditEvent]:
        user_events = [
            e for e in self._audit_events
            if e.user_id == user_id
        ]

        if since:
            user_events = [
                e for e in user_events
                if e.timestamp > since
            ]

        user_events.sort(key=lambda e: e.timestamp, reverse=True)
        return user_events[:limit]

    async def verify_audit_chain(self, user_id: str) -> bool:
        user_events = [
            e for e in self._audit_events
            if e.user_id == user_id
        ]
        user_events.sort(key=lambda e: e.timestamp)

        previous_hash = None
        for event in user_events:
            if event.previous_hash != previous_hash:
                return False
            if not event.verify_integrity():
                return False
            previous_hash = event.event_hash

        return True

    # Export & Deletion

    async def export_all(self, user_id: str) -> Dict[str, Any]:
        reflections = await self.get_reflections(user_id, limit=100000)
        patterns = await self.get_patterns(user_id)
        tensions = await self.get_tensions(user_id)
        audit_trail = await self.get_audit_trail(user_id, limit=100000)

        return {
            "export_version": "1.0.0",
            "export_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "reflections": [r.to_dict() for r in reflections],
            "patterns": [p.to_dict() for p in patterns],
            "tensions": [t.to_dict() for t in tensions],
            "audit_trail": [a.to_dict() for a in audit_trail],
        }

    async def delete_all(self, user_id: str) -> bool:
        # Delete reflections
        to_delete = [k for k, v in self._reflections.items() if v.user_id == user_id]
        for k in to_delete:
            del self._reflections[k]

        # Delete patterns
        to_delete = [k for k, v in self._patterns.items() if v.user_id == user_id]
        for k in to_delete:
            del self._patterns[k]

        # Delete tensions
        to_delete = [k for k, v in self._tensions.items() if v.user_id == user_id]
        for k in to_delete:
            del self._tensions[k]

        # Delete audit events
        self._audit_events = [
            e for e in self._audit_events
            if e.user_id != user_id
        ]

        return True

    def clear_all(self):
        """Clear all data (for testing)."""
        self._reflections.clear()
        self._patterns.clear()
        self._tensions.clear()
        self._audit_events.clear()
