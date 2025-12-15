"""
Tension Tracking System - Phase 2 Task 5

Tracks positions on tension axes within reflections.

Constitutional Guarantees:
- I9 (Anti-Diagnosis): Descriptive not evaluative, no judgment language
- I14 (No Cross-Identity Inference): All measurements per-mirror only
- I2 (Identity Locality): All operations scoped to single mirror

Tension axes represent polarities in human experience:
- control ↔ surrender
- certainty ↔ uncertainty  
- connection ↔ solitude
- action ↔ stillness
- structure ↔ flow
- holding ↔ releasing

Position scale: -1.0 to 1.0
- Negative values: left pole (e.g., surrender, uncertainty)
- Positive values: right pole (e.g., control, certainty)
- 0.0: balanced/neutral
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import re
from statistics import mean, stdev

@dataclass
class TensionAxis:
    """
    A polarity axis for measurement.
    
    I9: Descriptive not evaluative - no pole is "better" or "healthier".
    """
    id: str
    left_pole: str  # e.g., "surrender"
    right_pole: str  # e.g., "control"
    description: str
    left_markers: List[str]  # Phrases indicating left pole
    right_markers: List[str]  # Phrases indicating right pole
    disclaimer: str = "This is a descriptive observation, not an evaluation or diagnosis."
    
    def __post_init__(self):
        # I9: Ensure no evaluative language
        forbidden = ["better", "worse", "healthy", "unhealthy", "good", "bad", 
                     "disorder", "pathology", "symptom"]
        text = f"{self.description} {self.left_pole} {self.right_pole}".lower()
        for word in forbidden:
            if word in text:
                raise ValueError(f"I9 violation: Evaluative term '{word}' not allowed in tension axis")


@dataclass
class TensionMeasurement:
    """
    A single measurement of tension position.
    
    I2: Always includes mirror_id for locality.
    """
    reflection_id: str
    mirror_id: str
    axis_id: str
    position: float  # -1.0 to 1.0
    confidence: float  # 0.0 to 1.0
    matched_phrases: List[str]
    measured_at: datetime = field(default_factory=lambda: datetime.now())
    
    def __post_init__(self):
        if not -1.0 <= self.position <= 1.0:
            raise ValueError(f"Position {self.position} out of range [-1.0, 1.0]")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(f"Confidence {self.confidence} out of range [0.0, 1.0]")


@dataclass
class TensionShift:
    """
    Tracks movement along an axis over time.
    
    I9: Descriptive not evaluative - no judgment on direction.
    I14: Only within single mirror.
    """
    mirror_id: str
    axis_id: str
    start_position: float
    end_position: float
    magnitude: float  # Absolute change
    direction: str  # "toward_left", "toward_right", "stable"
    measurement_count: int
    time_span_days: float


class TensionTracker:
    """
    Tracks tension positions in user reflections.
    
    I9: All tracking is descriptive, not diagnostic or evaluative.
    I14: All statistics are per-mirror, no cross-identity aggregation.
    I2: All operations require mirror_id.
    """
    
    # Default tension axes
    DEFAULT_AXES = {
        "control_surrender": TensionAxis(
            id="control_surrender",
            left_pole="surrender",
            right_pole="control",
            description="Relationship between letting go and managing outcomes",
            left_markers=["let go", "surrender", "flow with", "release control", 
                         "trust the process", "accept what is"],
            right_markers=["control", "manage", "organize", "plan", "direct", 
                          "make it happen", "take charge"]
        ),
        "certainty_uncertainty": TensionAxis(
            id="certainty_uncertainty",
            left_pole="uncertainty",
            right_pole="certainty",
            description="Relationship between knowing and not-knowing",
            left_markers=["don't know", "uncertain", "unclear", "confused", 
                         "maybe", "wondering", "questioning"],
            right_markers=["certain", "sure", "clear", "know that", "confident",
                          "definite", "obviously"]
        ),
        "connection_solitude": TensionAxis(
            id="connection_solitude",
            left_pole="solitude",
            right_pole="connection",
            description="Relationship between being alone and being with others",
            left_markers=["alone", "solitude", "by myself", "isolated", 
                         "need space", "withdraw"],
            right_markers=["connect", "together", "reach out", "share with",
                          "need people", "belonging"]
        ),
        "action_stillness": TensionAxis(
            id="action_stillness",
            left_pole="stillness",
            right_pole="action",
            description="Relationship between doing and being",
            left_markers=["be still", "pause", "wait", "rest", "slow down",
                         "just be"],
            right_markers=["do something", "take action", "move forward", "act",
                          "get going", "make progress"]
        ),
        "structure_flow": TensionAxis(
            id="structure_flow",
            left_pole="flow",
            right_pole="structure",
            description="Relationship between spontaneity and organization",
            left_markers=["go with the flow", "spontaneous", "improvise", 
                         "see what happens", "flexible"],
            right_markers=["structure", "routine", "schedule", "system",
                          "organized", "planned"]
        ),
        "holding_releasing": TensionAxis(
            id="holding_releasing",
            left_pole="releasing",
            right_pole="holding",
            description="Relationship between keeping and letting go",
            left_markers=["let go", "release", "put down", "move on",
                         "forgive", "free myself"],
            right_markers=["hold onto", "keep", "remember", "not forget",
                          "stay with", "preserve"]
        )
    }
    
    def __init__(self, custom_axes: Optional[List[TensionAxis]] = None):
        """
        Initialize tracker with default or custom axes.
        
        Args:
            custom_axes: Optional additional axes beyond defaults
        """
        # Create isolated instances of default axes (prevent shared state)
        self.axes: Dict[str, TensionAxis] = {}
        for axis_id, axis in self.DEFAULT_AXES.items():
            self.axes[axis_id] = TensionAxis(
                id=axis.id,
                left_pole=axis.left_pole,
                right_pole=axis.right_pole,
                description=axis.description,
                left_markers=axis.left_markers.copy(),
                right_markers=axis.right_markers.copy(),
                disclaimer=axis.disclaimer
            )
        
        if custom_axes:
            for axis in custom_axes:
                self.axes[axis.id] = axis
    
    def measure_tension(
        self,
        content: str,
        axis_id: str,
        reflection_id: str,
        mirror_id: str,
        min_confidence: float = 0.3
    ) -> Optional[TensionMeasurement]:
        """
        Measure position on a tension axis within content.
        
        I2: Requires mirror_id for locality.
        I9: Descriptive measurement, no evaluation.
        
        Args:
            content: Reflection text to analyze
            axis_id: Which axis to measure
            reflection_id: ID of reflection being measured
            mirror_id: ID of mirror (I2 enforcement)
            min_confidence: Minimum confidence threshold (0.0-1.0)
            
        Returns:
            TensionMeasurement if confidence >= min_confidence, else None
        """
        if axis_id not in self.axes:
            raise ValueError(f"Unknown axis: {axis_id}")
        
        axis = self.axes[axis_id]
        content_lower = content.lower()
        
        # Count matches for each pole
        left_matches = []
        right_matches = []
        
        for marker in axis.left_markers:
            pattern = re.compile(r'\b' + re.escape(marker.lower()) + r'\b', re.IGNORECASE)
            matches = pattern.findall(content_lower)
            left_matches.extend(matches)
        
        for marker in axis.right_markers:
            pattern = re.compile(r'\b' + re.escape(marker.lower()) + r'\b', re.IGNORECASE)
            matches = pattern.findall(content_lower)
            right_matches.extend(matches)
        
        left_count = len(left_matches)
        right_count = len(right_matches)
        total_matches = left_count + right_count
        
        if total_matches == 0:
            return None
        
        # Calculate position: -1.0 (left) to 1.0 (right)
        # If only left markers: -1.0
        # If only right markers: 1.0
        # If mixed: weighted average
        if right_count == 0:
            position = -1.0
        elif left_count == 0:
            position = 1.0
        else:
            # Weighted by counts
            position = (right_count - left_count) / total_matches
        
        # Calculate confidence based on total markers found
        # More matches = higher confidence
        word_count = len(content.split())
        confidence = min(1.0, total_matches / max(1, word_count / 20))  # Normalize
        
        if confidence < min_confidence:
            return None
        
        all_matched = left_matches + right_matches
        
        return TensionMeasurement(
            reflection_id=reflection_id,
            mirror_id=mirror_id,
            axis_id=axis_id,
            position=position,
            confidence=confidence,
            matched_phrases=all_matched[:10]  # Limit to first 10
        )
    
    def measure_all_tensions(
        self,
        content: str,
        reflection_id: str,
        mirror_id: str,
        min_confidence: float = 0.3
    ) -> List[TensionMeasurement]:
        """
        Measure all tension axes in content.
        
        I2: Requires mirror_id.
        I14: Per-mirror only.
        
        Args:
            content: Reflection text
            reflection_id: Reflection ID
            mirror_id: Mirror ID (I2 enforcement)
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of measurements that meet confidence threshold
        """
        measurements = []
        for axis_id in self.axes:
            measurement = self.measure_tension(
                content, axis_id, reflection_id, mirror_id, min_confidence
            )
            if measurement:
                measurements.append(measurement)
        return measurements
    
    def analyze_shift(
        self,
        measurements: List[TensionMeasurement],
        axis_id: str
    ) -> Optional[TensionShift]:
        """
        Analyze shift along an axis over time.
        
        I9: Descriptive analysis, no judgment on direction.
        I14: Must be single-mirror measurements.
        
        Args:
            measurements: List of measurements (must all be same mirror)
            axis_id: Which axis to analyze
            
        Returns:
            TensionShift if sufficient data, else None
        """
        if not measurements:
            return None
        
        # I14: Verify all measurements are from same mirror
        mirror_ids = {m.mirror_id for m in measurements}
        if len(mirror_ids) > 1:
            raise ValueError(f"I14 violation: Cannot analyze across mirrors {mirror_ids}")
        
        mirror_id = measurements[0].mirror_id
        
        # Filter to requested axis
        axis_measurements = [m for m in measurements if m.axis_id == axis_id]
        
        if len(axis_measurements) < 2:
            return None
        
        # Sort by time
        sorted_measurements = sorted(axis_measurements, key=lambda m: m.measured_at)
        
        start_position = sorted_measurements[0].position
        end_position = sorted_measurements[-1].position
        magnitude = abs(end_position - start_position)
        
        # Determine direction
        if magnitude < 0.1:  # Small change threshold
            direction = "stable"
        elif end_position > start_position:
            direction = f"toward_{self.axes[axis_id].right_pole}"
        else:
            direction = f"toward_{self.axes[axis_id].left_pole}"
        
        # Calculate time span
        time_delta = sorted_measurements[-1].measured_at - sorted_measurements[0].measured_at
        time_span_days = time_delta.total_seconds() / 86400
        
        return TensionShift(
            mirror_id=mirror_id,
            axis_id=axis_id,
            start_position=start_position,
            end_position=end_position,
            magnitude=magnitude,
            direction=direction,
            measurement_count=len(axis_measurements),
            time_span_days=time_span_days
        )
    
    def get_axis_statistics(
        self,
        measurements: List[TensionMeasurement],
        axis_id: str
    ) -> Dict[str, float]:
        """
        Calculate statistics for an axis.
        
        I14: Must be single-mirror measurements.
        
        Args:
            measurements: Measurements (all same mirror)
            axis_id: Which axis
            
        Returns:
            Dict with mean, std_dev, min, max positions
        """
        # I14: Verify single mirror
        mirror_ids = {m.mirror_id for m in measurements}
        if len(mirror_ids) > 1:
            raise ValueError(f"I14 violation: Cannot aggregate across mirrors {mirror_ids}")
        
        axis_measurements = [m for m in measurements if m.axis_id == axis_id]
        
        if not axis_measurements:
            return {
                "mean_position": 0.0,
                "std_dev": 0.0,
                "min_position": 0.0,
                "max_position": 0.0,
                "measurement_count": 0
            }
        
        positions = [m.position for m in axis_measurements]
        
        return {
            "mean_position": mean(positions),
            "std_dev": stdev(positions) if len(positions) > 1 else 0.0,
            "min_position": min(positions),
            "max_position": max(positions),
            "measurement_count": len(positions)
        }
    
    def get_all_statistics(
        self,
        measurements: List[TensionMeasurement]
    ) -> Dict[str, Dict[str, float]]:
        """
        Get statistics for all axes.
        
        I14: Single-mirror only.
        
        Args:
            measurements: All measurements (same mirror)
            
        Returns:
            Dict mapping axis_id to statistics
        """
        # I14: Verify single mirror
        mirror_ids = {m.mirror_id for m in measurements}
        if len(mirror_ids) > 1:
            raise ValueError(f"I14 violation: Cannot aggregate across mirrors {mirror_ids}")
        
        stats = {}
        for axis_id in self.axes:
            stats[axis_id] = self.get_axis_statistics(measurements, axis_id)
        
        return stats
    
    def get_axes(self) -> List[TensionAxis]:
        """Get all available tension axes."""
        return list(self.axes.values())
    
    def get_axis(self, axis_id: str) -> Optional[TensionAxis]:
        """Get a specific axis by ID."""
        return self.axes.get(axis_id)
