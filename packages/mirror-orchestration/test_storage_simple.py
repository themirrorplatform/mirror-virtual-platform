"""
Simple Storage Test - Direct imports without package installation

Tests the storage bridge integration directly.
"""

import asyncio
import sys
from pathlib import Path
import tempfile
import sqlite3

# Direct imports from local files
sys.path.insert(0, str(Path(__file__).parent))

# Import modules directly to avoid relative import issues
import importlib.util

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

base_path = Path(__file__).parent

# Load in dependency order
session_mod = load_module("session", base_path / "session.py")
runtime_mod = load_module("runtime", base_path / "runtime.py")
storage_mod = load_module("storage_bridge", base_path / "storage_bridge.py")
pipeline_mod = load_module("pipeline", base_path / "pipeline.py")

# Import what we need
StorageBridge = storage_mod.StorageBridge
StorageConfig = storage_mod.StorageConfig
StorageType = storage_mod.StorageType
PipelineContext = pipeline_mod.PipelineContext
create_default_pipeline = pipeline_mod.create_default_pipeline
SessionManager = session_mod.SessionManager
SessionConfig = session_mod.SessionConfig


async def test_storage_integration():
    """Test storage bridge integration"""
    print("\n" + "="*70)
    print("Storage Integration Test")
    print("="*70)
    with tempfile.TemporaryDirectory() as tmpdir:
        db_dir = Path(tmpdir) / "db"
        db_dir.mkdir(parents=True, exist_ok=True)
        print(f"\nTest DB dir: {db_dir}")

        # Step 1: Initialize storage bridge
        print("\n[1] Initialize Storage Bridge...")
        try:
            config = StorageConfig(
                storage_type=StorageType.SQLITE,
                db_path=str(db_dir),
                encryption_enabled=False,
            )

            bridge = StorageBridge(config)
            await bridge.initialize()
            print("✓ Storage bridge initialized")

        except Exception as e:
            print(f"✗ Failed: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Step 2: Save a reflection
        print("\n[2] Save Reflection...")
        try:
            reflection = await bridge.save_reflection(
                user_id="test_user",
                session_id="test_session",
                user_input="I've been feeling more productive lately.",
                ai_response="That's an interesting observation. What factors do you think contribute to that?",
                patterns=["productivity", "self-awareness"],
                tensions=[],
            )
            print(f"✓ Reflection saved: {reflection.id}")
            print(f"  Input: {reflection.user_input[:50]}...")
            print(f"  Response: {reflection.ai_response[:50]}...")

        except Exception as e:
            print(f"✗ Failed: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Step 3: Verify in SQLite
        print("\n[3] Verify SQLite Storage...")
        try:
            db_file = db_dir / "mirror.db"
            if not db_file.exists():
                print(f"✗ Database file not found: {db_file}")
                return False

            print(f"✓ Database file created: {db_file}")
            size_kb = db_file.stat().st_size / 1024
            print(f"  Size: {size_kb:.1f} KB")

            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM reflections")
            count = cursor.fetchone()[0]
            print(f"✓ Reflections in DB: {count}")

            cursor.execute("SELECT content, response FROM reflections LIMIT 1")
            row = cursor.fetchone()
            if row:
                print(f"  Stored input: {row[0][:50]}...")
                print(f"  Stored response: {row[1][:50]}...")

            conn.close()
            
        except Exception as e:
            print(f"✗ Failed: {e}")
            conn = sqlite3.connect(db_file)
            traceback.print_exc()
            return False
        
        # Step 4: Pipeline with storage
        print("\n[4] Pipeline with Storage...")
        try:
            pipeline = create_default_pipeline()
            
            context = PipelineContext(
                user_id="test_user",
                session_id="test_session_2",
                user_input="Another test reflection",
                storage_bridge=bridge,
            )
            
            result = await pipeline.execute(context)
            print(f"✓ Pipeline executed: {result.status.value}")
            
            # Check if reflection was saved
            conn = sqlite3.connect(db_dir / "mirror.db")
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM reflections")
            count = cursor.fetchone()[0]
            print(f"✓ Total reflections now: {count}")
            conn.close()
            
            if count >= 2:
                print("✓ Pipeline saved reflection to storage")
            else:
                print("✗ Pipeline did not save reflection")
                return False
            
        except Exception as e:
            print(f"✗ Failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Clean up
        await bridge.close()
        
        print("\n" + "="*70)
        print("ALL TESTS PASSED ✓")
        print("="*70)
        print("""
Complete flow verified:
  ✓ Storage bridge initialization
  ✓ Direct reflection saving
  ✓ SQLite persistence
  ✓ Pipeline with storage integration
        """)
        
        return True


if __name__ == "__main__":
    success = asyncio.run(test_storage_integration())
    sys.exit(0 if success else 1)
