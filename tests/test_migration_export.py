"""
Integration Tests - Migration and Export Systems

Tests migration rollback, export/import workflows, and data sovereignty features.
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
def temp_db():
    """Create temporary database for testing"""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    
    # Initialize with schema
    storage = SQLiteStorage(path, schema_path="mirror_os/schemas/sqlite/001_core.sql")
    storage.close()
    
    yield path
    
    # Cleanup
    if os.path.exists(path):
        os.remove(path)


@pytest.fixture
def temp_dir():
    """Create temporary directory for exports"""
    temp_path = tempfile.mkdtemp()
    yield temp_path
    shutil.rmtree(temp_path)


def test_migration_status(temp_db):
    """Test: Get migration status"""
    migrator = Migrator(temp_db)
    
    status = migrator.get_status()
    
    assert "current_version" in status
    assert "latest_version" in status
    assert "pending_migrations" in status
    assert status["current_version"] == 0  # Fresh database


def test_migration_apply(temp_db):
    """Test: Apply a migration"""
    migrator = Migrator(temp_db)
    
    # Add test migration
    test_migration = Migration(
        version=2,
        name="Add test column",
        up_sql="ALTER TABLE identities ADD COLUMN test_field TEXT DEFAULT 'test';",
        down_sql="-- SQLite doesn't support DROP COLUMN easily"
    )
    migrator.add_migration(test_migration)
    
    # Apply migration
    result = migrator.migrate()
    
    assert result["status"] == "success"
    assert len(result["results"]) > 0
    
    # Verify version was updated
    status = migrator.get_status()
    assert status["current_version"] == 2


def test_migration_dry_run(temp_db):
    """Test: Dry run doesn't actually apply migrations"""
    migrator = Migrator(temp_db)
    
    test_migration = Migration(
        version=2,
        name="Test migration",
        up_sql="ALTER TABLE identities ADD COLUMN dry_run_test TEXT;"
    )
    migrator.add_migration(test_migration)
    
    # Dry run
    result = migrator.migrate(dry_run=True)
    
    assert result["status"] == "success"
    assert all(r["status"] == "dry_run" for r in result["results"])
    
    # Verify version didn't change
    status = migrator.get_status()
    assert status["current_version"] == 0


def test_migration_rollback(temp_db):
    """Test: Rollback a migration"""
    migrator = Migrator(temp_db)
    
    # Add migration with rollback
    test_migration = Migration(
        version=2,
        name="Test rollback",
        up_sql="ALTER TABLE identities ADD COLUMN rollback_test TEXT;",
        down_sql="""
        CREATE TABLE identities_new AS SELECT id, metadata, created_at, updated_at FROM identities;
        DROP TABLE identities;
        ALTER TABLE identities_new RENAME TO identities;
        """
    )
    migrator.add_migration(test_migration)
    
    # Apply migration
    migrator.migrate()
    assert migrator.history.get_current_version() == 2
    
    # Rollback
    result = migrator.rollback(steps=1)
    
    assert result["status"] == "success"
    assert len(result["results"]) > 0
    
    # Verify version rolled back
    assert migrator.history.get_current_version() == 0


def test_migration_integrity_check(temp_db):
    """Test: Database integrity validation"""
    migrator = Migrator(temp_db)
    
    integrity = migrator.validate_integrity()
    
    assert "status" in integrity
    assert "issues" in integrity
    assert integrity["status"] == "valid"  # Fresh database should be valid


def test_export_json_complete(temp_db, temp_dir):
    """Test: Export complete database to JSON"""
    # Create test data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Export Test"})
    
    reflection_id = storage.create_reflection(
        content="Test reflection for export",
        identity_id=identity_id
    )
    
    storage.create_mirrorback(
        reflection_id=reflection_id,
        content="Test mirrorback",
        llm_provider="mock",
        llm_model="test"
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
    assert len(data["identities"][0]["mirrorbacks"]) == 1


def test_export_json_identity_scoped(temp_db, temp_dir):
    """Test: Export specific identity only"""
    # Create multiple identities
    storage = SQLiteStorage(temp_db)
    
    identity1 = storage.create_identity(metadata={"name": "User 1"})
    identity2 = storage.create_identity(metadata={"name": "User 2"})
    
    storage.create_reflection(content="User 1 reflection", identity_id=identity1)
    storage.create_reflection(content="User 2 reflection", identity_id=identity2)
    
    storage.close()
    
    # Export only identity1
    exporter = DataExporter(temp_db)
    output_file = os.path.join(temp_dir, "export_identity1.json")
    result = exporter.export_to_json(output_file, identity_id=identity1)
    
    assert result["status"] == "success"
    assert result["identities_exported"] == 1
    
    # Verify only identity1 data
    with open(output_file, 'r') as f:
        data = json.load(f)
    
    assert len(data["identities"]) == 1
    assert data["identities"][0]["id"] == identity1


def test_export_markdown(temp_db, temp_dir):
    """Test: Export to human-readable Markdown"""
    # Create test data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Markdown Test"})
    
    reflection_id = storage.create_reflection(
        content="Test reflection for markdown export",
        identity_id=identity_id,
        tags="test,export"
    )
    
    storage.create_mirrorback(
        reflection_id=reflection_id,
        content="Test mirrorback response",
        llm_provider="mock"
    )
    
    storage.close()
    
    # Export to markdown
    exporter = DataExporter(temp_db)
    result = exporter.export_to_markdown(temp_dir, identity_id=identity_id)
    
    assert result["status"] == "success"
    assert result["identities_exported"] == 1
    assert len(result["files"]) > 0
    
    # Verify files exist
    identity_dir = os.path.join(temp_dir, f"identity_{identity_id[:8]}")
    assert os.path.exists(os.path.join(identity_dir, "reflections.md"))
    assert os.path.exists(os.path.join(identity_dir, "patterns.md"))
    assert os.path.exists(os.path.join(identity_dir, "tensions.md"))
    assert os.path.exists(os.path.join(identity_dir, "README.md"))
    
    # Verify markdown content
    with open(os.path.join(identity_dir, "reflections.md"), 'r') as f:
        content = f.read()
        assert "Test reflection for markdown export" in content
        assert "Test mirrorback response" in content


def test_backup_creation(temp_db, temp_dir):
    """Test: Create complete backup archive"""
    # Create test data
    storage = SQLiteStorage(temp_db)
    storage.create_identity(metadata={"name": "Backup Test"})
    storage.close()
    
    # Create backup
    exporter = DataExporter(temp_db)
    backup_file = os.path.join(temp_dir, "backup.zip")
    result = exporter.create_backup(backup_file, include_database=True)
    
    assert result["status"] == "success"
    assert os.path.exists(backup_file)
    assert result["file_size_bytes"] > 0
    
    # Verify backup contents
    import zipfile
    with zipfile.ZipFile(backup_file, 'r') as zipf:
        files = zipf.namelist()
        assert "mirror.db" in files
        assert "export.json" in files
        assert "backup_metadata.json" in files


def test_import_json(temp_db, temp_dir):
    """Test: Import data from JSON export"""
    # Create and export data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Import Test"})
    storage.create_reflection(
        content="Test reflection for import",
        identity_id=identity_id
    )
    storage.close()
    
    exporter = DataExporter(temp_db)
    export_file = os.path.join(temp_dir, "export.json")
    exporter.export_to_json(export_file)
    
    # Create new database
    fd, new_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    
    try:
        # Initialize new database
        new_storage = SQLiteStorage(new_db, schema_path="mirror_os/schemas/sqlite/001_core.sql")
        new_storage.close()
        
        # Import data
        importer = DataImporter(new_db)
        result = importer.import_from_json(export_file, merge=False)
        
        assert result["status"] == "success"
        assert result["identities_imported"] == 1
        assert result["reflections_imported"] == 1
        
        # Verify data was imported
        verify_storage = SQLiteStorage(new_db)
        identity = verify_storage.get_identity(identity_id)
        assert identity is not None
        assert identity["metadata"] == '{"name": "Import Test"}'
        
        reflections = verify_storage.get_reflections_for_identity(identity_id)
        assert len(reflections) == 1
        
        verify_storage.close()
    
    finally:
        if os.path.exists(new_db):
            os.remove(new_db)


def test_export_import_roundtrip(temp_db, temp_dir):
    """Test: Export and import maintains data integrity"""
    # Create comprehensive test data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Roundtrip Test", "version": "1.0"})
    
    # Multiple reflections
    for i in range(3):
        reflection_id = storage.create_reflection(
            content=f"Reflection {i+1}",
            identity_id=identity_id,
            visibility="local_only",
            tags=f"tag{i+1}"
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
        
        # Verify all data matches
        verify_storage = SQLiteStorage(new_db)
        
        identity = verify_storage.get_identity(identity_id)
        assert identity is not None
        
        reflections = verify_storage.get_reflections_for_identity(identity_id)
        assert len(reflections) == 3
        
        for i, reflection in enumerate(reflections):
            assert f"Reflection" in reflection["content"]
            
            mirrorbacks = verify_storage.get_mirrorbacks_for_reflection(reflection["id"])
            assert len(mirrorbacks) > 0
        
        verify_storage.close()
    
    finally:
        if os.path.exists(new_db):
            os.remove(new_db)


def test_backup_restore_workflow(temp_db, temp_dir):
    """Test: Complete backup and restore workflow"""
    # Create data
    storage = SQLiteStorage(temp_db)
    identity_id = storage.create_identity(metadata={"name": "Backup Restore Test"})
    storage.create_reflection(content="Test", identity_id=identity_id)
    storage.close()
    
    # Create backup
    exporter = DataExporter(temp_db)
    backup_file = os.path.join(temp_dir, "test_backup.zip")
    backup_result = exporter.create_backup(backup_file)
    
    assert backup_result["status"] == "success"
    
    # Restore to new location
    restore_dir = os.path.join(temp_dir, "restore")
    importer = DataImporter(temp_db)
    restore_result = importer.restore_from_backup(backup_file, restore_dir)
    
    assert restore_result["status"] == "success"
    assert "database_path" in restore_result
    assert os.path.exists(restore_result["database_path"])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
