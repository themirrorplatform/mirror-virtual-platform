"""
Automated key compromise recovery integration for Commons Sync.
Detects compromise, rotates keys, updates trust, and re-signs events.
"""
from mirrorcore.commons.key_recovery import KeyCompromiseRecovery
from mirrorcore.commons.trust_db import TrustDB
from mirrorcore.commons.sync import CommonsEvent

class CommonsSyncKeyRecoveryManager:
    def __init__(self, trust_db: TrustDB):
        self.trust_db = trust_db
        self.recovery = KeyCompromiseRecovery(trust_db)

    def handle_compromise(self, compromised_did: str, affected_events: list):
        # Rotate key, update trust, re-sign events
        self.recovery.recover(compromised_did, affected_events)
        # Optionally notify peers and update audit log
        print(f"[KEY RECOVERY] Compromise handled for {compromised_did}")
