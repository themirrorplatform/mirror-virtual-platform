"""
Tension Detector - Identifies Contradictions and Tensions

Detects contradictions, tensions, and paradoxes in user reflections.
These are valuable insights that can lead to growth.

Types of tensions detected:
- Emotional contradictions ("I love it but I hate it")
- Behavioral mismatches (says X, does Y)
- Value conflicts (wants A, chooses B)
- Temporal tensions (past vs present)

Constitutional Compliance:
- No diagnosis (Axiom 3): Tensions are observations, not pathology
- No certainty (Axiom 4): Qualified language only
- Necessity (Axiom 6): Only surface meaningful tensions
- No capture (Axiom 13): Tensions are for awareness, not dependency
"""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
import re


@dataclass
class DetectedTension:
    """A tension/contradiction detected in reflection"""
    id: str
    tension_type: str  # "emotional", "behavioral", "value", "temporal"
    description: str
    side_a: str  # One side of the tension
    side_b: str  # The other side
    severity: float  # 0.0 to 1.0 (how significant)
    evidence: List[str] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.tension_type,
            "description": self.description,
            "side_a": self.side_a,
            "side_b": self.side_b,
            "severity": self.severity,
            "evidence": self.evidence,
        }


class TensionDetector:
    """
    Detects contradictions and tensions in reflections.
    
    Uses linguistic patterns to identify:
    - Explicit contradictions ("but", "however", "although")
    - Emotional ambivalence ("I want to but I can't")
    - Value misalignment (says one thing, implies another)
    """
    
    # Contradiction markers
    CONTRADICTION_MARKERS = [
        "but ", " but", "however", "although", "even though", "despite",
        "yet ", "still", "nevertheless", "on the other hand",
    ]
    
    # Emotional ambivalence patterns
    AMBIVALENCE_PATTERNS = [
        (r"(love|like|enjoy).*(but|yet|however).*(hate|dislike|dread)", "emotional_ambivalence"),
        (r"want to.*(but|yet|however).*(can't|won't|don't)", "desire_vs_action"),
        (r"should.*(but|yet|however).*(don't|won't|can't)", "obligation_vs_reality"),
        (r"know.*(but|yet|however).*(feel|think)", "knowing_vs_feeling"),
    ]
    
    # Temporal tensions
    TEMPORAL_MARKERS = [
        (r"used to.*but now", "past_vs_present"),
        (r"always.*but (lately|recently|now)", "past_vs_present"),
        (r"before.*but (now|today)", "past_vs_present"),
    ]
    
    def __init__(self):
        self.tension_history: List[DetectedTension] = []
    
    def detect(self, text: str, user_id: str = None) -> List[DetectedTension]:
        """
        Detect tensions in user's text.
        
        Args:
            text: User's reflection text
            user_id: Optional user ID for history
            
        Returns:
            List of detected tensions
        """
        tensions = []
        text_lower = text.lower()
        
        # 1. Look for explicit contradictions
        for marker in self.CONTRADICTION_MARKERS:
            if marker in text_lower:
                # Find the contradicting parts
                parts = text_lower.split(marker, 1)
                if len(parts) == 2:
                    # Get context around the contradiction
                    before = parts[0].strip()[-100:] if len(parts[0]) > 100 else parts[0].strip()
                    after = parts[1].strip()[:100] if len(parts[1]) > 100 else parts[1].strip()
                    
                    tension = DetectedTension(
                        id=f"contradiction_{len(tensions)}",
                        tension_type="explicit_contradiction",
                        description=f"Contradictory elements connected by '{marker}'",
                        side_a=before,
                        side_b=after,
                        severity=0.6,
                        evidence=[f"{before} {marker} {after}"],
                    )
                    tensions.append(tension)
                    break  # Only detect one explicit contradiction per text
        
        # 2. Look for emotional ambivalence
        for pattern, tension_type in self.AMBIVALENCE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                # Extract the full sentence
                sentence = self._extract_sentence(text, match.start())
                
                tension = DetectedTension(
                    id=f"ambivalence_{tension_type}",
                    tension_type="emotional",
                    description=self._describe_ambivalence(tension_type),
                    side_a=match.group(1) if match.lastindex >= 1 else "",
                    side_b=match.group(3) if match.lastindex >= 3 else "",
                    severity=0.7,
                    evidence=[sentence],
                )
                tensions.append(tension)
        
        # 3. Look for temporal tensions
        for pattern, tension_type in self.TEMPORAL_MARKERS:
            match = re.search(pattern, text_lower)
            if match:
                sentence = self._extract_sentence(text, match.start())
                
                tension = DetectedTension(
                    id=f"temporal_{len(tensions)}",
                    tension_type="temporal",
                    description="Change or shift over time",
                    side_a="Past state",
                    side_b="Present state",
                    severity=0.5,
                    evidence=[sentence],
                )
                tensions.append(tension)
        
        # 4. Detect value conflicts (keywords suggesting internal conflict)
        value_conflict_markers = [
            "torn between", "struggling with", "conflict", "dilemma",
            "don't know if", "unsure whether", "can't decide",
        ]
        
        for marker in value_conflict_markers:
            if marker in text_lower:
                idx = text_lower.find(marker)
                context = text[max(0, idx-50):min(len(text), idx+100)]
                
                tension = DetectedTension(
                    id=f"value_conflict_{len(tensions)}",
                    tension_type="value",
                    description="Internal conflict about choices or values",
                    side_a="One option or value",
                    side_b="Competing option or value",
                    severity=0.7,
                    evidence=[context],
                )
                tensions.append(tension)
                break
        
        # Store in history
        if user_id:
            self.tension_history.extend(tensions)
        
        return tensions
    
    def _extract_sentence(self, text: str, position: int) -> str:
        """Extract the sentence containing the position"""
        # Find sentence boundaries (. ! ?)
        start = text.rfind('.', 0, position)
        start = max(text.rfind('!', 0, position), start)
        start = max(text.rfind('?', 0, position), start)
        start = start + 1 if start != -1 else 0
        
        end = text.find('.', position)
        end = min(text.find('!', position), end) if text.find('!', position) != -1 else end
        end = min(text.find('?', position), end) if text.find('?', position) != -1 else end
        end = end if end != -1 else len(text)
        
        return text[start:end].strip()
    
    def _describe_ambivalence(self, tension_type: str) -> str:
        """Generate human-readable description of ambivalence type"""
        descriptions = {
            "emotional_ambivalence": "Mixed feelings about something",
            "desire_vs_action": "Gap between what you want and what you do",
            "obligation_vs_reality": "Tension between 'should' and actual behavior",
            "knowing_vs_feeling": "Head and heart not aligned",
        }
        return descriptions.get(tension_type, "Internal tension detected")
    
    def get_user_tensions(self, user_id: str) -> List[DetectedTension]:
        """Get all tensions for a user"""
        return [t for t in self.tension_history if user_id in t.id]


# Singleton instance
_detector = TensionDetector()


def detect_tensions(text: str, user_id: str = None) -> List[DetectedTension]:
    """
    Convenience function to detect tensions.
    
    Usage:
        tensions = detect_tensions("I love my job but I'm exhausted")
    """
    return _detector.detect(text, user_id)


def get_user_tensions(user_id: str) -> List[DetectedTension]:
    """Get all detected tensions for a user"""
    return _detector.get_user_tensions(user_id)
