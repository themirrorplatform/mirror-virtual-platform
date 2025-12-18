"""
Automated key compromise recovery protocol for Commons Sync.
Rapid rekeying, event re-signing, and trust update after compromise.
"""
from typing import List
from mirrorcore.commons.key_manager import rotate_private_key, get_current_public_key
from mirrorcore.commons.trust_db import TrustDB

class KeyCompromiseRecovery:
    def __init__(self, trust_db: TrustDB):
        self.trust_db = trust_db

    def recover(self, compromised_did: str, affected_events: List):
        # Rotate key
        new_priv, new_pub = rotate_private_key()
        # Update trust DB
        self.trust_db.register(compromised_did, new_pub.public_bytes(), trusted_by=set())
        # Re-sign affected events (if possible)
        for event in affected_events:
            event.sign(new_priv)
        # Optionally broadcast new public key to peers
        print(f"[RECOVERY] Rekeyed and re-signed events for {compromised_did}")
