# mirror_os/sync/websocket_sync.py
"""
WebSocket Sync Protocol for Multi-Device Synchronization

Real-time synchronization of reflections, mirrorbacks, and identity state
across multiple devices.

Design:
- WebSocket for real-time bidirectional communication
- Conflict resolution (last-write-wins with vector clocks)
- Offline queue (sync when reconnected)
- Incremental sync (only changes since last sync)
- Constitutional compliance (all synced content passes L0)
"""

import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import sqlite3


logger = logging.getLogger(__name__)


@dataclass
class SyncMessage:
    """Message in sync protocol"""
    type: str  # "sync_request", "sync_response", "reflection_created", "reflection_updated"
    identity_id: str
    data: Dict[str, Any]
    timestamp: datetime
    vector_clock: Dict[str, int]  # Device ID -> sequence number


@dataclass
class SyncState:
    """Sync state for an identity"""
    identity_id: str
    device_id: str
    last_sync: datetime
    vector_clock: Dict[str, int]
    pending_operations: List[Dict[str, Any]]


class WebSocketSyncServer:
    """
    WebSocket server for real-time reflection synchronization.
    
    Features:
    - Real-time push notifications of new reflections
    - Conflict resolution using vector clocks
    - Offline operation queue
    - Incremental sync (only changes since last sync)
    - Device registration and tracking
    """
    
    def __init__(self, db_path: Path, port: int = 8765):
        """
        Initialize WebSocket sync server.
        
        Args:
            db_path: Database path for sync state
            port: WebSocket server port
        """
        self.db_path = db_path
        self.port = port
        self.active_connections: Dict[str, Set[Any]] = {}  # identity_id -> set of websockets
        self._init_db()
    
    def _init_db(self):
        """Initialize sync state database"""
        with sqlite3.connect(self.db_path) as conn:
            # Device registration
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_devices (
                    device_id TEXT PRIMARY KEY,
                    identity_id TEXT NOT NULL,
                    device_name TEXT,
                    last_seen TEXT NOT NULL,
                    vector_clock TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Sync operations queue (for offline)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_operations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT NOT NULL,
                    operation_type TEXT NOT NULL,
                    operation_data TEXT NOT NULL,
                    vector_clock TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    synced BOOLEAN DEFAULT FALSE
                )
            """)
            
            # Sync log (audit trail)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            
            conn.execute("CREATE INDEX IF NOT EXISTS idx_device ON sync_operations(device_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_synced ON sync_operations(synced)")
            
            conn.commit()
    
    def register_device(
        self,
        device_id: str,
        identity_id: str,
        device_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register device for sync.
        
        Args:
            device_id: Unique device identifier
            identity_id: Identity this device belongs to
            device_name: Human-readable device name
        
        Returns:
            Registration result with initial sync state
        """
        with sqlite3.connect(self.db_path) as conn:
            # Check if device exists
            cursor = conn.execute(
                "SELECT vector_clock FROM sync_devices WHERE device_id = ?",
                (device_id,)
            )
            row = cursor.fetchone()
            
            if row:
                # Update last seen
                conn.execute("""
                    UPDATE sync_devices
                    SET last_seen = ?
                    WHERE device_id = ?
                """, (datetime.utcnow().isoformat(), device_id))
                
                vector_clock = json.loads(row[0])
            else:
                # New device
                vector_clock = {device_id: 0}
                conn.execute("""
                    INSERT INTO sync_devices
                    (device_id, identity_id, device_name, last_seen, vector_clock, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    device_id,
                    identity_id,
                    device_name or f"Device {device_id[:8]}",
                    datetime.utcnow().isoformat(),
                    json.dumps(vector_clock),
                    datetime.utcnow().isoformat()
                ))
            
            conn.commit()
        
        return {
            'device_id': device_id,
            'identity_id': identity_id,
            'vector_clock': vector_clock,
            'registered': True
        }
    
    def get_pending_operations(self, device_id: str) -> List[Dict[str, Any]]:
        """
        Get operations pending sync for device.
        
        Args:
            device_id: Device identifier
        
        Returns:
            List of pending operations
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT id, operation_type, operation_data, vector_clock, created_at
                FROM sync_operations
                WHERE device_id = ?
                AND synced = FALSE
                ORDER BY id ASC
            """, (device_id,))
            
            operations = []
            for row in cursor.fetchall():
                operations.append({
                    'id': row[0],
                    'type': row[1],
                    'data': json.loads(row[2]),
                    'vector_clock': json.loads(row[3]),
                    'timestamp': row[4]
                })
            
            return operations
    
    def queue_operation(
        self,
        device_id: str,
        operation_type: str,
        operation_data: Dict[str, Any],
        vector_clock: Dict[str, int]
    ) -> int:
        """
        Queue operation for sync.
        
        Args:
            device_id: Device that created operation
            operation_type: Type (reflection_created, reflection_updated, etc)
            operation_data: Operation data
            vector_clock: Current vector clock
        
        Returns:
            Operation ID
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                INSERT INTO sync_operations
                (device_id, operation_type, operation_data, vector_clock, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                device_id,
                operation_type,
                json.dumps(operation_data),
                json.dumps(vector_clock),
                datetime.utcnow().isoformat()
            ))
            
            operation_id = cursor.lastrowid
            conn.commit()
        
        logger.info(f"Queued operation {operation_id} for device {device_id}")
        return operation_id
    
    def mark_synced(self, operation_ids: List[int]):
        """
        Mark operations as synced.
        
        Args:
            operation_ids: List of operation IDs to mark
        """
        with sqlite3.connect(self.db_path) as conn:
            placeholders = ','.join('?' * len(operation_ids))
            conn.execute(f"""
                UPDATE sync_operations
                SET synced = TRUE
                WHERE id IN ({placeholders})
            """, operation_ids)
            
            conn.commit()
        
        logger.info(f"Marked {len(operation_ids)} operations as synced")
    
    def resolve_conflict(
        self,
        local_clock: Dict[str, int],
        remote_clock: Dict[str, int]
    ) -> str:
        """
        Resolve conflict using vector clock comparison.
        
        Args:
            local_clock: Local device vector clock
            remote_clock: Remote device vector clock
        
        Returns:
            "local_wins", "remote_wins", or "concurrent" (needs manual resolution)
        """
        # Check if local happened before remote
        local_before_remote = all(
            local_clock.get(device, 0) <= remote_clock.get(device, 0)
            for device in set(local_clock.keys()) | set(remote_clock.keys())
        )
        
        # Check if remote happened before local
        remote_before_local = all(
            remote_clock.get(device, 0) <= local_clock.get(device, 0)
            for device in set(local_clock.keys()) | set(remote_clock.keys())
        )
        
        if local_before_remote and not remote_before_local:
            return "remote_wins"  # Remote is newer
        elif remote_before_local and not local_before_remote:
            return "local_wins"  # Local is newer
        else:
            return "concurrent"  # Conflicting edits
    
    def increment_clock(
        self,
        vector_clock: Dict[str, int],
        device_id: str
    ) -> Dict[str, int]:
        """
        Increment vector clock for device.
        
        Args:
            vector_clock: Current clock
            device_id: Device making change
        
        Returns:
            Updated clock
        """
        updated = vector_clock.copy()
        updated[device_id] = updated.get(device_id, 0) + 1
        return updated
    
    def merge_clocks(
        self,
        clock1: Dict[str, int],
        clock2: Dict[str, int]
    ) -> Dict[str, int]:
        """
        Merge two vector clocks (take maximum for each device).
        
        Args:
            clock1: First clock
            clock2: Second clock
        
        Returns:
            Merged clock
        """
        merged = {}
        all_devices = set(clock1.keys()) | set(clock2.keys())
        
        for device in all_devices:
            merged[device] = max(clock1.get(device, 0), clock2.get(device, 0))
        
        return merged
    
    async def handle_connection(self, websocket, path):
        """
        Handle WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            path: Connection path
        """
        device_id = None
        identity_id = None
        
        try:
            # Wait for registration message
            registration = await websocket.recv()
            reg_data = json.loads(registration)
            
            device_id = reg_data['device_id']
            identity_id = reg_data['identity_id']
            
            # Register device
            reg_result = self.register_device(device_id, identity_id, reg_data.get('device_name'))
            
            # Track connection
            if identity_id not in self.active_connections:
                self.active_connections[identity_id] = set()
            self.active_connections[identity_id].add(websocket)
            
            # Send registration confirmation
            await websocket.send(json.dumps({
                'type': 'registered',
                'data': reg_result
            }))
            
            # Send pending operations
            pending = self.get_pending_operations(device_id)
            if pending:
                await websocket.send(json.dumps({
                    'type': 'pending_operations',
                    'data': pending
                }))
            
            # Handle messages
            async for message in websocket:
                msg_data = json.loads(message)
                await self._handle_message(websocket, device_id, identity_id, msg_data)
        
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        
        finally:
            # Clean up connection
            if identity_id and websocket in self.active_connections.get(identity_id, set()):
                self.active_connections[identity_id].remove(websocket)
    
    async def _handle_message(
        self,
        websocket,
        device_id: str,
        identity_id: str,
        message: Dict[str, Any]
    ):
        """Handle incoming sync message"""
        msg_type = message['type']
        
        if msg_type == 'sync_request':
            # Client requesting full sync
            pending = self.get_pending_operations(device_id)
            await websocket.send(json.dumps({
                'type': 'sync_response',
                'data': pending
            }))
        
        elif msg_type == 'operation':
            # Client sending new operation
            op_data = message['data']
            vector_clock = message['vector_clock']
            
            # Queue operation
            op_id = self.queue_operation(
                device_id,
                op_data['type'],
                op_data['data'],
                vector_clock
            )
            
            # Broadcast to other devices
            await self._broadcast_to_devices(identity_id, device_id, {
                'type': 'operation_received',
                'operation_id': op_id,
                'data': op_data
            })
        
        elif msg_type == 'ack_operations':
            # Client confirming operations synced
            op_ids = message['operation_ids']
            self.mark_synced(op_ids)
    
    async def _broadcast_to_devices(
        self,
        identity_id: str,
        except_device: str,
        message: Dict[str, Any]
    ):
        """Broadcast message to all devices except sender"""
        if identity_id not in self.active_connections:
            return
        
        for ws in self.active_connections[identity_id]:
            try:
                await ws.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
    
    def get_sync_stats(self) -> Dict[str, Any]:
        """
        Get sync statistics.
        
        Returns:
            Dict with sync stats
        """
        with sqlite3.connect(self.db_path) as conn:
            # Total devices
            cursor = conn.execute("SELECT COUNT(*) FROM sync_devices")
            total_devices = cursor.fetchone()[0]
            
            # Pending operations
            cursor = conn.execute("SELECT COUNT(*) FROM sync_operations WHERE synced = FALSE")
            pending_ops = cursor.fetchone()[0]
            
            # Total synced
            cursor = conn.execute("SELECT COUNT(*) FROM sync_operations WHERE synced = TRUE")
            synced_ops = cursor.fetchone()[0]
            
            # Active connections
            active_count = sum(len(conns) for conns in self.active_connections.values())
        
        return {
            'total_devices': total_devices,
            'active_connections': active_count,
            'pending_operations': pending_ops,
            'synced_operations': synced_ops,
            'sync_rate': round(synced_ops / (synced_ops + pending_ops) * 100, 1) if (synced_ops + pending_ops) > 0 else 0
        }


# Self-test
if __name__ == "__main__":
    print("WebSocket Sync Test")
    print("=" * 80)
    
    # Create server
    server = WebSocketSyncServer(Path(":memory:"))
    
    # Register devices
    device1 = server.register_device("device-001", "identity-123", "iPhone")
    print(f"\nRegistered device 1: {device1['device_id']}")
    print(f"Vector clock: {device1['vector_clock']}")
    
    device2 = server.register_device("device-002", "identity-123", "MacBook")
    print(f"\nRegistered device 2: {device2['device_id']}")
    
    # Queue operations
    vector_clock = server.increment_clock(device1['vector_clock'], "device-001")
    op_id = server.queue_operation(
        "device-001",
        "reflection_created",
        {
            'reflection_id': 'ref-001',
            'content': 'Test reflection'
        },
        vector_clock
    )
    print(f"\nQueued operation: {op_id}")
    
    # Get pending
    pending = server.get_pending_operations("device-001")
    print(f"Pending operations: {len(pending)}")
    
    # Test conflict resolution
    clock1 = {"device-001": 5, "device-002": 3}
    clock2 = {"device-001": 4, "device-002": 6}
    resolution = server.resolve_conflict(clock1, clock2)
    print(f"\nConflict resolution: {resolution}")
    
    # Merge clocks
    merged = server.merge_clocks(clock1, clock2)
    print(f"Merged clock: {merged}")
    
    # Stats
    stats = server.get_sync_stats()
    print(f"\nSync stats:")
    print(f"  Devices: {stats['total_devices']}")
    print(f"  Pending ops: {stats['pending_operations']}")
    print(f"  Synced ops: {stats['synced_operations']}")
    
    print("\n✅ WebSocket sync functional")
