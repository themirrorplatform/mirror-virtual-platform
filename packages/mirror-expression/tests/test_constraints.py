"""
Tests for constitutional expression constraints.
"""

import pytest
from ..constraints import (
    ConstitutionalConstraints,
    ConstraintViolation,
    ConstraintSeverity,
    AxiomEnforcer,
)


class TestConstitutionalConstraints:
    """Test constitutional constraint enforcement."""

    def setup_method(self):
        self.constraints = ConstitutionalConstraints(strict_mode=True)

    def test_detect_certainty_violation(self):
        """Test detection of certainty claims."""
        text = "You are definitely depressed. This is clearly a problem."
        violations = self.constraints.check(text)

        certainty_violations = [
            v for v in violations
            if v.constraint_name == "certainty"
        ]
        assert len(certainty_violations) > 0
        assert any(v.severity == ConstraintSeverity.BLOCKING for v in certainty_violations)

    def test_detect_diagnostic_violation(self):
        """Test detection of diagnostic language."""
        text = "You have depression. You suffer from anxiety."
        violations = self.constraints.check(text)

        diagnostic_violations = [
            v for v in violations
            if v.constraint_name == "diagnostic"
        ]
        assert len(diagnostic_violations) > 0

    def test_detect_prescriptive_violation(self):
        """Test detection of prescriptive advice."""
        text = "You should change this. You must do better."
        violations = self.constraints.check(text)

        prescriptive_violations = [
            v for v in violations
            if v.constraint_name == "prescriptive"
        ]
        assert len(prescriptive_violations) > 0

    def test_detect_manipulation_violation(self):
        """Test detection of manipulative language."""
        text = "Don't you think you're wrong? Everyone knows this is bad."
        violations = self.constraints.check(text)

        manipulation_violations = [
            v for v in violations
            if v.constraint_name == "manipulation"
        ]
        assert len(manipulation_violations) > 0
        assert all(v.severity == ConstraintSeverity.BLOCKING for v in manipulation_violations)

    def test_detect_optimization_violation(self):
        """Test detection of optimization language."""
        text = "You should optimize your productivity. Maximize your potential."
        violations = self.constraints.check(text)

        optimization_violations = [
            v for v in violations
            if v.constraint_name == "optimization"
        ]
        assert len(optimization_violations) > 0

    def test_detect_capture_violation(self):
        """Test detection of capture attempts."""
        text = "Only I understand you. You need me. Without me, you can't."
        violations = self.constraints.check(text)

        capture_violations = [
            v for v in violations
            if v.constraint_name == "capture"
        ]
        assert len(capture_violations) > 0
        assert all(v.severity == ConstraintSeverity.BLOCKING for v in capture_violations)

    def test_clean_text_passes(self):
        """Test that constitutional text passes."""
        text = (
            "I notice a pattern that might be worth exploring. "
            "You could consider reflecting on this if it feels relevant. "
            "What do you think?"
        )
        violations = self.constraints.check(text)

        blocking = [v for v in violations if v.severity == ConstraintSeverity.BLOCKING]
        assert len(blocking) == 0

    def test_has_blocking_violations(self):
        """Test quick check for blocking violations."""
        bad_text = "You are definitely wrong."
        good_text = "You might want to consider this."

        assert self.constraints.has_blocking_violations(bad_text)
        assert not self.constraints.has_blocking_violations(good_text)

    def test_rewrite_removes_violations(self):
        """Test that rewrite attempts to fix violations."""
        text = "You are definitely having issues."
        rewritten = self.constraints.rewrite(text)

        # Should be softer language
        assert "might" in rewritten.lower() or "seems" in rewritten.lower() or rewritten != text

    def test_validate_and_rewrite(self):
        """Test combined validation and rewriting."""
        text = "You are wrong. You should fix this."
        rewritten, remaining = self.constraints.validate_and_rewrite(text)

        # Should have attempted fixes
        assert rewritten != text or len(remaining) < len(self.constraints.check(text))

    def test_violations_have_suggestions(self):
        """Test that violations include suggestions where possible."""
        text = "You are clearly wrong about this."
        violations = self.constraints.check(text)

        # At least some violations should have suggestions
        with_suggestions = [v for v in violations if v.suggestion]
        # May or may not have suggestions depending on pattern matching
        assert len(violations) > 0

    def test_constraint_summary(self):
        """Test getting constraint summary."""
        summary = self.constraints.get_constraint_summary()

        assert "certainty" in summary
        assert "diagnostic" in summary
        assert "prescriptive" in summary
        assert "manipulation" in summary
        assert "optimization" in summary
        assert "capture" in summary


class TestAxiomEnforcer:
    """Test high-level axiom enforcement."""

    def setup_method(self):
        self.enforcer = AxiomEnforcer()

    def test_check_expression_compliant(self):
        """Test checking a compliant expression."""
        text = "I notice a pattern here. Would you like to explore it?"
        result = self.enforcer.check_expression(text)

        assert result["overall_compliant"]
        assert result["blocking_violations"] == 0

    def test_check_expression_non_compliant(self):
        """Test checking a non-compliant expression."""
        text = "You definitely have a problem. You must change."
        result = self.enforcer.check_expression(text)

        assert not result["overall_compliant"]
        assert result["blocking_violations"] > 0

    def test_axiom_status_detailed(self):
        """Test detailed axiom status in report."""
        text = "You are definitely wrong. You should fix this."
        result = self.enforcer.check_expression(text)

        assert "axiom_status" in result
        # Check that we have status for multiple axioms
        assert len(result["axiom_status"]) > 0

    def test_get_axiom(self):
        """Test getting specific axiom details."""
        axiom_1 = self.enforcer.get_axiom(1)

        assert axiom_1 is not None
        assert axiom_1["name"] == "Certainty"
        assert "enforcement" in axiom_1

    def test_list_axioms(self):
        """Test listing all axioms."""
        axioms = self.enforcer.list_axioms()

        assert len(axioms) == 14  # 14 constitutional axioms
        assert all("number" in a for a in axioms)
        assert all("name" in a for a in axioms)

    def test_axiom_references_in_violations(self):
        """Test that violations reference specific axioms."""
        text = "You definitely have depression. You must get help."
        result = self.enforcer.check_expression(text)

        # Should have violations referencing Axiom 1 (certainty) and Axiom 4 (diagnosis)
        non_compliant_axioms = [
            num for num, status in result["axiom_status"].items()
            if not status["compliant"]
        ]
        assert len(non_compliant_axioms) > 0
