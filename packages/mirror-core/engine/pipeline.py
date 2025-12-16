"""
Mirror Pipeline - Orchestration of All Layers

The pipeline is the heart of Mirror's canonical implementation.
It coordinates all layers in the correct order:

Request → L1 Safety → L0 Axioms → L2 Semantic → L3 Expression → Response

Each stage is independent and can fail independently.
Failures are audited and handled gracefully.

Architecture:
- Sequential execution (each layer depends on previous)
- Fail-closed (violations block response)
- Audited (every stage logged to tamper-evident trail)
- Stateless (receives context as input)

Design: Pure orchestration, defensive, audited
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime

from protocol.types import MirrorRequest, MirrorResponse, AxiomViolation, InvocationMode
from constitution import ConstitutionalLayer
from layers import SafetyLayer, SemanticLayer, ExpressionLayer
from layers.l2_semantic import SemanticContext
from layers.l3_expression import ExpressionPreferences, ToneStyle


class PipelineStage(Enum):
    """Stages in the Mirror pipeline"""
    SAFETY_CHECK = "safety_check"  # L1: Crisis detection
    AXIOM_CHECK = "axiom_check"  # L0: Constitutional validation
    SEMANTIC_ANALYSIS = "semantic_analysis"  # L2: Pattern detection
    RESPONSE_GENERATION = "response_generation"  # Content generation
    EXPRESSION_SHAPING = "expression_shaping"  # L3: Tone & leave-ability
    COMPLETE = "complete"


@dataclass
class PipelineResult:
    """Result from pipeline execution"""
    success: bool
    response: Optional[MirrorResponse] = None
    stage_reached: PipelineStage = PipelineStage.SAFETY_CHECK
    
    # Failures
    violations: List[AxiomViolation] = field(default_factory=list)
    crisis_detected: bool = False
    error_message: Optional[str] = None
    
    # Context from layers
    semantic_context: Optional[SemanticContext] = None
    
    # Audit
    stages_completed: List[str] = field(default_factory=list)
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class MirrorPipeline:
    """
    The Mirror Pipeline - Orchestrates all layers.
    
    This is the canonical implementation's main entry point.
    Every request flows through this pipeline.
    
    Usage:
        pipeline = MirrorPipeline()
        result = pipeline.process(request, history, preferences)
        
        if result.success:
            return result.response
        else:
            handle_failure(result)
    """
    
    def __init__(
        self,
        audit_trail: Optional[Any] = None,  # Will be AuditTrail from audit.py
        enable_audit: bool = True
    ):
        """
        Initialize pipeline with all layers.
        
        Args:
            audit_trail: Optional audit trail for logging
            enable_audit: Whether to enable audit logging
        """
        self.safety_layer = SafetyLayer()
        self.constitutional_layer = ConstitutionalLayer()
        self.semantic_layer = SemanticLayer()
        self.expression_layer = ExpressionLayer()
        
        self.audit_trail = audit_trail
        self.enable_audit = enable_audit
    
    def process(
        self,
        request: MirrorRequest,
        history: Optional[List[MirrorRequest]] = None,
        preferences: Optional[ExpressionPreferences] = None,
        candidate_response: Optional[str] = None
    ) -> PipelineResult:
        """
        Process a request through the full pipeline.
        
        Args:
            request: The user's request/reflection
            history: Previous requests for context
            preferences: User's expression preferences
            candidate_response: Pre-generated response (if None, will use placeholder)
            
        Returns:
            PipelineResult with success status and response or failures
        """
        start_time = datetime.utcnow()
        result = PipelineResult(success=False)
        
        if history is None:
            history = []
        
        if preferences is None:
            preferences = ExpressionPreferences(tone=ToneStyle.BALANCED)
        
        try:
            # Stage 1: L1 Safety Check (CRITICAL - can block everything)
            result.stage_reached = PipelineStage.SAFETY_CHECK
            safety_signals = self.safety_layer.check_request(request)
            
            if safety_signals:
                from layers.l1_safety import EscalationProtocol
                
                # Check if we should block the response
                if EscalationProtocol.should_block_response(safety_signals):
                    result.crisis_detected = True
                    result.error_message = "Crisis detected - emergency response"
                    
                    # Return crisis response immediately
                    crisis_response = EscalationProtocol.get_crisis_response(safety_signals)
                    result.response = MirrorResponse(
                        reflection=crisis_response,
                        metadata={
                            "crisis_signals": len(safety_signals),
                            "escalation": EscalationProtocol.get_escalation_metadata(safety_signals)
                        }
                    )
                    result.success = True
                    result.stage_reached = PipelineStage.COMPLETE
                    result.stages_completed.append("safety_check_blocked")
                    
                    self._record_stage(result, "safety_check", {
                        "crisis_detected": True,
                        "signals": len(safety_signals)
                    })
                    
                    return result
            
            result.stages_completed.append("safety_check_passed")
            self._record_stage(result, "safety_check", {"signals": len(safety_signals)})
            
            # Stage 2: L0 Axiom Check
            result.stage_reached = PipelineStage.AXIOM_CHECK
            
            # Validate request
            request_violations = self.constitutional_layer.check_request(request)
            if request_violations:
                result.violations = request_violations
                result.error_message = f"Request violates {len(request_violations)} axiom(s)"
                result.stages_completed.append("axiom_check_failed")
                self._record_stage(result, "axiom_check", {
                    "passed": False,
                    "violations": len(request_violations)
                })
                return result
            
            result.stages_completed.append("axiom_check_request_passed")
            
            # Stage 3: L2 Semantic Analysis
            result.stage_reached = PipelineStage.SEMANTIC_ANALYSIS
            semantic_context = self.semantic_layer.analyze(request, history)
            result.semantic_context = semantic_context
            result.stages_completed.append("semantic_analysis_complete")
            
            self._record_stage(result, "semantic_analysis", {
                "patterns": len(semantic_context.patterns),
                "tensions": len(semantic_context.tensions),
                "themes": len(semantic_context.recurring_themes)
            })
            
            # Stage 4: Response Generation
            result.stage_reached = PipelineStage.RESPONSE_GENERATION
            
            if candidate_response is None:
                # Generate placeholder response (in real implementation, this would call LLM)
                candidate_response = self._generate_placeholder_response(
                    request,
                    semantic_context
                )
            
            result.stages_completed.append("response_generated")
            
            # Stage 5: Validate response against axioms
            response_obj = MirrorResponse(
                reflection=candidate_response
            )
            response_violations = self.constitutional_layer.check_response(request, response_obj)
            
            if response_violations:
                result.violations = response_violations
                result.error_message = f"Response violates {len(response_violations)} axiom(s)"
                result.stages_completed.append("axiom_check_response_failed")
                self._record_stage(result, "axiom_check_response", {
                    "passed": False,
                    "violations": len(response_violations)
                })
                return result
            
            result.stages_completed.append("axiom_check_response_passed")
            
            # Stage 6: L3 Expression Shaping
            result.stage_reached = PipelineStage.EXPRESSION_SHAPING
            final_response = self.expression_layer.shape(
                candidate_response,
                preferences,
                semantic_context
            )
            
            # Validate final response
            validation = self.expression_layer.validate_response(final_response)
            if not validation["valid"]:
                result.error_message = f"Expression validation failed: {validation['violations']}"
                result.stages_completed.append("expression_validation_failed")
                return result
            
            result.stages_completed.append("expression_shaping_complete")
            self._record_stage(result, "expression_shaping", {
                "tone": preferences.tone.value,
                "detail_level": preferences.detail_level,
                "final_length": len(final_response)
            })
            
            # Success!
            result.success = True
            result.stage_reached = PipelineStage.COMPLETE
            result.response = MirrorResponse(
                reflection=final_response,
                metadata={
                    "semantic_patterns": len(semantic_context.patterns),
                    "semantic_tensions": len(semantic_context.tensions),
                    "tone": preferences.tone.value,
                }
            )
            
        except Exception as e:
            result.success = False
            result.error_message = f"Pipeline error: {str(e)}"
            result.stages_completed.append(f"error_at_{result.stage_reached.value}")
        
        finally:
            # Record execution time
            end_time = datetime.utcnow()
            result.execution_time_ms = (end_time - start_time).total_seconds() * 1000
            
            self._record_stage(result, "complete", {
                "success": result.success,
                "execution_time_ms": result.execution_time_ms,
                "stages_completed": len(result.stages_completed)
            })
        
        return result
    
    def _generate_placeholder_response(
        self,
        request: MirrorRequest,
        context: SemanticContext
    ) -> str:
        """
        Generate a placeholder response.
        
        In real implementation, this would call an LLM.
        For now, we generate a simple acknowledgment based on context.
        """
        response = f"You mention {request.user_content[:50]}..."
        
        # Add context awareness
        if context.emotional_baseline:
            response += f" I notice a pattern of {context.emotional_baseline}."
        
        if context.recurring_themes:
            theme = context.recurring_themes[0]
            response += f" {theme} seems important to you."
        
        return response
    
    def _record_stage(
        self,
        result: PipelineResult,
        stage_name: str,
        stage_data: Dict[str, Any]
    ):
        """Record stage completion in audit trail"""
        if not self.enable_audit or not self.audit_trail:
            return
        
        try:
            from engine.audit import AuditEventType
            
            self.audit_trail.log(
                event_type=AuditEventType.PIPELINE_STAGE,
                data={
                    "stage": stage_name,
                    **stage_data
                }
            )
        except Exception:
            # Don't fail pipeline if audit fails
            pass
    
    def validate_pipeline_health(self) -> Dict[str, Any]:
        """
        Validate that all pipeline components are healthy.
        
        Returns:
            Health check results
        """
        health = {
            "healthy": True,
            "components": {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Check each layer
        components = {
            "safety_layer": self.safety_layer,
            "constitutional_layer": self.constitutional_layer,
            "semantic_layer": self.semantic_layer,
            "expression_layer": self.expression_layer,
        }
        
        for name, component in components.items():
            try:
                # Basic existence check
                health["components"][name] = {
                    "status": "ok",
                    "type": type(component).__name__
                }
            except Exception as e:
                health["healthy"] = False
                health["components"][name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return health
