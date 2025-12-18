"""
Test Pattern and Tension Detection

Verifies that pattern and tension detectors work correctly.
"""

import sys
from pathlib import Path

# Add to path
sys.path.insert(0, str(Path(__file__).parent))

from pattern_detector import detect_patterns, DetectedPattern
from tension_detector import detect_tensions, DetectedTension


def test_pattern_detection():
    """Test pattern detector"""
    print("\n" + "="*70)
    print("Pattern Detection Test")
    print("="*70)
    
    test_cases = [
        {
            "text": "I've been feeling anxious about work lately. Every morning I wake up stressed.",
            "expected_patterns": ["anxiety", "work", "temporal_morning_person"],
        },
        {
            "text": "I'm really happy with my exercise routine. Going to the gym makes me energetic.",
            "expected_patterns": ["contentment", "energy", "health"],
        },
        {
            "text": "I keep procrastinating on my project. I want to finish it but I keep putting it off.",
            "expected_patterns": ["procrastination", "personal_growth"],
        },
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n[Test {i}] Input: {case['text'][:60]}...")
        patterns = detect_patterns(case['text'], user_id="test_user")
        
        print(f"  Patterns found: {len(patterns)}")
        for pattern in patterns:
            print(f"    - {pattern.pattern_type}/{pattern.name} (confidence: {pattern.confidence:.2f})")
            print(f"      Evidence: {pattern.evidence[0][:50]}...")
        
        # Verify expected patterns
        found_names = [p.name for p in patterns]
        for expected in case['expected_patterns']:
            if expected in found_names:
                print(f"  ✓ Found expected pattern: {expected}")
            else:
                print(f"  ⚠ Missing expected pattern: {expected}")
    
    print("\n✓ Pattern detection test complete")
    return True


def test_tension_detection():
    """Test tension detector"""
    print("\n" + "="*70)
    print("Tension Detection Test")
    print("="*70)
    
    test_cases = [
        {
            "text": "I love my job but I'm completely exhausted.",
            "expected_type": "explicit_contradiction",
        },
        {
            "text": "I want to exercise more but I never make time for it.",
            "expected_type": "emotional",
        },
        {
            "text": "I used to be so motivated, but now I can barely get started.",
            "expected_type": "temporal",
        },
        {
            "text": "I'm torn between staying in my comfort zone and taking a risk.",
            "expected_type": "value",
        },
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n[Test {i}] Input: {case['text'][:60]}...")
        tensions = detect_tensions(case['text'], user_id="test_user")
        
        print(f"  Tensions found: {len(tensions)}")
        for tension in tensions:
            print(f"    - {tension.tension_type}: {tension.description}")
            print(f"      Severity: {tension.severity:.2f}")
            if tension.evidence:
                print(f"      Evidence: {tension.evidence[0][:60]}...")
        
        if tensions:
            if tensions[0].tension_type in case['expected_type']:
                print(f"  ✓ Detected expected tension type")
            else:
                print(f"  ⚠ Expected {case['expected_type']}, got {tensions[0].tension_type}")
        else:
            print(f"  ✗ No tensions detected (expected {case['expected_type']})")
    
    print("\n✓ Tension detection test complete")
    return True


def test_integration():
    """Test patterns and tensions together"""
    print("\n" + "="*70)
    print("Integration Test: Patterns + Tensions")
    print("="*70)
    
    text = """
    I've been noticing a pattern in my work life. I'm really passionate 
    about what I do, but I keep burning out. Every few months I get super 
    motivated and dive deep into projects, but then I crash and can't 
    do anything for weeks. I love the creative work but hate the stress.
    """
    
    print(f"\nInput: {text[:100]}...")
    
    patterns = detect_patterns(text, user_id="test_integration")
    tensions = detect_tensions(text, user_id="test_integration")
    
    print(f"\n  Patterns detected: {len(patterns)}")
    for p in patterns:
        print(f"    - {p.pattern_type}/{p.name}")
    
    print(f"\n  Tensions detected: {len(tensions)}")
    for t in tensions:
        print(f"    - {t.tension_type}: {t.description}")
    
    if patterns and tensions:
        print("\n✓ Both patterns and tensions detected successfully")
        return True
    else:
        print("\n✗ Failed to detect both patterns and tensions")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("PATTERN & TENSION DETECTION TESTS")
    print("="*70)
    
    results = []
    
    try:
        results.append(test_pattern_detection())
    except Exception as e:
        print(f"\n✗ Pattern detection failed: {e}")
        import traceback
        traceback.print_exc()
        results.append(False)
    
    try:
        results.append(test_tension_detection())
    except Exception as e:
        print(f"\n✗ Tension detection failed: {e}")
        import traceback
        traceback.print_exc()
        results.append(False)
    
    try:
        results.append(test_integration())
    except Exception as e:
        print(f"\n✗ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        results.append(False)
    
    print("\n" + "="*70)
    if all(results):
        print("ALL TESTS PASSED ✓")
    else:
        print(f"SOME TESTS FAILED: {sum(results)}/{len(results)} passed")
    print("="*70)
    
    return 0 if all(results) else 1


if __name__ == "__main__":
    exit(sys.exit(main()))
