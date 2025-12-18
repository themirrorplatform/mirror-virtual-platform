"""
Tests for leave-ability and anti-stickiness system.
"""

import pytest
from datetime import datetime, timedelta

from ..leaveability import (
    LeaveabilityGuard,
    EngagementMetrics,
    BreakSuggestion,
    BreakType,
    EngagementLevel,
    AntiStickinessEngine,
)


class TestEngagementMetrics:
    """Test engagement metrics tracking."""

    def test_session_duration(self):
        """Test session duration calculation."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=30),
        )

        duration = metrics.session_duration_minutes()
        assert 29 < duration < 31  # Allow some tolerance

    def test_above_average_detection(self):
        """Test detecting above-average sessions."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=40),
            average_session_minutes=20.0,  # Typical is 20 mins
        )

        # 40 minutes is above 1.5x average (30)
        assert metrics.is_above_average()

    def test_messages_above_typical(self):
        """Test detecting above-typical message counts."""
        metrics = EngagementMetrics(
            user_id="user_001",
            messages_this_session=20,
            typical_messages_per_session=8.0,
        )

        # 20 is above 1.5x typical (12)
        assert metrics.messages_above_typical()


class TestLeaveabilityGuard:
    """Test leave-ability enforcement."""

    def setup_method(self):
        self.guard = LeaveabilityGuard(
            session_warning_minutes=45,
            session_limit_minutes=90,
            min_messages_before_break=10,
            max_sessions_per_day=4,
            max_consecutive_days=7,
        )

    def test_assess_healthy_engagement(self):
        """Test healthy engagement classification."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=15),
            messages_this_session=5,
        )

        level = self.guard.assess_engagement(metrics)
        assert level == EngagementLevel.HEALTHY

    def test_assess_elevated_engagement(self):
        """Test elevated engagement classification."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=35),
            average_session_minutes=20.0,
        )

        level = self.guard.assess_engagement(metrics)
        assert level == EngagementLevel.ELEVATED

    def test_assess_critical_engagement(self):
        """Test critical engagement classification."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=95),
        )

        level = self.guard.assess_engagement(metrics)
        assert level == EngagementLevel.CRITICAL

    def test_should_suggest_break_at_limit(self):
        """Test break suggestion at session limit."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=95),
        )

        assert self.guard.should_suggest_break(metrics)

    def test_should_suggest_break_at_warning(self):
        """Test break suggestion at warning threshold."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=50),
        )

        assert self.guard.should_suggest_break(metrics)

    def test_should_not_suggest_break_early(self):
        """Test no break suggestion for short sessions."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=10),
            messages_this_session=5,
        )

        # Usually won't suggest, though there's a random chance
        # Run multiple times to verify it's mostly false
        results = [self.guard.should_suggest_break(metrics) for _ in range(10)]
        assert sum(results) < 5  # Should be mostly False

    def test_break_suggestion_type_by_severity(self):
        """Test break suggestion types match severity."""
        # Critical -> REQUIRED
        critical_metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=95),
        )
        suggestion = self.guard.get_break_suggestion(critical_metrics)
        assert suggestion.type == BreakType.REQUIRED
        assert suggestion.is_required

        # Concerning -> ENCOURAGED
        concerning_metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=70),
        )
        suggestion = self.guard.get_break_suggestion(concerning_metrics)
        assert suggestion.type == BreakType.ENCOURAGED

    def test_celebrate_departure(self):
        """Test departure celebration messages."""
        metrics = EngagementMetrics(user_id="user_001")
        message = self.guard.celebrate_departure(metrics)

        assert len(message) > 0
        # Should be positive/neutral, not guilt-inducing
        assert "don't go" not in message.lower()
        assert "stay" not in message.lower()

    def test_should_discourage_return(self):
        """Test return discouragement logic."""
        # Recent session
        metrics = EngagementMetrics(
            user_id="user_001",
            last_session_end=datetime.utcnow() - timedelta(minutes=30),
        )

        assert self.guard.should_discourage_return(metrics)

        # Session long ago
        metrics.last_session_end = datetime.utcnow() - timedelta(hours=5)
        assert not self.guard.should_discourage_return(metrics)

    def test_format_metrics_display(self):
        """Test metrics formatting for transparency."""
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=30),
            messages_this_session=15,
            sessions_today=2,
            total_session_minutes_today=60.0,
            consecutive_days=3,
        )

        display = self.guard.format_metrics_display(metrics)

        assert "30" in display or "29" in display or "31" in display  # minutes
        assert "15" in display  # messages
        assert "2" in display  # sessions today
        assert "3" in display  # consecutive days


class TestAntiStickinessEngine:
    """Test anti-stickiness measures."""

    def setup_method(self):
        self.engine = AntiStickinessEngine()

    def test_record_interactions(self):
        """Test recording interactions."""
        self.engine.record_interaction("user_001")
        self.engine.record_interaction("user_001")

        pattern = self.engine.get_usage_pattern("user_001")
        assert pattern["interaction_count"] == 2

    def test_healthy_pattern(self):
        """Test healthy usage pattern detection."""
        # Spread out interactions
        self.engine._user_patterns["user_001"] = [
            datetime.utcnow() - timedelta(hours=24),
            datetime.utcnow() - timedelta(hours=12),
            datetime.utcnow(),
        ]

        pattern = self.engine.get_usage_pattern("user_001")
        assert pattern["pattern"] == "healthy"

    def test_concerning_high_frequency(self):
        """Test concerning high-frequency pattern."""
        # Interactions every hour
        self.engine._user_patterns["user_001"] = [
            datetime.utcnow() - timedelta(hours=3),
            datetime.utcnow() - timedelta(hours=2),
            datetime.utcnow() - timedelta(hours=1),
            datetime.utcnow(),
        ]

        pattern = self.engine.get_usage_pattern("user_001")
        assert pattern["pattern"] == "concerning"
        assert "high_frequency" in pattern["reasons"]

    def test_should_reduce_engagement(self):
        """Test engagement reduction trigger."""
        # High frequency pattern
        self.engine._user_patterns["user_001"] = [
            datetime.utcnow() - timedelta(hours=i)
            for i in range(10)
        ]

        assert self.engine.should_reduce_engagement("user_001")

    def test_engagement_reduction_strategies(self):
        """Test getting reduction strategies."""
        self.engine._user_patterns["user_001"] = [
            datetime.utcnow() - timedelta(hours=i)
            for i in range(10)
        ]

        strategies = self.engine.get_engagement_reduction_strategy("user_001")

        assert strategies["should_reduce"]
        assert len(strategies["strategies"]) > 0
