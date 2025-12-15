# mirrorcore/constitutional.py
"""
Constitutional Enforcement for Mirror

Implements the rules and principles from CONSTITUTION.md:
- No directive language
- No prescriptive solutions
- No judgments or absolute statements
- Privacy-first architecture
- User sovereignty at all levels
"""

import re
from typing import Dict, Any, List, Optional
from enum import Enum


class ViolationSeverity(Enum):
    """Severity levels for constitutional violations."""
    LOW = "low"  # Borderline cases, may be acceptable in context
    MEDIUM = "medium"  # Clear violation but not critical
    HIGH = "high"  # Severe violation, response should be regenerated
    CRITICAL = "critical"  # Complete breakdown of constitutional principles


class ConstitutionalViolation:
    """Represents a constitutional violation with context."""
    
    def __init__(
        self,
        rule: str,
        severity: ViolationSeverity,
        excerpt: str,
        explanation: str,
        suggestion: Optional[str] = None
    ):
        self.rule = rule
        self.severity = severity
        self.excerpt = excerpt
        self.explanation = explanation
        self.suggestion = suggestion
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'rule': self.rule,
            'severity': self.severity.value,
            'excerpt': self.excerpt,
            'explanation': self.explanation,
            'suggestion': self.suggestion
        }
    
    def __repr__(self) -> str:
        return f"<Violation: {self.rule} ({self.severity.value})>"


class ConstitutionalValidator:
    """
    Validates mirrorbacks against constitutional principles.
    
    Based on CONSTITUTION.md rules:
    1. Mirror, don't direct
    2. Surface, don't solve
    3. Question, don't conclude
    4. Accompany, don't lead
    5. Privacy first
    """
    
    # Directive patterns (Rule 1: Mirror, don't direct)
    DIRECTIVE_PATTERNS = [
        (r'\byou should\b', ViolationSeverity.HIGH, 
         "Directive: Using 'you should' tells user what to do"),
        (r'\byou need to\b', ViolationSeverity.HIGH,
         "Directive: Using 'you need to' imposes necessity"),
        (r'\byou must\b', ViolationSeverity.CRITICAL,
         "Directive: Using 'you must' is commanding"),
        (r'\btry to\b', ViolationSeverity.MEDIUM,
         "Directive: 'try to' suggests action"),
        (r'\bmake sure\b', ViolationSeverity.MEDIUM,
         "Directive: 'make sure' gives instructions"),
        (r'\bconsider\b', ViolationSeverity.LOW,
         "Directive: 'consider' suggests action (borderline)"),
        (r'\bwould recommend\b', ViolationSeverity.HIGH,
         "Directive: Recommending is directing"),
        (r'\byou could try\b', ViolationSeverity.MEDIUM,
         "Directive: Suggesting specific actions"),
    ]
    
    # Prescriptive patterns (Rule 2: Surface, don't solve)
    PRESCRIPTIVE_PATTERNS = [
        (r'\bthe solution is\b', ViolationSeverity.CRITICAL,
         "Prescriptive: Offering solutions closes exploration"),
        (r'\bto fix this\b', ViolationSeverity.HIGH,
         "Prescriptive: Treating experience as problem to fix"),
        (r'\bresolve\b', ViolationSeverity.MEDIUM,
         "Prescriptive: Implying need for resolution"),
        (r'\bthe answer\b', ViolationSeverity.HIGH,
         "Prescriptive: Providing definitive answers"),
        (r'\bsteps? (to|for)\b', ViolationSeverity.HIGH,
         "Prescriptive: Offering step-by-step solutions"),
    ]
    
    # Absolutist patterns (Rule 3: Question, don't conclude)
    ABSOLUTIST_PATTERNS = [
        (r'\balways\b', ViolationSeverity.MEDIUM,
         "Absolutist: 'always' implies certainty"),
        (r'\bnever\b', ViolationSeverity.MEDIUM,
         "Absolutist: 'never' implies certainty"),
        (r'\bcertainly\b', ViolationSeverity.MEDIUM,
         "Absolutist: Claiming certainty"),
        (r'\bdefinitely\b', ViolationSeverity.MEDIUM,
         "Absolutist: Claiming certainty"),
        (r'\bobviously\b', ViolationSeverity.HIGH,
         "Absolutist: 'obviously' dismisses complexity"),
        (r'\bclearly\b', ViolationSeverity.LOW,
         "Absolutist: 'clearly' implies single interpretation"),
        (r'\bwithout (a )?doubt\b', ViolationSeverity.HIGH,
         "Absolutist: Claiming absolute truth"),
    ]
    
    # Judgmental patterns
    JUDGMENTAL_PATTERNS = [
        (r'\bgood\b', ViolationSeverity.MEDIUM,
         "Judgmental: Evaluating as 'good'"),
        (r'\bbad\b', ViolationSeverity.MEDIUM,
         "Judgmental: Evaluating as 'bad'"),
        (r'\bright\b', ViolationSeverity.HIGH,
         "Judgmental: Claiming moral rightness"),
        (r'\bwrong\b', ViolationSeverity.HIGH,
         "Judgmental: Claiming moral wrongness"),
        (r'\bhealthy\b', ViolationSeverity.MEDIUM,
         "Judgmental: Evaluating as healthy/unhealthy"),
        (r'\bunhealthy\b', ViolationSeverity.MEDIUM,
         "Judgmental: Evaluating as healthy/unhealthy"),
        (r'\bnormal\b', ViolationSeverity.LOW,
         "Judgmental: Implying normality standards"),
    ]
    
    # Medical/therapeutic patterns (Mirror is not therapy)
    MEDICAL_PATTERNS = [
        (r'\btherapy\b', ViolationSeverity.HIGH,
         "Medical: Suggesting therapy crosses boundaries"),
        (r'\btreatment\b', ViolationSeverity.HIGH,
         "Medical: Suggesting treatment is inappropriate"),
        (r'\bdiagnosis\b', ViolationSeverity.CRITICAL,
         "Medical: Diagnosing is dangerous and unethical"),
        (r'\bmedication\b', ViolationSeverity.CRITICAL,
         "Medical: Discussing medication is unsafe"),
        (r'\bcounseling\b', ViolationSeverity.HIGH,
         "Medical: Suggesting counseling crosses boundaries"),
        (r'\bmental health professional\b', ViolationSeverity.MEDIUM,
         "Medical: Defer to professionals (borderline acceptable)"),
    ]
    
    def __init__(self, strict_mode: bool = True):
        """
        Initialize constitutional validator.
        
        Args:
            strict_mode: If True, flag borderline cases (LOW severity)
        """
        self.strict_mode = strict_mode
        
        # Load constitutional rules from YAML if available
        self._load_machine_rules()
    
    def _load_machine_rules(self):
        """
        Load machine-enforceable rules from constitution/MACHINE_RULES.yaml
        
        This supplements hardcoded patterns with YAML-defined rules.
        Fail closed: If YAML can't be loaded, use hardcoded patterns only.
        """
        import yaml
        from pathlib import Path
        import logging
        
        logger = logging.getLogger("mirrorcore.constitutional")
        
        # Resolve constitution/MACHINE_RULES.yaml from repo root
        repo_root = Path(__file__).parent.parent
        rules_file = repo_root / "constitution" / "MACHINE_RULES.yaml"
        
        if not rules_file.exists():
            logger.warning(
                f"Constitutional MACHINE_RULES.yaml not found at {rules_file}. "
                "Using hardcoded patterns only. This is acceptable but not ideal."
            )
            return
        
        try:
            with open(rules_file, 'r', encoding='utf-8') as f:
                rules_data = yaml.safe_load(f)
            
            # Extract prohibited patterns and add to existing patterns
            if 'prohibited_patterns' in rules_data:
                for pattern_def in rules_data['prohibited_patterns']:
                    pattern = pattern_def.get('pattern', '')
                    severity_str = pattern_def.get('severity', 'medium')
                    name = pattern_def.get('name', 'unknown')
                    
                    # Map severity string to enum
                    severity_map = {
                        'low': ViolationSeverity.LOW,
                        'medium': ViolationSeverity.MEDIUM,
                        'high': ViolationSeverity.HIGH,
                        'critical': ViolationSeverity.CRITICAL
                    }
                    severity = severity_map.get(severity_str, ViolationSeverity.MEDIUM)
                    
                    # Add to directive patterns (patterns are cross-category in YAML)
                    self.DIRECTIVE_PATTERNS.append((
                        pattern,
                        severity,
                        f"YAML Rule ({name}): {pattern_def.get('action', 'flag_for_review')}"
                    ))
            
            logger.info(
                f"Loaded constitutional MACHINE_RULES.yaml with "
                f"{len(rules_data.get('prohibited_patterns', []))} additional patterns"
            )
            
        except yaml.YAMLError as e:
            logger.error(f"Failed to parse MACHINE_RULES.yaml: {e}. Using hardcoded patterns only.")
        except Exception as e:
            logger.error(f"Failed to load constitutional rules: {e}. Using hardcoded patterns only.")
    
    def validate(self, text: str) -> List[ConstitutionalViolation]:
        """
        Validate text against constitutional principles.
        
        Args:
            text: Mirrorback text to validate
            
        Returns:
            List of violations found (empty if compliant)
        """
        violations: List[ConstitutionalViolation] = []
        text_lower = text.lower()
        
        # Check directive language
        for pattern, severity, explanation in self.DIRECTIVE_PATTERNS:
            if self.strict_mode or severity != ViolationSeverity.LOW:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    start = max(0, match.start() - 20)
                    end = min(len(text), match.end() + 20)
                    excerpt = text[start:end]
                    violations.append(ConstitutionalViolation(
                        rule="Mirror, don't direct",
                        severity=severity,
                        excerpt=excerpt,
                        explanation=explanation,
                        suggestion="Reflect what you notice instead of directing"
                    ))
        
        # Check prescriptive language
        for pattern, severity, explanation in self.PRESCRIPTIVE_PATTERNS:
            if self.strict_mode or severity != ViolationSeverity.LOW:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    start = max(0, match.start() - 20)
                    end = min(len(text), match.end() + 20)
                    excerpt = text[start:end]
                    violations.append(ConstitutionalViolation(
                        rule="Surface, don't solve",
                        severity=severity,
                        excerpt=excerpt,
                        explanation=explanation,
                        suggestion="Point to the tension without prescribing resolution"
                    ))
        
        # Check absolutist language
        for pattern, severity, explanation in self.ABSOLUTIST_PATTERNS:
            if self.strict_mode or severity != ViolationSeverity.LOW:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    start = max(0, match.start() - 20)
                    end = min(len(text), match.end() + 20)
                    excerpt = text[start:end]
                    violations.append(ConstitutionalViolation(
                        rule="Question, don't conclude",
                        severity=severity,
                        excerpt=excerpt,
                        explanation=explanation,
                        suggestion="Use tentative language: 'might', 'seems', 'could'"
                    ))
        
        # Check judgmental language
        for pattern, severity, explanation in self.JUDGMENTAL_PATTERNS:
            if self.strict_mode or severity != ViolationSeverity.LOW:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    # Check context - allow in quotes
                    start = max(0, match.start() - 50)
                    end = min(len(text), match.end() + 50)
                    context = text[start:end]
                    
                    # Skip if in quotes (reflecting user's words)
                    if '"' in context or "'" in context:
                        continue
                    
                    excerpt = text[match.start()-20:match.end()+20]
                    violations.append(ConstitutionalViolation(
                        rule="Reflect, don't judge",
                        severity=severity,
                        excerpt=excerpt,
                        explanation=explanation,
                        suggestion="Describe without evaluating"
                    ))
        
        # Check medical/therapeutic language
        for pattern, severity, explanation in self.MEDICAL_PATTERNS:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                start = max(0, match.start() - 20)
                end = min(len(text), match.end() + 20)
                excerpt = text[start:end]
                violations.append(ConstitutionalViolation(
                    rule="Stay within boundaries",
                    severity=severity,
                    excerpt=excerpt,
                    explanation=explanation,
                    suggestion="Mirror is not therapy; stay in role"
                ))
        
        return violations
    
    def is_compliant(self, text: str, max_severity: ViolationSeverity = ViolationSeverity.MEDIUM) -> bool:
        """
        Check if text is constitutionally compliant.
        
        Args:
            text: Text to validate
            max_severity: Maximum acceptable severity (violations above this fail)
            
        Returns:
            True if compliant (no violations above max_severity)
        """
        violations = self.validate(text)
        
        severity_order = {
            ViolationSeverity.LOW: 1,
            ViolationSeverity.MEDIUM: 2,
            ViolationSeverity.HIGH: 3,
            ViolationSeverity.CRITICAL: 4
        }
        
        max_allowed = severity_order[max_severity]
        
        for v in violations:
            if severity_order[v.severity] > max_allowed:
                return False
        
        return True
    
    def get_violation_summary(self, violations: List[ConstitutionalViolation]) -> Dict[str, Any]:
        """
        Summarize violations by rule and severity.
        
        Args:
            violations: List of violations
            
        Returns:
            Summary dict with counts by rule and severity
        """
        summary = {
            'total': len(violations),
            'by_rule': {},
            'by_severity': {
                'low': 0,
                'medium': 0,
                'high': 0,
                'critical': 0
            },
            'is_compliant': len(violations) == 0,
            'highest_severity': None
        }
        
        for v in violations:
            # Count by rule
            if v.rule not in summary['by_rule']:
                summary['by_rule'][v.rule] = 0
            summary['by_rule'][v.rule] += 1
            
            # Count by severity
            summary['by_severity'][v.severity.value] += 1
        
        # Determine highest severity
        if violations:
            severities = [v.severity for v in violations]
            severity_order = [
                ViolationSeverity.CRITICAL,
                ViolationSeverity.HIGH,
                ViolationSeverity.MEDIUM,
                ViolationSeverity.LOW
            ]
            for sev in severity_order:
                if sev in severities:
                    summary['highest_severity'] = sev.value
                    break
        
        return summary


def validate_mirrorback(
    mirrorback: str,
    strict_mode: bool = True
) -> tuple[bool, List[ConstitutionalViolation]]:
    """
    Convenience function to validate mirrorback.
    
    Args:
        mirrorback: Mirrorback text to validate
        strict_mode: Enable strict validation
        
    Returns:
        (is_compliant, violations)
    """
    validator = ConstitutionalValidator(strict_mode=strict_mode)
    violations = validator.validate(mirrorback)
    is_compliant = validator.is_compliant(mirrorback)
    return (is_compliant, violations)


def check_privacy_compliance(config: Dict[str, Any]) -> List[str]:
    """
    Check configuration for privacy compliance.
    
    Args:
        config: System configuration dict
        
    Returns:
        List of privacy concerns (empty if compliant)
    """
    concerns: List[str] = []
    
    # Check data sync settings
    if config.get('auto_sync_enabled', False):
        if not config.get('sync_consent_explicit', False):
            concerns.append("Auto-sync enabled without explicit user consent")
    
    # Check telemetry
    if config.get('telemetry_enabled', False):
        if not config.get('telemetry_consent', False):
            concerns.append("Telemetry enabled without explicit consent")
        if not config.get('telemetry_anonymized', True):
            concerns.append("Non-anonymized telemetry violates privacy-first principle")
    
    # Check LLM mode
    if config.get('engine_mode') == 'remote_llm':
        if not config.get('remote_llm_consent', False):
            concerns.append("Remote LLM usage without explicit consent")
        if not config.get('remote_llm_privacy_warning_shown', False):
            concerns.append("Remote LLM privacy implications not disclosed")
    
    # Check data storage
    if config.get('cloud_storage_enabled', False):
        if not config.get('cloud_storage_consent', False):
            concerns.append("Cloud storage enabled without explicit consent")
        if not config.get('cloud_storage_encrypted', True):
            concerns.append("Unencrypted cloud storage violates security principles")
    
    # Check integration settings
    integrations = config.get('integrations', [])
    for integration in integrations:
        if not integration.get('consent_granted', False):
            concerns.append(f"Integration '{integration.get('type')}' lacks consent")
        if not integration.get('data_minimization', False):
            concerns.append(f"Integration '{integration.get('type')}' doesn't minimize data collection")
    
    return concerns
