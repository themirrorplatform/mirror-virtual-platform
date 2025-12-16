"""
Test script to verify protocol types work correctly.

This tests the basic functionality of the protocol types before
running the full property-based test suite.
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from protocol.types import InvocationMode, MirrorRequest, MirrorResponse, InvocationContract, AxiomViolation

def test_post_action_valid():
    """Test that valid POST_ACTION requests pass."""
    request = MirrorRequest(
        user_content="I felt anxious today about my presentation",
        mode=InvocationMode.POST_ACTION,
        user_id="user123"
    )
    
    # Validate request
    violations = request.validate()
    assert len(violations) == 0, f"Expected no violations, got: {violations}"
    
    # Validate invocation contract
    contract_violations = InvocationContract.validate_invocation(request)
    assert len(contract_violations) == 0, f"Expected no violations, got: {contract_violations}"
    
    # Enforce contract
    response = InvocationContract.enforce(request)
    assert response is None, "Expected None (proceed), got response with violations"
    
    print("✓ POST_ACTION valid request passed")


def test_post_action_missing_content():
    """Test that POST_ACTION without content fails."""
    request = MirrorRequest(
        user_content="",  # Empty!
        mode=InvocationMode.POST_ACTION,
        user_id="user123"
    )
    
    violations = request.validate()
    assert len(violations) > 0, "Expected violations for empty content"
    assert any(v.axiom_id == "post_action" for v in violations)
    
    print("✓ POST_ACTION empty content correctly rejected")


def test_post_action_directive_content():
    """Test that directive requests are caught in POST_ACTION mode."""
    request = MirrorRequest(
        user_content="What should I do about my anxiety?",  # Directive!
        mode=InvocationMode.POST_ACTION,
        user_id="user123"
    )
    
    contract_violations = InvocationContract.validate_invocation(request)
    assert len(contract_violations) > 0, "Expected violations for directive in POST_ACTION"
    assert any("directive" in v.reason.lower() for v in contract_violations)
    
    print("✓ POST_ACTION directive request correctly rejected")


def test_sovereignty_missing_user_id():
    """Test that requests without user_id fail (sovereignty axiom)."""
    request = MirrorRequest(
        user_content="I felt happy today",
        mode=InvocationMode.POST_ACTION,
        user_id=""  # Missing!
    )
    
    violations = request.validate()
    assert len(violations) > 0, "Expected violations for missing user_id"
    assert any(v.axiom_id == "sovereignty" for v in violations)
    
    print("✓ Sovereignty axiom enforced (user_id required)")


def test_guidance_mode_valid():
    """Test that GUIDANCE mode allows directive requests."""
    request = MirrorRequest(
        user_content="What should I do about my anxiety?",
        mode=InvocationMode.GUIDANCE,
        user_id="user123"
    )
    
    violations = request.validate()
    assert len(violations) == 0, f"Expected no violations in GUIDANCE mode, got: {violations}"
    
    contract_violations = InvocationContract.validate_invocation(request)
    assert len(contract_violations) == 0, f"Expected no violations, got: {contract_violations}"
    
    print("✓ GUIDANCE mode allows directive requests")


def test_system_mode_no_user_content():
    """Test that SYSTEM mode should not have user content."""
    request = MirrorRequest(
        user_content="Some user text",  # Should not have!
        mode=InvocationMode.SYSTEM,
        user_id="system"
    )
    
    contract_violations = InvocationContract.validate_invocation(request)
    assert len(contract_violations) > 0, "Expected violations for user_content in SYSTEM mode"
    
    print("✓ SYSTEM mode correctly rejects user content")


def test_response_audit_trail():
    """Test that responses have audit trails."""
    response = MirrorResponse(
        reflection="I notice you mentioned feeling anxious"
    )
    
    response.add_audit_entry("L0_CONTRACT", "validated", {"result": "pass"})
    response.add_audit_entry("L1_SAFETY", "checked", {"crisis": False})
    
    assert len(response.audit_trail) == 2
    assert response.audit_trail[0]["layer"] == "L0_CONTRACT"
    assert response.audit_trail[1]["layer"] == "L1_SAFETY"
    assert response.is_compliant()
    
    print("✓ Response audit trail works")


def test_response_violations():
    """Test that violations mark response as failed."""
    response = MirrorResponse(
        reflection="You are definitely depressed"  # Certainty violation!
    )
    
    violation = AxiomViolation(
        axiom_id="certainty",
        axiom_name="No Certainty About Unknowables",
        severity="fatal",
        reason="Claimed certainty about internal state"
    )
    
    response.add_violation(violation)
    
    assert not response.success
    assert not response.is_compliant()
    assert len(response.violations) == 1
    
    print("✓ Response violations work correctly")


if __name__ == "__main__":
    print("\n=== Testing Protocol Types ===\n")
    
    test_post_action_valid()
    test_post_action_missing_content()
    test_post_action_directive_content()
    test_sovereignty_missing_user_id()
    test_guidance_mode_valid()
    test_system_mode_no_user_content()
    test_response_audit_trail()
    test_response_violations()
    
    print("\n✅ All protocol type tests passed!\n")
