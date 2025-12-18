"""
Tests for the voting system.

Covers:
- Direct voting
- Liquid democracy (delegation)
- Quadratic voting
- Minority protection
"""

import pytest
from datetime import datetime, timedelta

from ..base import VoteType, ChamberType, GovernanceConfig
from ..voting.engine import VotingEngine, VotingSession
from ..voting.delegation import DelegationManager
from ..voting.quadratic import QuadraticCalculator, QuadraticConfig


class TestVotingEngine:
    """Test core voting functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.config = GovernanceConfig(
            voting_days=7,
            user_quorum=0.10,
            guardian_quorum=0.50,
            simple_majority=0.50,
            supermajority=0.66,
            enable_quadratic=True,
        )
        self.engine = VotingEngine(self.config)

        # Register users
        for i in range(10):
            self.engine.register_user(f"user_{i}", weight=1.0)

        # Register guardians
        for i in range(5):
            self.engine.register_guardian(f"guardian_{i}", weight=1.0)

    def test_create_session(self):
        """Test creating a voting session."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER,
            duration_days=7
        )

        assert session.id is not None
        assert session.proposal_id == "prop_001"
        assert session.chamber == ChamberType.USER
        assert session.is_open()
        assert not session.finalized

    def test_cast_vote(self):
        """Test casting a vote."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER
        )

        record = self.engine.cast_vote(
            session_id=session.id,
            voter_id="user_0",
            vote=VoteType.FOR
        )

        assert record.voter_id == "user_0"
        assert record.vote == VoteType.FOR
        assert record.weight > 0

    def test_duplicate_vote_rejected(self):
        """Test that duplicate votes are rejected."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER
        )

        self.engine.cast_vote(session.id, "user_0", VoteType.FOR)

        with pytest.raises(ValueError, match="already voted"):
            self.engine.cast_vote(session.id, "user_0", VoteType.AGAINST)

    def test_change_vote(self):
        """Test changing a vote."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER
        )

        self.engine.cast_vote(session.id, "user_0", VoteType.FOR)
        new_record = self.engine.change_vote(session.id, "user_0", VoteType.AGAINST)

        assert new_record.vote == VoteType.AGAINST

    def test_guardian_chamber_restriction(self):
        """Test that non-guardians cannot vote in guardian chamber."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.GUARDIAN
        )

        with pytest.raises(ValueError, match="not a guardian"):
            self.engine.cast_vote(session.id, "user_0", VoteType.FOR)

        # Guardians can vote
        record = self.engine.cast_vote(session.id, "guardian_0", VoteType.FOR)
        assert record.voter_id == "guardian_0"

    def test_get_current_tally(self):
        """Test getting current vote tally."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER
        )

        # Cast some votes
        self.engine.cast_vote(session.id, "user_0", VoteType.FOR)
        self.engine.cast_vote(session.id, "user_1", VoteType.FOR)
        self.engine.cast_vote(session.id, "user_2", VoteType.AGAINST)

        tally = self.engine.get_current_tally(session.id)

        assert tally.for_votes > 0
        assert tally.against_votes > 0
        assert tally.total_votes == tally.for_votes + tally.against_votes

    def test_finalize_session_before_end(self):
        """Test that session cannot be finalized before voting period ends."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER,
            duration_days=7
        )

        self.engine.cast_vote(session.id, "user_0", VoteType.FOR)

        with pytest.raises(ValueError, match="not ended"):
            self.engine.finalize_session(session.id)

    def test_minority_protection_trigger(self):
        """Test minority protection mechanism."""
        session = self.engine.create_session(
            proposal_id="prop_001",
            chamber=ChamberType.USER
        )

        # Cast votes - 60% for, 40% against
        for i in range(6):
            self.engine.cast_vote(session.id, f"user_{i}", VoteType.FOR)
        for i in range(6, 10):
            self.engine.cast_vote(session.id, f"user_{i}", VoteType.AGAINST)

        # 40% against triggers minority protection (threshold is 10%)
        triggered = self.engine.check_minority_protection(session.id)
        assert triggered is True


class TestDelegation:
    """Test liquid democracy delegation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.delegation = DelegationManager()

    def test_create_delegation(self):
        """Test creating a delegation."""
        delegation = self.delegation.delegate(
            delegator_id="user_1",
            delegate_id="user_2",
            topic="general"
        )

        assert delegation.delegator_id == "user_1"
        assert delegation.delegate_id == "user_2"
        assert delegation.active

    def test_get_effective_weight(self):
        """Test calculating effective weight with delegations."""
        # user_1 delegates to user_2
        self.delegation.delegate("user_1", "user_2", "general")

        # user_2 now has their weight + user_1's weight
        weight = self.delegation.get_effective_weight("user_2", "general")
        assert weight == 2.0  # 1.0 base + 1.0 delegated

    def test_delegation_chain(self):
        """Test delegation chain resolution."""
        # user_1 -> user_2 -> user_3
        self.delegation.delegate("user_1", "user_2", "general")
        self.delegation.delegate("user_2", "user_3", "general")

        chain = self.delegation.get_delegation_chain("user_3", "general")
        assert len(chain) >= 2

    def test_self_delegation_rejected(self):
        """Test that self-delegation is rejected."""
        with pytest.raises(ValueError, match="Cannot delegate to self"):
            self.delegation.delegate("user_1", "user_1", "general")

    def test_revoke_delegation(self):
        """Test revoking a delegation."""
        self.delegation.delegate("user_1", "user_2", "general")
        self.delegation.revoke("user_1", "general")

        # Weight should be back to normal
        weight = self.delegation.get_effective_weight("user_2", "general")
        assert weight == 1.0

    def test_circular_delegation_prevented(self):
        """Test that circular delegations are prevented."""
        self.delegation.delegate("user_1", "user_2", "general")
        self.delegation.delegate("user_2", "user_3", "general")

        # This would create a cycle: user_3 -> user_1 -> user_2 -> user_3
        with pytest.raises(ValueError, match="circular"):
            self.delegation.delegate("user_3", "user_1", "general")


class TestQuadraticVoting:
    """Test quadratic voting calculations."""

    def setup_method(self):
        """Set up test fixtures."""
        self.calc = QuadraticCalculator(QuadraticConfig(
            max_weight=10.0,
            dampening_factor=1.0,
        ))

    def test_quadratic_weight(self):
        """Test quadratic weight calculation."""
        # sqrt(1) = 1
        assert self.calc.calculate_weight(1.0) == 1.0

        # sqrt(4) = 2
        assert self.calc.calculate_weight(4.0) == 2.0

        # sqrt(9) = 3
        assert self.calc.calculate_weight(9.0) == 3.0

    def test_max_weight_cap(self):
        """Test that weight is capped at maximum."""
        # Even with very high input, output is capped
        weight = self.calc.calculate_weight(1000000.0)
        assert weight <= self.calc.config.max_weight

    def test_zero_weight(self):
        """Test zero weight handling."""
        assert self.calc.calculate_weight(0.0) == 0.0

    def test_anti_plutocracy_effect(self):
        """Test that quadratic voting reduces whale advantage."""
        # Without quadratic: 100 weight = 100 votes
        # With quadratic: 100 weight = 10 votes (sqrt)

        whale_weight = 100.0
        small_weight = 1.0

        whale_votes = self.calc.calculate_weight(whale_weight)
        small_votes = self.calc.calculate_weight(small_weight)

        # Whale has 100x the weight but only 10x the votes
        ratio = whale_votes / small_votes
        assert ratio < whale_weight / small_weight
        assert ratio == 10.0  # sqrt(100) / sqrt(1)
