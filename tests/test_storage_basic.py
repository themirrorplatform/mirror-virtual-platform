# tests/test_storage_basic.py
"""
Basic tests for Mirror OS storage layer.

Tests core CRUD operations and data integrity.
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage

def test_storage_initialization():
    """Test database initialization."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Check schema version
        version = storage.get_schema_version()
        print(f"✓ Schema version: {version}")
        
        # Check stats (should be empty)
        stats = storage.get_stats()
        print(f"✓ Initial stats: {stats}")
        assert stats['identities'] == 0

def test_identity_crud():
    """Test identity CRUD operations."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Create identity
        identity_id = storage.create_identity(
            metadata={"name": "Test User", "created_via": "test"}
        )
        print(f"✓ Created identity: {identity_id}")
        
        # Get identity
        identity = storage.get_identity(identity_id)
        assert identity is not None
        assert identity['metadata']['name'] == "Test User"
        print(f"✓ Retrieved identity: {identity['id']}")
        
        # Update identity
        storage.update_identity(identity_id, {"name": "Updated User"})
        identity = storage.get_identity(identity_id)
        assert identity['metadata']['name'] == "Updated User"
        print(f"✓ Updated identity")
        
        # List identities
        identities = storage.list_identities()
        assert len(identities) == 1
        print(f"✓ Listed identities: {len(identities)}")

def test_reflection_flow():
    """Test complete reflection flow."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Create identity
        identity_id = storage.create_identity()
        
        # Create reflection
        reflection_id = storage.create_reflection(
            content="I'm feeling torn between wanting control and surrendering to the process.",
            identity_id=identity_id,
            visibility="local_only",
            content_type="text"
        )
        print(f"✓ Created reflection: {reflection_id}")
        
        # Get reflection
        reflection = storage.get_reflection(reflection_id)
        assert reflection is not None
        assert "torn between" in reflection['content']
        print(f"✓ Retrieved reflection")
        
        # Create mirrorback
        mirrorback_id = storage.create_mirrorback(
            reflection_id=reflection_id,
            content="I notice this tension between control and surrender in your words...",
            engine_version="1.0.0",
            metadata={"model": "llama-3-8b", "duration_ms": 1234}
        )
        print(f"✓ Created mirrorback: {mirrorback_id}")
        
        # List mirrorbacks
        mirrorbacks = storage.list_mirrorbacks(reflection_id)
        assert len(mirrorbacks) == 1
        print(f"✓ Listed mirrorbacks: {len(mirrorbacks)}")
        
        # List reflections
        reflections = storage.list_reflections(identity_id=identity_id)
        assert len(reflections) == 1
        print(f"✓ Listed reflections: {len(reflections)}")

def test_tension_tracking():
    """Test tension creation and updates."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Create identity
        identity_id = storage.create_identity()
        
        # Create tension
        tension_id = storage.create_tension(
            name="Control vs Surrender",
            axis_a="Control",
            axis_b="Surrender",
            identity_id=identity_id,
            position=0.5,  # Leaning toward surrender
            intensity=0.8,  # Strongly felt
            origin="user_created"
        )
        print(f"✓ Created tension: {tension_id}")
        
        # Get tension
        tension = storage.get_tension(tension_id)
        assert tension is not None
        assert tension['position'] == 0.5
        assert tension['intensity'] == 0.8
        print(f"✓ Retrieved tension")
        
        # Update tension position
        storage.update_tension(
            tension_id,
            position=-0.3,  # Now leaning toward control
            intensity=0.6
        )
        tension = storage.get_tension(tension_id)
        assert tension['position'] == -0.3
        print(f"✓ Updated tension position")
        
        # List tensions
        tensions = storage.list_tensions(identity_id=identity_id)
        assert len(tensions) == 1
        print(f"✓ Listed tensions: {len(tensions)}")

def test_thread_management():
    """Test thread and reflection grouping."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Create identity
        identity_id = storage.create_identity()
        
        # Create thread
        thread_id = storage.create_thread(
            identity_id=identity_id,
            title="Morning reflections"
        )
        print(f"✓ Created thread: {thread_id}")
        
        # Create reflections
        ref1 = storage.create_reflection("First thought", identity_id=identity_id)
        ref2 = storage.create_reflection("Second thought", identity_id=identity_id)
        ref3 = storage.create_reflection("Third thought", identity_id=identity_id)
        
        # Add to thread
        storage.add_reflection_to_thread(thread_id, ref1)
        storage.add_reflection_to_thread(thread_id, ref2)
        storage.add_reflection_to_thread(thread_id, ref3)
        print(f"✓ Added 3 reflections to thread")
        
        # List reflections in thread
        thread_reflections = storage.list_reflections(thread_id=thread_id)
        assert len(thread_reflections) == 3
        print(f"✓ Retrieved thread reflections: {len(thread_reflections)}")
        
        # Update thread status
        storage.update_thread(thread_id, status="archived")
        thread = storage.get_thread(thread_id)
        assert thread['status'] == "archived"
        print(f"✓ Updated thread status")

def test_engine_telemetry():
    """Test engine run logging."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Create identity and reflection
        identity_id = storage.create_identity()
        reflection_id = storage.create_reflection("Test", identity_id=identity_id)
        
        # Log engine run
        run_id = storage.log_engine_run(
            reflection_id=reflection_id,
            config_version="1.0.0",
            engine_mode="local_llm",
            patterns=["pattern1", "pattern2"],
            tensions_surfaced=["tension1"],
            duration_ms=1500,
            model_name="llama-3-8b",
            sync_allowed=False
        )
        print(f"✓ Logged engine run: {run_id}")
        
        # Log feedback
        feedback_id = storage.log_engine_feedback(
            engine_run_id=run_id,
            rating=4,
            flags=["missed_tension"],
            notes="Good but missed one tension",
            sync_allowed=False
        )
        print(f"✓ Logged feedback: {feedback_id}")
        
        # List engine runs
        runs = storage.list_engine_runs(reflection_id=reflection_id)
        assert len(runs) == 1
        print(f"✓ Listed engine runs: {len(runs)}")
        
        # List feedback
        feedback = storage.list_engine_feedback(engine_run_id=run_id)
        assert len(feedback) == 1
        assert feedback[0]['rating'] == 4
        print(f"✓ Listed feedback: {len(feedback)}")

def test_settings():
    """Test settings storage."""
    schema_path = "mirror_os/schemas/sqlite/001_core.sql"
    
    with SQLiteStorage(":memory:", schema_path=schema_path) as storage:
        # Set settings
        storage.set_setting("theme", "dark")
        storage.set_setting("engine_mode", "local_llm")
        storage.set_setting("sync_enabled", False)
        print(f"✓ Set settings")
        
        # Get settings
        theme = storage.get_setting("theme")
        assert theme == "dark"
        print(f"✓ Retrieved setting: theme={theme}")
        
        # List all settings
        settings = storage.list_settings()
        assert settings['theme'] == "dark"
        assert settings['sync_enabled'] == False
        print(f"✓ Listed all settings: {len(settings)} keys")


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Mirror OS Storage Layer")
    print("=" * 60)
    
    try:
        print("\n1. Testing storage initialization...")
        test_storage_initialization()
        
        print("\n2. Testing identity CRUD...")
        test_identity_crud()
        
        print("\n3. Testing reflection flow...")
        test_reflection_flow()
        
        print("\n4. Testing tension tracking...")
        test_tension_tracking()
        
        print("\n5. Testing thread management...")
        test_thread_management()
        
        print("\n6. Testing engine telemetry...")
        test_engine_telemetry()
        
        print("\n7. Testing settings...")
        test_settings()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
