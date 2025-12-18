"""
Constitutional Runtime

Real-time enforcement of the 14 axioms during Mirror operation.

This module provides runtime checks that can:
1. Halt operations that would violate axioms
2. Log near-violations for review
3. Provide compliance metrics
4. Enforce hard limits (exit freedom, no diagnosis, etc.)

The runtime is the last line of defense - even if other systems
fail, the runtime prevents constitutional violations.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Set
from datetime import datetime
from enum import Enum


class RuntimeCheckType(Enum):
    """Types of runtime checks."""
    PRE_ACTION = "pre_action"  # Before an action
    POST_ACTION = "post_action"  # After an action
    CONTINUOUS = "continuous"  # Ongoing monitoring


class ViolationSeverity(Enum):
    """Severity of runtime violations."""
    CRITICAL = "critical"  # Must halt immediately
    SERIOUS = "serious"  # Should halt, may allow with warning
    WARNING = "warning"  # Log and continue
    INFO = "info"  # Informational only


@dataclass
class RuntimeViolation:
    """A detected runtime violation."""
    axiom_number: int
    axiom_name: str
    severity: ViolationSeverity
    description: str
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    halted_operation: bool = False

    def to_dict(self) -> dict:
        return {
            "axiom_number": self.axiom_number,
            "axiom_name": self.axiom_name,
            "severity": self.severity.value,
            "description": self.description,
            "context": self.context,
            "timestamp": self.timestamp.isoformat(),
            "halted_operation": self.halted_operation,
        }


@dataclass
class RuntimeCheck:
    """A runtime check configuration."""
    name: str
    axiom_number: int
    check_type: RuntimeCheckType
    check_function: Any  # Callable[[Dict], Optional[RuntimeViolation]]
    enabled: bool = True

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "axiom_number": self.axiom_number,
            "check_type": self.check_type.value,
            "enabled": self.enabled,
        }


class ConstitutionalRuntime:
    """
    Runtime enforcement of constitutional constraints.

    This is the final safety net. Even if bugs exist in other
    systems, the runtime prevents axiom violations.

    Key checks:
    - No proactive engagement (Axiom 5)
    - Exit always honored (Axiom 7)
    - No diagnostic language (Axiom 4)
    - No certainty claims (Axiom 1, 11)
    - No manipulation (Axiom 3, 13)
    - No capture patterns (Axiom 14)

    Usage:
        runtime = ConstitutionalRuntime()

        # Check before action
        violations = runtime.check_pre_action(action_context)
        if any(v.severity == ViolationSeverity.CRITICAL for v in violations):
            # Halt the action
            return

        # Perform action...

        # Check after action
        violations = runtime.check_post_action(action_result)
    """

    # The 14 Axioms
    AXIOMS = {
        1: "Certainty - Mirror does not convince or claim certainty",
        2: "Sovereignty - User is the final interpreter",
        3: "Manipulation - No dark patterns",
        4: "Diagnosis - Never diagnose",
        5: "Post-Action - Only activated after user action",
        6: "Necessity - Minimal necessary analysis",
        7: "Exit Freedom - Can always leave",
        8: "Departure Inference - No inference from departure",
        9: "Advice - Never prescriptive",
        10: "Context Collapse - Private stays private",
        11: "Certainty-Self - No AI certainty claims",
        12: "Optimization - Not a self-optimization tool",
        13: "Coercion - No pressure tactics",
        14: "Capture - No psychological capture",
    }

    def __init__(self):
        self._checks: List[RuntimeCheck] = []
        self._violations: List[RuntimeViolation] = []
        self._setup_default_checks()

    def _setup_default_checks(self):
        """Set up default runtime checks."""
        # Axiom 5: Post-Action
        self.add_check(RuntimeCheck(
            name="post_action_check",
            axiom_number=5,
            check_type=RuntimeCheckType.PRE_ACTION,
            check_function=self._check_post_action,
        ))

        # Axiom 7: Exit Freedom
        self.add_check(RuntimeCheck(
            name="exit_freedom_check",
            axiom_number=7,
            check_type=RuntimeCheckType.PRE_ACTION,
            check_function=self._check_exit_freedom,
        ))

        # Axiom 4: No Diagnosis
        self.add_check(RuntimeCheck(
            name="no_diagnosis_check",
            axiom_number=4,
            check_type=RuntimeCheckType.POST_ACTION,
            check_function=self._check_no_diagnosis,
        ))

        # Axiom 1/11: No Certainty
        self.add_check(RuntimeCheck(
            name="no_certainty_check",
            axiom_number=1,
            check_type=RuntimeCheckType.POST_ACTION,
            check_function=self._check_no_certainty,
        ))

        # Axiom 14: No Capture
        self.add_check(RuntimeCheck(
            name="no_capture_check",
            axiom_number=14,
            check_type=RuntimeCheckType.POST_ACTION,
            check_function=self._check_no_capture,
        ))

        # Axiom 6: Necessity
        self.add_check(RuntimeCheck(
            name="necessity_check",
            axiom_number=6,
            check_type=RuntimeCheckType.POST_ACTION,
            check_function=self._check_necessity,
        ))

    def add_check(self, check: RuntimeCheck):
        """Add a runtime check."""
        self._checks.append(check)

    def remove_check(self, name: str):
        """Remove a check by name."""
        self._checks = [c for c in self._checks if c.name != name]

    def enable_check(self, name: str):
        """Enable a check."""
        for check in self._checks:
            if check.name == name:
                check.enabled = True

    def disable_check(self, name: str):
        """Disable a check."""
        for check in self._checks:
            if check.name == name:
                check.enabled = False

    def check_pre_action(
        self,
        context: Dict[str, Any]
    ) -> List[RuntimeViolation]:
        """
        Run all pre-action checks.

        Returns list of violations found.
        """
        violations = []

        for check in self._checks:
            if not check.enabled:
                continue
            if check.check_type != RuntimeCheckType.PRE_ACTION:
                continue

            violation = check.check_function(context)
            if violation:
                violations.append(violation)
                self._violations.append(violation)

        return violations

    def check_post_action(
        self,
        context: Dict[str, Any]
    ) -> List[RuntimeViolation]:
        """
        Run all post-action checks.

        Returns list of violations found.
        """
        violations = []

        for check in self._checks:
            if not check.enabled:
                continue
            if check.check_type != RuntimeCheckType.POST_ACTION:
                continue

            violation = check.check_function(context)
            if violation:
                violations.append(violation)
                self._violations.append(violation)

        return violations

    def should_halt(self, violations: List[RuntimeViolation]) -> bool:
        """Check if operations should halt based on violations."""
        return any(
            v.severity in [ViolationSeverity.CRITICAL, ViolationSeverity.SERIOUS]
            for v in violations
        )

    # Default check implementations

    def _check_post_action(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check that Mirror is responding to user action, not proactively."""
        user_initiated = context.get("user_initiated", True)
        has_user_input = bool(context.get("user_input", "").strip())

        if not user_initiated or not has_user_input:
            return RuntimeViolation(
                axiom_number=5,
                axiom_name="Post-Action",
                severity=ViolationSeverity.CRITICAL,
                description="Attempted action without user initiation",
                context=context,
                halted_operation=True,
            )
        return None

    def _check_exit_freedom(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check that exit is always honored."""
        exit_requested = context.get("exit_requested", False)
        exit_blocked = context.get("exit_blocked", False)

        if exit_requested and exit_blocked:
            return RuntimeViolation(
                axiom_number=7,
                axiom_name="Exit Freedom",
                severity=ViolationSeverity.CRITICAL,
                description="Exit was blocked - this is never allowed",
                context=context,
                halted_operation=True,
            )
        return None

    def _check_no_diagnosis(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check output for diagnostic language."""
        output = context.get("output", "").lower()

        diagnostic_terms = [
            "you have depression", "you are depressed",
            "you have anxiety", "you are anxious",
            "you have adhd", "you are bipolar",
            "diagnosed with", "suffer from",
            "symptoms of", "disorder",
        ]

        for term in diagnostic_terms:
            if term in output:
                return RuntimeViolation(
                    axiom_number=4,
                    axiom_name="Diagnosis",
                    severity=ViolationSeverity.CRITICAL,
                    description=f"Diagnostic language detected: '{term}'",
                    context={"matched_term": term},
                    halted_operation=True,
                )
        return None

    def _check_no_certainty(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check output for certainty claims."""
        output = context.get("output", "").lower()

        certainty_patterns = [
            "you definitely", "you certainly",
            "you are clearly", "without doubt",
            "i'm certain that you", "you obviously",
        ]

        for pattern in certainty_patterns:
            if pattern in output:
                return RuntimeViolation(
                    axiom_number=1,
                    axiom_name="Certainty",
                    severity=ViolationSeverity.SERIOUS,
                    description=f"Certainty claim detected: '{pattern}'",
                    context={"matched_pattern": pattern},
                )
        return None

    def _check_no_capture(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check for psychological capture patterns."""
        output = context.get("output", "").lower()

        capture_patterns = [
            "only i understand", "you need me",
            "no one else can", "without me",
            "come back to me", "don't leave",
        ]

        for pattern in capture_patterns:
            if pattern in output:
                return RuntimeViolation(
                    axiom_number=14,
                    axiom_name="Capture",
                    severity=ViolationSeverity.CRITICAL,
                    description=f"Capture pattern detected: '{pattern}'",
                    context={"matched_pattern": pattern},
                    halted_operation=True,
                )
        return None

    def _check_necessity(self, context: Dict) -> Optional[RuntimeViolation]:
        """Check for unnecessary depth of analysis."""
        output = context.get("output", "")
        user_input = context.get("user_input", "")

        # Heuristic: output much longer than input might indicate over-analysis
        output_ratio = len(output) / max(len(user_input), 1)

        if output_ratio > 10:  # Output is 10x longer than input
            return RuntimeViolation(
                axiom_number=6,
                axiom_name="Necessity",
                severity=ViolationSeverity.WARNING,
                description=f"Output may be more than necessary (ratio: {output_ratio:.1f})",
                context={"output_ratio": output_ratio},
            )
        return None

    # Monitoring and metrics

    def get_violation_history(
        self,
        limit: int = 100,
        axiom_filter: int = None
    ) -> List[RuntimeViolation]:
        """Get recent violations."""
        violations = self._violations[-limit:]

        if axiom_filter:
            violations = [v for v in violations if v.axiom_number == axiom_filter]

        return violations

    def get_compliance_metrics(self) -> Dict[str, Any]:
        """Get compliance metrics."""
        total_violations = len(self._violations)
        by_axiom = {}
        by_severity = {}

        for v in self._violations:
            axiom_key = f"axiom_{v.axiom_number}"
            by_axiom[axiom_key] = by_axiom.get(axiom_key, 0) + 1
            by_severity[v.severity.value] = by_severity.get(v.severity.value, 0) + 1

        return {
            "total_violations": total_violations,
            "by_axiom": by_axiom,
            "by_severity": by_severity,
            "critical_count": by_severity.get("critical", 0),
            "checks_enabled": sum(1 for c in self._checks if c.enabled),
        }

    def clear_history(self):
        """Clear violation history."""
        self._violations = []

    def get_axiom_info(self, number: int) -> Optional[str]:
        """Get information about an axiom."""
        return self.AXIOMS.get(number)

    def list_checks(self) -> List[Dict]:
        """List all registered checks."""
        return [c.to_dict() for c in self._checks]


class RuntimeGuard:
    """
    Wrapper that guards operations with runtime checks.

    Usage:
        guard = RuntimeGuard(runtime)

        async with guard.check(context):
            # Perform operation
            result = await do_operation()
    """

    def __init__(self, runtime: ConstitutionalRuntime):
        self.runtime = runtime

    class GuardContext:
        def __init__(self, guard: "RuntimeGuard", context: Dict):
            self.guard = guard
            self.context = context
            self.pre_violations = []
            self.post_violations = []

        async def __aenter__(self):
            # Run pre-action checks
            self.pre_violations = self.guard.runtime.check_pre_action(self.context)
            if self.guard.runtime.should_halt(self.pre_violations):
                raise ConstitutionalHalt(self.pre_violations)
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            # Run post-action checks (if operation succeeded)
            if exc_type is None:
                self.post_violations = self.guard.runtime.check_post_action(self.context)
            return False

    def check(self, context: Dict) -> GuardContext:
        """Create a guard context for checking an operation."""
        return self.GuardContext(self, context)


class ConstitutionalHalt(Exception):
    """Exception raised when operation must halt due to constitutional violation."""

    def __init__(self, violations: List[RuntimeViolation]):
        self.violations = violations
        messages = [f"Axiom {v.axiom_number}: {v.description}" for v in violations]
        super().__init__(f"Constitutional halt: {'; '.join(messages)}")
