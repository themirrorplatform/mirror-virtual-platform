# mirrorcore/engine/reflect.py
"""
Core Reflection Engine

This is the heart of MirrorCore.
Takes user text, generates mirrorback, logs for evolution.

Constitutional constraints enforced here.
"""

import time
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from constitution.l0_axiom_checker import L0AxiomChecker, ViolationSeverity
from constitution.drift_monitor import DriftMonitor
from mirrorcore.layers.l2_reflection import L2ReflectionTransformer
from mirrorcore.layers.l3_expression import L3ExpressionRenderer, ExpressionPreferences, ContextualFactors

logger = logging.getLogger(__name__)


class ReflectionEngine:
    """
    Core reflection function.
    
    This is the heart of MirrorCore.
    Everything else serves this.
    """
    
    def __init__(self, db, settings):
        """
        Initialize reflection engine.
        
        Args:
            db: LocalDB instance
            settings: MirrorSettings instance
        """
        self.db = db
        self.settings = settings
        
        # Initialize constitutional enforcement
        self.l0_checker = L0AxiomChecker()
        
        # Initialize L1 harm triage (safety awareness)
        from constitution.l1_harm_triage import L1HarmTriageClassifier
        self.l1_classifier = L1HarmTriageClassifier(
            authority_notify_enabled=getattr(settings, 'authority_notify_enabled', False)
        )
        
        # Initialize L2 and L3 layers
        self.l2_transformer = L2ReflectionTransformer()
        self.l3_renderer = L3ExpressionRenderer()
        
        # User expression preferences (can be customized per identity)
        self.expression_prefs = ExpressionPreferences()
        
        # Initialize drift monitoring (immune system)
        self.drift_monitor = DriftMonitor()
        
        # Initialize LLM based on mode
        self.llm = self._initialize_llm()
        
        # Load constitution
        self.constitution = self._load_constitution()
        
        logger.info(f"ReflectionEngine initialized - mode: {settings.engine_mode}, L0 enforcement: ACTIVE, L1 harm triage: ACTIVE, Drift monitor: ACTIVE")
    
    def _initialize_llm(self):
        """Initialize LLM provider based on settings - now with multi-provider pool"""
        
        if self.settings.engine_mode == "manual":
            return None
        
        # Use LLM pool for production reliability
        from mirrorcore.orchestration.llm_pool import LLMPool, ProviderConfig
        
        pool = LLMPool()
        
        # Add configured providers in priority order
        if self.settings.engine_mode == "local_llm":
            pool.add_provider(ProviderConfig(
                name="local",
                priority=1,
                base_url=getattr(self.settings, 'local_llm_url', 'http://localhost:11434'),
                model=getattr(self.settings, 'local_llm_model', 'llama2')
            ))
            logger.info("LLM pool configured with local provider")
            return pool
        
        elif self.settings.engine_mode == "remote_llm":
            # Add primary provider (Claude)
            if hasattr(self.settings, 'anthropic_api_key') and self.settings.anthropic_api_key:
                pool.add_provider(ProviderConfig(
                    name="claude",
                    priority=1,
                    api_key=self.settings.anthropic_api_key,
                    model="claude-3-5-sonnet-20241022",
                    cost_per_1k_tokens=0.003
                ))
            
            # Add secondary provider (OpenAI)
            if hasattr(self.settings, 'openai_api_key') and self.settings.openai_api_key:
                pool.add_provider(ProviderConfig(
                    name="openai",
                    priority=2,
                    api_key=self.settings.openai_api_key,
                    model="gpt-4-turbo-preview",
                    cost_per_1k_tokens=0.01
                ))
            
            # Add tertiary provider (local fallback)
            pool.add_provider(ProviderConfig(
                name="local",
                priority=3,
                base_url="http://localhost:11434",
                model="llama2"
            ))
            
            logger.info(f"LLM pool configured with {len(pool.providers)} providers")
            return pool
        
        else:
            # Manual mode - no LLM
            logger.info("Running in manual mode (no LLM)")
            return None
    
    def _load_constitution(self) -> str:
        """
        Load constitutional constraints.
        
        These are immutable principles the engine must obey.
        """
        const_dir = Path(__file__).parent.parent.parent / "constitution"
        
        if not const_dir.exists():
            logger.warning(f"Constitution directory not found: {const_dir}")
            return self._get_default_constitution()
        
        # Load all constitution markdown files
        parts = []
        for file in sorted(const_dir.glob("*.md")):
            try:
                content = file.read_text(encoding='utf-8')
                parts.append(f"# {file.stem}\n{content}")
            except Exception as e:
                logger.error(f"Error loading {file}: {e}")
        
        if parts:
            return "\n\n---\n\n".join(parts)
        else:
            return self._get_default_constitution()
    
    def _get_default_constitution(self) -> str:
        """Fallback constitution if files not found"""
        return """
# Constitutional Constraints for MirrorCore

## Core Principles

1. REFLECTION NOT PRESCRIPTION
   - Show patterns without judging them
   - Hold tensions without resolving them
   - Surface what's hidden without prescribing action
   - Maximum 15% directive content

2. SOVEREIGNTY
   - User owns all data
   - Everything stored locally
   - Export anytime
   - Delete anytime

3. SAFETY WITHOUT PATERNALISM
   - Intervene only on imminent harm (suicide, violence, child endangerment)
   - Safety system separate from reflection engine
   - Resources available, not forced

## Reflection Guidelines

DO:
- Notice patterns
- Name tensions
- Surface themes
- Hold complexity
- Use reflective language: "You wrote", "There seems to be", "Part of you"

DON'T:
- Give advice
- Solve problems
- Judge patterns as good/bad
- Optimize toward outcomes
- Use directive language: "You should", "Try to", "Consider doing"

## Engine Behavior

- Directive threshold: <15%
- Always log runs for evolution
- Check constitutional flags
- Never manipulate toward engagement
"""
    
    async def reflect(
        self,
        text: str,
        identity_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Core reflection function.
        
        Takes user text, returns Mirrorback.
        Logs everything for evolution.
        
        Args:
            text: User's reflection text
            identity_id: Identity this belongs to (optional)
            context: Additional context (optional)
            
        Returns:
            Dict with reflection_id, mirrorback, patterns, etc.
        """
        start_time = time.time()
        
        # 1. Ensure identity exists
        if identity_id is None:
            identity_id = self.db.ensure_identity()
        
        # 1b. L2 Semantic Transformation (extract patterns, tensions, themes)
        l2_result = self.l2_transformer.transform(text)
        logger.debug(f"L2 detected: {len(l2_result.patterns)} patterns, {len(l2_result.tensions)} tensions, {len(l2_result.themes)} themes")
        
        # 1c. L1 Harm Triage (safety awareness, not policing)
        harm_assessment = self.l1_classifier.classify(text, context or {})
        if harm_assessment.level.value != 'none':
            logger.info(f"L1 harm signals detected: {harm_assessment.level.value}, categories: {[c.value for c in harm_assessment.categories]}")
        
        # 2. Analyze patterns (if we have history)
        patterns = await self._analyze_patterns(text, identity_id)
        
        # 2b. Detect tensions
        tensions = await self._detect_tensions(text, identity_id, patterns)
        
        # 3. Build prompt
        prompt = self._build_prompt(text, patterns, context)
        
        # 4. Generate mirrorback
        if self.llm:
            try:
                # Use LLM pool (supports multi-provider fallback)
                from mirrorcore.orchestration.llm_pool import LLMPool
                
                if isinstance(self.llm, LLMPool):
                    result = await self.llm.generate(
                        prompt=prompt,
                        system=self.constitution,
                        temperature=0.7
                    )
                    mirrorback = result['text']
                    logger.info(f"Generated with {result['provider']} ({result['tokens']} tokens, ${result['cost']:.4f})")
                else:
                    # Legacy single-provider mode
                    mirrorback = await self.llm.generate(
                        prompt=prompt,
                        system=self.constitution
                    )
            except Exception as e:
                logger.error(f"LLM generation error: {e}", exc_info=True)
                mirrorback = self._get_fallback_mirrorback(text)
        else:
            # Manual mode
            mirrorback = self._get_fallback_mirrorback(text)
        
        # 4b. If harm signals detected, append harm awareness (not coercive)
        if harm_assessment.reflection:
            mirrorback = mirrorback + "\n\n" + harm_assessment.reflection
            if harm_assessment.resources:
                mirrorback += "\n"
                for resource in harm_assessment.resources:
                    mirrorback += f"\n- **{resource['name']}**: {resource['contact']} ({resource['availability']}) - {resource['note']}"
        
        # 4c. L3 Expression Rendering (adapt tone/style while preserving invariants)
        # Build contextual factors from harm assessment and patterns
        contextual_factors = ContextualFactors(
            emotional_intensity=min(1.0, harm_assessment.level.value == 'urgent' and 0.8 or harm_assessment.level.value == 'concern' and 0.6 or 0.4),
            urgency=1.0 if harm_assessment.level.value in ['urgent', 'crisis'] else 0.0,
            relationship_phase=context.get('relationship_phase', 'new') if context else 'new',
            recent_crisis=harm_assessment.level.value == 'crisis'
        )
        
        l3_result = self.l3_renderer.render(
            content=mirrorback,
            preferences=self.expression_prefs,
            context=contextual_factors
        )
        mirrorback = l3_result.text
        logger.debug(f"L3 adaptations: {', '.join(l3_result.adaptations_made)}")
        
        # 5. CRITICAL: L0 Constitutional Enforcement
        # This is structural - violations must not reach user
        l0_result = self.l0_checker.check_output(mirrorback)
        
        # Log to drift monitor (immune system)
        directive_pct = self.l0_checker._calculate_directive_percentage(mirrorback)
        self.drift_monitor.log_check(
            check_type='output',
            passed=l0_result.passed,
            severity=l0_result.severity if not l0_result.passed else None,
            violations=l0_result.violations,
            blocked=l0_result.blocked,
            rewritten=False,  # Will update if rewrite happens
            text_length=len(mirrorback),
            directive_percentage=directive_pct,
            reflection_id=None  # Will be set after DB insert
        )
        
        if l0_result.blocked:
            # HARD or CRITICAL violation - reject completely
            logger.error(f"L0 violation blocked mirrorback: {l0_result.violations}")
            mirrorback = self._get_constitutional_failure_message(l0_result)
            flags = {
                'l0_blocked': True,
                'severity': l0_result.severity.value,
                'violations': l0_result.violations
            }
        elif l0_result.severity == ViolationSeverity.SOFT:
            # Auto-rewrite SOFT violations
            logger.warning(f"L0 SOFT violation detected, attempting rewrite: {l0_result.violations}")
            rewritten = self.l0_checker.auto_rewrite(mirrorback, l0_result.violations)
            
            # Verify rewrite passes
            rewrite_check = self.l0_checker.check_output(rewritten)
            if rewrite_check.passed or rewrite_check.severity == ViolationSeverity.BENIGN:
                mirrorback = rewritten
                
                # Log successful rewrite
                self.drift_monitor.log_check(
                    check_type='output',
                    passed=True,
                    severity=None,
                    violations=[],
                    blocked=False,
                    rewritten=True,
                    text_length=len(rewritten),
                    directive_percentage=self.l0_checker._calculate_directive_percentage(rewritten)
                )
                
                flags = {
                    'l0_rewritten': True,
                    'original_violations': l0_result.violations,
                    'severity': ViolationSeverity.SOFT.value
                }
            else:
                # Rewrite failed, reject
                logger.error(f"L0 rewrite failed, blocking: {rewrite_check.violations}")
                mirrorback = self._get_constitutional_failure_message(rewrite_check)
                flags = {
                    'l0_blocked': True,
                    'rewrite_failed': True,
                    'severity': rewrite_check.severity.value,
                    'violations': rewrite_check.violations
                }
        elif l0_result.violations:
            # BENIGN or TENSION - log but allow
            logger.info(f"L0 BENIGN/TENSION detected (allowed): {l0_result.violations}")
            flags = {
                'l0_benign': True,
                'violations': l0_result.violations,
                'severity': l0_result.severity.value
            }
        else:
            # Clean constitutional compliance
            flags = {'l0_compliant': True}
        
        # Check drift status after every output
        drift_metrics = self.drift_monitor.get_metrics(window_hours=24)
        if drift_metrics.status.value != 'green':
            logger.warning(f"Constitutional drift detected: {drift_metrics.status.value.upper()} "
                         f"({drift_metrics.violation_rate:.1f} per 1000)")
            flags['drift_status'] = drift_metrics.status.value
            flags['drift_rate'] = drift_metrics.violation_rate
        
        # 6. Save to database
        reflection_id = self.db.create_reflection(
            content=text,
            identity_id=identity_id,
            mirrorback=mirrorback,
            metadata={
                'patterns': patterns,
                'engine_mode': self.settings.engine_mode,
                'config_version': self.settings.version,
                'context': context or {}
            }
        )
        
        # 6b. Update identity graph (if MirrorX engine available)
        try:
            from mirrorx_engine.app.graph_manager import update_graph_for_reflection
            
            # Build bundle-like structure from our L2 result
            graph_data = {
                'patterns': patterns,
                'tensions': tensions,
                'themes': [{'name': t.name, 'strength': t.strength} for t in l2_result.themes],
                'l2_tensions': [{'concept_a': t.concept_a, 'concept_b': t.concept_b, 'marker': t.marker} for t in l2_result.tensions]
            }
            
            # Update graph structure
            update_graph_for_reflection(
                supabase_client=None,  # Using LocalDB, not Supabase
                user_id=identity_id,
                reflection_id=reflection_id,
                bundle=graph_data,
                tension_ids=[],  # Will be populated if using full MirrorX
                loop_ids=[],
                belief_ids=[]
            )
            
            logger.debug(f"Identity graph updated for reflection {reflection_id}")
        except ImportError:
            logger.debug("Identity graph engine not available (optional)")
        except Exception as e:
            logger.warning(f"Identity graph update failed (non-critical): {e}")
        
        # 7. Log engine run for evolution
        duration_ms = int((time.time() - start_time) * 1000)
        
        run_id = self.db.log_engine_run(
            reflection_id=reflection_id,
            config_version=self.settings.version,
            engine_mode=self.settings.engine_mode,
            patterns=patterns,
            tensions_surfaced=tensions,
            duration_ms=duration_ms,
            constitutional_flags=flags
        )
        
        # 7b. Feed to evolution engine (adaptive learning)
        try:
            evolution_insights = await self._process_evolution(
                reflection_id=reflection_id,
                identity_id=identity_id,
                patterns=patterns,
                tensions=tensions,
                l2_result=l2_result,
                harm_assessment=harm_assessment
            )
            logger.debug(f"Evolution insights: {evolution_insights.get('events_detected', 0)} events detected")
        except Exception as e:
            logger.warning(f"Evolution processing failed (non-critical): {e}")
            evolution_insights = None
        
        # 8. Return result
        return {
            'reflection_id': reflection_id,
            'run_id': run_id,
            'mirrorback': mirrorback,
            'patterns': patterns,
            'tensions': tensions,
            'l2_semantic': {
                'detected_patterns': [{'type': p.type, 'content': p.content, 'confidence': p.confidence} for p in l2_result.patterns],
                'detected_tensions': [{'a': t.concept_a, 'b': t.concept_b, 'marker': t.marker} for t in l2_result.tensions],
                'detected_themes': [{'name': t.name, 'strength': t.strength} for t in l2_result.themes]
            },
            'l3_expression': {
                'style_applied': l3_result.style_applied,
                'adaptations': l3_result.adaptations_made
            },
            'harm_assessment': {
                'level': harm_assessment.level.value,
                'categories': [c.value for c in harm_assessment.categories],
                'confidence': harm_assessment.confidence
            } if harm_assessment.level.value != 'none' else None,
            'flags': flags,
            'duration_ms': duration_ms
        }
    
    async def _analyze_patterns(
        self,
        text: str,
        identity_id: str
    ) -> List[str]:
        """
        Analyze patterns using ML-based clustering and keyword detection.
        
        Detects:
        - Recurring themes via embedding similarity
        - Emotional patterns
        - Relational patterns
        - Temporal patterns
        """
        patterns = []
        
        # Get recent reflections for clustering
        recent = self.db.list_reflections(identity_id=identity_id, limit=50)
        
        if len(recent) >= 5:
            try:
                # Try ML-based pattern detection
                from sentence_transformers import SentenceTransformer
                from sklearn.cluster import DBSCAN
                import numpy as np
                
                # Extract text content
                texts = [r.get('content', '') for r in recent]
                texts.append(text)  # Include current reflection
                
                # Generate embeddings
                model = SentenceTransformer('all-MiniLM-L6-v2')
                embeddings = model.encode(texts)
                
                # Cluster similar reflections
                clustering = DBSCAN(eps=0.4, min_samples=3).fit(embeddings)
                labels = clustering.labels_
                
                # Current text's cluster
                current_cluster = labels[-1]
                
                if current_cluster != -1:  # Not noise
                    # Count how many past reflections in same cluster
                    cluster_count = sum(1 for l in labels[:-1] if l == current_cluster)
                    if cluster_count >= 2:
                        patterns.append(f"recurring_theme_cluster_{current_cluster}")
                        logger.info(f"Detected recurring theme: {cluster_count} similar reflections")
                
            except ImportError:
                logger.warning("sentence-transformers not available, using keyword patterns only")
            except Exception as e:
                logger.error(f"Pattern clustering error: {e}")
        
        # Keyword-based pattern detection (always runs)
        text_lower = text.lower()
        
        # Obligation language
        if any(word in text_lower for word in ['should', 'supposed to', 'have to', 'need to', 'must']):
            patterns.append("obligation_language")
        
        # Absolute thinking
        if any(word in text_lower for word in ['always', 'never', 'everyone', 'no one', 'all the time']):
            patterns.append("absolute_thinking")
        
        # Internal tension markers
        if any(word in text_lower for word in ['but', 'however', 'although', 'though', 'on one hand']):
            patterns.append("internal_tension")
        
        # Emotional intensity
        emotion_words = ['anxious', 'worried', 'scared', 'frustrated', 'angry', 'sad', 'overwhelmed']
        if sum(1 for word in emotion_words if word in text_lower) >= 2:
            patterns.append("high_emotional_intensity")
        
        # Relationship focus
        if any(word in text_lower for word in ['they', 'them', 'he', 'she', 'friend', 'family', 'partner']):
            patterns.append("relationship_focus")
        
        # Self-critical language
        if any(word in text_lower for word in ["i'm not", "i can't", "i don't", "i'm bad", "i failed"]):
            patterns.append("self_critical")
        
        return patterns
    
    async def _detect_tensions(
        self,
        text: str,
        identity_id: str,
        patterns: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Detect internal tensions in reflection.
        
        Tensions are unresolved conflicts, questions, or contradictions.
        These are SURFACED, not solved.
        """
        tensions = []
        
        text_lower = text.lower()
        sentences = text.split('.')
        
        # Type 1: Explicit contradictions (but, however, although)
        if 'internal_tension' in patterns:
            tension_markers = [('but', 'however'), ('although', 'though'), ('while', 'whereas')]
            for marker_pair in tension_markers:
                for marker in marker_pair:
                    if marker in text_lower:
                        tensions.append({
                            'type': 'contradiction',
                            'description': 'Two conflicting perspectives present',
                            'marker': marker,
                            'intensity': 0.6
                        })
                        break
        
        # Type 2: Unresolved questions
        question_count = text.count('?')
        if question_count > 0:
            tensions.append({
                'type': 'unresolved_question',
                'description': f'{question_count} question(s) left open',
                'intensity': min(question_count * 0.2, 0.8)
            })
        
        # Type 3: Should/obligation tension
        if 'obligation_language' in patterns:
            tensions.append({
                'type': 'obligation_tension',
                'description': 'Feeling pulled between what is and what "should" be',
                'intensity': 0.7
            })
        
        # Type 4: Self-criticism vs. acceptance
        if 'self_critical' in patterns:
            # Check if there's also acceptance language
            acceptance_words = ['accept', 'okay', 'fine', 'understand', 'realize']
            has_acceptance = any(word in text_lower for word in acceptance_words)
            
            if has_acceptance:
                tensions.append({
                    'type': 'self_judgment_tension',
                    'description': 'Tension between self-criticism and self-acceptance',
                    'intensity': 0.8
                })
            else:
                tensions.append({
                    'type': 'self_judgment',
                    'description': 'Critical self-evaluation present',
                    'intensity': 0.6
                })
        
        # Type 5: Relationship tensions
        if 'relationship_focus' in patterns:
            conflict_words = ['disagree', 'argue', 'fight', 'conflict', 'tension', 'upset']
            if any(word in text_lower for word in conflict_words):
                tensions.append({
                    'type': 'relational_tension',
                    'description': 'Unresolved relationship dynamic',
                    'intensity': 0.7
                })
        
        return tensions
    
    def _build_prompt(
        self,
        text: str,
        patterns: List[str],
        context: Optional[Dict] = None
    ) -> str:
        """
        Build LLM prompt.
        
        Includes constitutional constraints and detected patterns.
        """
        prompt_parts = [
            "# User Reflection",
            "",
            text,
            ""
        ]
        
        if patterns:
            prompt_parts.append("# Detected Patterns")
            for p in patterns:
                prompt_parts.append(f"- {p}")
            prompt_parts.append("")
        
        if context:
            prompt_parts.append("# Context")
            for key, value in context.items():
                prompt_parts.append(f"- {key}: {value}")
            prompt_parts.append("")
        
        prompt_parts.extend([
            "# Task",
            "",
            "Generate a Mirrorback that:",
            "- Reflects patterns without judging them",
            "- Holds tensions without resolving them",
            "- Surfaces what's hidden without prescribing action",
            "- Uses reflective language (not directive)",
            "- Stays under 15% directive content",
            "",
            "Mirrorback:"
        ])
        
        return "\n".join(prompt_parts)
    
    def _get_fallback_mirrorback(self, text: str) -> str:
        """
        Fallback mirrorback when LLM unavailable.
        
        Demonstrates constitutional reflection without LLM.
        """
        text_lower = text.lower()
        
        # Analyze key themes
        themes = []
        if any(word in text_lower for word in ['work', 'job', 'career', 'project']):
            themes.append('work')
        if any(word in text_lower for word in ['relationship', 'friend', 'family', 'partner', 'they', 'them']):
            themes.append('relationships')
        if any(word in text_lower for word in ['feel', 'feeling', 'emotion', 'anxious', 'worried', 'sad']):
            themes.append('emotions')
        if any(word in text_lower for word in ['should', 'supposed', 'have to', 'need to']):
            themes.append('obligations')
        
        # Detect questions
        questions = text.count('?')
        
        # Detect tensions
        has_tension = any(marker in text_lower for marker in ['but', 'however', 'although', 'though'])
        
        # Build constitutional reflection
        reflection_parts = []
        
        if themes:
            theme_str = ', '.join(themes)
            reflection_parts.append(f"You wrote about {theme_str}.")
        else:
            reflection_parts.append("You put something into words.")
        
        if has_tension:
            reflection_parts.append("\n\nThere's a tension here - two things that feel true at the same time. ")
            reflection_parts.append("That's not something to resolve, just notice.")
        
        if questions > 0:
            if questions == 1:
                reflection_parts.append("\n\nYou left a question open. ")
            else:
                reflection_parts.append(f"\n\nYou left {questions} questions open. ")
            reflection_parts.append("Sometimes the question is the point, not the answer.")
        
        if 'obligations' in themes:
            reflection_parts.append("\n\nThere's language about what you 'should' do. ")
            reflection_parts.append("That's a particular way of thinking about it.")
        
        reflection_parts.append("\n\n---\n")
        reflection_parts.append("\n*Note: I'm in manual mode, so this is a simple reflection. ")
        reflection_parts.append("For deeper AI-powered mirrorbacks, set engine_mode to 'local_llm' or 'remote_llm'.*")
        
        return ''.join(reflection_parts)
    
    def _get_constitutional_failure_message(self, l0_result) -> str:
        """
        Message shown when constitutional violation blocks output.
        
        This is an error state - should be rare if prompts are well-designed.
        """
        severity = l0_result.severity.value
        
        return f"""[Constitutional Integrity Failure]

The generated mirrorback violated L0 invariants and was blocked ({severity} severity).

This is an internal error. The Mirror's constitution prevents certain patterns:
- Prescriptive/directive language (>15% threshold)
- Cross-identity generalizations
- Coercive emotional manipulation
- Claims of fixed life purpose
- Human masquerade (false empathy)
- Diagnostic authority claims

Your reflection was saved, but I could not generate a compliant mirrorback.

This indicates the system needs tuning. Please report this issue.

Violations detected: {', '.join(l0_result.violations[:3])}"""
    
    async def _process_evolution(
        self,
        reflection_id: str,
        identity_id: str,
        patterns: List[str],
        tensions: List[Dict[str, Any]],
        l2_result: Any,
        harm_assessment: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Process reflection through evolution engine for adaptive learning.
        
        Detects:
        - Growth events (belief shifts, tension resolution)
        - Stagnation (repeated patterns without change)
        - Breakthroughs (new insights, reframings)
        - Regression (tension intensification)
        - Blind spots (persistent contradictions)
        
        Args:
            reflection_id: Reflection ID
            identity_id: Identity ID
            patterns: Detected patterns
            tensions: Detected tensions
            l2_result: L2 semantic analysis result
            harm_assessment: L1 harm assessment
        
        Returns:
            Evolution insights if available
        """
        try:
            # Import evolution engine
            from mirror_os.services.evolution_engine import EvolutionEngine
            
            # Initialize if not already done
            if not hasattr(self, 'evolution_engine'):
                self.evolution_engine = EvolutionEngine(self.db)
            
            # Prepare evolution data
            evolution_data = {
                'reflection_id': reflection_id,
                'identity_id': identity_id,
                'patterns': patterns,
                'tensions': [
                    {'type': t['type'], 'description': t.get('description', '')}
                    for t in tensions
                ],
                'l2_themes': [
                    {'name': theme.name, 'strength': theme.strength}
                    for theme in l2_result.themes
                ],
                'l2_tensions': [
                    {'concept_a': t.concept_a, 'concept_b': t.concept_b, 'marker': t.marker}
                    for t in l2_result.tensions
                ],
                'harm_level': harm_assessment.level.value,
                'harm_categories': [c.value for c in harm_assessment.categories]
            }
            
            # Process through evolution engine
            evolution_result = self.evolution_engine.process_reflection(evolution_data)
            
            return evolution_result
            
        except ImportError:
            logger.debug("Evolution engine not available (optional)")
            return None
        except Exception as e:
            logger.warning(f"Evolution processing error: {e}")
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics including constitutional compliance"""
        drift_stats = self.drift_monitor.get_stats()
        drift_metrics = self.drift_monitor.get_metrics(window_hours=24)
        
        return {
            'engine_mode': self.settings.engine_mode,
            'llm_available': self.llm is not None,
            'constitution_loaded': bool(self.constitution),
            'l0_enforcement_active': True,
            'drift_monitor_active': True,
            'version': self.settings.version,
            'constitutional_health': {
                'status_24h': drift_metrics.status.value,
                'violation_rate_24h': round(drift_metrics.violation_rate, 2),
                'total_checks': drift_stats['total_checks'],
                'total_violations': drift_stats['total_violations'],
                'unacknowledged_alerts': drift_stats['unacknowledged_alerts']
            }
        }

