"""
Pattern Detector - Simple Pattern Recognition for Reflections

Detects recurring themes, emotions, and behavioral patterns in user reflections.

This is a lightweight implementation that can be enhanced with ML later.
Uses rule-based detection for common patterns:
- Emotional patterns (recurring feelings)
- Topic patterns (work, relationships, health, etc.)
- Behavioral patterns (routines, habits)
- Temporal patterns (morning person, night owl, etc.)

Constitutional Compliance:
- No diagnosis (Axiom 3): Patterns are observations, not diagnoses
- No certainty (Axiom 4): Always qualified ("might", "seems", "appears")
- Necessity (Axiom 6): Only surface meaningful patterns
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
import re


@dataclass
class DetectedPattern:
    """A pattern detected in user's reflection"""
    id: str
    pattern_type: str  # "emotion", "topic", "behavior", "temporal"
    name: str  # e.g., "morning_energy", "work_stress"
    confidence: float  # 0.0 to 1.0
    evidence: List[str] = field(default_factory=list)  # Text snippets that match
    first_seen: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    occurrences: int = 1
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.pattern_type,
            "name": self.name,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "occurrences": self.occurrences,
        }


class PatternDetector:
    """
    Lightweight pattern detector for reflections.
    
    Scans user input for recurring themes and patterns.
    Constitutional: Observations only, never diagnoses.
    """
    
    # Emotion patterns
    EMOTION_PATTERNS = {
        "anxiety": {
            "keywords": ["anxious", "worried", "nervous", "stressed", "overwhelm", "panic"],
            "weight": 0.8,
        },
        "contentment": {
            "keywords": ["happy", "content", "satisfied", "peaceful", "calm", "good"],
            "weight": 0.7,
        },
        "frustration": {
            "keywords": ["frustrated", "annoyed", "irritated", "angry", "mad"],
            "weight": 0.8,
        },
        "sadness": {
            "keywords": ["sad", "down", "depressed", "blue", "unhappy", "miserable"],
            "weight": 0.8,
        },
        "energy": {
            "keywords": ["energetic", "motivated", "excited", "pumped", "fired up"],
            "weight": 0.7,
        },
        "fatigue": {
            "keywords": ["tired", "exhausted", "drained", "burnt out", "worn out"],
            "weight": 0.7,
        },
    }
    
    # Topic patterns
    TOPIC_PATTERNS = {
        "work": {
            "keywords": ["work", "job", "boss", "colleague", "office", "career", "project"],
            "weight": 0.9,
        },
        "relationships": {
            "keywords": ["friend", "partner", "spouse", "family", "relationship", "dating"],
            "weight": 0.9,
        },
        "health": {
            "keywords": ["health", "exercise", "workout", "gym", "diet", "sleep", "fitness"],
            "weight": 0.8,
        },
        "personal_growth": {
            "keywords": ["learn", "grow", "improve", "develop", "practice", "skill"],
            "weight": 0.7,
        },
        "creativity": {
            "keywords": ["create", "design", "write", "art", "music", "project"],
            "weight": 0.7,
        },
    }
    
    # Behavioral patterns
    BEHAVIOR_PATTERNS = {
        "routine_building": {
            "keywords": ["routine", "habit", "schedule", "daily", "every morning", "every day"],
            "weight": 0.8,
        },
        "procrastination": {
            "keywords": ["procrastinat", "put off", "delay", "avoid", "later"],
            "weight": 0.7,
        },
        "reflection_practice": {
            "keywords": ["thinking about", "reflecting on", "considering", "wondering"],
            "weight": 0.6,
        },
    }
    
    # Temporal patterns
    TEMPORAL_PATTERNS = {
        "morning_person": {
            "keywords": ["morning", "wake up", "start of day", "early"],
            "weight": 0.6,
        },
        "night_owl": {
            "keywords": ["night", "evening", "late", "end of day"],
            "weight": 0.6,
        },
    }
    
    def __init__(self):
        self.pattern_history: Dict[str, DetectedPattern] = {}
    
    def detect(self, text: str, user_id: str = None) -> List[DetectedPattern]:
        """
        Detect patterns in user's text.
        
        Args:
            text: User's reflection text
            user_id: Optional user ID for history tracking
            
        Returns:
            List of detected patterns
        """
        text_lower = text.lower()
        detected = []
        
        # Detect emotions
        for emotion, config in self.EMOTION_PATTERNS.items():
            matches = self._find_matches(text_lower, config["keywords"])
            if matches:
                pattern = DetectedPattern(
                    id=f"emotion_{emotion}",
                    pattern_type="emotion",
                    name=emotion,
                    confidence=min(len(matches) * config["weight"] / 3, 1.0),
                    evidence=matches[:3],  # Max 3 examples
                )
                detected.append(pattern)
        
        # Detect topics
        for topic, config in self.TOPIC_PATTERNS.items():
            matches = self._find_matches(text_lower, config["keywords"])
            if matches:
                pattern = DetectedPattern(
                    id=f"topic_{topic}",
                    pattern_type="topic",
                    name=topic,
                    confidence=min(len(matches) * config["weight"] / 3, 1.0),
                    evidence=matches[:3],
                )
                detected.append(pattern)
        
        # Detect behaviors
        for behavior, config in self.BEHAVIOR_PATTERNS.items():
            matches = self._find_matches(text_lower, config["keywords"])
            if matches:
                pattern = DetectedPattern(
                    id=f"behavior_{behavior}",
                    pattern_type="behavior",
                    name=behavior,
                    confidence=min(len(matches) * config["weight"] / 2, 1.0),
                    evidence=matches[:2],
                )
                detected.append(pattern)
        
        # Detect temporal patterns
        for temporal, config in self.TEMPORAL_PATTERNS.items():
            matches = self._find_matches(text_lower, config["keywords"])
            if matches:
                pattern = DetectedPattern(
                    id=f"temporal_{temporal}",
                    pattern_type="temporal",
                    name=temporal,
                    confidence=min(len(matches) * config["weight"] / 2, 1.0),
                    evidence=matches[:2],
                )
                detected.append(pattern)
        
        # Update history
        if user_id:
            for pattern in detected:
                key = f"{user_id}_{pattern.id}"
                if key in self.pattern_history:
                    existing = self.pattern_history[key]
                    existing.occurrences += 1
                    existing.last_seen = datetime.utcnow()
                    existing.evidence.extend(pattern.evidence)
                    existing.evidence = existing.evidence[:5]  # Keep max 5
                    existing.confidence = min(existing.confidence + 0.1, 1.0)
                else:
                    self.pattern_history[key] = pattern
        
        # Return patterns with confidence > 0.5
        return [p for p in detected if p.confidence >= 0.5]
    
    def _find_matches(self, text: str, keywords: List[str]) -> List[str]:
        """Find matching keywords in text and return context"""
        matches = []
        for keyword in keywords:
            if keyword in text:
                # Get context around match (20 chars before/after)
                idx = text.find(keyword)
                start = max(0, idx - 20)
                end = min(len(text), idx + len(keyword) + 20)
                context = text[start:end].strip()
                if context not in matches:
                    matches.append(context)
        return matches
    
    def get_user_patterns(self, user_id: str) -> List[DetectedPattern]:
        """Get all patterns for a user from history"""
        return [
            p for key, p in self.pattern_history.items()
            if key.startswith(f"{user_id}_")
        ]
    
    def get_recurring_patterns(self, user_id: str, min_occurrences: int = 3) -> List[DetectedPattern]:
        """Get patterns that have occurred multiple times"""
        return [
            p for p in self.get_user_patterns(user_id)
            if p.occurrences >= min_occurrences
        ]


# Singleton instance
_detector = PatternDetector()


def detect_patterns(text: str, user_id: str = None) -> List[DetectedPattern]:
    """
    Convenience function to detect patterns.
    
    Usage:
        patterns = detect_patterns("I've been feeling anxious about work lately")
    """
    return _detector.detect(text, user_id)


def get_user_patterns(user_id: str) -> List[DetectedPattern]:
    """Get all detected patterns for a user"""
    return _detector.get_user_patterns(user_id)


def get_recurring_patterns(user_id: str, min_occurrences: int = 3) -> List[DetectedPattern]:
    """Get patterns that recur frequently"""
    return _detector.get_recurring_patterns(user_id, min_occurrences)
