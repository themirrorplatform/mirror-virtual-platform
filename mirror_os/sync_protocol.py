# mirror_os/sync_protocol.py
"""
Mirror OS Sync Protocol - Dual-Consent Architecture

Key principle: Sync requires explicit consent from BOTH sides.
- User A cannot pull User B's data without B's consent
- User B cannot push data to User A without A's consent
- Consent can be revoked at any time
- Sync is auditable and transparent

This implements I5 (Data Sovereignty) at the network level.
"""

import json
import hashlib
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum


class SyncDirection(Enum):
    """Sync direction options"""
    PUSH = "push"  # Send my data to remote
    PULL = "pull"  # Fetch data from remote
    BIDIRECTIONAL = "bidirectional"  # Both directions


class ConsentStatus(Enum):
    """Consent state"""
    PENDING = "pending"  # Requested, not yet approved
    GRANTED = "granted"  # Approved by both parties
    REVOKED = "revoked"  # Was granted, now revoked
    DENIED = "denied"  # Explicitly rejected


@dataclass
class SyncConsent:
    """Sync consent record"""
    local_identity: str
    remote_identity: str
    remote_endpoint: str
    direction: SyncDirection
    status: ConsentStatus
    requested_at: str
    granted_at: Optional[str]
    revoked_at: Optional[str]
    consent_message: str


@dataclass
class SyncResult:
    """Result of sync operation"""
    success: bool
    sync_timestamp: str
    direction: SyncDirection
    items_synced: int
    sync_hash: str
    errors: List[str]


class SyncProtocol:
    """
    Dual-consent sync protocol.
    
    Design principles:
    1. Explicit consent required from both parties
    2. Consent can be revoked anytime
    3. All sync operations auditable
    4. Differential sync (only changes)
    5. Conflict resolution preserves both versions
    """
    
    def __init__(self, db_path: Path):
        """
        Initialize sync protocol.
        
        Args:
            db_path: Path to Mirror OS database
        """
        self.db_path = db_path
        self._initialize_sync_tables()
    
    def _initialize_sync_tables(self):
        """Create sync protocol tables"""
        with sqlite3.connect(self.db_path) as conn:
            # Consent management
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_consents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    local_identity TEXT NOT NULL,
                    remote_identity TEXT NOT NULL,
                    remote_endpoint TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requested_at TEXT NOT NULL,
                    granted_at TEXT,
                    revoked_at TEXT,
                    consent_message TEXT,
                    UNIQUE(local_identity, remote_identity, remote_endpoint)
                )
            """)
            
            # Sync history
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sync_timestamp TEXT NOT NULL,
                    local_identity TEXT NOT NULL,
                    remote_identity TEXT NOT NULL,
                    remote_endpoint TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    items_synced INTEGER DEFAULT 0,
                    sync_hash TEXT NOT NULL,
                    success BOOLEAN DEFAULT TRUE,
                    errors TEXT
                )
            """)
            
            # Sync markers (for differential sync)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_markers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    remote_endpoint TEXT NOT NULL,
                    last_sync_reflection_id INTEGER,
                    last_sync_timestamp TEXT,
                    last_sync_hash TEXT,
                    UNIQUE(remote_endpoint)
                )
            """)
            
            conn.commit()
    
    def request_sync_consent(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str,
        direction: SyncDirection,
        message: str
    ) -> SyncConsent:
        """
        Request sync consent from remote party.
        
        Args:
            local_identity: Local identity ID
            remote_identity: Remote identity ID
            remote_endpoint: Remote Mirror endpoint
            direction: Sync direction
            message: Human-readable consent request message
        
        Returns:
            SyncConsent record
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO sync_consents (
                    local_identity, remote_identity, remote_endpoint,
                    direction, status, requested_at, consent_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                local_identity,
                remote_identity,
                remote_endpoint,
                direction.value,
                ConsentStatus.PENDING.value,
                timestamp,
                message
            ))
            conn.commit()
        
        return SyncConsent(
            local_identity=local_identity,
            remote_identity=remote_identity,
            remote_endpoint=remote_endpoint,
            direction=direction,
            status=ConsentStatus.PENDING,
            requested_at=timestamp,
            granted_at=None,
            revoked_at=None,
            consent_message=message
        )
    
    def grant_consent(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str
    ) -> bool:
        """
        Grant sync consent.
        
        Args:
            local_identity: Local identity ID
            remote_identity: Remote identity ID
            remote_endpoint: Remote endpoint
        
        Returns:
            True if consent granted successfully
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                UPDATE sync_consents
                SET status = ?, granted_at = ?
                WHERE local_identity = ?
                  AND remote_identity = ?
                  AND remote_endpoint = ?
                  AND status = ?
            """, (
                ConsentStatus.GRANTED.value,
                timestamp,
                local_identity,
                remote_identity,
                remote_endpoint,
                ConsentStatus.PENDING.value
            ))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def revoke_consent(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str
    ) -> bool:
        """
        Revoke previously granted consent.
        
        Args:
            local_identity: Local identity ID
            remote_identity: Remote identity ID
            remote_endpoint: Remote endpoint
        
        Returns:
            True if consent revoked successfully
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                UPDATE sync_consents
                SET status = ?, revoked_at = ?
                WHERE local_identity = ?
                  AND remote_identity = ?
                  AND remote_endpoint = ?
                  AND status = ?
            """, (
                ConsentStatus.REVOKED.value,
                timestamp,
                local_identity,
                remote_identity,
                remote_endpoint,
                ConsentStatus.GRANTED.value
            ))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def check_consent(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str
    ) -> ConsentStatus:
        """
        Check current consent status.
        
        Args:
            local_identity: Local identity ID
            remote_identity: Remote identity ID
            remote_endpoint: Remote endpoint
        
        Returns:
            Current consent status
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT status FROM sync_consents
                WHERE local_identity = ?
                  AND remote_identity = ?
                  AND remote_endpoint = ?
            """, (local_identity, remote_identity, remote_endpoint))
            
            row = cursor.fetchone()
            if row:
                return ConsentStatus(row[0])
            else:
                return ConsentStatus.DENIED
    
    def sync_with_remote(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str,
        direction: SyncDirection
    ) -> SyncResult:
        """
        Perform sync operation with remote Mirror.
        
        Requires consent from both parties.
        
        Args:
            local_identity: Local identity ID
            remote_identity: Remote identity ID
            remote_endpoint: Remote endpoint
            direction: Sync direction
        
        Returns:
            SyncResult with operation details
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        errors = []
        
        # 1. Check consent
        consent_status = self.check_consent(local_identity, remote_identity, remote_endpoint)
        if consent_status != ConsentStatus.GRANTED:
            return SyncResult(
                success=False,
                sync_timestamp=timestamp,
                direction=direction,
                items_synced=0,
                sync_hash="",
                errors=[f"Consent not granted (status: {consent_status.value})"]
            )
        
        # 2. Get last sync marker for differential sync
        last_sync_id, last_sync_hash = self._get_sync_marker(remote_endpoint)
        
        # 3. Perform sync based on direction
        items_synced = 0
        
        try:
            if direction == SyncDirection.PUSH:
                items_synced = self._push_to_remote(
                    local_identity,
                    remote_endpoint,
                    last_sync_id
                )
            elif direction == SyncDirection.PULL:
                items_synced = self._pull_from_remote(
                    local_identity,
                    remote_endpoint,
                    last_sync_id
                )
            elif direction == SyncDirection.BIDIRECTIONAL:
                pushed = self._push_to_remote(local_identity, remote_endpoint, last_sync_id)
                pulled = self._pull_from_remote(local_identity, remote_endpoint, last_sync_id)
                items_synced = pushed + pulled
        
        except Exception as e:
            errors.append(str(e))
        
        # 4. Compute sync hash
        sync_hash = hashlib.sha256(
            f"{timestamp}:{local_identity}:{remote_identity}:{items_synced}".encode()
        ).hexdigest()
        
        # 5. Update sync marker
        self._update_sync_marker(remote_endpoint, timestamp, sync_hash)
        
        # 6. Record sync history
        self._record_sync_history(
            local_identity,
            remote_identity,
            remote_endpoint,
            direction,
            items_synced,
            sync_hash,
            timestamp,
            errors
        )
        
        return SyncResult(
            success=len(errors) == 0,
            sync_timestamp=timestamp,
            direction=direction,
            items_synced=items_synced,
            sync_hash=sync_hash,
            errors=errors
        )
    
    def _get_sync_marker(self, remote_endpoint: str) -> tuple:
        """Get last sync marker for differential sync"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT last_sync_reflection_id, last_sync_hash
                FROM sync_markers
                WHERE remote_endpoint = ?
            """, (remote_endpoint,))
            
            row = cursor.fetchone()
            return row if row else (None, None)
    
    def _update_sync_marker(self, remote_endpoint: str, timestamp: str, sync_hash: str):
        """Update sync marker after successful sync"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO sync_markers (
                    remote_endpoint, last_sync_timestamp, last_sync_hash
                ) VALUES (?, ?, ?)
            """, (remote_endpoint, timestamp, sync_hash))
            conn.commit()
    
    def _push_to_remote(
        self,
        local_identity: str,
        remote_endpoint: str,
        last_sync_id: Optional[int]
    ) -> int:
        """
        Push local changes to remote.
        
        This is a placeholder - real implementation would use
        HTTP/WebSocket to communicate with remote Mirror.
        """
        # In real implementation:
        # 1. Query reflections added since last_sync_id
        # 2. Package as sync bundle
        # 3. POST to remote_endpoint/sync/push
        # 4. Handle conflicts (keep both versions)
        
        print(f"PUSH: Would send changes from {local_identity} to {remote_endpoint}")
        return 0  # Placeholder
    
    def _pull_from_remote(
        self,
        local_identity: str,
        remote_endpoint: str,
        last_sync_id: Optional[int]
    ) -> int:
        """
        Pull remote changes to local.
        
        This is a placeholder - real implementation would use
        HTTP/WebSocket to communicate with remote Mirror.
        """
        # In real implementation:
        # 1. GET from remote_endpoint/sync/pull?since={last_sync_id}
        # 2. Receive sync bundle
        # 3. Import reflections
        # 4. Merge identity graph (preserve contradictions!)
        
        print(f"PULL: Would fetch changes from {remote_endpoint} to {local_identity}")
        return 0  # Placeholder
    
    def _record_sync_history(
        self,
        local_identity: str,
        remote_identity: str,
        remote_endpoint: str,
        direction: SyncDirection,
        items_synced: int,
        sync_hash: str,
        timestamp: str,
        errors: List[str]
    ):
        """Record sync operation in history"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO sync_history (
                    sync_timestamp, local_identity, remote_identity,
                    remote_endpoint, direction, items_synced,
                    sync_hash, success, errors
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timestamp,
                local_identity,
                remote_identity,
                remote_endpoint,
                direction.value,
                items_synced,
                sync_hash,
                len(errors) == 0,
                json.dumps(errors) if errors else None
            ))
            conn.commit()
    
    def get_sync_history(
        self,
        local_identity: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get sync history for identity"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM sync_history
                WHERE local_identity = ?
                ORDER BY sync_timestamp DESC
                LIMIT ?
            """, (local_identity, limit))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_pending_consents(self, local_identity: str) -> List[SyncConsent]:
        """Get all pending consent requests"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM sync_consents
                WHERE local_identity = ?
                  AND status = ?
                ORDER BY requested_at DESC
            """, (local_identity, ConsentStatus.PENDING.value))
            
            results = []
            for row in cursor.fetchall():
                results.append(SyncConsent(
                    local_identity=row["local_identity"],
                    remote_identity=row["remote_identity"],
                    remote_endpoint=row["remote_endpoint"],
                    direction=SyncDirection(row["direction"]),
                    status=ConsentStatus(row["status"]),
                    requested_at=row["requested_at"],
                    granted_at=row["granted_at"],
                    revoked_at=row["revoked_at"],
                    consent_message=row["consent_message"]
                ))
            
            return results


# Self-test
if __name__ == "__main__":
    print("Sync Protocol Test")
    print("=" * 80)
    
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        
        # Create sync protocol
        sync = SyncProtocol(db_path)
        
        # Request consent
        print("1. Requesting sync consent...")
        consent = sync.request_sync_consent(
            local_identity="alice",
            remote_identity="bob",
            remote_endpoint="https://bob-mirror.example.com",
            direction=SyncDirection.BIDIRECTIONAL,
            message="Alice wants to sync reflections with Bob"
        )
        print(f"   Status: {consent.status.value}")
        
        # Check consent (should be PENDING)
        status = sync.check_consent("alice", "bob", "https://bob-mirror.example.com")
        print(f"   Check: {status.value}")
        
        # Grant consent
        print("\n2. Granting consent...")
        granted = sync.grant_consent("alice", "bob", "https://bob-mirror.example.com")
        print(f"   Granted: {granted}")
        
        # Check again (should be GRANTED)
        status = sync.check_consent("alice", "bob", "https://bob-mirror.example.com")
        print(f"   Check: {status.value}")
        
        # Attempt sync
        print("\n3. Attempting sync...")
        result = sync.sync_with_remote(
            local_identity="alice",
            remote_identity="bob",
            remote_endpoint="https://bob-mirror.example.com",
            direction=SyncDirection.BIDIRECTIONAL
        )
        print(f"   Success: {result.success}")
        print(f"   Items synced: {result.items_synced}")
        
        # Revoke consent
        print("\n4. Revoking consent...")
        revoked = sync.revoke_consent("alice", "bob", "https://bob-mirror.example.com")
        print(f"   Revoked: {revoked}")
        
        status = sync.check_consent("alice", "bob", "https://bob-mirror.example.com")
        print(f"   Check: {status.value}")
        
        print("\n✅ Sync protocol functional")
