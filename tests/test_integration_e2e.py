"""
Integration Tests - End-to-End Reflection Flow

Tests the complete flow: Reflection → Mirrorback → Pattern → Tension
Verifies all components work together correctly.
"""

import pytest
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "mirrorx-engine"))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from app.engine import MirrorXEngine


class MockLLM:
    """Mock LLM for testing (deterministic responses)"""
    model_name = "mock-test-llm"
    temperature = 0.7
    max_tokens = 1024
    constitutional_mode = "strict"
    
    def __init__(self):
        self.call_count = 0
    
    def generate_mirrorback(self, reflection, context=None, system_prompt=None):
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from mirrorcore.models.base import LLMResponse
        self.call_count += 1
        
        # Deterministic responses for testing
        content = f"Test mirrorback #{self.call_count}: I notice you're reflecting on {reflection[:30]}..."
        
        return LLMResponse(
            content=content,
            patterns=["self-reflection", "growth mindset"],
            tensions=[{
                "name": "Control vs Surrender",
                "axis_a": "Control",
                "axis_b": "Surrender",
                "position": 0.3,
                "intensity": 0.7
            }],
            constitutional_flags=[],
            metadata={"model": "mock", "call_count": self.call_count}
        )
    
    def detect_patterns(self, reflections, existing_patterns=None):
        return [{
            "name": "Recurring self-reflection",
            "description": "Regular introspection pattern",
            "occurrences": len(reflections),
            "confidence": 0.85
        }]
    
    def detect_tensions(self, reflection, known_tensions=None):
        return [{
            "name": "Control vs Surrender",
            "axis_a": "Control",
            "axis_b": "Surrender",
            "position": 0.3,
            "intensity": 0.7,
            "confidence": 0.8
        }]
    
    def get_embeddings(self, texts):
        import numpy as np
        return [np.random.rand(384).tolist() for _ in texts]
    
    def get_model_info(self):
        return {"name": "mock-test-llm", "type": "mock"}
    
    def is_available(self):
        return True
    
    def shutdown(self):
        pass


@pytest.fixture
def storage():
    """Create in-memory storage for testing"""
    db = SQLiteStorage(":memory:", schema_path="mirror_os/schemas/sqlite/001_core.sql")
    yield db
    db.close()


@pytest.fixture
def llm():
    """Create mock LLM for testing"""
    return MockLLM()


@pytest.fixture
def engine(storage, llm):
    """Create engine with test storage and LLM"""
    return MirrorXEngine(
        storage=storage,
        llm=llm,
        config={"version": "1.0.0", "strict_constitutional": True}
    )


def test_complete_reflection_flow(storage, engine):
    """Test: Create reflection → Generate mirrorback → Detect patterns/tensions"""
    
    # 1. Create identity
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    assert identity_id is not None
    
    # 2. Create reflection
    reflection_id = storage.create_reflection(
        content="I'm struggling with wanting to control everything while knowing I should let go.",
        identity_id=identity_id,
        visibility="local_only"
    )
    assert reflection_id is not None
    
    # 3. Process reflection (generate mirrorback, detect patterns/tensions)
    result = engine.process_reflection(
        reflection_id=reflection_id,
        identity_id=identity_id
    )
    
    assert result["status"] == "success"
    assert "mirrorback_id" in result
    assert result["patterns_updated"] >= 0
    assert result["tensions_detected"] >= 0
    assert result["duration_ms"] > 0
    
    # 4. Verify mirrorback was created
    mirrorback = storage.get_mirrorback(result["mirrorback_id"])
    assert mirrorback is not None
    assert "Test mirrorback" in mirrorback["content"]
    assert mirrorback["reflection_id"] == reflection_id
    
    # 5. Verify patterns were detected
    patterns = storage.get_patterns_for_identity(identity_id)
    assert len(patterns) > 0
    
    # 6. Verify tensions were detected
    tensions = storage.get_tensions_for_identity(identity_id)
    assert len(tensions) > 0
    assert tensions[0]["name"] == "Control vs Surrender"
    assert -1 <= tensions[0]["position"] <= 1
    assert 0 <= tensions[0]["intensity"] <= 1


def test_multiple_reflections_pattern_evolution(storage, engine):
    """Test: Multiple reflections → Pattern evolution tracking"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    reflections_content = [
        "I keep noticing the same pattern in my behavior.",
        "This recurring theme keeps appearing in my thoughts.",
        "Once again, I see this familiar pattern emerging."
    ]
    
    for content in reflections_content:
        reflection_id = storage.create_reflection(
            content=content,
            identity_id=identity_id
        )
        
        result = engine.process_reflection(
            reflection_id=reflection_id,
            identity_id=identity_id
        )
        
        assert result["status"] == "success"
    
    # Verify patterns evolved
    patterns = storage.get_patterns_for_identity(identity_id)
    assert len(patterns) > 0
    
    # Check pattern occurrences increased
    for pattern in patterns:
        occurrences = storage.get_pattern_occurrences(pattern["id"])
        assert len(occurrences) > 0


def test_tension_evolution_over_reflections(storage, engine):
    """Test: Multiple reflections → Tension position/intensity evolution"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create reflections that explore a tension
    reflections_content = [
        "I need to control every detail to feel safe.",
        "Maybe I should trust the process more.",
        "I'm learning to balance control with surrender."
    ]
    
    for content in reflections_content:
        reflection_id = storage.create_reflection(
            content=content,
            identity_id=identity_id
        )
        
        result = engine.process_reflection(
            reflection_id=reflection_id,
            identity_id=identity_id
        )
        
        assert result["status"] == "success"
    
    # Verify tension tracking
    tensions = storage.get_tensions_for_identity(identity_id)
    assert len(tensions) >= 1
    
    # Group by tension name to check evolution
    from collections import defaultdict
    tensions_by_name = defaultdict(list)
    for tension in tensions:
        tensions_by_name[tension["name"]].append(tension)
    
    # Verify we have multiple instances of at least one tension
    assert any(len(instances) > 1 for instances in tensions_by_name.values())


def test_mirrorback_regeneration(storage, engine):
    """Test: Regenerate mirrorback for existing reflection"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    reflection_id = storage.create_reflection(
        content="Original reflection content.",
        identity_id=identity_id
    )
    
    # Generate initial mirrorback
    result1 = engine.process_reflection(
        reflection_id=reflection_id,
        identity_id=identity_id
    )
    
    assert result1["status"] == "success"
    mirrorback_id_1 = result1["mirrorback_id"]
    
    # Regenerate mirrorback
    result2 = engine.process_reflection(
        reflection_id=reflection_id,
        identity_id=identity_id,
        regenerate=True
    )
    
    assert result2["status"] == "success"
    mirrorback_id_2 = result2["mirrorback_id"]
    
    # Verify new mirrorback was created
    assert mirrorback_id_1 != mirrorback_id_2
    
    # Both mirrorbacks should exist
    mirrorback1 = storage.get_mirrorback(mirrorback_id_1)
    mirrorback2 = storage.get_mirrorback(mirrorback_id_2)
    
    assert mirrorback1 is not None
    assert mirrorback2 is not None
    assert mirrorback1["content"] != mirrorback2["content"]


def test_pattern_analysis_comprehensive(storage, engine):
    """Test: Pattern analysis returns comprehensive report"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create several reflections
    for i in range(5):
        reflection_id = storage.create_reflection(
            content=f"Reflection {i+1}: Exploring recurring patterns.",
            identity_id=identity_id
        )
        engine.process_reflection(reflection_id=reflection_id, identity_id=identity_id)
    
    # Run pattern analysis
    analysis = engine.analyze_patterns(identity_id=identity_id)
    
    assert analysis["status"] == "success"
    assert "patterns" in analysis
    assert "total_patterns" in analysis
    assert analysis["total_patterns"] >= 0
    
    # Check pattern structure
    if analysis["patterns"]:
        pattern = analysis["patterns"][0]
        assert "name" in pattern
        assert "occurrence_count" in pattern
        assert "confidence" in pattern


def test_tension_analysis_comprehensive(storage, engine):
    """Test: Tension analysis returns comprehensive report"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create reflections exploring tensions
    for i in range(5):
        reflection_id = storage.create_reflection(
            content=f"Reflection {i+1}: Balancing control and surrender.",
            identity_id=identity_id
        )
        engine.process_reflection(reflection_id=reflection_id, identity_id=identity_id)
    
    # Run tension analysis
    analysis = engine.analyze_tensions(identity_id=identity_id)
    
    assert analysis["status"] == "success"
    assert "active_tensions" in analysis
    assert "total_unique_tensions" in analysis
    
    # Check tension structure
    if analysis["active_tensions"]:
        tension = analysis["active_tensions"][0]
        assert "name" in tension
        assert "axis_a" in tension
        assert "axis_b" in tension
        assert "occurrence_count" in tension
        assert "average_position" in tension
        assert "average_intensity" in tension


def test_dashboard_overview(storage, engine):
    """Test: Dashboard returns overview metrics"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create reflections
    for i in range(3):
        reflection_id = storage.create_reflection(
            content=f"Reflection {i+1}",
            identity_id=identity_id
        )
        engine.process_reflection(reflection_id=reflection_id, identity_id=identity_id)
    
    # Get dashboard
    dashboard = engine.get_dashboard(identity_id=identity_id)
    
    assert "identity_id" in dashboard
    assert "total_reflections" in dashboard
    assert "total_mirrorbacks" in dashboard
    assert "active_patterns" in dashboard
    assert "active_tensions" in dashboard
    assert "engine_stats" in dashboard
    
    assert dashboard["total_reflections"] == 3
    assert dashboard["identity_id"] == identity_id


def test_constitutional_violation_detection(storage, llm):
    """Test: Constitutional violations are detected and logged"""
    
    # Create LLM that returns directive language
    class ViolatingLLM(MockLLM):
        def generate_mirrorback(self, reflection, context=None, system_prompt=None):
            sys.path.insert(0, str(Path(__file__).parent.parent))
            from mirrorcore.models.base import LLMResponse, ConstitutionalFlag
            
            return LLMResponse(
                content="You should definitely do this. You must change your behavior.",
                patterns=[],
                tensions=[],
                constitutional_flags=[
                    ConstitutionalFlag.DIRECTIVE,
                    ConstitutionalFlag.PRESCRIPTIVE
                ],
                metadata={"model": "violating-mock"}
            )
    
    violating_llm = ViolatingLLM()
    engine = MirrorXEngine(
        storage=storage,
        llm=violating_llm,
        config={"version": "1.0.0", "strict_constitutional": True}
    )
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    reflection_id = storage.create_reflection(
        content="What should I do?",
        identity_id=identity_id
    )
    
    result = engine.process_reflection(
        reflection_id=reflection_id,
        identity_id=identity_id
    )
    
    # Should still succeed but log violations
    assert result["status"] == "success"
    assert result["constitutional_violations"] > 0


def test_thread_management_integration(storage, engine):
    """Test: Reflections can be grouped into threads"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create thread
    thread_id = storage.create_thread(
        title="Exploring Control",
        identity_id=identity_id,
        metadata={"theme": "control_surrender"}
    )
    
    # Create reflections and add to thread
    reflection_ids = []
    for i in range(3):
        reflection_id = storage.create_reflection(
            content=f"Thread reflection {i+1}",
            identity_id=identity_id
        )
        reflection_ids.append(reflection_id)
        
        # Add to thread
        storage.add_reflection_to_thread(thread_id, reflection_id)
        
        # Process reflection
        engine.process_reflection(reflection_id=reflection_id, identity_id=identity_id)
    
    # Verify thread has reflections
    thread = storage.get_thread(thread_id)
    assert thread is not None
    
    thread_reflections = storage.get_thread_reflections(thread_id)
    assert len(thread_reflections) == 3


def test_telemetry_logging(storage, engine):
    """Test: Engine runs are logged with telemetry"""
    
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    reflection_id = storage.create_reflection(
        content="Test reflection for telemetry",
        identity_id=identity_id
    )
    
    # Process reflection
    result = engine.process_reflection(
        reflection_id=reflection_id,
        identity_id=identity_id
    )
    
    assert result["status"] == "success"
    
    # Check telemetry was logged
    stats = storage.get_stats()
    assert stats["engine_runs"] > 0


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
