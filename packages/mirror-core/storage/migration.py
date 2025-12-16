"""
Migration Manager

Handles data migrations and schema versioning.
Critical for evolving the system while preserving user data.
"""

from typing import Dict, Any, List, Callable
import sqlite3
from pathlib import Path
import json
from datetime import datetime


class MigrationManager:
    """
    Manages database schema migrations.
    
    Ensures user data is preserved as the system evolves.
    """
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.migrations: Dict[int, Callable] = {}
        self._register_migrations()
    
    def _register_migrations(self) -> None:
        """Register all migrations"""
        self.migrations = {
            1: self._migration_v1_initial,
            2: self._migration_v2_add_encryption,
            # Future migrations go here
        }
    
    def get_current_version(self) -> int:
        """Get current database schema version"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Create migrations table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL,
                description TEXT
            )
        """)
        
        cursor.execute("SELECT MAX(version) FROM schema_migrations")
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result[0] is not None else 0
    
    def get_latest_version(self) -> int:
        """Get latest available migration version"""
        return max(self.migrations.keys()) if self.migrations else 0
    
    def needs_migration(self) -> bool:
        """Check if database needs migration"""
        return self.get_current_version() < self.get_latest_version()
    
    def migrate(self) -> List[str]:
        """
        Run all pending migrations.
        
        Returns:
            List of applied migration descriptions
        """
        current = self.get_current_version()
        latest = self.get_latest_version()
        applied = []
        
        if current >= latest:
            return applied
        
        conn = sqlite3.connect(str(self.db_path))
        
        for version in range(current + 1, latest + 1):
            if version in self.migrations:
                try:
                    # Run migration
                    description = self.migrations[version](conn)
                    
                    # Record migration
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO schema_migrations (version, applied_at, description)
                        VALUES (?, ?, ?)
                    """, (version, datetime.utcnow().isoformat(), description))
                    
                    conn.commit()
                    applied.append(f"v{version}: {description}")
                except Exception as e:
                    conn.rollback()
                    conn.close()
                    raise Exception(f"Migration v{version} failed: {e}")
        
        conn.close()
        return applied
    
    def _migration_v1_initial(self, conn: sqlite3.Connection) -> str:
        """Initial schema (already created by LocalStore)"""
        return "Initial schema"
    
    def _migration_v2_add_encryption(self, conn: sqlite3.Connection) -> str:
        """Add encryption support"""
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(reflections)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'encrypted' not in columns:
            cursor.execute("ALTER TABLE reflections ADD COLUMN encrypted INTEGER DEFAULT 0")
        
        return "Added encryption support to reflections"
    
    def export_migration_history(self) -> List[Dict[str, Any]]:
        """Export migration history"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT version, applied_at, description
            FROM schema_migrations
            ORDER BY version
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
