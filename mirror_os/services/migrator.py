"""
Mirror OS Migration System

Handles schema version upgrades, data migration, and rollback support.
Ensures smooth evolution of the database schema over time while preserving user data.

Philosophy:
- Data sovereignty: Users must never lose data during migrations
- Graceful degradation: Older clients can work with newer schemas when possible
- Reversibility: Migrations can be rolled back if needed
- Transparency: Users are informed of schema changes and their impact
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class Migration:
    """Represents a single migration step"""
    
    def __init__(
        self,
        version: int,
        name: str,
        up_sql: str,
        down_sql: Optional[str] = None,
        data_transform: Optional[callable] = None
    ):
        self.version = version
        self.name = name
        self.up_sql = up_sql
        self.down_sql = down_sql
        self.data_transform = data_transform
    
    def __repr__(self):
        return f"Migration(v{self.version}: {self.name})"


class MigrationHistory:
    """Tracks applied migrations"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_history_table()
    
    def _ensure_history_table(self):
        """Create migration history table if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL,
                    checksum TEXT,
                    execution_time_ms INTEGER,
                    rolled_back INTEGER DEFAULT 0
                )
            """)
            conn.commit()
        finally:
            conn.close()
    
    def get_current_version(self) -> int:
        """Get the current schema version"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute("""
                SELECT MAX(version) FROM schema_migrations 
                WHERE rolled_back = 0
            """)
            result = cursor.fetchone()[0]
            return result if result is not None else 0
        finally:
            conn.close()
    
    def is_applied(self, version: int) -> bool:
        """Check if a migration version has been applied"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute("""
                SELECT 1 FROM schema_migrations 
                WHERE version = ? AND rolled_back = 0
            """, (version,))
            return cursor.fetchone() is not None
        finally:
            conn.close()
    
    def record_migration(
        self,
        version: int,
        name: str,
        execution_time_ms: int,
        checksum: Optional[str] = None
    ):
        """Record a successful migration"""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("""
                INSERT INTO schema_migrations 
                (version, name, applied_at, checksum, execution_time_ms)
                VALUES (?, ?, ?, ?, ?)
            """, (
                version,
                name,
                datetime.utcnow().isoformat() + 'Z',
                checksum,
                execution_time_ms
            ))
            conn.commit()
        finally:
            conn.close()
    
    def record_rollback(self, version: int):
        """Record a migration rollback"""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("""
                UPDATE schema_migrations 
                SET rolled_back = 1 
                WHERE version = ?
            """, (version,))
            conn.commit()
        finally:
            conn.close()
    
    def get_history(self) -> List[Dict]:
        """Get all migration history"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.execute("""
                SELECT version, name, applied_at, execution_time_ms, rolled_back
                FROM schema_migrations
                ORDER BY version DESC
            """)
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()


class Migrator:
    """Handles database schema migrations"""
    
    def __init__(self, db_path: str, migrations_dir: Optional[str] = None):
        self.db_path = db_path
        self.migrations_dir = migrations_dir or "mirror_os/schemas/sqlite/migrations"
        self.history = MigrationHistory(db_path)
        self.migrations: List[Migration] = []
        
        # Load migrations from directory if it exists
        if os.path.exists(self.migrations_dir):
            self._load_migrations_from_dir()
    
    def _load_migrations_from_dir(self):
        """Load migration files from directory"""
        migrations_path = Path(self.migrations_dir)
        for sql_file in sorted(migrations_path.glob("*.sql")):
            # Parse version from filename (e.g., "002_add_visibility.sql")
            filename = sql_file.stem
            parts = filename.split("_", 1)
            if len(parts) == 2 and parts[0].isdigit():
                version = int(parts[0])
                name = parts[1].replace("_", " ").title()
                
                with open(sql_file, 'r') as f:
                    sql_content = f.read()
                
                # Split on "-- DOWN" marker if present
                if "-- DOWN" in sql_content:
                    up_sql, down_sql = sql_content.split("-- DOWN", 1)
                else:
                    up_sql = sql_content
                    down_sql = None
                
                self.add_migration(Migration(
                    version=version,
                    name=name,
                    up_sql=up_sql.strip(),
                    down_sql=down_sql.strip() if down_sql else None
                ))
    
    def add_migration(self, migration: Migration):
        """Register a migration"""
        self.migrations.append(migration)
        self.migrations.sort(key=lambda m: m.version)
    
    def get_pending_migrations(self) -> List[Migration]:
        """Get migrations that haven't been applied yet"""
        current_version = self.history.get_current_version()
        return [m for m in self.migrations if m.version > current_version]
    
    def migrate(
        self,
        target_version: Optional[int] = None,
        dry_run: bool = False
    ) -> Dict:
        """
        Run pending migrations up to target version
        
        Args:
            target_version: Version to migrate to (None = latest)
            dry_run: If True, don't actually apply migrations
        
        Returns:
            Dict with migration results
        """
        pending = self.get_pending_migrations()
        
        if target_version is not None:
            pending = [m for m in pending if m.version <= target_version]
        
        if not pending:
            return {
                "status": "success",
                "message": "No pending migrations",
                "current_version": self.history.get_current_version()
            }
        
        results = []
        
        for migration in pending:
            if dry_run:
                results.append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "dry_run"
                })
                continue
            
            try:
                start_time = datetime.utcnow()
                self._apply_migration(migration)
                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                self.history.record_migration(
                    migration.version,
                    migration.name,
                    execution_time
                )
                
                results.append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "success",
                    "execution_time_ms": execution_time
                })
                
            except Exception as e:
                results.append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "error",
                    "error": str(e)
                })
                
                return {
                    "status": "error",
                    "message": f"Migration v{migration.version} failed: {e}",
                    "results": results,
                    "current_version": self.history.get_current_version()
                }
        
        return {
            "status": "success",
            "message": f"Applied {len(results)} migration(s)",
            "results": results,
            "current_version": self.history.get_current_version()
        }
    
    def _apply_migration(self, migration: Migration):
        """Apply a single migration"""
        conn = sqlite3.connect(self.db_path)
        try:
            # Execute SQL statements
            conn.executescript(migration.up_sql)
            
            # Run data transformation if provided
            if migration.data_transform:
                migration.data_transform(conn)
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def rollback(self, steps: int = 1) -> Dict:
        """
        Rollback the last N migrations
        
        Args:
            steps: Number of migrations to roll back
        
        Returns:
            Dict with rollback results
        """
        current_version = self.history.get_current_version()
        
        if current_version == 0:
            return {
                "status": "error",
                "message": "No migrations to roll back"
            }
        
        # Get migrations to roll back
        to_rollback = [
            m for m in self.migrations 
            if m.version <= current_version and m.version > (current_version - steps)
        ]
        to_rollback.sort(key=lambda m: m.version, reverse=True)
        
        results = []
        
        for migration in to_rollback:
            if not migration.down_sql:
                return {
                    "status": "error",
                    "message": f"Migration v{migration.version} has no rollback SQL",
                    "results": results
                }
            
            try:
                conn = sqlite3.connect(self.db_path)
                try:
                    conn.executescript(migration.down_sql)
                    conn.commit()
                finally:
                    conn.close()
                
                self.history.record_rollback(migration.version)
                
                results.append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "rolled_back"
                })
                
            except Exception as e:
                results.append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "error",
                    "error": str(e)
                })
                
                return {
                    "status": "error",
                    "message": f"Rollback of v{migration.version} failed: {e}",
                    "results": results
                }
        
        return {
            "status": "success",
            "message": f"Rolled back {len(results)} migration(s)",
            "results": results,
            "current_version": self.history.get_current_version()
        }
    
    def get_status(self) -> Dict:
        """Get current migration status"""
        current_version = self.history.get_current_version()
        pending = self.get_pending_migrations()
        history = self.history.get_history()
        
        return {
            "current_version": current_version,
            "latest_version": max([m.version for m in self.migrations]) if self.migrations else 0,
            "pending_migrations": len(pending),
            "pending_details": [
                {"version": m.version, "name": m.name}
                for m in pending
            ],
            "migration_history": history[:5]  # Last 5 migrations
        }
    
    def validate_integrity(self) -> Dict:
        """
        Validate database integrity after migrations
        
        Returns:
            Dict with validation results
        """
        conn = sqlite3.connect(self.db_path)
        issues = []
        
        try:
            # Check foreign key constraints
            cursor = conn.execute("PRAGMA foreign_key_check")
            fk_violations = cursor.fetchall()
            if fk_violations:
                issues.append({
                    "type": "foreign_key_violation",
                    "count": len(fk_violations),
                    "details": fk_violations[:5]  # First 5
                })
            
            # Check integrity
            cursor = conn.execute("PRAGMA integrity_check")
            result = cursor.fetchone()[0]
            if result != "ok":
                issues.append({
                    "type": "integrity_check_failed",
                    "message": result
                })
            
            # Check for orphaned records (example: mirrorbacks without reflections)
            cursor = conn.execute("""
                SELECT COUNT(*) FROM mirrorbacks 
                WHERE reflection_id NOT IN (SELECT id FROM reflections)
            """)
            orphaned_mirrorbacks = cursor.fetchone()[0]
            if orphaned_mirrorbacks > 0:
                issues.append({
                    "type": "orphaned_records",
                    "table": "mirrorbacks",
                    "count": orphaned_mirrorbacks
                })
            
        finally:
            conn.close()
        
        return {
            "status": "valid" if not issues else "issues_found",
            "issues": issues,
            "checked_at": datetime.utcnow().isoformat() + 'Z'
        }


# Example migration definitions
def example_migrations():
    """Example migrations for demonstration"""
    
    # Migration 002: Add visibility field to reflections
    migration_002 = Migration(
        version=2,
        name="Add visibility to reflections",
        up_sql="""
        ALTER TABLE reflections ADD COLUMN visibility TEXT DEFAULT 'local_only';
        CREATE INDEX IF NOT EXISTS idx_reflections_visibility ON reflections(visibility);
        """,
        down_sql="""
        -- SQLite doesn't support DROP COLUMN, so we recreate the table
        CREATE TABLE reflections_new AS 
        SELECT id, content, identity_id, created_at, updated_at, tags 
        FROM reflections;
        DROP TABLE reflections;
        ALTER TABLE reflections_new RENAME TO reflections;
        """
    )
    
    # Migration 003: Add tension intensity tracking
    migration_003 = Migration(
        version=3,
        name="Add intensity to tensions",
        up_sql="""
        ALTER TABLE tensions ADD COLUMN intensity REAL DEFAULT 0.5;
        UPDATE tensions SET intensity = 0.5 WHERE intensity IS NULL;
        """,
        down_sql="""
        -- Recreate table without intensity
        CREATE TABLE tensions_new AS 
        SELECT id, reflection_id, name, axis_a, axis_b, position, 
               detected_at, created_at, updated_at 
        FROM tensions;
        DROP TABLE tensions;
        ALTER TABLE tensions_new RENAME TO tensions;
        """
    )
    
    return [migration_002, migration_003]


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrator.py <db_path> [command]")
        print("Commands: status, migrate, rollback")
        sys.exit(1)
    
    db_path = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "status"
    
    migrator = Migrator(db_path)
    
    # Add example migrations
    for migration in example_migrations():
        migrator.add_migration(migration)
    
    if command == "status":
        status = migrator.get_status()
        print(json.dumps(status, indent=2))
    
    elif command == "migrate":
        result = migrator.migrate()
        print(json.dumps(result, indent=2))
        
        # Validate integrity after migration
        integrity = migrator.validate_integrity()
        print("\nIntegrity check:")
        print(json.dumps(integrity, indent=2))
    
    elif command == "rollback":
        result = migrator.rollback()
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
