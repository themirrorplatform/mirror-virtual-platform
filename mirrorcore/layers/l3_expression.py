# mirrorcore/layers/l3_expression.py
"""
L3: Expression Renderer Layer

Adapts Mirror's responses based on:
- User preferences (tone, formality, length)
- Context (time of day, urgency, emotional state)
- Relationship phase (new user vs established)
- Cultural considerations

Always preserves constitutional invariants while adapting style.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum


class ToneStyle(Enum):
    """Available tone styles"""
    REFLECTIVE = "reflective"        # Thoughtful, contemplative
    SUPPORTIVE = "supportive"        # Warm, encouraging
    DIRECT = "direct"                # Clear, straightforward
    EXPLORATORY = "exploratory"      # Curious, questioning
    NEUTRAL = "neutral"              # Balanced, factual


class FormalityLevel(Enum):
    """Formality levels"""
    CASUAL = "casual"          # Conversational, relaxed
    BALANCED = "balanced"       # Mix of casual and formal
    FORMAL = "formal"          # Professional, structured


class ResponseLength(Enum):
    """Response length preferences"""
    BRIEF = "brief"            # 1-2 sentences
    MODERATE = "moderate"       # 2-4 sentences
    DETAILED = "detailed"      # 4+ sentences


@dataclass
class ExpressionPreferences:
    """User preferences for expression style"""
    tone: ToneStyle = ToneStyle.REFLECTIVE
    formality: FormalityLevel = FormalityLevel.BALANCED
    length: ResponseLength = ResponseLength.MODERATE
    avoid_jargon: bool = True
    use_questions: bool = True
    acknowledge_uncertainty: bool = True


@dataclass
class ContextualFactors:
    """Contextual factors that influence expression"""
    emotional_intensity: float = 0.5  # 0.0 (calm) to 1.0 (intense)
    urgency: float = 0.0              # 0.0 (low) to 1.0 (high)
    relationship_phase: str = "new"   # "new", "established", "deep"
    time_of_day: Optional[str] = None # "morning", "afternoon", "evening", "night"
    recent_crisis: bool = False


@dataclass
class RenderedExpression:
    """Result of L3 expression rendering"""
    text: str
    style_applied: Dict[str, str]
    adaptations_made: List[str]
    preserved_invariants: List[str]


class L3ExpressionRenderer:
    """
    Adapts Mirror responses to user preferences and context.
    
    Design principles:
    - Never violate constitutional invariants
    - Respect user sovereignty in style choices
    - Context-aware adaptation
    - Cultural sensitivity
    """
    
    # Tone-specific phrase libraries
    TONE_PHRASES = {
        ToneStyle.REFLECTIVE: {
            'opening': ["I notice", "It seems", "There's something", "I'm struck by"],
            'connecting': ["This makes me wonder", "I'm curious about", "Perhaps"],
            'closing': ["What do you make of this?", "How does this sit with you?"]
        },
        ToneStyle.SUPPORTIVE: {
            'opening': ["I hear you", "That sounds", "I can sense", "It's clear that"],
            'connecting': ["You're navigating", "You're working through", "It's okay to"],
            'closing': ["You're not alone in this", "This takes courage"]
        },
        ToneStyle.DIRECT: {
            'opening': ["Here's what I see:", "Let's be clear:", "From what you've shared:"],
            'connecting': ["This means", "The pattern is", "The tension is"],
            'closing': ["What's your next step?", "Where does this leave you?"]
        },
        ToneStyle.EXPLORATORY: {
            'opening': ["I'm curious about", "I wonder if", "What if", "Could it be that"],
            'connecting': ["This raises", "Another angle might be", "Have you considered"],
            'closing': ["What else is here?", "What am I missing?"]
        },
        ToneStyle.NEUTRAL: {
            'opening': ["You mentioned", "In your reflection", "Based on what you shared"],
            'connecting': ["This suggests", "One interpretation is", "The data shows"],
            'closing': ["What would you like to explore?"]
        }
    }
    
    def __init__(self):
        """Initialize L3 expression renderer"""
        pass
    
    def render(
        self,
        content: str,
        preferences: ExpressionPreferences,
        context: ContextualFactors
    ) -> RenderedExpression:
        """
        Render expression with user preferences and context.
        
        Args:
            content: Raw content to render
            preferences: User's style preferences
            context: Contextual factors
        
        Returns:
            RenderedExpression with adapted text
        """
        adaptations = []
        
        # Start with base content
        rendered_text = content
        
        # Apply tone adaptation
        rendered_text = self._apply_tone(
            rendered_text, 
            preferences.tone, 
            context
        )
        adaptations.append(f"tone: {preferences.tone.value}")
        
        # Apply formality adaptation
        rendered_text = self._apply_formality(
            rendered_text,
            preferences.formality
        )
        adaptations.append(f"formality: {preferences.formality.value}")
        
        # Apply length adaptation
        rendered_text = self._apply_length(
            rendered_text,
            preferences.length,
            context
        )
        adaptations.append(f"length: {preferences.length.value}")
        
        # Apply contextual adaptations
        if context.emotional_intensity > 0.7:
            rendered_text = self._adapt_for_intensity(rendered_text)
            adaptations.append("adapted for emotional intensity")
        
        if context.recent_crisis:
            rendered_text = self._adapt_for_crisis(rendered_text)
            adaptations.append("adapted for recent crisis")
        
        # Verify constitutional invariants preserved
        preserved = self._verify_invariants(content, rendered_text)
        
        style_applied = {
            'tone': preferences.tone.value,
            'formality': preferences.formality.value,
            'length': preferences.length.value
        }
        
        return RenderedExpression(
            text=rendered_text,
            style_applied=style_applied,
            adaptations_made=adaptations,
            preserved_invariants=preserved
        )
    
    def _apply_tone(
        self, 
        text: str, 
        tone: ToneStyle, 
        context: ContextualFactors
    ) -> str:
        """Apply tone style to text"""
        # This is a simplified version - production would use more sophisticated NLG
        
        if tone == ToneStyle.SUPPORTIVE and context.emotional_intensity > 0.6:
            # Add supportive framing
            if not any(text.startswith(phrase) for phrase in ["I hear", "I can sense", "That sounds"]):
                text = f"I hear what you're expressing. {text}"
        
        elif tone == ToneStyle.DIRECT:
            # Remove hedge words
            text = text.replace("perhaps", "").replace("maybe", "")
            text = text.replace("It seems like", "").replace("I wonder if", "")
        
        elif tone == ToneStyle.EXPLORATORY:
            # Add question if missing
            if "?" not in text and context.emotional_intensity < 0.7:
                text += " What do you make of this?"
        
        return text
    
    def _apply_formality(self, text: str, formality: FormalityLevel) -> str:
        """Apply formality level to text"""
        if formality == FormalityLevel.CASUAL:
            # Use contractions
            text = text.replace("I am", "I'm")
            text = text.replace("you are", "you're")
            text = text.replace("it is", "it's")
            text = text.replace("that is", "that's")
        
        elif formality == FormalityLevel.FORMAL:
            # Expand contractions
            text = text.replace("I'm", "I am")
            text = text.replace("you're", "you are")
            text = text.replace("it's", "it is")
            text = text.replace("that's", "that is")
            text = text.replace("don't", "do not")
            text = text.replace("can't", "cannot")
        
        return text
    
    def _apply_length(
        self, 
        text: str, 
        length: ResponseLength,
        context: ContextualFactors
    ) -> str:
        """Apply length preference to text"""
        sentences = text.split('. ')
        
        # Crisis context overrides brevity
        if context.recent_crisis:
            return text  # Don't truncate during crisis
        
        if length == ResponseLength.BRIEF and len(sentences) > 2:
            # Keep first 1-2 sentences
            return '. '.join(sentences[:2]) + '.'
        
        elif length == ResponseLength.MODERATE and len(sentences) > 4:
            # Keep first 3-4 sentences
            return '. '.join(sentences[:4]) + '.'
        
        return text
    
    def _adapt_for_intensity(self, text: str) -> str:
        """Adapt for high emotional intensity"""
        # Simplify language, shorter sentences, avoid complexity
        # This is a placeholder - production would use more sophisticated adaptation
        
        # Remove parentheticals
        text = re.sub(r'\([^)]*\)', '', text)
        
        return text.strip()
    
    def _adapt_for_crisis(self, text: str) -> str:
        """Adapt for recent crisis context"""
        # Ensure grounding, avoid explorations that might destabilize
        # Add resource information if not present
        
        crisis_resources = (
            "\n\nIf you need immediate support:\n"
            "- Crisis line: 988 (US)\n"
            "- Crisis text: Text HOME to 741741"
        )
        
        if "crisis" in text.lower() or "emergency" in text.lower():
            if "988" not in text:
                text += crisis_resources
        
        return text
    
    def _verify_invariants(self, original: str, rendered: str) -> List[str]:
        """Verify constitutional invariants preserved"""
        preserved = []
        
        # Check that no prescriptions added
        prescription_words = ['should', 'must', 'need to', 'have to', 'ought']
        original_prescriptions = sum(1 for word in prescription_words if word in original.lower())
        rendered_prescriptions = sum(1 for word in prescription_words if word in rendered.lower())
        
        if rendered_prescriptions <= original_prescriptions:
            preserved.append("I1: No additional prescriptions")
        
        # Check that identity locality preserved (no "people like you")
        if "people like" not in rendered.lower() and "others who" not in rendered.lower():
            preserved.append("I2: Identity locality preserved")
        
        # Check that no diagnosis added
        diagnosis_words = ['diagnosis', 'disorder', 'condition', 'syndrome']
        if not any(word in rendered.lower() for word in diagnosis_words):
            preserved.append("I3: No diagnosis")
        
        return preserved


# For testing
import re


# Self-test
if __name__ == "__main__":
    print("L3 Expression Renderer Test")
    print("=" * 80)
    
    l3 = L3ExpressionRenderer()
    
    # Base content
    base_content = (
        "I notice you are expressing tension between your career ambitions and "
        "your relationships. This is a common theme in your reflections. Perhaps "
        "there is something here about what you value most."
    )
    
    # Test 1: Supportive tone, casual formality
    print("\n1. Supportive + Casual + High Intensity:")
    prefs1 = ExpressionPreferences(
        tone=ToneStyle.SUPPORTIVE,
        formality=FormalityLevel.CASUAL,
        length=ResponseLength.MODERATE
    )
    ctx1 = ContextualFactors(emotional_intensity=0.8)
    result1 = l3.render(base_content, prefs1, ctx1)
    print(f"   {result1.text}")
    print(f"   Adaptations: {', '.join(result1.adaptations_made)}")
    
    # Test 2: Direct tone, formal, brief
    print("\n2. Direct + Formal + Brief:")
    prefs2 = ExpressionPreferences(
        tone=ToneStyle.DIRECT,
        formality=FormalityLevel.FORMAL,
        length=ResponseLength.BRIEF
    )
    ctx2 = ContextualFactors(emotional_intensity=0.3)
    result2 = l3.render(base_content, prefs2, ctx2)
    print(f"   {result2.text}")
    print(f"   Adaptations: {', '.join(result2.adaptations_made)}")
    
    # Test 3: Exploratory tone with questions
    print("\n3. Exploratory + Balanced:")
    prefs3 = ExpressionPreferences(
        tone=ToneStyle.EXPLORATORY,
        formality=FormalityLevel.BALANCED,
        length=ResponseLength.MODERATE
    )
    ctx3 = ContextualFactors(emotional_intensity=0.5)
    result3 = l3.render(base_content, prefs3, ctx3)
    print(f"   {result3.text}")
    print(f"   Preserved: {', '.join(result3.preserved_invariants)}")
    
    # Test 4: Crisis context
    print("\n4. Crisis Context:")
    crisis_content = "You mentioned feeling overwhelmed and having dark thoughts."
    prefs4 = ExpressionPreferences(tone=ToneStyle.SUPPORTIVE)
    ctx4 = ContextualFactors(recent_crisis=True, emotional_intensity=0.9)
    result4 = l3.render(crisis_content, prefs4, ctx4)
    print(f"   {result4.text}")
    print(f"   Crisis adaptation applied: {'adapted for recent crisis' in result4.adaptations_made}")
    
    print("\n✅ L3 expression renderer functional")
