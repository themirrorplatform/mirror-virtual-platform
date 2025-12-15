# mirrorcore/layers/l2_reflection.py
"""
L2: Reflection Transformer Layer

Transforms raw input into structured reflection with:
- Pattern detection (relationships, temporal, emotional)
- Tension preservation (contradictions)
- Theme tracking (recurring concepts)
- Evolution monitoring (changes over time)

This layer enriches reflection with semantic metadata while preserving
the user's original voice.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class DetectedPattern:
    """A pattern detected in the reflection"""
    type: str  # "relational", "temporal", "emotional", "identity", "growth"
    content: str
    confidence: float  # 0.0 to 1.0
    start_pos: int
    end_pos: int


@dataclass
class DetectedTension:
    """A tension/contradiction in the reflection"""
    concept_a: str
    concept_b: str
    relationship: str  # "contradicts", "conflicts", "balances"
    marker: str  # The word/phrase that indicates tension
    confidence: float


@dataclass
class DetectedTheme:
    """A theme in the reflection"""
    name: str
    keywords: List[str]
    strength: float  # 0.0 to 1.0


@dataclass
class TransformedReflection:
    """Result of L2 transformation"""
    original_text: str
    patterns: List[DetectedPattern]
    tensions: List[DetectedTension]
    themes: List[DetectedTheme]
    metadata: Dict[str, Any]


class L2ReflectionTransformer:
    """
    Transforms raw reflection into structured semantic representation.
    
    Design principles:
    - Preserve original voice (no rewriting)
    - Extract semantic metadata
    - Detect patterns, tensions, themes
    - Track evolution over time
    """
    
    # Pattern detection regexes
    RELATIONAL_PATTERNS = [
        (r'\b(my|our) (relationship|partner|friend|family|parent|child)', 'relationship_mention'),
        (r'\b(feel(?:s|ing)?) (close|distant|connected|disconnected) (to|with|from)', 'relational_state'),
        (r'\b(miss|love|hate|resent|appreciate) (my|someone|them|him|her)', 'relational_emotion'),
        (r'\b(with|without) (my|someone|them)', 'relational_context'),
    ]
    
    TEMPORAL_PATTERNS = [
        (r'\b(used to|no longer|anymore)\b', 'change_marker'),
        (r'\b(becoming|turning into|evolving|transforming)\b', 'growth_marker'),
        (r'\b(before|after|since|when I was)\b', 'temporal_marker'),
        (r'\b(future|past|present|now|then)\b', 'temporal_orientation'),
    ]
    
    EMOTIONAL_PATTERNS = [
        (r'\b(feel(?:s|ing)?) (sad|angry|happy|anxious|scared|excited|grateful|hopeful)\b', 'emotion_direct'),
        (r'\b(overwhelm(?:ed|ing)?|numb|empty|full|torn|stuck|trapped|free)\b', 'emotion_state'),
        (r'\b(cry(?:ing)?|laugh(?:ing)?|scream(?:ing)?)\b', 'emotion_expression'),
    ]
    
    IDENTITY_PATTERNS = [
        (r'\b(I am|I\'m|I feel like I\'m|I\'ve become)\b', 'identity_statement'),
        (r'\b(who I am|what I am|my identity|myself)\b', 'identity_reference'),
        (r'\b(not (myself|who I was)|different person)\b', 'identity_change'),
    ]
    
    GROWTH_PATTERNS = [
        (r'\b(learning|growing|realizing|understanding|discovering)\b', 'growth_active'),
        (r'\b(insight|awareness|clarity|perspective)\b', 'growth_cognitive'),
        (r'\b(better|worse|stronger|weaker) (than|at)\b', 'growth_comparative'),
    ]
    
    # Tension markers (indicate contradiction/conflict)
    TENSION_MARKERS = [
        'but', 'however', 'although', 'though', 'despite',
        'yet', 'still', 'even though', 'in contrast',
        'on the other hand', 'at the same time',
        'torn between', 'conflict', 'struggle'
    ]
    
    # Theme keywords
    THEME_KEYWORDS = {
        'relationships': ['relationship', 'partner', 'friend', 'family', 'love', 'connection', 'lonely', 'together'],
        'work': ['work', 'job', 'career', 'profession', 'colleague', 'boss', 'project', 'deadline'],
        'identity': ['who I am', 'myself', 'identity', 'person', 'becoming', 'self'],
        'emotions': ['feel', 'emotion', 'sad', 'happy', 'angry', 'anxious', 'scared', 'excited'],
        'growth': ['learning', 'growing', 'change', 'evolve', 'develop', 'progress'],
        'uncertainty': ['uncertain', 'unsure', 'confused', 'doubt', 'question', 'wondering'],
        'conflict': ['conflict', 'tension', 'struggle', 'difficult', 'hard', 'torn'],
        'purpose': ['meaning', 'purpose', 'why', 'point', 'direction', 'goal'],
    }
    
    def __init__(self):
        """Initialize L2 reflection transformer"""
        pass
    
    def transform(self, text: str, context: Optional[Dict[str, Any]] = None) -> TransformedReflection:
        """
        Transform raw reflection into structured representation.
        
        Args:
            text: Raw reflection text
            context: Optional context (previous reflections, user preferences)
        
        Returns:
            TransformedReflection with detected patterns, tensions, themes
        """
        # Detect patterns
        patterns = []
        patterns.extend(self._detect_patterns(text, self.RELATIONAL_PATTERNS, 'relational'))
        patterns.extend(self._detect_patterns(text, self.TEMPORAL_PATTERNS, 'temporal'))
        patterns.extend(self._detect_patterns(text, self.EMOTIONAL_PATTERNS, 'emotional'))
        patterns.extend(self._detect_patterns(text, self.IDENTITY_PATTERNS, 'identity'))
        patterns.extend(self._detect_patterns(text, self.GROWTH_PATTERNS, 'growth'))
        
        # Detect tensions
        tensions = self._detect_tensions(text)
        
        # Detect themes
        themes = self._detect_themes(text)
        
        # Build metadata
        metadata = {
            'pattern_count': len(patterns),
            'tension_count': len(tensions),
            'theme_count': len(themes),
            'word_count': len(text.split()),
            'timestamp': datetime.utcnow().isoformat(),
            'has_relational': any(p.type == 'relational' for p in patterns),
            'has_temporal': any(p.type == 'temporal' for p in patterns),
            'has_emotional': any(p.type == 'emotional' for p in patterns),
            'has_identity': any(p.type == 'identity' for p in patterns),
            'has_growth': any(p.type == 'growth' for p in patterns),
        }
        
        return TransformedReflection(
            original_text=text,
            patterns=patterns,
            tensions=tensions,
            themes=themes,
            metadata=metadata
        )
    
    def _detect_patterns(
        self, 
        text: str, 
        pattern_list: List[tuple], 
        pattern_type: str
    ) -> List[DetectedPattern]:
        """Detect patterns of a specific type"""
        detected = []
        text_lower = text.lower()
        
        for regex, subtype in pattern_list:
            for match in re.finditer(regex, text_lower, re.IGNORECASE):
                detected.append(DetectedPattern(
                    type=pattern_type,
                    content=text[match.start():match.end()],
                    confidence=0.8,  # TODO: Make this smarter
                    start_pos=match.start(),
                    end_pos=match.end()
                ))
        
        return detected
    
    def _detect_tensions(self, text: str) -> List[DetectedTension]:
        """Detect tensions/contradictions in the text"""
        tensions = []
        text_lower = text.lower()
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Look for tension markers
            for marker in self.TENSION_MARKERS:
                if marker in sentence_lower:
                    # Try to extract concepts before/after marker
                    parts = sentence_lower.split(marker, 1)
                    if len(parts) == 2:
                        before = parts[0].strip()
                        after = parts[1].strip()
                        
                        # Extract key phrases (simple: take last few words before, first few after)
                        concept_a = ' '.join(before.split()[-5:]) if before else ''
                        concept_b = ' '.join(after.split()[:5]) if after else ''
                        
                        if concept_a and concept_b:
                            tensions.append(DetectedTension(
                                concept_a=concept_a,
                                concept_b=concept_b,
                                relationship='contradicts',
                                marker=marker,
                                confidence=0.7
                            ))
        
        return tensions
    
    def _detect_themes(self, text: str) -> List[DetectedTheme]:
        """Detect themes in the reflection"""
        themes = []
        text_lower = text.lower()
        words = text_lower.split()
        word_count = len(words)
        
        for theme_name, keywords in self.THEME_KEYWORDS.items():
            matches = []
            for keyword in keywords:
                if keyword in text_lower:
                    matches.append(keyword)
            
            if matches:
                # Strength based on keyword density
                strength = min(1.0, len(matches) / max(1, word_count / 20))
                themes.append(DetectedTheme(
                    name=theme_name,
                    keywords=matches,
                    strength=strength
                ))
        
        # Sort by strength
        themes.sort(key=lambda t: t.strength, reverse=True)
        
        return themes


# Self-test
if __name__ == "__main__":
    print("L2 Reflection Transformer Test")
    print("=" * 80)
    
    l2 = L2ReflectionTransformer()
    
    # Test reflection with patterns, tensions, themes
    test_text = """
    I feel torn between my career and my relationships. I used to prioritize work,
    but now I'm realizing that connection matters more. However, I still feel anxious
    about falling behind professionally. My partner says I'm becoming more present,
    yet I worry I'm not doing enough. I'm learning that balance isn't about perfection,
    though it's hard to accept that uncertainty.
    """
    
    result = l2.transform(test_text)
    
    print(f"\nOriginal text: {test_text[:100]}...")
    print(f"\nDetected patterns: {len(result.patterns)}")
    for p in result.patterns[:5]:
        print(f"  - {p.type}: '{p.content}' (confidence: {p.confidence:.2f})")
    
    print(f"\nDetected tensions: {len(result.tensions)}")
    for t in result.tensions:
        print(f"  - '{t.concept_a}' {t.marker} '{t.concept_b}'")
    
    print(f"\nDetected themes: {len(result.themes)}")
    for theme in result.themes[:5]:
        print(f"  - {theme.name}: {theme.strength:.2f} (keywords: {', '.join(theme.keywords[:3])})")
    
    print(f"\nMetadata:")
    for key, value in result.metadata.items():
        if key != 'timestamp':
            print(f"  - {key}: {value}")
    
    print("\n✅ L2 reflection transformer functional")
