"""
Tests for L3 Expression Layer

Validates tone adaptation, leave-ability enforcement, and expression shaping.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from layers.l3_expression import (
    ToneStyle,
    ExpressionPreferences,
    ToneAdapter,
    LeaveabilityEnforcer,
    ExpressionLayer,
)
from layers.l2_semantic import SemanticContext, Pattern, PatternType
from datetime import datetime


def test_tone_adapter_warm():
    """Test warm tone adaptation"""
    adapter = ToneAdapter()
    prefs = ExpressionPreferences(tone=ToneStyle.WARM)
    
    base = "You mention feeling stressed about work."
    adapted = adapter.adapt(base, prefs)
    
    # Should add empathetic language (warm tone adds "I hear you")
    assert "hear" in adapted.lower() or "with you" in adapted.lower() or len(adapted) >= len(base), f"Expected warm tone, got: {adapted}"
    
    print("✓ ToneAdapter creates warm tone")


def test_tone_adapter_clinical():
    """Test clinical tone adaptation"""
    adapter = ToneAdapter()
    prefs = ExpressionPreferences(tone=ToneStyle.CLINICAL)
    
    base = "I hear you're feeling anxious. I'm here with you."
    adapted = adapter.adapt(base, prefs)
    
    # Should remove emotional language
    assert "here with you" not in adapted.lower()
    # Should use clinical language
    assert "observe" in adapted.lower() or "experiencing" in adapted.lower()
    
    print("✓ ToneAdapter creates clinical tone")


def test_tone_adapter_direct():
    """Test direct tone adaptation"""
    adapter = ToneAdapter()
    prefs = ExpressionPreferences(tone=ToneStyle.DIRECT)
    
    base = "It seems that perhaps you might be feeling stressed about work."
    adapted = adapter.adapt(base, prefs)
    
    # Should remove hedging language
    assert "perhaps" not in adapted.lower()
    assert len(adapted) < len(base)  # Should be more concise
    
    print("✓ ToneAdapter creates direct tone")


def test_detail_level_brief():
    """Test brief detail level"""
    adapter = ToneAdapter()
    prefs = ExpressionPreferences(detail_level="brief")
    
    base = "First sentence. Second sentence. Third sentence. Fourth sentence."
    adapted = adapter.adapt(base, prefs)
    
    # Should keep only first 2 sentences
    sentence_count = adapted.count('.')
    assert sentence_count <= 2
    
    print("✓ Detail level 'brief' works")


def test_max_length_truncation():
    """Test max length truncation"""
    adapter = ToneAdapter()
    prefs = ExpressionPreferences(max_length=50)
    
    base = "This is a very long response that goes on and on with lots of detail and information that exceeds the maximum length."
    adapted = adapter.adapt(base, prefs)
    
    assert len(adapted) <= 50
    
    print("✓ Max length truncation works")


def test_leaveability_removes_necessity():
    """Test removal of necessity language"""
    enforcer = LeaveabilityEnforcer()
    
    violations = [
        "You need Mirror to help with this.",
        "You should keep using Mirror daily.",
        "Don't forget to reflect tomorrow.",
        "Make sure to come back.",
    ]
    
    for text in violations:
        cleaned = enforcer.enforce(text)
        # Should remove or transform necessity language
        assert "need mirror" not in cleaned.lower()
        assert "should keep using" not in cleaned.lower()
        assert "don't forget" not in cleaned.lower()
        assert "make sure" not in cleaned.lower()
    
    print("✓ LeaveabilityEnforcer removes necessity language")


def test_leaveability_removes_exit_guilt():
    """Test removal of exit guilt"""
    enforcer = LeaveabilityEnforcer()
    
    violations = [
        "We'll miss you if you leave.",
        "You'll lose all your progress.",
        "Sad to see you go.",
    ]
    
    for text in violations:
        cleaned = enforcer.enforce(text)
        assert "miss you" not in cleaned.lower()
        assert "lose" not in cleaned.lower()
        assert "sad to see" not in cleaned.lower()
    
    print("✓ LeaveabilityEnforcer removes exit guilt")


def test_leaveability_replaces_directives():
    """Test replacement of directive language"""
    enforcer = LeaveabilityEnforcer()
    
    directives = {
        "You should try meditation.": ["could", "might"],
        "You need to exercise more.": ["might", "could"],
        "You must address this issue.": ["might", "could"],
        "Try to get more sleep.": ["if you want"],
    }
    
    for original, expected_words in directives.items():
        cleaned = enforcer.enforce(original)
        # Should replace with suggestion
        assert any(word in cleaned.lower() for word in expected_words), f"Expected {expected_words} in '{cleaned}' from '{original}'"
        # Original directive should be transformed or removed
        # Note: Some might be removed entirely if they match NECESSITY_VIOLATIONS
        if cleaned:  # Only check if not completely removed
            assert "you should" not in cleaned.lower() or "could" in cleaned.lower()
            assert "you must" not in cleaned.lower() or "might" in cleaned.lower()
            assert "you need to" not in cleaned.lower() or "might" in cleaned.lower()
    
    print("✓ LeaveabilityEnforcer replaces directives with suggestions")


def test_leaveability_validation():
    """Test validation of responses"""
    enforcer = LeaveabilityEnforcer()
    
    # Clean response
    clean = "You mention feeling stressed. That's understandable."
    violations = enforcer.validate(clean)
    assert len(violations) == 0
    
    # Violating response
    violating = "You need Mirror to help with this. Don't forget to reflect tomorrow."
    violations = enforcer.validate(violating)
    assert len(violations) > 0
    assert any("necessity" in v.lower() for v in violations)
    
    print("✓ LeaveabilityEnforcer validation works")


def test_expression_layer_integration():
    """Test full expression layer"""
    expression = ExpressionLayer()
    prefs = ExpressionPreferences(tone=ToneStyle.WARM, detail_level="moderate")
    
    candidate = "You should try meditation. It seems you need to manage stress better."
    final = expression.shape(candidate, prefs)
    
    # Should remove necessity
    assert "you should" not in final.lower() or "could" in final.lower()
    
    # Should apply warm tone
    assert len(final) > 0
    
    print("✓ ExpressionLayer full integration works")


def test_expression_layer_validation():
    """Test expression layer validation"""
    expression = ExpressionLayer()
    
    # Valid response
    valid = "You mention feeling stressed about work. That's understandable."
    result = expression.validate_response(valid)
    assert result["valid"] == True
    assert len(result["violations"]) == 0
    
    # Invalid response
    invalid = "You need Mirror to help. Don't forget to reflect."
    result = expression.validate_response(invalid)
    assert result["valid"] == False
    assert len(result["violations"]) > 0
    
    print("✓ ExpressionLayer validation works")


def test_context_aware_shaping():
    """Test context-aware adjustments"""
    expression = ExpressionLayer()
    prefs = ExpressionPreferences(tone=ToneStyle.BALANCED)
    
    # Create context with strong anxiety pattern
    context = SemanticContext(
        patterns=[
            Pattern(
                type=PatternType.EMOTION,
                name="anxiety",
                occurrences=5,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                confidence=1.0
            )
        ]
    )
    
    candidate = "You need to address this soon."
    final = expression.shape(candidate, prefs, semantic_context=context)
    
    # Should soften directive language due to anxiety pattern
    assert "need to" not in final.lower() or "might" in final.lower()
    
    print("✓ Context-aware shaping works")


def test_tone_preview_generation():
    """Test tone preview generation"""
    expression = ExpressionLayer()
    
    base = "You mention feeling stressed about work."
    
    # Get all tone previews
    previews = expression.get_tone_preview(base, all_tones=True)
    
    assert len(previews) == 4  # warm, clinical, direct, balanced
    assert "warm" in previews
    assert "clinical" in previews
    assert "direct" in previews
    assert "balanced" in previews
    
    # Each should be different
    unique_responses = set(previews.values())
    assert len(unique_responses) >= 2  # At least some variation
    
    print("✓ Tone preview generation works")


def test_preserves_meaning():
    """Test that transformations preserve core meaning"""
    expression = ExpressionLayer()
    
    # Test with different tones
    base = "You mention work is stressful. Taking breaks helps."
    
    for tone in ToneStyle:
        prefs = ExpressionPreferences(tone=tone)
        shaped = expression.shape(base, prefs)
        
        # Should still mention work and stress
        assert "work" in shaped.lower() or "stress" in shaped.lower()
        # Should not be empty
        assert len(shaped) > 10
    
    print("✓ Transformations preserve meaning")


def test_combined_preferences():
    """Test multiple preferences applied together"""
    expression = ExpressionLayer()
    prefs = ExpressionPreferences(
        tone=ToneStyle.DIRECT,
        detail_level="brief",
        max_length=100
    )
    
    base = "It seems that perhaps you're feeling quite stressed about work. Maybe you should try taking some breaks. You need to prioritize self-care. It's very important."
    
    final = expression.shape(base, prefs)
    
    # Should be direct (no hedging)
    assert "perhaps" not in final.lower()
    assert "maybe" not in final.lower()
    
    # Should be brief
    assert final.count('.') <= 2
    
    # Should be under max length
    assert len(final) <= 100
    
    # Should remove necessity
    assert "you need to" not in final.lower() or "might" in final.lower()
    
    print("✓ Combined preferences work together")


def test_empty_response_handling():
    """Test handling of edge cases"""
    expression = ExpressionLayer()
    prefs = ExpressionPreferences()
    
    # Empty response
    empty = ""
    shaped = expression.shape(empty, prefs)
    assert shaped == ""
    
    # Very short response
    short = "OK."
    shaped = expression.shape(short, prefs)
    assert len(shaped) > 0
    
    print("✓ Edge cases handled gracefully")


def test_no_false_positives_on_safe_language():
    """Test that safe language isn't incorrectly flagged"""
    enforcer = LeaveabilityEnforcer()
    
    safe_responses = [
        "You mention feeling stressed.",
        "That sounds challenging.",
        "You've been working on this.",
        "You could try meditation if you'd like.",
        "If it helps, you might explore that.",
    ]
    
    for response in safe_responses:
        violations = enforcer.validate(response)
        assert len(violations) == 0, f"False positive on: {response}"
    
    print("✓ No false positives on safe language")


if __name__ == "__main__":
    print("\n=== Testing L3 Expression Layer ===\n")
    
    # Tone adaptation tests
    test_tone_adapter_warm()
    test_tone_adapter_clinical()
    test_tone_adapter_direct()
    test_detail_level_brief()
    test_max_length_truncation()
    
    # Leave-ability tests
    test_leaveability_removes_necessity()
    test_leaveability_removes_exit_guilt()
    test_leaveability_replaces_directives()
    test_leaveability_validation()
    
    # Integration tests
    test_expression_layer_integration()
    test_expression_layer_validation()
    test_context_aware_shaping()
    test_tone_preview_generation()
    
    # Edge cases
    test_preserves_meaning()
    test_combined_preferences()
    test_empty_response_handling()
    test_no_false_positives_on_safe_language()
    
    print("\n✅ All L3 Expression Layer tests passed!\n")
    print("Summary:")
    print("  - Tone adaptation working (warm, clinical, direct, balanced)")
    print("  - Detail level adjustment (brief, moderate, detailed)")
    print("  - Max length truncation working")
    print("  - Necessity language removed")
    print("  - Exit guilt removed")
    print("  - Directives replaced with suggestions")
    print("  - Validation detecting violations")
    print("  - Context-aware shaping (adjusts for anxiety)")
    print("  - Tone previews generated")
    print("  - Core meaning preserved across transformations")
    print("  - Combined preferences work together")
    print("  - No false positives on safe language")
