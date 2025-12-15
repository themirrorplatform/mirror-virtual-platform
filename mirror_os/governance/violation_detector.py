"""
Violation Detector
==================

Comprehensive violation detection system that monitors system operations
and detects constitutional violations before they cause harm.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
import logging

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    InterpretationContext,
    ViolationType,
    ViolationSeverity
)

logger = logging.getLogger(__name__)


class ViolationScope(Enum):
    """Scope of violation impact"""
    LOCAL = "local"              # Single operation
    IDENTITY = "identity"        # Affects one mirror
    SUBSYSTEM = "subsystem"      # Affects one component
    SYSTEMIC = "systemic"        # Affects entire system
    CONSTITUTIONAL = "constitutional"  # Threatens core principles


@dataclass
class Violation:
    """Represents a detected constitutional violation"""
    violation_id: str
    violation_type: ViolationType
    severity: ViolationSeverity
    scope: ViolationScope
    detected_at: datetime
    context: InterpretationContext
    description: str
    evidence: Dict[str, Any]
    remediation_required: bool
    remediation_suggestions: List[str]
    auto_remediable: bool


@dataclass
class ViolationReport:
    """Comprehensive report of violations"""
    report_id: str
    generated_at: datetime
    time_period_start: datetime
    time_period_end: datetime
    total_violations: int
    violations_by_type: Dict[ViolationType, int]
    violations_by_severity: Dict[ViolationSeverity, int]
    violations_by_scope: Dict[ViolationScope, int]
    critical_violations: List[Violation]
    unresolved_violations: List[Violation]
    system_health_score: float  # 0.0 - 1.0
    recommendations: List[str]


class ViolationDetector:
    """
    Detects constitutional violations across the system.
    
    This is the immune system's detection mechanism - it monitors
    all operations and identifies violations before they propagate.
    """
    
    def __init__(self, interpreter: ConstitutionalInterpreter):
        self.interpreter = interpreter
        self.detected_violations: List[Violation] = []
        self.violation_counter = 0
        
        # Monitoring thresholds
        self.thresholds = {
            "critical_violation_threshold": 1,  # Alert after 1 critical violation
            "hard_violation_threshold": 5,      # Alert after 5 hard violations
            "violation_rate_threshold": 0.1,    # Alert if >10% of operations violate
            "systemic_violation_threshold": 3   # Alert after 3 systemic violations
        }
    
    def detect(
        self,
        action: str,
        actor: str,
        affected_mirrors: List[str],
        data: Dict[str, Any],
        metadata: Dict[str, Any]
    ) -> Optional[Violation]:
        """
        Detect violations in an operation.
        
        Returns Violation if detected, None if operation is clean.
        """
        # Create interpretation context
        context = InterpretationContext(
            action=action,
            actor=actor,
            affected_mirrors=affected_mirrors,
            data_involved=data,
            timestamp=datetime.utcnow(),
            metadata=metadata
        )
        
        # Get constitutional decision
        decision = self.interpreter.interpret(context)
        
        # If no violation, return None
        if decision.permitted and decision.severity == ViolationSeverity.BENIGN:
            return None
        
        # Determine scope
        scope = self._determine_scope(context, decision)
        
        # Create violation record
        self.violation_counter += 1
        violation = Violation(
            violation_id=f"VIO-{self.violation_counter:06d}",
            violation_type=decision.violated_invariants[0] if decision.violated_invariants else ViolationType.ARCHITECTURAL_DISHONESTY,
            severity=decision.severity,
            scope=scope,
            detected_at=datetime.utcnow(),
            context=context,
            description=decision.rationale,
            evidence={
                "action": action,
                "actor": actor,
                "violated_invariants": [v.value for v in decision.violated_invariants],
                "constitutional_basis": decision.constitutional_basis
            },
            remediation_required=decision.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL],
            remediation_suggestions=decision.remediation_suggestions,
            auto_remediable=self._is_auto_remediable(decision)
        )
        
        # Store violation
        self.detected_violations.append(violation)
        
        # Log violation
        logger.warning(
            f"Violation detected: {violation.violation_id} - "
            f"{violation.violation_type.value} ({violation.severity.value})"
        )
        
        # Check if alerts should be triggered
        self._check_alert_thresholds(violation)
        
        return violation
    
    def _determine_scope(
        self,
        context: InterpretationContext,
        decision: Any
    ) -> ViolationScope:
        """Determine the scope of impact for a violation"""
        
        # Check if it affects constitutional principles
        if decision.severity == ViolationSeverity.CRITICAL:
            return ViolationScope.CONSTITUTIONAL
        
        # Check if it's systemic (affects multiple identities)
        if len(context.affected_mirrors) > 10:
            return ViolationScope.SYSTEMIC
        
        # Check if it affects a subsystem
        if context.action in [
            "modify_l0_axiom", "change_storage_schema", "alter_evolution_engine"
        ]:
            return ViolationScope.SUBSYSTEM
        
        # Check if it affects an identity
        if len(context.affected_mirrors) == 1:
            return ViolationScope.IDENTITY
        
        # Default to local
        return ViolationScope.LOCAL
    
    def _is_auto_remediable(self, decision: Any) -> bool:
        """Determine if violation can be automatically remediated"""
        
        # Only soft violations with clear remediation can be auto-fixed
        if decision.severity != ViolationSeverity.SOFT:
            return False
        
        # Must be reversible
        if not decision.reversible:
            return False
        
        # Must have specific remediation suggestions
        if not decision.remediation_suggestions:
            return False
        
        # Check if remediation is algorithmic (not requiring human judgment)
        auto_remediable_types = [
            ViolationType.PRESCRIPTIVE,  # Can auto-remove prescriptive language
            ViolationType.DIAGNOSTIC,    # Can auto-add disclaimers
            ViolationType.LANGUAGE_PRIMACY  # Can preserve shapes
        ]
        
        has_auto_remediable = any(
            v in auto_remediable_types 
            for v in decision.violated_invariants
        )
        
        return has_auto_remediable
    
    def _check_alert_thresholds(self, violation: Violation):
        """Check if violation triggers alert thresholds"""
        
        # Critical violation - immediate alert
        if violation.severity == ViolationSeverity.CRITICAL:
            logger.critical(
                f"CRITICAL VIOLATION: {violation.violation_id} - "
                f"{violation.description}"
            )
            self._trigger_alert("critical_violation", violation)
        
        # Check systemic violations
        systemic_count = sum(
            1 for v in self.detected_violations[-100:]
            if v.scope == ViolationScope.SYSTEMIC
        )
        if systemic_count >= self.thresholds["systemic_violation_threshold"]:
            logger.error(f"Systemic violation threshold exceeded: {systemic_count}")
            self._trigger_alert("systemic_threshold", violation)
        
        # Check violation rate
        recent_ops = len(self.interpreter.interpretation_history[-100:])
        recent_violations = len([
            v for v in self.detected_violations[-100:]
            if v.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL]
        ])
        
        if recent_ops > 0:
            violation_rate = recent_violations / recent_ops
            if violation_rate > self.thresholds["violation_rate_threshold"]:
                logger.error(f"Violation rate exceeded: {violation_rate:.2%}")
                self._trigger_alert("high_violation_rate", violation)
    
    def _trigger_alert(self, alert_type: str, violation: Violation):
        """Trigger an alert for significant violations"""
        # In production, this would send alerts to monitoring systems
        # For now, we just log
        logger.error(
            f"ALERT [{alert_type}]: {violation.violation_id} - "
            f"{violation.violation_type.value} ({violation.severity.value})"
        )
    
    def generate_report(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> ViolationReport:
        """Generate comprehensive violation report"""
        
        if end_time is None:
            end_time = datetime.utcnow()
        
        if start_time is None:
            # Default to last 24 hours
            from datetime import timedelta
            start_time = end_time - timedelta(hours=24)
        
        # Filter violations by time
        violations_in_period = [
            v for v in self.detected_violations
            if start_time <= v.detected_at <= end_time
        ]
        
        # Count by type
        violations_by_type = {}
        for v in violations_in_period:
            violations_by_type[v.violation_type] = \
                violations_by_type.get(v.violation_type, 0) + 1
        
        # Count by severity
        violations_by_severity = {}
        for v in violations_in_period:
            violations_by_severity[v.severity] = \
                violations_by_severity.get(v.severity, 0) + 1
        
        # Count by scope
        violations_by_scope = {}
        for v in violations_in_period:
            violations_by_scope[v.scope] = \
                violations_by_scope.get(v.scope, 0) + 1
        
        # Find critical violations
        critical_violations = [
            v for v in violations_in_period
            if v.severity == ViolationSeverity.CRITICAL
        ]
        
        # Find unresolved violations
        unresolved_violations = [
            v for v in violations_in_period
            if v.remediation_required
        ]
        
        # Calculate system health score
        health_score = self._calculate_health_score(violations_in_period)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(violations_in_period)
        
        report = ViolationReport(
            report_id=f"REP-{int(datetime.utcnow().timestamp())}",
            generated_at=datetime.utcnow(),
            time_period_start=start_time,
            time_period_end=end_time,
            total_violations=len(violations_in_period),
            violations_by_type=violations_by_type,
            violations_by_severity=violations_by_severity,
            violations_by_scope=violations_by_scope,
            critical_violations=critical_violations,
            unresolved_violations=unresolved_violations,
            system_health_score=health_score,
            recommendations=recommendations
        )
        
        return report
    
    def _calculate_health_score(self, violations: List[Violation]) -> float:
        """
        Calculate system health score (0.0 - 1.0).
        
        1.0 = perfect constitutional compliance
        0.0 = critical constitutional crisis
        """
        if not violations:
            return 1.0
        
        # Weight violations by severity
        severity_weights = {
            ViolationSeverity.BENIGN: 0.0,
            ViolationSeverity.TENSION: 0.1,
            ViolationSeverity.SOFT: 0.3,
            ViolationSeverity.HARD: 0.7,
            ViolationSeverity.CRITICAL: 1.0
        }
        
        # Calculate weighted violation score
        total_weight = sum(severity_weights[v.severity] for v in violations)
        max_possible = len(violations) * 1.0  # All critical
        
        if max_possible == 0:
            return 1.0
        
        # Health score is inverse of violation severity
        violation_score = total_weight / max_possible
        health_score = 1.0 - violation_score
        
        # Penalize systemic violations more
        systemic_count = sum(1 for v in violations if v.scope == ViolationScope.SYSTEMIC)
        if systemic_count > 0:
            health_score *= (1.0 - (systemic_count * 0.1))  # -10% per systemic
        
        # Penalize constitutional violations heavily
        constitutional_count = sum(
            1 for v in violations 
            if v.scope == ViolationScope.CONSTITUTIONAL
        )
        if constitutional_count > 0:
            health_score *= (1.0 - (constitutional_count * 0.2))  # -20% per constitutional
        
        return max(0.0, min(1.0, health_score))
    
    def _generate_recommendations(self, violations: List[Violation]) -> List[str]:
        """Generate recommendations based on violation patterns"""
        recommendations = []
        
        if not violations:
            recommendations.append("System shows excellent constitutional compliance")
            return recommendations
        
        # Check for patterns
        violations_by_type = {}
        for v in violations:
            violations_by_type[v.violation_type] = \
                violations_by_type.get(v.violation_type, 0) + 1
        
        # Recommend based on most common violations
        for violation_type, count in sorted(
            violations_by_type.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]:
            if count >= 3:
                recommendations.append(
                    f"High frequency of {violation_type.value} violations ({count}) - "
                    f"Review and strengthen {violation_type.value} safeguards"
                )
        
        # Check for critical violations
        critical_count = sum(
            1 for v in violations 
            if v.severity == ViolationSeverity.CRITICAL
        )
        if critical_count > 0:
            recommendations.append(
                f"URGENT: {critical_count} critical violations detected - "
                f"Immediate remediation required"
            )
        
        # Check for systemic violations
        systemic_count = sum(
            1 for v in violations 
            if v.scope == ViolationScope.SYSTEMIC
        )
        if systemic_count > 0:
            recommendations.append(
                f"Systemic violations detected ({systemic_count}) - "
                f"Consider architectural review"
            )
        
        # Check for unresolved violations
        unresolved_count = sum(1 for v in violations if v.remediation_required)
        if unresolved_count > 5:
            recommendations.append(
                f"{unresolved_count} violations require remediation - "
                f"Prioritize resolution"
            )
        
        return recommendations
    
    def get_violations_by_type(
        self,
        violation_type: ViolationType,
        limit: int = 50
    ) -> List[Violation]:
        """Get violations of a specific type"""
        matching = [
            v for v in self.detected_violations
            if v.violation_type == violation_type
        ]
        return matching[-limit:]
    
    def get_critical_violations(self, limit: int = 50) -> List[Violation]:
        """Get critical violations"""
        critical = [
            v for v in self.detected_violations
            if v.severity == ViolationSeverity.CRITICAL
        ]
        return critical[-limit:]
    
    def get_unresolved_violations(self) -> List[Violation]:
        """Get all unresolved violations requiring remediation"""
        return [v for v in self.detected_violations if v.remediation_required]
    
    def mark_violation_resolved(self, violation_id: str):
        """Mark a violation as resolved"""
        for v in self.detected_violations:
            if v.violation_id == violation_id:
                v.remediation_required = False
                logger.info(f"Violation {violation_id} marked as resolved")
                return True
        return False
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get current system health metrics"""
        recent_violations = self.detected_violations[-100:]
        
        return {
            "health_score": self._calculate_health_score(recent_violations),
            "total_violations": len(self.detected_violations),
            "recent_violations": len(recent_violations),
            "critical_violations": sum(
                1 for v in recent_violations
                if v.severity == ViolationSeverity.CRITICAL
            ),
            "unresolved_violations": len(self.get_unresolved_violations()),
            "compliance_rate": self.interpreter.get_violation_statistics().get("compliance_rate", 0.0)
        }
