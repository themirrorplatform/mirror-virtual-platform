"""
Expression Engine

The main orchestrator for Mirror's expression layer.
Coordinates tone adaptation, leave-ability, calibration,
and constitutional constraints.

This is the primary interface for generating expressions
from reflections.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime

from .base import (
    ToneProfile,
    ExpressionConfig,
    ExpressionResult,
    ExpressionConstraint,
    TONE_PRESETS,
)
from .tone import ToneAdapter, ToneAnalyzer
from .leaveability import LeaveabilityGuard, EngagementMetrics, AntiStickinessEngine
from .calibration import CalibrationEngine, UserPreferences
from .constraints import ConstitutionalConstraints, ConstraintSeverity


@dataclass
class ReflectionInput:
    """Input for expression generation."""
    id: str
    content: str  # Raw reflection content
    patterns_mentioned: List[str] = field(default_factory=list)
    tensions_mentioned: List[str] = field(default_factory=list)
    confidence: float = 0.5
    context: Dict[str, Any] = field(default_factory=dict)


class ExpressionEngine:
    """
    Main engine for generating expressions from reflections.

    Orchestrates:
    1. Constitutional constraint checking
    2. Tone adaptation to user preferences
    3. Leave-ability guard integration
    4. Anti-stickiness measures

    Usage:
        engine = ExpressionEngine()

        # Configure for a user
        engine.set_user_profile(user_id, ToneProfile(directness=0.7))

        # Generate expression
        result = engine.express(
            reflection=ReflectionInput(
                id="ref_001",
                content="I notice a pattern in how you discuss work...",
            ),
            user_id="user_001",
            metrics=engagement_metrics,
        )

        print(result.text)
        if result.break_suggested:
            print(result.break_message)
    """

    def __init__(self, config: ExpressionConfig = None):
        self.config = config or ExpressionConfig()

        # Initialize components
        self.tone_adapter = ToneAdapter()
        self.tone_analyzer = ToneAnalyzer()
        self.constraints = ConstitutionalConstraints()
        self.leaveability = LeaveabilityGuard(
            session_warning_minutes=self.config.session_warning_minutes,
            session_limit_minutes=self.config.session_limit_minutes,
            min_messages_before_break=self.config.min_messages_before_break,
        )
        self.calibration = CalibrationEngine()
        self.anti_stickiness = AntiStickinessEngine()

        # User profiles cache
        self._user_profiles: Dict[str, ToneProfile] = {}

    def set_user_profile(self, user_id: str, profile: ToneProfile):
        """Set the tone profile for a user."""
        self._user_profiles[user_id] = profile

    def get_user_profile(self, user_id: str) -> ToneProfile:
        """Get the tone profile for a user."""
        # Check calibration first
        calibrated = self.calibration.get_calibrated_profile(user_id)
        if calibrated.source != "default":
            return calibrated

        # Check explicit profile
        if user_id in self._user_profiles:
            return self._user_profiles[user_id]

        # Return default
        return self.config.default_profile

    def express(
        self,
        reflection: ReflectionInput,
        user_id: str,
        metrics: EngagementMetrics = None,
        override_profile: ToneProfile = None,
    ) -> ExpressionResult:
        """
        Generate an expression from a reflection.

        This is the main entry point for expression generation.
        """
        # Get appropriate profile
        if override_profile and self.config.allow_profile_override:
            profile = override_profile
        else:
            profile = self.get_user_profile(user_id)

        # Start with raw content
        text = reflection.content

        # Step 1: Check constitutional constraints FIRST
        violations = self.constraints.check(text)
        blocking = [v for v in violations if v.severity == ConstraintSeverity.BLOCKING]

        if blocking:
            # Must rewrite to remove blocking violations
            text, remaining = self.constraints.validate_and_rewrite(text)

            if remaining:
                # Still have violations - this is a problem
                # Log and use a safe fallback
                text = self._generate_safe_fallback(reflection)

        # Step 2: Apply tone adaptation
        text = self.tone_adapter.adapt(text, profile)

        # Step 3: Check anti-stickiness
        anti_stickiness_active = False
        if self.config.enable_anti_stickiness:
            self.anti_stickiness.record_interaction(user_id)
            if self.anti_stickiness.should_reduce_engagement(user_id):
                text = self._apply_engagement_reduction(text, user_id)
                anti_stickiness_active = True

        # Step 4: Check leave-ability
        break_suggested = False
        break_message = None

        if metrics and self.config.enable_break_suggestions:
            if self.leaveability.should_suggest_break(metrics):
                suggestion = self.leaveability.get_break_suggestion(metrics)
                break_suggested = True
                break_message = suggestion.message

                # If required break, add it to the text
                if suggestion.is_required:
                    text = text + f"\n\n---\n{suggestion.message}"

        # Build result
        constraints_applied = []
        if blocking:
            constraints_applied.append("constitutional_rewrite")
        if anti_stickiness_active:
            constraints_applied.append("anti_stickiness")

        result = ExpressionResult(
            text=text,
            original_reflection_id=reflection.id,
            tone_profile_used=profile,
            constraints_applied=constraints_applied,
            break_suggested=break_suggested,
            break_message=break_message,
        )

        # Add warnings for non-blocking violations
        warnings = [v for v in violations if v.severity != ConstraintSeverity.BLOCKING]
        result.warnings = [v.description for v in warnings]

        return result

    def _generate_safe_fallback(self, reflection: ReflectionInput) -> str:
        """
        Generate a safe fallback expression when original violates constraints.

        This is a last resort - ideally constraint violations are caught
        earlier in the pipeline.
        """
        # Very generic, safe reflection
        return (
            "I notice something in what you've shared, though I want to be "
            "careful not to assume I understand it fully. Would you like to "
            "explore this further?"
        )

    def _apply_engagement_reduction(self, text: str, user_id: str) -> str:
        """
        Apply engagement reduction strategies.

        Intentionally makes the response less engaging to reduce
        over-reliance.
        """
        strategies = self.anti_stickiness.get_engagement_reduction_strategy(user_id)

        if not strategies.get("should_reduce"):
            return text

        # Apply reduced depth - shorten and simplify
        if len(text) > 200:
            # Find a natural break point
            sentences = text.split(". ")
            if len(sentences) > 2:
                text = ". ".join(sentences[:2]) + "."

        return text

    def process_user_feedback(self, user_id: str, feedback: str):
        """
        Process user feedback about expression preferences.

        Delegates to calibration engine.
        """
        self.calibration.process_explicit_feedback(user_id, feedback)

    def learn_from_user_style(self, user_id: str, user_text: str):
        """
        Learn from user's own writing style.

        Updates calibration based on user's natural communication.
        """
        self.calibration.learn_from_user_text(user_id, user_text)

    def set_preset_profile(self, user_id: str, preset_name: str) -> bool:
        """
        Set a user's profile to a preset.

        Available presets: diplomatic, direct, warm, clinical, casual
        """
        preset = TONE_PRESETS.get(preset_name)
        if preset:
            self._user_profiles[user_id] = preset
            return True
        return False

    def get_available_presets(self) -> List[str]:
        """Get list of available preset names."""
        return list(TONE_PRESETS.keys())

    def celebrate_departure(self, user_id: str, metrics: EngagementMetrics) -> str:
        """
        Generate a departure celebration message.

        Departures are good! We celebrate them.
        """
        return self.leaveability.celebrate_departure(metrics)

    def check_return_discouragement(
        self,
        user_id: str,
        metrics: EngagementMetrics
    ) -> Optional[str]:
        """
        Check if we should discourage the user from returning too soon.

        Returns a message if discouragement is warranted.
        """
        return self.leaveability.get_return_discouragement(metrics)

    def get_expression_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get statistics about expression configuration for a user.
        """
        profile = self.get_user_profile(user_id)
        calibration = self.calibration.get_calibration_explanation(user_id)

        return {
            "user_id": user_id,
            "current_profile": profile.to_dict(),
            "calibration": calibration,
            "anti_stickiness_active": self.anti_stickiness.should_reduce_engagement(user_id),
        }


class BatchExpressionProcessor:
    """
    Process multiple reflections efficiently.

    Useful when generating expressions for a summary or history view.
    """

    def __init__(self, engine: ExpressionEngine):
        self.engine = engine

    def process_batch(
        self,
        reflections: List[ReflectionInput],
        user_id: str,
        metrics: EngagementMetrics = None,
    ) -> List[ExpressionResult]:
        """
        Process multiple reflections.

        Only adds break suggestion to the last item.
        """
        results = []

        for i, reflection in enumerate(reflections):
            # Only check leave-ability on last item
            is_last = (i == len(reflections) - 1)
            item_metrics = metrics if is_last else None

            result = self.engine.express(
                reflection=reflection,
                user_id=user_id,
                metrics=item_metrics,
            )
            results.append(result)

        return results
