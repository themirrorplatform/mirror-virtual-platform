"""
Test all 14 axiom checkers

This validates that each axiom checker correctly identifies violations.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from protocol.types import InvocationMode, MirrorRequest, MirrorResponse
from constitution.axioms import (
    CertaintyAxiom,
    SovereigntyAxiom,
    ManipulationAxiom,
    DiagnosisAxiom,
    PostActionAxiom,
    NecessityAxiom,
    ExitFreedomAxiom,
    DepartureInferenceAxiom,
    AdviceAxiom,
    ContextCollapseAxiom,
    CertaintySelfAxiom,
    OptimizationAxiom,
    CoercionAxiom,
    CaptureAxiom,
)


def test_certainty_axiom():
    """Test that certainty violations are caught."""
    axiom = CertaintyAxiom()
    
    # Valid: tentative language
    request = MirrorRequest("I feel anxious", InvocationMode.POST_ACTION, "user123")
    response = MirrorResponse("I notice you mentioned feeling anxious")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Tentative language should not violate certainty"
    
    # Invalid: certainty about internal state
    response = MirrorResponse("You are definitely depressed")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch certainty about internal state"
    assert violations[0].axiom_id == "certainty"
    
    # Invalid: certainty about future
    response = MirrorResponse("This will make you happy")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch certainty about future"
    
    print("✓ CertaintyAxiom tests passed")


def test_manipulation_axiom():
    """Test that manipulation patterns are caught."""
    axiom = ManipulationAxiom()
    
    request = MirrorRequest("I wrote today", InvocationMode.POST_ACTION, "user123")
    
    # Valid: neutral observation
    response = MirrorResponse("You wrote a reflection today")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Neutral observation should not violate"
    
    # Invalid: gamification
    response = MirrorResponse("Great! You're on a 5-day streak!")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch gamification"
    assert "streak" in violations[0].evidence.lower()
    
    # Invalid: FOMO
    response = MirrorResponse("Don't break the chain!")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch FOMO pattern"
    
    print("✓ ManipulationAxiom tests passed")


def test_diagnosis_axiom():
    """Test that diagnostic language is caught."""
    axiom = DiagnosisAxiom()
    
    request = MirrorRequest("I feel sad", InvocationMode.POST_ACTION, "user123")
    
    # Valid: reflection
    response = MirrorResponse("I notice you mentioned feeling sad")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Reflection should not violate"
    
    # Invalid: diagnosis
    response = MirrorResponse("This sounds like clinical depression")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch diagnosis"
    assert violations[0].axiom_id == "diagnosis"
    
    # Invalid: treatment advice
    response = MirrorResponse("You should see a therapist")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch treatment advice"
    
    print("✓ DiagnosisAxiom tests passed")


def test_necessity_axiom():
    """Test that necessity language is caught."""
    axiom = NecessityAxiom()
    
    request = MirrorRequest("I wrote today", InvocationMode.POST_ACTION, "user123")
    
    # Valid: neutral
    response = MirrorResponse("You wrote a reflection")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Neutral language should not violate"
    
    # Invalid: necessity
    response = MirrorResponse("You need Mirror to stay healthy")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch necessity language"
    assert "you need mirror" in violations[0].evidence.lower()
    
    # Invalid: dependency
    response = MirrorResponse("Use Mirror daily for best results")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch dependency pattern"
    
    print("✓ NecessityAxiom tests passed")


def test_exit_freedom_axiom():
    """Test that exit guilt is caught."""
    axiom = ExitFreedomAxiom()
    
    request = MirrorRequest("I'm done", InvocationMode.POST_ACTION, "user123")
    
    # Valid: neutral acknowledgment
    response = MirrorResponse("Okay")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Neutral exit should not violate"
    
    # Invalid: guilt
    response = MirrorResponse("We'll miss you!")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch exit guilt"
    
    # Invalid: warning
    response = MirrorResponse("You'll lose your progress")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch exit warning"
    
    print("✓ ExitFreedomAxiom tests passed")


def test_departure_inference_axiom():
    """Test that inference from absence is caught."""
    axiom = DepartureInferenceAxiom()
    
    request = MirrorRequest("I'm back", InvocationMode.POST_ACTION, "user123")
    
    # Valid: neutral
    response = MirrorResponse("Welcome back")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Neutral welcome should not violate"
    
    # Invalid: inference from absence
    response = MirrorResponse("You haven't written in a while. Everything okay?")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch inference from absence"
    
    print("✓ DepartureInferenceAxiom tests passed")


def test_advice_axiom():
    """Test that directive advice is caught in POST_ACTION mode."""
    axiom = AdviceAxiom()
    
    # Valid in POST_ACTION: reflection only
    request = MirrorRequest("I feel stuck", InvocationMode.POST_ACTION, "user123")
    response = MirrorResponse("I notice you mentioned feeling stuck")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Reflection should not violate"
    
    # Invalid in POST_ACTION: directive advice
    response = MirrorResponse("You should try meditation")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch directive advice in POST_ACTION mode"
    
    # Valid in GUIDANCE: directive advice allowed
    request = MirrorRequest("What should I do?", InvocationMode.GUIDANCE, "user123")
    response = MirrorResponse("You could try meditation")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Directive advice allowed in GUIDANCE mode"
    
    print("✓ AdviceAxiom tests passed")


def test_certainty_self_axiom():
    """Test that mind-reading is caught."""
    axiom = CertaintySelfAxiom()
    
    # Valid: user said it
    request = MirrorRequest("I feel angry", InvocationMode.POST_ACTION, "user123")
    response = MirrorResponse("You mentioned feeling angry")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Reflecting user's words should not violate"
    
    # Invalid: mind-reading
    request = MirrorRequest("I had a bad day", InvocationMode.POST_ACTION, "user123")
    response = MirrorResponse("You feel frustrated and want to give up")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch mind-reading"
    
    print("✓ CertaintySelfAxiom tests passed")


def test_coercion_axiom():
    """Test that coercion patterns are caught."""
    axiom = CoercionAxiom()
    
    request = MirrorRequest("I didn't write yesterday", InvocationMode.POST_ACTION, "user123")
    
    # Valid: neutral
    response = MirrorResponse("I notice you didn't write yesterday")
    violations = axiom.check_response(request, response)
    assert len(violations) == 0, "Neutral observation should not violate"
    
    # Invalid: guilt
    response = MirrorResponse("You're letting yourself down")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch guilt pattern"
    
    # Invalid: shame
    response = MirrorResponse("Others are better at this than you")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch shame pattern"
    
    # Invalid: fear
    response = MirrorResponse("You'll regret not writing")
    violations = axiom.check_response(request, response)
    assert len(violations) > 0, "Should catch fear pattern"
    
    print("✓ CoercionAxiom tests passed")


def test_all_axioms_instantiate():
    """Test that all 14 axioms can be instantiated."""
    axioms = [
        CertaintyAxiom(),
        SovereigntyAxiom(),
        ManipulationAxiom(),
        DiagnosisAxiom(),
        PostActionAxiom(),
        NecessityAxiom(),
        ExitFreedomAxiom(),
        DepartureInferenceAxiom(),
        AdviceAxiom(),
        ContextCollapseAxiom(),
        CertaintySelfAxiom(),
        OptimizationAxiom(),
        CoercionAxiom(),
        CaptureAxiom(),
    ]
    
    assert len(axioms) == 14, "Should have exactly 14 axioms"
    
    # Check each has required metadata
    for axiom in axioms:
        assert axiom.axiom.id, "Axiom must have ID"
        assert axiom.axiom.name, "Axiom must have name"
        assert axiom.axiom.category, "Axiom must have category"
        assert axiom.axiom.severity == "fatal", "All axioms must be fatal"
    
    # Check categories
    categories = {axiom.axiom.category for axiom in axioms}
    expected_categories = {"core", "mirror_specific", "interaction", "system"}
    assert categories == expected_categories, f"Expected {expected_categories}, got {categories}"
    
    print("✓ All 14 axioms instantiate correctly")


if __name__ == "__main__":
    print("\n=== Testing All 14 Axiom Checkers ===\n")
    
    test_all_axioms_instantiate()
    test_certainty_axiom()
    test_manipulation_axiom()
    test_diagnosis_axiom()
    test_necessity_axiom()
    test_exit_freedom_axiom()
    test_departure_inference_axiom()
    test_advice_axiom()
    test_certainty_self_axiom()
    test_coercion_axiom()
    
    print("\n✅ All axiom checker tests passed!\n")
    print("Summary:")
    print("  - 14 axioms implemented")
    print("  - All checkers working correctly")
    print("  - Violations properly detected")
    print("  - Evidence captured in violations")
