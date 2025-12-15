"""
Guardian Recognition & Revocation Protocol (RRP) Service
Handles certification, heartbeat, and revocation with Ed25519 signing

Core responsibilities:
1. Certify instances (issue recognition certificates)
2. Heartbeat tracking (detect offline instances)
3. Revocation (revoke certificates with cause)
4. ROK validation (rotating operational keys)
"""
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum
import secrets
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))
from canonical_signing import Ed25519Signer, Ed25519Verifier, canonical_json_str


class CertificateStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class RevocationCause(str, Enum):
    CONSTITUTIONAL_VIOLATION = "constitutional_violation"
    PAYMENT_FAILURE = "payment_failure"
    USER_REQUEST = "user_request"
    SECURITY_BREACH = "security_breach"
    GUARDIAN_DISCRETION = "guardian_discretion"


class RecognitionCertificate:
    """Recognition certificate issued by Guardian"""
    def __init__(
        self,
        cert_id: str,
        instance_id: str,
        user_id: str,
        tier: str,  # "free", "personal", "sovereign", "byok"
        issued_at: datetime,
        expires_at: datetime,
        guardian_public_key: str,
        signature: Optional[str] = None,
        status: CertificateStatus = CertificateStatus.ACTIVE
    ):
        self.cert_id = cert_id
        self.instance_id = instance_id
        self.user_id = user_id
        self.tier = tier
        self.issued_at = issued_at
        self.expires_at = expires_at
        self.guardian_public_key = guardian_public_key
        self.signature = signature
        self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "cert_id": self.cert_id,
            "instance_id": self.instance_id,
            "user_id": self.user_id,
            "tier": self.tier,
            "issued_at": self.issued_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "guardian_public_key": self.guardian_public_key,
            "status": self.status.value
        }
    
    def canonical_payload(self) -> str:
        """Canonical representation for signing"""
        return canonical_json_str({
            "cert_id": self.cert_id,
            "instance_id": self.instance_id,
            "user_id": self.user_id,
            "tier": self.tier,
            "issued_at": self.issued_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "guardian_public_key": self.guardian_public_key
        })


class GuardianService:
    """Core Guardian RRP service"""
    
    def __init__(self, db_path: str, guardian_signer: Ed25519Signer):
        self.db_path = db_path
        self.guardian_signer = guardian_signer
        self.guardian_public_key = guardian_signer.public_hex()
        self._init_database()
    
    def _init_database(self):
        """Initialize Guardian database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Certificates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certificates (
                cert_id TEXT PRIMARY KEY,
                instance_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                tier TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                guardian_public_key TEXT NOT NULL,
                signature TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(instance_id, user_id)
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certs_instance ON certificates(instance_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certs_user ON certificates(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certs_status ON certificates(status)")
        
        # Heartbeats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS heartbeats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                instance_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_heartbeats_instance ON heartbeats(instance_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_heartbeats_timestamp ON heartbeats(timestamp)")
        
        # Revocations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS revocations (
                revocation_id TEXT PRIMARY KEY,
                cert_id TEXT NOT NULL,
                instance_id TEXT NOT NULL,
                cause TEXT NOT NULL,
                reason TEXT,
                revoked_at TEXT NOT NULL,
                revoked_by TEXT NOT NULL,
                signature TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cert_id) REFERENCES certificates(cert_id)
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_revocations_cert ON revocations(cert_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_revocations_instance ON revocations(instance_id)")
        
        # ROK (Rotating Operational Keys) table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS operational_keys (
                key_id TEXT PRIMARY KEY,
                public_key TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def certify_instance(
        self,
        instance_id: str,
        user_id: str,
        tier: str,
        duration_days: int = 30
    ) -> RecognitionCertificate:
        """
        Issue recognition certificate to instance
        
        Args:
            instance_id: Unique instance identifier
            user_id: User identifier
            tier: Subscription tier (free/personal/sovereign/byok)
            duration_days: Certificate validity duration
        
        Returns:
            Signed RecognitionCertificate
        """
        # Generate certificate
        cert_id = f"cert_{secrets.token_urlsafe(16)}"
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(days=duration_days)
        
        cert = RecognitionCertificate(
            cert_id=cert_id,
            instance_id=instance_id,
            user_id=user_id,
            tier=tier,
            issued_at=issued_at,
            expires_at=expires_at,
            guardian_public_key=self.guardian_public_key
        )
        
        # Sign certificate
        cert.signature = self.guardian_signer.sign_base64(
            cert.canonical_payload().encode('utf-8')
        )
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Replace existing certificate for this instance/user
        cursor.execute("""
            INSERT OR REPLACE INTO certificates
            (cert_id, instance_id, user_id, tier, issued_at, expires_at, 
             guardian_public_key, signature, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cert.cert_id,
            cert.instance_id,
            cert.user_id,
            cert.tier,
            cert.issued_at.isoformat(),
            cert.expires_at.isoformat(),
            cert.guardian_public_key,
            cert.signature,
            cert.status.value
        ))
        
        conn.commit()
        conn.close()
        
        return cert
    
    def verify_certificate(self, cert_id: str) -> Optional[RecognitionCertificate]:
        """
        Verify certificate validity
        
        Returns certificate if valid (active + not expired), None otherwise
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT cert_id, instance_id, user_id, tier, issued_at, expires_at,
                   guardian_public_key, signature, status
            FROM certificates
            WHERE cert_id = ?
        """, (cert_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        cert = RecognitionCertificate(
            cert_id=row[0],
            instance_id=row[1],
            user_id=row[2],
            tier=row[3],
            issued_at=datetime.fromisoformat(row[4]),
            expires_at=datetime.fromisoformat(row[5]),
            guardian_public_key=row[6],
            signature=row[7],
            status=CertificateStatus(row[8])
        )
        
        # Check status
        if cert.status != CertificateStatus.ACTIVE:
            return None
        
        # Check expiration
        if datetime.utcnow() > cert.expires_at:
            cert.status = CertificateStatus.EXPIRED
            return None
        
        # Verify signature
        verifier = Ed25519Verifier.from_public_hex(cert.guardian_public_key)
        if not verifier.verify_base64(
            cert.canonical_payload().encode('utf-8'),
            cert.signature
        ):
            return None
        
        return cert
    
    def record_heartbeat(
        self,
        instance_id: str,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Record heartbeat from instance"""
        import json
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO heartbeats (instance_id, user_id, timestamp, metadata)
            VALUES (?, ?, ?, ?)
        """, (
            instance_id,
            user_id,
            datetime.utcnow().isoformat(),
            json.dumps(metadata) if metadata else None
        ))
        
        conn.commit()
        conn.close()
    
    def get_last_heartbeat(self, instance_id: str) -> Optional[datetime]:
        """Get timestamp of last heartbeat for instance"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp
            FROM heartbeats
            WHERE instance_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (instance_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return datetime.fromisoformat(row[0])
        return None
    
    def revoke_certificate(
        self,
        cert_id: str,
        cause: RevocationCause,
        reason: Optional[str] = None,
        revoked_by: str = "guardian"
    ) -> str:
        """
        Revoke a certificate
        
        Returns revocation_id
        """
        revocation_id = f"revoke_{secrets.token_urlsafe(16)}"
        revoked_at = datetime.utcnow()
        
        # Get certificate
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT instance_id FROM certificates WHERE cert_id = ?", (cert_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Certificate {cert_id} not found")
        
        instance_id = row[0]
        
        # Create revocation record
        revocation_payload = canonical_json_str({
            "revocation_id": revocation_id,
            "cert_id": cert_id,
            "instance_id": instance_id,
            "cause": cause.value,
            "reason": reason,
            "revoked_at": revoked_at.isoformat(),
            "revoked_by": revoked_by
        })
        
        signature = self.guardian_signer.sign_base64(revocation_payload.encode('utf-8'))
        
        # Store revocation
        cursor.execute("""
            INSERT INTO revocations
            (revocation_id, cert_id, instance_id, cause, reason, revoked_at, revoked_by, signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            revocation_id,
            cert_id,
            instance_id,
            cause.value,
            reason,
            revoked_at.isoformat(),
            revoked_by,
            signature
        ))
        
        # Update certificate status
        cursor.execute("""
            UPDATE certificates
            SET status = ?
            WHERE cert_id = ?
        """, (CertificateStatus.REVOKED.value, cert_id))
        
        conn.commit()
        conn.close()
        
        return revocation_id
    
    def get_certificate_by_instance(self, instance_id: str) -> Optional[RecognitionCertificate]:
        """Get active certificate for instance"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT cert_id, instance_id, user_id, tier, issued_at, expires_at,
                   guardian_public_key, signature, status
            FROM certificates
            WHERE instance_id = ? AND status = ?
            ORDER BY issued_at DESC
            LIMIT 1
        """, (instance_id, CertificateStatus.ACTIVE.value))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return RecognitionCertificate(
            cert_id=row[0],
            instance_id=row[1],
            user_id=row[2],
            tier=row[3],
            issued_at=datetime.fromisoformat(row[4]),
            expires_at=datetime.fromisoformat(row[5]),
            guardian_public_key=row[6],
            signature=row[7],
            status=CertificateStatus(row[8])
        )
    
    def list_certificates(
        self,
        status: Optional[CertificateStatus] = None,
        limit: int = 100
    ) -> List[RecognitionCertificate]:
        """List certificates with optional status filter"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT cert_id, instance_id, user_id, tier, issued_at, expires_at,
                       guardian_public_key, signature, status
                FROM certificates
                WHERE status = ?
                ORDER BY issued_at DESC
                LIMIT ?
            """, (status.value, limit))
        else:
            cursor.execute("""
                SELECT cert_id, instance_id, user_id, tier, issued_at, expires_at,
                       guardian_public_key, signature, status
                FROM certificates
                ORDER BY issued_at DESC
                LIMIT ?
            """, (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        certificates = []
        for row in rows:
            cert = RecognitionCertificate(
                cert_id=row[0],
                instance_id=row[1],
                user_id=row[2],
                tier=row[3],
                issued_at=datetime.fromisoformat(row[4]),
                expires_at=datetime.fromisoformat(row[5]),
                guardian_public_key=row[6],
                signature=row[7],
                status=CertificateStatus(row[8])
            )
            certificates.append(cert)
        
        return certificates
    
    def issue_operational_key(self, duration_days: int = 7) -> Dict[str, str]:
        """
        Issue rotating operational key (ROK)
        Used for day-to-day operations, rotated frequently
        """
        # Generate new keypair
        key_signer = Ed25519Signer.generate()
        key_id = f"rok_{secrets.token_urlsafe(12)}"
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(days=duration_days)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO operational_keys
            (key_id, public_key, issued_at, expires_at, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            key_id,
            key_signer.public_hex(),
            issued_at.isoformat(),
            expires_at.isoformat(),
            'active'
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "key_id": key_id,
            "public_key": key_signer.public_hex(),
            "private_key": key_signer.private_hex(),  # Return once, store securely
            "issued_at": issued_at.isoformat(),
            "expires_at": expires_at.isoformat()
        }
    
    def validate_operational_key(self, key_id: str, public_key: str) -> bool:
        """Validate that operational key is active and not expired"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT public_key, expires_at, status
            FROM operational_keys
            WHERE key_id = ?
        """, (key_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return False
        
        stored_public_key, expires_at_str, status = row
        
        if status != 'active':
            return False
        
        if public_key != stored_public_key:
            return False
        
        expires_at = datetime.fromisoformat(expires_at_str)
        if datetime.utcnow() > expires_at:
            return False
        
        return True


# Example usage
if __name__ == "__main__":
    # Generate Guardian keypair
    guardian_signer = Ed25519Signer.generate()
    print(f"Guardian public key: {guardian_signer.public_hex()}")
    
    # Create Guardian service
    service = GuardianService("guardian.db", guardian_signer)
    
    # Certify an instance
    cert = service.certify_instance(
        instance_id="instance-123",
        user_id="user-456",
        tier="personal",
        duration_days=30
    )
    
    print(f"Issued certificate: {cert.cert_id}")
    print(f"Expires: {cert.expires_at}")
    
    # Verify certificate
    verified = service.verify_certificate(cert.cert_id)
    print(f"Certificate valid: {verified is not None}")
    
    # Record heartbeat
    service.record_heartbeat("instance-123", "user-456")
    last_heartbeat = service.get_last_heartbeat("instance-123")
    print(f"Last heartbeat: {last_heartbeat}")
    
    # Issue operational key
    rok = service.issue_operational_key(duration_days=7)
    print(f"Issued ROK: {rok['key_id']}")
    
    # Revoke certificate
    revocation_id = service.revoke_certificate(
        cert_id=cert.cert_id,
        cause=RevocationCause.USER_REQUEST,
        reason="User requested account deletion"
    )
    print(f"Revoked with ID: {revocation_id}")
