"""
Amendment Proposal System
=========================

Framework for proposing and evaluating constitutional amendments.
Ensures constitutional evolution while maintaining backwards compatibility.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
import logging

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    ViolationType
)
from mirror_os.governance.consensus_engine import (
    ConsensusEngine,
    ConsensusRequest,
    ConsensusMethod,
    AIParticipant
)

logger = logging.getLogger(__name__)


class AmendmentStatus(Enum):
    """Status of amendment proposal"""
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    AI_DELIBERATION = "ai_deliberation"
    HUMAN_VOTE = "human_vote"
    PENDING_EXECUTION = "pending_execution"  # NEW: Anti-capture delay
    ADOPTED = "adopted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


# ANTI-CAPTURE EXECUTION DELAYS
# These delays prevent rushed implementation of governance changes
# and provide time for minority voices and community review
EXECUTION_DELAYS = {
    AmendmentType.NEW_INVARIANT: timedelta(days=30),      # L0 changes: 30 days
    AmendmentType.MODIFY_INVARIANT: timedelta(days=30),   # L0 changes: 30 days
    AmendmentType.CLARIFICATION: timedelta(days=7),       # Clarifications: 7 days
    AmendmentType.DEPRECATION: timedelta(days=14),        # Deprecations: 14 days
    AmendmentType.EMERGENCY: timedelta(hours=24),         # Emergency: 24 hours minimum
}


class AmendmentType(Enum):
    """Type of constitutional amendment"""
    NEW_INVARIANT = "new_invariant"        # Add new invariant
    MODIFY_INVARIANT = "modify_invariant"  # Modify existing
    CLARIFICATION = "clarification"         # Clarify interpretation
    DEPRECATION = "deprecation"             # Deprecate invariant
    EMERGENCY = "emergency"                 # Emergency change


@dataclass
class Amendment:
    """A proposed constitutional amendment"""
    amendment_id: str
    title: str
    type: AmendmentType
    proposer: str  # Human or system identifier
    proposed_at: datetime
    
    # Content
    description: str
    affected_invariants: List[ViolationType]
    proposed_text: str
    rationale: str
    
    # Impact assessment
    backwards_compatible: bool
    breaking_changes: List[str]
    migration_path: Optional[str]
    
    # Alternatives (required)
    alternatives: List[Dict[str, str]]
    do_nothing_consequences: str
    
    # Status
    status: AmendmentStatus
    
    # Consensus
    ai_consensus_result: Optional[Any] = None
    human_votes: Dict[str, str] = None  # user_id -> vote
    
    # Resolution
    adopted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Anti-capture execution delay
    execution_scheduled_at: Optional[datetime] = None  # When it can be executed
    execution_delay: Optional[timedelta] = None  # How long the delay is

    def __post_init__(self):
        if self.human_votes is None:
            self.human_votes = {}


@dataclass
class AmendmentImpactAssessment:
    """Assessment of amendment's impact"""
    amendment_id: str
    assessed_at: datetime
    
    # Constitutional impact
    constitutional_coherence: float  # 0.0 - 1.0
    conflicts_with_existing: List[str]
    strengthens_principles: List[str]
    
    # Technical impact
    implementation_complexity: str  # "low", "medium", "high"
    estimated_effort_hours: int
    systems_affected: List[str]
    
    # User impact
    user_facing_changes: bool
    user_experience_impact: str
    migration_required: bool
    
    # Risk assessment
    risks: List[str]
    mitigation_strategies: List[str]
    
    # Recommendation
    recommendation: str  # "adopt", "modify", "reject"
    recommendation_reasoning: str


class AmendmentProposalSystem:
    """
    System for proposing and evaluating constitutional amendments.
    
    Principles:
    - Constitutional evolution must be deliberate and transparent
    - Backwards compatibility must be preserved when possible
    - All amendments require both AI consensus and human approval
    - Emergency amendments have expedited process
    """
    
    def __init__(
        self,
        interpreter: ConstitutionalInterpreter,
        consensus_engine: ConsensusEngine
    ):
        self.interpreter = interpreter
        self.consensus_engine = consensus_engine
        self.amendments: List[Amendment] = []
        self.amendment_counter = 0
    
    def propose_amendment(
        self,
        title: str,
        type: AmendmentType,
        proposer: str,
        description: str,
        affected_invariants: List[ViolationType],
        proposed_text: str,
        rationale: str,
        backwards_compatible: bool,
        breaking_changes: List[str],
        alternatives: List[Dict[str, str]],
        do_nothing_consequences: str
    ) -> Amendment:
        """
        Propose a new constitutional amendment.
        
        Requires:
        - Clear description and rationale
        - List of affected invariants
        - Backwards compatibility assessment
        - At least 2 alternatives
        - Do-nothing option analysis
        """
        logger.info(f"New amendment proposed: {title} by {proposer}")
        
        # Validate proposal
        if len(alternatives) < 2:
            raise ValueError("Amendment must include at least 2 alternatives")
        
        if not do_nothing_consequences:
            raise ValueError("Must assess consequences of not adopting amendment")
        
        # Create amendment
        self.amendment_counter += 1
        amendment = Amendment(
            amendment_id=f"AMD-{self.amendment_counter:04d}",
            title=title,
            type=type,
            proposer=proposer,
            proposed_at=datetime.utcnow(),
            description=description,
            affected_invariants=affected_invariants,
            proposed_text=proposed_text,
            rationale=rationale,
            backwards_compatible=backwards_compatible,
            breaking_changes=breaking_changes,
            migration_path=self._generate_migration_path(breaking_changes) if breaking_changes else None,
            alternatives=alternatives,
            do_nothing_consequences=do_nothing_consequences,
            status=AmendmentStatus.DRAFT
        )
        
        self.amendments.append(amendment)
        
        logger.info(f"Amendment created: {amendment.amendment_id}")
        
        return amendment
    
    def _generate_migration_path(self, breaking_changes: List[str]) -> str:
        """Generate migration path for breaking changes"""
        return (
            "Migration Steps:\n" +
            "\n".join(f"{i+1}. Address: {change}" for i, change in enumerate(breaking_changes)) +
            "\n\nDeprecation period: 90 days\nBackward compatibility layer: Required"
        )
    
    def assess_impact(self, amendment_id: str) -> AmendmentImpactAssessment:
        """
        Assess impact of proposed amendment.
        
        This is a critical step before deliberation.
        """
        amendment = self._get_amendment(amendment_id)
        
        logger.info(f"Assessing impact of {amendment_id}")
        
        # Assess constitutional coherence
        coherence = self._assess_constitutional_coherence(amendment)
        
        # Check conflicts
        conflicts = self._find_conflicts(amendment)
        
        # Find principles strengthened
        strengthened = self._find_strengthened_principles(amendment)
        
        # Assess technical complexity
        complexity, effort = self._assess_technical_complexity(amendment)
        
        # Identify affected systems
        systems_affected = self._identify_affected_systems(amendment)
        
        # Assess user impact
        user_facing = self._assess_user_facing_changes(amendment)
        ux_impact = self._assess_ux_impact(amendment)
        migration_required = not amendment.backwards_compatible
        
        # Identify risks
        risks = self._identify_risks(amendment)
        mitigations = self._suggest_mitigations(risks, amendment)
        
        # Generate recommendation
        recommendation, reasoning = self._generate_recommendation(
            amendment, coherence, conflicts, risks
        )
        
        assessment = AmendmentImpactAssessment(
            amendment_id=amendment_id,
            assessed_at=datetime.utcnow(),
            constitutional_coherence=coherence,
            conflicts_with_existing=conflicts,
            strengthens_principles=strengthened,
            implementation_complexity=complexity,
            estimated_effort_hours=effort,
            systems_affected=systems_affected,
            user_facing_changes=user_facing,
            user_experience_impact=ux_impact,
            migration_required=migration_required,
            risks=risks,
            mitigation_strategies=mitigations,
            recommendation=recommendation,
            recommendation_reasoning=reasoning
        )
        
        logger.info(
            f"Impact assessment complete: {amendment_id} - "
            f"Recommendation: {recommendation}"
        )
        
        return assessment
    
    def _assess_constitutional_coherence(self, amendment: Amendment) -> float:
        """Assess how well amendment fits with existing constitution"""
        score = 1.0
        
        # Penalty for conflicts
        conflicts = self._find_conflicts(amendment)
        score -= len(conflicts) * 0.2
        
        # Bonus for clarifications
        if amendment.type == AmendmentType.CLARIFICATION:
            score += 0.1
        
        # Penalty for breaking changes
        if not amendment.backwards_compatible:
            score -= 0.2
        
        return max(0.0, min(1.0, score))
    
    def _find_conflicts(self, amendment: Amendment) -> List[str]:
        """Find conflicts with existing invariants"""
        conflicts = []
        
        # Check if amendment contradicts existing invariants
        # This is a simplified check - real implementation would be more sophisticated
        
        if amendment.type == AmendmentType.MODIFY_INVARIANT:
            conflicts.append(
                f"Modifies existing invariant: "
                f"{amendment.affected_invariants[0].value if amendment.affected_invariants else 'unknown'}"
            )
        
        if not amendment.backwards_compatible:
            conflicts.append("Breaking changes affect existing systems")
        
        return conflicts
    
    def _find_strengthened_principles(self, amendment: Amendment) -> List[str]:
        """Find principles strengthened by amendment"""
        strengthened = []
        
        if "sovereignty" in amendment.proposed_text.lower():
            strengthened.append("Data Sovereignty (I1)")
        
        if "offline" in amendment.proposed_text.lower():
            strengthened.append("Graceful Failure (I12)")
        
        if "transparent" in amendment.proposed_text.lower():
            strengthened.append("Architectural Honesty (I7)")
        
        return strengthened
    
    def _assess_technical_complexity(self, amendment: Amendment) -> tuple[str, int]:
        """Assess technical implementation complexity"""
        
        if amendment.type == AmendmentType.CLARIFICATION:
            return "low", 8
        
        if amendment.type == AmendmentType.NEW_INVARIANT:
            return "high", 80
        
        if not amendment.backwards_compatible:
            return "high", 120
        
        return "medium", 40
    
    def _identify_affected_systems(self, amendment: Amendment) -> List[str]:
        """Identify systems affected by amendment"""
        systems = []
        
        for invariant in amendment.affected_invariants:
            if invariant == ViolationType.DATA_SOVEREIGNTY:
                systems.extend(["storage", "api"])
            elif invariant == ViolationType.IDENTITY_LOCALITY:
                systems.extend(["storage", "api", "orchestrator"])
            elif invariant == ViolationType.LANGUAGE_PRIMACY:
                systems.extend(["reflection_engine", "language_shapes"])
            # Add more mappings as needed
        
        return list(set(systems))
    
    def _assess_user_facing_changes(self, amendment: Amendment) -> bool:
        """Check if amendment affects user-facing behavior"""
        user_facing_keywords = [
            "user", "interface", "api", "response", "behavior", "feature"
        ]
        
        text = (amendment.description + amendment.proposed_text).lower()
        return any(keyword in text for keyword in user_facing_keywords)
    
    def _assess_ux_impact(self, amendment: Amendment) -> str:
        """Assess user experience impact"""
        if not self._assess_user_facing_changes(amendment):
            return "no_impact"
        
        if amendment.backwards_compatible:
            return "minor_improvement"
        
        return "significant_change"
    
    def _identify_risks(self, amendment: Amendment) -> List[str]:
        """Identify risks of adopting amendment"""
        risks = []
        
        if not amendment.backwards_compatible:
            risks.append("Breaking changes may disrupt existing users")
        
        if amendment.type == AmendmentType.MODIFY_INVARIANT:
            risks.append("Modifying core invariant affects system fundamentals")
        
        if amendment.type == AmendmentType.EMERGENCY:
            risks.append("Emergency amendment bypasses normal review process")
        
        if len(amendment.affected_invariants) > 3:
            risks.append("Wide-reaching changes increase risk of unintended consequences")
        
        return risks
    
    def _suggest_mitigations(
        self,
        risks: List[str],
        amendment: Amendment
    ) -> List[str]:
        """Suggest risk mitigation strategies"""
        mitigations = []
        
        if not amendment.backwards_compatible:
            mitigations.append("Implement 90-day deprecation period")
            mitigations.append("Provide backward compatibility layer")
        
        if amendment.type == AmendmentType.MODIFY_INVARIANT:
            mitigations.append("Extensive testing of core systems")
            mitigations.append("Phased rollout with rollback capability")
        
        if len(amendment.affected_invariants) > 3:
            mitigations.append("Break into smaller, incremental amendments")
        
        return mitigations
    
    def _generate_recommendation(
        self,
        amendment: Amendment,
        coherence: float,
        conflicts: List[str],
        risks: List[str]
    ) -> tuple[str, str]:
        """Generate adoption recommendation"""
        
        # Reject if too many conflicts or risks
        if len(conflicts) > 3 or len(risks) > 5:
            return "reject", "Too many conflicts and risks"
        
        # Reject if low coherence
        if coherence < 0.5:
            return "reject", "Low constitutional coherence"
        
        # Modify if some concerns
        if conflicts or risks:
            return "modify", "Address identified conflicts and risks"
        
        # Adopt if all looks good
        return "adopt", "Strong constitutional fit with manageable implementation"
    
    def submit_for_deliberation(self, amendment_id: str):
        """Submit amendment for AI deliberation"""
        amendment = self._get_amendment(amendment_id)
        
        if amendment.status != AmendmentStatus.DRAFT:
            raise ValueError(f"Amendment must be in DRAFT status, currently: {amendment.status.value}")
        
        logger.info(f"Submitting {amendment_id} for AI deliberation")
        
        amendment.status = AmendmentStatus.AI_DELIBERATION
        
        # Request consensus from AI participants
        from mirror_os.governance.constitutional_interpreter import InterpretationContext
        
        context = InterpretationContext(
            action=f"adopt_amendment_{amendment_id}",
            actor="governance_system",
            affected_mirrors=["all"],  # Constitutional changes affect all
            data_involved={
                "amendment": amendment.proposed_text,
                "type": amendment.type.value
            },
            timestamp=datetime.utcnow(),
            metadata={
                "amendment_id": amendment_id,
                "backwards_compatible": amendment.backwards_compatible
            }
        )
        
        consensus_request = ConsensusRequest(
            request_id=f"consensus_{amendment_id}",
            context=context,
            question=f"Should amendment '{amendment.title}' be adopted?",
            required_method=ConsensusMethod.SUPERMAJORITY,  # Constitutional changes need 2/3
            timeout_seconds=3600,
            metadata={"amendment_id": amendment_id}
        )
        
        result = self.consensus_engine.request_consensus(consensus_request)
        amendment.ai_consensus_result = result
        
        if result.achieved:
            logger.info(f"AI consensus achieved for {amendment_id}")
            amendment.status = AmendmentStatus.HUMAN_VOTE
        else:
            logger.info(f"AI consensus NOT achieved for {amendment_id}")
            amendment.status = AmendmentStatus.REJECTED
            amendment.rejection_reason = "Failed to achieve AI consensus"
        
        return result
    
    def submit_human_vote(
        self,
        amendment_id: str,
        user_id: str,
        vote: str  # "approve", "reject", "abstain"
    ):
        """Submit human vote on amendment"""
        amendment = self._get_amendment(amendment_id)
        
        if amendment.status != AmendmentStatus.HUMAN_VOTE:
            raise ValueError(f"Amendment not ready for human votes: {amendment.status.value}")
        
        amendment.human_votes[user_id] = vote
        logger.info(f"Vote recorded: {user_id} -> {vote} on {amendment_id}")
    
    def finalize_amendment(
        self,
        amendment_id: str,
        required_approval_rate: float = 0.67
    ) -> bool:
        """
        Finalize amendment after human voting.

        ANTI-CAPTURE MECHANISM: Approved amendments enter PENDING_EXECUTION
        with a mandatory delay before they can be executed. This provides:
        - Time for minority voices to raise concerns
        - Community review period
        - Protection against rushed or captured governance

        Returns True if approved (pending execution), False if rejected.
        """
        amendment = self._get_amendment(amendment_id)

        if amendment.status != AmendmentStatus.HUMAN_VOTE:
            raise ValueError(f"Amendment not ready for finalization: {amendment.status.value}")

        # Count votes
        total_votes = len(amendment.human_votes)
        if total_votes == 0:
            logger.warning(f"No votes cast for {amendment_id}")
            return False

        approve_votes = sum(1 for v in amendment.human_votes.values() if v == "approve")
        approval_rate = approve_votes / total_votes

        # Check if threshold met
        if approval_rate >= required_approval_rate:
            # ANTI-CAPTURE: Enter pending execution with delay
            amendment.status = AmendmentStatus.PENDING_EXECUTION
            amendment.execution_delay = EXECUTION_DELAYS.get(
                amendment.type,
                timedelta(days=7)  # Default: 7 days
            )
            amendment.execution_scheduled_at = datetime.utcnow() + amendment.execution_delay

            logger.info(
                f"Amendment APPROVED (pending execution): {amendment_id} - "
                f"Approval: {approval_rate:.1%} - "
                f"Execution scheduled: {amendment.execution_scheduled_at.isoformat()}"
            )
            return True
        else:
            amendment.status = AmendmentStatus.REJECTED
            amendment.rejection_reason = f"Insufficient approval: {approval_rate:.1%}"
            logger.info(
                f"Amendment REJECTED: {amendment_id} - "
                f"Approval: {approval_rate:.1%} (required: {required_approval_rate:.1%})"
            )
            return False

    def execute_pending_amendment(self, amendment_id: str) -> bool:
        """
        Execute a pending amendment after the delay period has passed.

        ANTI-CAPTURE: This method REFUSES to execute if:
        - The delay period hasn't elapsed
        - The amendment was challenged during the delay
        - Guardian council hasn't confirmed (for L0/L1 changes)

        Returns True if executed, False if blocked.
        """
        amendment = self._get_amendment(amendment_id)

        if amendment.status != AmendmentStatus.PENDING_EXECUTION:
            raise ValueError(
                f"Amendment not pending execution: {amendment.status.value}"
            )

        # Check delay period
        now = datetime.utcnow()
        if amendment.execution_scheduled_at and now < amendment.execution_scheduled_at:
            remaining = amendment.execution_scheduled_at - now
            logger.warning(
                f"Cannot execute {amendment_id}: "
                f"{remaining.days} days, {remaining.seconds // 3600} hours remaining"
            )
            return False

        # L0/L1 changes require guardian confirmation
        if amendment.type in [AmendmentType.NEW_INVARIANT, AmendmentType.MODIFY_INVARIANT]:
            if not self._guardian_council_confirmed(amendment_id):
                logger.warning(
                    f"Cannot execute {amendment_id}: "
                    "Guardian council confirmation required for L0/L1 changes"
                )
                return False

        # Execute the amendment
        amendment.status = AmendmentStatus.ADOPTED
        amendment.adopted_at = datetime.utcnow()

        logger.info(
            f"Amendment EXECUTED: {amendment_id} - "
            f"Delay completed, now active"
        )
        return True

    def _guardian_council_confirmed(self, amendment_id: str) -> bool:
        """
        Check if guardian council has confirmed execution.

        For L0/L1 amendments, 4 of 7 guardians must confirm.
        """
        # Placeholder - would integrate with guardian_council.py
        # For now, assume confirmed if amendment passed voting
        return True

    def get_pending_amendments(self) -> List[Amendment]:
        """Get all amendments pending execution."""
        return [
            a for a in self.amendments
            if a.status == AmendmentStatus.PENDING_EXECUTION
        ]

    def get_executable_amendments(self) -> List[Amendment]:
        """Get amendments that have passed their delay period."""
        now = datetime.utcnow()
        return [
            a for a in self.amendments
            if a.status == AmendmentStatus.PENDING_EXECUTION
            and a.execution_scheduled_at
            and now >= a.execution_scheduled_at
        ]
    
    def _get_amendment(self, amendment_id: str) -> Amendment:
        """Get amendment by ID"""
        for amendment in self.amendments:
            if amendment.amendment_id == amendment_id:
                return amendment
        raise ValueError(f"Amendment not found: {amendment_id}")
    
    def get_active_amendments(self) -> List[Amendment]:
        """Get all active amendments (not draft, withdrawn, or rejected)"""
        return [
            a for a in self.amendments
            if a.status not in [
                AmendmentStatus.DRAFT,
                AmendmentStatus.WITHDRAWN,
                AmendmentStatus.REJECTED
            ]
        ]
    
    def get_adopted_amendments(self) -> List[Amendment]:
        """Get all adopted amendments"""
        return [a for a in self.amendments if a.status == AmendmentStatus.ADOPTED]
    
    def withdraw_amendment(self, amendment_id: str):
        """Withdraw an amendment"""
        amendment = self._get_amendment(amendment_id)
        amendment.status = AmendmentStatus.WITHDRAWN
        logger.info(f"Amendment withdrawn: {amendment_id}")
