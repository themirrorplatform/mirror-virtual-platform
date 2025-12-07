"""
Bias Analyzer - Detects patterns in thinking (not political bias).

This analyzer identifies HOW someone thinks, not WHAT they think.
It surfaces cognitive patterns, not ideological positions.
"""
from typing import Dict, List, Any, Optional


class BiasAnalyzer:
    """
    Detects patterns in thinking that reveal cognitive biases.

    Focus areas:
    - Attribution: Who gets blame/credit?
    - Absolutism: All-or-nothing thinking
    - Control: Internal vs. external locus
    - Time: Past-focused, future-anxious, present-absent
    """

    # Attribution patterns (who gets blame/credit)
    ATTRIBUTION_MARKERS = {
        "self_blame": [
            "my fault", "i should have", "i messed up",
            "i'm responsible", "i failed", "because of me"
        ],
        "other_blame": [
            "they ruined", "because of them", "their fault",
            "they should have", "everyone else", "no one helps"
        ],
        "circumstance_attribution": [
            "the situation", "the way things are", "how it is",
            "the world", "life", "circumstances"
        ]
    }

    # Absolutism markers (black & white thinking)
    ABSOLUTISM_MARKERS = [
        "always", "never", "everyone", "no one",
        "everything", "nothing", "all", "none",
        "completely", "totally", "absolutely"
    ]

    # Control markers
    CONTROL_MARKERS = {
        "high_control": [
            "i can", "i will", "i choose", "in my control",
            "up to me", "i decide"
        ],
        "low_control": [
            "can't", "helpless", "powerless", "no choice",
            "stuck", "trapped", "forced"
        ]
    }

    # Time orientation
    TIME_MARKERS = {
        "past_focused": [
            "used to", "before", "back when", "remember when",
            "the old days", "used to be"
        ],
        "future_anxious": [
            "what if", "going to", "will happen", "might",
            "worried about", "afraid that"
        ],
        "present_absent": [
            "not here", "elsewhere", "distracted", "mind wandering"
        ]
    }

    def analyze(self, reflection_text: str) -> List[Dict[str, Any]]:
        """
        Analyze cognitive biases in a reflection.

        Returns:
            List of detected bias insights:
            [
                {
                    "dimension": str,  # e.g. "attribution", "control"
                    "direction": str,  # e.g. "self-blame", "external"
                    "confidence": float,  # 0.0 to 1.0
                    "notes": str  # Human-readable explanation
                }
            ]
        """
        insights = []
        lower_text = reflection_text.lower()

        # Analyze attribution
        attribution_insight = self._analyze_attribution(lower_text)
        if attribution_insight:
            insights.append(attribution_insight)

        # Analyze absolutism
        absolutism_insight = self._analyze_absolutism(reflection_text)
        if absolutism_insight:
            insights.append(absolutism_insight)

        # Analyze control
        control_insight = self._analyze_control(lower_text)
        if control_insight:
            insights.append(control_insight)

        # Analyze time orientation
        time_insight = self._analyze_time_orientation(lower_text)
        if time_insight:
            insights.append(time_insight)

        return insights

    def _analyze_attribution(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze attribution patterns (who gets blame/credit)."""
        scores = {}
        for direction, markers in self.ATTRIBUTION_MARKERS.items():
            count = sum(1 for m in markers if m in text)
            if count > 0:
                scores[direction] = count

        if not scores:
            return None

        dominant = max(scores.items(), key=lambda x: x[1])
        direction, count = dominant

        return {
            "dimension": "attribution",
            "direction": direction,
            "confidence": min(1.0, count / 3),
            "notes": f"Tends to attribute responsibility to {direction.replace('_', ' ')}"
        }

    def _analyze_absolutism(self, text: str) -> Optional[Dict[str, Any]]:
        """Detect all-or-nothing thinking."""
        count = sum(1 for marker in self.ABSOLUTISM_MARKERS if marker in text.lower())

        if count == 0:
            return None

        # High absolutism = lots of absolute words
        if count >= 3:
            severity = "high"
            confidence = min(1.0, count / 5)
        else:
            severity = "moderate"
            confidence = count / 3

        return {
            "dimension": "absolutism",
            "direction": severity,
            "confidence": confidence,
            "notes": f"Uses {count} absolute terms (always/never/everyone) - may indicate black & white thinking"
        }

    def _analyze_control(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze perceived control (internal vs external locus)."""
        high_control = sum(1 for m in self.CONTROL_MARKERS["high_control"] if m in text)
        low_control = sum(1 for m in self.CONTROL_MARKERS["low_control"] if m in text)

        if high_control == 0 and low_control == 0:
            return None

        if high_control > low_control:
            direction = "internal_locus"
            confidence = min(1.0, high_control / 3)
            notes = "Emphasizes personal agency and control"
        else:
            direction = "external_locus"
            confidence = min(1.0, low_control / 3)
            notes = "Expresses low sense of control or agency"

        return {
            "dimension": "control",
            "direction": direction,
            "confidence": confidence,
            "notes": notes
        }

    def _analyze_time_orientation(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze time orientation (past/future/present)."""
        scores = {}
        for orientation, markers in self.TIME_MARKERS.items():
            count = sum(1 for m in markers if m in text)
            if count > 0:
                scores[orientation] = count

        if not scores:
            return None

        dominant = max(scores.items(), key=lambda x: x[1])
        orientation, count = dominant

        return {
            "dimension": "time_orientation",
            "direction": orientation,
            "confidence": min(1.0, count / 3),
            "notes": f"Reflection oriented toward {orientation.replace('_', ' ')}"
        }
