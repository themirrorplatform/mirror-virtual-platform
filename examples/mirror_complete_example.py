# examples/mirror_complete_example.py
"""
Complete Mirror Platform Integration Example

Demonstrates end-to-end flow:
1. Initialize storage + LLM
2. Create reflection
3. Generate mirrorback
4. Detect patterns and tensions
5. Track evolution over time
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirrorcore.models.local_llm import LocalLLM
from mirrorx_engine.app.engine import MirrorXEngine

def main():
    print("=" * 70)
    print("Mirror Platform - Complete Integration Example")
    print("=" * 70)
    
    # ========================================================================
    # SETUP
    # ========================================================================
    
    print("\n1. Initializing components...")
    
    # Initialize storage (in-memory for demo)
    storage = SQLiteStorage(
        ":memory:",
        schema_path="mirror_os/schemas/sqlite/001_core.sql"
    )
    print("   ✓ Storage initialized")
    
    # Initialize LLM (would use actual model in production)
    # For demo, we'll use a mock LLM
    class MockLLM:
        """Mock LLM for demonstration (replace with LocalLLM in production)"""
        model_name = "mock-llm"
        temperature = 0.7
        max_tokens = 1024
        constitutional_mode = "strict"
        
        def generate_mirrorback(self, reflection, context=None, system_prompt=None):
            from mirrorcore.models.base import LLMResponse
            
            # Simple reflection-based response
            content = f"I notice you're experiencing {reflection[:50]}... "
            content += "This seems to hold a tension worth exploring."
            
            return LLMResponse(
                content=content,
                patterns=["self-reflection"],
                tensions=[{"name": "Being vs Doing", "axis_a": "Being", "axis_b": "Doing"}],
                constitutional_flags=[],
                metadata={"model": "mock"}
            )
        
        def detect_patterns(self, reflections, existing_patterns=None):
            return [{
                "name": "Recurring self-reflection",
                "description": "Regular check-ins with inner state",
                "occurrences": len(reflections),
                "confidence": 0.8
            }]
        
        def detect_tensions(self, reflection, known_tensions=None):
            return [{
                "name": "Control vs Surrender",
                "axis_a": "Control",
                "axis_b": "Surrender",
                "position": 0.3,
                "intensity": 0.7,
                "confidence": 0.75
            }]
        
        def get_embeddings(self, texts):
            import numpy as np
            # Return random embeddings for demo
            return [np.random.rand(384).tolist() for _ in texts]
        
        def get_model_info(self):
            return {
                "name": "mock-llm",
                "type": "local",
                "provider": "mock",
                "capabilities": ["mirrorback_generation", "pattern_detection"]
            }
        
        def is_available(self):
            return True
        
        def shutdown(self):
            pass
    
    llm = MockLLM()
    print("   ✓ LLM initialized (mock for demo)")
    
    # Initialize engine
    engine = MirrorXEngine(
        storage=storage,
        llm=llm,
        config={
            "version": "1.0.0",
            "strict_constitutional": True,
            "pattern_similarity": 0.75,
            "telemetry_sync": False
        }
    )
    print("   ✓ MirrorX Engine initialized")
    
    # ========================================================================
    # CREATE IDENTITY
    # ========================================================================
    
    print("\n2. Creating identity...")
    identity_id = storage.create_identity(
        metadata={"name": "Demo User", "created_via": "example"}
    )
    print(f"   ✓ Identity created: {identity_id[:8]}...")
    
    # ========================================================================
    # REFLECTION FLOW
    # ========================================================================
    
    print("\n3. Creating reflections...")
    
    reflections_data = [
        "I'm feeling torn between wanting to control everything and just letting things flow. "
        "Part of me wants to plan every detail, but another part knows I need to surrender.",
        
        "Today I noticed the same pattern again - trying to force outcomes instead of trusting the process. "
        "Why is it so hard to let go?",
        
        "Interesting... when I stop trying to control, things actually work out better. "
        "But it's scary to not have a plan.",
        
        "I keep oscillating between these two states: structure and flow. "
        "Maybe they're not opposites? Maybe I need both?",
        
        "Feeling more at peace today. Starting to accept that I don't need to choose - "
        "I can hold both control and surrender at the same time."
    ]
    
    reflection_ids = []
    for i, content in enumerate(reflections_data, 1):
        reflection_id = storage.create_reflection(
            content=content,
            identity_id=identity_id,
            visibility="local_only"
        )
        reflection_ids.append(reflection_id)
        print(f"   ✓ Reflection {i}/5 created")
    
    # ========================================================================
    # PROCESS REFLECTIONS
    # ========================================================================
    
    print("\n4. Processing reflections (generating mirrorbacks)...")
    
    for i, reflection_id in enumerate(reflection_ids, 1):
        result = engine.process_reflection(
            reflection_id=reflection_id,
            identity_id=identity_id
        )
        
        print(f"\n   Reflection {i}:")
        print(f"   - Mirrorback generated: {result['mirrorback_id'][:8]}...")
        print(f"   - Patterns updated: {result['patterns_updated']}")
        print(f"   - Tensions detected: {result['tensions_detected']}")
        print(f"   - Constitutional violations: {result['constitutional_violations']}")
        print(f"   - Duration: {result['duration_ms']}ms")
    
    # ========================================================================
    # PATTERN ANALYSIS
    # ========================================================================
    
    print("\n5. Analyzing patterns...")
    
    pattern_analysis = engine.analyze_patterns(identity_id=identity_id)
    
    if pattern_analysis['status'] == 'success':
        print(f"   ✓ Detected {pattern_analysis['total_patterns']} patterns")
        
        for pattern in pattern_analysis['patterns'][:3]:
            print(f"\n   Pattern: {pattern['name']}")
            print(f"   - Occurrences: {pattern['occurrence_count']}")
            print(f"   - Confidence: {pattern['confidence']:.2f}")
            if 'evolution' in pattern:
                print(f"   - Trend: {pattern['evolution']['trend']}")
    
    # ========================================================================
    # TENSION ANALYSIS
    # ========================================================================
    
    print("\n6. Analyzing tensions...")
    
    tension_analysis = engine.analyze_tensions(identity_id=identity_id)
    
    if tension_analysis['status'] == 'success':
        print(f"   ✓ Found {tension_analysis['total_unique_tensions']} active tensions")
        
        for tension in tension_analysis['active_tensions'][:3]:
            print(f"\n   Tension: {tension['name']}")
            print(f"   - Axis: {tension['axis_a']} ↔ {tension['axis_b']}")
            print(f"   - Occurrences: {tension['occurrence_count']}")
            print(f"   - Avg Position: {tension['average_position']:.2f} (-1 to +1)")
            print(f"   - Avg Intensity: {tension['average_intensity']:.2f} (0 to 1)")
            print(f"   - Trend: {tension['trend']}")
    
    # ========================================================================
    # DASHBOARD
    # ========================================================================
    
    print("\n7. Getting dashboard...")
    
    dashboard = engine.get_dashboard(identity_id=identity_id)
    
    print(f"\n   Dashboard for identity {identity_id[:8]}...")
    print(f"   - Total reflections: {dashboard['total_reflections']}")
    print(f"   - Active tensions: {dashboard['active_tensions']}")
    print(f"   - Engine mode: {dashboard['engine_stats']['engine_mode']}")
    print(f"   - Engine version: {dashboard['engine_stats']['engine_version']}")
    
    # ========================================================================
    # STORAGE STATS
    # ========================================================================
    
    print("\n8. Storage statistics...")
    
    stats = storage.get_stats()
    print(f"   - Identities: {stats['identities']}")
    print(f"   - Reflections: {stats['reflections']}")
    print(f"   - Mirrorbacks: {stats['mirrorbacks']}")
    print(f"   - Tensions: {stats['tensions']}")
    print(f"   - Threads: {stats['threads']}")
    print(f"   - Engine runs: {stats['engine_runs']}")
    
    # ========================================================================
    # CLEANUP
    # ========================================================================
    
    print("\n9. Cleaning up...")
    storage.close()
    llm.shutdown()
    print("   ✓ Resources released")
    
    print("\n" + "=" * 70)
    print("✅ Complete integration example finished successfully!")
    print("=" * 70)
    print("\nNext steps:")
    print("- Replace MockLLM with LocalLLM(model_path='path/to/model.gguf')")
    print("- Use real database: SQLiteStorage('mirror.db', schema_path='...')")
    print("- Add error handling and logging")
    print("- Implement frontend with React/Next.js")
    print("- Add authentication and multi-user support")
    print("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
