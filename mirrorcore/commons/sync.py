"""
Commons Sync: Distributed Learning Backend (P2P/Server)
Architected for extensibility, cryptographic integrity, and seamless integration with Evolution Engine.
"""

from typing import Any, Dict, List, Optional, Protocol
import threading
import uuid
import time

class CommonsEvent:
    def __init__(self, event_type: str, payload: Dict[str, Any], origin: str, timestamp: Optional[float] = None, event_id: Optional[str] = None):
        self.event_type = event_type
        self.payload = payload
        self.origin = origin
        self.timestamp = timestamp or time.time()
        self.event_id = event_id or str(uuid.uuid4())

class CommonsSyncBackend(Protocol):
    def broadcast_event(self, event: CommonsEvent) -> None:
        ...
    def receive_event(self, event: CommonsEvent) -> None:
        ...
    def get_event_history(self) -> List[CommonsEvent]:
        ...

class InMemoryCommonsSync:
    """Reference implementation for local testing and property-based tests."""
    def __init__(self):
        self._events: List[CommonsEvent] = []
        self._lock = threading.Lock()

    def broadcast_event(self, event: CommonsEvent) -> None:
        with self._lock:
            self._events.append(event)

    def receive_event(self, event: CommonsEvent) -> None:
        with self._lock:
            if event.event_id not in {e.event_id for e in self._events}:
                self._events.append(event)

    def get_event_history(self) -> List[CommonsEvent]:
        with self._lock:
            return list(self._events)

# Placeholder for P2P and server-based implementations
# class P2PCommonsSync(CommonsSyncBackend): ...
# class ServerCommonsSync(CommonsSyncBackend): ...

# Integration point for Evolution Engine and distributed learning
