"""
Cryptographic utilities for event signing and verification in Commons Sync.
Uses Ed25519 for strong, fast, and future-proof digital signatures.
"""
import os
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

KEY_FILE = os.getenv("MIRROR_COMMONS_KEY_FILE", "commons_ed25519.key")


def generate_keypair() -> Tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


def save_private_key(private_key: Ed25519PrivateKey, path: str = KEY_FILE):
    with open(path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))


def load_private_key(path: str = KEY_FILE) -> Ed25519PrivateKey:
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def sign_message(private_key: Ed25519PrivateKey, message: bytes) -> bytes:
    return private_key.sign(message)


def verify_signature(public_key: Ed25519PublicKey, message: bytes, signature: bytes) -> bool:
    try:
        public_key.verify(signature, message)
        return True
    except Exception:
        return False


def public_key_bytes(public_key: Ed25519PublicKey) -> bytes:
    return public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
