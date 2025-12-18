"""
Persistent, secure Ed25519 key management for Commons Sync.
Supports key generation, loading, rotation, and revocation.
Keys are stored encrypted at rest (Fernet symmetric encryption).
"""
import os
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
from cryptography.fernet import Fernet

KEY_DIR = os.getenv("MIRROR_COMMONS_KEY_DIR", "commons_keys")
KEY_FILE = os.path.join(KEY_DIR, "ed25519.key.enc")
KEY_META_FILE = os.path.join(KEY_DIR, "keymeta.json")
FERNET_KEY_FILE = os.path.join(KEY_DIR, "fernet.key")


def ensure_key_dir():
    os.makedirs(KEY_DIR, exist_ok=True)


def generate_fernet_key() -> bytes:
    key = Fernet.generate_key()
    with open(FERNET_KEY_FILE, "wb") as f:
        f.write(key)
    return key


def load_fernet_key() -> bytes:
    if not os.path.exists(FERNET_KEY_FILE):
        return generate_fernet_key()
    with open(FERNET_KEY_FILE, "rb") as f:
        return f.read()


def encrypt_and_save_private_key(private_key: Ed25519PrivateKey, path: str = KEY_FILE):
    ensure_key_dir()
    fernet = Fernet(load_fernet_key())
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    enc = fernet.encrypt(pem)
    with open(path, "wb") as f:
        f.write(enc)


def load_encrypted_private_key(path: str = KEY_FILE) -> Ed25519PrivateKey:
    fernet = Fernet(load_fernet_key())
    with open(path, "rb") as f:
        enc = f.read()
    pem = fernet.decrypt(enc)
    return serialization.load_pem_private_key(pem, password=None)


def rotate_private_key() -> Tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    priv, pub = Ed25519PrivateKey.generate(), None
    encrypt_and_save_private_key(priv)
    pub = priv.public_key()
    # Optionally update keymeta.json for revocation tracking
    return priv, pub


def revoke_private_key():
    # Mark key as revoked in keymeta.json (append-only log)
    ensure_key_dir()
    import json, time
    meta = {}
    if os.path.exists(KEY_META_FILE):
        with open(KEY_META_FILE, "r") as f:
            meta = json.load(f)
    meta[str(time.time())] = {"revoked": True, "key_file": KEY_FILE}
    with open(KEY_META_FILE, "w") as f:
        json.dump(meta, f, indent=2)
    # Optionally delete key file
    if os.path.exists(KEY_FILE):
        os.remove(KEY_FILE)


def get_current_public_key() -> Optional[Ed25519PublicKey]:
    if not os.path.exists(KEY_FILE):
        return None
    priv = load_encrypted_private_key()
    return priv.public_key()
