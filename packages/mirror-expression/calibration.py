"""
Expression Calibration System

Learns and adapts to user's communication preferences over time.

Methods of calibration:
1. Explicit feedback (user directly states preferences)
2. Implicit signals (reaction to different expression styles)
3. Natural language style matching (mirror user's own style)

Important: Calibration is opt-in and transparent.
User can see and modify their inferred preferences at any time.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime
from enum import Enum

from .base import ToneProfile, ToneDimension
from .tone import ToneAnalyzer


class FeedbackType(Enum):
    """Types of calibration feedback."""
    EXPLICIT = "explicit"  # User directly stated preference
    IMPLICIT = "implicit"  # Inferred from behavior
    MATCHED = "matched"  # Matched from user's writing style


@dataclass
class CalibrationFeedback:
    """A single piece of calibration feedback."""
    dimension: ToneDimension
    adjustment: float  # -1.0 to 1.0 (negative = decrease, positive = increase)
    feedback_type: FeedbackType
    confidence: float  # 0.0 to 1.0
    source: str  # What triggered this feedback
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "dimension": self.dimension.value,
            "adjustment": self.adjustment,
            "feedback_type": self.feedback_type.value,
            "confidence": self.confidence,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class UserPreferences:
    """User's expression preferences with calibration history."""
    user_id: str
    profile: ToneProfile = field(default_factory=ToneProfile)

    # Calibration history
    feedback_history: List[CalibrationFeedback] = field(default_factory=list)
    calibration_count: int = 0

    # User control
    auto_calibrate: bool = True  # Whether to auto-adjust
    locked_dimensions: List[ToneDimension] = field(default_factory=list)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_calibrated: Optional[datetime] = None

    def is_dimension_locked(self, dimension: ToneDimension) -> bool:
        """Check if a dimension is locked from auto-calibration."""
        return dimension in self.locked_dimensions

    def lock_dimension(self, dimension: ToneDimension):
        """Lock a dimension from auto-calibration."""
        if dimension not in self.locked_dimensions:
            self.locked_dimensions.append(dimension)

    def unlock_dimension(self, dimension: ToneDimension):
        """Unlock a dimension for auto-calibration."""
        if dimension in self.locked_dimensions:
            self.locked_dimensions.remove(dimension)

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "profile": self.profile.to_dict(),
            "calibration_count": self.calibration_count,
            "auto_calibrate": self.auto_calibrate,
            "locked_dimensions": [d.value for d in self.locked_dimensions],
            "created_at": self.created_at.isoformat(),
            "last_calibrated": self.last_calibrated.isoformat() if self.last_calibrated else None,
        }


class CalibrationEngine:
    """
    Manages expression calibration for users.

    Learns preferences through:
    1. Explicit settings ("I prefer more direct communication")
    2. Reaction tracking (did user engage more after certain tones?)
    3. Style matching (analyze user's writing, match it)

    Usage:
        engine = CalibrationEngine()

        # Create preferences for user
        prefs = engine.create_preferences(user_id)

        # Process explicit feedback
        engine.process_explicit_feedback(
            user_id,
            "I'd like more direct responses"
        )

        # Learn from user's writing style
        engine.learn_from_user_text(user_id, user_message)

        # Get calibrated profile
        profile = engine.get_calibrated_profile(user_id)
    """

    # Keywords that indicate preference for more/less of a dimension
    PREFERENCE_KEYWORDS = {
        ToneDimension.DIRECTNESS: {
            "increase": ["direct", "blunt", "straight", "honest", "clear", "no-nonsense"],
            "decrease": ["gentle", "diplomatic", "soft", "careful", "sensitive"],
        },
        ToneDimension.WARMTH: {
            "increase": ["warm", "friendly", "caring", "supportive", "kind"],
            "decrease": ["clinical", "objective", "analytical", "detached"],
        },
        ToneDimension.FORMALITY: {
            "increase": ["formal", "professional", "proper", "serious"],
            "decrease": ["casual", "relaxed", "informal", "conversational"],
        },
        ToneDimension.VERBOSITY: {
            "increase": ["detailed", "thorough", "comprehensive", "elaborate"],
            "decrease": ["brief", "concise", "short", "to-the-point", "succinct"],
        },
        ToneDimension.CERTAINTY: {
            "increase": ["confident", "certain", "clear", "definitive"],
            "decrease": ["tentative", "careful", "hedged", "cautious"],
        },
    }

    def __init__(
        self,
        learning_rate: float = 0.1,
        min_confidence: float = 0.3,
        max_history: int = 100
    ):
        self.learning_rate = learning_rate
        self.min_confidence = min_confidence
        self.max_history = max_history
        self.analyzer = ToneAnalyzer()

        self._preferences: Dict[str, UserPreferences] = {}

    def create_preferences(
        self,
        user_id: str,
        initial_profile: ToneProfile = None
    ) -> UserPreferences:
        """Create preferences for a new user."""
        prefs = UserPreferences(
            user_id=user_id,
            profile=initial_profile or ToneProfile(),
        )
        self._preferences[user_id] = prefs
        return prefs

    def get_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Get preferences for a user."""
        return self._preferences.get(user_id)

    def get_calibrated_profile(self, user_id: str) -> ToneProfile:
        """Get the current calibrated profile for a user."""
        prefs = self._preferences.get(user_id)
        if prefs:
            return prefs.profile
        return ToneProfile()

    def process_explicit_feedback(
        self,
        user_id: str,
        feedback_text: str
    ) -> List[CalibrationFeedback]:
        """
        Process explicit user feedback about expression preferences.

        Looks for keywords indicating preference changes.
        Returns list of adjustments made.
        """
        prefs = self._preferences.get(user_id)
        if not prefs:
            prefs = self.create_preferences(user_id)

        feedback_text_lower = feedback_text.lower()
        adjustments = []

        for dimension, keywords in self.PREFERENCE_KEYWORDS.items():
            if prefs.is_dimension_locked(dimension):
                continue

            # Check for increase keywords
            for keyword in keywords["increase"]:
                if keyword in feedback_text_lower:
                    adjustment = CalibrationFeedback(
                        dimension=dimension,
                        adjustment=0.2,  # Increase by 0.2
                        feedback_type=FeedbackType.EXPLICIT,
                        confidence=0.9,  # High confidence for explicit
                        source=f"keyword: {keyword}",
                    )
                    adjustments.append(adjustment)
                    self._apply_adjustment(prefs, adjustment)
                    break

            # Check for decrease keywords
            for keyword in keywords["decrease"]:
                if keyword in feedback_text_lower:
                    adjustment = CalibrationFeedback(
                        dimension=dimension,
                        adjustment=-0.2,  # Decrease by 0.2
                        feedback_type=FeedbackType.EXPLICIT,
                        confidence=0.9,
                        source=f"keyword: {keyword}",
                    )
                    adjustments.append(adjustment)
                    self._apply_adjustment(prefs, adjustment)
                    break

        return adjustments

    def learn_from_user_text(
        self,
        user_id: str,
        user_text: str,
        weight: float = 0.5
    ) -> Optional[ToneProfile]:
        """
        Learn user's preferred tone from their own writing.

        People often prefer to receive communication in a style
        similar to their own.
        """
        prefs = self._preferences.get(user_id)
        if not prefs or not prefs.auto_calibrate:
            return None

        # Analyze user's text
        analysis = self.analyzer.analyze(user_text)
        user_profile = analysis.to_profile()

        # Move our profile toward user's style
        adjustments = []
        for dimension in ToneDimension:
            if prefs.is_dimension_locked(dimension):
                continue

            current = prefs.profile.get(dimension)
            target = user_profile.get(dimension)
            difference = target - current

            if abs(difference) > 0.1:  # Only adjust if significant
                adjustment = CalibrationFeedback(
                    dimension=dimension,
                    adjustment=difference * self.learning_rate * weight,
                    feedback_type=FeedbackType.MATCHED,
                    confidence=0.5,  # Medium confidence for inference
                    source="style_matching",
                )
                adjustments.append(adjustment)
                self._apply_adjustment(prefs, adjustment)

        return prefs.profile if adjustments else None

    def learn_from_reaction(
        self,
        user_id: str,
        expression_profile: ToneProfile,
        reaction_positive: bool,
        reaction_strength: float = 0.5
    ):
        """
        Learn from user's reaction to an expression.

        If reaction is positive, move toward that profile.
        If negative, move away from it.
        """
        prefs = self._preferences.get(user_id)
        if not prefs or not prefs.auto_calibrate:
            return

        direction = 1.0 if reaction_positive else -1.0

        for dimension in ToneDimension:
            if prefs.is_dimension_locked(dimension):
                continue

            current = prefs.profile.get(dimension)
            used = expression_profile.get(dimension)
            difference = used - current

            # If positive reaction, move toward what we used
            # If negative, move away
            adjustment = CalibrationFeedback(
                dimension=dimension,
                adjustment=difference * self.learning_rate * direction * reaction_strength,
                feedback_type=FeedbackType.IMPLICIT,
                confidence=0.4 * reaction_strength,
                source="reaction_positive" if reaction_positive else "reaction_negative",
            )
            self._apply_adjustment(prefs, adjustment)

    def _apply_adjustment(
        self,
        prefs: UserPreferences,
        adjustment: CalibrationFeedback
    ):
        """Apply a calibration adjustment to preferences."""
        if adjustment.confidence < self.min_confidence:
            return

        current = prefs.profile.get(adjustment.dimension)
        new_value = current + adjustment.adjustment

        # Clamp to valid range
        new_value = max(0.0, min(1.0, new_value))

        prefs.profile.set(adjustment.dimension, new_value)
        prefs.profile.source = "calibrated"
        prefs.profile.last_updated = datetime.utcnow()

        # Record in history
        prefs.feedback_history.append(adjustment)
        if len(prefs.feedback_history) > self.max_history:
            prefs.feedback_history = prefs.feedback_history[-self.max_history:]

        prefs.calibration_count += 1
        prefs.last_calibrated = datetime.utcnow()

    def set_explicit_preference(
        self,
        user_id: str,
        dimension: ToneDimension,
        value: float,
        lock: bool = True
    ):
        """
        Set an explicit preference value.

        Used when user directly sets a slider or makes a clear choice.
        """
        prefs = self._preferences.get(user_id)
        if not prefs:
            prefs = self.create_preferences(user_id)

        prefs.profile.set(dimension, value)
        prefs.profile.source = "explicit"

        if lock:
            prefs.lock_dimension(dimension)

        adjustment = CalibrationFeedback(
            dimension=dimension,
            adjustment=value - 0.5,  # Relative to default
            feedback_type=FeedbackType.EXPLICIT,
            confidence=1.0,
            source="direct_setting",
        )
        prefs.feedback_history.append(adjustment)

    def reset_calibration(self, user_id: str, keep_explicit: bool = True):
        """Reset calibration to defaults."""
        prefs = self._preferences.get(user_id)
        if not prefs:
            return

        if keep_explicit:
            # Only reset non-explicit adjustments
            explicit_settings = {
                f.dimension: prefs.profile.get(f.dimension)
                for f in prefs.feedback_history
                if f.feedback_type == FeedbackType.EXPLICIT
            }

            prefs.profile = ToneProfile()
            for dimension, value in explicit_settings.items():
                prefs.profile.set(dimension, value)
        else:
            prefs.profile = ToneProfile()
            prefs.locked_dimensions = []

        prefs.feedback_history = []
        prefs.calibration_count = 0

    def get_calibration_explanation(self, user_id: str) -> Dict[str, Any]:
        """
        Get an explanation of current calibration state.

        Transparency about how preferences were learned.
        """
        prefs = self._preferences.get(user_id)
        if not prefs:
            return {"status": "no_preferences"}

        # Summarize feedback by dimension
        dimension_summaries = {}
        for dimension in ToneDimension:
            relevant = [
                f for f in prefs.feedback_history
                if f.dimension == dimension
            ]

            if relevant:
                explicit = [f for f in relevant if f.feedback_type == FeedbackType.EXPLICIT]
                implicit = [f for f in relevant if f.feedback_type == FeedbackType.IMPLICIT]
                matched = [f for f in relevant if f.feedback_type == FeedbackType.MATCHED]

                dimension_summaries[dimension.value] = {
                    "current_value": prefs.profile.get(dimension),
                    "is_locked": prefs.is_dimension_locked(dimension),
                    "explicit_adjustments": len(explicit),
                    "implicit_adjustments": len(implicit),
                    "style_matched_adjustments": len(matched),
                }

        return {
            "user_id": user_id,
            "profile_source": prefs.profile.source,
            "calibration_count": prefs.calibration_count,
            "auto_calibrate_enabled": prefs.auto_calibrate,
            "dimensions": dimension_summaries,
            "last_calibrated": prefs.last_calibrated.isoformat() if prefs.last_calibrated else None,
        }
