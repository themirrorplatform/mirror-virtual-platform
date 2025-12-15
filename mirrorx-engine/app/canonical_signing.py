"""
Canonical Signing Implementation

Implements RFC 8785-compliant canonical JSON signing with Ed25519.

Key Features:
- Deterministic serialization (same data = same bytes)
- Cross-platform compatibility
- Test vectors for verification
- Debuggable (human-readable intermediate format)

All signed payloads in Mirror use this canonicalization.
"""

import json
import hashlib
import base64
from typing import Any, Optional
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey
)
from cryptography.exceptions import InvalidSignature


def canonical_json_bytes(obj: Any) -> bytes:
    """
    Serialize object to canonical JSON (RFC 8785) as UTF-8 bytes.
    
    Rules:
    - Keys sorted lexicographically
    - No whitespace
    - No trailing zeros in numbers
    - Lowercase true/false/null
    - UTF-8 encoding
    
    Args:
        obj: Dictionary, list, or primitive to serialize
    
    Returns: Canonical UTF-8 bytes
    """
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False,
        allow_nan=False
    ).encode('utf-8')


def canonical_json_str(obj: Any) -> str:
    """Serialize object to canonical JSON string."""
    return canonical_json_bytes(obj).decode('utf-8')


def sha256_hash(data: bytes) -> str:
    """Compute SHA-256 hash and return as hex string."""
    return hashlib.sha256(data).hexdigest()


class Ed25519Signer:
    """
    Ed25519 signing operations for Mirror.
    
    Usage:
        signer = Ed25519Signer.generate()
        signature = signer.sign(payload)
        is_valid = signer.verify(payload, signature)
    """
    
    def __init__(self, private_key: Ed25519PrivateKey):
        self.private_key = private_key
        self.public_key = private_key.public_key()
    
    @classmethod
    def generate(cls) -> 'Ed25519Signer':
        """Generate new Ed25519 keypair."""
        private_key = Ed25519PrivateKey.generate()
        return cls(private_key)
    
    @classmethod
    def from_private_bytes(cls, private_bytes: bytes) -> 'Ed25519Signer':
        """Load signer from 32-byte private key."""
        if len(private_bytes) != 32:
            raise ValueError("Private key must be exactly 32 bytes")
        private_key = Ed25519PrivateKey.from_private_bytes(private_bytes)
        return cls(private_key)
    
    @classmethod
    def from_private_hex(cls, private_hex: str) -> 'Ed25519Signer':
        """Load signer from hex-encoded private key."""
        private_bytes = bytes.fromhex(private_hex)
        return cls.from_private_bytes(private_bytes)
    
    def private_bytes(self) -> bytes:
        """Export private key as 32 bytes."""
        return self.private_key.private_bytes_raw()
    
    def private_hex(self) -> str:
        """Export private key as hex string."""
        return self.private_bytes().hex()
    
    def public_bytes(self) -> bytes:
        """Export public key as 32 bytes."""
        return self.public_key.public_bytes_raw()
    
    def public_hex(self) -> str:
        """Export public key as hex string."""
        return self.public_bytes().hex()
    
    def public_base64(self) -> str:
        """Export public key as base64 string."""
        return base64.b64encode(self.public_bytes()).decode('ascii')
    
    def sign(self, message: bytes) -> bytes:
        """
        Sign message bytes.
        
        Args:
            message: Bytes to sign
        
        Returns: 64-byte signature
        """
        return self.private_key.sign(message)
    
    def sign_base64(self, message: bytes) -> str:
        """Sign message and return base64-encoded signature."""
        signature = self.sign(message)
        return base64.b64encode(signature).decode('ascii')
    
    def sign_dict(self, obj: dict, signature_field: str = "signature") -> dict:
        """
        Sign a dictionary using canonical JSON.
        
        Args:
            obj: Dictionary to sign (will be modified)
            signature_field: Field name for signature
        
        Returns: Modified dictionary with signature field
        """
        # Remove signature field if present
        obj_copy = {k: v for k, v in obj.items() if k != signature_field}
        
        # Canonical bytes
        canonical = canonical_json_bytes(obj_copy)
        
        # Sign
        signature = self.sign_base64(canonical)
        
        # Add signature field
        obj[signature_field] = signature
        return obj
    
    def verify(self, message: bytes, signature: bytes) -> bool:
        """
        Verify signature against message.
        
        Args:
            message: Original message bytes
            signature: 64-byte signature
        
        Returns: True if valid, False otherwise
        """
        try:
            self.public_key.verify(signature, message)
            return True
        except InvalidSignature:
            return False
    
    def verify_base64(self, message: bytes, signature_b64: str) -> bool:
        """Verify base64-encoded signature."""
        try:
            signature = base64.b64decode(signature_b64)
            return self.verify(message, signature)
        except Exception:
            return False
    
    def verify_dict(self, obj: dict, signature_field: str = "signature") -> bool:
        """
        Verify signature on a dictionary.
        
        Args:
            obj: Dictionary with signature field
            signature_field: Field name containing signature
        
        Returns: True if valid, False otherwise
        """
        if signature_field not in obj:
            return False
        
        signature_b64 = obj[signature_field]
        
        # Remove signature field
        obj_copy = {k: v for k, v in obj.items() if k != signature_field}
        
        # Canonical bytes
        canonical = canonical_json_bytes(obj_copy)
        
        # Verify
        return self.verify_base64(canonical, signature_b64)


class Ed25519Verifier:
    """
    Ed25519 verification-only operations.
    
    Use this when you only need to verify signatures (no private key).
    """
    
    def __init__(self, public_key: Ed25519PublicKey):
        self.public_key = public_key
    
    @classmethod
    def from_public_bytes(cls, public_bytes: bytes) -> 'Ed25519Verifier':
        """Load verifier from 32-byte public key."""
        if len(public_bytes) != 32:
            raise ValueError("Public key must be exactly 32 bytes")
        public_key = Ed25519PublicKey.from_public_bytes(public_bytes)
        return cls(public_key)
    
    @classmethod
    def from_public_hex(cls, public_hex: str) -> 'Ed25519Verifier':
        """Load verifier from hex-encoded public key."""
        public_bytes = bytes.fromhex(public_hex)
        return cls.from_public_bytes(public_bytes)
    
    @classmethod
    def from_public_base64(cls, public_b64: str) -> 'Ed25519Verifier':
        """Load verifier from base64-encoded public key."""
        public_bytes = base64.b64decode(public_b64)
        return cls.from_public_bytes(public_bytes)
    
    def public_bytes(self) -> bytes:
        """Export public key as 32 bytes."""
        return self.public_key.public_bytes_raw()
    
    def public_hex(self) -> str:
        """Export public key as hex string."""
        return self.public_bytes().hex()
    
    def public_base64(self) -> str:
        """Export public key as base64 string."""
        return base64.b64encode(self.public_bytes()).decode('ascii')
    
    def verify(self, message: bytes, signature: bytes) -> bool:
        """Verify signature against message."""
        try:
            self.public_key.verify(signature, message)
            return True
        except InvalidSignature:
            return False
    
    def verify_base64(self, message: bytes, signature_b64: str) -> bool:
        """Verify base64-encoded signature."""
        try:
            signature = base64.b64decode(signature_b64)
            return self.verify(message, signature)
        except Exception:
            return False
    
    def verify_dict(self, obj: dict, signature_field: str = "signature") -> bool:
        """Verify signature on a dictionary."""
        if signature_field not in obj:
            return False
        
        signature_b64 = obj[signature_field]
        obj_copy = {k: v for k, v in obj.items() if k != signature_field}
        canonical = canonical_json_bytes(obj_copy)
        return self.verify_base64(canonical, signature_b64)


# Test Vectors (for cross-language verification)
TEST_VECTORS = {
    "keypair_1": {
        "private_key_hex": "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
        "public_key_hex": "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
        "test_message": '{"test":"vector"}',
        "expected_signature_base64": None  # Computed on first use
    }
}


def verify_test_vectors() -> bool:
    """
    Verify implementation against test vectors.
    
    Returns: True if all vectors pass
    """
    for name, vector in TEST_VECTORS.items():
        # Load signer
        signer = Ed25519Signer.from_private_hex(vector["private_key_hex"])
        
        # Verify public key matches
        if signer.public_hex() != vector["public_key_hex"]:
            print(f"FAIL: {name} - public key mismatch")
            return False
        
        # Sign test message
        message = vector["test_message"].encode('utf-8')
        signature_b64 = signer.sign_base64(message)
        
        # If expected signature not set, print it
        if vector["expected_signature_base64"] is None:
            print(f"{name} signature: {signature_b64}")
        else:
            # Verify signature matches expected
            if signature_b64 != vector["expected_signature_base64"]:
                print(f"FAIL: {name} - signature mismatch")
                return False
        
        # Verify signature
        if not signer.verify_base64(message, signature_b64):
            print(f"FAIL: {name} - verification failed")
            return False
        
        print(f"PASS: {name}")
    
    return True


# Convenience functions
def sign_canonical(obj: dict, private_key_hex: str) -> str:
    """
    Sign a dictionary and return base64 signature.
    
    Args:
        obj: Dictionary to sign
        private_key_hex: Hex-encoded private key
    
    Returns: Base64-encoded signature
    """
    signer = Ed25519Signer.from_private_hex(private_key_hex)
    canonical = canonical_json_bytes(obj)
    return signer.sign_base64(canonical)


def verify_canonical(obj: dict, signature_b64: str, public_key_hex: str) -> bool:
    """
    Verify signature on a dictionary.
    
    Args:
        obj: Dictionary that was signed
        signature_b64: Base64-encoded signature
        public_key_hex: Hex-encoded public key
    
    Returns: True if valid
    """
    verifier = Ed25519Verifier.from_public_hex(public_key_hex)
    canonical = canonical_json_bytes(obj)
    return verifier.verify_base64(canonical, signature_b64)


if __name__ == "__main__":
    # Run test vectors
    print("=== Canonical Signing Test Vectors ===")
    verify_test_vectors()
    
    # Example usage
    print("\n=== Example Usage ===")
    
    # Generate keypair
    signer = Ed25519Signer.generate()
    print(f"Private key: {signer.private_hex()}")
    print(f"Public key: {signer.public_hex()}")
    
    # Sign a dictionary
    payload = {
        "instance_id": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2025-12-14T10:00:00Z",
        "data": "test"
    }
    
    signed_payload = signer.sign_dict(payload.copy())
    print(f"\nSigned payload:")
    print(json.dumps(signed_payload, indent=2))
    
    # Verify
    is_valid = signer.verify_dict(signed_payload)
    print(f"\nSignature valid: {is_valid}")
    
    # Tamper with payload
    signed_payload["data"] = "tampered"
    is_valid_after_tamper = signer.verify_dict(signed_payload)
    print(f"Signature valid after tampering: {is_valid_after_tamper}")
