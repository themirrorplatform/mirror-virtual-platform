"""
Commons Disconnect Proof - Cryptographic Proof of Disconnection

Provides verifiable proof that user has disconnected from Commons:
- Cryptographic token generation
- Timestamped disconnect events
- Re-verification capability
- Non-repudiation

Sovereignty principle: Users can prove they've exited at any time.
"""

import json
import hashlib
import hmac
import os
from typing import Dict, Optional, List
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend


class DisconnectProofSystem:
    """
    Generates cryptographic proof of Commons disconnection.
    
    Features:
    - RSA signature on disconnect event
    - Timestamped and non-repudiable
    - Includes final sync state hash
    - Verifiable by third parties
    - Re-verification supported
    """
    
    def __init__(self, storage):
        self.storage = storage
        self.backend = default_backend()
        self._ensure_disconnect_tables()
    
    def _ensure_disconnect_tables(self):
        """Create disconnect proof tracking tables"""
        
        # Disconnect events
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS commons_disconnects (
                id TEXT PRIMARY KEY,
                identity_id TEXT NOT NULL,
                disconnected_at TEXT NOT NULL,
                reason TEXT,
                final_sync_state_hash TEXT NOT NULL,
                proof_signature TEXT NOT NULL,
                public_key TEXT NOT NULL,
                verified INTEGER DEFAULT 0,
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Verification log
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS disconnect_verifications (
                id TEXT PRIMARY KEY,
                disconnect_id TEXT NOT NULL,
                verified_at TEXT NOT NULL,
                verifier TEXT,  -- Who verified
                verification_result INTEGER,  -- 1 = valid, 0 = invalid
                metadata TEXT,  -- JSON
                FOREIGN KEY (disconnect_id) REFERENCES commons_disconnects(id) ON DELETE CASCADE
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_disconnects_identity 
            ON commons_disconnects(identity_id)
        """)
        
        self.storage.conn.commit()
    
    def generate_disconnect_proof(
        self,
        identity_id: str,
        reason: Optional[str] = None
    ) -> Dict:
        """
        Generate cryptographic proof of disconnection.
        
        Args:
            identity_id: User disconnecting
            reason: Optional reason for disconnect
        
        Returns:
            Disconnect proof with signature
        """
        
        # Check if already disconnected
        cursor = self.storage.conn.execute("""
            SELECT id FROM commons_disconnects 
            WHERE identity_id = ? 
            ORDER BY disconnected_at DESC LIMIT 1
        """, (identity_id,))
        
        existing = cursor.fetchone()
        if existing:
            # Already disconnected, return existing proof
            return self.get_disconnect_proof(existing['id'])
        
        # Generate RSA key pair for signing
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=self.backend
        )
        
        public_key = private_key.public_key()
        
        # Get final sync state
        final_state = self._get_final_sync_state(identity_id)
        
        # Hash final state
        state_hash = self._hash_state(final_state)
        
        # Create disconnect document
        disconnect_time = datetime.utcnow()
        disconnect_doc = {
            'identity_id': identity_id,
            'disconnected_at': disconnect_time.isoformat() + 'Z',
            'reason': reason,
            'final_sync_state_hash': state_hash,
            'timestamp': disconnect_time.timestamp()
        }
        
        # Sign document
        doc_bytes = json.dumps(disconnect_doc, sort_keys=True).encode('utf-8')
        signature = private_key.sign(
            doc_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        # Serialize public key for storage
        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        # Store disconnect proof
        disconnect_id = f"disconnect_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO commons_disconnects (
                id, identity_id, disconnected_at, reason,
                final_sync_state_hash, proof_signature, public_key,
                verified, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            disconnect_id,
            identity_id,
            disconnect_doc['disconnected_at'],
            reason,
            state_hash,
            signature.hex(),
            public_key_pem,
            0,  # Not yet verified
            json.dumps(final_state)
        ))
        
        # Actually disconnect from Commons
        self.storage.conn.execute("""
            UPDATE settings 
            SET value = 'disconnected'
            WHERE key = 'commons_status'
        """)
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'disconnect_id': disconnect_id,
            'identity_id': identity_id,
            'disconnected_at': disconnect_doc['disconnected_at'],
            'proof_signature': signature.hex(),
            'public_key': public_key_pem,
            'final_state_hash': state_hash,
            'message': 'Disconnect proof generated successfully'
        }
    
    def verify_disconnect_proof(
        self,
        disconnect_id: str,
        verifier: Optional[str] = None
    ) -> Dict:
        """
        Verify a disconnect proof signature.
        
        Args:
            disconnect_id: ID of disconnect to verify
            verifier: Optional identifier of who is verifying
        
        Returns:
            Verification result
        """
        
        # Get disconnect proof
        cursor = self.storage.conn.execute("""
            SELECT * FROM commons_disconnects WHERE id = ?
        """, (disconnect_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'valid': False,
                'error': 'Disconnect proof not found'
            }
        
        # Reconstruct document
        disconnect_doc = {
            'identity_id': row['identity_id'],
            'disconnected_at': row['disconnected_at'],
            'reason': row['reason'],
            'final_sync_state_hash': row['final_sync_state_hash'],
            'timestamp': datetime.fromisoformat(
                row['disconnected_at'].replace('Z', '')
            ).timestamp()
        }
        
        doc_bytes = json.dumps(disconnect_doc, sort_keys=True).encode('utf-8')
        signature = bytes.fromhex(row['proof_signature'])
        
        # Load public key
        public_key = serialization.load_pem_public_key(
            row['public_key'].encode('utf-8'),
            backend=self.backend
        )
        
        # Verify signature
        try:
            public_key.verify(
                signature,
                doc_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            valid = True
        except Exception as e:
            valid = False
        
        # Log verification
        verification_id = f"verify_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO disconnect_verifications (
                id, disconnect_id, verified_at, verifier,
                verification_result, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            verification_id,
            disconnect_id,
            datetime.utcnow().isoformat() + 'Z',
            verifier,
            1 if valid else 0,
            json.dumps({})
        ))
        
        # Update verified flag if valid
        if valid:
            self.storage.conn.execute("""
                UPDATE commons_disconnects 
                SET verified = 1 
                WHERE id = ?
            """, (disconnect_id,))
        
        self.storage.conn.commit()
        
        return {
            'valid': valid,
            'disconnect_id': disconnect_id,
            'identity_id': row['identity_id'],
            'disconnected_at': row['disconnected_at'],
            'verification_id': verification_id,
            'message': 'Signature valid' if valid else 'Signature invalid'
        }
    
    def get_disconnect_proof(self, disconnect_id: str) -> Dict:
        """Get disconnect proof details"""
        
        cursor = self.storage.conn.execute("""
            SELECT * FROM commons_disconnects WHERE id = ?
        """, (disconnect_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'found': False,
                'error': 'Disconnect proof not found'
            }
        
        return {
            'found': True,
            'disconnect_id': row['id'],
            'identity_id': row['identity_id'],
            'disconnected_at': row['disconnected_at'],
            'reason': row['reason'],
            'final_state_hash': row['final_sync_state_hash'],
            'proof_signature': row['proof_signature'],
            'public_key': row['public_key'],
            'verified': bool(row['verified']),
            'metadata': json.loads(row['metadata']) if row['metadata'] else {}
        }
    
    def get_user_disconnect_history(self, identity_id: str) -> List[Dict]:
        """Get all disconnect events for a user"""
        
        cursor = self.storage.conn.execute("""
            SELECT id, disconnected_at, reason, verified
            FROM commons_disconnects
            WHERE identity_id = ?
            ORDER BY disconnected_at DESC
        """, (identity_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'disconnect_id': row['id'],
                'disconnected_at': row['disconnected_at'],
                'reason': row['reason'],
                'verified': bool(row['verified'])
            })
        
        return history
    
    def get_verification_history(self, disconnect_id: str) -> List[Dict]:
        """Get all verifications for a disconnect proof"""
        
        cursor = self.storage.conn.execute("""
            SELECT * FROM disconnect_verifications
            WHERE disconnect_id = ?
            ORDER BY verified_at DESC
        """, (disconnect_id,))
        
        verifications = []
        for row in cursor.fetchall():
            verifications.append({
                'verification_id': row['id'],
                'verified_at': row['verified_at'],
                'verifier': row['verifier'],
                'result': 'valid' if row['verification_result'] else 'invalid'
            })
        
        return verifications
    
    def _get_final_sync_state(self, identity_id: str) -> Dict:
        """Get final state before disconnect"""
        
        # Get counts
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count FROM reflections
            WHERE identity_id = ?
        """, (identity_id,))
        reflection_count = cursor.fetchone()['count']
        
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count FROM evolution_votes
            WHERE identity_id = ?
        """, (identity_id,))
        vote_count = cursor.fetchone()['count']
        
        # Get last sync time
        cursor = self.storage.conn.execute("""
            SELECT value FROM settings WHERE key = 'last_commons_sync'
        """)
        row = cursor.fetchone()
        last_sync = row['value'] if row else 'never'
        
        return {
            'reflection_count': reflection_count,
            'vote_count': vote_count,
            'last_sync': last_sync,
            'disconnect_requested_at': datetime.utcnow().isoformat() + 'Z'
        }
    
    def _hash_state(self, state: Dict) -> str:
        """Hash state for tamper detection"""
        
        state_json = json.dumps(state, sort_keys=True)
        return hashlib.sha256(state_json.encode('utf-8')).hexdigest()
    
    def export_disconnect_proof(
        self,
        disconnect_id: str,
        output_path: str
    ):
        """
        Export disconnect proof to shareable file.
        
        Args:
            disconnect_id: Disconnect to export
            output_path: File path for export
        """
        
        proof = self.get_disconnect_proof(disconnect_id)
        
        if not proof['found']:
            raise ValueError("Disconnect proof not found")
        
        export_data = {
            'proof_version': '1.0',
            'disconnect_id': proof['disconnect_id'],
            'identity_id': proof['identity_id'],
            'disconnected_at': proof['disconnected_at'],
            'reason': proof['reason'],
            'final_state_hash': proof['final_state_hash'],
            'signature': proof['proof_signature'],
            'public_key': proof['public_key'],
            'verified': proof['verified'],
            'exported_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
    
    def is_user_disconnected(self, identity_id: str) -> bool:
        """Check if user has an active disconnect proof"""
        
        cursor = self.storage.conn.execute("""
            SELECT id FROM commons_disconnects
            WHERE identity_id = ?
            ORDER BY disconnected_at DESC
            LIMIT 1
        """, (identity_id,))
        
        return cursor.fetchone() is not None
