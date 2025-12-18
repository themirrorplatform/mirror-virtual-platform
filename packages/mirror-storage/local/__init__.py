"""
Local Storage Adapters

Local-first storage implementations that work completely offline.
No network dependencies, no cloud requirements.

Available adapters:
- SQLiteStorage: Full-featured SQLite database (recommended)
- MemoryStorage: In-memory storage for testing
"""

from .sqlite import SQLiteStorage
from .memory import MemoryStorage

__all__ = [
    "SQLiteStorage",
    "MemoryStorage",
]
