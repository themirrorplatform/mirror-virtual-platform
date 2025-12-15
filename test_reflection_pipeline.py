"""
Test the complete reflection pipeline end-to-end.
"""

from mirrorcore.engine.reflect import ReflectionEngine
from mirrorcore.config.settings import EngineSettings
from mirrorcore.storage.local_db import LocalDB
import tempfile
import os
import asyncio


async def test_reflection_pipeline():
    """Test complete reflection flow with all components."""
    
    # Setup temporary database
    with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as tmp:
        db_path = tmp.name
    
    try:
        # Initialize components
        settings = EngineSettings(
            engine_mode='manual',  # Use manual mode for testing
            mirror_mode='local'
        )
        
        db = LocalDB(db_path)
        engine = ReflectionEngine(db, settings)
        
        # Create identity
        identity_id = db.create_identity(
            metadata={
                "name": "Test User",
                "sovereignty_mode": "sovereign"
            }
        )
        print(f"✅ Created identity: {identity_id}")
        
        # Test reflection
        user_text = """
        I've been thinking a lot about how technology shapes our identity.
        Sometimes I wonder if we're losing touch with who we really are.
        """
        
        result = await engine.reflect(
            text=user_text,
            identity_id=identity_id,
            context={"source": "test"}
        )
        
        print(f"\n✅ Reflection completed successfully!")
        print(f"Reflection ID: {result['reflection_id']}")
        print(f"Run ID: {result['run_id']}")
        print(f"Constitutional flags: {result['flags']}")
        print(f"Duration: {result['duration_ms']}ms")
        print(f"Mirrorback preview: {result['mirrorback'][:200]}...")
        
        # Verify in database
        reflection = db.get_reflection(result['reflection_id'])
        assert reflection is not None
        print(f"\n✅ Reflection stored in database")
        print(f"Status: {reflection.get('status', 'N/A')}")
        
        # Check stats
        stats = db.get_stats()
        print(f"\n📊 Stats:")
        print(f"  Total reflections: {stats.get('total_reflections', 0)}")
        print(f"  Total mirrorbacks: {stats.get('total_mirrorbacks', 0)}")
        
        print(f"\n🎉 Complete pipeline test PASSED!")
        
    finally:
        # Cleanup
        db.close()
        if os.path.exists(db_path):
            try:
                os.unlink(db_path)
            except PermissionError:
                print(f"Warning: Could not delete {db_path} (in use)")


if __name__ == "__main__":
    asyncio.run(test_reflection_pipeline())
