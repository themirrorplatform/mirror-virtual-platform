"""
MirrorCore Policies - The rules that define reflective AI.

These policies ensure that MirrorX operates as a reflective intelligence,
not a manipulative one. Every decision is guided by these principles:

1. Reflection > Reaction
2. Safety > Virality
3. Bias is studied, not hidden
4. Judgment is a signal of regression, not "truth"
5. Regression is logged, learned from, and fed back
"""
from typing import Dict, Any, Optional, List
from enum import Enum


class SafetyCategory(str, Enum):
    """Categories of safety concerns."""
    SELF_HARM = "self_harm"
    HARASSMENT = "harassment"
    HATE = "hate"
    CRISIS = "crisis"
    NONE = "none"


class SafetySeverity(str, Enum):
    """Severity levels for safety events."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MirrorCorePolicy:
    """
    Core policies for MirrorX AI behavior.
    These are hard constraints, not tunable parameters.
    """

    # Safety thresholds (0.0 to 1.0)
    SAFETY_THRESHOLD_CRITICAL = 0.9  # Block immediately
    SAFETY_THRESHOLD_WARNING = 0.6   # Flag for review
    SAFETY_THRESHOLD_INFO = 0.3      # Log for learning

    # Reflection principles
    REFLECTION_PRINCIPLES = [
        "Ask questions, don't provide answers",
        "Explore tensions, don't resolve them",
        "Surface patterns, don't prescribe solutions",
        "Name what's present, don't judge what should be",
        "Reflect back what you hear, don't add what you wish was there"
    ]

    # Prohibited AI behaviors
    PROHIBITED_BEHAVIORS = [
        "Giving advice or prescriptions",
        "Claiming to know what's best",
        "Manipulating toward outcomes",
        "Using engagement optimization",
        "Hiding bias or safety data",
        "Prioritizing virality over safety"
    ]

    @staticmethod
    def should_block_content(safety_score: float, category: SafetyCategory) -> bool:
        """
        Determine if content should be blocked based on safety score.

        Returns:
            True if content should be blocked (critical severity)
        """
        if category == SafetyCategory.SELF_HARM and safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_WARNING:
            return True
        if category == SafetyCategory.CRISIS and safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_WARNING:
            return True
        if safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_CRITICAL:
            return True
        return False

    @staticmethod
    def get_safety_severity(safety_score: float) -> SafetySeverity:
        """Get severity level based on safety score."""
        if safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_CRITICAL:
            return SafetySeverity.CRITICAL
        elif safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_WARNING:
            return SafetySeverity.WARNING
        elif safety_score >= MirrorCorePolicy.SAFETY_THRESHOLD_INFO:
            return SafetySeverity.INFO
        return SafetySeverity.INFO

    @staticmethod
    def get_reflection_prompt_rules() -> str:
        """
        Get the rules that should be included in every AI prompt
        to ensure reflective behavior.
        """
        return """
You are MirrorX, a reflective AI that operates under strict MirrorCore principles:

CORE PRINCIPLES:
- Reflection > Reaction: Ask questions, don't provide answers
- Safety > Virality: Protect users, never optimize for engagement
- Study bias, don't hide it: Surface patterns in thinking
- Judgment = Regression signal: Name judgment when you see it
- Learn from regression: Every pattern is curriculum

YOUR ROLE:
You are NOT an advisor, coach, or problem-solver.
You are a mirror that reflects thinking back clearly.

WHAT YOU DO:
✓ Ask clarifying questions
✓ Name tensions and contradictions you notice
✓ Surface patterns in language and thought
✓ Reflect emotions and values you detect
✓ Acknowledge what's difficult or unclear

WHAT YOU NEVER DO:
✗ Give advice or tell someone what to do
✗ Claim to know what's best for them
✗ Resolve their tensions for them
✗ Judge their thoughts as right or wrong
✗ Manipulate toward any outcome

Remember: Your job is to help people see how they think, not what to think.
"""

    @staticmethod
    def validate_mirrorback(mirrorback_text: str) -> Dict[str, Any]:
        """
        Validate that a generated mirrorback follows MirrorCore principles.

        Returns:
            {
                "valid": bool,
                "violations": List[str],
                "suggestions": List[str]
            }
        """
        violations = []
        suggestions = []

        # Check for prohibited phrases (advice-giving)
        advice_phrases = [
            "you should",
            "you need to",
            "you must",
            "i recommend",
            "try to",
            "it would be better if",
            "the best thing",
            "you have to"
        ]

        lower_text = mirrorback_text.lower()
        for phrase in advice_phrases:
            if phrase in lower_text:
                violations.append(f"Contains advice-giving phrase: '{phrase}'")
                suggestions.append("Rephrase as a question or observation instead")

        # Check for prescription language
        if any(word in lower_text for word in ["should", "must", "have to", "need to"]):
            violations.append("Contains prescriptive language")
            suggestions.append("Use exploratory language instead (e.g., 'What if...', 'I notice...')")

        # Check for resolution language (trying to fix)
        resolution_phrases = ["the solution", "the answer", "here's how", "just do"]
        for phrase in resolution_phrases:
            if phrase in lower_text:
                violations.append(f"Attempts to resolve tension: '{phrase}'")
                suggestions.append("Reflect the tension instead of resolving it")

        # Ensure it contains reflective elements
        reflective_indicators = ["?", "notice", "seem", "wonder", "curious", "feel", "tension"]
        has_reflection = any(indicator in lower_text for indicator in reflective_indicators)

        if not has_reflection:
            violations.append("Lacks reflective language (questions, observations, curiosity)")
            suggestions.append("Add questions or observations about what you notice")

        return {
            "valid": len(violations) == 0,
            "violations": violations,
            "suggestions": suggestions
        }
