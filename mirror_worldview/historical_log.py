# mirror_worldview/historical_log.py
"""
Historical Integrity Log

Append-only cryptographic log for constitutional decisions and governance actions.

Design:
- Append-only (no edits or deletions)
- Cryptographic chain (each entry hashes previous)
- Tamper-evident (any modification breaks chain)
- Timestamped (immutable record)
- Auditable (full transparency)

Use cases:
- Constitutional amendments
- Governance votes
- Guardian interventions
- Fork decisions
- Critical system changes
"""

import json
import hashlib
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class EventType(Enum):
    """Types of events logged"""
    AMENDMENT_PROPOSED = "amendment_proposed"
    AMENDMENT_VOTED = "amendment_voted"
    AMENDMENT_PASSED = "amendment_passed"
    AMENDMENT_REJECTED = "amendment_rejected"
    AMENDMENT_APPLIED = "amendment_applied"
    GUARDIAN_ALERT = "guardian_alert"
    GUARDIAN_INTERVENTION = "guardian_intervention"
    FORK_CREATED = "fork_created"
    CONSTITUTION_MODIFIED = "constitution_modified"
    DRIFT_ALERT = "drift_alert"
    CRITICAL_VIOLATION = "critical_violation"


@dataclass
class LogEntry:
    """Single entry in the historical log"""
    id: int
    timestamp: datetime
    event_type: EventType
    actor: str  # Who/what caused this event
    data: Dict[str, Any]  # Event-specific data
    previous_hash: str  # Hash of previous entry
    entry_hash: str  # Hash of this entry


class HistoricalLog:
    """
    Append-only cryptographic log for constitutional integrity.
    
    Each entry contains:
    - Timestamp (immutable)
    - Event type
    - Actor (identity, system component)
    - Data (event-specific)
    - Previous hash (chain integrity)
    - Entry hash (tamper detection)
    
    Chain validation:
    - Genesis entry has previous_hash = "0" * 64
    - Each subsequent entry hashes previous
    - Any modification breaks the chain
    """
    
    def __init__(self, db_path: Path):
        """
        Initialize historical log.
        
        Args:
            db_path: Path to SQLite database
        """
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS historical_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    data TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    entry_hash TEXT NOT NULL
                )
            """)
            
            # Index for chain validation
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_chain 
                ON historical_log(id, previous_hash, entry_hash)
            """)
            
            conn.commit()
            
        # Create genesis entry if empty
        self._ensure_genesis()
    
    def _ensure_genesis(self):
        """Ensure genesis entry exists"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM historical_log")
            count = cursor.fetchone()[0]
            
            if count == 0:
                # Create genesis entry
                genesis = {
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'event_type': 'genesis',
                    'actor': 'system',
                    'data': json.dumps({
                        'message': 'Mirror Virtual Platform - Historical Log Genesis',
                        'version': '1.0.0',
                        'constitution_hash': '0' * 64  # Placeholder
                    }),
                    'previous_hash': '0' * 64
                }
                
                entry_hash = self._calculate_hash(genesis)
                
                conn.execute("""
                    INSERT INTO historical_log 
                    (timestamp, event_type, actor, data, previous_hash, entry_hash)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    genesis['timestamp'],
                    genesis['event_type'],
                    genesis['actor'],
                    genesis['data'],
                    genesis['previous_hash'],
                    entry_hash
                ))
                
                conn.commit()
    
    def _calculate_hash(self, entry: Dict[str, Any]) -> str:
        """
        Calculate cryptographic hash of entry.
        
        Args:
            entry: Entry data
        
        Returns:
            SHA-256 hash
        """
        # Canonical representation
        canonical = f"{entry['timestamp']}|{entry['event_type']}|{entry['actor']}|{entry['data']}|{entry['previous_hash']}"
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def _get_last_entry(self) -> Optional[LogEntry]:
        """Get most recent entry for chaining"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT id, timestamp, event_type, actor, data, previous_hash, entry_hash
                FROM historical_log
                ORDER BY id DESC
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            if not row:
                return None
            
            return LogEntry(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1].replace('Z', '+00:00')),
                event_type=EventType(row[2]) if row[2] != 'genesis' else row[2],
                actor=row[3],
                data=json.loads(row[4]),
                previous_hash=row[5],
                entry_hash=row[6]
            )
    
    def append(
        self,
        event_type: EventType,
        actor: str,
        data: Dict[str, Any]
    ) -> LogEntry:
        """
        Append new entry to log.
        
        Args:
            event_type: Type of event
            actor: Who/what caused this
            data: Event-specific data
        
        Returns:
            Created LogEntry
        """
        # Get last entry for chaining
        last = self._get_last_entry()
        previous_hash = last.entry_hash if last else '0' * 64
        
        # Build entry
        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': event_type.value,
            'actor': actor,
            'data': json.dumps(data),
            'previous_hash': previous_hash
        }
        
        # Calculate hash
        entry_hash = self._calculate_hash(entry)
        
        # Insert
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                INSERT INTO historical_log 
                (timestamp, event_type, actor, data, previous_hash, entry_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                entry['timestamp'],
                entry['event_type'],
                entry['actor'],
                entry['data'],
                entry['previous_hash'],
                entry_hash
            ))
            
            entry_id = cursor.lastrowid
            conn.commit()
        
        return LogEntry(
            id=entry_id,
            timestamp=datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00')),
            event_type=event_type,
            actor=actor,
            data=data,
            previous_hash=previous_hash,
            entry_hash=entry_hash
        )
    
    def validate_chain(self) -> Dict[str, Any]:
        """
        Validate entire chain integrity.
        
        Returns:
            Dict with validation results:
                - valid: bool
                - total_entries: int
                - first_invalid_id: Optional[int]
                - error: Optional[str]
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT id, timestamp, event_type, actor, data, previous_hash, entry_hash
                FROM historical_log
                ORDER BY id ASC
            """)
            
            entries = cursor.fetchall()
        
        if not entries:
            return {
                'valid': True,
                'total_entries': 0
            }
        
        # Validate each entry
        for i, row in enumerate(entries):
            entry = {
                'timestamp': row[1],
                'event_type': row[2],
                'actor': row[3],
                'data': row[4],
                'previous_hash': row[5]
            }
            
            stored_hash = row[6]
            calculated_hash = self._calculate_hash(entry)
            
            # Check hash matches
            if stored_hash != calculated_hash:
                return {
                    'valid': False,
                    'total_entries': len(entries),
                    'first_invalid_id': row[0],
                    'error': f'Entry {row[0]} hash mismatch'
                }
            
            # Check previous hash chain (except genesis)
            if i > 0:
                prev_stored_hash = entries[i-1][6]
                if entry['previous_hash'] != prev_stored_hash:
                    return {
                        'valid': False,
                        'total_entries': len(entries),
                        'first_invalid_id': row[0],
                        'error': f'Entry {row[0]} chain broken'
                    }
        
        return {
            'valid': True,
            'total_entries': len(entries)
        }
    
    def get_entries(
        self,
        event_type: Optional[EventType] = None,
        actor: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[LogEntry]:
        """
        Query log entries.
        
        Args:
            event_type: Filter by event type
            actor: Filter by actor
            limit: Maximum entries
            offset: Offset for pagination
        
        Returns:
            List of LogEntry
        """
        with sqlite3.connect(self.db_path) as conn:
            query = "SELECT id, timestamp, event_type, actor, data, previous_hash, entry_hash FROM historical_log WHERE 1=1"
            params = []
            
            if event_type:
                query += " AND event_type = ?"
                params.append(event_type.value)
            
            if actor:
                query += " AND actor = ?"
                params.append(actor)
            
            query += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor = conn.execute(query, params)
            
            entries = []
            for row in cursor.fetchall():
                entries.append(LogEntry(
                    id=row[0],
                    timestamp=datetime.fromisoformat(row[1].replace('Z', '+00:00')),
                    event_type=EventType(row[2]) if row[2] != 'genesis' else row[2],
                    actor=row[3],
                    data=json.loads(row[4]),
                    previous_hash=row[5],
                    entry_hash=row[6]
                ))
            
            return entries
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get log statistics.
        
        Returns:
            Dict with stats
        """
        with sqlite3.connect(self.db_path) as conn:
            # Total entries
            cursor = conn.execute("SELECT COUNT(*) FROM historical_log")
            total = cursor.fetchone()[0]
            
            # By event type
            cursor = conn.execute("""
                SELECT event_type, COUNT(*) 
                FROM historical_log 
                GROUP BY event_type
            """)
            by_type = {row[0]: row[1] for row in cursor.fetchall()}
            
            # First and last
            cursor = conn.execute("""
                SELECT MIN(timestamp), MAX(timestamp) 
                FROM historical_log
            """)
            first, last = cursor.fetchone()
        
        return {
            'total_entries': total,
            'by_event_type': by_type,
            'first_entry': first,
            'last_entry': last
        }


# Self-test
if __name__ == "__main__":
    print("Historical Integrity Log Test")
    print("=" * 80)
    
    # Create log
    log = HistoricalLog(Path(":memory:"))
    
    # Append test entries
    log.append(
        EventType.AMENDMENT_PROPOSED,
        "identity:abc123",
        {
            'proposal_id': 'prop_001',
            'title': 'Test Amendment',
            'description': 'Testing the historical log'
        }
    )
    
    log.append(
        EventType.GUARDIAN_ALERT,
        "guardian:primary",
        {
            'severity': 'warning',
            'message': 'Test alert'
        }
    )
    
    log.append(
        EventType.AMENDMENT_PASSED,
        "governance:system",
        {
            'proposal_id': 'prop_001',
            'approval_rate': 0.72,
            'total_votes': 150
        }
    )
    
    # Validate chain
    validation = log.validate_chain()
    print(f"\nChain validation: {validation}")
    
    # Get stats
    stats = log.get_stats()
    print(f"\nStats: {stats['total_entries']} entries")
    print(f"By type: {stats['by_event_type']}")
    
    # Query entries
    entries = log.get_entries(limit=10)
    print(f"\nRecent entries: {len(entries)}")
    for entry in entries:
        print(f"  - {entry.event_type}: {entry.actor} at {entry.timestamp}")
    
    print("\n✅ Historical log functional")
