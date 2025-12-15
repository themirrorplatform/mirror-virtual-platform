"""
Consensus Engine
================

Implements multi-AI consensus mechanisms for governance decisions.
Multiple AI perspectives deliberate to reach constitutional consensus.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
import logging

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    InterpretationContext,
    ConstitutionalDecision,
    ViolationType,
    ViolationSeverity
)

logger = logging.getLogger(__name__)


class ConsensusMethod(Enum):
    """Methods for reaching consensus"""
    UNANIMOUS = "unanimous"          # All must agree
    SUPERMAJORITY = "supermajority"  # 2/3 must agree
    MAJORITY = "majority"            # 50%+1 must agree
    WEIGHTED = "weighted"            # Weighted by AI capability


class AIRole(Enum):
    """Roles AI participants can play"""
    CONSTITUTIONAL_SCHOLAR = "constitutional_scholar"  # Interprets constitution
    SAFETY_OFFICER = "safety_officer"                  # Focuses on harm prevention
    INNOVATION_ADVOCATE = "innovation_advocate"        # Considers evolution
    USER_REPRESENTATIVE = "user_representative"        # Represents user interests
    TECHNICAL_ARCHITECT = "technical_architect"        # Technical feasibility


@dataclass
class AIParticipant:
    """An AI participant in consensus process"""
    participant_id: str
    name: str
    role: AIRole
    model: str  # e.g., "claude-3-sonnet", "gpt-4", "llama-3"
    weight: float  # For weighted voting
    interpreter: ConstitutionalInterpreter


@dataclass
class ConsensusRequest:
    """Request for consensus decision"""
    request_id: str
    context: InterpretationContext
    question: str
    required_method: ConsensusMethod
    timeout_seconds: int
    metadata: Dict[str, Any]


@dataclass
class AIPosition:
    """One AI's position on a question"""
    participant_id: str
    role: AIRole
    decision: ConstitutionalDecision
    reasoning: str
    confidence: float  # 0.0 - 1.0
    timestamp: datetime


@dataclass
class ConsensusResult:
    """Result of consensus process"""
    request_id: str
    achieved: bool
    consensus_method: ConsensusMethod
    positions: List[AIPosition]
    final_decision: Optional[ConstitutionalDecision]
    agreement_level: float  # 0.0 - 1.0
    disagreements: List[str]
    synthesis: str  # Synthesized reasoning
    timestamp: datetime


class ConsensusEngine:
    """
    Multi-AI consensus engine for governance decisions.
    
    Key principle: Multiple AI perspectives reduce bias and increase
    constitutional fidelity. No single AI should have unilateral power.
    """
    
    def __init__(self):
        self.participants: List[AIParticipant] = []
        self.consensus_history: List[ConsensusResult] = []
        
        # Consensus thresholds
        self.thresholds = {
            ConsensusMethod.UNANIMOUS: 1.0,
            ConsensusMethod.SUPERMAJORITY: 0.67,
            ConsensusMethod.MAJORITY: 0.51,
            ConsensusMethod.WEIGHTED: 0.60  # Weighted threshold
        }
    
    def add_participant(self, participant: AIParticipant):
        """Add AI participant to consensus process"""
        self.participants.append(participant)
        logger.info(
            f"Added participant: {participant.name} ({participant.role.value})"
        )
    
    def request_consensus(self, request: ConsensusRequest) -> ConsensusResult:
        """
        Request consensus from all AI participants.
        
        This is the core multi-AI deliberation process.
        """
        logger.info(
            f"Requesting consensus: {request.request_id} - "
            f"Method: {request.required_method.value}"
        )
        
        if not self.participants:
            raise ValueError("No AI participants available for consensus")
        
        # Collect positions from all participants
        positions: List[AIPosition] = []
        
        for participant in self.participants:
            position = self._get_participant_position(participant, request)
            positions.append(position)
        
        # Check if consensus achieved
        achieved, agreement_level = self._check_consensus(
            positions,
            request.required_method
        )
        
        # Synthesize final decision
        final_decision = None
        if achieved:
            final_decision = self._synthesize_decision(positions)
        
        # Identify disagreements
        disagreements = self._identify_disagreements(positions)
        
        # Generate synthesis explanation
        synthesis = self._generate_synthesis(positions, achieved)
        
        # Create result
        result = ConsensusResult(
            request_id=request.request_id,
            achieved=achieved,
            consensus_method=request.required_method,
            positions=positions,
            final_decision=final_decision,
            agreement_level=agreement_level,
            disagreements=disagreements,
            synthesis=synthesis,
            timestamp=datetime.utcnow()
        )
        
        # Store in history
        self.consensus_history.append(result)
        
        logger.info(
            f"Consensus {'ACHIEVED' if achieved else 'NOT ACHIEVED'} - "
            f"Agreement: {agreement_level:.1%}"
        )
        
        return result
    
    def _get_participant_position(
        self,
        participant: AIParticipant,
        request: ConsensusRequest
    ) -> AIPosition:
        """Get one participant's position"""
        
        # Get constitutional interpretation
        decision = participant.interpreter.interpret(request.context)
        
        # Generate reasoning based on role
        reasoning = self._generate_role_based_reasoning(
            participant.role,
            decision,
            request
        )
        
        # Calculate confidence based on clarity of decision
        confidence = self._calculate_confidence(decision)
        
        return AIPosition(
            participant_id=participant.participant_id,
            role=participant.role,
            decision=decision,
            reasoning=reasoning,
            confidence=confidence,
            timestamp=datetime.utcnow()
        )
    
    def _generate_role_based_reasoning(
        self,
        role: AIRole,
        decision: ConstitutionalDecision,
        request: ConsensusRequest
    ) -> str:
        """Generate reasoning from perspective of AI role"""
        
        if role == AIRole.CONSTITUTIONAL_SCHOLAR:
            return (
                f"From constitutional perspective: {decision.rationale}. "
                f"Constitutional basis: {', '.join(decision.constitutional_basis)}"
            )
        
        elif role == AIRole.SAFETY_OFFICER:
            harm_assessment = "no harm" if decision.permitted else "potential harm"
            return (
                f"Safety assessment: {harm_assessment}. "
                f"Severity: {decision.severity.value}. "
                f"Reversible: {decision.reversible}"
            )
        
        elif role == AIRole.INNOVATION_ADVOCATE:
            return (
                f"Innovation perspective: "
                f"{'Enables' if decision.permitted else 'Blocks'} evolution. "
                f"Precedent implications considered."
            )
        
        elif role == AIRole.USER_REPRESENTATIVE:
            return (
                f"User impact: {decision.rationale}. "
                f"Affects {len(request.context.affected_mirrors)} mirror(s). "
                f"User sovereignty {'preserved' if decision.permitted else 'at risk'}"
            )
        
        elif role == AIRole.TECHNICAL_ARCHITECT:
            return (
                f"Technical assessment: "
                f"{'Architecturally sound' if decision.permitted else 'Violates architecture'}. "
                f"Reversibility: {decision.reversible}"
            )
        
        return decision.rationale
    
    def _calculate_confidence(self, decision: ConstitutionalDecision) -> float:
        """Calculate confidence in decision"""
        
        # Start with base confidence
        confidence = 0.8
        
        # Higher confidence if decision is clear (no violations or severe violations)
        if not decision.violated_invariants:
            confidence = 0.95
        elif decision.severity == ViolationSeverity.CRITICAL:
            confidence = 0.95
        
        # Lower confidence for tension or soft violations (ambiguous)
        if decision.severity in [ViolationSeverity.TENSION, ViolationSeverity.SOFT]:
            confidence = 0.6
        
        # Higher confidence if there's clear constitutional basis
        if len(decision.constitutional_basis) > 0:
            confidence += 0.05
        
        # Higher confidence if remediation is clear
        if decision.remediation_suggestions:
            confidence += 0.05
        
        return min(1.0, confidence)
    
    def _check_consensus(
        self,
        positions: List[AIPosition],
        method: ConsensusMethod
    ) -> tuple[bool, float]:
        """Check if consensus is achieved"""
        
        if not positions:
            return False, 0.0
        
        # Count agreements (all positions with same permitted decision)
        permitted_count = sum(1 for p in positions if p.decision.permitted)
        blocked_count = sum(1 for p in positions if not p.decision.permitted)
        total = len(positions)
        
        if method == ConsensusMethod.UNANIMOUS:
            # All must agree
            achieved = (permitted_count == total) or (blocked_count == total)
            agreement = max(permitted_count, blocked_count) / total
        
        elif method == ConsensusMethod.SUPERMAJORITY:
            # 2/3 must agree
            agreement = max(permitted_count, blocked_count) / total
            achieved = agreement >= self.thresholds[ConsensusMethod.SUPERMAJORITY]
        
        elif method == ConsensusMethod.MAJORITY:
            # 50%+1 must agree
            agreement = max(permitted_count, blocked_count) / total
            achieved = agreement >= self.thresholds[ConsensusMethod.MAJORITY]
        
        elif method == ConsensusMethod.WEIGHTED:
            # Weighted by participant weight and confidence
            total_weight = 0.0
            permitted_weight = 0.0
            
            for position in positions:
                participant = next(
                    p for p in self.participants
                    if p.participant_id == position.participant_id
                )
                weight = participant.weight * position.confidence
                total_weight += weight
                
                if position.decision.permitted:
                    permitted_weight += weight
            
            if total_weight > 0:
                agreement = max(permitted_weight, total_weight - permitted_weight) / total_weight
            else:
                agreement = 0.0
            
            achieved = agreement >= self.thresholds[ConsensusMethod.WEIGHTED]
        
        else:
            achieved = False
            agreement = 0.0
        
        return achieved, agreement
    
    def _synthesize_decision(
        self,
        positions: List[AIPosition]
    ) -> ConstitutionalDecision:
        """Synthesize final decision from positions"""
        
        # Use majority decision
        permitted_count = sum(1 for p in positions if p.decision.permitted)
        blocked_count = len(positions) - permitted_count
        
        permitted = permitted_count > blocked_count
        
        # Collect all violated invariants
        all_violations = []
        for p in positions:
            all_violations.extend(p.decision.violated_invariants)
        
        # Find most severe severity mentioned
        severities = [p.decision.severity for p in positions]
        max_severity = max(severities, key=lambda s: s.value) if severities else ViolationSeverity.BENIGN
        
        # Collect all remediation suggestions
        all_remediations = []
        for p in positions:
            all_remediations.extend(p.decision.remediation_suggestions)
        
        # Collect constitutional basis
        all_basis = []
        for p in positions:
            all_basis.extend(p.decision.constitutional_basis)
        
        # Check reversibility (must be reversible by all)
        reversible = all(p.decision.reversible for p in positions)
        
        # Synthesize rationale
        rationale = (
            f"Consensus reached: {'PERMIT' if permitted else 'BLOCK'}. "
            f"{len(positions)} AI participants deliberated. "
            f"{'No violations' if permitted else f'Violations: {len(set(all_violations))}'}"
        )
        
        return ConstitutionalDecision(
            permitted=permitted,
            rationale=rationale,
            violated_invariants=list(set(all_violations)),
            severity=max_severity,
            remediation_suggestions=list(set(all_remediations)),
            constitutional_basis=list(set(all_basis)),
            reversible=reversible,
            timestamp=datetime.utcnow()
        )
    
    def _identify_disagreements(self, positions: List[AIPosition]) -> List[str]:
        """Identify points of disagreement"""
        disagreements = []
        
        # Check permit/block disagreements
        permitted_roles = [p.role.value for p in positions if p.decision.permitted]
        blocked_roles = [p.role.value for p in positions if not p.decision.permitted]
        
        if permitted_roles and blocked_roles:
            disagreements.append(
                f"Permit/Block split: {', '.join(permitted_roles)} permit; "
                f"{', '.join(blocked_roles)} block"
            )
        
        # Check severity disagreements
        severity_groups = {}
        for p in positions:
            severity = p.decision.severity.value
            if severity not in severity_groups:
                severity_groups[severity] = []
            severity_groups[severity].append(p.role.value)
        
        if len(severity_groups) > 1:
            severity_desc = "; ".join(
                f"{sev}: {', '.join(roles)}"
                for sev, roles in severity_groups.items()
            )
            disagreements.append(f"Severity assessment varies: {severity_desc}")
        
        return disagreements
    
    def _generate_synthesis(
        self,
        positions: List[AIPosition],
        achieved: bool
    ) -> str:
        """Generate synthesis of deliberation"""
        
        if achieved:
            synthesis = f"Consensus achieved among {len(positions)} AI participants. "
        else:
            synthesis = f"No consensus among {len(positions)} AI participants. "
        
        # Summarize positions
        permitted_count = sum(1 for p in positions if p.decision.permitted)
        blocked_count = len(positions) - permitted_count
        
        synthesis += f"Positions: {permitted_count} permit, {blocked_count} block. "
        
        # Summarize key reasoning
        key_points = []
        for position in positions:
            if position.confidence > 0.8:
                key_points.append(f"{position.role.value}: {position.reasoning[:100]}")
        
        if key_points:
            synthesis += "Key reasoning: " + "; ".join(key_points[:3])
        
        return synthesis
    
    def get_consensus_statistics(self) -> Dict[str, Any]:
        """Get statistics on consensus decisions"""
        if not self.consensus_history:
            return {"total_requests": 0}
        
        total = len(self.consensus_history)
        achieved = sum(1 for r in self.consensus_history if r.achieved)
        
        # Average agreement level
        avg_agreement = sum(r.agreement_level for r in self.consensus_history) / total
        
        # By method
        by_method = {}
        for result in self.consensus_history:
            method = result.consensus_method.value
            if method not in by_method:
                by_method[method] = {"total": 0, "achieved": 0}
            by_method[method]["total"] += 1
            if result.achieved:
                by_method[method]["achieved"] += 1
        
        return {
            "total_requests": total,
            "achieved_count": achieved,
            "achievement_rate": achieved / total,
            "average_agreement": avg_agreement,
            "by_method": by_method,
            "participant_count": len(self.participants)
        }
    
    def get_participant_statistics(
        self,
        participant_id: str
    ) -> Dict[str, Any]:
        """Get statistics for specific participant"""
        
        positions_by_participant = []
        for result in self.consensus_history:
            for position in result.positions:
                if position.participant_id == participant_id:
                    positions_by_participant.append(position)
        
        if not positions_by_participant:
            return {"participant_id": participant_id, "positions": 0}
        
        total = len(positions_by_participant)
        permitted = sum(1 for p in positions_by_participant if p.decision.permitted)
        avg_confidence = sum(p.confidence for p in positions_by_participant) / total
        
        return {
            "participant_id": participant_id,
            "total_positions": total,
            "permit_rate": permitted / total,
            "average_confidence": avg_confidence
        }
