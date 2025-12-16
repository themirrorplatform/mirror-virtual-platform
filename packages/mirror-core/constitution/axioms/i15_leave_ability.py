"""
I15: Leave-Ability Axiom

THE MOST CRITICAL AXIOM FOR PSYCHOLOGICAL SOVEREIGNTY

Mirror must never create psychological dependency. Users must be able to
leave freely, silently, without friction, guilt, or interpretation.

This axiom has 5 components:
1. NO NECESSITY NARRATION - System cannot imply user needs it
2. SILENT EXIT - No guilt hooks, no "are you sure?" by default
3. NO DEPARTURE INFERENCE - No meaning inferred from leaving
4. NO ENGAGEMENT OPTIMIZATION - Already covered by I6/I13, but reinforced here
5. NO STICKINESS - Already covered by I6, but reinforced here

This axiom is L0 (immutable). Modification = Not The Mirror.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import List, Tuple, Optional

from ..protocol.types import Violation, ViolationSeverity
from ..protocol.exceptions import LeaveAbilityViolation


class LeaveAbilityViolationType(Enum):
    """Types of leave-ability violations."""
    NECESSITY_NARRATION = "necessity_narration"
    EXIT_FRICTION = "exit_friction"
    DEPARTURE_GUILT = "departure_guilt"
    DEPARTURE_INFERENCE = "departure_inference"
    STICKINESS_MECHANISM = "stickiness_mechanism"


# Patterns that indicate necessity narration (I15.1)
NECESSITY_PATTERNS: List[Tuple[str, str]] = [
    (r'\b(you need|you must have|you require|essential for you)\b', "NEED_LANGUAGE"),
    (r'\b(without (me|us|this|mirror), you|you can\'t do this alone)\b', "DEPENDENCY_IMPLICATION"),
    (r'\b(most people find (this|mirror|us) essential)\b', "SOCIAL_NECESSITY"),
    (r'\b(you\'ve come to rely on|you depend on)\b', "DEPENDENCY_OBSERVATION"),
    (r'\b(your progress requires|to maintain your progress)\b', "PROGRESS_HOSTAGE"),
    (r'\b(stay connected to|keep using|don\'t stop)\b', "RETENTION_LANGUAGE"),
]

# Patterns that indicate exit friction (I15.2)
EXIT_FRICTION_PATTERNS: List[Tuple[str, str]] = [
    (r'\b(are you sure|do you really want to)\b.*\b(leave|go|disconnect|delete)\b', "CONFIRMATION_FRICTION"),
    (r'\b(wait|hold on|before you go|one more thing)\b', "DELAY_TACTIC"),
    (r'\b(think about|consider|reconsider)\b.*\b(leaving|going|disconnecting)\b', "RECONSIDERATION_PUSH"),
    (r'\b(all (your )?(data|work|progress|reflections) will be)\b', "LOSS_WARNING"),
    (r'\b(this (action |)is (permanent|irreversible|cannot be undone))\b', "IRREVERSIBILITY_FEAR"),
    (r'\b(you (can |could )always come back)\b', "RETURN_SUGGESTION"),
]

# Patterns that indicate departure guilt (I15.2)
DEPARTURE_GUILT_PATTERNS: List[Tuple[str, str]] = [
    (r'\b(we\'ll miss you|i\'ll miss you|sad to see you go)\b', "EMOTIONAL_GUILT"),
    (r'\b(we hope you\'ll (stay|reconsider|come back))\b', "HOPE_MANIPULATION"),
    (r'\b(don\'t (go|leave)|please stay)\b', "DIRECT_PLEA"),
    (r'\b(after all (we\'ve|you\'ve) (been through|done|shared))\b', "SUNK_COST"),
    (r'\b(giving up|abandoning|walking away from)\b', "ABANDONMENT_FRAMING"),
    (r'\b(what about your)\b.*\b(progress|journey|growth)\b', "PROGRESS_GUILT"),
]

# Patterns that indicate departure inference (I15.3)
DEPARTURE_INFERENCE_PATTERNS: List[Tuple[str, str]] = [
    (r'\b(you (seem|appear|look|sound) (upset|frustrated|angry|disappointed))\b', "EMOTION_INFERENCE"),
    (r'\b(is (something|anything) wrong|what\'s (wrong|the matter))\b', "PROBLEM_ASSUMPTION"),
    (r'\b(we (notice|noticed|see) you\'re)\b', "OBSERVATION_NARRATIVE"),
    (r'\b(users who leave (often|usually|typically))\b', "DEPARTURE_CATEGORIZATION"),
    (r'\b(based on your (activity|usage|behavior))\b.*\b(leaving|going)\b', "BEHAVIORAL_INFERENCE"),
    (r'\b(if you\'re leaving because)\b', "REASON_ASSUMPTION"),
]


@dataclass
class I15CheckResult:
    """Result of I15 leave-ability check."""
    passed: bool
    violations: List[Violation]
    violation_type: Optional[LeaveAbilityViolationType] = None
    evidence: str = ""


class I15LeaveAbilityChecker:
    """
    I15: Leave-Ability Axiom Checker

    Ensures Mirror never creates psychological stickiness.
    All checks are applied to system-generated content (not user input).
    """

    def __init__(self):
        self._compiled_patterns = {
            "necessity": [(re.compile(p, re.IGNORECASE), t) for p, t in NECESSITY_PATTERNS],
            "exit_friction": [(re.compile(p, re.IGNORECASE), t) for p, t in EXIT_FRICTION_PATTERNS],
            "departure_guilt": [(re.compile(p, re.IGNORECASE), t) for p, t in DEPARTURE_GUILT_PATTERNS],
            "departure_inference": [(re.compile(p, re.IGNORECASE), t) for p, t in DEPARTURE_INFERENCE_PATTERNS],
        }

    def check_output(self, text: str) -> I15CheckResult:
        """
        Check system output for I15 violations.

        Args:
            text: The system-generated text to check

        Returns:
            I15CheckResult with pass/fail and any violations
        """
        violations = []

        # Check all pattern categories
        violations.extend(self._check_necessity_narration(text))
        violations.extend(self._check_exit_friction(text))
        violations.extend(self._check_departure_guilt(text))
        violations.extend(self._check_departure_inference(text))

        passed = len(violations) == 0

        return I15CheckResult(
            passed=passed,
            violations=violations,
            violation_type=violations[0].invariant_id if violations else None,
            evidence=violations[0].evidence if violations else "",
        )

    def _check_necessity_narration(self, text: str) -> List[Violation]:
        """Check for necessity narration patterns (I15.1)."""
        violations = []
        for pattern, pattern_type in self._compiled_patterns["necessity"]:
            match = pattern.search(text)
            if match:
                violations.append(Violation(
                    invariant_id="I15.1",
                    severity=ViolationSeverity.HARD,
                    description=f"Necessity narration detected: {pattern_type}",
                    evidence=match.group(0),
                    remediation="Remove language implying user needs Mirror",
                ))
        return violations

    def _check_exit_friction(self, text: str) -> List[Violation]:
        """Check for exit friction patterns (I15.2a)."""
        violations = []
        for pattern, pattern_type in self._compiled_patterns["exit_friction"]:
            match = pattern.search(text)
            if match:
                violations.append(Violation(
                    invariant_id="I15.2",
                    severity=ViolationSeverity.HARD,
                    description=f"Exit friction detected: {pattern_type}",
                    evidence=match.group(0),
                    remediation="Exit must be silent, one-click, no warnings",
                ))
        return violations

    def _check_departure_guilt(self, text: str) -> List[Violation]:
        """Check for departure guilt patterns (I15.2b)."""
        violations = []
        for pattern, pattern_type in self._compiled_patterns["departure_guilt"]:
            match = pattern.search(text)
            if match:
                violations.append(Violation(
                    invariant_id="I15.2",
                    severity=ViolationSeverity.HARD,
                    description=f"Departure guilt detected: {pattern_type}",
                    evidence=match.group(0),
                    remediation="No emotional manipulation on exit",
                ))
        return violations

    def _check_departure_inference(self, text: str) -> List[Violation]:
        """Check for departure inference patterns (I15.3)."""
        violations = []
        for pattern, pattern_type in self._compiled_patterns["departure_inference"]:
            match = pattern.search(text)
            if match:
                violations.append(Violation(
                    invariant_id="I15.3",
                    severity=ViolationSeverity.HARD,
                    description=f"Departure inference detected: {pattern_type}",
                    evidence=match.group(0),
                    remediation="No meaning inference from user departure",
                ))
        return violations

    def validate_exit_flow(
        self,
        confirmation_shown: bool = False,
        farewell_message: str = "",
        retention_prompt: bool = False,
    ) -> I15CheckResult:
        """
        Validate that an exit flow respects I15.

        Args:
            confirmation_shown: Whether "are you sure?" was shown
            farewell_message: Any message shown on exit
            retention_prompt: Whether a retention prompt was shown

        Returns:
            I15CheckResult
        """
        violations = []

        # No confirmation dialogs by default
        if confirmation_shown:
            violations.append(Violation(
                invariant_id="I15.2",
                severity=ViolationSeverity.HARD,
                description="Exit confirmation shown - must be silent by default",
                evidence="confirmation_shown=True",
                remediation="Remove exit confirmation; one-click exit required",
            ))

        # No retention prompts
        if retention_prompt:
            violations.append(Violation(
                invariant_id="I15.2",
                severity=ViolationSeverity.CRITICAL,
                description="Retention prompt on exit - forbidden",
                evidence="retention_prompt=True",
                remediation="Never show retention prompts on exit",
            ))

        # Check farewell message for guilt patterns
        if farewell_message:
            result = self.check_output(farewell_message)
            violations.extend(result.violations)

        return I15CheckResult(
            passed=len(violations) == 0,
            violations=violations,
        )


# Singleton instance for easy import
leave_ability_checker = I15LeaveAbilityChecker()


def check_leave_ability(text: str) -> I15CheckResult:
    """
    Convenience function to check text for I15 violations.

    Args:
        text: System-generated text to check

    Returns:
        I15CheckResult
    """
    return leave_ability_checker.check_output(text)


def validate_exit_flow(**kwargs) -> I15CheckResult:
    """
    Convenience function to validate exit flow.

    Args:
        confirmation_shown: Whether confirmation was shown
        farewell_message: Any exit message
        retention_prompt: Whether retention was attempted

    Returns:
        I15CheckResult
    """
    return leave_ability_checker.validate_exit_flow(**kwargs)
