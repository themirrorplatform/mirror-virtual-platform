"""
SQLite Storage Adapter

Local-first storage using SQLite. Works completely offline.
User's data never leaves their machine.

Features:
- WAL mode for performance
- FTS5 full-text search (optional)
- Encryption at rest (via EncryptionManager)
- Automatic backups
- Complete data export
- Instant deletion
"""

import sqlite3
import json
import os
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

from ..base import (
    MirrorStorage,
    StorageConfig,
    StorageCapabilities,
    StorageType,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    StorageError,
    DataNotFoundError,
    IntegrityError,
)
from ..encryption import EncryptionManager


class SQLiteStorage(MirrorStorage):
    """
    SQLite-based local storage.

    This is the default storage for Mirror, providing:
    - Complete offline functionality
    - User data sovereignty (data stays on their machine)
    - Encrypted storage (optional)
    - Full export capability
    - Instant deletion

    Usage:
        async with SQLiteStorage(config) as storage:
            # Save a reflection
            reflection = Reflection.create(
                user_id="user123",
                content="I noticed something today...",
                mode="POST_ACTION"
            )
            await storage.save_reflection(reflection)

            # Get reflections
            reflections = await storage.get_reflections("user123")

            # Export all data
            export = await storage.export_all("user123")

            # Delete everything
            await storage.delete_all("user123")
    """

    # Default database location
    DEFAULT_PATH = Path.home() / ".mirror" / "data.db"

    def __init__(
        self,
        config: Optional[StorageConfig] = None,
        path: Optional[str] = None,
        encryption_manager: Optional[EncryptionManager] = None
    ):
        """
        Initialize SQLite storage.

        Args:
            config: Storage configuration
            path: Database path (overrides config.base_path)
            encryption_manager: Optional encryption for sensitive data
        """
        if config is None:
            config = StorageConfig(user_id="default")

        super().__init__(config)

        # Determine database path
        if path:
            self.db_path = Path(path)
        elif config.base_path:
            self.db_path = Path(config.base_path) / "mirror.db"
        else:
            self.db_path = self.DEFAULT_PATH

        self.encryption = encryption_manager
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._conn: Optional[sqlite3.Connection] = None

    @property
    def capabilities(self) -> StorageCapabilities:
        return StorageCapabilities(
            storage_type=StorageType.LOCAL,
            supports_sync=False,  # Local only, sync handled by SyncEngine
            supports_realtime=False,
            supports_encryption=True,
            supports_compression=True,
            requires_network=False,
        )

    async def initialize(self) -> None:
        """Initialize database with schema."""
        # Create parent directory
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        # Initialize in thread pool (SQLite is blocking)
        await asyncio.get_event_loop().run_in_executor(
            self._executor,
            self._init_database
        )
        self._initialized = True

    def _init_database(self) -> None:
        """Create database schema (runs in executor)."""
        self._conn = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False
        )
        self._conn.row_factory = sqlite3.Row

        # Enable WAL mode for better concurrency
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA synchronous=NORMAL")

        cursor = self._conn.cursor()

        # Reflections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reflections (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                response TEXT,
                mode TEXT NOT NULL,
                created_at TEXT NOT NULL,
                metadata TEXT,
                local_only INTEGER DEFAULT 0,
                synced_at TEXT,
                content_hash TEXT NOT NULL,
                encrypted INTEGER DEFAULT 0
            )
        """)

        # Patterns table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patterns (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                pattern_type TEXT NOT NULL,
                name TEXT NOT NULL,
                occurrences INTEGER DEFAULT 1,
                confidence REAL DEFAULT 0.0,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                contexts TEXT,
                local_only INTEGER DEFAULT 0,
                synced_at TEXT
            )
        """)

        # Tensions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tensions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                tension_type TEXT NOT NULL,
                description TEXT NOT NULL,
                severity REAL DEFAULT 0.0,
                first_detected TEXT NOT NULL,
                last_detected TEXT NOT NULL,
                evidence TEXT,
                local_only INTEGER DEFAULT 0,
                synced_at TEXT
            )
        """)

        # Audit trail (append-only)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_trail (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                data TEXT NOT NULL,
                previous_hash TEXT,
                event_hash TEXT NOT NULL
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_reflections_user_date
            ON reflections(user_id, created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_patterns_user
            ON patterns(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tensions_user
            ON tensions(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_user_time
            ON audit_trail(user_id, timestamp DESC)
        """)

        self._conn.commit()

    async def close(self) -> None:
        """Close database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
        self._executor.shutdown(wait=True)

    def _run_in_executor(self, func, *args):
        """Run blocking function in thread pool."""
        return asyncio.get_event_loop().run_in_executor(
            self._executor,
            func,
            *args
        )

    def _encrypt_if_enabled(self, text: str) -> str:
        """Encrypt text if encryption is enabled."""
        if self.encryption and self.config.encrypt_at_rest:
            return self.encryption.encrypt(text)
        return text

    def _decrypt_if_encrypted(self, text: str, encrypted: bool) -> str:
        """Decrypt text if it was encrypted."""
        if encrypted and self.encryption:
            return self.encryption.decrypt(text)
        return text

    # Reflections

    async def save_reflection(self, reflection: Reflection) -> str:
        def _save():
            content = self._encrypt_if_enabled(reflection.content)
            response = self._encrypt_if_enabled(reflection.response) if reflection.response else None
            encrypted = 1 if (self.encryption and self.config.encrypt_at_rest) else 0

            self._conn.execute("""
                INSERT OR REPLACE INTO reflections
                (id, user_id, content, response, mode, created_at, metadata,
                 local_only, synced_at, content_hash, encrypted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                reflection.id,
                reflection.user_id,
                content,
                response,
                reflection.mode,
                reflection.created_at.isoformat(),
                json.dumps(reflection.metadata),
                1 if reflection.local_only else 0,
                reflection.synced_at.isoformat() if reflection.synced_at else None,
                reflection.content_hash,
                encrypted,
            ))
            self._conn.commit()
            return reflection.id

        return await self._run_in_executor(_save)

    async def get_reflection(self, reflection_id: str) -> Optional[Reflection]:
        def _get():
            cursor = self._conn.execute(
                "SELECT * FROM reflections WHERE id = ?",
                (reflection_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None

            content = self._decrypt_if_encrypted(row["content"], row["encrypted"])
            response = self._decrypt_if_encrypted(row["response"], row["encrypted"]) if row["response"] else None

            return Reflection(
                id=row["id"],
                user_id=row["user_id"],
                content=content,
                response=response,
                mode=row["mode"],
                created_at=datetime.fromisoformat(row["created_at"]),
                metadata=json.loads(row["metadata"]) if row["metadata"] else {},
                local_only=bool(row["local_only"]),
                synced_at=datetime.fromisoformat(row["synced_at"]) if row["synced_at"] else None,
                content_hash=row["content_hash"],
            )

        return await self._run_in_executor(_get)

    async def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        since: Optional[datetime] = None
    ) -> List[Reflection]:
        def _get():
            if since:
                cursor = self._conn.execute("""
                    SELECT * FROM reflections
                    WHERE user_id = ? AND created_at > ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (user_id, since.isoformat(), limit, offset))
            else:
                cursor = self._conn.execute("""
                    SELECT * FROM reflections
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (user_id, limit, offset))

            results = []
            for row in cursor.fetchall():
                content = self._decrypt_if_encrypted(row["content"], row["encrypted"])
                response = self._decrypt_if_encrypted(row["response"], row["encrypted"]) if row["response"] else None

                results.append(Reflection(
                    id=row["id"],
                    user_id=row["user_id"],
                    content=content,
                    response=response,
                    mode=row["mode"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                    metadata=json.loads(row["metadata"]) if row["metadata"] else {},
                    local_only=bool(row["local_only"]),
                    synced_at=datetime.fromisoformat(row["synced_at"]) if row["synced_at"] else None,
                    content_hash=row["content_hash"],
                ))
            return results

        return await self._run_in_executor(_get)

    async def delete_reflection(self, reflection_id: str) -> bool:
        def _delete():
            cursor = self._conn.execute(
                "DELETE FROM reflections WHERE id = ?",
                (reflection_id,)
            )
            self._conn.commit()
            return cursor.rowcount > 0

        return await self._run_in_executor(_delete)

    # Patterns

    async def save_pattern(self, pattern: Pattern) -> str:
        def _save():
            self._conn.execute("""
                INSERT OR REPLACE INTO patterns
                (id, user_id, pattern_type, name, occurrences, confidence,
                 first_seen, last_seen, contexts, local_only, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pattern.id,
                pattern.user_id,
                pattern.pattern_type,
                pattern.name,
                pattern.occurrences,
                pattern.confidence,
                pattern.first_seen.isoformat(),
                pattern.last_seen.isoformat(),
                json.dumps(pattern.contexts),
                1 if pattern.local_only else 0,
                pattern.synced_at.isoformat() if pattern.synced_at else None,
            ))
            self._conn.commit()
            return pattern.id

        return await self._run_in_executor(_save)

    async def get_patterns(self, user_id: str) -> List[Pattern]:
        def _get():
            cursor = self._conn.execute(
                "SELECT * FROM patterns WHERE user_id = ? ORDER BY last_seen DESC",
                (user_id,)
            )
            return [
                Pattern(
                    id=row["id"],
                    user_id=row["user_id"],
                    pattern_type=row["pattern_type"],
                    name=row["name"],
                    occurrences=row["occurrences"],
                    confidence=row["confidence"],
                    first_seen=datetime.fromisoformat(row["first_seen"]),
                    last_seen=datetime.fromisoformat(row["last_seen"]),
                    contexts=json.loads(row["contexts"]) if row["contexts"] else [],
                    local_only=bool(row["local_only"]),
                    synced_at=datetime.fromisoformat(row["synced_at"]) if row["synced_at"] else None,
                )
                for row in cursor.fetchall()
            ]

        return await self._run_in_executor(_get)

    async def delete_pattern(self, pattern_id: str) -> bool:
        def _delete():
            cursor = self._conn.execute(
                "DELETE FROM patterns WHERE id = ?",
                (pattern_id,)
            )
            self._conn.commit()
            return cursor.rowcount > 0

        return await self._run_in_executor(_delete)

    # Tensions

    async def save_tension(self, tension: Tension) -> str:
        def _save():
            self._conn.execute("""
                INSERT OR REPLACE INTO tensions
                (id, user_id, tension_type, description, severity,
                 first_detected, last_detected, evidence, local_only, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tension.id,
                tension.user_id,
                tension.tension_type,
                tension.description,
                tension.severity,
                tension.first_detected.isoformat(),
                tension.last_detected.isoformat(),
                json.dumps(tension.evidence),
                1 if tension.local_only else 0,
                tension.synced_at.isoformat() if tension.synced_at else None,
            ))
            self._conn.commit()
            return tension.id

        return await self._run_in_executor(_save)

    async def get_tensions(self, user_id: str) -> List[Tension]:
        def _get():
            cursor = self._conn.execute(
                "SELECT * FROM tensions WHERE user_id = ? ORDER BY last_detected DESC",
                (user_id,)
            )
            return [
                Tension(
                    id=row["id"],
                    user_id=row["user_id"],
                    tension_type=row["tension_type"],
                    description=row["description"],
                    severity=row["severity"],
                    first_detected=datetime.fromisoformat(row["first_detected"]),
                    last_detected=datetime.fromisoformat(row["last_detected"]),
                    evidence=json.loads(row["evidence"]) if row["evidence"] else [],
                    local_only=bool(row["local_only"]),
                    synced_at=datetime.fromisoformat(row["synced_at"]) if row["synced_at"] else None,
                )
                for row in cursor.fetchall()
            ]

        return await self._run_in_executor(_get)

    async def delete_tension(self, tension_id: str) -> bool:
        def _delete():
            cursor = self._conn.execute(
                "DELETE FROM tensions WHERE id = ?",
                (tension_id,)
            )
            self._conn.commit()
            return cursor.rowcount > 0

        return await self._run_in_executor(_delete)

    # Audit Trail

    async def append_audit_event(self, event: AuditEvent) -> str:
        def _append():
            self._conn.execute("""
                INSERT INTO audit_trail
                (id, user_id, event_type, timestamp, data, previous_hash, event_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event.id,
                event.user_id,
                event.event_type,
                event.timestamp.isoformat(),
                json.dumps(event.data),
                event.previous_hash,
                event.event_hash,
            ))
            self._conn.commit()
            return event.id

        return await self._run_in_executor(_append)

    async def get_audit_trail(
        self,
        user_id: str,
        limit: int = 100,
        since: Optional[datetime] = None
    ) -> List[AuditEvent]:
        def _get():
            if since:
                cursor = self._conn.execute("""
                    SELECT * FROM audit_trail
                    WHERE user_id = ? AND timestamp > ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (user_id, since.isoformat(), limit))
            else:
                cursor = self._conn.execute("""
                    SELECT * FROM audit_trail
                    WHERE user_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (user_id, limit))

            return [
                AuditEvent(
                    id=row["id"],
                    user_id=row["user_id"],
                    event_type=row["event_type"],
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    data=json.loads(row["data"]),
                    previous_hash=row["previous_hash"],
                    event_hash=row["event_hash"],
                )
                for row in cursor.fetchall()
            ]

        return await self._run_in_executor(_get)

    async def verify_audit_chain(self, user_id: str) -> bool:
        """Verify audit trail integrity."""
        def _verify():
            cursor = self._conn.execute("""
                SELECT * FROM audit_trail
                WHERE user_id = ?
                ORDER BY timestamp ASC
            """, (user_id,))

            previous_hash = None
            for row in cursor.fetchall():
                event = AuditEvent(
                    id=row["id"],
                    user_id=row["user_id"],
                    event_type=row["event_type"],
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    data=json.loads(row["data"]),
                    previous_hash=row["previous_hash"],
                    event_hash=row["event_hash"],
                )

                # Verify hash chain
                if event.previous_hash != previous_hash:
                    return False

                # Verify event integrity
                if not event.verify_integrity():
                    return False

                previous_hash = event.event_hash

            return True

        return await self._run_in_executor(_verify)

    # Export & Deletion

    async def export_all(self, user_id: str) -> Dict[str, Any]:
        """Export all user data."""
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
            "statistics": await self.get_stats(user_id),
        }

    async def delete_all(self, user_id: str) -> bool:
        """Delete all user data."""
        def _delete():
            self._conn.execute("DELETE FROM reflections WHERE user_id = ?", (user_id,))
            self._conn.execute("DELETE FROM patterns WHERE user_id = ?", (user_id,))
            self._conn.execute("DELETE FROM tensions WHERE user_id = ?", (user_id,))
            self._conn.execute("DELETE FROM audit_trail WHERE user_id = ?", (user_id,))
            self._conn.commit()

            # Vacuum to reclaim space and ensure data is gone
            self._conn.execute("VACUUM")
            return True

        return await self._run_in_executor(_delete)

    # Backup

    async def create_backup(self, backup_path: Optional[str] = None) -> str:
        """Create a backup of the database."""
        if backup_path is None:
            backup_dir = self.db_path.parent / "backups"
            backup_dir.mkdir(exist_ok=True)
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_path = str(backup_dir / f"mirror_backup_{timestamp}.db")

        def _backup():
            # Use SQLite backup API
            backup_conn = sqlite3.connect(backup_path)
            self._conn.backup(backup_conn)
            backup_conn.close()
            return backup_path

        return await self._run_in_executor(_backup)

    async def restore_from_backup(self, backup_path: str) -> bool:
        """Restore database from backup."""
        if not os.path.exists(backup_path):
            raise DataNotFoundError(f"Backup not found: {backup_path}")

        def _restore():
            # Close current connection
            if self._conn:
                self._conn.close()

            # Replace database with backup
            shutil.copy2(backup_path, str(self.db_path))

            # Reinitialize
            self._init_database()
            return True

        return await self._run_in_executor(_restore)
