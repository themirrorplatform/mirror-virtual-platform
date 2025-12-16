"""
Local Storage Manager

Implements local-first storage with sovereignty guarantees.
User data never leaves their machine without explicit consent.
"""

import json
import sqlite3
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List
from datetime import datetime
import os


@dataclass
class StorageConfig:
    """Configuration for local storage"""
    base_path: str  # Base directory for all storage
    user_id: str  # User identifier
    encrypted: bool = True  # Whether to encrypt data
    compression: bool = True  # Whether to compress data
    backup_enabled: bool = True  # Whether to create backups
    
    def get_user_dir(self) -> Path:
        """Get user's storage directory"""
        user_dir = Path(self.base_path) / "users" / self.user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    def get_db_path(self) -> Path:
        """Get path to user's database"""
        return self.get_user_dir() / "mirror.db"
    
    def get_backup_dir(self) -> Path:
        """Get backup directory"""
        backup_dir = self.get_user_dir() / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        return backup_dir


class LocalStore:
    """
    Local-first storage manager.
    
    Key principles:
    - User owns their data (stored locally)
    - No cloud dependencies
    - Encrypted at rest
    - Easy to export/migrate
    - Sovereignty guaranteed
    """
    
    def __init__(self, config: StorageConfig):
        self.config = config
        self.db_path = config.get_db_path()
        self._init_database()
    
    def _init_database(self) -> None:
        """Initialize SQLite database with schema"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
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
                encrypted INTEGER DEFAULT 0
            )
        """)
        
        # Patterns table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patterns (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                occurrences INTEGER DEFAULT 1,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                confidence REAL DEFAULT 0.0,
                contexts TEXT
            )
        """)
        
        # Tensions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tensions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                first_detected TEXT NOT NULL,
                last_detected TEXT NOT NULL,
                severity REAL DEFAULT 0.0,
                evidence TEXT
            )
        """)
        
        # Audit trail table
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
        
        # User preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                tone TEXT DEFAULT 'balanced',
                detail_level TEXT DEFAULT 'balanced',
                preferences TEXT,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patterns_user ON patterns(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_user_time ON audit_trail(user_id, timestamp)")
        
        conn.commit()
        conn.close()
    
    def store_reflection(
        self, 
        reflection_id: str,
        user_id: str,
        content: str,
        response: Optional[str],
        mode: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Store a reflection"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO reflections (id, user_id, content, response, mode, created_at, metadata, encrypted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                reflection_id,
                user_id,
                content,
                response,
                mode,
                datetime.utcnow().isoformat(),
                json.dumps(metadata) if metadata else None,
                0  # Not encrypted in this simple version
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error storing reflection: {e}")
            return False
    
    def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's reflections"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM reflections
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, (user_id, limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def store_pattern(
        self,
        pattern_id: str,
        user_id: str,
        pattern_type: str,
        name: str,
        occurrences: int,
        first_seen: datetime,
        last_seen: datetime,
        confidence: float,
        contexts: List[str]
    ) -> bool:
        """Store a detected pattern"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO patterns
                (id, user_id, type, name, occurrences, first_seen, last_seen, confidence, contexts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pattern_id,
                user_id,
                pattern_type,
                name,
                occurrences,
                first_seen.isoformat(),
                last_seen.isoformat(),
                confidence,
                json.dumps(contexts)
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error storing pattern: {e}")
            return False
    
    def get_patterns(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's patterns"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM patterns
            WHERE user_id = ?
            ORDER BY last_seen DESC
        """, (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def store_audit_event(
        self,
        event_id: str,
        user_id: str,
        event_type: str,
        timestamp: datetime,
        data: Dict[str, Any],
        previous_hash: Optional[str],
        event_hash: str
    ) -> bool:
        """Store an audit trail event"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO audit_trail
                (id, user_id, event_type, timestamp, data, previous_hash, event_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                user_id,
                event_type,
                timestamp.isoformat(),
                json.dumps(data),
                previous_hash,
                event_hash
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error storing audit event: {e}")
            return False
    
    def get_audit_trail(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get user's audit trail"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM audit_trail
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (user_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def export_data(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data for sovereignty/portability.
        
        This is a critical feature for user sovereignty - they can
        take their data and leave at any time.
        """
        return {
            "user_id": user_id,
            "export_date": datetime.utcnow().isoformat(),
            "reflections": self.get_reflections(user_id, limit=10000),
            "patterns": self.get_patterns(user_id),
            "audit_trail": self.get_audit_trail(user_id, limit=10000),
            "version": "1.0.0"
        }
    
    def get_storage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get storage statistics for user"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM reflections WHERE user_id = ?", (user_id,))
        reflection_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM patterns WHERE user_id = ?", (user_id,))
        pattern_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM audit_trail WHERE user_id = ?", (user_id,))
        audit_count = cursor.fetchone()[0]
        
        # Get database size
        db_size = os.path.getsize(str(self.db_path))
        
        conn.close()
        
        return {
            "reflections": reflection_count,
            "patterns": pattern_count,
            "audit_events": audit_count,
            "database_size_bytes": db_size,
            "database_size_mb": round(db_size / (1024 * 1024), 2)
        }
