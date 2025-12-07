"""
Regression Detector - Identifies patterns of regression in thinking.

Regression is NOT failure. It's curriculum.
This detector identifies when someone is looping, self-attacking,
spiking in judgment, or avoiding - so the platform can help.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class RegressionDetector:
    """
    Detects regression patterns in reflections.

    Types of regression:
    - Loop: Repeating the same thoughts/patterns
    - Self-attack: Harsh self-judgment language
    - Judgment spike: Sudden increase in judgmental thinking
    - Avoidance: Deflection, changing subjects, surface-level
    """

    # Self-attack markers (from tone_analyzer, but with severity scoring)
    SELF_ATTACK_MARKERS = {
        "harsh": [
            "i'm stupid", "i'm worthless", "i'm a failure",
            "hate myself", "i'm pathetic", "i'm garbage"
        ],
        "moderate": [
            "i'm terrible", "i'm awful", "i'm useless",
            "i can't do anything", "i'm not good enough"
        ],
        "mild": [
            "i'm bad at", "i messed up", "i'm the worst",
            "i always fail", "i never get it right"
        ]
    }

    # Judgment spike markers (outward harsh judgment)
    JUDGMENT_MARKERS = [
        "idiots", "stupid people", "everyone is",
        "they're all", "nobody understands", "so dumb",
        "hate when", "can't stand", "awful people"
    ]

    # Avoidance markers
    AVOIDANCE_MARKERS = [
        "anyway", "doesn't matter", "whatever",
        "moving on", "forget it", "not important",
        "change the subject"
    ]

    def detect_self_attack(self, reflection_text: str) -> Optional[Dict[str, Any]]:
        """
        Detect self-attacking language and its severity.

        Returns:
            {
                "kind": "self_attack",
                "severity": int (1-5),
                "description": str,
                "markers_found": List[str]
            }
        """
        lower_text = reflection_text.lower()
        markers_found = []
        severity = 0

        # Check harsh markers (severity 4-5)
        harsh_matches = [m for m in self.SELF_ATTACK_MARKERS["harsh"] if m in lower_text]
        if harsh_matches:
            severity = max(severity, 5)
            markers_found.extend(harsh_matches)

        # Check moderate markers (severity 3)
        moderate_matches = [m for m in self.SELF_ATTACK_MARKERS["moderate"] if m in lower_text]
        if moderate_matches:
            severity = max(severity, 3)
            markers_found.extend(moderate_matches)

        # Check mild markers (severity 2)
        mild_matches = [m for m in self.SELF_ATTACK_MARKERS["mild"] if m in lower_text]
        if mild_matches:
            severity = max(severity, 2)
            markers_found.extend(mild_matches)

        if severity == 0:
            return None

        return {
            "kind": "self_attack",
            "severity": severity,
            "description": f"Self-attacking language detected (severity {severity}/5)",
            "markers_found": markers_found
        }

    def detect_judgment_spike(self, reflection_text: str) -> Optional[Dict[str, Any]]:
        """
        Detect harsh outward judgment (often a deflection from self).

        Returns similar structure to detect_self_attack
        """
        lower_text = reflection_text.lower()
        markers_found = [m for m in self.JUDGMENT_MARKERS if m in lower_text]

        if not markers_found:
            return None

        severity = min(5, len(markers_found) * 2)

        return {
            "kind": "judgment_spike",
            "severity": severity,
            "description": f"Harsh judgment toward others detected",
            "markers_found": markers_found
        }

    def detect_avoidance(self, reflection_text: str) -> Optional[Dict[str, Any]]:
        """
        Detect avoidance patterns (deflection, dismissal).
        """
        lower_text = reflection_text.lower()
        markers_found = [m for m in self.AVOIDANCE_MARKERS if m in lower_text]

        if not markers_found:
            return None

        # Also check for very short reflections (< 20 words = possible avoidance)
        word_count = len(reflection_text.split())
        is_brief = word_count < 20

        severity = 1
        if len(markers_found) >= 2:
            severity = 3
        elif is_brief and markers_found:
            severity = 2

        description = "Avoidance language detected"
        if is_brief:
            description += " (brief reflection may indicate surface engagement)"

        return {
            "kind": "avoidance",
            "severity": severity,
            "description": description,
            "markers_found": markers_found
        }

    def detect_loop(
        self,
        current_reflection: str,
        recent_reflections: List[Dict[str, Any]],
        similarity_threshold: float = 0.7
    ) -> Optional[Dict[str, Any]]:
        """
        Detect if someone is looping (repeating the same thoughts).

        This requires comparing with recent reflections from same user.

        Args:
            current_reflection: The current reflection text
            recent_reflections: List of recent reflections (with 'body' field)
            similarity_threshold: How similar = loop (0.0 to 1.0)

        Returns:
            Regression marker if loop detected
        """
        if not recent_reflections:
            return None

        # Simple similarity check (word overlap)
        current_words = set(current_reflection.lower().split())

        for past_reflection in recent_reflections[:5]:  # Check last 5
            past_words = set(past_reflection['body'].lower().split())

            # Calculate Jaccard similarity
            intersection = len(current_words & past_words)
            union = len(current_words | past_words)

            if union == 0:
                continue

            similarity = intersection / union

            if similarity >= similarity_threshold:
                return {
                    "kind": "loop",
                    "severity": 3,
                    "description": f"Reflection very similar to recent reflection (similarity: {similarity:.2f})",
                    "pattern_id": f"loop_{past_reflection.get('id', 'unknown')}"
                }

        return None

    def analyze(
        self,
        reflection_text: str,
        recent_reflections: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Run all regression detection analyses.

        Returns:
            List of detected regression markers
        """
        regressions = []

        # Detect self-attack
        self_attack = self.detect_self_attack(reflection_text)
        if self_attack:
            regressions.append(self_attack)

        # Detect judgment spike
        judgment = self.detect_judgment_spike(reflection_text)
        if judgment:
            regressions.append(judgment)

        # Detect avoidance
        avoidance = self.detect_avoidance(reflection_text)
        if avoidance:
            regressions.append(avoidance)

        # Detect loop (if we have recent reflections)
        if recent_reflections:
            loop = self.detect_loop(reflection_text, recent_reflections)
            if loop:
                regressions.append(loop)

        return regressions
