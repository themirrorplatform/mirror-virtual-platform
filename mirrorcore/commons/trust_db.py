"""
Distributed Trust/PKI for Commons Sync: Web-of-Trust and DID-based public key management.
Supports key registration, revocation, and trust anchoring.
"""
import json
import os
import time
from typing import Dict, Optional, Set

TRUST_DB_FILE = os.getenv("MIRROR_COMMONS_TRUST_DB", "commons_trust.json")

class TrustAnchor:
    def __init__(self, did: str, public_key: bytes, trusted_by: Optional[Set[str]] = None, revoked: bool = False):
        self.did = did
        self.public_key = public_key
        self.trusted_by = trusted_by or set()
        self.revoked = revoked

    def to_dict(self):
        return {
            "did": self.did,
            "public_key": self.public_key.hex(),
            "trusted_by": list(self.trusted_by),
            "revoked": self.revoked
        }

class TrustDB:
    def __init__(self, path: str = TRUST_DB_FILE):
        self.path = path
        self._load()

    def _load(self):
        if not os.path.exists(self.path):
            self.anchors: Dict[str, TrustAnchor] = {}
            return
        with open(self.path, "r") as f:
            data = json.load(f)
            self.anchors = {d["did"]: TrustAnchor(
                d["did"], bytes.fromhex(d["public_key"]), set(d["trusted_by"]), d["revoked"]
            ) for d in data}

    def save(self):
        with open(self.path, "w") as f:
            json.dump([a.to_dict() for a in self.anchors.values()], f, indent=2)

    def register(self, did: str, public_key: bytes, trusted_by: Optional[Set[str]] = None):
        self.anchors[did] = TrustAnchor(did, public_key, trusted_by)
        self.save()

    def revoke(self, did: str):
        if did in self.anchors:
            self.anchors[did].revoked = True
            self.save()

    def is_trusted(self, did: str, min_trust: int = 1) -> bool:
        anchor = self.anchors.get(did)
        if not anchor or anchor.revoked:
            return False
        return len(anchor.trusted_by) >= min_trust

    def trust(self, did: str, by_did: str):
        if did in self.anchors:
            self.anchors[did].trusted_by.add(by_did)
            self.save()
