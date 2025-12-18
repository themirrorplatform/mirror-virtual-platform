"""
Tests for anti-capture protections.

Covers:
- Bicameral system
- Timelocks
- Constitutional court
"""

import pytest
from datetime import datetime, timedelta

from ..base import VoteResult, ChamberType, GovernanceConfig
from ..anti_capture.bicameral import (
    BicameralSystem,
    BicameralResult,
    ProposalCategory,
    ChamberRequirements,
)
from ..anti_capture.timelocks import (
    TimelockManager,
    TimelockConfig,
    TimelockStatus,
)
from ..anti_capture.court import (
    ConstitutionalCourt,
    RulingType,
    ViolationType,
    Violation,
)


class TestBicameralSystem:
    """Test bicameral voting system."""

    def setup_method(self):
        """Set up test fixtures."""
        self.bicameral = BicameralSystem()

    def test_get_requirements_by_category(self):
        """Test getting requirements for different categories."""
        minor_reqs = self.bicameral.get_requirements(
            ProposalCategory.MINOR,
            ChamberType.USER
        )
        constitutional_reqs = self.bicameral.get_requirements(
            ProposalCategory.CONSTITUTIONAL,
            ChamberType.USER
        )

        # Constitutional has higher thresholds
        assert constitutional_reqs.threshold > minor_reqs.threshold
        assert constitutional_reqs.quorum > minor_reqs.quorum
        assert constitutional_reqs.timelock_days > minor_reqs.timelock_days

    def test_evaluate_passing_proposal(self):
        """Test evaluating a proposal that passes both chambers."""
        # Create results that pass both chambers
        user_result = VoteResult(
            for_votes=80.0,
            against_votes=20.0,
            abstain_votes=0.0,
            total_votes=100.0,
            quorum_met=True,
            majority_met=True,
            supermajority_met=True,
        )
        guardian_result = VoteResult(
            for_votes=4.0,
            against_votes=1.0,
            abstain_votes=0.0,
            total_votes=5.0,
            quorum_met=True,
            majority_met=True,
            supermajority_met=True,
        )

        result = self.bicameral.evaluate_proposal(
            proposal_id="prop_001",
            user_result=user_result,
            guardian_result=guardian_result,
            category=ProposalCategory.STANDARD,
        )

        assert result.user_passed
        assert result.guardian_passed
        assert result.both_passed

    def test_evaluate_failing_guardian_chamber(self):
        """Test proposal that fails guardian chamber."""
        user_result = VoteResult(
            for_votes=80.0,
            against_votes=20.0,
            abstain_votes=0.0,
            total_votes=100.0,
            quorum_met=True,
            majority_met=True,
            supermajority_met=True,
        )
        guardian_result = VoteResult(
            for_votes=1.0,
            against_votes=4.0,
            abstain_votes=0.0,
            total_votes=5.0,
            quorum_met=True,
            majority_met=False,
            supermajority_met=False,
        )

        result = self.bicameral.evaluate_proposal(
            proposal_id="prop_001",
            user_result=user_result,
            guardian_result=guardian_result,
            category=ProposalCategory.STANDARD,
        )

        assert result.user_passed
        assert not result.guardian_passed
        assert not result.both_passed

    def test_minority_protection_triggers_supermajority(self):
        """Test that minority protection triggers supermajority requirement."""
        # 55% for, 45% against - minority protection triggers
        user_result = VoteResult(
            for_votes=55.0,
            against_votes=45.0,
            abstain_votes=0.0,
            total_votes=100.0,
            quorum_met=True,
            majority_met=True,
            supermajority_met=False,
        )
        guardian_result = VoteResult(
            for_votes=5.0,
            against_votes=0.0,
            abstain_votes=0.0,
            total_votes=5.0,
            quorum_met=True,
            majority_met=True,
            supermajority_met=True,
        )

        result = self.bicameral.evaluate_proposal(
            proposal_id="prop_001",
            user_result=user_result,
            guardian_result=guardian_result,
            category=ProposalCategory.STANDARD,
            check_minority_protection=True,
        )

        # Minority protection was triggered
        assert result.minority_protection_triggered
        # With 55% for and supermajority required (66%), this fails
        assert not result.user_passed

    def test_timelock_days_by_category(self):
        """Test timelock days vary by category."""
        minor_days = self.bicameral.get_timelock_days(ProposalCategory.MINOR)
        constitutional_days = self.bicameral.get_timelock_days(ProposalCategory.CONSTITUTIONAL)

        assert constitutional_days > minor_days


class TestTimelockManager:
    """Test timelock management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.config = TimelockConfig(
            minor_days=3,
            standard_days=7,
            major_days=14,
            constitutional_days=30,
            emergency_halt_threshold=0.20,
            min_halt_signers=2,
        )
        self.manager = TimelockManager(self.config)

    def test_create_timelock(self):
        """Test creating a timelock."""
        timelock = self.manager.create_timelock(
            proposal_id="prop_001",
            duration_days=14
        )

        assert timelock.id is not None
        assert timelock.proposal_id == "prop_001"
        assert timelock.duration_days == 14
        assert timelock.status == TimelockStatus.PENDING

    def test_start_timelock(self):
        """Test starting a timelock."""
        timelock = self.manager.create_timelock("prop_001", duration_days=7)
        started = self.manager.start_timelock(timelock.id)

        assert started.status == TimelockStatus.ACTIVE
        assert started.starts_at is not None
        assert started.ends_at is not None
        assert started.ends_at > started.starts_at

    def test_timelock_by_category(self):
        """Test timelock duration varies by category."""
        minor_tl = self.manager.create_timelock("prop_001", category="minor")
        const_tl = self.manager.create_timelock("prop_002", category="constitutional")

        assert const_tl.duration_days > minor_tl.duration_days

    def test_emergency_halt_signing(self):
        """Test emergency halt signature collection."""
        timelock = self.manager.create_timelock("prop_001", duration_days=7)
        self.manager.start_timelock(timelock.id)

        # Sign halt
        count = self.manager.sign_halt(timelock.id, "user_1", "Security concern")
        assert count == 1

        count = self.manager.sign_halt(timelock.id, "user_2")
        assert count == 2

        # Duplicate signature doesn't increase count
        count = self.manager.sign_halt(timelock.id, "user_1")
        assert count == 2

    def test_emergency_halt_threshold(self):
        """Test emergency halt threshold check."""
        timelock = self.manager.create_timelock("prop_001", duration_days=7)
        self.manager.start_timelock(timelock.id)

        self.manager.sign_halt(timelock.id, "user_1")
        self.manager.sign_halt(timelock.id, "user_2")

        # With 10 total users and 2 signatures (20%), threshold is met
        reached = self.manager.check_halt_threshold(timelock.id, total_eligible_users=10)
        assert reached is True

        # With 100 users, 2 signatures (2%) is not enough
        reached = self.manager.check_halt_threshold(timelock.id, total_eligible_users=100)
        assert reached is False

    def test_halt_timelock(self):
        """Test halting a timelock."""
        timelock = self.manager.create_timelock("prop_001", duration_days=7)
        self.manager.start_timelock(timelock.id)

        halted = self.manager.halt_timelock(timelock.id, "Critical bug found")

        assert halted.status == TimelockStatus.HALTED
        assert halted.halted_at is not None
        assert halted.halt_reason == "Critical bug found"

    def test_extension_request(self):
        """Test requesting a timelock extension."""
        timelock = self.manager.create_timelock("prop_001", duration_days=7)
        self.manager.start_timelock(timelock.id)

        extended = self.manager.request_extension(
            timelock.id,
            additional_days=7,
            reason="Need more review time",
            requester_id="guardian_1"
        )

        assert len(extended.extensions) == 1
        assert extended.extensions[0]["days"] == 7


class TestConstitutionalCourt:
    """Test constitutional court review."""

    def setup_method(self):
        """Set up test fixtures."""
        self.court = ConstitutionalCourt(
            min_justices=3,
            quorum=0.60,
            review_days=14
        )

        # Appoint justices
        for i in range(5):
            self.court.appoint_justice(f"justice_{i}", term_years=6)

    def test_appoint_justice(self):
        """Test justice appointment."""
        active = self.court.get_active_justices()
        assert len(active) == 5

    def test_has_quorum(self):
        """Test quorum check."""
        assert self.court.has_quorum()

    def test_open_review(self):
        """Test opening a constitutional review."""
        ruling = self.court.open_review("prop_001")

        assert ruling.id is not None
        assert ruling.proposal_id == "prop_001"
        assert not ruling.finalized

    def test_cast_vote(self):
        """Test justice voting."""
        ruling = self.court.open_review("prop_001")

        vote = self.court.cast_vote(
            ruling_id=ruling.id,
            justice_id="justice_0",
            ruling_type=RulingType.COMPATIBLE,
            reasoning="No constitutional violations found"
        )

        assert vote.ruling == RulingType.COMPATIBLE
        assert ruling.compatible_votes == 1

    def test_incompatible_with_violations(self):
        """Test voting incompatible with violations."""
        ruling = self.court.open_review("prop_001")

        violations = [
            Violation(
                type=ViolationType.AXIOM_MODIFICATION,
                description="Attempts to modify sovereignty axiom",
                target="sovereignty",
                severity="blocking",
            )
        ]

        self.court.cast_vote(
            ruling_id=ruling.id,
            justice_id="justice_0",
            ruling_type=RulingType.INCOMPATIBLE,
            reasoning="Violates axiom",
            violations=violations
        )

        assert ruling.incompatible_votes == 1
        assert len(ruling.violations) == 1

    def test_finalize_review(self):
        """Test finalizing a review."""
        ruling = self.court.open_review("prop_001")

        # Need 3 votes for quorum (60% of 5 justices)
        self.court.cast_vote(ruling.id, "justice_0", RulingType.COMPATIBLE, "OK")
        self.court.cast_vote(ruling.id, "justice_1", RulingType.COMPATIBLE, "OK")
        self.court.cast_vote(ruling.id, "justice_2", RulingType.COMPATIBLE, "OK")

        final = self.court.finalize_review(ruling.id)

        assert final.finalized
        assert final.ruling == RulingType.COMPATIBLE

    def test_blocking_violation_overrides(self):
        """Test that blocking violations cause incompatible ruling."""
        ruling = self.court.open_review("prop_001")

        # 2 compatible, 1 incompatible with blocking violation
        self.court.cast_vote(ruling.id, "justice_0", RulingType.COMPATIBLE, "OK")
        self.court.cast_vote(ruling.id, "justice_1", RulingType.COMPATIBLE, "OK")
        self.court.cast_vote(
            ruling.id,
            "justice_2",
            RulingType.INCOMPATIBLE,
            "Violates axiom",
            violations=[Violation(
                type=ViolationType.AXIOM_MODIFICATION,
                description="Bad",
                target="axiom",
                severity="blocking",
            )]
        )

        final = self.court.finalize_review(ruling.id)

        # Blocking violation means incompatible regardless of vote count
        assert final.ruling == RulingType.INCOMPATIBLE

    def test_duplicate_vote_rejected(self):
        """Test that justices cannot vote twice."""
        ruling = self.court.open_review("prop_001")

        self.court.cast_vote(ruling.id, "justice_0", RulingType.COMPATIBLE, "OK")

        with pytest.raises(ValueError, match="already voted"):
            self.court.cast_vote(ruling.id, "justice_0", RulingType.INCOMPATIBLE, "Changed mind")

    def test_non_justice_cannot_vote(self):
        """Test that non-justices cannot vote."""
        ruling = self.court.open_review("prop_001")

        with pytest.raises(ValueError, match="not active"):
            self.court.cast_vote(ruling.id, "random_person", RulingType.COMPATIBLE, "OK")
