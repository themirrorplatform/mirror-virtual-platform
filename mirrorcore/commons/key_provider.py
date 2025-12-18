"""
Key abstraction for HSM/enclave integration in Commons Sync.
Allows plugging in hardware-backed or remote signing/verification.
"""
from typing import Any, Optional

class KeyProvider:
    def sign(self, message: bytes) -> bytes:
        raise NotImplementedError
    def public_key_bytes(self) -> bytes:
        raise NotImplementedError

class SoftwareKeyProvider(KeyProvider):
    def __init__(self, private_key):
        self.private_key = private_key
    def sign(self, message: bytes) -> bytes:
        return self.private_key.sign(message)
    def public_key_bytes(self) -> bytes:
        return self.private_key.public_key().public_bytes(
            encoding="raw",
            format=1  # PublicFormat.Raw
        )

# Example HSMKeyProvider stub (to be implemented for real HSMs)
class HSMKeyProvider(KeyProvider):
    def __init__(self, hsm_handle: Any):
        self.hsm_handle = hsm_handle
    def sign(self, message: bytes) -> bytes:
        # Call HSM API
        raise NotImplementedError
    def public_key_bytes(self) -> bytes:
        # Call HSM API
        raise NotImplementedError
