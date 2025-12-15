"""
Integration Tests - Simple Storage and Service Tests

Tests storage, migration, and export without requiring full engine setup.
"""

import pytest
import sys
import os
import json
import tempfile
import shutil
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.services.migrator import Migrator, Migration
from mirror_os.services.exporter import DataExporter, DataImporter


@pytest.fixture
def storage():
    """Create in-memory storage for testing"""
    # Get absolute path to schema
    test_dir = Path(__file__).parent
    schema_path = test_dir.parent / "mirror_os" / "schemas" / "sqlite" / "001_core.sql"
    db = SQLiteStorage(":memory:", schema_path=str(schema_path))
    yield db
    db.close()


@pytest.fixture
def temp_db():
    """Create temporary database"""
    # Get absolute path to schema
    test_dir = Path(__file__).parent
    schema_path = test_dir.parent / "mirror_os" / "schemas" / "sqlite" / "001_core.sql"
    
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    storage = SQLiteStorage(path, schema_path=str(schema_path))
    storage.close()
    yield path
    # Cleanup - Windows may need a delay
    try:
        if os.path.exists(path):
            os.remove(path)
    except PermissionError:
        pass  # File still in use, will be cleaned by temp dir


@pytest.fixture
def temp_dir():
    """Create temporary directory"""
    temp_path = tempfile.mkdtemp()
    yield temp_path
    shutil.rmtree(temp_path)


def test_complete_storage_workflow(storage):
    """Test: Complete workflow through storage layer"""
    # Create identity
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    assert identity_id is not None
    
    # Create reflection
    reflection_id = storage.create_reflection(
        content="I'm exploring my thoughts and feelings.",
        identity_id=identity_id,
        visibility="local_only",
        metadata={"tags": "introspection,growth"}
    )
    assert reflection_id is not None
    
    # Create mirrorback
    mirrorback_id = storage.create_mirrorback(
        reflection_id=reflection_id,
        content="I notice you're exploring your inner landscape. What draws you to this reflection right now?",
        llm_provider="local",
        llm_model="test-model",
        metadata={"constitutional_valid": True}
    )
    assert mirrorback_id is not None
    
    # Verify all data
    identity = storage.get_identity(identity_id)
    assert identity["id"] == identity_id
    
    reflection = storage.get_reflection(reflection_id)
    assert reflection["content"] == "I'm exploring my thoughts and feelings."
    
    mirrorback = storage.get_mirrorback(mirrorback_id)
    assert mirrorback["reflection_id"] == reflection_id
    
    # Get stats
    stats = storage.get_stats()
    assert stats["identities"] == 1
    assert stats["reflections"] == 1
    assert stats["mirrorbacks"] == 1


def test_pattern_and_tension_storage(storage):
    """Test: Store and retrieve patterns and tensions"""
    identity_id = storage.create_identity(metadata={"name": "Pattern Test"})
    
    reflection_id = storage.create_reflection(
        content="Test reflection",
        identity_id=identity_id
    )
    
    # Create pattern
    pattern_id = storage.create_pattern(
        name="Self-reflection",
        description="Regular introspection",
        confidence=0.85
    )
    assert pattern_id is not None
    
    # Link pattern to reflection
    storage.link_pattern_to_reflection(pattern_id, reflection_id, confidence=0.9)
    
    # Create tension
    tension_id = storage.create_tension(
        reflection_id=reflection_id,
        name="Control vs Surrender",
        axis_a="Control",
        axis_b="Surrender",
        position=0.3,
        intensity=0.7
    )
    assert tension_id is not None
    
    # Retrieve
    patterns = storage.get_patterns_for_identity(identity_id)
    assert len(patterns) > 0
    
    tensions = storage.get_tensions_for_identity(identity_id)
    assert len(tensions) > 0
    assert tensions[0]["name"] == "Control vs Surrender"


def test_thread_management(storage):
    """Test: Thread creation and reflection grouping"""
    identity_id = storage.create_identity(metadata={"name": "Thread Test"})
    
    # Create thread
    thread_id = storage.create_thread(
        title="Exploring Control",
        identity_id=identity_id,
        metadata={"theme": "control_surrender"}
    )
    assert thread_id is not None
    
    # Create reflections and add to thread
    for i in range(3):
        reflection_id = storage.create_reflection(
            content=f"Thread reflection {i+1}",
            identity_id=identity_id
        )
        storage.add_reflection_to_thread(thread_id, reflection_id)
    
    # Verify thread
    thread = storage.get_thread(thread_id)
    assert thread["title"] == "Exploring Control"
    
    thread_reflections = storage.get_thread_reflections(thread_id)
    assert len(thread_reflections) == 3


def test_migration_system(temp_db):
    """Test: Migration system functionality"""
    migrator = Migrator(temp_db)
    
    # Check initial status
    status = migrator.get_status()
    assert status["current_version"] == 0
    
    # Add test migration
    test_migration = Migration(
        version=2,
        name="Add test column",
        up_sql="ALTER TABLE identities ADD COLUMN test_field TEXT DEFAULT 'test';",
        down_sql="-- Down migration"
    )
    migrator.add_migration(test_migration)
    
    # Apply migration
    result = migrator.migrate()
    assert result["status"] == "success"
    
    # Verify version updated
    status = migrator.get_status()
    assert status["current_version"] == 2
    
    # Test integrity check
    integrity = migrator.validate_integrity()
    assert integrity["status"] == "valid"


def test_export_to_json(temp_db, temp_dir):
    """Test: Export data to JSON"""
    # Create test data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Export Test"})
    
    reflection_id = storage.create_reflection(
        content="Test reflection for export",
        identity_id=identity_id,
        metadata={"tags": "test"}
    )
    
    storage.create_mirrorback(
        reflection_id=reflection_id,
        content="Test mirrorback",
        llm_provider="local"
    )
    
    storage.close()
    
    # Export
    exporter = DataExporter(temp_db)
    output_file = os.path.join(temp_dir, "export.json")
    result = exporter.export_to_json(output_file)
    
    assert result["status"] == "success"
    assert result["identities_exported"] == 1
    assert result["total_reflections"] == 1
    assert result["total_mirrorbacks"] == 1
    assert os.path.exists(output_file)
    
    # Verify JSON structure
    with open(output_file, 'r') as f:
        data = json.load(f)
    
    assert data["format"] == "mirror_os_export_v1"
    assert len(data["identities"]) == 1
    assert len(data["identities"][0]["reflections"]) == 1


def test_export_to_markdown(temp_db, temp_dir):
    """Test: Export to Markdown"""
    # Create test data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Markdown Test"})
    
    reflection_id = storage.create_reflection(
        content="My reflection on growth and change",
        identity_id=identity_id
    )
    
    storage.create_mirrorback(
        reflection_id=reflection_id,
        content="What aspect of this change feels most significant?",
        llm_provider="local"
    )
    
    storage.close()
    
    # Export
    exporter = DataExporter(temp_db)
    result = exporter.export_to_markdown(temp_dir, identity_id=identity_id)
    
    assert result["status"] == "success"
    assert len(result["files"]) > 0
    
    # Verify files exist
    identity_dir = os.path.join(temp_dir, f"identity_{identity_id[:8]}")
    reflections_md = os.path.join(identity_dir, "reflections.md")
    assert os.path.exists(reflections_md)
    
    # Verify content
    with open(reflections_md, 'r') as f:
        content = f.read()
        assert "My reflection on growth and change" in content
        assert "What aspect of this change feels most significant?" in content


def test_backup_and_restore(temp_db, temp_dir):
    """Test: Backup and restore workflow"""
    # Create data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Backup Test"})
    storage.create_reflection(content="Test", identity_id=identity_id)
    storage.close()
    
    # Create backup
    exporter = DataExporter(temp_db)
    backup_file = os.path.join(temp_dir, "test_backup.zip")
    result = exporter.create_backup(backup_file, include_database=True)
    
    assert result["status"] == "success"
    assert os.path.exists(backup_file)
    
    # Verify backup contents
    import zipfile
    with zipfile.ZipFile(backup_file, 'r') as zipf:
        files = zipf.namelist()
        assert "mirror.db" in files
        assert "export.json" in files


def test_import_export_roundtrip(temp_db, temp_dir):
    """Test: Export and import maintains data integrity"""
    # Create data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Roundtrip", "version": "1.0"})
    
    for i in range(3):
        reflection_id = storage.create_reflection(
            content=f"Reflection {i+1}",
            identity_id=identity_id
        )
        storage.create_mirrorback(
            reflection_id=reflection_id,
            content=f"Mirrorback {i+1}",
            llm_provider="test"
        )
    
    storage.close()
    
    # Export
    exporter = DataExporter(temp_db)
    export_file = os.path.join(temp_dir, "roundtrip.json")
    export_result = exporter.export_to_json(export_file)
    
    assert export_result["total_reflections"] == 3
    assert export_result["total_mirrorbacks"] == 3
    
    # Import to new database
    fd, new_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    
    try:
        new_storage = SQLiteStorage(new_db, schema_path="mirror_os/schemas/sqlite/001_core.sql")
        new_storage.close()
        
        importer = DataImporter(new_db)
        import_result = importer.import_from_json(export_file)
        
        assert import_result["status"] == "success"
        assert import_result["reflections_imported"] == 3
        assert import_result["mirrorbacks_imported"] == 3
        
        # Verify data
        verify_storage = SQLiteStorage(new_db)
        reflections = verify_storage.get_reflections_for_identity(identity_id)
        assert len(reflections) == 3
        verify_storage.close()
    
    finally:
        if os.path.exists(new_db):
            os.remove(new_db)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
