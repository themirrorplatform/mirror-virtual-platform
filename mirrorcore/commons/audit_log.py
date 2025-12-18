"""
Tamper-evident, append-only audit log for Commons Sync events.
Each entry is hash-chained to the previous, providing full traceability and integrity.
"""
import os
import json
import hashlib
import threading
import time
from typing import Optional

AUDIT_LOG_FILE = os.getenv("MIRROR_COMMONS_AUDIT_LOG", "commons_audit.log")

class AuditLogEntry:
    def __init__(self, event_id: str, event_hash: str, prev_hash: str, timestamp: float, data: dict):
        self.event_id = event_id
        self.event_hash = event_hash
        self.prev_hash = prev_hash
        self.timestamp = timestamp
        self.data = data

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_hash": self.event_hash,
            "prev_hash": self.prev_hash,
            "timestamp": self.timestamp,
            "data": self.data
        }

class AuditLog:
    def __init__(self, path: str = AUDIT_LOG_FILE):
        self.path = path
        self._lock = threading.Lock()
        self._last_hash = self._load_last_hash()

    def _load_last_hash(self) -> str:
        if not os.path.exists(self.path):
            return "0" * 64
        with open(self.path, "r") as f:
            last = None
            for line in f:
                last = line
            if last:
                entry = json.loads(last)
                return entry["event_hash"]
            return "0" * 64

    def append(self, event_id: str, data: dict):
        with self._lock:
            ts = time.time()
            entry_data = json.dumps(data, sort_keys=True, separators=(",", ":"))
            event_hash = hashlib.sha256((entry_data + self._last_hash).encode()).hexdigest()
            entry = AuditLogEntry(event_id, event_hash, self._last_hash, ts, data)
            with open(self.path, "a") as f:
                f.write(json.dumps(entry.to_dict()) + "\n")
            self._last_hash = event_hash

    def verify_chain(self) -> bool:
        prev_hash = "0" * 64
        with open(self.path, "r") as f:
            for line in f:
                entry = json.loads(line)
                entry_data = json.dumps(entry["data"], sort_keys=True, separators=(",", ":"))
                expected_hash = hashlib.sha256((entry_data + prev_hash).encode()).hexdigest()
                if entry["event_hash"] != expected_hash:
                    return False
                prev_hash = entry["event_hash"]
        return True
