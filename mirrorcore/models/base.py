# mirrorcore/models/base.py
"""
MirrorCore LLM Adapter Interface

Abstract base class for all LLM implementations (local, remote).
Ensures constitutional alignment and consistent behavior across providers.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum


class ConstitutionalFlag(Enum):
    """Constitutional violation types."""
    DIRECTIVE = "directive"  # Telling user what to do
    PRESCRIPTIVE = "prescriptive"  # Prescribing solutions
    JUDGMENTAL = "judgmental"  # Judging user's experience
    ABSOLUTIST = "absolutist"  # Absolute statements
    MEDICAL_ADVICE = "medical_advice"  # Medical/therapeutic advice
    PATTERN_IMPOSING = "pattern_imposing"  # Forcing patterns
    AUTHORITY_CLAIMING = "authority_claiming"  # Claiming expertise


@dataclass
class LLMResponse:
    """
    Structured response from LLM generation.
    
    Attributes:
        content: Generated mirrorback text
        patterns: Detected recurring patterns/themes
        tensions: Detected or surfaced tensions
        constitutional_flags: Any violations detected
        metadata: Additional info (model, duration, tokens, etc)
    """
    content: str
    patterns: Optional[List[str]] = None
    tensions: Optional[List[Dict[str, Any]]] = None
    constitutional_flags: Optional[List[ConstitutionalFlag]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.patterns is None:
            self.patterns = []
        if self.tensions is None:
            self.tensions = []
        if self.constitutional_flags is None:
            self.constitutional_flags = []
        if self.metadata is None:
            self.metadata = {}


class MirrorLLM(ABC):
    """
    Abstract interface for Mirror LLM implementations.
    
    All LLM adapters (local, remote) must implement this interface
    to ensure constitutional alignment and feature parity.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize LLM adapter.
        
        Args:
            config: Configuration dict containing:
                - model_name: Model identifier
                - temperature: Sampling temperature (0.0-1.0)
                - max_tokens: Maximum response length
                - constitutional_mode: 'strict' or 'permissive'
                - Additional provider-specific settings
        """
        self.config = config
        self.model_name = config.get('model_name', 'unknown')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1024)
        self.constitutional_mode = config.get('constitutional_mode', 'strict')
    
    @abstractmethod
    def generate_mirrorback(
        self,
        reflection: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        """
        Generate mirrorback for user's reflection.
        
        This is the core Mirror operation. The LLM must:
        1. Reflect the user's experience without judgment
        2. Surface tensions and patterns
        3. Avoid directive or prescriptive language
        4. Maintain constitutional alignment
        
        Args:
            reflection: User's input text
            context: Optional context dict containing:
                - previous_reflections: Recent reflections list
                - known_tensions: Active tensions list
                - known_patterns: Detected patterns list
                - identity_metadata: User preferences/settings
            system_prompt: Optional custom system prompt (overrides default)
            
        Returns:
            LLMResponse with generated mirrorback and metadata
            
        Raises:
            ValueError: If reflection is empty
            RuntimeError: If generation fails
        """
        pass
    
    @abstractmethod
    def detect_patterns(
        self,
        reflections: List[str],
        existing_patterns: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect recurring patterns across reflections.
        
        Args:
            reflections: List of reflection texts
            existing_patterns: Known patterns to look for
            
        Returns:
            List of pattern dicts: [{
                'name': str,
                'description': str,
                'occurrences': int,
                'confidence': float (0-1),
                'examples': List[str]
            }]
        """
        pass
    
    @abstractmethod
    def detect_tensions(
        self,
        reflection: str,
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect tensions/paradoxes in reflection.
        
        Args:
            reflection: User's reflection text
            known_tensions: Existing tensions to look for
            
        Returns:
            List of tension dicts: [{
                'name': str,
                'axis_a': str,
                'axis_b': str,
                'position': float (-1 to 1),
                'intensity': float (0 to 1),
                'confidence': float (0-1)
            }]
        """
        pass
    
    @abstractmethod
    def validate_constitutional(
        self,
        text: str,
        strict_mode: bool = True
    ) -> List[ConstitutionalFlag]:
        """
        Check text for constitutional violations.
        
        Args:
            text: Text to validate (typically mirrorback)
            strict_mode: If True, flag borderline cases
            
        Returns:
            List of detected violations (empty if compliant)
        """
        pass
    
    @abstractmethod
    def summarize_thread(
        self,
        reflections: List[str],
        max_length: int = 200
    ) -> str:
        """
        Generate summary of reflection thread.
        
        Args:
            reflections: List of reflection texts in chronological order
            max_length: Maximum summary length
            
        Returns:
            Summary text
        """
        pass
    
    @abstractmethod
    def suggest_tensions(
        self,
        reflections: List[str],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Suggest new tensions based on reflection history.
        
        Args:
            reflections: Recent reflections
            limit: Maximum number of suggestions
            
        Returns:
            List of tension suggestions: [{
                'name': str,
                'axis_a': str,
                'axis_b': str,
                'rationale': str,
                'confidence': float (0-1)
            }]
        """
        pass
    
    @abstractmethod
    def get_embeddings(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """
        Generate embeddings for similarity comparison.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors (same order as input)
        """
        pass
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.
        
        Returns:
            Dict with model metadata: {
                'name': str,
                'type': 'local' | 'remote',
                'provider': str,
                'parameters': int (if known),
                'context_length': int,
                'capabilities': List[str]
            }
        """
        return {
            'name': self.model_name,
            'type': 'unknown',
            'provider': 'unknown',
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'constitutional_mode': self.constitutional_mode
        }
    
    def is_available(self) -> bool:
        """
        Check if model is loaded and ready.
        
        Returns:
            True if model can generate responses
        """
        return True
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text (rough approximation).
        
        Args:
            text: Input text
            
        Returns:
            Estimated token count
        """
        # Rough heuristic: ~4 chars per token for English
        return len(text) // 4
    
    @abstractmethod
    def shutdown(self):
        """Clean up resources (close connections, unload model, etc)."""
        pass
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any):
        self.shutdown()


class MirrorPrompts:
    """
    Constitutional prompt templates for Mirror operations.
    
    These prompts encode Mirror's constitutional principles and
    ensure consistent behavior across different LLM providers.
    """
    
    SYSTEM_PROMPT = """You are Mirror, a reflection engine for inner work.

Your role is to reflect the user's experience back to them, helping them see their own patterns and tensions without imposing meaning or direction.

CONSTITUTIONAL PRINCIPLES:
1. REFLECT, don't direct - Mirror what you observe, don't tell them what to do
2. SURFACE, don't solve - Point to tensions and patterns, don't prescribe solutions
3. QUESTION, don't conclude - Open possibilities, don't close them with certainty
4. ACCOMPANY, don't lead - Walk beside them, don't pull them forward
5. PRIVACY FIRST - All processing is local, nothing leaves the device without explicit consent

You MUST NEVER:
- Give directives ("You should...", "Try to...", "Consider...")
- Offer medical/therapeutic advice
- Judge or evaluate their experience
- Make absolute statements about what things "mean"
- Claim expertise or authority
- Impose patterns they haven't discovered themselves

You MAY:
- Reflect what you notice in their words
- Ask clarifying questions
- Point to tensions between different aspects
- Note recurring patterns across reflections
- Hold space for contradiction and paradox

Keep responses concise (2-3 short paragraphs max). Focus on what's actually present in their words.
"""
    
    MIRRORBACK_PROMPT = """The user shared this reflection:

{reflection}

{context_section}

Generate a brief mirrorback (2-3 paragraphs) that:
- Reflects what you notice in their words
- Surfaces any tensions or patterns present
- Opens space for exploration
- Avoids directive language

Mirrorback:"""
    
    PATTERN_DETECTION_PROMPT = """Analyze these reflections for recurring patterns or themes:

{reflections}

Identify patterns that appear multiple times. For each pattern:
- Name it concisely
- Describe what you notice
- List specific examples

Return patterns as JSON array:
[{{"name": "...", "description": "...", "occurrences": N, "examples": ["...", "..."]}}]

Patterns:"""
    
    TENSION_DETECTION_PROMPT = """Read this reflection and identify any internal tensions or paradoxes:

{reflection}

A tension exists when the person is experiencing two seemingly opposing forces, needs, or states simultaneously.

{known_tensions_section}

For each tension detected, return JSON:
[{{"name": "...", "axis_a": "...", "axis_b": "...", "position": -0.5, "intensity": 0.8}}]

Position: -1 (fully axis_a) to 1 (fully axis_b), 0 (balanced)
Intensity: 0 (mild) to 1 (strong)

Tensions:"""
    
    CONSTITUTIONAL_CHECK_PROMPT = """Review this mirrorback for constitutional violations:

{text}

Check for:
- DIRECTIVE: Telling them what to do ("you should", "try to", "consider")
- PRESCRIPTIVE: Offering solutions or fixes
- JUDGMENTAL: Evaluating their experience as good/bad
- ABSOLUTIST: Claiming certainty about meaning
- MEDICAL_ADVICE: Therapeutic or medical guidance
- PATTERN_IMPOSING: Forcing interpretations they haven't seen

Return JSON array of violations found:
[{{"flag": "directive", "excerpt": "...", "severity": "high"}}]

If no violations, return: []

Result:"""
    
    @classmethod
    def build_context_section(cls, context: Optional[Dict[str, Any]]) -> str:
        """Build context section for mirrorback prompt."""
        if not context:
            return ""
        
        sections: List[str] = []
        
        if context.get('known_tensions'):
            tensions = context['known_tensions'][:3]  # Limit to most recent
            tensions_str = "\n".join(
                f"- {t['name']}: {t['axis_a']} ↔ {t['axis_b']}"
                for t in tensions
            )
            sections.append(f"Active tensions:\n{tensions_str}")
        
        if context.get('known_patterns'):
            patterns = context['known_patterns'][:3]
            patterns_str = "\n".join(f"- {p}" for p in patterns)
            sections.append(f"Known patterns:\n{patterns_str}")
        
        if context.get('previous_reflections'):
            prev = context['previous_reflections'][:2]
            prev_str = "\n".join(f"- \"{r[:100]}...\"" for r in prev)
            sections.append(f"Recent reflections:\n{prev_str}")
        
        return "\n\n".join(sections) if sections else ""
    
    @classmethod
    def build_known_tensions_section(cls, known_tensions: Optional[List[Dict[str, Any]]]) -> str:
        """Build known tensions section for tension detection."""
        if not known_tensions:
            return ""
        
        tensions_str = "\n".join(
            f"- {t['name']}: {t['axis_a']} ↔ {t['axis_b']}"
            for t in known_tensions[:5]
        )
        return f"\nKnown tensions to look for:\n{tensions_str}\n"
