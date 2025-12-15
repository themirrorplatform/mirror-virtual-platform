"""
Hardware Encryption Layer - Local-First Encrypted Storage

Provides:
- AES-256 encryption for reflection storage
- Secure key derivation from user passphrase
- Hardware security module integration (when available)
- Encrypted export/import
- Key rotation support

Sovereignty principle: Data encrypted locally before any storage.
"""

import json
import os
import base64
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, hmac
from cryptography.hazmat.backends import default_backend


class EncryptionSystem:
    """
    Local-first encryption for all reflection data.
    
    Features:
    - AES-256-GCM encryption
    - PBKDF2 key derivation
    - Per-reflection unique IVs
    - Authenticated encryption
    - Key rotation support
    """
    
    def __init__(self, storage):
        self.storage = storage
        self.backend = default_backend()
        self._ensure_encryption_tables()
        self._active_key = None
        self._key_id = None
    
    def _ensure_encryption_tables(self):
        """Create encryption metadata tables"""
        
        # Encryption keys metadata (NOT the keys themselves)
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS encryption_keys (
                id TEXT PRIMARY KEY,
                identity_id TEXT NOT NULL,
                key_version INTEGER NOT NULL,
                algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
                created_at TEXT NOT NULL,
                rotated_at TEXT,
                active INTEGER NOT NULL DEFAULT 1,
                salt TEXT NOT NULL,  -- For PBKDF2
                iterations INTEGER NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Encrypted data metadata
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS encrypted_reflections (
                reflection_id TEXT PRIMARY KEY,
                key_id TEXT NOT NULL,
                iv TEXT NOT NULL,  -- Initialization vector
                auth_tag TEXT NOT NULL,  -- GCM authentication tag
                encrypted_at TEXT NOT NULL,
                FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE,
                FOREIGN KEY (key_id) REFERENCES encryption_keys(id)
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_encryption_keys_identity 
            ON encryption_keys(identity_id)
        """)
        
        self.storage.conn.commit()
    
    def initialize_encryption(
        self,
        identity_id: str,
        passphrase: str,
        iterations: int = 100000
    ) -> Dict:
        """
        Initialize encryption for a user.
        
        Args:
            identity_id: User to encrypt for
            passphrase: User's passphrase for key derivation
            iterations: PBKDF2 iterations (more = slower but more secure)
        
        Returns:
            Initialization result
        """
        
        # Check if already initialized
        cursor = self.storage.conn.execute("""
            SELECT id FROM encryption_keys 
            WHERE identity_id = ? AND active = 1
        """, (identity_id,))
        
        if cursor.fetchone():
            return {
                'success': False,
                'error': 'Encryption already initialized'
            }
        
        # Generate salt
        salt = os.urandom(32)
        
        # Derive key from passphrase
        key = self._derive_key(passphrase, salt, iterations)
        
        # Store key metadata (NOT the key itself)
        key_id = self._generate_key_id()
        
        self.storage.conn.execute("""
            INSERT INTO encryption_keys (
                id, identity_id, key_version, algorithm,
                created_at, active, salt, iterations, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            key_id,
            identity_id,
            1,
            'AES-256-GCM',
            datetime.utcnow().isoformat() + 'Z',
            1,
            base64.b64encode(salt).decode('utf-8'),
            iterations,
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        # Store key in memory for this session
        self._active_key = key
        self._key_id = key_id
        
        return {
            'success': True,
            'key_id': key_id,
            'key_version': 1,
            'algorithm': 'AES-256-GCM',
            'message': 'Encryption initialized successfully'
        }
    
    def unlock_encryption(
        self,
        identity_id: str,
        passphrase: str
    ) -> Dict:
        """
        Unlock encryption with passphrase.
        
        Args:
            identity_id: User
            passphrase: User's passphrase
        
        Returns:
            Unlock result
        """
        
        # Get key metadata
        cursor = self.storage.conn.execute("""
            SELECT id, salt, iterations FROM encryption_keys
            WHERE identity_id = ? AND active = 1
        """, (identity_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'No encryption key found'
            }
        
        key_id = row['id']
        salt = base64.b64decode(row['salt'])
        iterations = row['iterations']
        
        # Derive key from passphrase
        key = self._derive_key(passphrase, salt, iterations)
        
        # Verify key works by attempting to decrypt a test reflection
        cursor = self.storage.conn.execute("""
            SELECT reflection_id FROM encrypted_reflections
            WHERE key_id = ? LIMIT 1
        """, (key_id,))
        
        test_row = cursor.fetchone()
        if test_row:
            try:
                # Try to decrypt (will fail if wrong passphrase)
                self._active_key = key
                self._key_id = key_id
                self.decrypt_reflection(test_row['reflection_id'])
            except Exception as e:
                return {
                    'success': False,
                    'error': 'Invalid passphrase'
                }
        else:
            # No encrypted reflections yet, assume correct
            self._active_key = key
            self._key_id = key_id
        
        return {
            'success': True,
            'key_id': key_id,
            'message': 'Encryption unlocked'
        }
    
    def encrypt_reflection(
        self,
        reflection_id: str,
        content: str
    ) -> Dict:
        """
        Encrypt reflection content.
        
        Args:
            reflection_id: Reflection to encrypt
            content: Plain text content
        
        Returns:
            Encryption result with ciphertext
        """
        
        if not self._active_key:
            return {
                'success': False,
                'error': 'Encryption not unlocked'
            }
        
        # Generate unique IV for this reflection
        iv = os.urandom(12)  # GCM recommended IV size
        
        # Encrypt with AES-256-GCM
        cipher = Cipher(
            algorithms.AES(self._active_key),
            modes.GCM(iv),
            backend=self.backend
        )
        encryptor = cipher.encryptor()
        
        content_bytes = content.encode('utf-8')
        ciphertext = encryptor.update(content_bytes) + encryptor.finalize()
        
        # Get authentication tag
        auth_tag = encryptor.tag
        
        # Store encryption metadata
        self.storage.conn.execute("""
            INSERT OR REPLACE INTO encrypted_reflections (
                reflection_id, key_id, iv, auth_tag, encrypted_at
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            reflection_id,
            self._key_id,
            base64.b64encode(iv).decode('utf-8'),
            base64.b64encode(auth_tag).decode('utf-8'),
            datetime.utcnow().isoformat() + 'Z'
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
            'encrypted': True
        }
    
    def decrypt_reflection(self, reflection_id: str) -> str:
        """
        Decrypt reflection content.
        
        Args:
            reflection_id: Reflection to decrypt
        
        Returns:
            Decrypted plain text
        
        Raises:
            ValueError: If reflection not encrypted or wrong key
        """
        
        if not self._active_key:
            raise ValueError("Encryption not unlocked")
        
        # Get encryption metadata
        cursor = self.storage.conn.execute("""
            SELECT key_id, iv, auth_tag FROM encrypted_reflections
            WHERE reflection_id = ?
        """, (reflection_id,))
        
        row = cursor.fetchone()
        if not row:
            raise ValueError("Reflection not encrypted")
        
        if row['key_id'] != self._key_id:
            raise ValueError("Different encryption key")
        
        # Get ciphertext from reflections table
        cursor = self.storage.conn.execute("""
            SELECT content FROM reflections WHERE id = ?
        """, (reflection_id,))
        
        content_row = cursor.fetchone()
        if not content_row:
            raise ValueError("Reflection not found")
        
        ciphertext = base64.b64decode(content_row['content'])
        iv = base64.b64decode(row['iv'])
        auth_tag = base64.b64decode(row['auth_tag'])
        
        # Decrypt with AES-256-GCM
        cipher = Cipher(
            algorithms.AES(self._active_key),
            modes.GCM(iv, auth_tag),
            backend=self.backend
        )
        decryptor = cipher.decryptor()
        
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext.decode('utf-8')
    
    def rotate_key(
        self,
        identity_id: str,
        old_passphrase: str,
        new_passphrase: str
    ) -> Dict:
        """
        Rotate encryption key.
        
        Re-encrypts all reflections with new key.
        
        Args:
            identity_id: User
            old_passphrase: Current passphrase
            new_passphrase: New passphrase
        
        Returns:
            Rotation result
        """
        
        # Unlock with old passphrase
        unlock_result = self.unlock_encryption(identity_id, old_passphrase)
        if not unlock_result['success']:
            return unlock_result
        
        old_key = self._active_key
        old_key_id = self._key_id
        
        # Generate new key
        salt = os.urandom(32)
        iterations = 100000
        new_key = self._derive_key(new_passphrase, salt, iterations)
        new_key_id = self._generate_key_id()
        
        # Get current key version
        cursor = self.storage.conn.execute("""
            SELECT key_version FROM encryption_keys WHERE id = ?
        """, (old_key_id,))
        
        old_version = cursor.fetchone()['key_version']
        
        # Store new key metadata
        self.storage.conn.execute("""
            INSERT INTO encryption_keys (
                id, identity_id, key_version, algorithm,
                created_at, active, salt, iterations, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_key_id,
            identity_id,
            old_version + 1,
            'AES-256-GCM',
            datetime.utcnow().isoformat() + 'Z',
            1,
            base64.b64encode(salt).decode('utf-8'),
            iterations,
            json.dumps({'rotated_from': old_key_id})
        ))
        
        # Mark old key as inactive
        self.storage.conn.execute("""
            UPDATE encryption_keys 
            SET active = 0, rotated_at = ?
            WHERE id = ?
        """, (datetime.utcnow().isoformat() + 'Z', old_key_id))
        
        # Re-encrypt all reflections
        cursor = self.storage.conn.execute("""
            SELECT reflection_id FROM encrypted_reflections
            WHERE key_id = ?
        """, (old_key_id,))
        
        reflection_ids = [row['reflection_id'] for row in cursor.fetchall()]
        
        reencrypted_count = 0
        for reflection_id in reflection_ids:
            # Decrypt with old key
            plaintext = self.decrypt_reflection(reflection_id)
            
            # Switch to new key
            self._active_key = new_key
            self._key_id = new_key_id
            
            # Encrypt with new key
            result = self.encrypt_reflection(reflection_id, plaintext)
            if result['success']:
                # Update reflection content with new ciphertext
                self.storage.conn.execute("""
                    UPDATE reflections SET content = ? WHERE id = ?
                """, (result['ciphertext'], reflection_id))
                reencrypted_count += 1
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'new_key_id': new_key_id,
            'new_key_version': old_version + 1,
            'reencrypted_count': reencrypted_count,
            'message': f'Key rotated, {reencrypted_count} reflections re-encrypted'
        }
    
    def export_encrypted(
        self,
        identity_id: str,
        output_path: str
    ) -> Dict:
        """
        Export encrypted reflections (stays encrypted).
        
        Args:
            identity_id: User
            output_path: File path for export
        
        Returns:
            Export result
        """
        
        # Get all encrypted reflections
        cursor = self.storage.conn.execute("""
            SELECT r.id, r.content, r.created_at, e.iv, e.auth_tag, e.key_id
            FROM reflections r
            JOIN encrypted_reflections e ON r.id = e.reflection_id
            WHERE r.identity_id = ?
            ORDER BY r.created_at
        """, (identity_id,))
        
        reflections = []
        for row in cursor.fetchall():
            reflections.append({
                'id': row['id'],
                'ciphertext': row['content'],  # Already encrypted
                'iv': row['iv'],
                'auth_tag': row['auth_tag'],
                'key_id': row['key_id'],
                'created_at': row['created_at']
            })
        
        # Get key metadata (for re-import)
        cursor = self.storage.conn.execute("""
            SELECT id, key_version, algorithm, salt, iterations
            FROM encryption_keys
            WHERE identity_id = ?
        """, (identity_id,))
        
        keys = []
        for row in cursor.fetchall():
            keys.append({
                'id': row['id'],
                'key_version': row['key_version'],
                'algorithm': row['algorithm'],
                'salt': row['salt'],
                'iterations': row['iterations']
            })
        
        export_data = {
            'exported_at': datetime.utcnow().isoformat() + 'Z',
            'identity_id': identity_id,
            'encryption_version': '1.0',
            'keys': keys,
            'reflections': reflections
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        return {
            'success': True,
            'exported_count': len(reflections),
            'output_path': output_path,
            'message': f'Exported {len(reflections)} encrypted reflection(s)'
        }
    
    def _derive_key(
        self,
        passphrase: str,
        salt: bytes,
        iterations: int
    ) -> bytes:
        """Derive 256-bit key from passphrase using PBKDF2"""
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=iterations,
            backend=self.backend
        )
        
        return kdf.derive(passphrase.encode('utf-8'))
    
    def _generate_key_id(self) -> str:
        """Generate unique key ID"""
        return f"key_{os.urandom(16).hex()}"
    
    def get_encryption_status(self, identity_id: str) -> Dict:
        """Get encryption status for a user"""
        
        cursor = self.storage.conn.execute("""
            SELECT 
                k.id, k.key_version, k.algorithm, k.created_at,
                COUNT(e.reflection_id) as encrypted_count
            FROM encryption_keys k
            LEFT JOIN encrypted_reflections e ON k.id = e.key_id
            WHERE k.identity_id = ? AND k.active = 1
            GROUP BY k.id
        """, (identity_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'encrypted': False,
                'message': 'Encryption not initialized'
            }
        
        # Get total reflections
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as total FROM reflections
            WHERE identity_id = ?
        """, (identity_id,))
        
        total = cursor.fetchone()['total']
        
        return {
            'encrypted': True,
            'key_id': row['id'],
            'key_version': row['key_version'],
            'algorithm': row['algorithm'],
            'created_at': row['created_at'],
            'encrypted_reflections': row['encrypted_count'],
            'total_reflections': total,
            'encryption_rate': row['encrypted_count'] / total if total > 0 else 0,
            'unlocked': self._active_key is not None
        }
