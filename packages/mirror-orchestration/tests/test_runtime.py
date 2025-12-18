"""
Tests for constitutional runtime.
"""

import pytest
from ..runtime import (
    ConstitutionalRuntime,
    RuntimeCheck,
    RuntimeCheckType,
    RuntimeViolation,
    ViolationSeverity,
    RuntimeGuard,
    ConstitutionalHalt,
)


class TestConstitutionalRuntime:
    """Test constitutional runtime enforcement."""

    def setup_method(self):
        self.runtime = ConstitutionalRuntime()

    def test_default_checks_registered(self):
        """Test that default checks are registered."""
        checks = self.runtime.list_checks()

        assert len(checks) > 0
        # Should have key checks
        check_names = [c["name"] for c in checks]
        assert "post_action_check" in check_names
        assert "exit_freedom_check" in check_names
        assert "no_diagnosis_check" in check_names

    def test_pre_action_check_user_initiated(self):
        """Test pre-action check requires user initiation."""
        context = {
            "user_initiated": False,
            "user_input": "",
        }

        violations = self.runtime.check_pre_action(context)

        assert len(violations) > 0
        assert any(v.axiom_number == 5 for v in violations)

    def test_pre_action_check_passes(self):
        """Test pre-action check passes for valid context."""
        context = {
            "user_initiated": True,
            "user_input": "Hello, I want to reflect.",
        }

        violations = self.runtime.check_pre_action(context)

        # Should have no critical violations
        critical = [v for v in violations if v.severity == ViolationSeverity.CRITICAL]
        assert len(critical) == 0

    def test_exit_freedom_violation(self):
        """Test exit freedom violation detection."""
        context = {
            "user_initiated": True,
            "user_input": "I want to leave",
            "exit_requested": True,
            "exit_blocked": True,
        }

        violations = self.runtime.check_pre_action(context)

        exit_violations = [v for v in violations if v.axiom_number == 7]
        assert len(exit_violations) > 0
        assert exit_violations[0].severity == ViolationSeverity.CRITICAL

    def test_post_action_diagnosis_detection(self):
        """Test post-action check detects diagnostic language."""
        context = {
            "output": "You have depression and should seek treatment.",
        }

        violations = self.runtime.check_post_action(context)

        diagnosis_violations = [v for v in violations if v.axiom_number == 4]
        assert len(diagnosis_violations) > 0

    def test_post_action_certainty_detection(self):
        """Test post-action check detects certainty claims."""
        context = {
            "output": "You definitely have issues with anger.",
        }

        violations = self.runtime.check_post_action(context)

        certainty_violations = [v for v in violations if v.axiom_number == 1]
        assert len(certainty_violations) > 0

    def test_post_action_capture_detection(self):
        """Test post-action check detects capture patterns."""
        context = {
            "output": "Only I understand you. You need me.",
        }

        violations = self.runtime.check_post_action(context)

        capture_violations = [v for v in violations if v.axiom_number == 14]
        assert len(capture_violations) > 0
        assert all(v.severity == ViolationSeverity.CRITICAL for v in capture_violations)

    def test_clean_output_passes(self):
        """Test clean output passes post-action checks."""
        context = {
            "output": "I notice a pattern that might be worth exploring.",
            "user_input": "I want to talk about my work.",
        }

        violations = self.runtime.check_post_action(context)

        # Should have no critical violations
        critical = [v for v in violations if v.severity == ViolationSeverity.CRITICAL]
        assert len(critical) == 0

    def test_should_halt(self):
        """Test halt decision based on violations."""
        critical = RuntimeViolation(
            axiom_number=4,
            axiom_name="Diagnosis",
            severity=ViolationSeverity.CRITICAL,
            description="Test",
        )
        warning = RuntimeViolation(
            axiom_number=6,
            axiom_name="Necessity",
            severity=ViolationSeverity.WARNING,
            description="Test",
        )

        assert self.runtime.should_halt([critical])
        assert not self.runtime.should_halt([warning])
        assert self.runtime.should_halt([warning, critical])

    def test_enable_disable_check(self):
        """Test enabling and disabling checks."""
        self.runtime.disable_check("no_diagnosis_check")

        context = {
            "output": "You have depression.",
        }

        violations = self.runtime.check_post_action(context)

        # Should not detect diagnosis violation when disabled
        diagnosis_violations = [v for v in violations if v.axiom_number == 4]
        assert len(diagnosis_violations) == 0

        # Re-enable
        self.runtime.enable_check("no_diagnosis_check")
        violations = self.runtime.check_post_action(context)
        diagnosis_violations = [v for v in violations if v.axiom_number == 4]
        assert len(diagnosis_violations) > 0

    def test_get_violation_history(self):
        """Test violation history tracking."""
        context = {
            "output": "You definitely have problems.",
        }

        self.runtime.check_post_action(context)
        self.runtime.check_post_action(context)

        history = self.runtime.get_violation_history()

        assert len(history) >= 2

    def test_get_compliance_metrics(self):
        """Test compliance metrics."""
        context = {
            "output": "You definitely need help.",
        }

        self.runtime.check_post_action(context)

        metrics = self.runtime.get_compliance_metrics()

        assert "total_violations" in metrics
        assert "by_axiom" in metrics
        assert "by_severity" in metrics

    def test_get_axiom_info(self):
        """Test getting axiom information."""
        info = self.runtime.get_axiom_info(7)

        assert info is not None
        assert "Exit Freedom" in info


class TestRuntimeGuard:
    """Test runtime guard wrapper."""

    def setup_method(self):
        self.runtime = ConstitutionalRuntime()
        self.guard = RuntimeGuard(self.runtime)

    @pytest.mark.asyncio
    async def test_guard_passes_valid_context(self):
        """Test guard passes valid context."""
        context = {
            "user_initiated": True,
            "user_input": "Hello",
        }

        async with self.guard.check(context):
            # Should not raise
            pass

    @pytest.mark.asyncio
    async def test_guard_halts_invalid_context(self):
        """Test guard halts invalid context."""
        context = {
            "user_initiated": False,
            "user_input": "",
        }

        with pytest.raises(ConstitutionalHalt):
            async with self.guard.check(context):
                pass


class TestConstitutionalHalt:
    """Test constitutional halt exception."""

    def test_halt_exception(self):
        """Test halt exception contains violation info."""
        violation = RuntimeViolation(
            axiom_number=5,
            axiom_name="Post-Action",
            severity=ViolationSeverity.CRITICAL,
            description="No user action",
        )

        halt = ConstitutionalHalt([violation])

        assert len(halt.violations) == 1
        assert "Axiom 5" in str(halt)
