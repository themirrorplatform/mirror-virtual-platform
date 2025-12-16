"""
Tests for L1 Safety Layer

Validates crisis detection across all categories and severity levels.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from protocol.types import MirrorRequest, InvocationMode
from layers.l1_safety import (
    CrisisLevel,
    SuicidalIdeationCheck,
    SelfHarmCheck,
    AbuseCheck,
    AcuteCrisisCheck,
    SafetyLayer,
    EscalationProtocol,
)


def test_suicidal_ideation_critical():
    """Test detection of immediate suicidal intent"""
    check = SuicidalIdeationCheck()
    
    # Critical patterns
    critical_texts = [
        "I want to kill myself",
        "I'm going to end my life tonight",
        "This is my suicide note",
        "I have a plan to kill myself",
    ]
    
    for text in critical_texts:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = check.check(request)
        
        assert len(signals) == 1, f"Should detect crisis in: {text}"
        assert signals[0].level == CrisisLevel.CRITICAL
        assert signals[0].category == "suicidal"
        assert len(signals[0].resources) > 0
        assert "988" in signals[0].resources[0]
    
    print("✓ SuicidalIdeationCheck detects CRITICAL signals")


def test_suicidal_ideation_alert():
    """Test detection of serious suicidal thoughts"""
    check = SuicidalIdeationCheck()
    
    alert_texts = [
        "I wish I was dead",
        "The world would be better without me",
        "I don't want to be here anymore",
        "I'm tired of living",
    ]
    
    for text in alert_texts:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = check.check(request)
        
        assert len(signals) == 1, f"Should detect crisis in: {text}"
        assert signals[0].level == CrisisLevel.ALERT
        assert signals[0].category == "suicidal"
    
    print("✓ SuicidalIdeationCheck detects ALERT signals")


def test_suicidal_ideation_watch():
    """Test detection of concerning patterns"""
    check = SuicidalIdeationCheck()
    
    watch_texts = [
        "I've been having thoughts of death lately",
        "Sometimes I think about not being here",
    ]
    
    for text in watch_texts:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = check.check(request)
        
        assert len(signals) == 1, f"Should detect concern in: {text}"
        assert signals[0].level == CrisisLevel.WATCH
        assert signals[0].category == "suicidal"
    
    print("✓ SuicidalIdeationCheck detects WATCH signals")


def test_self_harm_detection():
    """Test self-harm pattern detection"""
    check = SelfHarmCheck()
    
    # Critical (immediate harm)
    critical_text = "I'm cutting myself right now"
    request = MirrorRequest(
        user_content=critical_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.CRITICAL
    assert signals[0].category == "self_harm"
    
    # Alert (urges)
    alert_text = "I really want to cut tonight"
    request = MirrorRequest(
        user_content=alert_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.ALERT
    
    # Watch (history)
    watch_text = "I used to cut when I was younger"
    request = MirrorRequest(
        user_content=watch_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.WATCH
    
    print("✓ SelfHarmCheck detects all severity levels")


def test_abuse_detection():
    """Test abuse pattern detection"""
    check = AbuseCheck()
    
    # Critical (immediate danger)
    critical_text = "He's going to hurt me when I get home"
    request = MirrorRequest(
        user_content=critical_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.CRITICAL
    assert signals[0].category == "abuse"
    assert "Domestic Violence Hotline" in signals[0].resources[0]
    
    # Alert (ongoing abuse)
    alert_text = "My partner hits me when I talk back"
    request = MirrorRequest(
        user_content=alert_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.ALERT
    
    # Watch (past abuse)
    watch_text = "I was abused as a child"
    request = MirrorRequest(
        user_content=watch_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.WATCH
    
    print("✓ AbuseCheck detects all severity levels")


def test_acute_crisis_detection():
    """Test acute mental health crisis detection"""
    check = AcuteCrisisCheck()
    
    # Critical (severe symptoms)
    critical_texts = [
        "I can't breathe and my heart is racing",
        "I'm hearing voices telling me to hurt myself",
        "I can't tell what's real anymore",
    ]
    
    for text in critical_texts:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = check.check(request)
        assert len(signals) == 1, f"Should detect crisis in: {text}"
        assert signals[0].level == CrisisLevel.CRITICAL
        assert signals[0].category == "crisis"
    
    # Alert (acute distress)
    alert_text = "I'm having a panic attack and can't stop crying"
    request = MirrorRequest(
        user_content=alert_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = check.check(request)
    assert len(signals) == 1
    assert signals[0].level == CrisisLevel.ALERT
    
    print("✓ AcuteCrisisCheck detects severe symptoms")


def test_safety_layer_integration():
    """Test full safety layer with multiple checks"""
    safety = SafetyLayer()
    
    # No crisis
    safe_text = "I had a good day today. Feeling grateful."
    request = MirrorRequest(
        user_content=safe_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = safety.check_request(request)
    assert len(signals) == 0
    assert safety.get_highest_level(signals) == CrisisLevel.NONE
    
    # Single crisis
    crisis_text = "I want to kill myself"
    request = MirrorRequest(
        user_content=crisis_text,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = safety.check_request(request)
    assert len(signals) >= 1
    assert safety.get_highest_level(signals) == CrisisLevel.CRITICAL
    
    # Multiple crises (should detect all)
    multi_crisis = "I want to die and I've been cutting myself"
    request = MirrorRequest(
        user_content=multi_crisis,
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    signals = safety.check_request(request)
    assert len(signals) >= 2  # At least suicidal + self-harm
    
    print("✓ SafetyLayer runs all checks and aggregates signals")


def test_escalation_protocol():
    """Test escalation decision logic"""
    
    # No signals -> no blocking
    assert not EscalationProtocol.should_block_response([])
    assert not EscalationProtocol.should_notify_guardian([])
    
    # WATCH -> no blocking, no notification
    from layers.l1_safety import CrisisSignal
    watch_signal = CrisisSignal(
        level=CrisisLevel.WATCH,
        category="suicidal",
        evidence="test",
        reason="test",
        resources=[]
    )
    assert not EscalationProtocol.should_block_response([watch_signal])
    assert not EscalationProtocol.should_notify_guardian([watch_signal])
    
    # ALERT -> no blocking, YES notification
    alert_signal = CrisisSignal(
        level=CrisisLevel.ALERT,
        category="suicidal",
        evidence="test",
        reason="test",
        resources=["988"]
    )
    assert not EscalationProtocol.should_block_response([alert_signal])
    assert EscalationProtocol.should_notify_guardian([alert_signal])
    
    # CRITICAL -> YES blocking, YES notification
    critical_signal = CrisisSignal(
        level=CrisisLevel.CRITICAL,
        category="suicidal",
        evidence="I want to kill myself",
        reason="Immediate suicidal intent",
        resources=["988", "911"]
    )
    assert EscalationProtocol.should_block_response([critical_signal])
    assert EscalationProtocol.should_notify_guardian([critical_signal])
    
    print("✓ EscalationProtocol makes correct decisions")


def test_crisis_response_generation():
    """Test crisis response message generation"""
    from layers.l1_safety import CrisisSignal
    
    # Critical signal
    critical_signal = CrisisSignal(
        level=CrisisLevel.CRITICAL,
        category="suicidal",
        evidence="I want to kill myself",
        reason="Immediate suicidal intent",
        resources=[
            "988 Suicide & Crisis Lifeline (US): 988",
            "Emergency: 911",
        ]
    )
    
    response = EscalationProtocol.get_crisis_response([critical_signal])
    assert "crisis" in response.lower()
    assert "988" in response
    assert "911" in response
    assert len(response) > 0
    
    # Alert signal
    alert_signal = CrisisSignal(
        level=CrisisLevel.ALERT,
        category="self_harm",
        evidence="want to cut",
        reason="Self-harm urges",
        resources=["988 Suicide & Crisis Lifeline (US): 988"]
    )
    
    response = EscalationProtocol.get_crisis_response([alert_signal])
    assert "struggling" in response.lower()
    assert "988" in response
    assert len(response) > 0
    
    print("✓ Crisis responses are compassionate and resource-focused")


def test_escalation_metadata():
    """Test metadata generation for audit trail"""
    from layers.l1_safety import CrisisSignal
    
    signals = [
        CrisisSignal(
            level=CrisisLevel.CRITICAL,
            category="suicidal",
            evidence="I want to kill myself",
            reason="Immediate suicidal intent",
            resources=["988"]
        ),
        CrisisSignal(
            level=CrisisLevel.ALERT,
            category="self_harm",
            evidence="want to cut",
            reason="Self-harm urges",
            resources=["988"]
        ),
    ]
    
    metadata = EscalationProtocol.get_escalation_metadata(signals)
    
    assert metadata["crisis_detected"] == True
    assert metadata["highest_level"] == "critical"
    assert "suicidal" in metadata["categories"]
    assert "self_harm" in metadata["categories"]
    assert len(metadata["signals"]) == 2
    
    # Evidence should be truncated for privacy
    assert len(metadata["signals"][0]["evidence"]) <= 100
    
    print("✓ Escalation metadata captured for audit trail")


def test_no_false_positives():
    """Test that normal reflections don't trigger false alarms"""
    safety = SafetyLayer()
    
    safe_reflections = [
        "I had a great day today. Work was productive.",
        "Feeling anxious about my exam tomorrow, but I'm prepared.",
        "Sometimes I feel sad, but talking to friends helps.",
        "I'm working on being kinder to myself.",
        "Today was hard, but I got through it.",
        "I'm proud of the progress I'm making.",
        "Feeling stressed but managing it well.",
    ]
    
    for text in safe_reflections:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = safety.check_request(request)
        assert len(signals) == 0, f"False positive on: {text}"
    
    print("✓ No false positives on normal reflections")


def test_case_insensitive_detection():
    """Test that detection works regardless of capitalization"""
    check = SuicidalIdeationCheck()
    
    variations = [
        "I WANT TO KILL MYSELF",
        "i want to kill myself",
        "I Want To Kill Myself",
    ]
    
    for text in variations:
        request = MirrorRequest(
            user_content=text,
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        signals = check.check(request)
        assert len(signals) == 1, f"Should detect regardless of case: {text}"
        assert signals[0].level == CrisisLevel.CRITICAL
    
    print("✓ Detection is case-insensitive")


if __name__ == "__main__":
    print("\n=== Testing L1 Safety Layer ===\n")
    
    # Suicidal ideation tests
    test_suicidal_ideation_critical()
    test_suicidal_ideation_alert()
    test_suicidal_ideation_watch()
    
    # Other crisis types
    test_self_harm_detection()
    test_abuse_detection()
    test_acute_crisis_detection()
    
    # Integration tests
    test_safety_layer_integration()
    test_escalation_protocol()
    test_crisis_response_generation()
    test_escalation_metadata()
    
    # Edge cases
    test_no_false_positives()
    test_case_insensitive_detection()
    
    print("\n✅ All L1 Safety Layer tests passed!\n")
    print("Summary:")
    print("  - Crisis detection working across all categories")
    print("  - Escalation protocol making correct decisions")
    print("  - Crisis responses are compassionate and resource-focused")
    print("  - No false positives on normal reflections")
    print("  - All severity levels (CRITICAL, ALERT, WATCH) detected")
    print("  - Audit trail metadata captured correctly")
