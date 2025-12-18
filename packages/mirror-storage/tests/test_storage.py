"""
Tests for Mirror Storage.

Tests the storage interface, local SQLite adapter, and data operations.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
import tempfile
import os

from mirror_storage.base import (
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    StorageConfig,
)
from mirror_storage.local import SQLiteStorage, MemoryStorage
from mirror_storage.encryption import EncryptionManager


@pytest.fixture
def temp_db_path():
    """Create a temporary database path."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


@pytest.fixture
def encryption():
    """Create an encryption manager for testing."""
    return EncryptionManager.from_passphrase("test-passphrase")


class TestReflection:
    """Tests for Reflection data model."""

    def test_create_reflection(self):
        """Should create a reflection with defaults."""
        r = Reflection.create(
            user_id="user1",
            content="Test content",
            mode="POST_ACTION"
        )

        assert r.id is not None
        assert r.user_id == "user1"
        assert r.content == "Test content"
        assert r.mode == "POST_ACTION"
        assert r.created_at is not None
        assert r.content_hash is not None

    def test_content_hash_consistency(self):
        """Same content should produce same hash."""
        r1 = Reflection.create(
            user_id="u1",
            content="Same content",
            response="Same response",
            mode="POST_ACTION"
        )
        r2 = Reflection.create(
            user_id="u2",
            content="Same content",
            response="Same response",
            mode="POST_ACTION"
        )

        assert r1.content_hash == r2.content_hash

    def test_serialization(self):
        """Should serialize and deserialize correctly."""
        original = Reflection.create(
            user_id="user1",
            content="Test",
            response="Response",
            mode="POST_ACTION",
            metadata={"key": "value"}
        )

        data = original.to_dict()
        restored = Reflection.from_dict(data)

        assert restored.id == original.id
        assert restored.content == original.content
        assert restored.response == original.response
        assert restored.metadata == original.metadata


class TestAuditEvent:
    """Tests for AuditEvent data model."""

    def test_hash_chain(self):
        """Audit events should form a hash chain."""
        e1 = AuditEvent(
            id="e1",
            user_id="user1",
            event_type="REQUEST",
            timestamp=datetime.utcnow(),
            data={"content": "test"},
            previous_hash=None,
            event_hash=""
        )

        e2 = AuditEvent(
            id="e2",
            user_id="user1",
            event_type="RESPONSE",
            timestamp=datetime.utcnow(),
            data={"content": "response"},
            previous_hash=e1.event_hash,
            event_hash=""
        )

        assert e1.event_hash is not None
        assert e2.event_hash is not None
        assert e2.previous_hash == e1.event_hash

    def test_integrity_verification(self):
        """Should verify event integrity."""
        event = AuditEvent(
            id="e1",
            user_id="user1",
            event_type="REQUEST",
            timestamp=datetime.utcnow(),
            data={"content": "test"},
            previous_hash=None,
            event_hash=""
        )

        assert event.verify_integrity() is True


class TestMemoryStorage:
    """Tests for MemoryStorage."""

    @pytest.mark.asyncio
    async def test_save_and_get_reflection(self):
        """Should save and retrieve a reflection."""
        storage = MemoryStorage()
        await storage.initialize()

        r = Reflection.create(
            user_id="user1",
            content="Test content",
            mode="POST_ACTION"
        )

        await storage.save_reflection(r)
        retrieved = await storage.get_reflection(r.id)

        assert retrieved is not None
        assert retrieved.content == r.content

    @pytest.mark.asyncio
    async def test_get_reflections_pagination(self):
        """Should paginate reflections correctly."""
        storage = MemoryStorage()
        await storage.initialize()

        # Create 10 reflections
        for i in range(10):
            r = Reflection.create(
                user_id="user1",
                content=f"Reflection {i}",
                mode="POST_ACTION"
            )
            await storage.save_reflection(r)

        # Get first 5
        first_page = await storage.get_reflections("user1", limit=5, offset=0)
        assert len(first_page) == 5

        # Get next 5
        second_page = await storage.get_reflections("user1", limit=5, offset=5)
        assert len(second_page) == 5

        # No overlap
        first_ids = {r.id for r in first_page}
        second_ids = {r.id for r in second_page}
        assert first_ids.isdisjoint(second_ids)

    @pytest.mark.asyncio
    async def test_delete_reflection(self):
        """Should delete a reflection."""
        storage = MemoryStorage()
        await storage.initialize()

        r = Reflection.create(
            user_id="user1",
            content="To be deleted",
            mode="POST_ACTION"
        )
        await storage.save_reflection(r)

        deleted = await storage.delete_reflection(r.id)
        assert deleted is True

        retrieved = await storage.get_reflection(r.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_audit_trail_integrity(self):
        """Should maintain audit trail integrity."""
        storage = MemoryStorage()
        await storage.initialize()

        previous_hash = None
        for i in range(5):
            event = AuditEvent(
                id=f"e{i}",
                user_id="user1",
                event_type="TEST",
                timestamp=datetime.utcnow(),
                data={"index": i},
                previous_hash=previous_hash,
                event_hash=""
            )
            await storage.append_audit_event(event)
            previous_hash = event.event_hash

        is_valid = await storage.verify_audit_chain("user1")
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_export_all(self):
        """Should export all user data."""
        storage = MemoryStorage()
        await storage.initialize()

        # Create some data
        r = Reflection.create(
            user_id="user1",
            content="Test",
            mode="POST_ACTION"
        )
        await storage.save_reflection(r)

        p = Pattern.create(
            user_id="user1",
            pattern_type="emotion",
            name="anxiety"
        )
        await storage.save_pattern(p)

        # Export
        export = await storage.export_all("user1")

        assert len(export["reflections"]) == 1
        assert len(export["patterns"]) == 1

    @pytest.mark.asyncio
    async def test_delete_all(self):
        """Should delete all user data."""
        storage = MemoryStorage()
        await storage.initialize()

        # Create data
        r = Reflection.create(
            user_id="user1",
            content="Test",
            mode="POST_ACTION"
        )
        await storage.save_reflection(r)

        # Delete all
        deleted = await storage.delete_all("user1")
        assert deleted is True

        # Verify empty
        reflections = await storage.get_reflections("user1")
        assert len(reflections) == 0


class TestSQLiteStorage:
    """Tests for SQLiteStorage."""

    @pytest.mark.asyncio
    async def test_initialization(self, temp_db_path):
        """Should initialize database correctly."""
        config = StorageConfig(user_id="test")
        storage = SQLiteStorage(config, path=temp_db_path)

        await storage.initialize()
        assert storage._initialized is True
        await storage.close()

    @pytest.mark.asyncio
    async def test_context_manager(self, temp_db_path):
        """Should work as context manager."""
        config = StorageConfig(user_id="test")

        async with SQLiteStorage(config, path=temp_db_path) as storage:
            r = Reflection.create(
                user_id="user1",
                content="Test",
                mode="POST_ACTION"
            )
            await storage.save_reflection(r)

            retrieved = await storage.get_reflection(r.id)
            assert retrieved is not None

    @pytest.mark.asyncio
    async def test_encrypted_storage(self, temp_db_path, encryption):
        """Should encrypt data at rest."""
        config = StorageConfig(user_id="test", encrypt_at_rest=True)
        storage = SQLiteStorage(
            config,
            path=temp_db_path,
            encryption_manager=encryption
        )

        await storage.initialize()

        r = Reflection.create(
            user_id="user1",
            content="Secret content",
            response="Secret response",
            mode="POST_ACTION"
        )
        await storage.save_reflection(r)

        # Read raw from database
        import sqlite3
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.execute("SELECT content FROM reflections WHERE id = ?", (r.id,))
        row = cursor.fetchone()
        conn.close()

        # Content should be encrypted (not plaintext)
        assert row[0] != "Secret content"

        # But should decrypt correctly when read through storage
        retrieved = await storage.get_reflection(r.id)
        assert retrieved.content == "Secret content"

        await storage.close()

    @pytest.mark.asyncio
    async def test_backup_and_restore(self, temp_db_path):
        """Should backup and restore database."""
        config = StorageConfig(user_id="test")
        storage = SQLiteStorage(config, path=temp_db_path)
        await storage.initialize()

        # Create data
        r = Reflection.create(
            user_id="user1",
            content="Important data",
            mode="POST_ACTION"
        )
        await storage.save_reflection(r)

        # Create backup
        backup_path = await storage.create_backup()
        assert os.path.exists(backup_path)

        # Delete original data
        await storage.delete_all("user1")
        reflections = await storage.get_reflections("user1")
        assert len(reflections) == 0

        # Restore from backup
        await storage.restore_from_backup(backup_path)
        reflections = await storage.get_reflections("user1")
        assert len(reflections) == 1
        assert reflections[0].content == "Important data"

        await storage.close()


class TestEncryptionManager:
    """Tests for EncryptionManager."""

    def test_encrypt_decrypt(self):
        """Should encrypt and decrypt correctly."""
        manager = EncryptionManager.generate_new()

        plaintext = "Secret message"
        ciphertext = manager.encrypt(plaintext)
        decrypted = manager.decrypt(ciphertext)

        assert ciphertext != plaintext
        assert decrypted == plaintext

    def test_passphrase_derivation(self):
        """Should derive consistent key from passphrase."""
        salt = os.urandom(16)

        m1 = EncryptionManager.from_passphrase("secret", salt)
        m2 = EncryptionManager.from_passphrase("secret", salt)

        assert m1.fingerprint == m2.fingerprint

    def test_different_passphrases(self):
        """Different passphrases should produce different keys."""
        m1 = EncryptionManager.from_passphrase("secret1")
        m2 = EncryptionManager.from_passphrase("secret2")

        assert m1.fingerprint != m2.fingerprint

    def test_payload_encryption(self):
        """Should encrypt with metadata for verification."""
        manager = EncryptionManager.from_passphrase("test")

        payload = manager.encrypt_with_metadata("Secret data")

        assert payload.ciphertext != "Secret data"
        assert payload.key_fingerprint == manager.fingerprint

        decrypted = manager.decrypt_payload(payload)
        assert decrypted == "Secret data"

    def test_cloud_encryption(self):
        """Should encrypt for cloud storage."""
        manager = EncryptionManager.from_passphrase("test")

        data = {"key": "value", "nested": {"a": 1}}
        encrypted = manager.encrypt_for_cloud(data)
        decrypted = manager.decrypt_from_cloud(encrypted)

        assert decrypted == data

    def test_key_export_import(self):
        """Should export and import keys."""
        original = EncryptionManager.from_passphrase("test")
        exported = original.export_key()

        restored = EncryptionManager.import_key(exported)

        assert restored.fingerprint == original.fingerprint

        # Should be able to decrypt each other's data
        ciphertext = original.encrypt("test")
        decrypted = restored.decrypt(ciphertext)
        assert decrypted == "test"
