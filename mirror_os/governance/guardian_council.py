"""
Guardian Council
================

Oversight body that can veto actions and handle emergency protocols.
The final safeguard against constitutional violations.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
import logging

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    ConstitutionalDecision,
    ViolationType,
    ViolationSeverity
)
from mirror_os.governance.violation_detector import Violation, ViolationScope

logger = logging.getLogger(__name__)


class GuardianRole(Enum):
    """Roles within the Guardian Council"""
    CONSTITUTIONAL_GUARDIAN = "constitutional_guardian"
    SAFETY_GUARDIAN = "safety_guardian"
    USER_ADVOCATE = "user_advocate"
    TECHNICAL_OVERSEER = "technical_overseer"


class VetoReason(Enum):
    """Reasons for veto"""
    CONSTITUTIONAL_VIOLATION = "constitutional_violation"
    SAFETY_CONCERN = "safety_concern"
    USER_HARM = "user_harm"
    SYSTEMIC_RISK = "systemic_risk"
    PRECEDENT_CONCERN = "precedent_concern"


class EmergencyLevel(Enum):
    """Emergency protocol levels"""
    LEVEL_0 = "normal"          # No emergency
    LEVEL_1 = "monitoring"      # Increased monitoring
    LEVEL_2 = "intervention"    # Active intervention
    LEVEL_3 = "lockdown"        # System lockdown
    LEVEL_4 = "shutdown"        # Emergency shutdown


@dataclass
class Guardian:
    """A guardian council member"""
    guardian_id: str
    name: str
    role: GuardianRole
    appointed_at: datetime
    active: bool


@dataclass
class VetoDecision:
    """A veto decision by the council"""
    veto_id: str
    action_blocked: str
    guardian_id: str
    reason: VetoReason
    rationale: str
    constitutional_basis: List[str]
    issued_at: datetime
    expires_at: Optional[datetime]
    can_appeal: bool


@dataclass
class EmergencyProtocol:
    """Emergency protocol activation"""
    protocol_id: str
    level: EmergencyLevel
    triggered_by: str  # Guardian or system
    triggered_at: datetime
    reason: str
    affected_systems: List[str]
    actions_taken: List[str]
    resolved_at: Optional[datetime]
    resolution: Optional[str]


class GuardianCouncil:
    """
    Guardian Council - Final oversight body.
    
    Powers:
    1. Veto actions that violate constitution
    2. Activate emergency protocols
    3. Override system decisions (with full logging)
    4. Mandate security patches
    5. Pause system for critical issues
    
    Limitations:
    1. Cannot modify constitution without amendment process
    2. All actions are logged and auditable
    3. Vetoes can be appealed
    4. Cannot override explicit human consent
    """
    
    def __init__(self, interpreter: ConstitutionalInterpreter):
        self.interpreter = interpreter
        self.guardians: List[Guardian] = []
        self.vetoes: List[VetoDecision] = []
        self.emergency_protocols: List[EmergencyProtocol] = []
        self.veto_counter = 0
        self.protocol_counter = 0
        self.current_emergency_level = EmergencyLevel.LEVEL_0
        
        # Thresholds for automatic escalation
        self.escalation_thresholds = {
            "critical_violations_per_hour": 5,
            "systemic_violations_per_day": 10,
            "veto_rate_threshold": 0.3  # 30% of actions vetoed
        }
    
    def appoint_guardian(
        self,
        guardian_id: str,
        name: str,
        role: GuardianRole
    ) -> Guardian:
        """Appoint a new guardian to the council"""
        guardian = Guardian(
            guardian_id=guardian_id,
            name=name,
            role=role,
            appointed_at=datetime.utcnow(),
            active=True
        )
        
        self.guardians.append(guardian)
        logger.info(f"Guardian appointed: {name} ({role.value})")
        
        return guardian
    
    def review_action(
        self,
        action: str,
        context: Any,
        decision: ConstitutionalDecision
    ) -> Optional[VetoDecision]:
        """
        Review an action and potentially veto it.
        
        The council reviews actions after initial interpretation but before execution.
        This is the final checkpoint.
        """
        logger.info(f"Guardian Council reviewing: {action}")
        
        # Check if action should be vetoed
        should_veto, reason, rationale = self._should_veto(action, context, decision)
        
        if not should_veto:
            logger.info(f"Action approved by Guardian Council: {action}")
            return None
        
        # Issue veto
        veto = self._issue_veto(action, reason, rationale, decision)
        
        logger.warning(
            f"ACTION VETOED: {action} - Reason: {reason.value}"
        )
        
        return veto
    
    def _should_veto(
        self,
        action: str,
        context: Any,
        decision: ConstitutionalDecision
    ) -> tuple[bool, Optional[VetoReason], str]:
        """Determine if action should be vetoed"""
        
        # Veto critical violations
        if decision.severity == ViolationSeverity.CRITICAL:
            return True, VetoReason.CONSTITUTIONAL_VIOLATION, \
                f"Critical constitutional violation: {decision.rationale}"
        
        # Veto actions affecting multiple identities without consent
        if hasattr(context, 'affected_mirrors') and len(context.affected_mirrors) > 1:
            if "explicit_consent" not in context.metadata:
                return True, VetoReason.USER_HARM, \
                    "Cross-identity action without explicit consent"
        
        # Veto system modifications during emergency
        if self.current_emergency_level in [EmergencyLevel.LEVEL_3, EmergencyLevel.LEVEL_4]:
            if action in ["modify_constitution", "change_storage", "alter_core"]:
                return True, VetoReason.SAFETY_CONCERN, \
                    f"System modifications prohibited during {self.current_emergency_level.value}"
        
        # Veto actions that set bad precedent
        if self._sets_dangerous_precedent(action, decision):
            return True, VetoReason.PRECEDENT_CONCERN, \
                "Action sets dangerous precedent for future decisions"
        
        return False, None, ""
    
    def _sets_dangerous_precedent(
        self,
        action: str,
        decision: ConstitutionalDecision
    ) -> bool:
        """Check if action sets dangerous precedent"""
        
        # Actions that erode core principles
        dangerous_patterns = [
            "bypass_",
            "skip_check_",
            "disable_safeguard_",
            "override_constitutional_"
        ]
        
        return any(pattern in action for pattern in dangerous_patterns)
    
    def _issue_veto(
        self,
        action: str,
        reason: VetoReason,
        rationale: str,
        decision: ConstitutionalDecision
    ) -> VetoDecision:
        """Issue a veto decision"""
        
        self.veto_counter += 1
        
        # Determine if veto expires (temporary block)
        expires_at = None
        if reason == VetoReason.SAFETY_CONCERN:
            expires_at = datetime.utcnow() + timedelta(hours=24)
        
        veto = VetoDecision(
            veto_id=f"VETO-{self.veto_counter:05d}",
            action_blocked=action,
            guardian_id="council",  # Issued by full council
            reason=reason,
            rationale=rationale,
            constitutional_basis=decision.constitutional_basis,
            issued_at=datetime.utcnow(),
            expires_at=expires_at,
            can_appeal=True
        )
        
        self.vetoes.append(veto)
        
        return veto
    
    def activate_emergency_protocol(
        self,
        level: EmergencyLevel,
        triggered_by: str,
        reason: str,
        affected_systems: List[str]
    ) -> EmergencyProtocol:
        """
        Activate emergency protocol.
        
        Emergency levels:
        - LEVEL_1: Increased monitoring, no restrictions
        - LEVEL_2: Active intervention, non-critical operations paused
        - LEVEL_3: System lockdown, only essential operations
        - LEVEL_4: Emergency shutdown, human intervention required
        """
        logger.critical(
            f"EMERGENCY PROTOCOL ACTIVATED: {level.value} - Reason: {reason}"
        )
        
        self.protocol_counter += 1
        
        # Determine actions to take
        actions_taken = self._execute_emergency_actions(level, affected_systems)
        
        protocol = EmergencyProtocol(
            protocol_id=f"EMERG-{self.protocol_counter:04d}",
            level=level,
            triggered_by=triggered_by,
            triggered_at=datetime.utcnow(),
            reason=reason,
            affected_systems=affected_systems,
            actions_taken=actions_taken,
            resolved_at=None,
            resolution=None
        )
        
        self.emergency_protocols.append(protocol)
        self.current_emergency_level = level
        
        return protocol
    
    def _execute_emergency_actions(
        self,
        level: EmergencyLevel,
        affected_systems: List[str]
    ) -> List[str]:
        """Execute emergency actions based on level"""
        actions = []
        
        if level == EmergencyLevel.LEVEL_1:
            actions.append("Increased logging and monitoring")
            actions.append("Alert guardians")
        
        elif level == EmergencyLevel.LEVEL_2:
            actions.append("Pause non-critical operations")
            actions.append("Enable enhanced safety checks")
            actions.append("Require manual approval for critical actions")
        
        elif level == EmergencyLevel.LEVEL_3:
            actions.append("System lockdown - essential operations only")
            actions.append("Disable external integrations")
            actions.append("Require guardian approval for all actions")
            actions.append("Enable full audit logging")
        
        elif level == EmergencyLevel.LEVEL_4:
            actions.append("EMERGENCY SHUTDOWN initiated")
            actions.append("All non-essential systems halted")
            actions.append("Data preserved in safe state")
            actions.append("Human intervention required to restore")
        
        # Log all actions
        for action in actions:
            logger.critical(f"Emergency action: {action}")
        
        return actions
    
    def resolve_emergency(
        self,
        protocol_id: str,
        resolution: str
    ):
        """Resolve an emergency protocol"""
        
        protocol = self._get_protocol(protocol_id)
        
        if protocol.resolved_at:
            raise ValueError(f"Protocol already resolved: {protocol_id}")
        
        protocol.resolved_at = datetime.utcnow()
        protocol.resolution = resolution
        
        # Reset emergency level to normal
        self.current_emergency_level = EmergencyLevel.LEVEL_0
        
        logger.info(
            f"Emergency protocol resolved: {protocol_id} - "
            f"Resolution: {resolution}"
        )
    
    def check_automatic_escalation(
        self,
        recent_violations: List[Violation]
    ):
        """
        Check if automatic emergency escalation is needed.
        
        Escalates based on violation patterns.
        """
        
        if not recent_violations:
            return
        
        # Count critical violations in last hour
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_critical = [
            v for v in recent_violations
            if v.detected_at >= one_hour_ago
            and v.severity == ViolationSeverity.CRITICAL
        ]
        
        if len(recent_critical) >= self.escalation_thresholds["critical_violations_per_hour"]:
            logger.error(
                f"Automatic escalation: {len(recent_critical)} critical violations in 1 hour"
            )
            self.activate_emergency_protocol(
                level=EmergencyLevel.LEVEL_2,
                triggered_by="automatic_escalation",
                reason=f"{len(recent_critical)} critical violations in 1 hour",
                affected_systems=["all"]
            )
            return
        
        # Count systemic violations in last day
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        recent_systemic = [
            v for v in recent_violations
            if v.detected_at >= one_day_ago
            and v.scope == ViolationScope.SYSTEMIC
        ]
        
        if len(recent_systemic) >= self.escalation_thresholds["systemic_violations_per_day"]:
            logger.error(
                f"Automatic escalation: {len(recent_systemic)} systemic violations in 24 hours"
            )
            self.activate_emergency_protocol(
                level=EmergencyLevel.LEVEL_1,
                triggered_by="automatic_escalation",
                reason=f"{len(recent_systemic)} systemic violations in 24 hours",
                affected_systems=["all"]
            )
    
    def mandate_security_patch(
        self,
        guardian_id: str,
        patch_description: str,
        affected_systems: List[str],
        deadline: datetime
    ) -> Dict[str, Any]:
        """
        Guardian can mandate a security patch.
        
        This is used for critical security issues that need immediate attention.
        """
        guardian = self._get_guardian(guardian_id)
        
        if not guardian.active:
            raise ValueError(f"Guardian not active: {guardian_id}")
        
        mandate = {
            "mandate_id": f"PATCH-{int(datetime.utcnow().timestamp())}",
            "guardian_id": guardian_id,
            "patch_description": patch_description,
            "affected_systems": affected_systems,
            "mandated_at": datetime.utcnow(),
            "deadline": deadline,
            "status": "active"
        }
        
        logger.critical(
            f"Security patch mandated by {guardian.name}: {patch_description}"
        )
        
        return mandate
    
    def override_decision(
        self,
        guardian_id: str,
        original_decision: ConstitutionalDecision,
        override_rationale: str
    ) -> ConstitutionalDecision:
        """
        Guardian can override a decision (with full audit trail).
        
        This is a last resort and is fully logged.
        """
        guardian = self._get_guardian(guardian_id)
        
        if not guardian.active:
            raise ValueError(f"Guardian not active: {guardian_id}")
        
        logger.critical(
            f"DECISION OVERRIDE by {guardian.name}: {override_rationale}"
        )
        
        # Create overridden decision
        overridden = ConstitutionalDecision(
            permitted=not original_decision.permitted,  # Flip decision
            rationale=f"[GUARDIAN OVERRIDE by {guardian.name}] {override_rationale}",
            violated_invariants=original_decision.violated_invariants,
            severity=ViolationSeverity.CRITICAL,  # Mark as critical for visibility
            remediation_suggestions=[
                f"Guardian override: {override_rationale}",
                "Review this decision in next council meeting"
            ],
            constitutional_basis=[
                "Guardian Council Override Authority"
            ] + original_decision.constitutional_basis,
            reversible=True,  # Overrides are always reversible
            timestamp=datetime.utcnow()
        )
        
        return overridden
    
    def _get_guardian(self, guardian_id: str) -> Guardian:
        """Get guardian by ID"""
        for guardian in self.guardians:
            if guardian.guardian_id == guardian_id:
                return guardian
        raise ValueError(f"Guardian not found: {guardian_id}")
    
    def _get_protocol(self, protocol_id: str) -> EmergencyProtocol:
        """Get emergency protocol by ID"""
        for protocol in self.emergency_protocols:
            if protocol.protocol_id == protocol_id:
                return protocol
        raise ValueError(f"Protocol not found: {protocol_id}")
    
    def get_active_vetoes(self) -> List[VetoDecision]:
        """Get all active (non-expired) vetoes"""
        now = datetime.utcnow()
        return [
            v for v in self.vetoes
            if v.expires_at is None or v.expires_at > now
        ]
    
    def get_veto_statistics(self) -> Dict[str, Any]:
        """Get veto statistics"""
        if not self.vetoes:
            return {"total_vetoes": 0}
        
        total = len(self.vetoes)
        by_reason = {}
        
        for veto in self.vetoes:
            reason = veto.reason.value
            by_reason[reason] = by_reason.get(reason, 0) + 1
        
        active = len(self.get_active_vetoes())
        
        return {
            "total_vetoes": total,
            "active_vetoes": active,
            "by_reason": by_reason
        }
    
    def get_emergency_history(self) -> List[EmergencyProtocol]:
        """Get all emergency protocols"""
        return self.emergency_protocols
    
    def get_current_emergency_status(self) -> Dict[str, Any]:
        """Get current emergency status"""
        active_protocols = [
            p for p in self.emergency_protocols
            if p.resolved_at is None
        ]
        
        return {
            "current_level": self.current_emergency_level.value,
            "active_protocols": len(active_protocols),
            "active_vetoes": len(self.get_active_vetoes()),
            "guardian_count": len([g for g in self.guardians if g.active])
        }
