"""
Pattern Detector - Lightweight Rule-Based Pattern Recognition

Detects emotional, topical, behavioral, and temporal patterns
in user reflections without pathologizing or diagnosing.

Constitutional Compliance:
- Axiom 1: No certainty (uses confidence scores)
- Axiom 4: No diagnosis (observations only)
- Axiom 6: Minimal necessary (threshold-based)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from datetime import datetime
from enum import Enum
import re


class PatternType(Enum):
    """Types of patterns we detect."""
    EMOTION = "emotion"
    TOPIC = "topic"
    BEHAVIOR = "behavior"
    TEMPORAL = "temporal"


@dataclass
class DetectedPattern:
    """A detected pattern in user input."""
    pattern_type: PatternType
    name: str
    confidence: float  # 0.0 to 1.0
    evidence: List[str] = field(default_factory=list)
    first_seen: datetime = field(default_factory=datetime.utcnow)
    occurrences: int = 1

    def to_dict(self) -> dict:
        return {
            "type": self.pattern_type.value,
            "name": self.name,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "first_seen": self.first_seen.isoformat(),
            "occurrences": self.occurrences,
        }


# Pattern definitions
EMOTION_PATTERNS = {
    "anxiety": ["anxious", "worried", "nervous", "stressed", "overwhelmed", "panic"],
    "sadness": ["sad", "depressed", "down", "unhappy", "miserable", "hopeless"],
    "anger": ["angry", "frustrated", "irritated", "annoyed", "furious", "resentful"],
    "joy": ["happy", "excited", "joyful", "content", "grateful", "pleased"],
    "fear": ["scared", "afraid", "terrified", "fearful", "dread"],
    "confusion": ["confused", "uncertain", "lost", "unsure", "puzzled"],
    "loneliness": ["lonely", "isolated", "alone", "disconnected"],
    "contentment": ["peaceful", "calm", "relaxed", "satisfied", "at ease"],
}

TOPIC_PATTERNS = {
    "work": ["work", "job", "career", "boss", "colleague", "office", "meeting", "deadline"],
    "relationships": ["partner", "spouse", "friend", "family", "relationship", "dating", "marriage"],
    "health": ["health", "exercise", "sleep", "diet", "body", "gym", "tired", "energy"],
    "finances": ["money", "finances", "debt", "savings", "budget", "expenses", "bills"],
    "identity": ["who am i", "purpose", "meaning", "values", "authentic", "self"],
    "growth": ["learning", "growing", "improving", "change", "goals", "future"],
    "past": ["used to", "before", "childhood", "memories", "regret", "nostalgia"],
}

BEHAVIOR_PATTERNS = {
    "avoidance": ["avoiding", "putting off", "procrastinating", "ignoring"],
    "perfectionism": ["perfect", "failure", "not good enough", "should be better"],
    "overcommitment": ["too busy", "no time", "overwhelmed", "overloaded"],
    "people_pleasing": ["what they think", "approval", "disappointing", "letting down"],
    "self_criticism": ["stupid", "idiot", "my fault", "I always", "I never"],
    "routine": ["every day", "routine", "habit", "always do", "morning", "evening"],
}

TEMPORAL_PATTERNS = {
    "morning_person": ["morning", "early", "sunrise", "before work"],
    "night_owl": ["night", "late", "midnight", "can't sleep"],
    "weekend": ["weekend", "saturday", "sunday", "day off"],
    "seasonal": ["winter", "summer", "spring", "fall", "season"],
}


class PatternDetector:
    """
    Detects patterns in user reflections.

    Uses keyword matching with confidence scoring.
    Constitutional: observations only, no diagnoses.
    """

    def __init__(self, min_confidence: float = 0.3):
        """
        Initialize detector.

        Args:
            min_confidence: Minimum confidence to report a pattern
        """
        self.min_confidence = min_confidence
        self._user_history: Dict[str, List[DetectedPattern]] = {}

    def detect(
        self,
        text: str,
        user_id: str = None,
    ) -> List[DetectedPattern]:
        """
        Detect patterns in text.

        Args:
            text: User's reflection text
            user_id: Optional user ID for history tracking

        Returns:
            List of detected patterns above confidence threshold
        """
        text_lower = text.lower()
        patterns = []

        # Detect emotion patterns
        patterns.extend(self._detect_category(
            text_lower, EMOTION_PATTERNS, PatternType.EMOTION
        ))

        # Detect topic patterns
        patterns.extend(self._detect_category(
            text_lower, TOPIC_PATTERNS, PatternType.TOPIC
        ))

        # Detect behavior patterns
        patterns.extend(self._detect_category(
            text_lower, BEHAVIOR_PATTERNS, PatternType.BEHAVIOR
        ))

        # Detect temporal patterns
        patterns.extend(self._detect_category(
            text_lower, TEMPORAL_PATTERNS, PatternType.TEMPORAL
        ))

        # Filter by confidence
        patterns = [p for p in patterns if p.confidence >= self.min_confidence]

        # Update user history if tracking
        if user_id:
            self._update_history(user_id, patterns)

        return patterns

    def _detect_category(
        self,
        text: str,
        pattern_dict: Dict[str, List[str]],
        pattern_type: PatternType,
    ) -> List[DetectedPattern]:
        """Detect patterns from a category."""
        detected = []

        for name, keywords in pattern_dict.items():
            matches = []
            for keyword in keywords:
                if keyword in text:
                    matches.append(keyword)

            if matches:
                # Confidence based on number of matches relative to keywords
                confidence = min(len(matches) / len(keywords) + 0.3, 1.0)

                detected.append(DetectedPattern(
                    pattern_type=pattern_type,
                    name=name,
                    confidence=round(confidence, 2),
                    evidence=matches[:3],  # Keep top 3 evidence
                ))

        return detected

    def _update_history(
        self,
        user_id: str,
        new_patterns: List[DetectedPattern],
    ) -> None:
        """Update user pattern history."""
        if user_id not in self._user_history:
            self._user_history[user_id] = []

        for new_p in new_patterns:
            # Check if pattern already exists
            existing = None
            for old_p in self._user_history[user_id]:
                if old_p.pattern_type == new_p.pattern_type and old_p.name == new_p.name:
                    existing = old_p
                    break

            if existing:
                # Update existing pattern
                existing.occurrences += 1
                existing.confidence = max(existing.confidence, new_p.confidence)
                existing.evidence.extend(new_p.evidence)
                existing.evidence = list(set(existing.evidence))[:5]  # Dedupe, keep 5
            else:
                # Add new pattern
                self._user_history[user_id].append(new_p)

    def get_user_patterns(
        self,
        user_id: str,
        min_occurrences: int = 1,
    ) -> List[DetectedPattern]:
        """
        Get patterns for a user.

        Args:
            user_id: User ID
            min_occurrences: Minimum occurrences to include

        Returns:
            List of patterns meeting criteria
        """
        if user_id not in self._user_history:
            return []

        return [
            p for p in self._user_history[user_id]
            if p.occurrences >= min_occurrences
        ]

    def get_recurring_patterns(
        self,
        user_id: str,
        min_occurrences: int = 2,
    ) -> List[DetectedPattern]:
        """Get patterns that recur for a user."""
        return self.get_user_patterns(user_id, min_occurrences)

    def clear_user_history(self, user_id: str) -> None:
        """Clear pattern history for a user (data sovereignty)."""
        if user_id in self._user_history:
            del self._user_history[user_id]


# Singleton instance
_detector: Optional[PatternDetector] = None


def get_pattern_detector(min_confidence: float = 0.3) -> PatternDetector:
    """Get or create the pattern detector singleton."""
    global _detector
    if _detector is None:
        _detector = PatternDetector(min_confidence)
    return _detector


def detect_patterns(
    text: str,
    user_id: str = None,
) -> List[DetectedPattern]:
    """
    Convenience function to detect patterns.

    Usage:
        patterns = detect_patterns("I've been anxious about work")
        for p in patterns:
            print(f"{p.pattern_type.value}/{p.name}: {p.confidence}")
    """
    detector = get_pattern_detector()
    return detector.detect(text, user_id)
