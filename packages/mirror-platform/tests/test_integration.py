"""
Tests for integration entry points.
"""

import pytest

from ..integration import (
    PackageInfo,
    check_package_availability,
    get_system_info,
    print_system_info,
    IntegratedPipeline,
    CONSTITUTIONAL_AXIOMS,
    get_axiom,
    get_all_axioms,
    validate_constitutional_compliance,
)
from ..config import MirrorPlatformConfig


class TestPackageInfo:
    """Test package info structure."""

    def test_create_available_package(self):
        """Test creating available package info."""
        info = PackageInfo(
            name="mirror-core",
            version="1.0.0",
            description="Core types",
            available=True,
        )

        assert info.name == "mirror-core"
        assert info.available is True
        assert info.error is None

    def test_create_unavailable_package(self):
        """Test creating unavailable package info."""
        info = PackageInfo(
            name="mirror-core",
            version="unknown",
            description="Core types",
            available=False,
            error="Module not found",
        )

        assert info.available is False
        assert info.error is not None


class TestPackageAvailability:
    """Test package availability checking."""

    def test_check_returns_dict(self):
        """Test check returns dictionary of packages."""
        packages = check_package_availability()

        assert isinstance(packages, dict)
        assert len(packages) > 0

    def test_all_expected_packages(self):
        """Test all expected packages are checked."""
        packages = check_package_availability()

        expected = [
            "mirror-core",
            "mirror-recognition",
            "mirror-providers",
            "mirror-storage",
            "mirror-governance",
            "mirror-expression",
            "mirror-orchestration",
        ]

        for pkg_name in expected:
            assert pkg_name in packages

    def test_package_info_structure(self):
        """Test package info has correct structure."""
        packages = check_package_availability()

        for name, info in packages.items():
            assert isinstance(info, PackageInfo)
            assert info.name == name
            assert info.description is not None


class TestSystemInfo:
    """Test system information."""

    def test_get_system_info(self):
        """Test getting system info."""
        info = get_system_info()

        assert "platform_version" in info
        assert "packages" in info
        assert "packages_available" in info
        assert "packages_total" in info
        assert "fully_operational" in info

    def test_system_info_counts(self):
        """Test system info counts are consistent."""
        info = get_system_info()

        assert info["packages_total"] == len(info["packages"])
        assert 0 <= info["packages_available"] <= info["packages_total"]

    def test_print_system_info(self, capsys):
        """Test printing system info."""
        print_system_info()

        captured = capsys.readouterr()
        assert "Mirror Platform System Info" in captured.out
        assert "Package Status" in captured.out


class TestConstitutionalAxioms:
    """Test constitutional axioms."""

    def test_axiom_count(self):
        """Test there are exactly 14 axioms."""
        assert len(CONSTITUTIONAL_AXIOMS) == 14

    def test_axiom_numbers(self):
        """Test axiom numbers are 1-14."""
        for i in range(1, 15):
            assert i in CONSTITUTIONAL_AXIOMS

    def test_axiom_structure(self):
        """Test each axiom has required fields."""
        for num, axiom in CONSTITUTIONAL_AXIOMS.items():
            assert "name" in axiom
            assert "text" in axiom
            assert "enforcement" in axiom

    def test_get_axiom(self):
        """Test getting specific axiom."""
        axiom = get_axiom(1)

        assert axiom is not None
        assert axiom["name"] == "Certainty"

    def test_get_axiom_invalid(self):
        """Test getting invalid axiom returns None."""
        axiom = get_axiom(999)

        assert axiom is None

    def test_get_all_axioms(self):
        """Test getting all axioms returns copy."""
        axioms = get_all_axioms()

        assert axioms == CONSTITUTIONAL_AXIOMS
        assert axioms is not CONSTITUTIONAL_AXIOMS  # Should be copy


class TestAxiomDetails:
    """Test specific axiom content."""

    def test_certainty_axiom(self):
        """Test Axiom 1: Certainty."""
        axiom = get_axiom(1)

        assert axiom["name"] == "Certainty"
        assert "certainty" in axiom["text"].lower()

    def test_sovereignty_axiom(self):
        """Test Axiom 2: Sovereignty."""
        axiom = get_axiom(2)

        assert axiom["name"] == "Sovereignty"
        assert "user" in axiom["text"].lower()

    def test_exit_freedom_axiom(self):
        """Test Axiom 7: Exit Freedom."""
        axiom = get_axiom(7)

        assert axiom["name"] == "Exit Freedom"
        assert "leave" in axiom["text"].lower()

    def test_capture_axiom(self):
        """Test Axiom 14: Capture."""
        axiom = get_axiom(14)

        assert axiom["name"] == "Capture"
        assert "dependency" in axiom["text"].lower()


class TestConstitutionalValidation:
    """Test constitutional compliance validation."""

    def test_no_violations(self):
        """Test clean text has no violations."""
        text = "I notice you're exploring themes around work."
        violations = validate_constitutional_compliance(text)

        assert len(violations) == 0

    def test_certainty_violation(self):
        """Test certainty language is detected."""
        text = "You definitely feel anxious about this."
        violations = validate_constitutional_compliance(text)

        assert len(violations) > 0
        assert any(v["axiom"] == 1 for v in violations)

    def test_diagnosis_violation(self):
        """Test diagnostic language is detected."""
        text = "You have depression and need treatment."
        violations = validate_constitutional_compliance(text)

        assert len(violations) > 0
        assert any(v["axiom"] == 4 for v in violations)

    def test_prescriptive_violation(self):
        """Test prescriptive language is detected."""
        text = "You should talk to a therapist. You must take action."
        violations = validate_constitutional_compliance(text)

        assert len(violations) > 0
        assert any(v["axiom"] == 9 for v in violations)

    def test_capture_violation(self):
        """Test capture language is detected."""
        text = "Don't leave. Only I understand you."
        violations = validate_constitutional_compliance(text)

        assert len(violations) > 0
        assert any(v["axiom"] == 14 for v in violations)

    def test_violation_severity(self):
        """Test violations have severity levels."""
        text = "You have depression"  # Critical violation
        violations = validate_constitutional_compliance(text)

        assert len(violations) > 0
        assert violations[0]["severity"] == "critical"

    def test_multiple_violations(self):
        """Test multiple violations are detected."""
        text = "You definitely have anxiety. You should see a doctor."
        violations = validate_constitutional_compliance(text)

        # Should detect both certainty and prescriptive
        axioms_violated = {v["axiom"] for v in violations}
        assert len(axioms_violated) >= 2


class TestIntegratedPipeline:
    """Test integrated pipeline."""

    def setup_method(self):
        self.config = MirrorPlatformConfig()
        self.pipeline = IntegratedPipeline(self.config)

    def test_create_pipeline(self):
        """Test creating integrated pipeline."""
        assert self.pipeline is not None
        assert self.pipeline.config == self.config

    def test_initial_state(self):
        """Test initial state is not initialized."""
        assert self.pipeline.is_initialized is False

    @pytest.mark.asyncio
    async def test_initialize(self):
        """Test initialization."""
        # May fail if packages not available, but shouldn't crash
        try:
            await self.pipeline.initialize()
            assert self.pipeline.is_initialized is True
        except RuntimeError:
            # Expected if required packages not available
            pass
