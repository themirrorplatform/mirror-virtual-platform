"""
Tension Detector - Surfaces Internal Contradictions

Detects tensions, contradictions, and ambivalence in user reflections
without pathologizing or forcing resolution.

Constitutional Compliance:
- Axiom 1: No certainty (qualified observations)
- Axiom 3: No manipulation (surfaces, doesn't resolve)
- Axiom 4: No diagnosis (describes, doesn't label)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum
import re


class TensionType(Enum):
    """Types of tensions we detect."""
    EXPLICIT = "explicit_contradiction"  # "I love X but hate Y"
    EMOTIONAL = "emotional_ambivalence"  # Mixed feelings
    TEMPORAL = "temporal_tension"  # Past vs present
    VALUE = "value_conflict"  # Competing priorities


@dataclass
class DetectedTension:
    """A detected tension in user input."""
    tension_type: TensionType
    description: str
    severity: float  # 0.0 to 1.0
    pole_a: str  # One side of tension
    pole_b: str  # Other side
    evidence: str = ""
    first_seen: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "type": self.tension_type.value,
            "description": self.description,
            "severity": self.severity,
            "pole_a": self.pole_a,
            "pole_b": self.pole_b,
            "evidence": self.evidence,
            "first_seen": self.first_seen.isoformat(),
        }


# Contradiction markers
EXPLICIT_MARKERS = [
    r"\bbut\b",
    r"\bhowever\b",
    r"\balthough\b",
    r"\byet\b",
    r"\bon the other hand\b",
    r"\bat the same time\b",
    r"\bwhile\b.*\balso\b",
]

# Emotional ambivalence patterns
EMOTIONAL_PAIRS = [
    ("love", "hate"),
    ("happy", "sad"),
    ("want", "scared"),
    ("excited", "nervous"),
    ("grateful", "resentful"),
    ("proud", "ashamed"),
    ("hopeful", "hopeless"),
    ("calm", "anxious"),
]

# Temporal tension markers
TEMPORAL_MARKERS = [
    (r"\bused to\b", r"\bnow\b"),
    (r"\bbefore\b", r"\bnow\b"),
    (r"\bin the past\b", r"\btoday\b"),
    (r"\bwhen I was\b", r"\bnow I\b"),
]

# Value conflict phrases
VALUE_MARKERS = [
    r"\btorn between\b",
    r"\bcan't decide\b",
    r"\bshould I\b.*\bor\b",
    r"\bpart of me\b.*\bother part\b",
    r"\bhead says\b.*\bheart says\b",
    r"\bwant to\b.*\bbut also\b",
]


class TensionDetector:
    """
    Detects tensions in user reflections.

    Surfaces contradictions without forcing resolution.
    Constitutional: observations only, no judgment.
    """

    def __init__(self, min_severity: float = 0.3):
        """
        Initialize detector.

        Args:
            min_severity: Minimum severity to report a tension
        """
        self.min_severity = min_severity
        self._user_history: Dict[str, List[DetectedTension]] = {}

    def detect(
        self,
        text: str,
        user_id: str = None,
    ) -> List[DetectedTension]:
        """
        Detect tensions in text.

        Args:
            text: User's reflection text
            user_id: Optional user ID for history tracking

        Returns:
            List of detected tensions above severity threshold
        """
        text_lower = text.lower()
        tensions = []

        # Detect explicit contradictions
        tensions.extend(self._detect_explicit(text_lower))

        # Detect emotional ambivalence
        tensions.extend(self._detect_emotional(text_lower))

        # Detect temporal tensions
        tensions.extend(self._detect_temporal(text_lower))

        # Detect value conflicts
        tensions.extend(self._detect_value(text_lower))

        # Filter by severity
        tensions = [t for t in tensions if t.severity >= self.min_severity]

        # Update user history if tracking
        if user_id:
            self._update_history(user_id, tensions)

        return tensions

    def _detect_explicit(self, text: str) -> List[DetectedTension]:
        """Detect explicit contradictions using markers."""
        tensions = []

        for marker in EXPLICIT_MARKERS:
            if re.search(marker, text):
                # Extract context around the marker
                match = re.search(marker, text)
                if match:
                    start = max(0, match.start() - 50)
                    end = min(len(text), match.end() + 50)
                    context = text[start:end]

                    tensions.append(DetectedTension(
                        tension_type=TensionType.EXPLICIT,
                        description="There seems to be a contrast in what you're describing",
                        severity=0.6,
                        pole_a="what comes before",
                        pole_b="what follows",
                        evidence=context.strip(),
                    ))
                    break  # One explicit tension per text

        return tensions

    def _detect_emotional(self, text: str) -> List[DetectedTension]:
        """Detect emotional ambivalence from opposing emotions."""
        tensions = []

        for emotion_a, emotion_b in EMOTIONAL_PAIRS:
            if emotion_a in text and emotion_b in text:
                tensions.append(DetectedTension(
                    tension_type=TensionType.EMOTIONAL,
                    description=f"There seems to be mixed feelings around {emotion_a} and {emotion_b}",
                    severity=0.7,
                    pole_a=emotion_a,
                    pole_b=emotion_b,
                    evidence=f"Both '{emotion_a}' and '{emotion_b}' present",
                ))

        return tensions

    def _detect_temporal(self, text: str) -> List[DetectedTension]:
        """Detect tensions between past and present."""
        tensions = []

        for past_marker, present_marker in TEMPORAL_MARKERS:
            if re.search(past_marker, text) and re.search(present_marker, text):
                tensions.append(DetectedTension(
                    tension_type=TensionType.TEMPORAL,
                    description="There seems to be something between how things were and how they are now",
                    severity=0.5,
                    pole_a="past",
                    pole_b="present",
                    evidence="Temporal shift detected",
                ))
                break  # One temporal tension per text

        return tensions

    def _detect_value(self, text: str) -> List[DetectedTension]:
        """Detect value conflicts and internal dilemmas."""
        tensions = []

        for marker in VALUE_MARKERS:
            if re.search(marker, text):
                tensions.append(DetectedTension(
                    tension_type=TensionType.VALUE,
                    description="It sounds like there might be competing priorities or values at play",
                    severity=0.7,
                    pole_a="one option",
                    pole_b="another option",
                    evidence="Value conflict language detected",
                ))
                break  # One value tension per text

        return tensions

    def _update_history(
        self,
        user_id: str,
        new_tensions: List[DetectedTension],
    ) -> None:
        """Update user tension history."""
        if user_id not in self._user_history:
            self._user_history[user_id] = []

        self._user_history[user_id].extend(new_tensions)

        # Keep only last 20 tensions
        if len(self._user_history[user_id]) > 20:
            self._user_history[user_id] = self._user_history[user_id][-20:]

    def get_user_tensions(self, user_id: str) -> List[DetectedTension]:
        """Get tension history for a user."""
        return self._user_history.get(user_id, [])

    def get_recurring_tensions(
        self,
        user_id: str,
        tension_type: TensionType = None,
    ) -> List[DetectedTension]:
        """Get tensions that recur for a user."""
        tensions = self.get_user_tensions(user_id)

        if tension_type:
            tensions = [t for t in tensions if t.tension_type == tension_type]

        return tensions

    def clear_user_history(self, user_id: str) -> None:
        """Clear tension history for a user (data sovereignty)."""
        if user_id in self._user_history:
            del self._user_history[user_id]


# Singleton instance
_detector: Optional[TensionDetector] = None


def get_tension_detector(min_severity: float = 0.3) -> TensionDetector:
    """Get or create the tension detector singleton."""
    global _detector
    if _detector is None:
        _detector = TensionDetector(min_severity)
    return _detector


def detect_tensions(
    text: str,
    user_id: str = None,
) -> List[DetectedTension]:
    """
    Convenience function to detect tensions.

    Usage:
        tensions = detect_tensions("I love my job but I hate the commute")
        for t in tensions:
            print(f"{t.tension_type.value}: {t.description}")
    """
    detector = get_tension_detector()
    return detector.detect(text, user_id)
