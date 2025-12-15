"""
Event Log Storage

Append-only event log implementation using SQLite with WAL mode.
Provides durable storage for identity events with replay capabilities.

Key Features:
- Append-only (no updates or deletes)
- WAL mode for better concurrency
- Event ordering guarantees
- Efficient range queries
- Integrity checks via hashes
"""

import sqlite3
import json
from typing import Optional, List, Iterator
from datetime import datetime
from pathlib import Path

from .event_schema import BaseEvent, deserialize_event, EventValidator


class EventLog:
    """
    Append-only event log storage.
    
    Design:
    - Events are never updated or deleted
    - Each event has a monotonic sequence number
    - Hash chain ensures integrity
    - Replay from any point
    """
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
        self._ensure_db()
    
    def _ensure_db(self):
        """Create database and tables if they don't exist."""
        
        # Create directory if needed
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        
        # Create tables
        conn.executescript("""
        -- Main event log
        CREATE TABLE IF NOT EXISTS events (
            seq INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            instance_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            
            -- Event data (canonical JSON)
            event_data TEXT NOT NULL,
            
            -- Signature
            signature TEXT,
            
            -- Hash chain for integrity
            content_hash TEXT NOT NULL,
            prev_hash TEXT,
            
            -- Indexing
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            
            -- Ensure append-only (no updates)
            CHECK (seq > 0)
        );
        
        -- Indexes for efficient queries
        CREATE INDEX IF NOT EXISTS idx_events_instance 
            ON events(instance_id, seq);
        
        CREATE INDEX IF NOT EXISTS idx_events_user 
            ON events(user_id, seq);
        
        CREATE INDEX IF NOT EXISTS idx_events_type 
            ON events(event_type, seq);
        
        CREATE INDEX IF NOT EXISTS idx_events_timestamp 
            ON events(timestamp);
        
        CREATE INDEX IF NOT EXISTS idx_events_event_id 
            ON events(event_id);
        
        -- Checkpoint log (for tracking replay positions)
        CREATE TABLE IF NOT EXISTS replay_checkpoints (
            instance_id TEXT PRIMARY KEY,
            last_replayed_seq INTEGER NOT NULL,
            replayed_at TEXT NOT NULL,
            identity_state_hash TEXT
        );
        """)
        
        conn.commit()
        conn.close()
    
    def connect(self):
        """Open database connection."""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA journal_mode=WAL")
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def append(self, event: BaseEvent) -> int:
        """
        Append an event to the log.
        
        Returns: sequence number
        """
        
        # Validate event
        is_valid, error = EventValidator.validate(event)
        if not is_valid:
            raise ValueError(f"Invalid event: {error}")
        
        # Get canonical representation
        event_data = event.canonical_bytes().decode('utf-8')
        content_hash = event.content_hash()
        
        # Get previous hash for chain
        prev_hash = self._get_last_hash(event.instance_id)
        
        # Insert
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO events (
                event_id, instance_id, user_id, event_type, timestamp,
                event_data, signature, content_hash, prev_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.event_id,
            event.instance_id,
            event.user_id,
            event.event_type,
            event.timestamp,
            event_data,
            event.signature,
            content_hash,
            prev_hash
        ))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def _get_last_hash(self, instance_id: str) -> Optional[str]:
        """Get hash of last event for this instance."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT content_hash FROM events
            WHERE instance_id = ?
            ORDER BY seq DESC
            LIMIT 1
        """, (instance_id,))
        
        row = cursor.fetchone()
        return row['content_hash'] if row else None
    
    def get_events(
        self,
        instance_id: Optional[str] = None,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        since_seq: int = 0,
        limit: Optional[int] = None
    ) -> List[BaseEvent]:
        """
        Query events from the log.
        
        Args:
            instance_id: Filter by instance
            user_id: Filter by user
            event_type: Filter by event type
            since_seq: Only events after this sequence number
            limit: Maximum number of events to return
        
        Returns: List of events
        """
        
        query = "SELECT * FROM events WHERE seq > ?"
        params = [since_seq]
        
        if instance_id:
            query += " AND instance_id = ?"
            params.append(instance_id)
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        
        query += " ORDER BY seq ASC"
        
        if limit:
            query += " LIMIT ?"
            params.append(limit)
        
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        
        events = []
        for row in cursor.fetchall():
            event = deserialize_event(row['event_data'])
            event.signature = row['signature']
            events.append(event)
        
        return events
    
    def replay(self, instance_id: str, since_seq: int = 0) -> Iterator[BaseEvent]:
        """
        Replay events for an instance.
        
        This is a generator for memory efficiency when replaying large logs.
        
        Args:
            instance_id: Instance to replay
            since_seq: Start from this sequence number
        
        Yields: Events in order
        """
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM events
            WHERE instance_id = ? AND seq > ?
            ORDER BY seq ASC
        """, (instance_id, since_seq))
        
        for row in cursor:
            event = deserialize_event(row['event_data'])
            event.signature = row['signature']
            yield event
    
    def verify_integrity(self, instance_id: str) -> tuple[bool, Optional[str]]:
        """
        Verify hash chain integrity for an instance.
        
        Returns: (is_valid, error_message)
        """
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT seq, content_hash, prev_hash FROM events
            WHERE instance_id = ?
            ORDER BY seq ASC
        """, (instance_id,))
        
        prev_hash = None
        for row in cursor:
            if row['prev_hash'] != prev_hash:
                return False, f"Hash chain broken at seq {row['seq']}: expected {prev_hash}, got {row['prev_hash']}"
            prev_hash = row['content_hash']
        
        return True, None
    
    def checkpoint(self, instance_id: str, seq: int, identity_state_hash: Optional[str] = None):
        """
        Record a replay checkpoint.
        
        This tracks the last successfully replayed sequence number
        and optionally the hash of the resulting identity state.
        """
        
        self.conn.execute("""
            INSERT OR REPLACE INTO replay_checkpoints (
                instance_id, last_replayed_seq, replayed_at, identity_state_hash
            ) VALUES (?, ?, ?, ?)
        """, (
            instance_id,
            seq,
            datetime.utcnow().isoformat() + "Z",
            identity_state_hash
        ))
        self.conn.commit()
    
    def get_checkpoint(self, instance_id: str) -> Optional[dict]:
        """Get last replay checkpoint for an instance."""
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM replay_checkpoints WHERE instance_id = ?
        """, (instance_id,))
        
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    
    def count_events(
        self,
        instance_id: Optional[str] = None,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None
    ) -> int:
        """Count events matching filters."""
        
        query = "SELECT COUNT(*) as count FROM events WHERE 1=1"
        params = []
        
        if instance_id:
            query += " AND instance_id = ?"
            params.append(instance_id)
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchone()['count']
    
    def export_log(self, instance_id: str, output_path: str):
        """
        Export event log for an instance to JSON file.
        
        This enables data portability and backup.
        """
        
        events = self.get_events(instance_id=instance_id)
        
        export_data = {
            "instance_id": instance_id,
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "event_count": len(events),
            "events": [event.to_dict() for event in events]
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    def import_log(self, input_path: str):
        """
        Import event log from JSON file.
        
        This enables data restoration and migration.
        """
        
        with open(input_path, 'r') as f:
            import_data = json.load(f)
        
        for event_data in import_data['events']:
            from .event_schema import create_event
            event = create_event(event_data['event_type'], **event_data)
            self.append(event)
