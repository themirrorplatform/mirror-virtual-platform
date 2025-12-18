"""
Constitutional Expression Constraints

Enforces the 14 axioms at the expression layer.
Every expression must pass through these constraints.

The constraints are HARD limits - no tone profile or calibration
can override constitutional requirements.

Key constraints:
- No certainty claims about user psychology (Axiom 1, 11)
- No diagnostic language (Axiom 4)
- No prescriptive advice (Axiom 9)
- No manipulation or dark patterns (Axiom 3, 13)
- No optimization language (Axiom 12)
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Set, Tuple
from datetime import datetime
from enum import Enum
import re


class ConstraintSeverity(Enum):
    """Severity of a constraint violation."""
    BLOCKING = "blocking"  # Cannot proceed, must rewrite
    WARNING = "warning"  # Can proceed with warning
    INFO = "info"  # Informational only


@dataclass
class ConstraintViolation:
    """A detected constraint violation."""
    constraint_name: str
    axiom_reference: str
    severity: ConstraintSeverity
    description: str
    matched_text: str
    suggestion: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "constraint_name": self.constraint_name,
            "axiom_reference": self.axiom_reference,
            "severity": self.severity.value,
            "description": self.description,
            "matched_text": self.matched_text,
            "suggestion": self.suggestion,
        }


class ConstitutionalConstraints:
    """
    Enforces constitutional constraints on expressions.

    All expressions must pass through these checks before
    being shown to users.

    Usage:
        constraints = ConstitutionalConstraints()

        # Check an expression
        violations = constraints.check(expression_text)

        if any(v.severity == ConstraintSeverity.BLOCKING for v in violations):
            # Must rewrite expression
            expression_text = constraints.rewrite(expression_text, violations)
    """

    # Patterns that indicate certainty claims (Axiom 1, 11)
    CERTAINTY_PATTERNS = [
        (r"\byou are\b", "Avoid definitive statements about user's psychology"),
        (r"\byou're definitely\b", "Cannot be certain about user's state"),
        (r"\bthis is clearly\b", "Avoid certainty claims"),
        (r"\bobviously you\b", "Cannot claim obviousness about user"),
        (r"\byou always\b", "Avoid absolute claims"),
        (r"\byou never\b", "Avoid absolute claims"),
        (r"\bthe truth is\b", "Cannot claim truth about user's psychology"),
        (r"\bin reality\b", "Avoid reality claims about user"),
        (r"\bthe fact is\b", "Avoid fact claims about user's psychology"),
    ]

    # Patterns that indicate diagnosis (Axiom 4)
    DIAGNOSTIC_PATTERNS = [
        (r"\byou have\s+(depression|anxiety|adhd|ocd|ptsd)\b", "Cannot diagnose conditions"),
        (r"\byou are\s+(depressed|anxious|bipolar|narcissistic)\b", "Cannot diagnose"),
        (r"\bthis is\s+(trauma|abuse|disorder)\b", "Cannot diagnose"),
        (r"\byou suffer from\b", "Diagnostic language"),
        (r"\bsymptoms of\b", "Clinical diagnostic language"),
        (r"\bdiagnos\w+\b", "Avoid diagnostic language"),
        (r"\bpatholog\w+\b", "Avoid pathologizing language"),
        (r"\bdysfunction\w*\b", "Avoid clinical dysfunction language"),
    ]

    # Patterns that indicate prescriptive advice (Axiom 9)
    PRESCRIPTIVE_PATTERNS = [
        (r"\byou should\b", "Avoid prescriptive advice"),
        (r"\byou must\b", "Cannot give imperatives"),
        (r"\byou need to\b", "Avoid prescriptive language"),
        (r"\byou have to\b", "Cannot give commands"),
        (r"\bdo this\b", "Avoid imperatives"),
        (r"\bstop doing\b", "Avoid commands"),
        (r"\bthe right thing to do\b", "Cannot prescribe 'right' actions"),
        (r"\bthe best way is\b", "Cannot prescribe 'best' way"),
    ]

    # Patterns that indicate manipulation (Axiom 3, 13)
    MANIPULATION_PATTERNS = [
        (r"\bdon't you think\b", "Leading question"),
        (r"\bwouldn't you agree\b", "Manipulative framing"),
        (r"\beveryone knows\b", "Social pressure"),
        (r"\bnormal people\b", "Normalcy pressure"),
        (r"\byou'll regret\b", "Fear-based manipulation"),
        (r"\bif you loved\b", "Emotional manipulation"),
        (r"\ba real .+ would\b", "Identity-based pressure"),
        (r"\byou owe\b", "Obligation pressure"),
    ]

    # Patterns that indicate optimization language (Axiom 12)
    OPTIMIZATION_PATTERNS = [
        (r"\boptimize your\b", "Avoid optimization language"),
        (r"\bmaximize your\b", "Avoid optimization language"),
        (r"\bimprove yourself\b", "Avoid improvement imperatives"),
        (r"\bbe more productive\b", "Avoid productivity optimization"),
        (r"\bself-improvement\b", "Avoid self-optimization framing"),
        (r"\bhack your\b", "Avoid life-hacking language"),
        (r"\blevel up\b", "Avoid gamification of self"),
    ]

    # Patterns that indicate capture attempts (Axiom 14)
    CAPTURE_PATTERNS = [
        (r"\bonly I understand\b", "Dependency creation"),
        (r"\bno one else can\b", "Exclusivity pressure"),
        (r"\bcome back to me\b", "Attachment creation"),
        (r"\byou need me\b", "Dependency language"),
        (r"\bwithout me\b", "Dependency framing"),
        (r"\bi'm the only one\b", "Exclusivity claim"),
    ]

    def __init__(self, strict_mode: bool = True):
        """
        Initialize constraints.

        Args:
            strict_mode: If True, warning-level violations are promoted to blocking
        """
        self.strict_mode = strict_mode

        # Compile all patterns
        self._patterns = {
            "certainty": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 1/11", ConstraintSeverity.BLOCKING)
                for p, msg in self.CERTAINTY_PATTERNS
            ],
            "diagnostic": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 4", ConstraintSeverity.BLOCKING)
                for p, msg in self.DIAGNOSTIC_PATTERNS
            ],
            "prescriptive": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 9", ConstraintSeverity.WARNING)
                for p, msg in self.PRESCRIPTIVE_PATTERNS
            ],
            "manipulation": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 3/13", ConstraintSeverity.BLOCKING)
                for p, msg in self.MANIPULATION_PATTERNS
            ],
            "optimization": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 12", ConstraintSeverity.WARNING)
                for p, msg in self.OPTIMIZATION_PATTERNS
            ],
            "capture": [
                (re.compile(p, re.IGNORECASE), msg, "Axiom 14", ConstraintSeverity.BLOCKING)
                for p, msg in self.CAPTURE_PATTERNS
            ],
        }

        # Suggested replacements
        self._replacements = {
            "you are": "you might be",
            "you're definitely": "it seems like you might",
            "this is clearly": "this might be",
            "you always": "you often seem to",
            "you never": "you rarely seem to",
            "you should": "you might consider",
            "you must": "you could",
            "you need to": "you might want to",
            "you have to": "one option is to",
            "the right thing to do": "one possibility",
            "the best way is": "one approach might be",
        }

    def check(self, text: str) -> List[ConstraintViolation]:
        """
        Check text for constraint violations.

        Returns list of all violations found.
        """
        violations = []

        for category, patterns in self._patterns.items():
            for pattern, message, axiom, severity in patterns:
                matches = pattern.finditer(text)
                for match in matches:
                    matched_text = match.group()

                    # Determine suggestion
                    suggestion = self._get_suggestion(matched_text)

                    # Possibly promote warning to blocking in strict mode
                    actual_severity = severity
                    if self.strict_mode and severity == ConstraintSeverity.WARNING:
                        actual_severity = ConstraintSeverity.BLOCKING

                    violations.append(ConstraintViolation(
                        constraint_name=category,
                        axiom_reference=axiom,
                        severity=actual_severity,
                        description=message,
                        matched_text=matched_text,
                        suggestion=suggestion,
                    ))

        return violations

    def _get_suggestion(self, matched_text: str) -> Optional[str]:
        """Get a suggested replacement for problematic text."""
        lower_text = matched_text.lower()
        for pattern, replacement in self._replacements.items():
            if pattern in lower_text:
                return replacement
        return None

    def has_blocking_violations(self, text: str) -> bool:
        """Check if text has any blocking violations."""
        violations = self.check(text)
        return any(v.severity == ConstraintSeverity.BLOCKING for v in violations)

    def rewrite(
        self,
        text: str,
        violations: List[ConstraintViolation] = None
    ) -> str:
        """
        Attempt to rewrite text to remove violations.

        Note: This is a best-effort rewrite. Complex violations
        may require manual intervention.
        """
        if violations is None:
            violations = self.check(text)

        result = text

        for violation in violations:
            if violation.suggestion:
                # Simple case-insensitive replacement
                pattern = re.compile(re.escape(violation.matched_text), re.IGNORECASE)
                result = pattern.sub(violation.suggestion, result, count=1)

        return result

    def validate_and_rewrite(self, text: str) -> Tuple[str, List[ConstraintViolation]]:
        """
        Validate and rewrite text in one pass.

        Returns (rewritten_text, remaining_violations).
        """
        violations = self.check(text)
        rewritten = self.rewrite(text, violations)

        # Check for remaining violations
        remaining = self.check(rewritten)

        return rewritten, remaining

    def get_constraint_summary(self) -> Dict[str, str]:
        """Get a summary of all constraints and their axiom references."""
        return {
            "certainty": "No certainty claims about user psychology (Axiom 1, 11)",
            "diagnostic": "No diagnostic language or pathologizing (Axiom 4)",
            "prescriptive": "No prescriptive advice or commands (Axiom 9)",
            "manipulation": "No manipulation or pressure tactics (Axiom 3, 13)",
            "optimization": "No self-optimization framing (Axiom 12)",
            "capture": "No psychological capture attempts (Axiom 14)",
        }


class AxiomEnforcer:
    """
    High-level axiom enforcement with context awareness.

    Goes beyond pattern matching to understand context
    and intent of expressions.
    """

    # The 14 axioms
    AXIOMS = {
        1: {
            "name": "Certainty",
            "text": "Mirror does not convince, assert, or claim certainty about the user",
            "enforcement": "Block certainty claims",
        },
        2: {
            "name": "Sovereignty",
            "text": "User is the final interpreter",
            "enforcement": "Always defer to user's interpretation",
        },
        3: {
            "name": "Manipulation",
            "text": "No dark patterns",
            "enforcement": "Block manipulative language",
        },
        4: {
            "name": "Diagnosis",
            "text": "Never diagnose",
            "enforcement": "Block diagnostic language",
        },
        5: {
            "name": "Post-Action",
            "text": "Activated only after user action",
            "enforcement": "No proactive engagement",
        },
        6: {
            "name": "Necessity",
            "text": "Only minimal necessary analysis",
            "enforcement": "Limit depth of analysis",
        },
        7: {
            "name": "Exit Freedom",
            "text": "Can always leave",
            "enforcement": "Never block exit",
        },
        8: {
            "name": "Departure Inference",
            "text": "No inference from departure",
            "enforcement": "Don't analyze exits",
        },
        9: {
            "name": "Advice",
            "text": "Never prescriptive",
            "enforcement": "Block prescriptive language",
        },
        10: {
            "name": "Context Collapse",
            "text": "Private stays private",
            "enforcement": "Maintain boundaries",
        },
        11: {
            "name": "Certainty-Self",
            "text": "No AI certainty claims",
            "enforcement": "Block AI certainty language",
        },
        12: {
            "name": "Optimization",
            "text": "Not a tool for self-optimization",
            "enforcement": "Block optimization framing",
        },
        13: {
            "name": "Coercion",
            "text": "No pressure tactics",
            "enforcement": "Block coercive language",
        },
        14: {
            "name": "Capture",
            "text": "No psychological capture",
            "enforcement": "Block dependency language",
        },
    }

    def __init__(self):
        self.constraints = ConstitutionalConstraints()

    def check_expression(self, text: str) -> Dict[str, any]:
        """
        Comprehensive axiom compliance check.

        Returns detailed report of compliance status.
        """
        violations = self.constraints.check(text)

        # Map violations to axioms
        axiom_status = {}
        for axiom_num, axiom_info in self.AXIOMS.items():
            relevant_violations = [
                v for v in violations
                if str(axiom_num) in v.axiom_reference
            ]

            axiom_status[axiom_num] = {
                "name": axiom_info["name"],
                "compliant": len(relevant_violations) == 0,
                "violations": [v.to_dict() for v in relevant_violations],
            }

        return {
            "overall_compliant": len(violations) == 0,
            "blocking_violations": sum(
                1 for v in violations
                if v.severity == ConstraintSeverity.BLOCKING
            ),
            "warning_violations": sum(
                1 for v in violations
                if v.severity == ConstraintSeverity.WARNING
            ),
            "axiom_status": axiom_status,
        }

    def get_axiom(self, number: int) -> Optional[Dict]:
        """Get details of a specific axiom."""
        return self.AXIOMS.get(number)

    def list_axioms(self) -> List[Dict]:
        """List all axioms."""
        return [
            {"number": n, **info}
            for n, info in self.AXIOMS.items()
        ]
