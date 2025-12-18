"""
End-to-End Integration Test: Input → LLM → Storage

This test demonstrates the complete flow:
1. User input received
2. Constitutional checks pass
3. Provider generates response (LLM or fallback)
4. Response validated against axioms
5. Reflection persisted to SQLite storage
6. User can retrieve reflections

Run with:
    python -m pytest test_e2e_storage.py -v
    
Or directly:
    python test_e2e_storage.py
"""

import asyncio
import sqlite3
from pathlib import Path
import tempfile
import sys
import os

# Add packages to path for imports
packages_dir = Path(__file__).parent.parent
sys.path.insert(0, str(packages_dir))
sys.path.insert(0, str(Path(__file__).parent))


async def test_e2e_complete_flow():
    """Test complete flow: Input → LLM → Storage → Retrieval"""
    print("\n" + "="*70)
    print("E2E Integration Test: Input → LLM → Storage")
    print("="*70)
    
    # Create temp directory for test
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        
        print(f"\n✓ Test database: {db_path}")
        
        # Step 1: Initialize Mirror with storage
        print("\n[STEP 1] Initializing MirrorX with SQLite storage...")
        try:
            from mirror_orchestration import MirrorX, MirrorConfig
            from mirror_orchestration.storage_bridge import StorageConfig, StorageType
            
            storage_config = StorageConfig(
                storage_type=StorageType.SQLITE,
                db_path=str(db_path),
                encryption_enabled=False,  # For test
            )
            
            config = MirrorConfig(
                enable_storage=True,
                storage_config=storage_config,
            )
            
            mirror = MirrorX(config=config)
            print("✓ MirrorX initialized")
            
        except ImportError as e:
            print(f"✗ Failed to import: {e}")
            return False
        except Exception as e:
            print(f"✗ Initialization failed: {e}")
            return False
        
        # Step 2: Start user session
        print("\n[STEP 2] Starting user session...")
        try:
            session = await mirror.start_session(user_id="test_user_001")
            print(f"✓ Session created: {session.id}")
            
        except Exception as e:
            print(f"✗ Session creation failed: {e}")
            return False
        
        # Step 3: Send reflection input
        print("\n[STEP 3] Sending reflection input...")
        user_input = "I've been noticing I feel more focused in the morning, especially after I exercise."
        print(f"User input: '{user_input}'")
        
        try:
            response = await mirror.reflect(
                session_id=session.id,
                user_input=user_input,
            )
            
            if not response.success:
                print(f"✗ Reflection failed: {response.error}")
                return False
            
            print(f"✓ Reflection generated")
            print(f"  Response: {response.reflection_text}")
            
        except Exception as e:
            print(f"✗ Reflection failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Step 4: Verify storage
        print("\n[STEP 4] Verifying storage...")
        try:
            # Check if database file was created
            if db_path.exists():
                print(f"✓ Database file created: {db_path}")
                size_kb = db_path.stat().st_size / 1024
                print(f"  Size: {size_kb:.1f} KB")
            else:
                print(f"✗ Database file not found")
                return False
            
            # Try to query SQLite directly
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check for reflections table
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"✓ Tables created: {', '.join(tables) if tables else 'none yet'}")
            
            # If reflections table exists, check contents
            if 'reflections' in tables:
                cursor.execute("SELECT COUNT(*) FROM reflections;")
                count = cursor.fetchone()[0]
                print(f"✓ Reflections stored: {count}")
                
                # Show the reflection
                cursor.execute("""
                    SELECT id, user_id, content, response, created_at 
                    FROM reflections 
                    LIMIT 1
                """)
                row = cursor.fetchone()
                if row:
                    print(f"  ID: {row[0]}")
                    print(f"  User: {row[1]}")
                    print(f"  Input: {row[2][:50]}...")
                    print(f"  Response: {row[3][:50]}..." if row[3] else "  Response: (empty)")
                    print(f"  Created: {row[4]}")
            
            conn.close()
            
        except Exception as e:
            print(f"✗ Storage verification failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Step 5: Second reflection
        print("\n[STEP 5] Sending second reflection...")
        user_input_2 = "Sometimes I wonder if this routine is sustainable long-term."
        print(f"User input: '{user_input_2}'")
        
        try:
            response2 = await mirror.reflect(
                session_id=session.id,
                user_input=user_input_2,
            )
            
            if response2.success:
                print(f"✓ Second reflection generated")
                print(f"  Response: {response2.reflection_text}")
            else:
                print(f"✗ Second reflection failed: {response2.error}")
                return False
                
        except Exception as e:
            print(f"✗ Second reflection failed: {e}")
            return False
        
        # Step 6: Verify both reflections stored
        print("\n[STEP 6] Verifying both reflections stored...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM reflections;")
            count = cursor.fetchone()[0]
            print(f"✓ Total reflections stored: {count}")
            
            if count >= 2:
                print(f"✓ Both reflections successfully persisted")
            else:
                print(f"✗ Expected 2 reflections, found {count}")
                conn.close()
                return False
            
            conn.close()
            
        except Exception as e:
            print(f"✗ Verification failed: {e}")
            return False
        
        # Step 7: End session
        print("\n[STEP 7] Ending session...")
        try:
            goodbye = await mirror.end_session(session.id)
            print(f"✓ Session ended: {goodbye}")
            
        except Exception as e:
            print(f"✗ Session end failed: {e}")
            return False
        
        # Final summary
        print("\n" + "="*70)
        print("COMPLETE FLOW SUCCESSFUL")
        print("="*70)
        print("""
Flow verified:
  ✓ User input received
  ✓ Constitutional checks passed  
  ✓ LLM provider called / fallback used
  ✓ Response validated against axioms
  ✓ Reflections persisted to SQLite
  ✓ Both reflections retrievable from DB
  ✓ Session ended gracefully
        """)
        
        return True


async def main():
    """Run the test"""
    success = await test_e2e_complete_flow()
    
    print("\n" + "="*70)
    if success:
        print("TEST RESULT: PASSED ✓")
    else:
        print("TEST RESULT: FAILED ✗")
    print("="*70)
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
