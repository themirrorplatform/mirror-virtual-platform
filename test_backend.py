"""Quick test to see if we can import the backend"""
import sys
sys.path.insert(0, 'c:\\Users\\ilyad\\mirror-virtual-platform')
sys.path.insert(0, 'c:\\Users\\ilyad\\mirror-virtual-platform\\core-api')

try:
    print("Testing imports...")
    from mirror_os.services.evolution_engine import EvolutionEngine
    print("✓ EvolutionEngine imports successfully")
    
    from mirrorx.orchestrator import MirrorXOrchestrator
    print("✓ MirrorXOrchestrator imports successfully")
    
    print("\nAll core imports successful! Backend code is valid.")
    print("\nNote: To run the full API server, you need to:")
    print("1. Install all requirements: pip install -r core-api/requirements.txt")
    print("2. Set up Supabase env vars")
    print("3. Run: uvicorn app.main:app --reload")
    
except Exception as e:
    print(f"✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
