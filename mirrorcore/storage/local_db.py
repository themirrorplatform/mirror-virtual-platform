# mirrorcore/storage/local_db.py
"""
Local Database - Sovereign Storage Layer

This is the storage layer that owns nothing in the cloud.
SQLite-based, lives on user's machine, user controls completely.

Core principle: No Supabase, no cloud, no platform dependency.
"""

import sqlite3
import json
from pathlib import Path
from typing import Optional, Any, Dict, List
from datetime import datetime
import uuid
import logging


logger = logging.getLogger(__name__)


class LocalDB:
    """
    Local SQLite database for MirrorCore.
    
    Owns:
    - Identities
    - Reflections
    - Mirrorbacks
    - Tensions
    - Axes
    - Sessions
    - Schema version tracking
    
    Never talks to cloud. Never requires network.
    """
    
    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize local database.
        
        Args:
            db_path: Path to SQLite file. If None, uses ~/.mirrorcore/mirror.db
        """
        if db_path is None:
            db_path = Path.home() / ".mirrorcore" / "mirror.db"
        
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initializing local database at: {self.db_path}")
        
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Return dicts instead of tuples
        
        self._initialize_schema()
    
    def _initialize_schema(self):
        """Create tables if they don't exist"""
        cursor = self.conn.cursor()
        
        # Identities table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS identities (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        # Reflections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reflections (
                id TEXT PRIMARY KEY,
                identity_id TEXT,
                content TEXT NOT NULL,
                mirrorback TEXT,
                created_at TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (identity_id) REFERENCES identities(id)
            )
        """)
        
        # Tensions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tensions (
                id TEXT PRIMARY KEY,
                identity_id TEXT,
                name TEXT NOT NULL,
                axis_a TEXT NOT NULL,
                axis_b TEXT NOT NULL,
                position REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (identity_id) REFERENCES identities(id)
            )
        """)
        
        # Axes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS axes (
                id TEXT PRIMARY KEY,
                identity_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (identity_id) REFERENCES identities(id)
            )
        """)
        
        # Sessions table (reflection threads)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                identity_id TEXT,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                metadata TEXT,
                FOREIGN KEY (identity_id) REFERENCES identities(id)
            )
        """)
        
        # Schema version tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL,
                applied_at TEXT NOT NULL
            )
        """)
        
        # Create indices for common queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_reflections_identity 
            ON reflections(identity_id, created_at DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tensions_identity 
            ON tensions(identity_id)
        """)
        
        self.conn.commit()
        logger.info("Database schema initialized")
    
    # =====================================================
    # HELPER METHODS
    # =====================================================
    
    def execute(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        """Execute a query and return cursor"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor
    
    def fetch_one(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Fetch single row as dict"""
        cursor = self.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def fetch_all(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Fetch all rows as list of dicts"""
        cursor = self.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    
    def begin(self):
        """Start transaction"""
        self.conn.execute("BEGIN")
    
    def commit(self):
        """Commit transaction"""
        self.conn.commit()
    
    def rollback(self):
        """Rollback transaction"""
        self.conn.rollback()
    
    def close(self):
        """Close database connection"""
        self.conn.close()
    
    # =====================================================
    # IDENTITY OPERATIONS
    # =====================================================
    
    def create_identity(self, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Create new identity.
        
        Returns:
            identity_id: UUID of created identity
        """
        identity_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.execute(
            """
            INSERT INTO identities (id, created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?)
            """,
            (identity_id, now, now, json.dumps(metadata or {}))
        )
        self.commit()
        
        logger.info(f"Created identity: {identity_id}")
        return identity_id
    
    def get_identity(self, identity_id: str) -> Optional[Dict[str, Any]]:
        """Get identity by ID"""
        return self.fetch_one(
            "SELECT * FROM identities WHERE id = ?",
            (identity_id,)
        )
    
    def update_identity_metadata(
        self, 
        identity_id: str, 
        metadata: Dict[str, Any]
    ) -> bool:
        """Update identity metadata"""
        now = datetime.utcnow().isoformat()
        
        cursor = self.execute(
            """
            UPDATE identities 
            SET metadata = ?, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(metadata), now, identity_id)
        )
        self.commit()
        
        return cursor.rowcount > 0
    
    # =====================================================
    # REFLECTION OPERATIONS
    # =====================================================
    
    def create_reflection(
        self,
        content: str,
        identity_id: Optional[str] = None,
        mirrorback: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create new reflection.
        
        Args:
            content: The reflection text
            identity_id: Optional identity to associate with
            mirrorback: Optional AI-generated response
            metadata: Optional additional data (patterns, etc.)
        
        Returns:
            reflection_id: UUID of created reflection
        """
        reflection_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.execute(
            """
            INSERT INTO reflections 
            (id, identity_id, content, mirrorback, created_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                reflection_id,
                identity_id,
                content,
                mirrorback,
                now,
                json.dumps(metadata or {})
            )
        )
        self.commit()
        
        logger.info(f"Created reflection: {reflection_id}")
        return reflection_id
    
    def get_reflection(self, reflection_id: str) -> Optional[Dict[str, Any]]:
        """Get reflection by ID"""
        row = self.fetch_one(
            "SELECT * FROM reflections WHERE id = ?",
            (reflection_id,)
        )
        
        if row and row.get("metadata"):
            row["metadata"] = json.loads(row["metadata"])
        
        return row
    
    def list_reflections(
        self,
        identity_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List reflections.
        
        Args:
            identity_id: Optional filter by identity
            limit: Max number to return
            offset: Pagination offset
        
        Returns:
            List of reflection dicts
        """
        if identity_id:
            reflections = self.fetch_all(
                """
                SELECT * FROM reflections 
                WHERE identity_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                (identity_id, limit, offset)
            )
        else:
            reflections = self.fetch_all(
                """
                SELECT * FROM reflections 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset)
            )
        
        # Parse metadata JSON
        for r in reflections:
            if r.get("metadata"):
                r["metadata"] = json.loads(r["metadata"])
        
        return reflections
    
    def count_reflections(self, identity_id: Optional[str] = None) -> int:
        """Count total reflections"""
        if identity_id:
            row = self.fetch_one(
                "SELECT COUNT(*) as count FROM reflections WHERE identity_id = ?",
                (identity_id,)
            )
        else:
            row = self.fetch_one("SELECT COUNT(*) as count FROM reflections")
        
        return row["count"] if row else 0
    
    # =====================================================
    # TENSION OPERATIONS
    # =====================================================
    
    def create_tension(
        self,
        identity_id: str,
        name: str,
        axis_a: str,
        axis_b: str,
        position: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create new tension"""
        tension_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.execute(
            """
            INSERT INTO tensions
            (id, identity_id, name, axis_a, axis_b, position, created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tension_id,
                identity_id,
                name,
                axis_a,
                axis_b,
                position,
                now,
                now,
                json.dumps(metadata or {})
            )
        )
        self.commit()
        
        logger.info(f"Created tension: {tension_id}")
        return tension_id
    
    def get_tensions(self, identity_id: str) -> List[Dict[str, Any]]:
        """Get all tensions for an identity"""
        tensions = self.fetch_all(
            "SELECT * FROM tensions WHERE identity_id = ? ORDER BY created_at DESC",
            (identity_id,)
        )
        
        for t in tensions:
            if t.get("metadata"):
                t["metadata"] = json.loads(t["metadata"])
        
        return tensions
    
    def update_tension_position(
        self,
        tension_id: str,
        position: float
    ) -> bool:
        """Update tension position"""
        now = datetime.utcnow().isoformat()
        
        cursor = self.execute(
            """
            UPDATE tensions 
            SET position = ?, updated_at = ?
            WHERE id = ?
            """,
            (position, now, tension_id)
        )
        self.commit()
        
        return cursor.rowcount > 0
    
    # =====================================================
    # SESSION OPERATIONS
    # =====================================================
    
    def create_session(
        self,
        identity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create new reflection session"""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.execute(
            """
            INSERT INTO sessions (id, identity_id, started_at, metadata)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, identity_id, now, json.dumps(metadata or {}))
        )
        self.commit()
        
        return session_id
    
    def end_session(self, session_id: str) -> bool:
        """Mark session as ended"""
        now = datetime.utcnow().isoformat()
        
        cursor = self.execute(
            "UPDATE sessions SET ended_at = ? WHERE id = ?",
            (now, session_id)
        )
        self.commit()
        
        return cursor.rowcount > 0
    
    # =====================================================
    # SCHEMA VERSION TRACKING
    # =====================================================
    
    def get_schema_version(self) -> str:
        """Get current schema version"""
        row = self.fetch_one(
            "SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1"
        )
        return row["version"] if row else "0.0.0"
    
    def record_migration(self, version: str):
        """Record that a migration was applied"""
        now = datetime.utcnow().isoformat()
        self.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
            (version, now)
        )
        self.commit()
        logger.info(f"Recorded migration: {version}")
    
    # =====================================================
    # EXPORT & BACKUP
    # =====================================================
    
    def export_all_data(self) -> Dict[str, Any]:
        """
        Export all data as JSON (for backup or migration).
        
        Returns:
            Dict containing all tables' data
        """
        return {
            "version": self.get_schema_version(),
            "exported_at": datetime.utcnow().isoformat(),
            "identities": self.fetch_all("SELECT * FROM identities"),
            "reflections": self.fetch_all("SELECT * FROM reflections"),
            "tensions": self.fetch_all("SELECT * FROM tensions"),
            "axes": self.fetch_all("SELECT * FROM axes"),
            "sessions": self.fetch_all("SELECT * FROM sessions")
        }
    
    def get_stats(self) -> Dict[str, int]:
        """Get database statistics"""
        return {
            "identities": self.fetch_one("SELECT COUNT(*) as count FROM identities")["count"],
            "reflections": self.fetch_one("SELECT COUNT(*) as count FROM reflections")["count"],
            "tensions": self.fetch_one("SELECT COUNT(*) as count FROM tensions")["count"],
            "axes": self.fetch_one("SELECT COUNT(*) as count FROM axes")["count"],
            "sessions": self.fetch_one("SELECT COUNT(*) as count FROM sessions")["count"]
        }
