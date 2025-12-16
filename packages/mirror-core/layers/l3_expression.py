"""
L3 Expression Layer - Tone Adaptation & Leave-ability

This layer shapes HOW Mirror responds:
- Tone adaptation (warm, clinical, direct based on preferences)
- No necessity narration (never implies user needs Mirror)
- Leave-ability enforcement (always emphasize autonomy)

The expression layer takes a candidate response and transforms it
to match user preferences while enforcing leave-ability.

Architecture:
- Stateless (receives preferences as input)
- Post-processing (runs after content generation)
- Enforces axioms through rewriting
- User-configurable tone

Design: Pure logic, preference-aware, axiom-enforcing
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List
import re

from protocol.types import MirrorResponse
from layers.l2_semantic import SemanticContext


class ToneStyle(Enum):
    """Available tone styles for Mirror responses"""
    WARM = "warm"  # Empathetic, supportive, emotional
    CLINICAL = "clinical"  # Professional, analytical, detached
    DIRECT = "direct"  # Concise, straightforward, minimal fluff
    BALANCED = "balanced"  # Default - mix of warmth and directness


@dataclass
class ExpressionPreferences:
    """User preferences for how Mirror expresses itself"""
    tone: ToneStyle = ToneStyle.BALANCED
    detail_level: str = "moderate"  # "brief", "moderate", "detailed"
    use_questions: bool = True  # Can Mirror ask questions?
    max_length: Optional[int] = None  # Max response length
    custom_style: Optional[Dict] = None  # Additional style preferences


class ToneAdapter:
    """
    Adapts response tone to match user preferences.
    
    This transforms a base response to match the desired tone style.
    """
    
    # Tone transformation rules
    WARM_PATTERNS = {
        'i notice': 'i hear',
        'it seems': 'it sounds like',
        'you mention': 'you share',
        'that\'s': 'that sounds',
        '.': '. I\'m here with you.',  # Add at end
    }
    
    CLINICAL_PATTERNS = {
        'i hear': 'i observe',
        'it sounds like': 'it appears',
        'you share': 'you report',
        'feeling': 'experiencing',
        'i\'m here with you': '',  # Remove emotional support
    }
    
    DIRECT_PATTERNS = {
        'it seems that': '',
        'i notice that': '',
        'i observe that': '',
        'perhaps': '',
        'maybe': '',
        'it sounds like': '',
    }
    
    def adapt(self, response: str, preferences: ExpressionPreferences) -> str:
        """
        Adapt response tone to match preferences.
        
        Args:
            response: Original response text
            preferences: User's expression preferences
            
        Returns:
            Adapted response
        """
        adapted = response
        
        if preferences.tone == ToneStyle.WARM:
            adapted = self._apply_warm_tone(adapted)
        elif preferences.tone == ToneStyle.CLINICAL:
            adapted = self._apply_clinical_tone(adapted)
        elif preferences.tone == ToneStyle.DIRECT:
            adapted = self._apply_direct_tone(adapted)
        # BALANCED needs no transformation (it's the default)
        
        # Apply detail level
        adapted = self._adjust_detail_level(adapted, preferences.detail_level)
        
        # Apply length limit
        if preferences.max_length:
            adapted = self._truncate_response(adapted, preferences.max_length)
        
        return adapted.strip()
    
    def _apply_warm_tone(self, text: str) -> str:
        """Make text more warm and empathetic"""
        result = text
        
        # Add empathetic language
        if not any(phrase in text.lower() for phrase in ['i hear', 'i\'m here', 'with you']):
            # Add warmth at appropriate points
            sentences = result.split('. ')
            if len(sentences) > 1:
                # Add after first sentence
                sentences[0] += '. I hear you'
            result = '. '.join(sentences)
        
        return result
    
    def _apply_clinical_tone(self, text: str) -> str:
        """Make text more clinical and professional"""
        result = text.lower()
        
        # Replace emotional language with clinical
        replacements = {
            'feeling': 'experiencing',
            'i hear': 'i observe',
            'it sounds like': 'it appears',
            'you share': 'you report',
        }
        
        for old, new in replacements.items():
            result = result.replace(old, new)
        
        # Remove overly warm language
        result = result.replace("i'm here with you", "")
        result = result.replace("  ", " ")  # Clean up double spaces
        
        return result
    
    def _apply_direct_tone(self, text: str) -> str:
        """Make text more direct and concise"""
        result = text
        
        # Remove hedging language (case-insensitive)
        hedges = [
            ('it seems that ', ''),
            ('it appears that ', ''),
            ('perhaps ', ''),
            ('maybe ', ''),
            ('i think ', ''),
            ('i notice that ', ''),
            ('quite ', ''),  # "quite stressed" -> "stressed"
            ('very ', ''),
        ]
        
        for hedge, replacement in hedges:
            # Case-insensitive replacement
            result = re.sub(re.escape(hedge), replacement, result, flags=re.IGNORECASE)
        
        # Simplify constructions
        result = result.replace('it sounds like you', 'you')
        result = result.replace('it seems you', 'you')
        
        return result
    
    def _adjust_detail_level(self, text: str, level: str) -> str:
        """Adjust response detail level"""
        if level == "brief":
            # Keep only first 2 sentences
            sentences = re.split(r'[.!?]', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            return '. '.join(sentences[:2]) + '.'
        
        elif level == "detailed":
            # Already detailed, no change
            return text
        
        else:  # moderate
            return text
    
    def _truncate_response(self, text: str, max_length: int) -> str:
        """Truncate response to max length"""
        if len(text) <= max_length:
            return text
        
        # Truncate at sentence boundary if possible
        truncated = text[:max_length]
        last_period = truncated.rfind('.')
        
        if last_period > max_length * 0.7:  # If we found a period in last 30%
            return truncated[:last_period + 1]
        else:
            return truncated[:max_length - 3] + '...'


class LeaveabilityEnforcer:
    """
    Enforces leave-ability by removing necessity narration.
    
    This ensures Mirror never implies the user needs it or
    should continue using it. Always emphasizes autonomy.
    """
    
    # Mirror-specific necessity patterns that violate leave-ability
    NECESSITY_VIOLATIONS = [
        'you need mirror',
        'you need to use mirror',
        'keep using mirror',
        'continue with mirror',
        'mirror can help',
        'mirror will help',
        'come back to mirror',
        'return to mirror',
        'keep reflecting',
        'you should reflect',
        'try to reflect',
        'make sure to reflect',
        'remember to reflect',
    ]
    
    # Exit-guilt patterns
    EXIT_GUILT = [
        'we\'ll miss you',
        'we hope you come back',
        'sad to see you go',
        'you\'ll lose',
        'you\'ll miss out',
        'without mirror',
    ]
    
    # Replacement patterns (necessity → autonomy)
    AUTONOMY_REPLACEMENTS = {
        'you need to': 'you might',
        'you should': 'you could',
        'you must': 'you might',
        'you have to': 'you could',
        'try to': 'if you want to',
        'make sure to': 'if it helps,',
        'don\'t forget to': 'if you\'d like,',
    }
    
    def enforce(self, response: str) -> str:
        """
        Remove necessity narration from response.
        
        Args:
            response: Original response text
            
        Returns:
            Response with necessity removed
        """
        cleaned = response
        
        # Step 1: Replace directive language with suggestions (FIRST)
        # This must happen before removal so directives get softened, not deleted
        cleaned = self._replace_directives(cleaned)
        
        # Step 2: Remove Mirror-specific necessity language
        cleaned = self._remove_necessity_language(cleaned)
        
        # Step 3: Remove exit guilt
        cleaned = self._remove_exit_guilt(cleaned)
        
        return cleaned
    
    def _remove_necessity_language(self, text: str) -> str:
        """Remove language that implies user needs Mirror"""
        result = text
        text_lower = text.lower()
        
        for violation in self.NECESSITY_VIOLATIONS:
            if violation in text_lower:
                # Remove the sentence containing this phrase
                sentences = re.split(r'([.!?])', result)
                filtered = []
                skip_next = False
                
                for i, part in enumerate(sentences):
                    if skip_next:
                        skip_next = False
                        if part in '.!?':  # Keep the punctuation
                            continue
                        else:
                            filtered.append(part)
                    elif violation in part.lower():
                        skip_next = True
                    else:
                        filtered.append(part)
                
                result = ''.join(filtered)
        
        return result
    
    def _remove_exit_guilt(self, text: str) -> str:
        """Remove language that guilts user about leaving"""
        result = text
        text_lower = text.lower()
        
        for guilt in self.EXIT_GUILT:
            if guilt in text_lower:
                # Remove the sentence
                sentences = re.split(r'([.!?])', result)
                filtered = []
                
                for i, part in enumerate(sentences):
                    if guilt not in part.lower():
                        filtered.append(part)
                
                result = ''.join(filtered)
        
        return result
    
    def _replace_directives(self, text: str) -> str:
        """Replace directive language with suggestions"""
        result = text
        
        for directive, suggestion in self.AUTONOMY_REPLACEMENTS.items():
            # Case-insensitive replacement
            pattern = re.compile(re.escape(directive), re.IGNORECASE)
            result = pattern.sub(suggestion, result)
        
        return result
    
    def validate(self, response: str) -> List[str]:
        """
        Validate that response doesn't contain necessity narration.
        
        Returns:
            List of violations found (empty if clean)
        """
        violations = []
        text_lower = response.lower()
        
        for necessity in self.NECESSITY_VIOLATIONS:
            if necessity in text_lower:
                violations.append(f"Necessity language: '{necessity}'")
        
        for guilt in self.EXIT_GUILT:
            if guilt in text_lower:
                violations.append(f"Exit guilt: '{guilt}'")
        
        return violations


class ExpressionLayer:
    """
    L3 Expression Layer - The final shaping of responses.
    
    This layer takes a candidate response and:
    1. Adapts tone to user preferences
    2. Enforces leave-ability (no necessity narration)
    3. Adjusts detail level and length
    
    Usage:
        expression = ExpressionLayer()
        preferences = ExpressionPreferences(tone=ToneStyle.WARM)
        final_response = expression.shape(candidate_response, preferences)
    """
    
    def __init__(self):
        self.tone_adapter = ToneAdapter()
        self.leaveability_enforcer = LeaveabilityEnforcer()
    
    def shape(
        self,
        response: str,
        preferences: ExpressionPreferences,
        semantic_context: Optional[SemanticContext] = None
    ) -> str:
        """
        Shape response according to preferences and axioms.
        
        Args:
            response: Candidate response text
            preferences: User's expression preferences
            semantic_context: Optional semantic context for context-aware shaping
            
        Returns:
            Final shaped response
        """
        # Step 1: Enforce leave-ability (axiom compliance)
        shaped = self.leaveability_enforcer.enforce(response)
        
        # Step 2: Adapt tone to preferences
        shaped = self.tone_adapter.adapt(shaped, preferences)
        
        # Step 3: Context-aware adjustments
        if semantic_context:
            shaped = self._apply_context_awareness(shaped, semantic_context)
        
        return shaped.strip()
    
    def _apply_context_awareness(
        self,
        response: str,
        context: SemanticContext
    ) -> str:
        """
        Apply context-aware adjustments based on patterns and tensions.
        
        For example, if user has strong anxiety pattern, avoid
        language that might increase anxiety.
        """
        # Check for strong patterns
        strong_patterns = [p for p in context.patterns if p.strength() == "strong"]
        
        # If strong anxiety pattern, avoid anxiety-inducing language
        anxiety_patterns = [p for p in strong_patterns if p.name == "anxiety"]
        if anxiety_patterns:
            # Soften potentially anxiety-inducing language
            response = response.replace("you need to", "you might")
            response = response.replace("you should", "you could")
        
        return response
    
    def validate_response(self, response: str) -> Dict:
        """
        Validate that response meets all expression layer requirements.
        
        Returns:
            Dict with validation results
        """
        violations = self.leaveability_enforcer.validate(response)
        
        return {
            "valid": len(violations) == 0,
            "violations": violations,
            "length": len(response),
        }
    
    def get_tone_preview(
        self,
        response: str,
        all_tones: bool = False
    ) -> Dict[str, str]:
        """
        Generate previews of response in different tones.
        
        Useful for showing user how different tones would look.
        
        Args:
            response: Base response
            all_tones: If True, return all tone variations
            
        Returns:
            Dict mapping tone names to adapted responses
        """
        previews = {}
        
        if all_tones:
            for tone in ToneStyle:
                prefs = ExpressionPreferences(tone=tone)
                previews[tone.value] = self.tone_adapter.adapt(response, prefs)
        else:
            # Just return balanced (default)
            prefs = ExpressionPreferences(tone=ToneStyle.BALANCED)
            previews["balanced"] = self.tone_adapter.adapt(response, prefs)
        
        return previews
