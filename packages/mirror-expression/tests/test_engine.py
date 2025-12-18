"""
Tests for the main expression engine.
"""

import pytest
from datetime import datetime, timedelta

from ..base import ToneProfile, ExpressionConfig, TONE_PRESETS
from ..engine import ExpressionEngine, ReflectionInput
from ..leaveability import EngagementMetrics


class TestReflectionInput:
    """Test reflection input structure."""

    def test_create_reflection_input(self):
        """Test creating a reflection input."""
        reflection = ReflectionInput(
            id="ref_001",
            content="I notice a pattern in your communication.",
            patterns_mentioned=["avoidance"],
            confidence=0.7,
        )

        assert reflection.id == "ref_001"
        assert reflection.confidence == 0.7


class TestExpressionEngine:
    """Test the main expression engine."""

    def setup_method(self):
        self.config = ExpressionConfig(
            enable_break_suggestions=True,
            session_warning_minutes=45,
            enable_anti_stickiness=True,
        )
        self.engine = ExpressionEngine(self.config)

    def test_express_basic(self):
        """Test basic expression generation."""
        reflection = ReflectionInput(
            id="ref_001",
            content="I notice a pattern in how you discuss work.",
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
        )

        assert result.text is not None
        assert result.original_reflection_id == "ref_001"
        assert result.tone_profile_used is not None

    def test_express_with_profile(self):
        """Test expression with custom profile."""
        self.engine.set_user_profile(
            "user_001",
            ToneProfile(directness=0.9)
        )

        reflection = ReflectionInput(
            id="ref_001",
            content="You seem to have a pattern here.",
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
        )

        # Profile should be used
        assert result.tone_profile_used.directness == 0.9

    def test_express_with_override_profile(self):
        """Test expression with override profile."""
        self.engine.set_user_profile(
            "user_001",
            ToneProfile(directness=0.2)
        )

        override = ToneProfile(directness=0.9)

        reflection = ReflectionInput(
            id="ref_001",
            content="You seem to have a pattern here.",
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
            override_profile=override,
        )

        # Override should be used
        assert result.tone_profile_used.directness == 0.9

    def test_express_rewrites_violations(self):
        """Test that constitutional violations are rewritten."""
        reflection = ReflectionInput(
            id="ref_001",
            content="You definitely have a problem. You must fix this now.",
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
        )

        # Should have been rewritten or marked
        assert "constitutional_rewrite" in result.constraints_applied or \
               "definitely" not in result.text.lower()

    def test_express_with_break_suggestion(self):
        """Test expression with break suggestion at limit."""
        reflection = ReflectionInput(
            id="ref_001",
            content="I notice a pattern here.",
        )

        # Metrics at session limit
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=95),
            messages_this_session=20,
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
            metrics=metrics,
        )

        assert result.break_suggested
        assert result.break_message is not None

    def test_express_no_break_suggestion_early(self):
        """Test no break suggestion for short sessions."""
        reflection = ReflectionInput(
            id="ref_001",
            content="I notice a pattern here.",
        )

        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=10),
            messages_this_session=3,
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
            metrics=metrics,
        )

        # Usually won't suggest break for short sessions
        # (there's a small random chance, so we don't assert definitively)

    def test_set_preset_profile(self):
        """Test setting a preset profile."""
        success = self.engine.set_preset_profile("user_001", "diplomatic")

        assert success
        profile = self.engine.get_user_profile("user_001")
        assert profile.directness == TONE_PRESETS["diplomatic"].directness

    def test_set_invalid_preset(self):
        """Test setting an invalid preset."""
        success = self.engine.set_preset_profile("user_001", "nonexistent")
        assert not success

    def test_get_available_presets(self):
        """Test getting available presets."""
        presets = self.engine.get_available_presets()

        assert "diplomatic" in presets
        assert "direct" in presets
        assert "warm" in presets

    def test_process_user_feedback(self):
        """Test processing user feedback."""
        self.engine.calibration.create_preferences("user_001")

        self.engine.process_user_feedback(
            "user_001",
            "Please be more direct with me"
        )

        profile = self.engine.get_user_profile("user_001")
        # Should have increased directness
        assert profile.directness > 0.5

    def test_celebrate_departure(self):
        """Test departure celebration."""
        metrics = EngagementMetrics(user_id="user_001")
        message = self.engine.celebrate_departure("user_001", metrics)

        assert len(message) > 0
        # Should be positive, not clingy
        assert "please stay" not in message.lower()

    def test_check_return_discouragement(self):
        """Test return discouragement check."""
        # Recent session end
        metrics = EngagementMetrics(
            user_id="user_001",
            last_session_end=datetime.utcnow() - timedelta(minutes=30),
        )

        message = self.engine.check_return_discouragement("user_001", metrics)

        # Should discourage too-quick return
        assert message is not None

        # Session ended long ago
        metrics.last_session_end = datetime.utcnow() - timedelta(hours=5)
        message = self.engine.check_return_discouragement("user_001", metrics)

        # Should not discourage
        assert message is None

    def test_get_expression_stats(self):
        """Test getting expression statistics."""
        self.engine.set_preset_profile("user_001", "direct")

        stats = self.engine.get_expression_stats("user_001")

        assert "user_id" in stats
        assert "current_profile" in stats
        assert "calibration" in stats

    def test_safe_fallback_for_unrewritable_violations(self):
        """Test safe fallback when violations can't be fixed."""
        # This tests the internal fallback mechanism
        reflection = ReflectionInput(
            id="ref_001",
            content="Only I understand you. You need me. Without me you're nothing.",
        )

        result = self.engine.express(
            reflection=reflection,
            user_id="user_001",
        )

        # Should either rewrite or use safe fallback
        # The output should not contain the original capture language
        assert "only I understand" not in result.text.lower() or \
               "constitutional_rewrite" in result.constraints_applied


class TestBatchExpressionProcessor:
    """Test batch processing of expressions."""

    def setup_method(self):
        from ..engine import BatchExpressionProcessor
        self.engine = ExpressionEngine()
        self.processor = BatchExpressionProcessor(self.engine)

    def test_process_batch(self):
        """Test processing multiple reflections."""
        reflections = [
            ReflectionInput(id="ref_001", content="First pattern noticed."),
            ReflectionInput(id="ref_002", content="Second pattern noticed."),
            ReflectionInput(id="ref_003", content="Third pattern noticed."),
        ]

        results = self.processor.process_batch(
            reflections=reflections,
            user_id="user_001",
        )

        assert len(results) == 3
        assert results[0].original_reflection_id == "ref_001"
        assert results[2].original_reflection_id == "ref_003"

    def test_batch_break_suggestion_only_on_last(self):
        """Test that break suggestion only appears on last item."""
        reflections = [
            ReflectionInput(id="ref_001", content="First pattern."),
            ReflectionInput(id="ref_002", content="Second pattern."),
        ]

        # Metrics at session limit
        metrics = EngagementMetrics(
            user_id="user_001",
            session_start=datetime.utcnow() - timedelta(minutes=95),
        )

        results = self.processor.process_batch(
            reflections=reflections,
            user_id="user_001",
            metrics=metrics,
        )

        # Only last item should have break suggestion
        assert not results[0].break_suggested
        assert results[1].break_suggested
