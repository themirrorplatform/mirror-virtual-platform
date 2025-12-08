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
        
        # Initialize LLM based on mode
        self.llm = self._initialize_llm()
        
        # Load constitution
        self.constitution = self._load_constitution()
        
        logger.info(f"ReflectionEngine initialized - mode: {settings.engine_mode}")
    
    def _initialize_llm(self):
        """Initialize LLM provider based on settings"""
        
        if self.settings.engine_mode == "local_llm":
            try:
                from mirrorcore.models.local_llm import LocalLLM
                return LocalLLM(
                    base_url=self.settings.ollama_base_url,
                    model=self.settings.ollama_model
                )
            except ImportError:
                logger.warning("LocalLLM not available, falling back to manual mode")
                return None
        
        elif self.settings.engine_mode == "remote_llm":
            try:
                from mirrorcore.models.remote_llm import RemoteLLM
                if not self.settings.anthropic_api_key:
                    raise ValueError("Remote LLM requires ANTHROPIC_API_KEY")
                return RemoteLLM(api_key=self.settings.anthropic_api_key)
            except ImportError:
                logger.warning("RemoteLLM not available, falling back to manual mode")
                return None
        
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
        
        # 2. Analyze patterns (if we have history)
        patterns = await self._analyze_patterns(text, identity_id)
        
        # 3. Build prompt
        prompt = self._build_prompt(text, patterns, context)
        
        # 4. Generate mirrorback
        if self.llm:
            try:
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
        
        # 5. Check constitutional compliance
        flags = self._check_constitutional_flags(mirrorback)
        
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
        
        # 7. Log engine run for evolution
        duration_ms = int((time.time() - start_time) * 1000)
        
        run_id = self.db.log_engine_run(
            reflection_id=reflection_id,
            config_version=self.settings.version,
            engine_mode=self.settings.engine_mode,
            patterns=patterns,
            tensions_surfaced=[],  # TODO: implement tension detection
            mirrorback_length=len(mirrorback),
            duration_ms=duration_ms,
            flags=flags
        )
        
        # 8. Return result
        return {
            'reflection_id': reflection_id,
            'run_id': run_id,
            'mirrorback': mirrorback,
            'patterns': patterns,
            'flags': flags,
            'duration_ms': duration_ms
        }
    
    async def _analyze_patterns(
        self,
        text: str,
        identity_id: str
    ) -> List[str]:
        """
        Analyze patterns in text based on history.
        
        TODO: Implement proper pattern detection
        For now, returns empty list
        """
        # Get recent reflections for context
        recent = self.db.list_reflections(identity_id=identity_id, limit=10)
        
        # TODO: Actual pattern analysis
        # - Recurring themes
        # - Emotional patterns
        # - Relational patterns
        # - Temporal patterns
        
        patterns = []
        
        # Simple keyword detection for now
        if any(word in text.lower() for word in ['should', 'supposed to', 'have to']):
            patterns.append("obligation_language")
        
        if any(word in text.lower() for word in ['always', 'never', 'everyone', 'no one']):
            patterns.append("absolute_thinking")
        
        if any(word in text.lower() for word in ['but', 'however', 'although', 'though']):
            patterns.append("internal_tension")
        
        return patterns
    
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
        
        Simple reflection-style response.
        """
        word_count = len(text.split())
        
        return f"""You've written {word_count} words about what's on your mind.

I'm in manual mode right now, so I can't generate a full mirrorback. But your reflection has been saved locally.

To use AI-powered mirrorbacks:
- Set engine_mode to "local_llm" (requires Ollama)
- Or set engine_mode to "remote_llm" (requires Anthropic API key)

Your reflections are safe and private in your local database."""
    
    def _check_constitutional_flags(self, mirrorback: str) -> Dict[str, Any]:
        """
        Check mirrorback for constitutional violations.
        
        Returns dict of flags (empty if no violations).
        """
        flags = {}
        
        # Check directive threshold
        directive_words = [
            'should', 'must', 'need to', 'have to', 'ought to',
            'try to', 'try doing', 'consider', 'recommend',
            'make sure', 'important to', 'it would be good'
        ]
        
        text_lower = mirrorback.lower()
        directive_count = sum(1 for word in directive_words if word in text_lower)
        total_words = len(mirrorback.split())
        
        if total_words > 0:
            directive_ratio = directive_count / total_words
            
            if directive_ratio > 0.15:  # 15% threshold
                flags['directive_threshold_exceeded'] = {
                    'ratio': round(directive_ratio, 3),
                    'threshold': 0.15,
                    'directive_count': directive_count,
                    'total_words': total_words
                }
        
        # Check for explicit advice patterns
        advice_patterns = [
            'you should',
            'you need to',
            'you must',
            'i recommend',
            'i suggest'
        ]
        
        advice_found = [p for p in advice_patterns if p in text_lower]
        if advice_found:
            flags['explicit_advice'] = advice_found
        
        # Check for outcome optimization
        optimization_words = ['better', 'improve', 'fix', 'solve', 'change']
        optimization_count = sum(1 for word in optimization_words if word in text_lower)
        
        if optimization_count > 3:
            flags['outcome_optimization'] = {
                'count': optimization_count,
                'words': optimization_words
            }
        
        return flags
    
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics"""
        return {
            'engine_mode': self.settings.engine_mode,
            'llm_available': self.llm is not None,
            'constitution_loaded': bool(self.constitution),
            'version': self.settings.version
        }

