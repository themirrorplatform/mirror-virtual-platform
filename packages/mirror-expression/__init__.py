"""
Mirror Expression - L3 Tone Adaptation with Leave-ability

This package implements Mirror's expression layer, controlling HOW
reflections are communicated while respecting constitutional constraints.

Key Principles:
1. **Tone Adaptation**: Match user's preferred communication style
2. **Leave-ability**: Never create psychological dependency
3. **Anti-Stickiness**: Active measures to prevent over-engagement
4. **Constitutional Compliance**: Every expression respects axioms

The Three Layers of Mirror Expression:
- L1: Core pattern recognition (what patterns exist)
- L2: Tension detection (what conflicts matter)
- L3: Tone adaptation (how to communicate) ← THIS PACKAGE

Usage:
    from mirror_expression import (
        ExpressionEngine,
        ToneProfile,
        LeaveabilityGuard,
    )

    # Configure expression
    profile = ToneProfile(
        directness=0.7,  # More direct
        warmth=0.5,      # Neutral warmth
        formality=0.3,   # Casual
    )

    engine = ExpressionEngine(profile)

    # Generate expression
    expression = engine.express(
        reflection=reflection,
        context=user_context
    )

    # Check leave-ability
    guard = LeaveabilityGuard()
    if guard.should_suggest_break(session_metrics):
        expression = guard.add_break_suggestion(expression)
"""

from .base import (
    ToneProfile,
    ToneDimension,
    ExpressionConfig,
    ExpressionResult,
    ExpressionConstraint,
)

from .tone import ToneAdapter, ToneAnalyzer
from .leaveability import LeaveabilityGuard, EngagementMetrics, BreakSuggestion
from .calibration import CalibrationEngine, UserPreferences
from .constraints import ConstitutionalConstraints, ConstraintViolation
from .engine import ExpressionEngine

__version__ = "1.0.0"
__all__ = [
    # Base types
    "ToneProfile",
    "ToneDimension",
    "ExpressionConfig",
    "ExpressionResult",
    "ExpressionConstraint",
    # Tone
    "ToneAdapter",
    "ToneAnalyzer",
    # Leave-ability
    "LeaveabilityGuard",
    "EngagementMetrics",
    "BreakSuggestion",
    # Calibration
    "CalibrationEngine",
    "UserPreferences",
    # Constraints
    "ConstitutionalConstraints",
    "ConstraintViolation",
    # Engine
    "ExpressionEngine",
]
