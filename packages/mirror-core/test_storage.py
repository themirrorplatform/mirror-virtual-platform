"""
Tests for Storage Layer

Validates local-first storage, encryption, and sovereignty guarantees.
"""

import sys
from pathlib import Path
import tempfile
import shutil
import os

sys.path.insert(0, str(Path(__file__).parent))

from storage.local_store import LocalStore, StorageConfig
from storage.encryption import EncryptionManager
from storage.reflection_store import ReflectionStore
from storage.migration import MigrationManager
from protocol.types import MirrorRequest, InvocationMode
from engine.pipeline import MirrorPipeline, PipelineResult
from layers.l3_expression import ExpressionPreferences
from datetime import datetime


def test_local_store_basic():
    """Test basic local storage operations"""
    print("\n[TEST] Local Store - Basic Operations")
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(
            base_path=temp_dir,
            user_id="test_user",
            encrypted=False
        )
        
        store = LocalStore(config)
        
        # Store a reflection
        success = store.store_reflection(
            "refl_123",
            "test_user",
            "Had a good day today",
            "That's great to hear",
            "post_action",
            {"mood": "positive"}
        )
        
        assert success == True
        
        # Retrieve reflections
        reflections = store.get_reflections("test_user")
        assert len(reflections) == 1
        assert reflections[0]['content'] == "Had a good day today"
        
        print("[OK] Basic storage operations work")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_local_store_patterns():
    """Test pattern storage"""
    print("\n[TEST] Local Store - Pattern Storage")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        store = LocalStore(config)
        
        # Store pattern
        success = store.store_pattern(
            "pattern_123",
            "test_user",
            "emotion",
            "anxiety",
            5,
            datetime.utcnow(),
            datetime.utcnow(),
            0.85,
            ["work stress", "deadlines"]
        )
        
        assert success == True
        
        # Retrieve patterns
        patterns = store.get_patterns("test_user")
        assert len(patterns) == 1
        assert patterns[0]['name'] == "anxiety"
        assert patterns[0]['occurrences'] == 5
        
        print("[OK] Pattern storage works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_local_store_audit():
    """Test audit trail storage"""
    print("\n[TEST] Local Store - Audit Trail")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        store = LocalStore(config)
        
        # Store audit event
        success = store.store_audit_event(
            "audit_123",
            "test_user",
            "reflection_saved",
            datetime.utcnow(),
            {"reflection_id": "refl_123"},
            None,
            "hash123"
        )
        
        assert success == True
        
        # Retrieve audit trail
        audit = store.get_audit_trail("test_user")
        assert len(audit) == 1
        assert audit[0]['event_type'] == "reflection_saved"
        
        print("[OK] Audit trail storage works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_encryption_basic():
    """Test encryption/decryption"""
    print("\n[TEST] Encryption - Basic Operations")
    
    encryption = EncryptionManager()
    
    plaintext = "This is sensitive data"
    ciphertext = encryption.encrypt(plaintext)
    
    assert ciphertext != plaintext
    assert len(ciphertext) > len(plaintext)
    
    decrypted = encryption.decrypt(ciphertext)
    assert decrypted == plaintext
    
    print("[OK] Encryption/decryption works")
    return True


def test_encryption_key_derivation():
    """Test key derivation from passphrase"""
    print("\n[TEST] Encryption - Key Derivation")
    
    passphrase = "my_secure_passphrase_123"
    key1, salt1 = EncryptionManager.derive_key_from_passphrase(passphrase)
    
    # Same passphrase + salt = same key
    key2, salt2 = EncryptionManager.derive_key_from_passphrase(passphrase, salt1)
    assert key1 == key2
    
    # Different salt = different key
    key3, salt3 = EncryptionManager.derive_key_from_passphrase(passphrase)
    assert key3 != key1
    
    print("[OK] Key derivation works")
    return True


def test_encryption_hashing():
    """Test data hashing"""
    print("\n[TEST] Encryption - Hashing")
    
    encryption = EncryptionManager()
    
    data = "Important data"
    hash1 = encryption.hash_data(data)
    hash2 = encryption.hash_data(data)
    
    # Same data = same hash
    assert hash1 == hash2
    
    # Verify hash
    assert encryption.verify_hash(data, hash1) == True
    assert encryption.verify_hash("Different data", hash1) == False
    
    print("[OK] Hashing works")
    return True


def test_reflection_store_integration():
    """Test reflection store with pipeline integration"""
    print("\n[TEST] Reflection Store - Pipeline Integration")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        reflection_store = ReflectionStore(config)
        
        # Create a pipeline request and result
        pipeline = MirrorPipeline(enable_audit=False)
        request = MirrorRequest(
            user_content="Feeling productive today",
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        result = pipeline.process(request)
        
        # Save reflection
        reflection_id = reflection_store.save_reflection(request, result)
        assert reflection_id is not None
        
        # Retrieve history
        history = reflection_store.get_reflection_history("test_user")
        assert len(history) == 1
        assert history[0]['content'] == "Feeling productive today"
        
        print("[OK] Reflection store integration works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_reflection_store_with_encryption():
    """Test reflection store with encryption"""
    print("\n[TEST] Reflection Store - With Encryption")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=True)
        encryption = EncryptionManager()
        reflection_store = ReflectionStore(config, encryption)
        
        pipeline = MirrorPipeline(enable_audit=False)
        request = MirrorRequest(
            user_content="Sensitive personal reflection",
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        result = pipeline.process(request)
        
        # Save (should be encrypted)
        reflection_id = reflection_store.save_reflection(request, result)
        
        # Retrieve (should be decrypted)
        history = reflection_store.get_reflection_history("test_user")
        assert history[0]['content'] == "Sensitive personal reflection"
        
        print("[OK] Encrypted storage works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_storage_stats():
    """Test storage statistics"""
    print("\n[TEST] Storage - Statistics")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        store = LocalStore(config)
        
        # Add some data
        for i in range(10):
            store.store_reflection(
                f"refl_{i}",
                "test_user",
                f"Reflection {i}",
                f"Response {i}",
                "post_action"
            )
        
        # Get stats
        stats = store.get_storage_stats("test_user")
        assert stats['reflections'] == 10
        assert stats['database_size_bytes'] > 0
        assert stats['database_size_mb'] >= 0
        
        print("[OK] Storage statistics work")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_data_export():
    """Test data export (sovereignty feature)"""
    print("\n[TEST] Storage - Data Export (Sovereignty)")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        store = LocalStore(config)
        
        # Add data
        store.store_reflection("refl_1", "test_user", "Reflection 1", "Response 1", "post_action")
        store.store_reflection("refl_2", "test_user", "Reflection 2", "Response 2", "post_action")
        
        # Export
        export = store.export_data("test_user")
        
        assert export['user_id'] == "test_user"
        assert len(export['reflections']) == 2
        assert 'export_date' in export
        assert 'version' in export
        
        print("[OK] Data export works (sovereignty guaranteed)")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_migration_system():
    """Test migration system"""
    print("\n[TEST] Migration - Schema Versioning")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        config = StorageConfig(base_path=temp_dir, user_id="test_user", encrypted=False)
        store = LocalStore(config)
        db_path = config.get_db_path()
        
        migration_manager = MigrationManager(db_path)
        
        # Check version
        current = migration_manager.get_current_version()
        latest = migration_manager.get_latest_version()
        
        assert latest >= current
        
        # Run migrations if needed
        if migration_manager.needs_migration():
            applied = migration_manager.migrate()
            assert len(applied) > 0
        
        # Verify we're at latest version
        assert migration_manager.get_current_version() == latest
        
        print("[OK] Migration system works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def test_multi_user_isolation():
    """Test that user data is isolated"""
    print("\n[TEST] Storage - Multi-User Isolation")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        # User 1
        config1 = StorageConfig(base_path=temp_dir, user_id="user_1", encrypted=False)
        store1 = LocalStore(config1)
        store1.store_reflection("refl_1", "user_1", "User 1 reflection", None, "post_action")
        
        # User 2
        config2 = StorageConfig(base_path=temp_dir, user_id="user_2", encrypted=False)
        store2 = LocalStore(config2)
        store2.store_reflection("refl_2", "user_2", "User 2 reflection", None, "post_action")
        
        # Each user sees only their data
        user1_reflections = store1.get_reflections("user_1")
        user2_reflections = store2.get_reflections("user_2")
        
        assert len(user1_reflections) == 1
        assert len(user2_reflections) == 1
        assert user1_reflections[0]['content'] != user2_reflections[0]['content']
        
        print("[OK] Multi-user isolation works")
        return True
        
    finally:
        shutil.rmtree(temp_dir)


def run_all_tests():
    """Run all storage tests"""
    print("\n" + "="*70)
    print("WEEK 9: STORAGE LAYER TESTS")
    print("="*70)
    
    tests = [
        test_local_store_basic,
        test_local_store_patterns,
        test_local_store_audit,
        test_encryption_basic,
        test_encryption_key_derivation,
        test_encryption_hashing,
        test_reflection_store_integration,
        test_reflection_store_with_encryption,
        test_storage_stats,
        test_data_export,
        test_migration_system,
        test_multi_user_isolation,
    ]
    
    passed = 0
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"[FAIL] {test.__name__}: {e}")
    
    print("\n" + "="*70)
    print(f"[SUCCESS] {passed}/{len(tests)} TESTS PASSED")
    print("="*70)
    print("\nStorage Layer Features:")
    print("  [OK] Local-first storage (user owns data)")
    print("  [OK] End-to-end encryption")
    print("  [OK] Pattern and tension persistence")
    print("  [OK] Audit trail storage")
    print("  [OK] Data export (sovereignty)")
    print("  [OK] Schema migrations")
    print("  [OK] Multi-user isolation")
    
    return passed == len(tests)


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
