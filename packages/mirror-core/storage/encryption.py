"""
Encryption Manager

Provides end-to-end encryption for user data at rest.
Uses industry-standard cryptography (Fernet symmetric encryption).
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional
import hashlib


class EncryptionManager:
    """
    Manages encryption for user data.
    
    Key principles:
    - User controls their encryption key
    - End-to-end encryption (server never sees plaintext)
    - Key derivation from user passphrase
    - No key escrow (user responsible for key)
    """
    
    def __init__(self, user_key: Optional[bytes] = None):
        """
        Initialize encryption manager.
        
        Args:
            user_key: User's encryption key (32 bytes). If None, generates new key.
        """
        if user_key is None:
            user_key = Fernet.generate_key()
        
        self.fernet = Fernet(user_key)
        self.key = user_key
    
    @staticmethod
    def derive_key_from_passphrase(passphrase: str, salt: Optional[bytes] = None) -> tuple[bytes, bytes]:
        """
        Derive encryption key from user passphrase.
        
        Uses PBKDF2 with 100,000 iterations for key stretching.
        
        Returns:
            (key, salt) tuple
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return key, salt
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext string"""
        return self.fernet.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt ciphertext string"""
        return self.fernet.decrypt(ciphertext.encode()).decode()
    
    def encrypt_bytes(self, data: bytes) -> bytes:
        """Encrypt raw bytes"""
        return self.fernet.encrypt(data)
    
    def decrypt_bytes(self, data: bytes) -> bytes:
        """Decrypt raw bytes"""
        return self.fernet.decrypt(data)
    
    def hash_data(self, data: str) -> str:
        """Create SHA-256 hash of data (for integrity checking)"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def verify_hash(self, data: str, expected_hash: str) -> bool:
        """Verify data matches expected hash"""
        actual_hash = self.hash_data(data)
        return actual_hash == expected_hash
    
    def get_key_fingerprint(self) -> str:
        """
        Get fingerprint of encryption key (for verification).
        
        This allows users to verify they're using the correct key
        without exposing the key itself.
        """
        return hashlib.sha256(self.key).hexdigest()[:16]
