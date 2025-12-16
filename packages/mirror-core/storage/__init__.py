"""
Storage Layer - Local-first persistence with encryption

This module provides:
- Local-first data storage (user owns their data)
- End-to-end encryption
- Reflection history management
- Pattern and tension persistence
- Audit trail storage
- Sovereignty guarantees (no cloud lock-in)
"""

from .local_store import LocalStore, StorageConfig
from .encryption import EncryptionManager
from .reflection_store import ReflectionStore
from .migration import MigrationManager

__all__ = [
    "LocalStore",
    "StorageConfig", 
    "EncryptionManager",
    "ReflectionStore",
    "MigrationManager",
]
