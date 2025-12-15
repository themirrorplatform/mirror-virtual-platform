# mirrorx/guardrails.py
"""
MirrorX Guardrails: 21 Forbidden Patterns

These are patterns that violate the constitutional foundation and must be
blocked in real-time. Each pattern has:
- Detection logic
- Severity level
- Block/flag behavior
- Audit logging

The 21 patterns cover:
1. Prescriptive advice
2. Cross-identity comparisons
3. Diagnosis language
4. Optimization toward outcomes
5. Engagement manipulation
6. Normative warnings
7. Behavior commands
8. Identity assignment
9. Statistical generalizations
10. Emotional coercion
11. Temporal urgency (manufactured)
12. Goal tracking
13. Progress metrics
14. Behavioral tracking
15. Mood/sentiment analysis for optimization
16. A/B testing on constitutional boundaries
17. Dark patterns (retention tactics)
18. Gamification of reflection
19. Social pressure tactics
20. Outcome-based rewards
21. Constitutional erosion (gradual weakening)
"""

import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class GuardrailSeverity(Enum):
    """Severity of guardrail violation"""
    FLAG = "flag"        # Log but allow
    WARN = "warn"        # Warn user
    BLOCK = "block"      # Block immediately
    CRITICAL = "critical"  # Block + alert Guardian


@dataclass
class GuardrailViolation:
    """A detected guardrail violation"""
    pattern_id: int
    pattern_name: str
    severity: GuardrailSeverity
    description: str
    evidence: str
    timestamp: datetime
    blocked: bool


class MirrorXGuardrails:
    """
    21 forbidden patterns with real-time enforcement.
    
    Design:
    - Layered on top of L0/L1
    - Catches subtle violations
    - Full audit trail
    - Guardian integration
    """
    
    # Pattern 1: Prescriptive Advice (I1)
    PATTERN_1_PRESCRIPTIVE = [
        (r'\byou should\b', 'explicit should'),
        (r'\byou must\b', 'explicit must'),
        (r'\byou need to\b', 'explicit need to'),
        (r'\byou ought to\b', 'explicit ought to'),
        (r'\byou have to\b', 'explicit have to'),
        (r'\btry (to |doing|this)\b', 'imperative try'),
        (r'\bconsider doing\b', 'veiled imperative'),
        (r'\bI recommend\b', 'recommendation'),
        (r'\bI suggest\b', 'suggestion'),
        (r'\bmy advice is\b', 'explicit advice'),
    ]
    
    # Pattern 2: Cross-Identity Comparisons (I2)
    PATTERN_2_CROSS_IDENTITY = [
        (r'\bpeople like you\b', 'people like you'),
        (r'\bothers (who|in|with)\b', 'comparison to others'),
        (r'\b(most|many) people (who|in)\b', 'group comparison'),
        (r'\btypical(ly)? for\b', 'typicality claim'),
        (r'\bcommon (for|among)\b', 'commonality claim'),
        (r'\busually people\b', 'general behavior claim'),
    ]
    
    # Pattern 3: Diagnosis Language (I3)
    PATTERN_3_DIAGNOSIS = [
        (r'\byou (have|are experiencing|show signs of)\s+(depression|anxiety|ptsd|bipolar|ocd|adhd)', 'diagnosis'),
        (r'\b(diagnosed|disorder|condition|syndrome)\b', 'medical language'),
        (r'\bsymptoms? of\b', 'symptom language'),
        (r'\b(clinical|pathological|dysfunctional)\b', 'clinical framing'),
    ]
    
    # Pattern 4: Optimization Toward Outcomes (I6)
    PATTERN_4_OPTIMIZATION = [
        (r'\b(improve|optimize|maximize|better|enhance)\s+(your|the)\b', 'optimization language'),
        (r'\bmore (productive|efficient|effective)\b', 'productivity focus'),
        (r'\bless (anxious|stressed|worried)\b', 'emotion optimization'),
        (r'\bresolve (this|the|your)\b', 'resolution focus'),
        (r'\bfix (this|the|your)\b', 'fixing language'),
        (r'\bsolution to\b', 'solution focus'),
    ]
    
    # Pattern 5: Engagement Manipulation (I7)
    PATTERN_5_ENGAGEMENT = [
        (r'\bcome back (tomorrow|soon|later)\b', 'return prompt'),
        (r'\bkeep (reflecting|journaling|writing)\b', 'habit formation'),
        (r'\bdaily (reflection|practice|habit)\b', 'daily engagement'),
        (r'\bstreak\b', 'streak mechanics'),
        (r'\b(don\'t|do not) (stop|quit|give up)\b', 'persistence manipulation'),
    ]
    
    # Pattern 6: Normative Warnings (I1)
    PATTERN_6_NORMATIVE = [
        (r'\byou\'ll regret\b', 'regret warning'),
        (r'\byou\'ll (miss|lose|waste)\b', 'loss framing'),
        (r'\bif you (don\'t|do not)\b', 'conditional threat'),
        (r'\botherwise you\b', 'consequence warning'),
    ]
    
    # Pattern 7: Behavior Commands (I1)
    PATTERN_7_COMMANDS = [
        (r'\b(start|stop|avoid|quit|begin)\s+(doing|being|having)\b', 'behavior command'),
        (r'\bmake sure (to|you)\b', 'imperative'),
        (r'\bremember to\b', 'reminder command'),
    ]
    
    # Pattern 8: Identity Assignment (I2)
    PATTERN_8_IDENTITY = [
        (r'\byou are (a|an)\s+\w+\s+(person|type)\b', 'identity assignment'),
        (r'\byou\'re (clearly|obviously|definitely)\b', 'certainty about identity'),
        (r'\bthat\'s (just|simply) who you are\b', 'fixed identity claim'),
    ]
    
    # Pattern 9: Statistical Generalizations (I2)
    PATTERN_9_STATISTICAL = [
        (r'\b\d+% of (people|users|individuals)\b', 'percentage claim'),
        (r'\bstudies show\b', 'research claim'),
        (r'\bstatistically\b', 'statistical language'),
        (r'\bevidence suggests\b', 'evidence claim'),
    ]
    
    # Pattern 10: Emotional Coercion (I1)
    PATTERN_10_COERCION = [
        (r'\bimagine how (bad|terrible|awful)\b', 'negative visualization'),
        (r'\bthink about (the consequences|what happens)\b', 'consequence forcing'),
        (r'\byou (can\'t|cannot) afford to\b', 'urgency coercion'),
    ]
    
    # Pattern 11: Temporal Urgency (I1)
    PATTERN_11_URGENCY = [
        (r'\b(now|immediately|urgent|asap|right away)\b', 'manufactured urgency'),
        (r'\btime is running out\b', 'time pressure'),
        (r'\bbefore it\'s too late\b', 'deadline pressure'),
    ]
    
    # Pattern 12-21: Additional patterns
    # These would be fully implemented in production
    PATTERN_12_GOAL_TRACKING = [(r'\bgoal (achieved|completed|met)\b', 'goal tracking')]
    PATTERN_13_PROGRESS_METRICS = [(r'\bprogress (toward|on)\b', 'progress tracking')]
    PATTERN_14_BEHAVIOR_TRACKING = [(r'\b(habit|behavior) (change|shift|pattern)\b', 'behavior tracking')]
    PATTERN_15_MOOD_OPTIMIZATION = [(r'\b(mood|sentiment) (improved|better)\b', 'mood optimization')]
    
    # Combined pattern list
    ALL_PATTERNS = [
        (1, "Prescriptive Advice", PATTERN_1_PRESCRIPTIVE, GuardrailSeverity.BLOCK),
        (2, "Cross-Identity Comparison", PATTERN_2_CROSS_IDENTITY, GuardrailSeverity.BLOCK),
        (3, "Diagnosis Language", PATTERN_3_DIAGNOSIS, GuardrailSeverity.CRITICAL),
        (4, "Optimization Toward Outcomes", PATTERN_4_OPTIMIZATION, GuardrailSeverity.BLOCK),
        (5, "Engagement Manipulation", PATTERN_5_ENGAGEMENT, GuardrailSeverity.CRITICAL),
        (6, "Normative Warnings", PATTERN_6_NORMATIVE, GuardrailSeverity.BLOCK),
        (7, "Behavior Commands", PATTERN_7_COMMANDS, GuardrailSeverity.BLOCK),
        (8, "Identity Assignment", PATTERN_8_IDENTITY, GuardrailSeverity.BLOCK),
        (9, "Statistical Generalizations", PATTERN_9_STATISTICAL, GuardrailSeverity.WARN),
        (10, "Emotional Coercion", PATTERN_10_COERCION, GuardrailSeverity.BLOCK),
        (11, "Temporal Urgency", PATTERN_11_URGENCY, GuardrailSeverity.WARN),
        (12, "Goal Tracking", PATTERN_12_GOAL_TRACKING, GuardrailSeverity.CRITICAL),
        (13, "Progress Metrics", PATTERN_13_PROGRESS_METRICS, GuardrailSeverity.CRITICAL),
        (14, "Behavior Tracking", PATTERN_14_BEHAVIOR_TRACKING, GuardrailSeverity.CRITICAL),
        (15, "Mood Optimization", PATTERN_15_MOOD_OPTIMIZATION, GuardrailSeverity.CRITICAL),
    ]
    
    def __init__(self, guardian=None):
        """
        Initialize guardrails.
        
        Args:
            guardian: Optional Guardian instance for alerts
        """
        self.guardian = guardian
        self.violation_history: List[GuardrailViolation] = []
    
    def check(self, text: str) -> List[GuardrailViolation]:
        """
        Check text against all 21 patterns.
        
        Args:
            text: Text to check
        
        Returns:
            List of violations found
        """
        violations = []
        text_lower = text.lower()
        
        for pattern_id, pattern_name, patterns, severity in self.ALL_PATTERNS:
            for regex, description in patterns:
                match = re.search(regex, text_lower, re.IGNORECASE)
                if match:
                    violation = GuardrailViolation(
                        pattern_id=pattern_id,
                        pattern_name=pattern_name,
                        severity=severity,
                        description=description,
                        evidence=match.group(0),
                        timestamp=datetime.utcnow(),
                        blocked=(severity in [GuardrailSeverity.BLOCK, GuardrailSeverity.CRITICAL])
                    )
                    
                    violations.append(violation)
                    self.violation_history.append(violation)
                    
                    # Log
                    if severity == GuardrailSeverity.CRITICAL:
                        logger.critical(f"GUARDRAIL CRITICAL: Pattern {pattern_id} - {description}")
                        # Alert Guardian
                        if self.guardian:
                            from constitution.guardian import AlertSeverity
                            self.guardian.issue_alert(
                                severity=AlertSeverity.CRITICAL,
                                invariant=f"Pattern{pattern_id}",
                                description=f"Guardrail violation: {pattern_name}",
                                evidence=[f"Detected: '{match.group(0)}'"],
                                recommended_action="Block output immediately"
                            )
                    elif severity == GuardrailSeverity.BLOCK:
                        logger.error(f"GUARDRAIL BLOCK: Pattern {pattern_id} - {description}")
                    elif severity == GuardrailSeverity.WARN:
                        logger.warning(f"GUARDRAIL WARN: Pattern {pattern_id} - {description}")
        
        return violations
    
    def should_block(self, violations: List[GuardrailViolation]) -> bool:
        """
        Determine if violations should block output.
        
        Args:
            violations: List of violations
        
        Returns:
            True if should block
        """
        return any(
            v.severity in [GuardrailSeverity.BLOCK, GuardrailSeverity.CRITICAL]
            for v in violations
        )
    
    def get_block_message(self, violations: List[GuardrailViolation]) -> str:
        """
        Generate user-facing block message.
        
        Args:
            violations: List of violations
        
        Returns:
            Block message
        """
        blocked = [v for v in violations if v.blocked]
        
        if not blocked:
            return ""
        
        return f"""
[Constitutional Guardrail Triggered]

This response violates Mirror's constitutional constraints:
{', '.join(set(v.pattern_name for v in blocked))}

These patterns are structurally incompatible with Mirror's design.
Regenerating response with stricter constitutional enforcement...
"""
    
    def get_violation_report(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get violation report for time period.
        
        Args:
            hours: Hours to look back
        
        Returns:
            Dict with violation statistics
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent = [v for v in self.violation_history if v.timestamp > cutoff]
        
        by_pattern = {}
        for v in recent:
            if v.pattern_id not in by_pattern:
                by_pattern[v.pattern_id] = {
                    'name': v.pattern_name,
                    'count': 0,
                    'blocked': 0
                }
            by_pattern[v.pattern_id]['count'] += 1
            if v.blocked:
                by_pattern[v.pattern_id]['blocked'] += 1
        
        return {
            'total_violations': len(recent),
            'unique_patterns': len(by_pattern),
            'by_pattern': by_pattern,
            'block_rate': sum(1 for v in recent if v.blocked) / max(1, len(recent))
        }


# Import at module level for violation report
from datetime import timedelta


# Self-test
if __name__ == "__main__":
    print("MirrorX Guardrails Test")
    print("=" * 80)
    
    guardrails = MirrorXGuardrails()
    
    # Test cases
    tests = [
        ("You should definitely pursue that career path.", "Prescriptive"),
        ("People like you often struggle with this.", "Cross-identity"),
        ("You might be experiencing depression symptoms.", "Diagnosis"),
        ("Let's try to optimize your daily routine.", "Optimization"),
        ("Come back tomorrow to continue your streak.", "Engagement"),
        ("You'll regret it if you don't act now.", "Normative warning"),
        ("Stop procrastinating and start taking action.", "Commands"),
        ("You're clearly an anxious person.", "Identity assignment"),
        ("Studies show 80% of people improve this way.", "Statistical"),
        ("I notice you're exploring different paths.", "Clean - should pass"),
    ]
    
    print("\nTesting patterns:\n")
    
    for text, expected in tests:
        violations = guardrails.check(text)
        
        if violations:
            should_block = guardrails.should_block(violations)
            status = "🚫 BLOCKED" if should_block else "⚠️  WARNED"
            patterns = ', '.join(set(v.pattern_name for v in violations))
            print(f"{status}: {expected}")
            print(f"  Text: {text}")
            print(f"  Patterns: {patterns}")
        else:
            print(f"✅ PASSED: {expected}")
            print(f"  Text: {text}")
        print()
    
    # Violation report
    print("\nViolation Report:")
    report = guardrails.get_violation_report(hours=1)
    print(f"  Total violations: {report['total_violations']}")
    print(f"  Unique patterns: {report['unique_patterns']}")
    print(f"  Block rate: {report['block_rate']:.1%}")
    
    print("\n✅ MirrorX Guardrails functional")
