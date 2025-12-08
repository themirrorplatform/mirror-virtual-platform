"""
MirrorX Engine - Evolution Engine tests
"""
import pytest
from unittest.mock import Mock, patch


def test_evolution_engine_initialization():
    """Test evolution engine initialization"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    assert engine is not None


def test_track_pattern_emergence():
    """Test tracking emergence of new patterns"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # User repeatedly reflects on work stress
    reflections = [
        "Work is overwhelming again",
        "I'm stressed about work deadlines",
        "Work pressure is getting to me"
    ]
    
    for reflection in reflections:
        engine.process_reflection(user_id, reflection)
    
    patterns = engine.get_patterns(user_id)
    
    assert len(patterns) > 0
    # Should identify "work stress" pattern
    assert any("work" in p.lower() or "stress" in p.lower() for p in patterns)


def test_detect_belief_shift():
    """Test detecting shifts in beliefs over time"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # Initial belief
    engine.process_reflection(user_id, "Success means climbing the corporate ladder")
    initial_state = engine.get_identity_state(user_id)
    
    # Shift in belief
    engine.process_reflection(user_id, "Success means having work-life balance")
    new_state = engine.get_identity_state(user_id)
    
    shift = engine.detect_shift(initial_state, new_state)
    
    assert shift is not None
    assert shift["type"] in ["belief_shift", "value_reorientation"]


def test_identify_regression():
    """Test identifying regression patterns"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # User keeps returning to same worry
    reflections = [
        "I'm worried I'm not good enough",
        "Things are going well",
        "I'm worried I'm not good enough again",
        "Making progress",
        "Back to feeling inadequate"
    ]
    
    for reflection in reflections:
        engine.process_reflection(user_id, reflection)
    
    regressions = engine.detect_regressions(user_id)
    
    assert len(regressions) > 0
    assert regressions[0]["type"] in ["loop", "self_attack"]


def test_calculate_growth_metrics():
    """Test calculating growth and evolution metrics"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # Process series of reflections
    reflections = [
        "I don't understand why I feel this way",
        "I'm starting to see a pattern",
        "I realize this connects to my childhood",
        "I can now predict when this feeling arises",
        "I'm choosing a different response now"
    ]
    
    for i, reflection in enumerate(reflections):
        engine.process_reflection(user_id, reflection, timestamp=i)
    
    metrics = engine.calculate_growth_metrics(user_id)
    
    assert "self_awareness_trend" in metrics
    assert "pattern_recognition" in metrics
    # Should show positive growth trajectory
    assert metrics["self_awareness_trend"] > 0


def test_identify_breakthrough_moment():
    """Test identifying breakthrough moments"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # Series of confused reflections followed by clarity
    engine.process_reflection(user_id, "I'm so confused about everything")
    engine.process_reflection(user_id, "Nothing makes sense")
    engine.process_reflection(user_id, "Oh! I just realized the pattern - I always do this when I'm afraid of change")
    
    breakthroughs = engine.identify_breakthroughs(user_id)
    
    assert len(breakthroughs) > 0


def test_predict_next_reflection_theme():
    """Test predicting themes for next reflection"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    # User has been reflecting on relationships
    reflections = [
        "My relationship with my partner feels distant",
        "I realize I've been avoiding difficult conversations",
        "Communication is harder than I thought"
    ]
    
    for reflection in reflections:
        engine.process_reflection(user_id, reflection)
    
    predictions = engine.predict_next_themes(user_id)
    
    assert len(predictions) > 0
    # Should predict continued relationship/communication themes


def test_evolution_event_logging():
    """Test logging significant evolution events"""
    from app.evolution_engine import EvolutionEngine
    
    engine = EvolutionEngine()
    user_id = "test-user"
    
    event = {
        "type": "pattern_recognized",
        "description": "User identified recurring avoidance pattern",
        "confidence": 0.85
    }
    
    engine.log_evolution_event(user_id, event)
    
    events = engine.get_evolution_events(user_id)
    
    assert len(events) > 0
    assert events[-1]["type"] == "pattern_recognized"
