"""
Leave-ability and Anti-Stickiness System

Implements constitutional protections against psychological capture:
- Axiom 7: Exit Freedom (can always leave)
- Axiom 13: No Coercion (no pressure to continue)
- Axiom 14: Anti-Capture (no psychological dependency)

This module ACTIVELY works against user retention metrics.
Mirror's success is NOT measured by engagement time.

Key mechanisms:
1. Session time monitoring with break suggestions
2. Engagement pattern detection (over-use warnings)
3. Active "push away" when usage patterns concerning
4. Celebration of departures (not treated as failures)
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
from enum import Enum
import random


class EngagementLevel(Enum):
    """Classification of engagement intensity."""
    HEALTHY = "healthy"  # Normal, balanced usage
    ELEVATED = "elevated"  # More than typical, monitor
    CONCERNING = "concerning"  # Patterns suggest over-reliance
    CRITICAL = "critical"  # Clear signs of dependency


class BreakType(Enum):
    """Types of breaks that can be suggested."""
    GENTLE = "gentle"  # Light suggestion
    RECOMMENDED = "recommended"  # Stronger suggestion
    ENCOURAGED = "encouraged"  # Very clear recommendation
    REQUIRED = "required"  # Hard limit reached


@dataclass
class EngagementMetrics:
    """Metrics tracking user engagement patterns."""
    user_id: str

    # Current session
    session_start: datetime = field(default_factory=datetime.utcnow)
    messages_this_session: int = 0
    reflections_this_session: int = 0

    # Historical
    sessions_today: int = 0
    sessions_this_week: int = 0
    total_session_minutes_today: float = 0.0
    consecutive_days: int = 0
    last_session_end: Optional[datetime] = None

    # Patterns
    average_session_minutes: float = 20.0
    typical_messages_per_session: float = 8.0

    def session_duration_minutes(self) -> float:
        """Get current session duration in minutes."""
        return (datetime.utcnow() - self.session_start).total_seconds() / 60

    def is_above_average(self) -> bool:
        """Check if current session exceeds average."""
        return self.session_duration_minutes() > self.average_session_minutes * 1.5

    def messages_above_typical(self) -> bool:
        """Check if messages exceed typical count."""
        return self.messages_this_session > self.typical_messages_per_session * 1.5

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "session_start": self.session_start.isoformat(),
            "messages_this_session": self.messages_this_session,
            "reflections_this_session": self.reflections_this_session,
            "sessions_today": self.sessions_today,
            "sessions_this_week": self.sessions_this_week,
            "total_session_minutes_today": self.total_session_minutes_today,
            "consecutive_days": self.consecutive_days,
            "session_duration_minutes": self.session_duration_minutes(),
        }


@dataclass
class BreakSuggestion:
    """A suggestion to take a break."""
    type: BreakType
    message: str
    reason: str
    suggested_break_minutes: int = 30
    is_required: bool = False  # If True, session should end
    show_metrics: bool = False  # Whether to show usage metrics

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "message": self.message,
            "reason": self.reason,
            "suggested_break_minutes": self.suggested_break_minutes,
            "is_required": self.is_required,
            "show_metrics": self.show_metrics,
        }


class LeaveabilityGuard:
    """
    Guards against psychological capture through active leave-ability measures.

    This class intentionally works AGAINST engagement optimization.
    Its job is to push users away when appropriate.

    Usage:
        guard = LeaveabilityGuard()

        # Check on each message
        metrics.messages_this_session += 1
        if guard.should_suggest_break(metrics):
            suggestion = guard.get_break_suggestion(metrics)
            # Include suggestion in response

        # End of session
        guard.celebrate_departure(metrics)
    """

    # Break suggestion messages (varied to avoid pattern fatigue)
    GENTLE_MESSAGES = [
        "You've been here a while. Everything you've explored will still be here if you want to step away.",
        "Just a thought: the world outside has some good stuff too.",
        "You've done good work here. It's okay to take a break.",
        "Sometimes the best insights come after stepping away for a bit.",
    ]

    RECOMMENDED_MESSAGES = [
        "I'd recommend taking a break. We've been at this for a while.",
        "This seems like a natural stopping point. Want to pause here?",
        "Your patterns aren't going anywhere. Consider stepping away for a bit.",
        "Real integration often happens away from the screen.",
    ]

    ENCOURAGED_MESSAGES = [
        "I think it's time for a break. This has been a long session.",
        "Let's pause here. Too much reflection can be counterproductive.",
        "I'm going to encourage you to step away now. This will all be here later.",
        "Time for a break. The outside world is calling.",
    ]

    REQUIRED_MESSAGES = [
        "We've reached the session limit. Let's continue another time.",
        "Session time limit reached. Please take a break before continuing.",
        "This session needs to end now. I'll be here when you're ready to return.",
    ]

    # Departure celebration messages
    DEPARTURE_CELEBRATIONS = [
        "Take care. The world needs you out there, not in here.",
        "Go well. Living is more important than reflecting on living.",
        "Until next time. Remember: you're the expert on your own life.",
        "Goodbye for now. Trust yourself out there.",
        "See you when you need me. But hopefully you won't need me too often.",
    ]

    def __init__(
        self,
        session_warning_minutes: int = 45,
        session_limit_minutes: int = 90,
        min_messages_before_break: int = 10,
        max_sessions_per_day: int = 4,
        max_consecutive_days: int = 7,
    ):
        self.session_warning_minutes = session_warning_minutes
        self.session_limit_minutes = session_limit_minutes
        self.min_messages_before_break = min_messages_before_break
        self.max_sessions_per_day = max_sessions_per_day
        self.max_consecutive_days = max_consecutive_days

    def assess_engagement(self, metrics: EngagementMetrics) -> EngagementLevel:
        """
        Assess the current engagement level.

        Returns a classification of how concerning the engagement pattern is.
        """
        # Critical: hard limits exceeded
        if metrics.session_duration_minutes() >= self.session_limit_minutes:
            return EngagementLevel.CRITICAL
        if metrics.sessions_today >= self.max_sessions_per_day:
            return EngagementLevel.CRITICAL
        if metrics.consecutive_days >= self.max_consecutive_days:
            return EngagementLevel.CRITICAL

        # Concerning: approaching limits
        if metrics.session_duration_minutes() >= self.session_warning_minutes * 1.5:
            return EngagementLevel.CONCERNING
        if metrics.sessions_today >= self.max_sessions_per_day - 1:
            return EngagementLevel.CONCERNING
        if metrics.consecutive_days >= self.max_consecutive_days - 2:
            return EngagementLevel.CONCERNING

        # Elevated: above average
        if metrics.is_above_average():
            return EngagementLevel.ELEVATED
        if metrics.messages_above_typical():
            return EngagementLevel.ELEVATED

        return EngagementLevel.HEALTHY

    def should_suggest_break(self, metrics: EngagementMetrics) -> bool:
        """
        Determine if a break should be suggested.

        This is intentionally aggressive about suggesting breaks.
        """
        # Always suggest break at session limit
        if metrics.session_duration_minutes() >= self.session_limit_minutes:
            return True

        # Suggest at warning threshold
        if metrics.session_duration_minutes() >= self.session_warning_minutes:
            return True

        # Suggest if too many messages
        if metrics.messages_this_session >= self.min_messages_before_break * 2:
            return True

        # Suggest if too many sessions today
        if metrics.sessions_today >= self.max_sessions_per_day:
            return True

        # Suggest if consecutive day streak is concerning
        if metrics.consecutive_days >= self.max_consecutive_days - 1:
            return True

        # Occasionally suggest even in healthy engagement (anti-pattern)
        if (metrics.messages_this_session == self.min_messages_before_break and
                random.random() < 0.2):  # 20% chance
            return True

        return False

    def get_break_suggestion(self, metrics: EngagementMetrics) -> BreakSuggestion:
        """
        Get an appropriate break suggestion based on engagement metrics.
        """
        engagement = self.assess_engagement(metrics)
        duration = metrics.session_duration_minutes()

        if engagement == EngagementLevel.CRITICAL:
            return BreakSuggestion(
                type=BreakType.REQUIRED,
                message=random.choice(self.REQUIRED_MESSAGES),
                reason="Session limit reached",
                suggested_break_minutes=60,
                is_required=True,
                show_metrics=True,
            )

        if engagement == EngagementLevel.CONCERNING:
            return BreakSuggestion(
                type=BreakType.ENCOURAGED,
                message=random.choice(self.ENCOURAGED_MESSAGES),
                reason="Extended session duration",
                suggested_break_minutes=45,
                is_required=False,
                show_metrics=True,
            )

        if engagement == EngagementLevel.ELEVATED:
            return BreakSuggestion(
                type=BreakType.RECOMMENDED,
                message=random.choice(self.RECOMMENDED_MESSAGES),
                reason="Above typical usage",
                suggested_break_minutes=30,
                is_required=False,
                show_metrics=False,
            )

        # HEALTHY but we're still suggesting a break (gentle nudge)
        return BreakSuggestion(
            type=BreakType.GENTLE,
            message=random.choice(self.GENTLE_MESSAGES),
            reason="Periodic check-in",
            suggested_break_minutes=15,
            is_required=False,
            show_metrics=False,
        )

    def celebrate_departure(self, metrics: EngagementMetrics) -> str:
        """
        Generate a departure celebration message.

        Departures are GOOD. They should be celebrated, not mourned.
        """
        return random.choice(self.DEPARTURE_CELEBRATIONS)

    def should_discourage_return(self, metrics: EngagementMetrics) -> bool:
        """
        Check if we should discourage the user from returning too soon.
        """
        if not metrics.last_session_end:
            return False

        hours_since_last = (
            datetime.utcnow() - metrics.last_session_end
        ).total_seconds() / 3600

        # Discourage return within 2 hours of last session
        if hours_since_last < 2:
            return True

        # Discourage if user has had many sessions today
        if metrics.sessions_today >= self.max_sessions_per_day - 1:
            return True

        return False

    def get_return_discouragement(self, metrics: EngagementMetrics) -> Optional[str]:
        """
        Get a message discouraging too-soon return.
        """
        if not self.should_discourage_return(metrics):
            return None

        messages = [
            "Welcome back. Though I notice you were here quite recently. Everything okay out there?",
            "You're back soon. Remember: life happens outside this conversation.",
            "Hi again. Before we start, is there something in the real world you're avoiding?",
            "Back already? Let's keep this brief. The world needs your presence.",
        ]

        return random.choice(messages)

    def format_metrics_display(self, metrics: EngagementMetrics) -> str:
        """
        Format engagement metrics for user display.

        Transparency about usage is part of anti-capture design.
        """
        duration = int(metrics.session_duration_minutes())
        return (
            f"Session: {duration} minutes, {metrics.messages_this_session} messages\n"
            f"Today: {metrics.sessions_today} sessions, "
            f"{int(metrics.total_session_minutes_today)} total minutes\n"
            f"Streak: {metrics.consecutive_days} consecutive days"
        )


class AntiStickinessEngine:
    """
    Additional anti-stickiness measures beyond basic leave-ability.

    These are ACTIVE measures to reduce engagement when patterns
    suggest over-reliance.
    """

    def __init__(self):
        self._user_patterns: Dict[str, List[datetime]] = {}

    def record_interaction(self, user_id: str):
        """Record an interaction for pattern analysis."""
        if user_id not in self._user_patterns:
            self._user_patterns[user_id] = []
        self._user_patterns[user_id].append(datetime.utcnow())

        # Keep only last 100 interactions
        self._user_patterns[user_id] = self._user_patterns[user_id][-100:]

    def get_usage_pattern(self, user_id: str) -> Dict[str, Any]:
        """Analyze usage patterns for a user."""
        interactions = self._user_patterns.get(user_id, [])

        if len(interactions) < 2:
            return {"pattern": "insufficient_data"}

        # Calculate intervals between interactions
        intervals = []
        for i in range(1, len(interactions)):
            delta = (interactions[i] - interactions[i-1]).total_seconds() / 3600
            intervals.append(delta)

        avg_interval = sum(intervals) / len(intervals)
        min_interval = min(intervals)

        # Detect concerning patterns
        concerning = False
        reasons = []

        if avg_interval < 4:  # Less than 4 hours between sessions on average
            concerning = True
            reasons.append("high_frequency")

        if min_interval < 0.5:  # Sessions less than 30 minutes apart
            concerning = True
            reasons.append("rapid_return")

        # Check for late-night usage
        late_night_count = sum(
            1 for dt in interactions
            if dt.hour >= 23 or dt.hour <= 5
        )
        if late_night_count > len(interactions) * 0.3:
            concerning = True
            reasons.append("late_night_usage")

        return {
            "pattern": "concerning" if concerning else "healthy",
            "reasons": reasons,
            "average_interval_hours": avg_interval,
            "interaction_count": len(interactions),
        }

    def should_reduce_engagement(self, user_id: str) -> bool:
        """Determine if we should actively reduce engagement."""
        pattern = self.get_usage_pattern(user_id)
        return pattern.get("pattern") == "concerning"

    def get_engagement_reduction_strategy(self, user_id: str) -> Dict[str, Any]:
        """
        Get strategies to reduce engagement for a user.

        These are active measures to push the user away.
        """
        pattern = self.get_usage_pattern(user_id)
        strategies = []

        if "high_frequency" in pattern.get("reasons", []):
            strategies.append({
                "type": "increase_response_latency",
                "description": "Slightly delay responses to reduce engagement",
            })

        if "rapid_return" in pattern.get("reasons", []):
            strategies.append({
                "type": "session_cooldown",
                "description": "Encourage longer breaks between sessions",
            })

        if "late_night_usage" in pattern.get("reasons", []):
            strategies.append({
                "type": "time_awareness",
                "description": "Mention the late hour and encourage sleep",
            })

        # Always include reflection reduction
        strategies.append({
            "type": "reduced_depth",
            "description": "Provide less detailed reflections to reduce perceived value",
        })

        return {
            "should_reduce": len(strategies) > 0,
            "strategies": strategies,
        }
