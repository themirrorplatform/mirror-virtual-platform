"""
Commons Sync: Distributed Learning Backend (P2P/Server)
Architected for extensibility, cryptographic integrity, and seamless integration with Evolution Engine.
"""


from typing import Any, Dict, List, Optional, Protocol
import threading
import uuid
import time
import json
from mirrorcore.commons.crypto import (
    generate_keypair, load_private_key, sign_message, verify_signature, public_key_bytes
)
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey



import secrets


COMMONS_EVENT_PROTOCOL_VERSION = 1


class CommonsEvent:
    def __init__(self, event_type: str, payload: Dict[str, Any], origin: str, timestamp: Optional[float] = None, event_id: Optional[str] = None,
                 signatures: Optional[list] = None, public_keys: Optional[list] = None, nonce: Optional[str] = None, expiry: Optional[float] = None,
                 version: int = COMMONS_EVENT_PROTOCOL_VERSION, m_required: int = 1):
        self.event_type = event_type
        self.payload = payload
        self.origin = origin
        self.timestamp = timestamp or time.time()
        self.event_id = event_id or str(uuid.uuid4())
        self.signatures = signatures or []
        self.public_keys = public_keys or []
        self.nonce = nonce or secrets.token_hex(16)
        self.expiry = expiry or (self.timestamp + 60 * 60)
        self.version = version
        self.m_required = m_required

    def serialize(self) -> bytes:
        return json.dumps({
            "event_type": self.event_type,
            "payload": self.payload,
            "origin": self.origin,
            "timestamp": self.timestamp,
            "event_id": self.event_id,
            "nonce": self.nonce,
            "expiry": self.expiry,
            "version": self.version,
            "m_required": self.m_required
        }, sort_keys=True, separators=(",", ":")).encode()

    def sign(self, private_key: Ed25519PrivateKey):
        sig = sign_message(private_key, self.serialize())
        pub = public_key_bytes(private_key.public_key())
        self.signatures.append(sig)
        self.public_keys.append(pub)

    def verify(self) -> bool:
        if len(self.signatures) < self.m_required or len(self.public_keys) < self.m_required:
            return False
        valid = 0
        for sig, pub in zip(self.signatures, self.public_keys):
            try:
                pk = Ed25519PublicKey.from_public_bytes(pub)
                if verify_signature(pk, self.serialize(), sig):
                    valid += 1
            except Exception:
                continue
        return valid >= self.m_required

    def is_expired(self) -> bool:
        return time.time() > self.expiry

class CommonsSyncBackend(Protocol):
    def broadcast_event(self, event: CommonsEvent) -> None:
        ...
    def receive_event(self, event: CommonsEvent) -> None:
        ...
    def get_event_history(self) -> List[CommonsEvent]:
        ...




from mirrorcore.commons.trust_db import TrustDB
from mirrorcore.commons.zkp_confidential import ZKProof, ConfidentialPayload
from mirrorcore.commons.anomaly_detection import AnomalyDetector
from mirrorcore.commons.quorum import QuorumManager

    """Reference implementation for local testing and property-based tests. Supports event signature, trust, replay, expiry, anomaly, quorum, and confidentiality/ZKP checks."""
    def __init__(self, verify_signatures: bool = True, replay_window: int = 10000, trust_db: TrustDB = None, anomaly_detector: AnomalyDetector = None, quorum_manager: QuorumManager = None):
        self._events: List[CommonsEvent] = []
        self._lock = threading.Lock()
        self.verify_signatures = verify_signatures
        self._seen_nonces = set()
        self._replay_window = replay_window
        self.trust_db = trust_db or TrustDB()
        self.anomaly_detector = anomaly_detector or AnomalyDetector()
        self.quorum_manager = quorum_manager

    def _all_signers_trusted(self, event: CommonsEvent) -> bool:
        # Assume public_keys are DIDs for trust lookup (or map pubkey to DID)
        for pub in event.public_keys:
            did = pub.hex()  # In real system, map pubkey to DID
            if not self.trust_db.is_trusted(did):
                return False
        return True

    def broadcast_event(self, event: CommonsEvent) -> None:
        with self._lock:
            if self.verify_signatures and not event.verify():
                raise ValueError("Event signature verification failed on broadcast.")
            if not self._all_signers_trusted(event):
                raise ValueError("Event signer(s) not trusted.")
            if event.nonce in self._seen_nonces:
                raise ValueError("Replay detected: nonce already seen.")
            if event.is_expired():
                raise ValueError("Event expired.")
            if event.confidential_payload is not None:
                # Only accept if authorized to decrypt (stub)
                pass
            if event.zkp is not None and not event.zkp.verify():
                raise ValueError("ZKP verification failed.")
            if self.quorum_manager and not self.quorum_manager.has_quorum():
                raise ValueError("Quorum not reached for critical action.")
            self.anomaly_detector.analyze_event(event)
            self._events.append(event)
            self._seen_nonces.add(event.nonce)
            if len(self._seen_nonces) > self._replay_window:
                self._seen_nonces = set(e.nonce for e in self._events[-self._replay_window:])

    def receive_event(self, event: CommonsEvent) -> None:
        with self._lock:
            if self.verify_signatures and not event.verify():
                raise ValueError("Event signature verification failed on receive.")
            if not self._all_signers_trusted(event):
                raise ValueError("Event signer(s) not trusted.")
            if event.nonce in self._seen_nonces:
                raise ValueError("Replay detected: nonce already seen.")
            if event.is_expired():
                raise ValueError("Event expired.")
            if event.confidential_payload is not None:
                # Only accept if authorized to decrypt (stub)
                pass
            if event.zkp is not None and not event.zkp.verify():
                raise ValueError("ZKP verification failed.")
            if self.quorum_manager and not self.quorum_manager.has_quorum():
                raise ValueError("Quorum not reached for critical action.")
            self.anomaly_detector.analyze_event(event)
            if event.event_id not in {e.event_id for e in self._events}:
                self._events.append(event)
                self._seen_nonces.add(event.nonce)
                if len(self._seen_nonces) > self._replay_window:
                    self._seen_nonces = set(e.nonce for e in self._events[-self._replay_window:])

    def get_event_history(self) -> List[CommonsEvent]:
        with self._lock:
            return list(self._events)

# Placeholder for P2P and server-based implementations
# class P2PCommonsSync(CommonsSyncBackend): ...
# class ServerCommonsSync(CommonsSyncBackend): ...


# --- Integration with Evolution Engine ---
from mirrorcore.evolution.engine import EvolutionEngine, EvolutionEvent

class CommonsSyncEvolutionObserver:
    """
    Observer that listens to CommonsEvents and triggers EvolutionEngine processing.
    """
    def __init__(self, evolution_engine: EvolutionEngine):
        self.evolution_engine = evolution_engine

    def observe_commons_event(self, event: CommonsEvent):
        # Map CommonsEvent to EvolutionEvent (simple passthrough for now)
        evo_event = EvolutionEvent(event.event_type, {
            "payload": event.payload,
            "origin": event.origin,
            "timestamp": event.timestamp,
            "event_id": event.event_id
        })
        return self.evolution_engine.process_event(evo_event)

# Example usage:
# evolution_engine = EvolutionEngine([...])
# commons_sync = InMemoryCommonsSync()
# observer = CommonsSyncEvolutionObserver(evolution_engine)
# for event in commons_sync.get_event_history():
#     observer.observe_commons_event(event)

# This enables distributed feedback loops and collective learning.
