"""
Tests for Tension Tracking System - Phase 2 Task 5

Validates tension measurement, shift analysis, and constitutional compliance.
"""

import pytest
from datetime import datetime, timedelta
from mirror_os.core import (
    TensionTracker,
    TensionAxis,
    TensionMeasurement,
    TensionShift
)


class TestTensionAxisBasics:
    """Test tension axis creation and validation."""
    
    def test_tracker_initialization(self):
        """Should initialize with 6 default axes."""
        tracker = TensionTracker()
        
        assert len(tracker.axes) == 6
        assert "control_surrender" in tracker.axes
        assert "certainty_uncertainty" in tracker.axes
        assert "connection_solitude" in tracker.axes
        assert "action_stillness" in tracker.axes
        assert "structure_flow" in tracker.axes
        assert "holding_releasing" in tracker.axes
    
    def test_all_axes_have_disclaimers(self):
        """I9: All axes must have non-diagnostic disclaimers."""
        tracker = TensionTracker()
        
        for axis in tracker.get_axes():
            assert axis.disclaimer
            assert "not" in axis.disclaimer.lower()
            assert "diagnosis" in axis.disclaimer.lower() or "evaluation" in axis.disclaimer.lower()
    
    def test_axes_are_descriptive_not_evaluative(self):
        """I9: Axes must not contain evaluative language."""
        tracker = TensionTracker()
        
        forbidden_terms = ["better", "worse", "healthy", "unhealthy", "good", "bad"]
        
        for axis in tracker.get_axes():
            text = f"{axis.description} {axis.left_pole} {axis.right_pole}".lower()
            for term in forbidden_terms:
                assert term not in text, f"I9 violation: '{term}' found in axis {axis.id}"
    
    def test_custom_axis_with_evaluative_language_rejected(self):
        """I9: Custom axes with evaluative terms should be rejected."""
        with pytest.raises(ValueError, match="I9 violation"):
            TensionAxis(
                id="bad_axis",
                left_pole="worse",
                right_pole="better",
                description="This is a healthy choice",
                left_markers=["bad"],
                right_markers=["good"]
            )


class TestTensionMeasurement:
    """Test measuring tensions in content."""
    
    def test_measure_control_pole(self):
        """Should detect control-oriented language."""
        tracker = TensionTracker()
        content = "I need to control everything and manage all the details. I want to take charge and organize my life."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="control_surrender",
            reflection_id="refl_1",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.axis_id == "control_surrender"
        assert measurement.position > 0.5  # Toward control (right pole)
        assert measurement.confidence > 0.3
        assert len(measurement.matched_phrases) > 0
        assert measurement.mirror_id == "mirror_1"
    
    def test_measure_surrender_pole(self):
        """Should detect surrender-oriented language."""
        tracker = TensionTracker()
        content = "I'm learning to let go and surrender to what is. I want to flow with life and release control."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="control_surrender",
            reflection_id="refl_2",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.position < -0.5  # Toward surrender (left pole)
        assert measurement.confidence > 0.3
    
    def test_measure_certainty_pole(self):
        """Should detect certainty-oriented language."""
        tracker = TensionTracker()
        content = "I'm certain about this. I know that this is clear and I'm confident in my decision. Obviously the right choice."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="certainty_uncertainty",
            reflection_id="refl_3",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.position > 0.5  # Toward certainty
    
    def test_measure_uncertainty_pole(self):
        """Should detect uncertainty-oriented language."""
        tracker = TensionTracker()
        content = "I don't know what to do. I'm so uncertain and confused. Maybe this, maybe that. I'm wondering and questioning everything."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="certainty_uncertainty",
            reflection_id="refl_4",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.position < -0.5  # Toward uncertainty
    
    def test_measure_connection_pole(self):
        """Should detect connection-oriented language."""
        tracker = TensionTracker()
        content = "I want to connect with others and reach out. I need people and belonging. Let's be together and share."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="connection_solitude",
            reflection_id="refl_5",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.position > 0.5  # Toward connection
    
    def test_measure_solitude_pole(self):
        """Should detect solitude-oriented language."""
        tracker = TensionTracker()
        content = "I need to be alone and withdraw. I need space and solitude, time by myself to think."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="connection_solitude",
            reflection_id="refl_6",
            mirror_id="mirror_1"
        )
        
        assert measurement is not None
        assert measurement.position < -0.5  # Toward solitude
    
    def test_measure_all_tensions(self):
        """Should measure multiple tensions in rich content."""
        tracker = TensionTracker()
        content = """
        I don't know what I want. I'm uncertain and confused (uncertainty).
        Part of me wants to control everything (control).
        But another part wants to let go and surrender (surrender).
        I need to connect with others but also need solitude (both poles).
        Maybe I should take action, or maybe I should be still (tension).
        """
        
        measurements = tracker.measure_all_tensions(
            content=content,
            reflection_id="refl_7",
            mirror_id="mirror_1"
        )
        
        # Should detect multiple axes
        assert len(measurements) >= 2
        axis_ids = {m.axis_id for m in measurements}
        assert "certainty_uncertainty" in axis_ids or "control_surrender" in axis_ids
    
    def test_measurement_below_confidence_returns_none(self):
        """Should return None if confidence too low."""
        tracker = TensionTracker()
        content = "Just a short text."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="control_surrender",
            reflection_id="refl_8",
            mirror_id="mirror_1",
            min_confidence=0.5
        )
        
        assert measurement is None
    
    def test_measurement_requires_mirror_id(self):
        """I2: All measurements must include mirror_id."""
        tracker = TensionTracker()
        content = "I want to control everything."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="control_surrender",
            reflection_id="refl_9",
            mirror_id="mirror_1"
        )
        
        assert measurement.mirror_id == "mirror_1"
    
    def test_invalid_axis_raises_error(self):
        """Should raise error for unknown axis."""
        tracker = TensionTracker()
        
        with pytest.raises(ValueError, match="Unknown axis"):
            tracker.measure_tension(
                content="test",
                axis_id="nonexistent_axis",
                reflection_id="refl_10",
                mirror_id="mirror_1"
            )


class TestShiftAnalysis:
    """Test tension shift analysis over time."""
    
    def test_analyze_shift_toward_control(self):
        """Should detect shift toward control over time."""
        tracker = TensionTracker()
        
        # Create measurements showing shift toward control
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=-0.5,  # Start: surrender
                confidence=0.8,
                matched_phrases=["let go"],
                measured_at=datetime(2025, 1, 1)
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.0,  # Middle: balanced
                confidence=0.7,
                matched_phrases=["control", "surrender"],
                measured_at=datetime(2025, 1, 5)
            ),
            TensionMeasurement(
                reflection_id="refl_3",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.7,  # End: control
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 10)
            )
        ]
        
        shift = tracker.analyze_shift(measurements, "control_surrender")
        
        assert shift is not None
        assert shift.start_position == -0.5
        assert shift.end_position == 0.7
        assert shift.magnitude == pytest.approx(1.2, abs=0.01)
        assert shift.direction == "toward_control"
        assert shift.measurement_count == 3
        assert shift.time_span_days == pytest.approx(9.0, abs=0.1)
    
    def test_analyze_shift_toward_uncertainty(self):
        """Should detect shift toward uncertainty."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="certainty_uncertainty",
                position=0.8,  # Start: certain
                confidence=0.8,
                matched_phrases=["certain"],
                measured_at=datetime(2025, 1, 1)
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="certainty_uncertainty",
                position=-0.6,  # End: uncertain
                confidence=0.7,
                matched_phrases=["uncertain"],
                measured_at=datetime(2025, 1, 10)
            )
        ]
        
        shift = tracker.analyze_shift(measurements, "certainty_uncertainty")
        
        assert shift is not None
        assert shift.direction == "toward_uncertainty"
        assert shift.magnitude > 1.0
    
    def test_stable_position_detected(self):
        """Should detect when position is stable."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 1)
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.52,  # Very small change
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 10)
            )
        ]
        
        shift = tracker.analyze_shift(measurements, "control_surrender")
        
        assert shift is not None
        assert shift.direction == "stable"
    
    def test_shift_requires_single_mirror(self):
        """I14: Cannot analyze shift across multiple mirrors."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=-0.5,
                confidence=0.8,
                matched_phrases=["surrender"],
                measured_at=datetime(2025, 1, 1)
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_2",  # Different mirror!
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 10)
            )
        ]
        
        with pytest.raises(ValueError, match="I14 violation"):
            tracker.analyze_shift(measurements, "control_surrender")
    
    def test_insufficient_measurements_returns_none(self):
        """Should return None if < 2 measurements."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 1)
            )
        ]
        
        shift = tracker.analyze_shift(measurements, "control_surrender")
        assert shift is None


class TestStatistics:
    """Test tension statistics calculation."""
    
    def test_axis_statistics(self):
        """Should calculate mean, std_dev, min, max for axis."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=-0.5,
                confidence=0.8,
                matched_phrases=["surrender"]
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.3,
                confidence=0.7,
                matched_phrases=["control"]
            ),
            TensionMeasurement(
                reflection_id="refl_3",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.8,
                confidence=0.9,
                matched_phrases=["control"]
            )
        ]
        
        stats = tracker.get_axis_statistics(measurements, "control_surrender")
        
        assert stats["measurement_count"] == 3
        assert stats["min_position"] == -0.5
        assert stats["max_position"] == 0.8
        assert -0.1 < stats["mean_position"] < 0.3
        assert stats["std_dev"] > 0
    
    def test_statistics_require_single_mirror(self):
        """I14: Statistics must be per-mirror only."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=-0.5,
                confidence=0.8,
                matched_phrases=["surrender"]
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_2",  # Different mirror
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"]
            )
        ]
        
        with pytest.raises(ValueError, match="I14 violation"):
            tracker.get_axis_statistics(measurements, "control_surrender")
    
    def test_all_statistics(self):
        """Should get statistics for all axes."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"]
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="certainty_uncertainty",
                position=-0.3,
                confidence=0.7,
                matched_phrases=["uncertain"]
            )
        ]
        
        all_stats = tracker.get_all_statistics(measurements)
        
        assert "control_surrender" in all_stats
        assert "certainty_uncertainty" in all_stats
        assert all_stats["control_surrender"]["measurement_count"] == 1
        assert all_stats["certainty_uncertainty"]["measurement_count"] == 1
    
    def test_empty_measurements_return_zero_stats(self):
        """Should handle empty measurement list gracefully."""
        tracker = TensionTracker()
        
        stats = tracker.get_axis_statistics([], "control_surrender")
        
        assert stats["measurement_count"] == 0
        assert stats["mean_position"] == 0.0


class TestConstitutionalCompliance:
    """Test I9 and I14 constitutional guarantees."""
    
    def test_i9_all_axes_descriptive(self):
        """I9: All default axes must be descriptive, not evaluative."""
        tracker = TensionTracker()
        
        # Use word boundaries to avoid false positives (e.g., "stillness" contains "illness")
        forbidden_patterns = [
            r'\bdisorder\b', r'\bpathology\b', r'\bsymptom\b', 
            r'\bdisease\b', r'\bdiagnosis\b', r'\billness\b',
            r'\bbetter\b', r'\bworse\b', r'\bhealthy\b', r'\bunhealthy\b'
        ]
        
        import re
        for axis in tracker.get_axes():
            text = f"{axis.description} {axis.left_pole} {axis.right_pole}".lower()
            for pattern in forbidden_patterns:
                match = re.search(pattern, text)
                assert match is None, f"I9 violation: pattern '{pattern}' matched in {axis.id}"
    
    def test_i9_measurements_have_mirror_id(self):
        """I2: All measurements must be scoped to mirror."""
        tracker = TensionTracker()
        content = "I want to control everything."
        
        measurement = tracker.measure_tension(
            content=content,
            axis_id="control_surrender",
            reflection_id="refl_1",
            mirror_id="mirror_test"
        )
        
        assert measurement.mirror_id == "mirror_test"
    
    def test_i14_cross_mirror_aggregation_blocked(self):
        """I14: Cannot aggregate statistics across mirrors."""
        tracker = TensionTracker()
        
        cross_mirror_measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.5,
                confidence=0.8,
                matched_phrases=["control"]
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_2",
                axis_id="control_surrender",
                position=-0.5,
                confidence=0.8,
                matched_phrases=["surrender"]
            )
        ]
        
        # Should raise error for statistics
        with pytest.raises(ValueError, match="I14 violation"):
            tracker.get_axis_statistics(cross_mirror_measurements, "control_surrender")
        
        # Should raise error for shift analysis
        with pytest.raises(ValueError, match="I14 violation"):
            tracker.analyze_shift(cross_mirror_measurements, "control_surrender")
    
    def test_i9_no_judgment_on_direction(self):
        """I9: Shift direction is descriptive, not evaluative."""
        tracker = TensionTracker()
        
        measurements = [
            TensionMeasurement(
                reflection_id="refl_1",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=-0.8,
                confidence=0.8,
                matched_phrases=["surrender"],
                measured_at=datetime(2025, 1, 1)
            ),
            TensionMeasurement(
                reflection_id="refl_2",
                mirror_id="mirror_1",
                axis_id="control_surrender",
                position=0.8,
                confidence=0.8,
                matched_phrases=["control"],
                measured_at=datetime(2025, 1, 10)
            )
        ]
        
        shift = tracker.analyze_shift(measurements, "control_surrender")
        
        # Direction should be descriptive (toward_X) not evaluative (improving/worsening)
        assert shift.direction in ["toward_control", "toward_surrender", "stable"]
        assert "better" not in shift.direction
        assert "worse" not in shift.direction


class TestIntegrationScenarios:
    """Test realistic usage scenarios."""
    
    def test_track_tensions_over_time(self):
        """Should track tension evolution in reflection series."""
        tracker = TensionTracker()
        
        reflections = [
            ("I need to control everything in my life.", datetime(2025, 1, 1)),
            ("I'm learning to let go a bit.", datetime(2025, 1, 5)),
            ("I can surrender to what is.", datetime(2025, 1, 10))
        ]
        
        measurements = []
        for idx, (content, timestamp) in enumerate(reflections):
            m = tracker.measure_tension(
                content=content,
                axis_id="control_surrender",
                reflection_id=f"refl_{idx}",
                mirror_id="mirror_1"
            )
            if m:
                m.measured_at = timestamp
                measurements.append(m)
        
        assert len(measurements) == 3
        
        # Analyze shift
        shift = tracker.analyze_shift(measurements, "control_surrender")
        assert shift is not None
        assert shift.direction == "toward_surrender"
        assert shift.magnitude > 0.5
    
    def test_multiple_axes_in_single_reflection(self):
        """Should detect multiple tensions in complex reflection."""
        tracker = TensionTracker()
        
        content = """
        I don't know what I want anymore. I'm so uncertain about everything.
        Part of me wants to control my life and plan everything out.
        But another part wants to just let go and flow with whatever happens.
        I feel torn between taking action and being still.
        """
        
        measurements = tracker.measure_all_tensions(
            content=content,
            reflection_id="refl_complex",
            mirror_id="mirror_1"
        )
        
        # Should detect multiple axes
        assert len(measurements) >= 2
        axis_ids = {m.axis_id for m in measurements}
        
        # Check we got expected axes
        expected_axes = {"certainty_uncertainty", "control_surrender", "action_stillness"}
        assert len(axis_ids.intersection(expected_axes)) >= 2
