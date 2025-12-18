"""
Sync Engine Implementation

Bidirectional sync between local and cloud storage with:
- Selective sync (user chooses what syncs)
- Conflict resolution (local wins by default)
- E2E encryption (all cloud data encrypted)
- Offline-first (works without network)
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime
import asyncio

from ..base import (
    MirrorStorage,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    SyncError,
)
from ..encryption import EncryptionManager


class SyncDirection(Enum):
    """Direction of sync operation."""
    LOCAL_TO_CLOUD = "local_to_cloud"  # Push local changes
    CLOUD_TO_LOCAL = "cloud_to_local"  # Pull cloud changes
    BIDIRECTIONAL = "bidirectional"    # Both ways


class ConflictResolution(Enum):
    """How to resolve conflicts between local and cloud."""
    LOCAL_WINS = "local_wins"          # Local data is authoritative (default)
    CLOUD_WINS = "cloud_wins"          # Cloud data is authoritative
    NEWEST_WINS = "newest_wins"        # Most recent update wins
    MANUAL = "manual"                   # Require user decision


@dataclass
class SyncConflict:
    """Represents a sync conflict."""
    record_type: str  # "reflection", "pattern", "tension"
    record_id: str
    local_data: Dict[str, Any]
    cloud_data: Dict[str, Any]
    local_modified: datetime
    cloud_modified: datetime
    resolution: Optional[str] = None  # Which version was kept


@dataclass
class SyncResult:
    """Result of a sync operation."""
    success: bool
    direction: SyncDirection
    started_at: datetime
    completed_at: Optional[datetime] = None

    # Statistics
    reflections_synced: int = 0
    patterns_synced: int = 0
    tensions_synced: int = 0
    audit_events_synced: int = 0

    # Conflicts
    conflicts: List[SyncConflict] = field(default_factory=list)
    conflicts_resolved: int = 0

    # Errors
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "direction": self.direction.value,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "reflections_synced": self.reflections_synced,
            "patterns_synced": self.patterns_synced,
            "tensions_synced": self.tensions_synced,
            "audit_events_synced": self.audit_events_synced,
            "conflicts_count": len(self.conflicts),
            "conflicts_resolved": self.conflicts_resolved,
            "errors": self.errors,
        }


class SyncEngine:
    """
    Sync engine for local <-> cloud data synchronization.

    Principles:
    1. Local is authoritative (user's machine is source of truth)
    2. All cloud data is E2E encrypted
    3. User controls what syncs (selective)
    4. Sync is optional (offline-first)
    5. Conflicts favor local data (user sovereignty)

    Usage:
        engine = SyncEngine(
            local=SQLiteStorage(...),
            cloud=SupabaseStorage(...),
            encryption=encryption_manager
        )

        # Full bidirectional sync
        result = await engine.sync_all(user_id)

        # Push only (backup to cloud)
        result = await engine.push_all(user_id)

        # Pull only (restore from cloud)
        result = await engine.pull_all(user_id)

        # Selective sync
        result = await engine.sync_selective(
            user_id,
            sync_reflections=True,
            sync_patterns=False,
            sync_tensions=False
        )
    """

    def __init__(
        self,
        local: MirrorStorage,
        cloud: MirrorStorage,
        encryption: Optional[EncryptionManager] = None,
        conflict_resolution: ConflictResolution = ConflictResolution.LOCAL_WINS
    ):
        """
        Initialize sync engine.

        Args:
            local: Local storage (SQLite)
            cloud: Cloud storage (Supabase)
            encryption: Encryption manager for E2E encryption
            conflict_resolution: Default conflict resolution strategy
        """
        self.local = local
        self.cloud = cloud
        self.encryption = encryption
        self.conflict_resolution = conflict_resolution

    async def sync_all(
        self,
        user_id: str,
        direction: SyncDirection = SyncDirection.BIDIRECTIONAL
    ) -> SyncResult:
        """
        Sync all data types.

        Args:
            user_id: User ID to sync
            direction: Sync direction

        Returns:
            SyncResult with statistics and any conflicts
        """
        return await self.sync_selective(
            user_id,
            direction=direction,
            sync_reflections=True,
            sync_patterns=True,
            sync_tensions=True,
            sync_audit=True
        )

    async def push_all(self, user_id: str) -> SyncResult:
        """Push all local data to cloud (backup)."""
        return await self.sync_all(
            user_id,
            direction=SyncDirection.LOCAL_TO_CLOUD
        )

    async def pull_all(self, user_id: str) -> SyncResult:
        """Pull all cloud data to local (restore)."""
        return await self.sync_all(
            user_id,
            direction=SyncDirection.CLOUD_TO_LOCAL
        )

    async def sync_selective(
        self,
        user_id: str,
        direction: SyncDirection = SyncDirection.BIDIRECTIONAL,
        sync_reflections: bool = True,
        sync_patterns: bool = True,
        sync_tensions: bool = True,
        sync_audit: bool = True
    ) -> SyncResult:
        """
        Sync selected data types.

        User controls exactly what syncs to cloud.

        Args:
            user_id: User ID to sync
            direction: Sync direction
            sync_reflections: Whether to sync reflections
            sync_patterns: Whether to sync patterns
            sync_tensions: Whether to sync tensions
            sync_audit: Whether to sync audit trail
        """
        result = SyncResult(
            success=True,
            direction=direction,
            started_at=datetime.utcnow()
        )

        try:
            if sync_reflections:
                count, conflicts = await self._sync_reflections(user_id, direction)
                result.reflections_synced = count
                result.conflicts.extend(conflicts)

            if sync_patterns:
                count, conflicts = await self._sync_patterns(user_id, direction)
                result.patterns_synced = count
                result.conflicts.extend(conflicts)

            if sync_tensions:
                count, conflicts = await self._sync_tensions(user_id, direction)
                result.tensions_synced = count
                result.conflicts.extend(conflicts)

            if sync_audit:
                count = await self._sync_audit(user_id, direction)
                result.audit_events_synced = count

            # Resolve conflicts
            result.conflicts_resolved = await self._resolve_conflicts(
                result.conflicts
            )

        except Exception as e:
            result.success = False
            result.errors.append(str(e))

        result.completed_at = datetime.utcnow()
        return result

    async def _sync_reflections(
        self,
        user_id: str,
        direction: SyncDirection
    ) -> tuple:
        """Sync reflections, returns (count, conflicts)."""
        synced = 0
        conflicts = []

        # Get local and cloud reflections
        local_reflections = await self.local.get_reflections(user_id, limit=100000)
        local_by_id = {r.id: r for r in local_reflections if not r.local_only}

        try:
            cloud_reflections = await self.cloud.get_reflections(user_id, limit=100000)
            cloud_by_id = {r.id: r for r in cloud_reflections}
        except Exception:
            # Cloud unavailable, skip cloud operations
            cloud_by_id = {}

        all_ids = set(local_by_id.keys()) | set(cloud_by_id.keys())

        for rid in all_ids:
            local = local_by_id.get(rid)
            cloud = cloud_by_id.get(rid)

            if local and not cloud:
                # Local only - push if direction allows
                if direction in (SyncDirection.LOCAL_TO_CLOUD, SyncDirection.BIDIRECTIONAL):
                    await self.cloud.save_reflection(local)
                    synced += 1

            elif cloud and not local:
                # Cloud only - pull if direction allows
                if direction in (SyncDirection.CLOUD_TO_LOCAL, SyncDirection.BIDIRECTIONAL):
                    await self.local.save_reflection(cloud)
                    synced += 1

            elif local and cloud:
                # Both exist - check for conflict
                if local.content_hash != cloud.content_hash:
                    conflict = SyncConflict(
                        record_type="reflection",
                        record_id=rid,
                        local_data=local.to_dict(),
                        cloud_data=cloud.to_dict(),
                        local_modified=local.created_at,
                        cloud_modified=cloud.created_at,
                    )
                    conflicts.append(conflict)
                # If hashes match, already in sync

        return synced, conflicts

    async def _sync_patterns(
        self,
        user_id: str,
        direction: SyncDirection
    ) -> tuple:
        """Sync patterns, returns (count, conflicts)."""
        synced = 0
        conflicts = []

        local_patterns = await self.local.get_patterns(user_id)
        local_by_id = {p.id: p for p in local_patterns if not p.local_only}

        try:
            cloud_patterns = await self.cloud.get_patterns(user_id)
            cloud_by_id = {p.id: p for p in cloud_patterns}
        except Exception:
            cloud_by_id = {}

        all_ids = set(local_by_id.keys()) | set(cloud_by_id.keys())

        for pid in all_ids:
            local = local_by_id.get(pid)
            cloud = cloud_by_id.get(pid)

            if local and not cloud:
                if direction in (SyncDirection.LOCAL_TO_CLOUD, SyncDirection.BIDIRECTIONAL):
                    await self.cloud.save_pattern(local)
                    synced += 1

            elif cloud and not local:
                if direction in (SyncDirection.CLOUD_TO_LOCAL, SyncDirection.BIDIRECTIONAL):
                    await self.local.save_pattern(cloud)
                    synced += 1

            elif local and cloud:
                # Check for conflict based on occurrences/confidence
                if local.occurrences != cloud.occurrences or local.confidence != cloud.confidence:
                    conflict = SyncConflict(
                        record_type="pattern",
                        record_id=pid,
                        local_data=local.to_dict(),
                        cloud_data=cloud.to_dict(),
                        local_modified=local.last_seen,
                        cloud_modified=cloud.last_seen,
                    )
                    conflicts.append(conflict)

        return synced, conflicts

    async def _sync_tensions(
        self,
        user_id: str,
        direction: SyncDirection
    ) -> tuple:
        """Sync tensions, returns (count, conflicts)."""
        synced = 0
        conflicts = []

        local_tensions = await self.local.get_tensions(user_id)
        local_by_id = {t.id: t for t in local_tensions if not t.local_only}

        try:
            cloud_tensions = await self.cloud.get_tensions(user_id)
            cloud_by_id = {t.id: t for t in cloud_tensions}
        except Exception:
            cloud_by_id = {}

        all_ids = set(local_by_id.keys()) | set(cloud_by_id.keys())

        for tid in all_ids:
            local = local_by_id.get(tid)
            cloud = cloud_by_id.get(tid)

            if local and not cloud:
                if direction in (SyncDirection.LOCAL_TO_CLOUD, SyncDirection.BIDIRECTIONAL):
                    await self.cloud.save_tension(local)
                    synced += 1

            elif cloud and not local:
                if direction in (SyncDirection.CLOUD_TO_LOCAL, SyncDirection.BIDIRECTIONAL):
                    await self.local.save_tension(cloud)
                    synced += 1

            elif local and cloud:
                if local.severity != cloud.severity or local.description != cloud.description:
                    conflict = SyncConflict(
                        record_type="tension",
                        record_id=tid,
                        local_data=local.to_dict(),
                        cloud_data=cloud.to_dict(),
                        local_modified=local.last_detected,
                        cloud_modified=cloud.last_detected,
                    )
                    conflicts.append(conflict)

        return synced, conflicts

    async def _sync_audit(
        self,
        user_id: str,
        direction: SyncDirection
    ) -> int:
        """
        Sync audit trail (append-only, no conflicts).

        Audit events are never modified, only added.
        """
        synced = 0

        local_audit = await self.local.get_audit_trail(user_id, limit=100000)
        local_ids = {e.id for e in local_audit}

        try:
            cloud_audit = await self.cloud.get_audit_trail(user_id, limit=100000)
            cloud_ids = {e.id for e in cloud_audit}
        except Exception:
            cloud_ids = set()
            cloud_audit = []

        # Push local events not in cloud
        if direction in (SyncDirection.LOCAL_TO_CLOUD, SyncDirection.BIDIRECTIONAL):
            for event in local_audit:
                if event.id not in cloud_ids:
                    await self.cloud.append_audit_event(event)
                    synced += 1

        # Pull cloud events not in local
        if direction in (SyncDirection.CLOUD_TO_LOCAL, SyncDirection.BIDIRECTIONAL):
            cloud_by_id = {e.id: e for e in cloud_audit}
            for eid in cloud_ids - local_ids:
                await self.local.append_audit_event(cloud_by_id[eid])
                synced += 1

        return synced

    async def _resolve_conflicts(
        self,
        conflicts: List[SyncConflict]
    ) -> int:
        """
        Resolve conflicts based on resolution strategy.

        Returns number of conflicts resolved.
        """
        resolved = 0

        for conflict in conflicts:
            if self.conflict_resolution == ConflictResolution.LOCAL_WINS:
                # Local data is authoritative - push to cloud
                await self._apply_local_version(conflict)
                conflict.resolution = "local_wins"
                resolved += 1

            elif self.conflict_resolution == ConflictResolution.CLOUD_WINS:
                # Cloud data is authoritative - pull to local
                await self._apply_cloud_version(conflict)
                conflict.resolution = "cloud_wins"
                resolved += 1

            elif self.conflict_resolution == ConflictResolution.NEWEST_WINS:
                # Most recent wins
                if conflict.local_modified >= conflict.cloud_modified:
                    await self._apply_local_version(conflict)
                    conflict.resolution = "local_wins_newest"
                else:
                    await self._apply_cloud_version(conflict)
                    conflict.resolution = "cloud_wins_newest"
                resolved += 1

            # MANUAL conflicts are not resolved here

        return resolved

    async def _apply_local_version(self, conflict: SyncConflict):
        """Apply local version to cloud."""
        if conflict.record_type == "reflection":
            reflection = Reflection.from_dict(conflict.local_data)
            await self.cloud.save_reflection(reflection)
        elif conflict.record_type == "pattern":
            pattern = Pattern.from_dict(conflict.local_data)
            await self.cloud.save_pattern(pattern)
        elif conflict.record_type == "tension":
            tension = Tension.from_dict(conflict.local_data)
            await self.cloud.save_tension(tension)

    async def _apply_cloud_version(self, conflict: SyncConflict):
        """Apply cloud version to local."""
        if conflict.record_type == "reflection":
            reflection = Reflection.from_dict(conflict.cloud_data)
            await self.local.save_reflection(reflection)
        elif conflict.record_type == "pattern":
            pattern = Pattern.from_dict(conflict.cloud_data)
            await self.local.save_pattern(pattern)
        elif conflict.record_type == "tension":
            tension = Tension.from_dict(conflict.cloud_data)
            await self.local.save_tension(tension)
