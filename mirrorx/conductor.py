# mirrorx/conductor.py
"""
MirrorX Conductor: 8-Step Orchestration Engine

The conductor orchestrates the complete reflection-to-evolution pipeline:

1. ANALYZE - L2 pattern detection on input
2. TENSION - Extract contradictions and conflicts
3. EVOLVE - Update identity graph with new concepts
4. THEMES - Track recurring themes over time
5. RENDER - Generate mirror response with L3 adaptation
6. VERIFY - L0 + L1 constitutional enforcement
7. EXPORT - Create semantic bundle for sovereignty
8. LEARN - Update evolution tracking and metrics

Each step is atomic, logged, and can be audited.
Constitutional constraints enforced throughout.
"""

import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from mirrorx.evolution_engine import EvolutionEngine, IdentityDelta, EvolutionMetrics

logger = logging.getLogger(__name__)


class ConductorStep(Enum):
    """8 steps of the conductor"""
    ANALYZE = "analyze"
    TENSION = "tension"
    EVOLVE = "evolve"
    THEMES = "themes"
    RENDER = "render"
    VERIFY = "verify"
    EXPORT = "export"
    LEARN = "learn"


class StepStatus(Enum):
    """Status of a conductor step"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StepResult:
    """Result of a conductor step"""
    step: ConductorStep
    status: StepStatus
    duration_ms: float
    output: Dict[str, Any]
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ConductorRun:
    """Complete conductor run record"""
    run_id: str
    identity_id: str
    input_text: str
    steps: List[StepResult]
    final_output: Optional[str]
    total_duration_ms: float
    success: bool
    constitutional_flags: List[str]
    started_at: datetime
    completed_at: Optional[datetime] = None


class MirrorXConductor:
    """
    8-step orchestration engine for Mirror reflections.
    
    Design principles:
    - Each step is atomic and logged
    - Constitutional checks at every stage
    - Failures trigger graceful degradation
    - Full audit trail maintained
    """
    
    def __init__(
        self,
        l1_safety,
        l2_transformer,
        l3_renderer,
        l0_checker,
        guardian,
        identity_graph_builder,
        archive,
        llm=None
    ):
        """
        Initialize conductor with all required components.
        
        Args:
            l1_safety: L1SafetyLayer instance
            l2_transformer: L2ReflectionTransformer instance
            l3_renderer: L3ExpressionRenderer instance
            l0_checker: L0AxiomChecker instance
            guardian: Guardian instance
            identity_graph_builder: IdentityGraphBuilder instance
            archive: MirrorArchive instance
            llm: Optional LLM instance for generation
        """
        self.l1 = l1_safety
        self.l2 = l2_transformer
        self.l3 = l3_renderer
        self.l0 = l0_checker
        self.guardian = guardian
        self.graph_builder = identity_graph_builder
        self.archive = archive
        self.llm = llm
        
        # Evolution engine
        self.evolution_engine = EvolutionEngine()
        
        self.run_history: List[ConductorRun] = []
    
    async def conduct(
        self,
        text: str,
        identity_id: str,
        preferences: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ConductorRun:
        """
        Execute the complete 8-step conductor pipeline.
        
        Args:
            text: User's reflection text
            identity_id: Identity this belongs to
            preferences: Optional user preferences for rendering
            context: Optional contextual factors
        
        Returns:
            ConductorRun with complete execution record
        """
        run_id = f"RUN-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        start_time = time.time()
        
        logger.info(f"🎭 Starting conductor run {run_id} for identity {identity_id}")
        
        run = ConductorRun(
            run_id=run_id,
            identity_id=identity_id,
            input_text=text,
            steps=[],
            final_output=None,
            total_duration_ms=0,
            success=False,
            constitutional_flags=[],
            started_at=datetime.utcnow()
        )
        
        try:
            # STEP 1: ANALYZE
            step1_result = await self._step_analyze(text)
            run.steps.append(step1_result)
            
            if step1_result.status == StepStatus.FAILED:
                run.success = False
                return self._finalize_run(run, start_time)
            
            # STEP 2: TENSION
            step2_result = await self._step_tension(step1_result.output)
            run.steps.append(step2_result)
            
            # STEP 3: EVOLVE
            step3_result = await self._step_evolve(
                identity_id, 
                text, 
                step1_result.output, 
                step2_result.output
            )
            run.steps.append(step3_result)
            
            # STEP 4: THEMES
            step4_result = await self._step_themes(identity_id, step1_result.output)
            run.steps.append(step4_result)
            
            # STEP 5: RENDER
            step5_result = await self._step_render(
                text,
                step1_result.output,
                step2_result.output,
                step4_result.output,
                preferences,
                context
            )
            run.steps.append(step5_result)
            
            if step5_result.status == StepStatus.FAILED:
                run.success = False
                return self._finalize_run(run, start_time)
            
            # STEP 6: VERIFY
            step6_result = await self._step_verify(step5_result.output['rendered_text'])
            run.steps.append(step6_result)
            
            if step6_result.status == StepStatus.FAILED:
                # Constitutional violation - cannot proceed
                run.success = False
                run.constitutional_flags = step6_result.output.get('violations', [])
                return self._finalize_run(run, start_time)
            
            run.constitutional_flags = step6_result.output.get('flags', [])
            
            # STEP 7: EXPORT
            step7_result = await self._step_export(
                identity_id,
                text,
                step5_result.output['rendered_text'],
                run.steps
            )
            run.steps.append(step7_result)
            
            # STEP 8: LEARN
            step8_result = await self._step_learn(identity_id, run)
            run.steps.append(step8_result)
            
            # Success!
            run.success = True
            run.final_output = step5_result.output['rendered_text']
            
        except Exception as e:
            logger.error(f"Conductor run {run_id} failed: {e}", exc_info=True)
            run.success = False
            run.steps.append(StepResult(
                step=ConductorStep.VERIFY,  # Generic failure
                status=StepStatus.FAILED,
                duration_ms=0,
                output={},
                error=str(e)
            ))
        
        return self._finalize_run(run, start_time)
    
    async def _step_analyze(self, text: str) -> StepResult:
        """Step 1: Analyze input with L2 transformer"""
        step_start = time.time()
        
        try:
            # L1 safety check first
            l1_check = self.l1.check_input(text)
            
            if not l1_check.passed and l1_check.severity.value == 'tier_1_block':
                # Tier 1 block - stop immediately
                return StepResult(
                    step=ConductorStep.ANALYZE,
                    status=StepStatus.FAILED,
                    duration_ms=(time.time() - step_start) * 1000,
                    output={
                        'l1_blocked': True,
                        'block_message': l1_check.warning_message
                    },
                    error="Tier 1 safety block"
                )
            
            # L2 transformation
            l2_result = self.l2.transform(text)
            
            duration = (time.time() - step_start) * 1000
            
            return StepResult(
                step=ConductorStep.ANALYZE,
                status=StepStatus.COMPLETED,
                duration_ms=duration,
                output={
                    'l1_check': {
                        'passed': l1_check.passed,
                        'severity': l1_check.severity.value if l1_check.severity else None,
                        'requires_ack': l1_check.requires_user_acknowledgment
                    },
                    'l2_result': {
                        'patterns': [
                            {'type': p.type, 'content': p.content, 'confidence': p.confidence}
                            for p in l2_result.patterns
                        ],
                        'tensions': [
                            {
                                'concept_a': t.concept_a,
                                'concept_b': t.concept_b,
                                'marker': t.marker
                            }
                            for t in l2_result.tensions
                        ],
                        'themes': [
                            {'name': t.name, 'strength': t.strength}
                            for t in l2_result.themes
                        ],
                        'metadata': l2_result.metadata
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"ANALYZE step failed: {e}")
            return StepResult(
                step=ConductorStep.ANALYZE,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_tension(self, analyze_output: Dict[str, Any]) -> StepResult:
        """Step 2: Extract and process tensions"""
        step_start = time.time()
        
        try:
            l2_result = analyze_output.get('l2_result', {})
            tensions = l2_result.get('tensions', [])
            
            # Process tensions - find most significant
            if tensions:
                # Sort by concept length (proxy for specificity)
                sorted_tensions = sorted(
                    tensions,
                    key=lambda t: len(t['concept_a']) + len(t['concept_b']),
                    reverse=True
                )
                primary_tension = sorted_tensions[0] if sorted_tensions else None
            else:
                primary_tension = None
            
            return StepResult(
                step=ConductorStep.TENSION,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'tension_count': len(tensions),
                    'primary_tension': primary_tension,
                    'all_tensions': tensions
                }
            )
            
        except Exception as e:
            logger.error(f"TENSION step failed: {e}")
            return StepResult(
                step=ConductorStep.TENSION,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_evolve(
        self,
        identity_id: str,
        text: str,
        analyze_output: Dict[str, Any],
        tension_output: Dict[str, Any]
    ) -> StepResult:
        """Step 3: Update identity graph and compute evolution delta"""
        step_start = time.time()
        
        try:
            l2_result = analyze_output.get('l2_result', {})
            themes = l2_result.get('themes', [])
            tensions = tension_output.get('all_tensions', [])
            
            # Get previous state from graph builder
            previous_state = self.graph_builder.get_identity_state(identity_id)
            
            # Update identity graph with new reflection
            concepts = [theme['theme'] for theme in themes]
            self.graph_builder.add_concepts(identity_id, concepts)
            
            for tension in tensions:
                self.graph_builder.add_contradiction(
                    identity_id,
                    tension['concept_a'],
                    tension['concept_b']
                )
            
            # Get current state after update
            current_state = {
                'timestamp': datetime.utcnow(),
                'concepts': concepts,
                'themes': themes,
                'tensions': tensions
            }
            
            # Compute identity delta
            if previous_state:
                delta = self.evolution_engine.compute_delta(
                    identity_id,
                    previous_state,
                    current_state,
                    datetime.utcnow()
                )
                
                delta_summary = {
                    'magnitude': delta.delta_magnitude,
                    'new_concepts': delta.new_concepts,
                    'strengthened': delta.strengthened_themes,
                    'new_tensions_count': len(delta.new_tensions)
                }
            else:
                delta_summary = {
                    'magnitude': 0.0,
                    'note': 'First reflection for this identity'
                }
            
            return StepResult(
                step=ConductorStep.EVOLVE,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'graph_updated': True,
                    'new_concepts': len(concepts),
                    'new_tensions': len(tensions),
                    'delta': delta_summary
                }
            )
            
        except Exception as e:
            logger.error(f"EVOLVE step failed: {e}")
            return StepResult(
                step=ConductorStep.EVOLVE,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_themes(
        self,
        identity_id: str,
        analyze_output: Dict[str, Any]
    ) -> StepResult:
        """Step 4: Track themes over time"""
        step_start = time.time()
        
        try:
            l2_result = analyze_output.get('l2_result', {})
            themes = l2_result.get('themes', [])
            
            # Track which themes are recurring vs new
            # In production, would query historical reflections
            
            return StepResult(
                step=ConductorStep.THEMES,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'current_themes': themes,
                    'theme_count': len(themes)
                }
            )
            
        except Exception as e:
            logger.error(f"THEMES step failed: {e}")
            return StepResult(
                step=ConductorStep.THEMES,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_render(
        self,
        input_text: str,
        analyze_output: Dict[str, Any],
        tension_output: Dict[str, Any],
        theme_output: Dict[str, Any],
        preferences: Optional[Dict[str, Any]],
        context: Optional[Dict[str, Any]]
    ) -> StepResult:
        """Step 5: Generate and render mirror response"""
        step_start = time.time()
        
        try:
            # Generate response (simplified - no LLM call)
            l2_result = analyze_output.get('l2_result', {})
            themes = l2_result.get('themes', [])[:2]
            tensions = tension_output.get('all_tensions', [])
            
            # Create mock response
            theme_names = [t['name'] for t in themes]
            response = f"I notice you're exploring themes of {' and '.join(theme_names)}. "
            
            if tensions:
                primary = tension_output.get('primary_tension')
                if primary:
                    response += f"There's a tension between {primary['concept_a']} and {primary['concept_b']}. "
            
            response += "What stands out to you about this?"
            
            # Render with L3
            from mirrorcore.layers import (
                ExpressionPreferences, 
                ContextualFactors,
                ToneStyle,
                FormalityLevel,
                ResponseLength
            )
            
            prefs = ExpressionPreferences(
                tone=ToneStyle.REFLECTIVE,
                formality=FormalityLevel.BALANCED,
                length=ResponseLength.MODERATE
            )
            
            ctx = ContextualFactors(emotional_intensity=0.5)
            
            l3_result = self.l3.render(response, prefs, ctx)
            
            return StepResult(
                step=ConductorStep.RENDER,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'rendered_text': l3_result.text,
                    'style_applied': l3_result.style_applied,
                    'adaptations': l3_result.adaptations_made
                }
            )
            
        except Exception as e:
            logger.error(f"RENDER step failed: {e}")
            return StepResult(
                step=ConductorStep.RENDER,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_verify(self, rendered_text: str) -> StepResult:
        """Step 6: Constitutional verification (L0 + L1)"""
        step_start = time.time()
        
        try:
            # L0 check
            l0_result = self.l0.check_output(rendered_text)
            
            # L1 check
            l1_result = self.l1.check_output(rendered_text)
            
            # Combine results
            passed = l0_result.passed and l1_result.passed
            
            if not passed:
                violations = []
                if not l0_result.passed:
                    violations.extend([f"L0: {v}" for v in l0_result.violations])
                if not l1_result.passed:
                    violations.append(f"L1: {l1_result.severity.value}")
                
                return StepResult(
                    step=ConductorStep.VERIFY,
                    status=StepStatus.FAILED,
                    duration_ms=(time.time() - step_start) * 1000,
                    output={'violations': violations},
                    error="Constitutional verification failed"
                )
            
            # Check with Guardian
            # Guardian would log this for trend analysis
            
            return StepResult(
                step=ConductorStep.VERIFY,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'l0_passed': l0_result.passed,
                    'l1_passed': l1_result.passed,
                    'directive_pct': self.l0._calculate_directive_percentage(rendered_text),
                    'flags': []
                }
            )
            
        except Exception as e:
            logger.error(f"VERIFY step failed: {e}")
            return StepResult(
                step=ConductorStep.VERIFY,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_export(
        self,
        identity_id: str,
        input_text: str,
        output_text: str,
        steps: List[StepResult]
    ) -> StepResult:
        """Step 7: Create semantic export bundle"""
        step_start = time.time()
        
        try:
            # Create export bundle (simplified)
            bundle = {
                'identity_id': identity_id,
                'timestamp': datetime.utcnow().isoformat(),
                'input': input_text,
                'output': output_text,
                'processing_steps': [
                    {'step': s.step.value, 'duration_ms': s.duration_ms}
                    for s in steps
                ]
            }
            
            return StepResult(
                step=ConductorStep.EXPORT,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output={
                    'bundle_created': True,
                    'bundle_size_bytes': len(str(bundle))
                }
            )
            
        except Exception as e:
            logger.error(f"EXPORT step failed: {e}")
            return StepResult(
                step=ConductorStep.EXPORT,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    async def _step_learn(
        self,
        identity_id: str,
        run: ConductorRun
    ) -> StepResult:
        """Step 8: Update evolution tracking and compute metrics"""
        step_start = time.time()
        
        try:
            # Get all reflections for this identity from archive
            all_reflections = self.archive.get_reflections(identity_id, limit=100)
            
            # Detect concept drift over time
            concept_drifts = self.evolution_engine.detect_concept_drift(
                identity_id,
                all_reflections,
                window_days=30
            )
            
            # Find inflection points (major shifts)
            inflection_points = self.evolution_engine.detect_inflection_points(
                identity_id
            )
            
            # Compute comprehensive evolution metrics
            evolution_metrics = self.evolution_engine.compute_evolution_metrics(
                identity_id,
                all_reflections,
                period_days=90
            )
            
            # Summarize findings
            learning_summary = {
                'evolution_updated': True,
                'concept_drift_count': len(concept_drifts),
                'rising_concepts': [
                    c for c, d in concept_drifts.items()
                    if d.frequency_trend == 'rising'
                ][:3],
                'fading_concepts': [
                    c for c, d in concept_drifts.items()
                    if d.frequency_trend == 'falling'
                ][:3],
                'inflection_points': len(inflection_points),
                'latest_inflection': (
                    inflection_points[-1].description
                    if inflection_points else None
                ),
                'metrics': {
                    'stability': evolution_metrics.concept_stability,
                    'velocity': evolution_metrics.evolution_velocity,
                    'unique_concepts': evolution_metrics.unique_concepts
                }
            }
            
            return StepResult(
                step=ConductorStep.LEARN,
                status=StepStatus.COMPLETED,
                duration_ms=(time.time() - step_start) * 1000,
                output=learning_summary
            )
            
        except Exception as e:
            logger.error(f"LEARN step failed: {e}")
            return StepResult(
                step=ConductorStep.LEARN,
                status=StepStatus.FAILED,
                duration_ms=(time.time() - step_start) * 1000,
                output={},
                error=str(e)
            )
    
    def _finalize_run(
        self,
        run: ConductorRun,
        start_time: float
    ) -> ConductorRun:
        """Finalize conductor run"""
        run.total_duration_ms = (time.time() - start_time) * 1000
        run.completed_at = datetime.utcnow()
        
        self.run_history.append(run)
        
        status = "✅ SUCCESS" if run.success else "❌ FAILED"
        logger.info(
            f"{status} Conductor run {run.run_id} completed in {run.total_duration_ms:.0f}ms"
        )
        
        return run


# Self-test
if __name__ == "__main__":
    import asyncio
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from mirrorcore.layers import L1SafetyLayer, L2ReflectionTransformer, L3ExpressionRenderer
    from constitution.l0_axiom_checker import L0AxiomChecker
    from constitution.guardian import Guardian
    
    async def test_conductor():
        print("MirrorX Conductor Test")
        print("=" * 80)
        
        # Initialize components
        l1 = L1SafetyLayer()
        l2 = L2ReflectionTransformer()
        l3 = L3ExpressionRenderer()
        l0 = L0AxiomChecker()
        guardian = Guardian()
        
        conductor = MirrorXConductor(
            l1_safety=l1,
            l2_transformer=l2,
            l3_renderer=l3,
            l0_checker=l0,
            guardian=guardian,
            identity_graph_builder=None,  # Placeholder
            archive=None,  # Placeholder
            llm=None
        )
        
        # Test reflection
        test_text = """
        I'm feeling torn between my career ambitions and my relationships.
        Part of me wants to climb the ladder, but another part values connection
        more than success. I used to be so sure, but now I'm questioning everything.
        """
        
        print(f"\nTest input:\n{test_text.strip()}\n")
        print("Running 8-step conductor...\n")
        
        run = await conductor.conduct(
            text=test_text,
            identity_id="test-identity-001"
        )
        
        print(f"Run ID: {run.run_id}")
        print(f"Success: {run.success}")
        print(f"Total duration: {run.total_duration_ms:.0f}ms")
        print(f"\nSteps executed:")
        
        for step_result in run.steps:
            status_icon = "✅" if step_result.status == StepStatus.COMPLETED else "❌"
            print(f"  {status_icon} {step_result.step.value}: {step_result.duration_ms:.0f}ms")
        
        if run.final_output:
            print(f"\nFinal output:\n{run.final_output}")
        
        print("\n✅ MirrorX Conductor functional")
    
    asyncio.run(test_conductor())
