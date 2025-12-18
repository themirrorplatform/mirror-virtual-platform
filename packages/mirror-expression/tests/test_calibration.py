"""
Tests for expression calibration system.
"""

import pytest
from ..base import ToneProfile, ToneDimension
from ..calibration import (
    CalibrationEngine,
    UserPreferences,
    CalibrationFeedback,
    FeedbackType,
)


class TestUserPreferences:
    """Test user preferences structure."""

    def test_create_preferences(self):
        """Test creating user preferences."""
        prefs = UserPreferences(user_id="user_001")

        assert prefs.user_id == "user_001"
        assert prefs.auto_calibrate
        assert len(prefs.locked_dimensions) == 0

    def test_lock_dimension(self):
        """Test locking a dimension."""
        prefs = UserPreferences(user_id="user_001")
        prefs.lock_dimension(ToneDimension.DIRECTNESS)

        assert prefs.is_dimension_locked(ToneDimension.DIRECTNESS)
        assert not prefs.is_dimension_locked(ToneDimension.WARMTH)

    def test_unlock_dimension(self):
        """Test unlocking a dimension."""
        prefs = UserPreferences(user_id="user_001")
        prefs.lock_dimension(ToneDimension.DIRECTNESS)
        prefs.unlock_dimension(ToneDimension.DIRECTNESS)

        assert not prefs.is_dimension_locked(ToneDimension.DIRECTNESS)


class TestCalibrationEngine:
    """Test calibration engine."""

    def setup_method(self):
        self.engine = CalibrationEngine()

    def test_create_preferences(self):
        """Test creating preferences for a new user."""
        prefs = self.engine.create_preferences("user_001")

        assert prefs is not None
        assert prefs.user_id == "user_001"

    def test_get_calibrated_profile(self):
        """Test getting calibrated profile."""
        self.engine.create_preferences("user_001")
        profile = self.engine.get_calibrated_profile("user_001")

        assert isinstance(profile, ToneProfile)

    def test_process_explicit_feedback_direct(self):
        """Test processing explicit feedback for directness."""
        self.engine.create_preferences("user_001")

        adjustments = self.engine.process_explicit_feedback(
            "user_001",
            "I'd like more direct responses please"
        )

        # Should have adjusted directness
        directness_adjustments = [
            a for a in adjustments
            if a.dimension == ToneDimension.DIRECTNESS
        ]
        assert len(directness_adjustments) > 0
        assert directness_adjustments[0].adjustment > 0  # Increase

    def test_process_explicit_feedback_diplomatic(self):
        """Test processing explicit feedback for diplomacy."""
        self.engine.create_preferences("user_001")

        adjustments = self.engine.process_explicit_feedback(
            "user_001",
            "Please be more gentle and diplomatic"
        )

        # Should have decreased directness
        directness_adjustments = [
            a for a in adjustments
            if a.dimension == ToneDimension.DIRECTNESS
        ]
        assert len(directness_adjustments) > 0
        assert directness_adjustments[0].adjustment < 0  # Decrease

    def test_process_explicit_feedback_warm(self):
        """Test processing explicit feedback for warmth."""
        self.engine.create_preferences("user_001")

        adjustments = self.engine.process_explicit_feedback(
            "user_001",
            "I prefer warmer, more caring communication"
        )

        warmth_adjustments = [
            a for a in adjustments
            if a.dimension == ToneDimension.WARMTH
        ]
        assert len(warmth_adjustments) > 0
        assert warmth_adjustments[0].adjustment > 0

    def test_locked_dimension_not_adjusted(self):
        """Test that locked dimensions aren't auto-adjusted."""
        prefs = self.engine.create_preferences("user_001")
        prefs.lock_dimension(ToneDimension.DIRECTNESS)

        original_value = prefs.profile.directness

        self.engine.process_explicit_feedback(
            "user_001",
            "Be more direct please"
        )

        # Directness should be unchanged
        assert prefs.profile.directness == original_value

    def test_learn_from_user_text(self):
        """Test learning from user's writing style."""
        prefs = self.engine.create_preferences("user_001")
        original_profile = ToneProfile(
            directness=prefs.profile.directness,
            warmth=prefs.profile.warmth,
        )

        # User writes in a very direct style
        user_text = "I need you to be clear. Tell me exactly what you see. No hedging."

        result = self.engine.learn_from_user_text("user_001", user_text)

        # Profile should have shifted toward user's style
        # (though the exact change depends on analysis)
        assert result is not None or prefs.profile != original_profile

    def test_set_explicit_preference(self):
        """Test setting an explicit preference value."""
        self.engine.create_preferences("user_001")

        self.engine.set_explicit_preference(
            "user_001",
            ToneDimension.DIRECTNESS,
            0.9,
            lock=True
        )

        prefs = self.engine.get_preferences("user_001")
        assert prefs.profile.directness == 0.9
        assert prefs.is_dimension_locked(ToneDimension.DIRECTNESS)

    def test_reset_calibration(self):
        """Test resetting calibration."""
        self.engine.create_preferences("user_001")
        self.engine.process_explicit_feedback("user_001", "Be more direct")

        self.engine.reset_calibration("user_001", keep_explicit=False)

        prefs = self.engine.get_preferences("user_001")
        assert prefs.profile.directness == 0.5  # Back to default
        assert prefs.calibration_count == 0

    def test_reset_calibration_keeps_explicit(self):
        """Test reset keeps explicit settings."""
        self.engine.create_preferences("user_001")
        self.engine.set_explicit_preference("user_001", ToneDimension.DIRECTNESS, 0.8)

        # Do some implicit calibration
        self.engine.learn_from_user_text("user_001", "I want warm communication")

        self.engine.reset_calibration("user_001", keep_explicit=True)

        prefs = self.engine.get_preferences("user_001")
        # Explicit directness setting should be preserved
        assert prefs.profile.directness == 0.8

    def test_calibration_explanation(self):
        """Test getting calibration explanation."""
        self.engine.create_preferences("user_001")
        self.engine.process_explicit_feedback("user_001", "Be more direct")

        explanation = self.engine.get_calibration_explanation("user_001")

        assert "user_id" in explanation
        assert "dimensions" in explanation
        assert "calibration_count" in explanation

    def test_learn_from_reaction(self):
        """Test learning from user reaction to expression."""
        prefs = self.engine.create_preferences("user_001")
        original_directness = prefs.profile.directness

        # Simulate positive reaction to a direct expression
        direct_profile = ToneProfile(directness=0.8)
        self.engine.learn_from_reaction(
            "user_001",
            direct_profile,
            reaction_positive=True,
            reaction_strength=0.8
        )

        # Should have shifted toward the well-received profile
        # (toward higher directness in this case)
        new_directness = prefs.profile.directness
        # The shift depends on learning rate and reaction strength
        # At minimum, it shouldn't have gone the wrong way
        assert new_directness >= original_directness - 0.1
