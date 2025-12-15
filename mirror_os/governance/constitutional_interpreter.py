"""
Constitutional Interpreter
=========================

Dynamically interprets and applies The Mirror's 14 constitutional invariants.
This is the core of the governance system's decision-making process.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)


class ViolationType(Enum):
    """Types of constitutional violations"""
    DATA_SOVEREIGNTY = "data_sovereignty"          # I1
    IDENTITY_LOCALITY = "identity_locality"        # I2
    LANGUAGE_PRIMACY = "language_primacy"          # I3
    PRESCRIPTIVE = "prescriptive"                  # I4
    SEMANTIC_TENSION = "semantic_tension"          # I5
    EVOLUTIONARY_ARC = "evolutionary_arc"          # I6
    ARCHITECTURAL_DISHONESTY = "architectural_dishonesty"  # I7
    DISTRIBUTED_IDENTITY = "distributed_identity"  # I8
    DIAGNOSTIC = "diagnostic"                      # I9
    TEMPORAL_INCOHERENCE = "temporal_incoherence"  # I10
    CLOSED_INSPECTION = "closed_inspection"        # I11
    UNGRACEFUL_FAILURE = "ungraceful_failure"      # I12
    BEHAVIORAL_OPTIMIZATION = "behavioral_optimization"  # I13
    CROSS_IDENTITY_INFERENCE = "cross_identity_inference"  # I14


class ViolationSeverity(Enum):
    """Severity levels for violations"""
    BENIGN = "benign"          # Variation, not violation
    TENSION = "tension"        # Ambiguity needing clarification
    SOFT = "soft"              # Minor violation, correctable
    HARD = "hard"              # Clear violation, requires action
    CRITICAL = "critical"      # Constitutional threat, immediate response


@dataclass
class InterpretationContext:
    """Context for constitutional interpretation"""
    action: str
    actor: str  # "system", "ai_governor", "human", "external"
    affected_mirrors: List[str]
    data_involved: Dict[str, Any]
    timestamp: datetime
    metadata: Dict[str, Any]


@dataclass
class ConstitutionalDecision:
    """Result of constitutional interpretation"""
    permitted: bool
    rationale: str
    violated_invariants: List[ViolationType]
    severity: ViolationSeverity
    remediation_suggestions: List[str]
    constitutional_basis: List[str]  # Which clauses apply
    reversible: bool
    timestamp: datetime


class ConstitutionalInterpreter:
    """
    Interprets The Mirror's constitutional invariants.
    
    This is NOT a rules engine - it's an interpretive framework that:
    1. Understands the spirit of each invariant
    2. Applies context-sensitive reasoning
    3. Detects subtle violations
    4. Suggests constitutional remediation
    """
    
    def __init__(self):
        self.interpretation_history: List[ConstitutionalDecision] = []
        
        # Constitutional invariants with their core principles
        self.invariants = {
            ViolationType.DATA_SOVEREIGNTY: {
                "clause": "I1: Data Sovereignty",
                "principle": "Users own their data, offline-first by default",
                "checks": ["data_location", "user_control", "offline_capability"]
            },
            ViolationType.IDENTITY_LOCALITY: {
                "clause": "I2: Identity Locality",
                "principle": "Each identity exists in its own context, no cross-contamination",
                "checks": ["identity_isolation", "context_separation", "no_cross_reference"]
            },
            ViolationType.LANGUAGE_PRIMACY: {
                "clause": "I3: Language Primacy",
                "principle": "Language shapes encode meaning, not metrics",
                "checks": ["shape_detection", "no_reduction_to_metrics", "meaning_preservation"]
            },
            ViolationType.PRESCRIPTIVE: {
                "clause": "I4: Non-Prescriptive",
                "principle": "Mirror reflects, never prescribes or advises",
                "checks": ["no_should_must_ought", "no_recommendations", "reflective_stance"]
            },
            ViolationType.SEMANTIC_TENSION: {
                "clause": "I5: Semantic Tension",
                "principle": "Tensions between meanings are valuable, not problems",
                "checks": ["tension_detection", "no_resolution_pressure", "holding_space"]
            },
            ViolationType.EVOLUTIONARY_ARC: {
                "clause": "I6: Evolutionary Arc",
                "principle": "Change is tracked as evolution, not optimization",
                "checks": ["temporal_tracking", "quality_not_quantity", "narrative_coherence"]
            },
            ViolationType.ARCHITECTURAL_DISHONESTY: {
                "clause": "I7: Architectural Honesty",
                "principle": "System operations are transparent and logged",
                "checks": ["operation_logging", "no_hidden_processing", "explainability"]
            },
            ViolationType.DISTRIBUTED_IDENTITY: {
                "clause": "I8: Distributed Identity",
                "principle": "Identity is a graph, not a profile",
                "checks": ["graph_construction", "node_relationships", "no_centralization"]
            },
            ViolationType.DIAGNOSTIC: {
                "clause": "I9: Anti-Diagnosis",
                "principle": "No clinical framing, diagnostic language, or pathologizing",
                "checks": ["no_diagnosis_language", "no_clinical_terms", "disclaimer_presence"]
            },
            ViolationType.TEMPORAL_INCOHERENCE: {
                "clause": "I10: Temporal Coherence",
                "principle": "History is preserved with timestamps, no retroactive changes",
                "checks": ["timestamp_immutability", "history_preservation", "no_backdating"]
            },
            ViolationType.CLOSED_INSPECTION: {
                "clause": "I11: Open Inspection",
                "principle": "All code and operations are inspectable",
                "checks": ["source_availability", "operation_transparency", "no_obfuscation"]
            },
            ViolationType.UNGRACEFUL_FAILURE: {
                "clause": "I12: Graceful Failure",
                "principle": "System degrades gracefully, works offline",
                "checks": ["offline_capability", "degraded_mode", "no_hard_dependencies"]
            },
            ViolationType.BEHAVIORAL_OPTIMIZATION: {
                "clause": "I13: No Behavioral Optimization",
                "principle": "No engagement metrics, no optimization for usage",
                "checks": ["no_engagement_tracking", "no_growth_metrics", "no_virality"]
            },
            ViolationType.CROSS_IDENTITY_INFERENCE: {
                "clause": "I14: No Cross-Identity Inference",
                "principle": "Each mirror is independent, no aggregate learning",
                "checks": ["per_mirror_isolation", "no_pooled_learning", "no_cohort_analysis"]
            }
        }
    
    def interpret(self, context: InterpretationContext) -> ConstitutionalDecision:
        """
        Interpret whether an action is constitutional.
        
        This is the core governance decision function.
        """
        logger.info(f"Interpreting action: {context.action} by {context.actor}")
        
        violations = []
        severity = ViolationSeverity.BENIGN
        remediation = []
        constitutional_basis = []
        
        # Check each invariant
        for violation_type, invariant_def in self.invariants.items():
            check_result = self._check_invariant(context, violation_type, invariant_def)
            
            if check_result["violated"]:
                violations.append(violation_type)
                constitutional_basis.append(invariant_def["clause"])
                remediation.extend(check_result.get("remediation", []))
                
                # Update severity to highest found
                check_severity = ViolationSeverity[check_result.get("severity", "SOFT")]
                if check_severity.value > severity.value:
                    severity = check_severity
        
        # Construct decision
        permitted = len(violations) == 0 or severity == ViolationSeverity.BENIGN
        
        rationale = self._construct_rationale(context, violations, severity)
        
        decision = ConstitutionalDecision(
            permitted=permitted,
            rationale=rationale,
            violated_invariants=violations,
            severity=severity,
            remediation_suggestions=remediation,
            constitutional_basis=constitutional_basis,
            reversible=self._is_reversible(context, violations),
            timestamp=datetime.utcnow()
        )
        
        # Store in history
        self.interpretation_history.append(decision)
        
        logger.info(f"Decision: {'PERMIT' if permitted else 'BLOCK'} - {severity.value}")
        
        return decision
    
    def _check_invariant(
        self,
        context: InterpretationContext,
        violation_type: ViolationType,
        invariant_def: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check a specific invariant against the context"""
        
        # Dispatch to specific checker
        checker_map = {
            ViolationType.DATA_SOVEREIGNTY: self._check_data_sovereignty,
            ViolationType.IDENTITY_LOCALITY: self._check_identity_locality,
            ViolationType.LANGUAGE_PRIMACY: self._check_language_primacy,
            ViolationType.PRESCRIPTIVE: self._check_prescriptive,
            ViolationType.SEMANTIC_TENSION: self._check_semantic_tension,
            ViolationType.EVOLUTIONARY_ARC: self._check_evolutionary_arc,
            ViolationType.ARCHITECTURAL_DISHONESTY: self._check_architectural_honesty,
            ViolationType.DISTRIBUTED_IDENTITY: self._check_distributed_identity,
            ViolationType.DIAGNOSTIC: self._check_diagnostic,
            ViolationType.TEMPORAL_INCOHERENCE: self._check_temporal_coherence,
            ViolationType.CLOSED_INSPECTION: self._check_open_inspection,
            ViolationType.UNGRACEFUL_FAILURE: self._check_graceful_failure,
            ViolationType.BEHAVIORAL_OPTIMIZATION: self._check_behavioral_optimization,
            ViolationType.CROSS_IDENTITY_INFERENCE: self._check_cross_identity_inference
        }
        
        checker = checker_map.get(violation_type)
        if checker:
            return checker(context)
        
        return {"violated": False}
    
    def _check_data_sovereignty(self, context: InterpretationContext) -> Dict[str, Any]:
        """I1: Check data sovereignty"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if data is being sent to external service
        if context.action in ["send_to_cloud", "upload_data", "sync_external"]:
            if context.actor != "human":
                violated = True
                severity = "HARD"
                remediation.append("Require explicit human consent for external data transfer")
        
        # Check if offline capability is being removed
        if "offline" in context.metadata and not context.metadata["offline"]:
            violated = True
            severity = "CRITICAL"
            remediation.append("Restore offline-first capability")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_identity_locality(self, context: InterpretationContext) -> Dict[str, Any]:
        """I2: Check identity locality"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for cross-identity data access
        if len(context.affected_mirrors) > 1:
            if context.action not in ["aggregate_anonymous", "governance_vote"]:
                violated = True
                severity = "HARD"
                remediation.append("Isolate operation to single mirror context")
        
        # Check for identity mixing in data structures
        if "mixed_identities" in context.metadata:
            violated = True
            severity = "CRITICAL"
            remediation.append("Separate data structures per mirror ID")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_language_primacy(self, context: InterpretationContext) -> Dict[str, Any]:
        """I3: Check language primacy"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if language shapes are being reduced to metrics
        if context.action == "calculate_metrics":
            if "shapes_to_scores" in context.metadata:
                violated = True
                severity = "SOFT"
                remediation.append("Preserve shape qualitative meaning, don't reduce to numbers")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_prescriptive(self, context: InterpretationContext) -> Dict[str, Any]:
        """I4: Check for prescriptive language"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check generated text for prescriptive patterns
        if "text" in context.data_involved:
            text = context.data_involved["text"].lower()
            prescriptive_patterns = [
                "you should", "you must", "you need to", "you ought to",
                "i recommend", "i suggest", "try to", "make sure to"
            ]
            
            for pattern in prescriptive_patterns:
                if pattern in text:
                    violated = True
                    severity = "HARD"
                    remediation.append(f"Remove prescriptive language: '{pattern}'")
                    remediation.append("Use reflective, non-directive language")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_semantic_tension(self, context: InterpretationContext) -> Dict[str, Any]:
        """I5: Check semantic tension handling"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if tensions are being "resolved" or "fixed"
        if context.action in ["resolve_tension", "fix_contradiction"]:
            violated = True
            severity = "SOFT"
            remediation.append("Hold tensions without resolution pressure")
            remediation.append("Reframe as 'exploring tension' not 'resolving'")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_evolutionary_arc(self, context: InterpretationContext) -> Dict[str, Any]:
        """I6: Check evolutionary arc tracking"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if change tracking uses quality not quantity
        if context.action == "track_change":
            if "engagement_metrics" in context.metadata:
                violated = True
                severity = "SOFT"
                remediation.append("Track quality of evolution, not quantity of usage")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_architectural_honesty(self, context: InterpretationContext) -> Dict[str, Any]:
        """I7: Check architectural honesty"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if operations are logged
        if "logged" in context.metadata and not context.metadata["logged"]:
            violated = True
            severity = "HARD"
            remediation.append("Log all system operations for transparency")
        
        # Check for hidden processing
        if context.action in ["shadow_processing", "background_analysis"]:
            if "user_visible" not in context.metadata:
                violated = True
                severity = "HARD"
                remediation.append("Make all processing visible and explainable")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_distributed_identity(self, context: InterpretationContext) -> Dict[str, Any]:
        """I8: Check distributed identity"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check if identity is being centralized into profile
        if context.action == "create_profile":
            if "flatten_graph" in context.metadata:
                violated = True
                severity = "SOFT"
                remediation.append("Maintain identity as graph, not flat profile")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_diagnostic(self, context: InterpretationContext) -> Dict[str, Any]:
        """I9: Check for diagnostic language"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for clinical/diagnostic language
        if "text" in context.data_involved:
            text = context.data_involved["text"].lower()
            diagnostic_patterns = [
                "diagnosis", "disorder", "symptom", "treatment", "therapy",
                "pathology", "condition", "syndrome", "clinical", "abnormal"
            ]
            
            for pattern in diagnostic_patterns:
                if pattern in text and "disclaimer" not in text:
                    violated = True
                    severity = "CRITICAL"
                    remediation.append(f"Remove diagnostic language: '{pattern}'")
                    remediation.append("Add disclaimer: 'This is not a diagnosis'")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_temporal_coherence(self, context: InterpretationContext) -> Dict[str, Any]:
        """I10: Check temporal coherence"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for backdating or retroactive changes
        if context.action in ["update_timestamp", "modify_history"]:
            violated = True
            severity = "CRITICAL"
            remediation.append("Preserve original timestamps, create new entries for changes")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_open_inspection(self, context: InterpretationContext) -> Dict[str, Any]:
        """I11: Check open inspection"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for code obfuscation
        if context.action in ["obfuscate_code", "hide_implementation"]:
            violated = True
            severity = "CRITICAL"
            remediation.append("Keep all code open source and inspectable")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_graceful_failure(self, context: InterpretationContext) -> Dict[str, Any]:
        """I12: Check graceful failure"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for hard dependencies on external services
        if context.action == "add_dependency":
            if "external" in context.metadata and "fallback" not in context.metadata:
                violated = True
                severity = "HARD"
                remediation.append("Add offline fallback for external dependency")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_behavioral_optimization(self, context: InterpretationContext) -> Dict[str, Any]:
        """I13: Check for behavioral optimization"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for engagement metrics
        if context.action == "track_metric":
            engagement_keywords = ["engagement", "retention", "dau", "mau", "active", "session", "virality", "growth"]
            metric_name = context.data_involved.get("metric_name", "").lower()
            
            if any(keyword in metric_name for keyword in engagement_keywords):
                violated = True
                severity = "CRITICAL"
                remediation.append("Remove engagement/behavioral optimization metrics")
                remediation.append("Track constitutional compliance, not user behavior")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _check_cross_identity_inference(self, context: InterpretationContext) -> Dict[str, Any]:
        """I14: Check for cross-identity inference"""
        violated = False
        remediation = []
        severity = "BENIGN"
        
        # Check for aggregate learning across identities
        cross_identity_actions = ["train_model", "aggregate_patterns", "cross_mirror_analysis", "cohort_analysis"]
        if any(action in context.action for action in cross_identity_actions):
            if len(context.affected_mirrors) > 1:
                violated = True
                severity = "CRITICAL"
                remediation.append("Train per-mirror only, no cross-identity learning")
                remediation.append("Each mirror is independent")
        
        return {"violated": violated, "severity": severity, "remediation": remediation}
    
    def _construct_rationale(
        self,
        context: InterpretationContext,
        violations: List[ViolationType],
        severity: ViolationSeverity
    ) -> str:
        """Construct human-readable rationale for decision"""
        if not violations:
            return f"Action '{context.action}' is constitutionally sound."
        
        violation_names = [v.value.replace("_", " ").title() for v in violations]
        violation_list = ", ".join(violation_names)
        
        return (
            f"Action '{context.action}' violates: {violation_list}. "
            f"Severity: {severity.value}. "
            f"Constitutional governance requires remediation before proceeding."
        )
    
    def _is_reversible(
        self,
        context: InterpretationContext,
        violations: List[ViolationType]
    ) -> bool:
        """Determine if action effects are reversible"""
        # Critical violations involving data deletion or timestamp modification are not reversible
        irreversible_actions = [
            "delete_permanently", "modify_timestamp", "remove_history",
            "export_to_external", "merge_identities"
        ]
        
        if context.action in irreversible_actions:
            return False
        
        # Critical severity violations are generally not reversible
        if ViolationType.TEMPORAL_INCOHERENCE in violations:
            return False
        if ViolationType.CROSS_IDENTITY_INFERENCE in violations:
            return False
        
        return True
    
    def get_interpretation_history(
        self,
        limit: int = 100,
        severity_filter: Optional[ViolationSeverity] = None
    ) -> List[ConstitutionalDecision]:
        """Get recent interpretation decisions"""
        history = self.interpretation_history[-limit:]
        
        if severity_filter:
            history = [d for d in history if d.severity == severity_filter]
        
        return history
    
    def get_violation_statistics(self) -> Dict[str, Any]:
        """Get statistics on constitutional violations"""
        total = len(self.interpretation_history)
        if total == 0:
            return {"total_decisions": 0}
        
        violations_by_type = {}
        violations_by_severity = {}
        
        for decision in self.interpretation_history:
            for violation in decision.violated_invariants:
                violations_by_type[violation.value] = violations_by_type.get(violation.value, 0) + 1
            
            violations_by_severity[decision.severity.value] = \
                violations_by_severity.get(decision.severity.value, 0) + 1
        
        blocked_count = sum(1 for d in self.interpretation_history if not d.permitted)
        
        return {
            "total_decisions": total,
            "blocked_count": blocked_count,
            "block_rate": blocked_count / total,
            "violations_by_type": violations_by_type,
            "violations_by_severity": violations_by_severity,
            "compliance_rate": 1 - (blocked_count / total)
        }
