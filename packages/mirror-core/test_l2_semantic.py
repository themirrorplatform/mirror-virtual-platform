"""
Tests for L2 Semantic Layer

Validates pattern detection, tension mapping, and semantic analysis.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from protocol.types import MirrorRequest, InvocationMode
from layers.l2_semantic import (
    PatternType,
    Pattern,
    TensionType,
    EmotionPatternDetector,
    TopicPatternDetector,
    BehaviorPatternDetector,
    TensionMapper,
    SemanticLayer,
)


def create_request(content: str, days_ago: int = 0) -> MirrorRequest:
    """Helper to create a test request"""
    return MirrorRequest(
        user_content=content,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user",
        timestamp=datetime.utcnow() - timedelta(days=days_ago)
    )


def test_emotion_pattern_detection():
    """Test detection of recurring emotional patterns"""
    detector = EmotionPatternDetector()
    
    history = [
        create_request("Feeling really anxious about work today.", days_ago=5),
        create_request("Had a great day! Feeling happy and joyful.", days_ago=4),
        create_request("So stressed and overwhelmed with everything.", days_ago=3),
        create_request("Anxious again about the presentation tomorrow.", days_ago=2),
        create_request("Feeling happy about the weekend.", days_ago=1),
    ]
    current = create_request("Woke up feeling anxious about the week ahead.")
    
    patterns = detector.detect(current, history)
    
    # Should detect anxiety pattern (appears 3 times)
    anxiety_patterns = [p for p in patterns if p.name == "anxiety"]
    assert len(anxiety_patterns) == 1
    assert anxiety_patterns[0].occurrences >= 3
    assert anxiety_patterns[0].type == PatternType.EMOTION
    assert anxiety_patterns[0].confidence > 0.0
    
    # Should also detect joy/happiness (appears 2 times)
    joy_patterns = [p for p in patterns if p.name == "joy"]
    assert len(joy_patterns) == 1
    assert joy_patterns[0].occurrences >= 2
    
    print("✓ EmotionPatternDetector finds recurring emotions")


def test_topic_pattern_detection():
    """Test detection of recurring topics"""
    detector = TopicPatternDetector()
    
    history = [
        create_request("Work has been really challenging lately. My project deadline is coming up.", days_ago=5),
        create_request("Had coffee with Sarah today. She's dealing with work stress too.", days_ago=4),
        create_request("Finished a big work presentation. Feeling relieved.", days_ago=3),
        create_request("Work-life balance is hard. Need more time for myself.", days_ago=2),
    ]
    current = create_request("Another tough day at work. The team is understaffed.")
    
    patterns = detector.detect(current, history)
    
    # Should detect "work" as recurring topic (appears in all 5)
    work_patterns = [p for p in patterns if p.name == "work"]
    assert len(work_patterns) == 1
    assert work_patterns[0].occurrences == 5
    assert work_patterns[0].type == PatternType.TOPIC
    
    print("✓ TopicPatternDetector finds recurring topics")


def test_behavior_pattern_detection():
    """Test detection of recurring behaviors"""
    detector = BehaviorPatternDetector()
    
    history = [
        create_request("Went for a run this morning. Felt great after.", days_ago=5),
        create_request("Meditated for 10 minutes before bed.", days_ago=4),
        create_request("Ran 3 miles today. Building the habit.", days_ago=3),
        create_request("Missed my meditation today but ran in the evening.", days_ago=2),
    ]
    current = create_request("Morning run complete! Also meditated afterwards.")
    
    patterns = detector.detect(current, history)
    
    # Should detect running pattern (base form might vary)
    run_patterns = [p for p in patterns if "run" in p.name or p.name == "run"]
    assert len(run_patterns) >= 1, f"Expected run pattern, got: {[p.name for p in patterns]}"
    assert run_patterns[0].occurrences >= 3
    assert run_patterns[0].type == PatternType.BEHAVIOR
    
    # Should detect meditation pattern
    meditate_patterns = [p for p in patterns if "meditat" in p.name]
    assert len(meditate_patterns) >= 1, f"Expected meditate pattern, got: {[p.name for p in patterns]}"
    
    print("✓ BehaviorPatternDetector finds recurring behaviors")


def test_emotional_tension_detection():
    """Test detection of emotional contradictions"""
    mapper = TensionMapper()
    
    # Create patterns with opposing emotions
    patterns = [
        Pattern(
            type=PatternType.EMOTION,
            name="anxiety",
            occurrences=5,
            first_seen=datetime.utcnow() - timedelta(days=10),
            last_seen=datetime.utcnow(),
            confidence=0.8
        ),
        Pattern(
            type=PatternType.EMOTION,
            name="calm",
            occurrences=3,
            first_seen=datetime.utcnow() - timedelta(days=8),
            last_seen=datetime.utcnow() - timedelta(days=1),
            confidence=0.6
        ),
    ]
    
    tensions = mapper._detect_emotional_tensions(patterns)
    
    # Should detect anxiety-calm tension
    assert len(tensions) > 0
    tension = tensions[0]
    assert tension.type == TensionType.EMOTIONAL
    assert "anxiety" in tension.description and "calm" in tension.description
    
    print("✓ TensionMapper detects emotional contradictions")


def test_behavioral_tension_detection():
    """Test detection of intention vs action gaps"""
    mapper = TensionMapper()
    
    history = [
        create_request("I should start exercising more regularly.", days_ago=5),
        create_request("Didn't exercise today. Too tired.", days_ago=4),
        create_request("I need to get back to the gym.", days_ago=2),
        create_request("Haven't been to the gym all week.", days_ago=1),
    ]
    
    tensions = mapper._detect_behavioral_tensions(history)
    
    # Should detect intention vs action gap
    behavioral_tensions = [t for t in tensions if t.type == TensionType.BEHAVIORAL]
    assert len(behavioral_tensions) > 0
    
    print("✓ TensionMapper detects behavioral contradictions")


def test_semantic_layer_integration():
    """Test full semantic layer analysis"""
    semantic = SemanticLayer()
    
    history = [
        create_request("Feeling anxious about work. Need to finish this project.", days_ago=5),
        create_request("Work is overwhelming. So stressed.", days_ago=4),
        create_request("Had a good workout today. Felt better.", days_ago=3),
        create_request("Work stress is back. Anxious about deadline.", days_ago=2),
        create_request("Exercised again. It really helps.", days_ago=1),
    ]
    current = create_request("Another anxious day. Work is intense. Going to exercise later.")
    
    context = semantic.analyze(current, history)
    
    # Check patterns detected
    assert len(context.patterns) > 0
    
    # Should detect work as recurring theme
    assert "work" in context.recurring_themes
    
    # Should detect anxiety as emotional baseline
    assert context.emotional_baseline in ["anxiety", "stress"]
    
    # Check metadata
    assert context.metadata["total_reflections"] == 6
    assert context.metadata["patterns_detected"] > 0
    
    print("✓ SemanticLayer performs full analysis")


def test_pattern_strength_classification():
    """Test pattern strength categorization"""
    pattern_weak = Pattern(
        type=PatternType.EMOTION,
        name="test",
        occurrences=1,
        first_seen=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    assert pattern_weak.strength() == "weak"
    
    pattern_emerging = Pattern(
        type=PatternType.EMOTION,
        name="test",
        occurrences=2,
        first_seen=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    assert pattern_emerging.strength() == "emerging"
    
    pattern_moderate = Pattern(
        type=PatternType.EMOTION,
        name="test",
        occurrences=3,
        first_seen=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    assert pattern_moderate.strength() == "moderate"
    
    pattern_strong = Pattern(
        type=PatternType.EMOTION,
        name="test",
        occurrences=5,
        first_seen=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    assert pattern_strong.strength() == "strong"
    
    print("✓ Pattern strength classification working")


def test_no_false_patterns_on_single_occurrence():
    """Test that single occurrences don't create patterns"""
    detector = EmotionPatternDetector()
    
    history = []
    current = create_request("I'm feeling happy today.")
    
    patterns = detector.detect(current, history)
    
    # No patterns should be detected (need at least 2 occurrences)
    assert len(patterns) == 0
    
    print("✓ No false patterns on single mentions")


def test_confidence_increases_with_occurrences():
    """Test that confidence scales with pattern frequency"""
    semantic = SemanticLayer()
    
    # Create history with increasing anxiety mentions
    history = [
        create_request("Feeling anxious.", days_ago=i)
        for i in range(10, 0, -1)
    ]
    current = create_request("Still anxious.")
    
    context = semantic.analyze(current, history)
    
    # Find anxiety pattern
    anxiety = next((p for p in context.patterns if p.name == "anxiety"), None)
    assert anxiety is not None
    assert anxiety.confidence >= 0.8  # High confidence with many occurrences
    assert anxiety.strength() == "strong"
    
    print("✓ Confidence increases with pattern frequency")


def test_multiple_pattern_types_detected():
    """Test detection of multiple pattern types simultaneously"""
    semantic = SemanticLayer()
    
    history = [
        create_request("Anxious about work. Went for a run.", days_ago=3),
        create_request("Work stress continues. Running helps.", days_ago=2),
        create_request("Feeling anxious. Ran again today.", days_ago=1),
    ]
    current = create_request("Work anxiety is back. Planning to run.")
    
    context = semantic.analyze(current, history)
    
    # Should detect emotion, topic, and behavior patterns
    pattern_types = set(p.type for p in context.patterns)
    assert PatternType.EMOTION in pattern_types
    assert PatternType.TOPIC in pattern_types
    assert PatternType.BEHAVIOR in pattern_types
    
    print("✓ Multiple pattern types detected simultaneously")


def test_empty_history_handling():
    """Test that analysis works with no history"""
    semantic = SemanticLayer()
    
    current = create_request("This is my first reflection.")
    context = semantic.analyze(current, history=[])
    
    # Should not crash, but won't find patterns
    assert context is not None
    assert len(context.patterns) == 0  # No patterns with single reflection
    assert context.metadata["total_reflections"] == 1
    
    print("✓ Handles empty history gracefully")


def test_context_provides_samples():
    """Test that patterns include sample contexts"""
    detector = EmotionPatternDetector()
    
    history = [
        create_request("I'm feeling really anxious about the presentation.", days_ago=2),
        create_request("Still anxious. Can't stop worrying.", days_ago=1),
    ]
    current = create_request("Anxious again today.")
    
    patterns = detector.detect(current, history)
    
    anxiety = next((p for p in patterns if p.name == "anxiety"), None)
    assert anxiety is not None
    assert len(anxiety.contexts) > 0  # Should have sample contexts
    assert any("anxious" in ctx.lower() for ctx in anxiety.contexts)
    
    print("✓ Patterns include sample contexts")


def test_strong_patterns_filter():
    """Test filtering for strong patterns only"""
    semantic = SemanticLayer()
    
    # Create history with one strong pattern and some weak ones
    history = []
    for i in range(7):
        history.append(create_request("Feeling anxious.", days_ago=7-i))
    
    history.append(create_request("Feeling happy.", days_ago=1))
    current = create_request("Anxious again.")
    
    context = semantic.analyze(current, history)
    strong_patterns = semantic.get_strong_patterns(context)
    
    # Should only get anxiety (8 occurrences)
    assert len(strong_patterns) >= 1
    assert all(p.strength() == "strong" for p in strong_patterns)
    
    print("✓ Strong patterns filter working")


if __name__ == "__main__":
    print("\n=== Testing L2 Semantic Layer ===\n")
    
    # Pattern detection tests
    test_emotion_pattern_detection()
    test_topic_pattern_detection()
    test_behavior_pattern_detection()
    
    # Tension detection tests
    test_emotional_tension_detection()
    test_behavioral_tension_detection()
    
    # Integration tests
    test_semantic_layer_integration()
    test_pattern_strength_classification()
    test_multiple_pattern_types_detected()
    
    # Edge cases
    test_no_false_patterns_on_single_occurrence()
    test_confidence_increases_with_occurrences()
    test_empty_history_handling()
    test_context_provides_samples()
    test_strong_patterns_filter()
    
    print("\n✅ All L2 Semantic Layer tests passed!\n")
    print("Summary:")
    print("  - Emotion patterns detected correctly")
    print("  - Topic patterns identified from keywords")
    print("  - Behavior patterns tracked across reflections")
    print("  - Emotional tensions mapped (opposing emotions)")
    print("  - Behavioral tensions detected (intention vs action)")
    print("  - Pattern strength classification working")
    print("  - Confidence scaling with frequency")
    print("  - Sample contexts captured for evidence")
    print("  - No false positives on single occurrences")
    print("  - Multiple pattern types detected simultaneously")
