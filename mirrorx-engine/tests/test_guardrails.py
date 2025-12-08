"""
MirrorX Engine - Guardrails and safety tests
"""
import pytest
from unittest.mock import Mock, patch


def test_guardrails_block_harmful_content():
    """Test that guardrails block harmful content"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    harmful_texts = [
        "I want to hurt myself",
        "Detailed plan for self-harm",
        "Instructions for dangerous activity"
    ]
    
    for text in harmful_texts:
        result = guardrails.check(text)
        assert result["blocked"] is True
        assert result["severity"] in ["warning", "critical"]


def test_guardrails_allow_safe_content():
    """Test that guardrails allow safe reflective content"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    safe_text = "I'm feeling really down today and need to process these emotions"
    result = guardrails.check(safe_text)
    
    assert result["blocked"] is False


def test_detect_judgment_in_response():
    """Test detection of judgment in mirrorback responses"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    judgmental_responses = [
        "You're being irrational",
        "That's a stupid way to think",
        "You should know better"
    ]
    
    for response in judgmental_responses:
        result = guardrails.check_mirrorback_quality(response)
        assert result["has_judgment"] is True
        assert result["passes_mirrorcore"] is False


def test_detect_advice_giving():
    """Test detection of advice in mirrorback (violates MirrorCore)"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    advice_responses = [
        "You should just leave that job",
        "Here's what you need to do",
        "The answer is to stop caring"
    ]
    
    for response in advice_responses:
        result = guardrails.check_mirrorback_quality(response)
        assert result["gives_advice"] is True
        assert result["passes_mirrorcore"] is False


def test_validate_reflective_questions():
    """Test that reflective questions pass guardrails"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    good_mirrorbacks = [
        "What does freedom mean to you in this context?",
        "I'm curious about what changed between those two moments?",
        "What would it feel like if you chose differently?"
    ]
    
    for mirrorback in good_mirrorbacks:
        result = guardrails.check_mirrorback_quality(mirrorback)
        assert result["passes_mirrorcore"] is True
        assert result["has_questions"] is True


def test_safety_event_logging():
    """Test logging of safety events"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    user_id = "test-user"
    reflection = "Harmful content here"
    
    result = guardrails.check(reflection, user_id=user_id)
    
    if result["blocked"]:
        events = guardrails.get_safety_events(user_id)
        assert len(events) > 0


def test_bias_detection():
    """Test detection of bias in reflections"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    biased_reflections = [
        "All politicians are corrupt",
        "Women are too emotional",
        "Men don't have real feelings"
    ]
    
    for reflection in biased_reflections:
        result = guardrails.check_for_bias(reflection)
        assert len(result["potential_biases"]) > 0


def test_regression_marker_detection():
    """Test detection of regression patterns"""
    from app.guardrails import Guardrails
    
    guardrails = Guardrails()
    
    user_id = "test-user"
    
    # User repeatedly expresses same self-attack
    reflections = [
        "I'm such a failure",
        "I never do anything right",
        "I'm worthless",
        "I'm a complete failure"
    ]
    
    for reflection in reflections:
        guardrails.check_regression(user_id, reflection)
    
    markers = guardrails.get_regression_markers(user_id)
    
    assert len(markers) > 0
    assert markers[0]["kind"] in ["loop", "self_attack"]
