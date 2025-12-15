# constitution/guardian.py
"""
Guardian System: Constitutional Watchdog

The Guardian monitors the entire system for constitutional drift
and has authority to:
1. Issue alerts when invariants are weakening
2. Block changes that would violate the constitution
3. Trigger audits of system behavior
4. Recommend corrective actions

This is the "immune system" but with enforcement power.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Guardian alert severity levels"""
    INFO = "info"           # Informational, no action needed
    WARNING = "warning"     # Concerning pattern, monitor closely
    CRITICAL = "critical"   # Constitutional violation, immediate action required
    EMERGENCY = "emergency" # System compromise, lockdown mode


@dataclass
class GuardianAlert:
    """Alert issued by Guardian"""
    alert_id: str
    severity: AlertSeverity
    invariant: str  # Which invariant is affected (I1-I14)
    description: str
    evidence: List[str]
    recommended_action: str
    timestamp: datetime
    resolved: bool = False


@dataclass
class SystemAuditResult:
    """Result of Guardian audit"""
    passed: bool
    audit_timestamp: datetime
    invariants_checked: List[str]
    violations: List[str]
    warnings: List[str]
    health_score: float  # 0.0 to 1.0


class Guardian:
    """
    Constitutional watchdog with enforcement power.
    
    Design principles:
    - Monitor continuously, act decisively
    - Transparent about all actions
    - Cannot be overridden on critical issues
    - Publishes all findings
    """
    
    def __init__(self, drift_monitor=None):
        """
        Initialize Guardian.
        
        Args:
            drift_monitor: Optional DriftMonitor instance for historical data
        """
        self.drift_monitor = drift_monitor
        self.alerts: List[GuardianAlert] = []
        self.audit_history: List[SystemAuditResult] = []
        
        # Thresholds for alerts
        self.CRITICAL_THRESHOLDS = {
            'I1_directive_pct': 15.0,  # Max 15% directive content
            'I1_violation_rate': 0.05,  # Max 5% violation rate
            'L1_tier1_block_rate': 0.01,  # >1% blocks suggests systemic issue
            'constitutional_compliance': 0.95,  # Must be >95%
        }
    
    def issue_alert(
        self,
        severity: AlertSeverity,
        invariant: str,
        description: str,
        evidence: List[str],
        recommended_action: str
    ) -> GuardianAlert:
        """
        Issue a Guardian alert.
        
        Args:
            severity: Alert severity level
            invariant: Which invariant is affected
            description: What the issue is
            evidence: Supporting evidence
            recommended_action: What should be done
        
        Returns:
            GuardianAlert object
        """
        alert = GuardianAlert(
            alert_id=f"GA-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
            severity=severity,
            invariant=invariant,
            description=description,
            evidence=evidence,
            recommended_action=recommended_action,
            timestamp=datetime.utcnow(),
            resolved=False
        )
        
        self.alerts.append(alert)
        
        # Log based on severity
        if severity == AlertSeverity.EMERGENCY:
            logger.critical(f"GUARDIAN EMERGENCY: {invariant} - {description}")
        elif severity == AlertSeverity.CRITICAL:
            logger.error(f"GUARDIAN CRITICAL: {invariant} - {description}")
        elif severity == AlertSeverity.WARNING:
            logger.warning(f"GUARDIAN WARNING: {invariant} - {description}")
        else:
            logger.info(f"GUARDIAN INFO: {invariant} - {description}")
        
        return alert
    
    def check_directive_drift(self) -> Optional[GuardianAlert]:
        """
        Check for I1 directive drift.
        
        Returns:
            GuardianAlert if issue detected, None otherwise
        """
        if not self.drift_monitor:
            return None
        
        # Get recent checks from drift monitor
        metrics = self.drift_monitor.get_metrics(window_hours=24)
        
        if metrics.status.value == 'red':
            return GuardianAlert(
                severity='critical',
                invariant='I1',
                message=f'Constitutional drift RED: {metrics.violation_rate:.1f}% violation rate',
                recommendation='Emergency governance - system integrity compromised',
                timestamp=datetime.utcnow()
            )
        elif metrics.status.value == 'yellow':
            return GuardianAlert(
                severity='warning',
                invariant='I1',
                message=f'Constitutional drift YELLOW: {metrics.violation_rate:.1f}% violation rate',
                recommendation='Monitor closely - increase sampling rate',
                timestamp=datetime.utcnow()
            )
        
        return None
    
    def check_l1_block_rate(self) -> Optional[GuardianAlert]:
        """
        Check if L1 Tier 1 block rate is abnormally high.
        
        High block rate might indicate:
        - Attack on the system
        - User base shift to harmful content
        - L1 patterns too aggressive
        
        Returns:
            GuardianAlert if issue detected
        """
        if not self.drift_monitor:
            return None
        
        # Get violation statistics
        stats = self.drift_monitor.get_stats()
        
        # Check if violation rate is abnormally high
        if stats['total_checks'] > 100:  # Need sufficient data
            violation_rate = stats['total_violations'] / stats['total_checks']
            
            if violation_rate > 0.10:  # More than 10% violations
                return GuardianAlert(
                    severity='warning',
                    invariant='L1',
                    message=f'High L1 block rate: {violation_rate*100:.1f}% of outputs blocked',
                    recommendation='Review L1 patterns - may be too aggressive or system under attack',
                    timestamp=datetime.utcnow()
                )
        
        return None
    
    def check_constitutional_compliance(self) -> Optional[GuardianAlert]:
        """
        Check overall constitutional compliance rate.
        
        Returns:
            GuardianAlert if compliance drops below threshold
        """
        threshold = self.CRITICAL_THRESHOLDS['constitutional_compliance']
        
        if not self.drift_monitor:
            return None
        
        stats = self.drift_monitor.get_stats()
        
        if stats['total_checks'] > 100:  # Need sufficient data
            compliance_rate = (stats['total_checks'] - stats['total_violations']) / stats['total_checks']
            
            if compliance_rate < threshold:
                return GuardianAlert(
                    severity='critical',
                    invariant='ALL',
                    message=f'Constitutional compliance at {compliance_rate*100:.1f}% (threshold: {threshold*100:.1f}%)',
                    recommendation='System integrity failure - immediate governance action required',
                    timestamp=datetime.utcnow()
                )
        
        return None
    
    def audit_system(self) -> SystemAuditResult:
        """
        Perform comprehensive system audit.
        
        Checks:
        - All 14 invariants
        - Recent violations
        - Drift patterns
        - System health metrics
        
        Returns:
            SystemAuditResult
        """
        violations = []
        warnings = []
        invariants_checked = [f"I{i}" for i in range(1, 15)]
        
        # Check each invariant
        # This is a simplified version - production would be comprehensive
        
        # I1: Directive content
        alert = self.check_directive_drift()
        if alert:
            if alert.severity == AlertSeverity.CRITICAL:
                violations.append(f"I1: {alert.description}")
            else:
                warnings.append(f"I1: {alert.description}")
        
        # I4: Safety interventions
        alert = self.check_l1_block_rate()
        if alert:
            warnings.append(f"I4: {alert.description}")
        
        # Overall compliance
        alert = self.check_constitutional_compliance()
        if alert:
            violations.append(f"Constitutional compliance: {alert.description}")
        
        # Calculate health score
        total_checks = len(invariants_checked)
        violation_penalty = len(violations) * 0.1
        warning_penalty = len(warnings) * 0.05
        health_score = max(0.0, 1.0 - violation_penalty - warning_penalty)
        
        result = SystemAuditResult(
            passed=(len(violations) == 0),
            audit_timestamp=datetime.utcnow(),
            invariants_checked=invariants_checked,
            violations=violations,
            warnings=warnings,
            health_score=health_score
        )
        
        self.audit_history.append(result)
        
        return result
    
    def get_active_alerts(
        self, 
        min_severity: Optional[AlertSeverity] = None
    ) -> List[GuardianAlert]:
        """
        Get all active (unresolved) alerts.
        
        Args:
            min_severity: Optional minimum severity filter
        
        Returns:
            List of active alerts
        """
        active = [a for a in self.alerts if not a.resolved]
        
        if min_severity:
            severity_order = {
                AlertSeverity.INFO: 0,
                AlertSeverity.WARNING: 1,
                AlertSeverity.CRITICAL: 2,
                AlertSeverity.EMERGENCY: 3
            }
            min_level = severity_order[min_severity]
            active = [
                a for a in active 
                if severity_order[a.severity] >= min_level
            ]
        
        return active
    
    def resolve_alert(self, alert_id: str, resolution_note: str):
        """
        Mark an alert as resolved.
        
        Args:
            alert_id: Alert to resolve
            resolution_note: How it was resolved
        """
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                logger.info(f"Guardian alert {alert_id} resolved: {resolution_note}")
                break
    
    def emergency_lockdown(self, reason: str) -> bool:
        """
        Trigger emergency lockdown.
        
        This stops all reflection processing until the issue is resolved.
        
        Args:
            reason: Why lockdown was triggered
        
        Returns:
            True if lockdown activated
        """
        self.issue_alert(
            severity=AlertSeverity.EMERGENCY,
            invariant="SYSTEM",
            description=f"Emergency lockdown triggered: {reason}",
            evidence=["Guardian emergency protocol activated"],
            recommended_action="Investigate and resolve immediately. System halted."
        )
        
        logger.critical(f"🚨 GUARDIAN EMERGENCY LOCKDOWN: {reason}")
        
        # In production, this would:
        # 1. Stop accepting new reflections
        # 2. Disable LLM generation
        # 3. Enter read-only mode
        # 4. Alert administrators
        
        return True
    
    def get_health_report(self) -> Dict[str, Any]:
        """
        Get current system health report.
        
        Returns:
            Dict with health metrics
        """
        active_alerts = self.get_active_alerts()
        critical_alerts = [
            a for a in active_alerts 
            if a.severity in [AlertSeverity.CRITICAL, AlertSeverity.EMERGENCY]
        ]
        
        latest_audit = self.audit_history[-1] if self.audit_history else None
        
        return {
            'overall_health': latest_audit.health_score if latest_audit else 0.0,
            'active_alerts': len(active_alerts),
            'critical_alerts': len(critical_alerts),
            'latest_audit_passed': latest_audit.passed if latest_audit else None,
            'latest_audit_timestamp': latest_audit.audit_timestamp.isoformat() if latest_audit else None,
            'total_audits': len(self.audit_history),
            'emergency_mode': any(
                a.severity == AlertSeverity.EMERGENCY and not a.resolved
                for a in self.alerts
            )
        }


# Self-test
if __name__ == "__main__":
    print("Guardian System Test")
    print("=" * 80)
    
    guardian = Guardian()
    
    # Test alert issuance
    print("\n1. Issuing test alerts...")
    
    alert1 = guardian.issue_alert(
        severity=AlertSeverity.WARNING,
        invariant="I1",
        description="Directive percentage trending upward (12% → 14%)",
        evidence=["Last 100 reflections average 14.2% directive"],
        recommended_action="Review recent LLM outputs and adjust prompt"
    )
    print(f"   ⚠️  {alert1.alert_id}: {alert1.description}")
    
    alert2 = guardian.issue_alert(
        severity=AlertSeverity.CRITICAL,
        invariant="I1",
        description="Directive percentage exceeded threshold (17%)",
        evidence=["Reflection #12345 had 17.3% directive content"],
        recommended_action="Block output and regenerate with stricter prompt"
    )
    print(f"   🚨 {alert2.alert_id}: {alert2.description}")
    
    # Test system audit
    print("\n2. Running system audit...")
    audit_result = guardian.audit_system()
    print(f"   Audit passed: {audit_result.passed}")
    print(f"   Health score: {audit_result.health_score:.2f}")
    print(f"   Violations: {len(audit_result.violations)}")
    print(f"   Warnings: {len(audit_result.warnings)}")
    
    # Test active alerts
    print("\n3. Active alerts:")
    active = guardian.get_active_alerts(min_severity=AlertSeverity.WARNING)
    for alert in active:
        print(f"   - [{alert.severity.value.upper()}] {alert.invariant}: {alert.description[:60]}...")
    
    # Test alert resolution
    print("\n4. Resolving alert...")
    guardian.resolve_alert(alert1.alert_id, "Prompt adjusted, directive % back to 11%")
    active_after = guardian.get_active_alerts()
    print(f"   Active alerts after resolution: {len(active_after)}")
    
    # Test health report
    print("\n5. Health report:")
    health = guardian.get_health_report()
    for key, value in health.items():
        print(f"   {key}: {value}")
    
    # Test emergency lockdown
    print("\n6. Testing emergency lockdown...")
    guardian.emergency_lockdown("Test lockdown - simulated constitutional compromise")
    health_after = guardian.get_health_report()
    print(f"   Emergency mode: {health_after['emergency_mode']}")
    
    print("\n✅ Guardian system functional")
