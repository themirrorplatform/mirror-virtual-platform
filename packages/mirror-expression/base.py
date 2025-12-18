"""
Base types for the expression layer.

Defines core data structures for tone adaptation and expression.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime
from enum import Enum


class ToneDimension(Enum):
    """Dimensions of tone that can be adapted."""
    # How direct vs diplomatic the communication is
    DIRECTNESS = "directness"
    # Emotional warmth vs clinical detachment
    WARMTH = "warmth"
    # Formal vs casual register
    FORMALITY = "formality"
    # Concise vs elaborate explanation
    VERBOSITY = "verbosity"
    # Certainty of language (hedged vs confident)
    CERTAINTY = "certainty"
    # Abstract vs concrete examples
    ABSTRACTION = "abstraction"


@dataclass
class ToneProfile:
    """
    User's preferred tone profile.

    Each dimension is a float from 0.0 to 1.0:
    - 0.0 = minimum (e.g., very diplomatic, very cold)
    - 0.5 = neutral/balanced
    - 1.0 = maximum (e.g., very direct, very warm)
    """
    directness: float = 0.5
    warmth: float = 0.5
    formality: float = 0.5
    verbosity: float = 0.5
    certainty: float = 0.3  # Default to hedged (respects Axiom 1)
    abstraction: float = 0.5

    # Source of this profile
    source: str = "default"  # "default", "explicit", "inferred", "calibrated"
    last_updated: Optional[datetime] = None

    def __post_init__(self):
        """Validate all values are in range."""
        for dim in ToneDimension:
            value = getattr(self, dim.value)
            if not 0.0 <= value <= 1.0:
                raise ValueError(
                    f"{dim.value} must be between 0.0 and 1.0, got {value}"
                )

    def get(self, dimension: ToneDimension) -> float:
        """Get value for a dimension."""
        return getattr(self, dimension.value)

    def set(self, dimension: ToneDimension, value: float):
        """Set value for a dimension."""
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"Value must be between 0.0 and 1.0, got {value}")
        setattr(self, dimension.value, value)
        self.last_updated = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "directness": self.directness,
            "warmth": self.warmth,
            "formality": self.formality,
            "verbosity": self.verbosity,
            "certainty": self.certainty,
            "abstraction": self.abstraction,
            "source": self.source,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ToneProfile":
        last_updated = data.get("last_updated")
        if isinstance(last_updated, str):
            last_updated = datetime.fromisoformat(last_updated)

        return cls(
            directness=data.get("directness", 0.5),
            warmth=data.get("warmth", 0.5),
            formality=data.get("formality", 0.5),
            verbosity=data.get("verbosity", 0.5),
            certainty=data.get("certainty", 0.3),
            abstraction=data.get("abstraction", 0.5),
            source=data.get("source", "default"),
            last_updated=last_updated,
        )


@dataclass
class ExpressionConstraint:
    """A constraint on how expressions can be formed."""
    name: str
    description: str
    axiom_reference: Optional[str] = None  # Which axiom this enforces
    is_hard: bool = True  # Hard constraints cannot be violated

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "axiom_reference": self.axiom_reference,
            "is_hard": self.is_hard,
        }


@dataclass
class ExpressionConfig:
    """Configuration for the expression engine."""
    # Tone settings
    default_profile: ToneProfile = field(default_factory=ToneProfile)
    allow_profile_override: bool = True

    # Leave-ability settings
    enable_break_suggestions: bool = True
    session_warning_minutes: int = 45
    session_limit_minutes: int = 90
    min_messages_before_break: int = 10

    # Anti-stickiness
    enable_anti_stickiness: bool = True
    max_consecutive_sessions: int = 3
    cooldown_hours: int = 4

    # Constitutional constraints
    enforce_constraints: bool = True
    log_constraint_violations: bool = True

    def to_dict(self) -> dict:
        return {
            "default_profile": self.default_profile.to_dict(),
            "allow_profile_override": self.allow_profile_override,
            "enable_break_suggestions": self.enable_break_suggestions,
            "session_warning_minutes": self.session_warning_minutes,
            "session_limit_minutes": self.session_limit_minutes,
            "min_messages_before_break": self.min_messages_before_break,
            "enable_anti_stickiness": self.enable_anti_stickiness,
            "max_consecutive_sessions": self.max_consecutive_sessions,
            "cooldown_hours": self.cooldown_hours,
            "enforce_constraints": self.enforce_constraints,
            "log_constraint_violations": self.log_constraint_violations,
        }


@dataclass
class ExpressionResult:
    """Result of expressing a reflection."""
    # The expressed text
    text: str

    # Metadata
    original_reflection_id: str
    tone_profile_used: ToneProfile
    constraints_applied: List[str] = field(default_factory=list)

    # Leave-ability
    break_suggested: bool = False
    break_message: Optional[str] = None

    # Warnings
    warnings: List[str] = field(default_factory=list)

    # Timing
    expressed_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "original_reflection_id": self.original_reflection_id,
            "tone_profile_used": self.tone_profile_used.to_dict(),
            "constraints_applied": self.constraints_applied,
            "break_suggested": self.break_suggested,
            "break_message": self.break_message,
            "warnings": self.warnings,
            "expressed_at": self.expressed_at.isoformat(),
        }


# Pre-defined tone profiles for common styles
TONE_PRESETS = {
    "diplomatic": ToneProfile(
        directness=0.2,
        warmth=0.6,
        formality=0.5,
        verbosity=0.6,
        certainty=0.2,
        abstraction=0.5,
        source="preset",
    ),
    "direct": ToneProfile(
        directness=0.9,
        warmth=0.4,
        formality=0.4,
        verbosity=0.3,
        certainty=0.4,
        abstraction=0.3,
        source="preset",
    ),
    "warm": ToneProfile(
        directness=0.5,
        warmth=0.9,
        formality=0.3,
        verbosity=0.6,
        certainty=0.3,
        abstraction=0.4,
        source="preset",
    ),
    "clinical": ToneProfile(
        directness=0.7,
        warmth=0.2,
        formality=0.8,
        verbosity=0.4,
        certainty=0.3,
        abstraction=0.6,
        source="preset",
    ),
    "casual": ToneProfile(
        directness=0.6,
        warmth=0.7,
        formality=0.1,
        verbosity=0.5,
        certainty=0.3,
        abstraction=0.3,
        source="preset",
    ),
}
