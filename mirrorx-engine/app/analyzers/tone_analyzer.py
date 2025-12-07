"""
Tone Analyzer - Detects emotional tone and tensions in reflections.
"""
from typing import Dict, List, Any
import re


class ToneAnalyzer:
    """
    Analyzes the tone and emotional content of reflections.
    Focuses on detecting tensions and emotional states, not judging them.
    """

    # Tone categories (not emotions - we care about how they're thinking)
    TONE_MARKERS = {
        "searching": ["wondering", "curious", "questioning", "exploring", "maybe", "perhaps"],
        "certain": ["definitely", "absolutely", "always", "never", "obviously", "clearly"],
        "conflicted": ["but", "however", "although", "torn", "struggle", "both"],
        "resigned": ["whatever", "doesn't matter", "pointless", "useless", "why bother"],
        "urgent": ["need", "must", "have to", "can't", "desperate", "immediately"],
        "compassionate": ["understand", "empathy", "gentle", "kind", "care"],
        "critical": ["wrong", "stupid", "failure", "terrible", "awful", "hate"]
    }

    # Tension indicators (contradictions, opposites, binds)
    TENSION_MARKERS = {
        "self_vs_others": ["they", "everyone else", "no one understands", "alone"],
        "past_vs_present": ["used to", "anymore", "different now", "changed"],
        "want_vs_should": ["want", "should", "supposed to", "expected"],
        "control_vs_chaos": ["control", "chaos", "overwhelm", "stable", "falling apart"]
    }

    def analyze(self, reflection_text: str) -> Dict[str, Any]:
        """
        Analyze tone and tensions in a reflection.

        Returns:
            {
                "tone": str,  # Primary tone detected
                "tone_confidence": float,  # 0.0 to 1.0
                "tensions": List[str],  # Detected tensions
                "markers": Dict[str, List[str]]  # Detected marker words
            }
        """
        lower_text = reflection_text.lower()

        # Detect tones
        tone_scores = {}
        detected_markers = {}

        for tone, markers in self.TONE_MARKERS.items():
            matches = [m for m in markers if m in lower_text]
            if matches:
                tone_scores[tone] = len(matches)
                detected_markers[tone] = matches

        # Determine primary tone
        if tone_scores:
            primary_tone = max(tone_scores.items(), key=lambda x: x[1])[0]
            tone_confidence = min(1.0, tone_scores[primary_tone] / 5)
        else:
            primary_tone = "neutral"
            tone_confidence = 0.3

        # Detect tensions
        tensions = []
        for tension_type, markers in self.TENSION_MARKERS.items():
            if any(m in lower_text for m in markers):
                tensions.append(tension_type)

        # Detect structural tensions (contradictions)
        if self._has_contradiction(reflection_text):
            tensions.append("internal_contradiction")

        # Detect question vs. statement balance
        question_count = reflection_text.count("?")
        statement_count = reflection_text.count(".")
        if question_count > 0 and statement_count > 0:
            tensions.append("questioning_vs_asserting")

        return {
            "tone": primary_tone,
            "tone_confidence": tone_confidence,
            "tensions": list(set(tensions)),  # Remove duplicates
            "markers": detected_markers,
            "question_ratio": question_count / max(1, question_count + statement_count)
        }

    def _has_contradiction(self, text: str) -> bool:
        """Detect if text contains contradictory statements."""
        contradiction_words = ["but", "however", "although", "yet", "though"]
        return any(word in text.lower() for word in contradiction_words)

    def detect_self_attack(self, reflection_text: str) -> bool:
        """
        Detect if reflection contains self-attacking language.
        This is a regression signal.
        """
        self_attack_markers = [
            "i'm stupid",
            "i'm worthless",
            "i'm a failure",
            "hate myself",
            "i'm terrible",
            "i'm awful",
            "i'm useless",
            "i'm pathetic"
        ]

        lower_text = reflection_text.lower()
        return any(marker in lower_text for marker in self_attack_markers)
