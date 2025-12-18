"""
Sync Engine

Handles bidirectional sync between local and cloud storage.

Key principles:
- Local is authoritative (user's machine is source of truth)
- User controls what syncs (selective sync)
- All data encrypted before leaving device
- Conflict resolution favors user's local data
- Sync is optional (everything works offline)

Usage:
    from mirror_storage.sync import SyncEngine
    from mirror_storage.local import SQLiteStorage
    from mirror_storage.cloud import SupabaseStorage

    sync = SyncEngine(
        local=SQLiteStorage(...),
        cloud=SupabaseStorage(...),
        encryption=encryption_manager
    )

    # Full sync
    result = await sync.sync_all(user_id)

    # Selective sync (user chooses)
    result = await sync.sync_selective(
        user_id,
        sync_reflections=True,
        sync_patterns=True,
        sync_tensions=False  # Keep tensions local
    )
"""

from .engine import SyncEngine, SyncResult, SyncDirection, ConflictResolution

__all__ = [
    "SyncEngine",
    "SyncResult",
    "SyncDirection",
    "ConflictResolution",
]
