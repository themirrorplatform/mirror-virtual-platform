"""
Encryption Manager

Provides end-to-end encryption for user data at rest and in transit.
Uses industry-standard cryptography (Fernet symmetric encryption with
PBKDF2 key derivation).

Key principles:
- User controls their encryption key
- No key escrow (Mirror never has access to plaintext)
- All cloud data encrypted before leaving device
- Key derived from passphrase with strong stretching
"""

import os
import base64
import hashlib
import json
from typing import Optional, Tuple, Any
from dataclasses import dataclass

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


@dataclass
class EncryptedPayload:
    """Encrypted data with metadata for decryption."""
    ciphertext: str
    salt: str  # For key derivation verification
    key_fingerprint: str  # For key verification
    version: str = "1.0"

    def to_dict(self) -> dict:
        return {
            "ciphertext": self.ciphertext,
            "salt": self.salt,
            "key_fingerprint": self.key_fingerprint,
            "version": self.version,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "EncryptedPayload":
        return cls(
            ciphertext=data["ciphertext"],
            salt=data["salt"],
            key_fingerprint=data["key_fingerprint"],
            version=data.get("version", "1.0"),
        )

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> "EncryptedPayload":
        return cls.from_dict(json.loads(json_str))


class EncryptionManager:
    """
    Manages encryption for user data.

    User controls their encryption key. Mirror never has access
    to plaintext data when encryption is enabled.

    Usage:
        # From passphrase (recommended for users)
        manager = EncryptionManager.from_passphrase("user's secret passphrase")

        # Encrypt data
        encrypted = manager.encrypt("sensitive data")
        payload = manager.encrypt_with_metadata("sensitive data")

        # Decrypt data
        plaintext = manager.decrypt(encrypted)
        plaintext = manager.decrypt_payload(payload)

        # For cloud sync - always use payloads
        cloud_data = manager.encrypt_for_cloud(local_data)
        local_data = manager.decrypt_from_cloud(cloud_data)
    """

    # Key derivation parameters (OWASP recommended)
    PBKDF2_ITERATIONS = 100_000
    SALT_LENGTH = 16
    KEY_LENGTH = 32

    def __init__(self, key: bytes, salt: Optional[bytes] = None):
        """
        Initialize with a Fernet-compatible key.

        For user-facing APIs, prefer from_passphrase() or generate_new().
        """
        self._key = key
        self._salt = salt or os.urandom(self.SALT_LENGTH)
        self._fernet = Fernet(key)
        self._fingerprint = self._compute_fingerprint(key)

    @classmethod
    def generate_new(cls) -> "EncryptionManager":
        """Generate a new random encryption key."""
        key = Fernet.generate_key()
        return cls(key)

    @classmethod
    def from_passphrase(
        cls,
        passphrase: str,
        salt: Optional[bytes] = None
    ) -> "EncryptionManager":
        """
        Derive encryption key from user passphrase.

        Uses PBKDF2 with 100,000 iterations for key stretching.
        Salt should be stored alongside encrypted data.
        """
        if salt is None:
            salt = os.urandom(cls.SALT_LENGTH)

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=cls.KEY_LENGTH,
            salt=salt,
            iterations=cls.PBKDF2_ITERATIONS,
            backend=default_backend()
        )

        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return cls(key, salt)

    @classmethod
    def from_key_bytes(cls, key_bytes: bytes) -> "EncryptionManager":
        """Initialize from raw key bytes (32 bytes)."""
        if len(key_bytes) != 32:
            raise ValueError("Key must be 32 bytes")
        key = base64.urlsafe_b64encode(key_bytes)
        return cls(key)

    @staticmethod
    def _compute_fingerprint(key: bytes) -> str:
        """Compute key fingerprint for verification."""
        return hashlib.sha256(key).hexdigest()[:16]

    @property
    def key(self) -> bytes:
        """Get the encryption key (for storage/backup)."""
        return self._key

    @property
    def salt(self) -> bytes:
        """Get the salt used for key derivation."""
        return self._salt

    @property
    def fingerprint(self) -> str:
        """
        Get key fingerprint for verification.

        Users can compare fingerprints to verify they're using
        the correct key without exposing the key itself.
        """
        return self._fingerprint

    # Basic encryption/decryption

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string. Returns base64-encoded ciphertext."""
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a string. Raises EncryptionError on failure."""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken as e:
            from .base import EncryptionError
            raise EncryptionError(f"Decryption failed: {e}")

    def encrypt_bytes(self, data: bytes) -> bytes:
        """Encrypt raw bytes."""
        return self._fernet.encrypt(data)

    def decrypt_bytes(self, data: bytes) -> bytes:
        """Decrypt raw bytes."""
        try:
            return self._fernet.decrypt(data)
        except InvalidToken as e:
            from .base import EncryptionError
            raise EncryptionError(f"Decryption failed: {e}")

    # Payload-based encryption (for cloud sync)

    def encrypt_with_metadata(self, plaintext: str) -> EncryptedPayload:
        """
        Encrypt with metadata for verification.

        Use this for cloud sync to enable key verification
        before attempting decryption.
        """
        ciphertext = self.encrypt(plaintext)
        return EncryptedPayload(
            ciphertext=ciphertext,
            salt=base64.b64encode(self._salt).decode(),
            key_fingerprint=self._fingerprint,
        )

    def decrypt_payload(self, payload: EncryptedPayload) -> str:
        """
        Decrypt a payload, verifying key fingerprint first.

        Raises EncryptionError if key doesn't match.
        """
        if payload.key_fingerprint != self._fingerprint:
            from .base import EncryptionError
            raise EncryptionError(
                f"Key mismatch: expected {payload.key_fingerprint}, "
                f"got {self._fingerprint}"
            )
        return self.decrypt(payload.ciphertext)

    def encrypt_for_cloud(self, data: Any) -> str:
        """
        Encrypt data for cloud storage.

        Serializes to JSON, encrypts, and returns a payload JSON string.
        """
        json_str = json.dumps(data)
        payload = self.encrypt_with_metadata(json_str)
        return payload.to_json()

    def decrypt_from_cloud(self, encrypted_json: str) -> Any:
        """
        Decrypt data from cloud storage.

        Parses payload, decrypts, and deserializes from JSON.
        """
        payload = EncryptedPayload.from_json(encrypted_json)
        json_str = self.decrypt_payload(payload)
        return json.loads(json_str)

    # Hashing (for integrity checking)

    def hash_data(self, data: str) -> str:
        """Create SHA-256 hash of data."""
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_hash(self, data: str, expected_hash: str) -> bool:
        """Verify data matches expected hash."""
        return self.hash_data(data) == expected_hash

    # Key export/import (for user backup)

    def export_key(self) -> dict:
        """
        Export key for user backup.

        User should store this securely (password manager, etc.)
        """
        return {
            "key": base64.b64encode(self._key).decode(),
            "salt": base64.b64encode(self._salt).decode(),
            "fingerprint": self._fingerprint,
            "version": "1.0",
        }

    @classmethod
    def import_key(cls, exported: dict) -> "EncryptionManager":
        """Import a previously exported key."""
        key = base64.b64decode(exported["key"])
        salt = base64.b64decode(exported["salt"])
        return cls(key, salt)

    def rotate_key(self, new_passphrase: str) -> Tuple["EncryptionManager", bytes]:
        """
        Create a new encryption manager with a rotated key.

        Returns (new_manager, migration_key) where migration_key
        can be used to re-encrypt existing data.

        Note: Caller is responsible for re-encrypting all data.
        """
        new_manager = EncryptionManager.from_passphrase(new_passphrase)
        # Return old key for migration
        return new_manager, self._key
