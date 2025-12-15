# mirrorx-engine/app/engine.py
"""
MirrorX Engine - Main Orchestrator

Coordinates pattern detection, tension tracking, and mirrorback generation.
This is the core intelligence layer of the Mirror platform.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from mirrorcore.models.base import MirrorLLM, LLMResponse
from mirrorcore.constitutional import ConstitutionalValidator
from mirror_os.storage.base import MirrorStorage

# Import from same package
try:
    from pattern_detector import PatternDetector, Pattern
    from tension_tracker import TensionTracker
except ImportError:
    # Fallback for direct execution
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    from pattern_detector import PatternDetector, Pattern
    from tension_tracker import TensionTracker


class MirrorXEngine:
    """
    Main MirrorX engine coordinating all intelligence operations.
    
    Responsibilities:
    1. Generate constitutionally-aligned mirrorbacks
    2. Detect and track patterns across reflections
    3. Surface and track tensions/paradoxes
    4. Log telemetry for evolution learning
    5. Enforce constitutional principles
    """
    
    def __init__(
        self,
        storage: MirrorStorage,
        llm: MirrorLLM,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize MirrorX engine.
        
        Args:
            storage: Storage layer for persistence
            llm: LLM adapter for generation
            config: Engine configuration dict
        """
        self.storage = storage
        self.llm = llm
        self.config = config or {}
        
        # Initialize components
        self.validator = ConstitutionalValidator(
            strict_mode=self.config.get('strict_constitutional', True)
        )
        self.pattern_detector = PatternDetector(
            llm=llm,
            similarity_threshold=self.config.get('pattern_similarity', 0.75),
            min_occurrences=self.config.get('pattern_min_occurrences', 2)
        )
        self.tension_tracker = TensionTracker(llm=llm)
        
        # Runtime state
        self.engine_version = self.config.get('version', '1.0.0')
        self.engine_mode = self._detect_engine_mode()
    
    def process_reflection(
        self,
        reflection_id: str,
        identity_id: Optional[str] = None,
        regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Process a reflection: generate mirrorback, detect patterns/tensions.
        
        Args:
            reflection_id: Reflection UUID to process
            identity_id: Optional identity UUID for context
            regenerate: If True, regenerate even if mirrorback exists
            
        Returns:
            Processing result dict with mirrorback_id, patterns, tensions
        """
        start_time = datetime.utcnow()
        
        # 1. Load reflection
        reflection = self.storage.get_reflection(reflection_id)
        if not reflection:
            raise ValueError(f"Reflection not found: {reflection_id}")
        
        # Check if already processed
        existing_mirrorbacks = self.storage.list_mirrorbacks(reflection_id)
        if existing_mirrorbacks and not regenerate:
            return {
                'status': 'already_processed',
                'mirrorback_id': existing_mirrorbacks[0]['id'],
                'message': 'Mirrorback already exists. Use regenerate=True to recreate.'
            }
        
        # 2. Build context
        context = self._build_context(
            reflection_id=reflection_id,
            identity_id=identity_id or reflection.get('identity_id')
        )
        
        # 3. Generate mirrorback
        mirrorback_response = self.llm.generate_mirrorback(
            reflection=reflection['content'],
            context=context
        )
        
        # 4. Validate constitutional compliance
        violations = self.validator.validate(mirrorback_response.content)
        
        if violations:
            # Log violations but proceed (user can see flags)
            violation_summary = self.validator.get_violation_summary(violations)
        else:
            violation_summary = None
        
        # 5. Save mirrorback
        mirrorback_id = self.storage.create_mirrorback(
            reflection_id=reflection_id,
            content=mirrorback_response.content,
            engine_version=self.engine_version,
            metadata={
                'model': self.llm.model_name,
                'engine_mode': self.engine_mode,
                'constitutional_flags': [v.to_dict() for v in violations],
                'patterns_detected': mirrorback_response.patterns,
                'tensions_surfaced': [t['name'] for t in mirrorback_response.tensions] if mirrorback_response.tensions else []
            }
        )
        
        # 6. Detect patterns (if enough reflections)
        patterns_updated = False
        if identity_id:
            recent_reflections = self.storage.list_reflections(
                identity_id=identity_id,
                limit=50
            )
            
            if len(recent_reflections) >= 3:
                patterns = self._update_patterns(identity_id, recent_reflections)
                patterns_updated = len(patterns) > 0
        
        # 7. Detect and track tensions
        tensions_detected = self.tension_tracker.detect_tensions(
            reflection=reflection,
            known_tensions=context.get('known_tensions', [])
        )
        
        # Save new tensions
        for tension_data in tensions_detected:
            if tension_data.get('origin') == 'llm_suggested':
                # Save as new tension
                self.storage.create_tension(
                    name=tension_data['name'],
                    axis_a=tension_data['axis_a'],
                    axis_b=tension_data['axis_b'],
                    identity_id=identity_id,
                    position=tension_data.get('position'),
                    intensity=tension_data.get('intensity'),
                    origin='llm_suggested'
                )
            elif 'id' in tension_data:
                # Update existing tension
                self.storage.update_tension(
                    tension_id=tension_data['id'],
                    position=tension_data.get('position'),
                    intensity=tension_data.get('intensity')
                )
        
        # 8. Log telemetry
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        run_id = self.storage.log_engine_run(
            reflection_id=reflection_id,
            config_version=self.engine_version,
            engine_mode=self.engine_mode,
            patterns=mirrorback_response.patterns,
            tensions_surfaced=[t['name'] for t in tensions_detected],
            flags={'constitutional_violations': len(violations)} if violations else None,
            duration_ms=duration_ms,
            model_name=self.llm.model_name,
            sync_allowed=self.config.get('telemetry_sync', False)
        )
        
        return {
            'status': 'success',
            'mirrorback_id': mirrorback_id,
            'mirrorback_content': mirrorback_response.content,
            'patterns_updated': patterns_updated,
            'tensions_detected': len(tensions_detected),
            'constitutional_violations': len(violations),
            'violation_summary': violation_summary,
            'engine_run_id': run_id,
            'duration_ms': duration_ms
        }
    
    def regenerate_mirrorback(
        self,
        reflection_id: str,
        identity_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Regenerate mirrorback for reflection.
        
        Args:
            reflection_id: Reflection UUID
            identity_id: Optional identity UUID
            
        Returns:
            Processing result dict
        """
        return self.process_reflection(
            reflection_id=reflection_id,
            identity_id=identity_id,
            regenerate=True
        )
    
    def analyze_patterns(
        self,
        identity_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Analyze patterns for an identity.
        
        Args:
            identity_id: Identity UUID
            limit: Number of recent reflections to analyze
            
        Returns:
            Pattern analysis dict
        """
        # Load recent reflections
        reflections = self.storage.list_reflections(
            identity_id=identity_id,
            limit=limit
        )
        
        if len(reflections) < 2:
            return {
                'status': 'insufficient_data',
                'message': 'Need at least 2 reflections to detect patterns',
                'patterns': []
            }
        
        # Detect patterns
        patterns = self.pattern_detector.detect_patterns(reflections)
        
        # Get evolution for each pattern
        pattern_summaries = []
        for pattern in patterns:
            evolution = self.pattern_detector.get_pattern_evolution(
                pattern, reflections
            )
            
            pattern_summaries.append({
                **pattern.to_dict(),
                'evolution': evolution
            })
        
        return {
            'status': 'success',
            'patterns': pattern_summaries,
            'total_patterns': len(patterns),
            'analyzed_reflections': len(reflections)
        }
    
    def analyze_tensions(
        self,
        identity_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Analyze tensions for an identity.
        
        Args:
            identity_id: Identity UUID
            limit: Number of recent reflections to analyze
            
        Returns:
            Tension analysis dict
        """
        # Load reflections
        reflections = self.storage.list_reflections(
            identity_id=identity_id,
            limit=limit
        )
        
        # Load known tensions
        known_tensions = self.storage.list_tensions(identity_id=identity_id)
        
        # Generate tension report
        report = self.tension_tracker.get_tension_report(
            reflections=reflections,
            known_tensions=known_tensions
        )
        
        return {
            'status': 'success',
            **report
        }
    
    def log_feedback(
        self,
        engine_run_id: str,
        rating: Optional[int] = None,
        flags: Optional[List[str]] = None,
        notes: Optional[str] = None
    ) -> str:
        """
        Log user feedback on mirrorback.
        
        Args:
            engine_run_id: Engine run UUID
            rating: 1-5 star rating
            flags: Issue flags list
            notes: Free-form feedback
            
        Returns:
            Feedback ID
        """
        return self.storage.log_engine_feedback(
            engine_run_id=engine_run_id,
            rating=rating,
            flags=flags,
            notes=notes,
            sync_allowed=self.config.get('feedback_sync', False)
        )
    
    def get_dashboard(
        self,
        identity_id: str
    ) -> Dict[str, Any]:
        """
        Get dashboard overview for identity.
        
        Args:
            identity_id: Identity UUID
            
        Returns:
            Dashboard data dict
        """
        # Get statistics
        stats = self.storage.get_stats()
        
        # Get recent reflections
        recent_reflections = self.storage.list_reflections(
            identity_id=identity_id,
            limit=10
        )
        
        # Get active tensions
        tensions = self.storage.list_tensions(identity_id=identity_id)
        
        # Get recent engine runs
        recent_runs = self.storage.list_engine_runs(limit=10)
        
        # Calculate engagement metrics
        total_reflections = len(self.storage.list_reflections(
            identity_id=identity_id,
            limit=1000
        ))
        
        return {
            'identity_id': identity_id,
            'total_reflections': total_reflections,
            'recent_reflections': recent_reflections[:5],
            'active_tensions': len(tensions),
            'recent_tensions': tensions[:5],
            'engine_stats': {
                'recent_runs': len(recent_runs),
                'engine_mode': self.engine_mode,
                'engine_version': self.engine_version
            },
            'storage_stats': stats
        }
    
    def _build_context(
        self,
        reflection_id: str,
        identity_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build context for mirrorback generation."""
        context = {}
        
        if identity_id:
            # Get recent reflections
            recent = self.storage.list_reflections(
                identity_id=identity_id,
                limit=5
            )
            context['previous_reflections'] = [
                r['content'] for r in recent
                if r['id'] != reflection_id
            ]
            
            # Get known tensions
            tensions = self.storage.list_tensions(identity_id=identity_id)
            context['known_tensions'] = [
                {
                    'name': t['name'],
                    'axis_a': t['axis_a'],
                    'axis_b': t['axis_b']
                }
                for t in tensions[:5]
            ]
            
            # Get known patterns (would load from patterns table if implemented)
            context['known_patterns'] = []
        
        return context
    
    def _update_patterns(
        self,
        identity_id: str,
        reflections: List[Dict[str, Any]]
    ) -> List[Pattern]:
        """Update patterns for identity."""
        # Detect patterns
        patterns = self.pattern_detector.detect_patterns(reflections)
        
        # Store patterns (simplified - would use patterns table in production)
        # For now, just return detected patterns
        
        return patterns
    
    def _detect_engine_mode(self) -> str:
        """Detect engine mode from LLM type."""
        model_info = self.llm.get_model_info()
        llm_type = model_info.get('type', 'unknown')
        
        if llm_type == 'local':
            return 'local_llm'
        elif llm_type == 'remote':
            return 'remote_llm'
        else:
            return 'manual'
    
    def get_engine_info(self) -> Dict[str, Any]:
        """Get engine information."""
        model_info = self.llm.get_model_info()
        
        return {
            'engine_version': self.engine_version,
            'engine_mode': self.engine_mode,
            'llm_info': model_info,
            'constitutional_mode': 'strict' if self.validator.strict_mode else 'permissive',
            'pattern_detector': {
                'similarity_threshold': self.pattern_detector.similarity_threshold,
                'min_occurrences': self.pattern_detector.min_occurrences
            },
            'capabilities': [
                'mirrorback_generation',
                'pattern_detection',
                'tension_tracking',
                'constitutional_validation',
                'telemetry_logging'
            ]
        }
