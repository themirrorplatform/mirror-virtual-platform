"""
Mirror Storage - Data Sovereignty Storage Layer

This package provides the storage abstraction for Mirror, implementing:

1. **Local-First Architecture**: All data stored locally by default
2. **Data Sovereignty**: User owns and controls their data absolutely
3. **Optional Cloud Sync**: Encrypted sync to cloud (user's choice)
4. **Semantic Export**: Export with meaning preserved for portability

Key Principles (from Mirror Constitution):
- No cloud dependencies for core functionality
- User can export all data at any time
- User can delete all data instantly
- Sync is optional and always encrypted
- User controls what syncs and what stays local

Usage:
    from mirror_storage import SQLiteStorage, SupabaseStorage
    from mirror_storage.sync import SyncEngine
    from mirror_storage.export import SemanticExporter

    # Local-only (default, works offline)
    storage = SQLiteStorage(path="~/.mirror/data.db")

    # With optional cloud sync
    sync = SyncEngine(
        local=SQLiteStorage(path="~/.mirror/data.db"),
        cloud=SupabaseStorage(url="...", key="..."),
        encryption_key=user_key,
        selective=True  # User chooses what syncs
    )
"""

from .base import (
    MirrorStorage,
    StorageConfig,
    StorageCapabilities,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    StorageError,
    DataNotFoundError,
    IntegrityError,
    EncryptionError,
)

from .encryption import EncryptionManager

__version__ = "1.0.0"
__all__ = [
    "MirrorStorage",
    "StorageConfig",
    "StorageCapabilities",
    "Reflection",
    "Pattern",
    "Tension",
    "AuditEvent",
    "StorageError",
    "DataNotFoundError",
    "IntegrityError",
    "EncryptionError",
    "EncryptionManager",
]
