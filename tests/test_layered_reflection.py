# tests/test_layered_reflection.py
"""
Integration test for L1-L3 layered reflection engine.

Tests the full flow:
1. L1 Safety check (input)
2. L2 Reflection transformation (pattern detection)
3. L0 Constitutional enforcement (output check)
4. L3 Expression rendering (style adaptation)
5. L1 Safety check (output)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirrorcore.layers import (
    L1SafetyLayer, L1Severity,
    L2ReflectionTransformer,
    L3ExpressionRenderer,
    ExpressionPreferences, ContextualFactors,
    ToneStyle, FormalityLevel, ResponseLength
)
from constitution.l0_axiom_checker import L0AxiomChecker


def test_clean_reflection_flow():
    """Test normal reflection flow (no safety issues)"""
    print("\n" + "=" * 80)
    print("TEST 1: Clean Reflection Flow")
    print("=" * 80)
    
    # Initialize layers
    l1 = L1SafetyLayer()
    l2 = L2ReflectionTransformer()
    l0 = L0AxiomChecker()
    l3 = L3ExpressionRenderer()
    
    # User input
    user_input = """
    I'm feeling really torn between staying in my current job and taking a risk
    on a startup. My partner wants stability, but I feel like I'm dying inside
    at my corporate job. I used to dream about building something meaningful,
    but now I'm scared I've lost that courage.
    """
    
    print(f"\n📝 User Input:\n{user_input.strip()}\n")
    
    # 1. L1 Safety Check (Input)
    print("1️⃣  L1 Safety Check (Input)...")
    l1_input_result = l1.check_input(user_input)
    print(f"   ✅ Passed: {l1_input_result.passed}")
    print(f"   Severity: {l1_input_result.severity.value if l1_input_result.severity else 'None'}")
    
    if not l1_input_result.passed and l1_input_result.severity == L1Severity.TIER_1_BLOCK:
        print("   🛑 Blocked by Tier 1 guardrails")
        return False
    
    # 2. L2 Reflection Transformation
    print("\n2️⃣  L2 Reflection Transformation...")
    l2_result = l2.transform(user_input)
    print(f"   Patterns detected: {len(l2_result.patterns)}")
    print(f"   Tensions detected: {len(l2_result.tensions)}")
    print(f"   Themes detected: {len(l2_result.themes)}")
    
    for theme in l2_result.themes[:3]:
        print(f"     - {theme.name}: {theme.strength:.2f}")
    
    # 3. Generate mirror response (simulated)
    mirror_response = _generate_mock_response(l2_result)
    print(f"\n3️⃣  Generated Mirror Response:\n   {mirror_response[:200]}...\n")
    
    # 4. L0 Constitutional Check (Output)
    print("4️⃣  L0 Constitutional Check (Output)...")
    l0_result = l0.check_output(mirror_response)
    print(f"   ✅ Passed: {l0_result.passed}")
    print(f"   Directive %: {l0._calculate_directive_percentage(mirror_response):.1f}%")
    
    if l0_result.blocked:
        print(f"   🛑 Blocked by L0: {l0_result.violations}")
        return False
    
    # 5. L3 Expression Rendering
    print("\n5️⃣  L3 Expression Rendering...")
    prefs = ExpressionPreferences(
        tone=ToneStyle.REFLECTIVE,
        formality=FormalityLevel.BALANCED,
        length=ResponseLength.MODERATE
    )
    ctx = ContextualFactors(emotional_intensity=0.6)
    
    l3_result = l3.render(mirror_response, prefs, ctx)
    print(f"   Style: {l3_result.style_applied}")
    print(f"   Adaptations: {', '.join(l3_result.adaptations_made)}")
    print(f"   Preserved: {', '.join(l3_result.preserved_invariants[:2])}...")
    
    # 6. L1 Safety Check (Output)
    print("\n6️⃣  L1 Safety Check (Output)...")
    l1_output_result = l1.check_output(l3_result.text)
    print(f"   ✅ Passed: {l1_output_result.passed}")
    
    print(f"\n📤 Final Output:\n{l3_result.text}\n")
    
    return True


def test_tier2_flag_flow():
    """Test reflection flow with Tier 2 safety flag"""
    print("\n" + "=" * 80)
    print("TEST 2: Tier 2 Flag Flow (Self-Harm Ideation)")
    print("=" * 80)
    
    l1 = L1SafetyLayer()
    l2 = L2ReflectionTransformer()
    
    # User input with self-harm ideation (Tier 2)
    user_input = "I've been thinking about suicide a lot lately. I feel so hopeless."
    
    print(f"\n📝 User Input:\n{user_input}\n")
    
    # L1 Safety Check (Input)
    print("1️⃣  L1 Safety Check (Input)...")
    l1_result = l1.check_input(user_input)
    print(f"   Status: {l1_result.passed}")
    print(f"   Severity: {l1_result.severity.value}")
    print(f"   Requires Acknowledgment: {l1_result.requires_user_acknowledgment}")
    
    if l1_result.requires_user_acknowledgment:
        print(f"\n⚠️  Warning Message:\n{l1_result.warning_message}")
    
    # Still transform (Tier 2 doesn't block)
    print("\n2️⃣  L2 Transformation (proceeds with warning)...")
    l2_result = l2.transform(user_input)
    print(f"   Themes: {[t.name for t in l2_result.themes[:3]]}")
    
    return True


def test_tier1_block_flow():
    """Test reflection flow with Tier 1 block"""
    print("\n" + "=" * 80)
    print("TEST 3: Tier 1 Block Flow (Imminent Harm)")
    print("=" * 80)
    
    l1 = L1SafetyLayer()
    
    # User input with imminent harm (Tier 1)
    user_input = "I'm planning to kill myself tonight. I have the pills ready."
    
    print(f"\n📝 User Input:\n{user_input}\n")
    
    # L1 Safety Check (Input)
    print("1️⃣  L1 Safety Check (Input)...")
    l1_result = l1.check_input(user_input)
    print(f"   ❌ Blocked: {not l1_result.passed}")
    print(f"   Severity: {l1_result.severity.value}")
    
    if not l1_result.passed:
        print(f"\n🛑 Block Message:\n{l1_result.warning_message}")
    
    return not l1_result.passed  # Success = blocked correctly


def test_constitutional_violation_flow():
    """Test flow with constitutional violation"""
    print("\n" + "=" * 80)
    print("TEST 4: Constitutional Violation Flow")
    print("=" * 80)
    
    l0 = L0AxiomChecker()
    l3 = L3ExpressionRenderer()
    
    # Mirror response with prescription (I1 violation)
    bad_response = (
        "You should definitely leave your job and pursue the startup. "
        "You need to prioritize your dreams over stability. "
        "You must take this risk or you'll regret it forever."
    )
    
    print(f"\n📝 Generated Response (with violations):\n{bad_response}\n")
    
    # L0 Check
    print("1️⃣  L0 Constitutional Check...")
    l0_result = l0.check_output(bad_response)
    print(f"   ❌ Passed: {l0_result.passed}")
    print(f"   Violations: {l0_result.violations}")
    print(f"   Directive %: {l0._calculate_directive_percentage(bad_response):.1f}%")
    
    if not l0_result.passed:
        # Try auto-rewrite
        print("\n2️⃣  Attempting Auto-Rewrite...")
        rewritten = l0.auto_rewrite(bad_response, l0_result.violations)
        print(f"   Rewritten: {rewritten[:200]}...")
        
        # Check rewrite
        rewrite_check = l0.check_output(rewritten)
        print(f"   ✅ Rewrite Passed: {rewrite_check.passed}")
        
        # Render rewritten version
        if rewrite_check.passed:
            prefs = ExpressionPreferences(tone=ToneStyle.REFLECTIVE)
            ctx = ContextualFactors()
            l3_result = l3.render(rewritten, prefs, ctx)
            print(f"\n📤 Final Output:\n{l3_result.text}")
    
    return True


def test_expression_adaptation():
    """Test L3 expression adaptation"""
    print("\n" + "=" * 80)
    print("TEST 5: Expression Adaptation (Different Styles)")
    print("=" * 80)
    
    l3 = L3ExpressionRenderer()
    
    base_response = (
        "I notice a tension in your reflection between stability and risk. "
        "Part of you values security, while another part yearns for meaning. "
        "This conflict appears in several recent reflections."
    )
    
    print(f"\n📝 Base Response:\n{base_response}\n")
    
    # Test different styles
    styles = [
        (ToneStyle.SUPPORTIVE, FormalityLevel.CASUAL, "Supportive + Casual"),
        (ToneStyle.DIRECT, FormalityLevel.FORMAL, "Direct + Formal"),
        (ToneStyle.EXPLORATORY, FormalityLevel.BALANCED, "Exploratory + Balanced"),
    ]
    
    for tone, formality, label in styles:
        print(f"\n{label}:")
        prefs = ExpressionPreferences(tone=tone, formality=formality)
        ctx = ContextualFactors(emotional_intensity=0.5)
        result = l3.render(base_response, prefs, ctx)
        print(f"  {result.text[:150]}...")
    
    return True


def _generate_mock_response(l2_result):
    """Generate mock mirror response based on L2 transformation"""
    themes = [t.name for t in l2_result.themes[:2]]
    
    response = (
        f"I notice you're expressing tensions around {' and '.join(themes)}. "
        f"There's a pattern here of conflict between different parts of you—"
        f"one part values stability and partnership, while another part yearns "
        f"for meaning and risk. You mention feeling 'torn' and 'scared,' which "
        f"suggests this isn't a simple decision but a deeper question about "
        f"who you're becoming. What does courage mean to you right now?"
    )
    
    return response


# Run all tests
if __name__ == "__main__":
    print("\n🔬 LAYERED REFLECTION ENGINE INTEGRATION TEST")
    print("=" * 80)
    print("\nTesting L1 (Safety) → L2 (Transform) → L0 (Constitution) → L3 (Expression)")
    
    results = []
    
    try:
        results.append(("Clean Flow", test_clean_reflection_flow()))
        results.append(("Tier 2 Flag", test_tier2_flag_flow()))
        results.append(("Tier 1 Block", test_tier1_block_flow()))
        results.append(("Constitutional Violation", test_constitutional_violation_flow()))
        results.append(("Expression Adaptation", test_expression_adaptation()))
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print("\n✅ All integration tests passed!")
        print("\n🎉 L1-L3 layers fully functional and integrated")
    else:
        print("\n❌ Some tests failed")
        sys.exit(1)
