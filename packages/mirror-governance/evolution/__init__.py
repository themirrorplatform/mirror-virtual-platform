"""
Constitution Evolution

Manages constitutional changes over time:
- Version tracking with full history
- Migration paths between versions
- Rollback capabilities
"""

from .versioning import ConstitutionVersion, VersionManager
from .migration import MigrationEngine, Migration, MigrationResult

__all__ = [
    "ConstitutionVersion",
    "VersionManager",
    "MigrationEngine",
    "Migration",
    "MigrationResult",
]
