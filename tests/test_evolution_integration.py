# tests/test_evolution_integration.py
"""
Integration test for Evolution Engine with Conductor

Tests the complete pipeline with evolution tracking.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import tempfile
import sqlite3

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirrorx.evolution_engine import EvolutionEngine, IdentityDelta
from mirror_os.identity_graph_builder import IdentityGraphBuilder
from mirror_os.archive import MirrorArchive


def setup_test_db():
    """Create temporary database for testing"""
    db_path = Path(tempfile.mktemp(suffix=".db"))
    
    with sqlite3.connect(db_path) as conn:
        # Create reflections table
        conn.execute("""
            CREATE TABLE reflections (
                id INTEGER PRIMARY KEY,
                identity_id TEXT,
                content TEXT,
                mirrorback TEXT,
                created_at TEXT,
                metadata TEXT
            )
        """)
        
        # Create identity_graph table
        conn.execute("""
            CREATE TABLE identity_graph (
                id INTEGER PRIMARY KEY,
                identity_id TEXT,
                concept_a TEXT,
                concept_b TEXT,
                relationship TEXT,
                strength REAL,
                first_observed TEXT,
                last_observed TEXT,
                observation_count INTEGER
            )
        """)
        
        # Create archive table
        conn.execute("""
            CREATE TABLE archive (
                id INTEGER PRIMARY KEY,
                identity_id TEXT,
                semantic_summary TEXT,
                themes TEXT,
                tensions TEXT,
                time_period_start TEXT,
                time_period_end TEXT,
                reflection_ids TEXT,
                created_at TEXT
            )
        """)
        
        conn.commit()
    
    return db_path


def test_evolution_integration():
    print("\n" + "=" * 80)
    print("Evolution Engine Integration Test")
    print("=" * 80)
    
    # Setup
    db_path = setup_test_db()
    evolution_engine = EvolutionEngine()
    graph_builder = IdentityGraphBuilder(db_path)
    archive = MirrorArchive(db_path)
    
    identity_id = "test-user-123"
    
    # Add some test reflections over time
    now = datetime.utcnow()
    
    reflections = [
        {
            'time': now - timedelta(days=60),
            'content': "Feeling stressed about work deadlines and career uncertainty",
            'concepts': ['work', 'career', 'stress', 'uncertainty']
        },
        {
            'time': now - timedelta(days=45),
            'content': "Focusing on relationships and family connections",
            'concepts': ['relationships', 'family', 'connections']
        },
        {
            'time': now - timedelta(days=30),
            'content': "Exploring new growth opportunities and personal development",
            'concepts': ['growth', 'opportunities', 'development']
        },
        {
            'time': now - timedelta(days=15),
            'content': "Finding balance between work ambitions and personal fulfillment",
            'concepts': ['work', 'balance', 'fulfillment', 'identity']
        },
        {
            'time': now,
            'content': "Embracing identity changes and purpose-driven goals",
            'concepts': ['identity', 'purpose', 'change', 'growth']
        }
    ]
    
    # Insert reflections into database
    with sqlite3.connect(db_path) as conn:
        for i, refl in enumerate(reflections):
            conn.execute("""
                INSERT INTO reflections (
                    identity_id, content, mirrorback, created_at, metadata
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                identity_id,
                refl['content'],
                "Mirror response",
                refl['time'].isoformat() + "Z",
                "{}"
            ))
        conn.commit()
    
    print(f"\n✓ Created {len(reflections)} test reflections")
    
    # Test 1: Build identity graph and track evolution
    print("\n1. Building identity graph and computing deltas...")
    
    previous_state = None
    deltas = []
    
    for i, refl in enumerate(reflections):
        # Add concepts to graph
        graph_builder.add_concepts(identity_id, refl['concepts'])
        
        # Get current state
        current_state = {
            'timestamp': refl['time'],
            'concepts': refl['concepts'],
            'themes': [
                {'name': c, 'theme': c, 'strength': 0.5}
                for c in refl['concepts']
            ],
            'tensions': []
        }
        
        # Compute delta
        if previous_state:
            delta = evolution_engine.compute_delta(
                identity_id,
                previous_state,
                current_state,
                refl['time']
            )
            deltas.append(delta)
            print(f"   Δ{i}: magnitude={delta.delta_magnitude:.2f}, " +
                  f"new={delta.new_concepts}, dropped={delta.dropped_concepts}")
        
        previous_state = current_state
    
    print(f"   ✓ Computed {len(deltas)} identity deltas")
    
    # Test 2: Detect concept drift
    print("\n2. Detecting concept drift...")
    
    # Get reflections for drift analysis
    reflection_states = []
    for refl in reflections:
        reflection_states.append({
            'timestamp': refl['time'],
            'concepts': refl['concepts'],
            'themes': [
                {'name': c, 'strength': 0.5}
                for c in refl['concepts']
            ],
            'tensions': []
        })
    
    drifts = evolution_engine.detect_concept_drift(
        identity_id,
        reflection_states,
        window_days=30
    )
    
    print(f"   ✓ Tracked {len(drifts)} concept drifts")
    
    for concept, drift in list(drifts.items())[:5]:
        print(f"   - {concept}: {drift.frequency_trend} " +
              f"(first: {drift.first_seen.strftime('%Y-%m-%d')}, " +
              f"current: {drift.current_strength:.2f})")
    
    # Test 3: Find inflection points
    print("\n3. Finding inflection points...")
    
    inflection_points = evolution_engine.detect_inflection_points(
        identity_id,
        magnitude_threshold=0.3
    )
    
    print(f"   ✓ Found {len(inflection_points)} inflection points")
    
    for ip in inflection_points:
        print(f"   - {ip.timestamp.strftime('%Y-%m-%d')}: {ip.description}")
        print(f"     Magnitude: {ip.magnitude:.2f}")
    
    # Test 4: Compute evolution metrics
    print("\n4. Computing evolution metrics...")
    
    metrics = evolution_engine.compute_evolution_metrics(
        identity_id,
        reflection_states,
        period_days=90
    )
    
    print(f"   ✓ Evolution metrics computed:")
    print(f"   - Total reflections: {metrics.total_reflections}")
    print(f"   - Unique concepts: {metrics.unique_concepts}")
    print(f"   - Concept stability: {metrics.concept_stability:.2f}")
    print(f"   - Evolution velocity: {metrics.evolution_velocity:.2f}")
    print(f"   - Dominant themes: {', '.join(metrics.dominant_themes[:3])}")
    print(f"   - Emerging themes: {', '.join(metrics.emerging_themes[:3])}")
    print(f"   - Fading themes: {', '.join(metrics.fading_themes[:3])}")
    
    # Test 5: Verify identity graph state retrieval
    print("\n5. Testing identity graph state retrieval...")
    
    state = graph_builder.get_identity_state(identity_id)
    
    print(f"   ✓ Retrieved identity state:")
    print(f"   - Concepts: {len(state['concepts'])}")
    print(f"   - Themes: {len(state['themes'])}")
    print(f"   - Tensions: {len(state['tensions'])}")
    
    # Cleanup
    try:
        db_path.unlink()
    except (PermissionError, OSError):
        pass  # Windows file locking - non-critical
    
    print("\n" + "=" * 80)
    print("✅ All evolution integration tests PASSED")
    print("=" * 80)


if __name__ == "__main__":
    test_evolution_integration()
