"""
Language Shapes Detection: Pattern Recognition in User Language

Constitutional Compliance (I9: Anti-Diagnosis):
- These are NOT diagnoses or clinical patterns
- They are observational markers of recurring language
- User can rename, hide, merge, or delete any shape
- Required disclaimer: "Not a diagnosis, just what I notice"
- No pathologizing or labeling

Language shapes are like noticing you often say "I wonder" or "I'm stuck" -
simple recurring phrases, not psychological assessments.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple
from collections import Counter
import re


@dataclass
class LanguageShape:
    """
    A recurring pattern in user's language.
    
    I9: This is NOT a diagnosis. User controls all metadata.
    """
    id: str
    name: str  # User-controlled label
    description: str  # What this shape represents
    example_phrases: List[str]
    pattern_markers: List[str]  # Words/phrases that indicate this shape
    disclaimer: str = "Not a diagnosis - just a pattern I notice in your language"
    
    # User control (I9)
    user_renamed: bool = False
    user_hidden: bool = False
    merged_into: Optional[str] = None  # If merged with another shape


@dataclass
class ShapeOccurrence:
    """Single detection of a language shape in content"""
    shape_id: str
    reflection_id: str
    matched_phrases: List[str]
    confidence: float  # 0.0-1.0
    context_snippet: str


class LanguageShapeDetector:
    """
    Detect recurring language patterns in reflections.
    
    Constitutional Guarantees:
    - I9: NOT diagnosis, user has full control
    - I2: Identity-scoped (only detect within one mirror)
    - I14: No cross-identity inference
    
    Usage:
        detector = LanguageShapeDetector()
        
        # Detect shapes in new reflection
        occurrences = detector.detect(reflection.content)
        
        # Build shape from historical patterns
        shape = detector.build_shape_from_history(
            reflections, 
            pattern_phrases=["I wonder", "I'm curious"]
        )
    """
    
    # Pre-defined observational shapes (I9: descriptive, not diagnostic)
    DEFAULT_SHAPES = {
        'uncertainty': LanguageShape(
            id='uncertainty',
            name='Uncertainty',
            description='Expressions of not knowing or questioning',
            example_phrases=[
                "I don't know",
                "I'm not sure",
                "I wonder",
                "Maybe",
                "I guess"
            ],
            pattern_markers=[
                r"(?:i\s+)?don['\u2019]?t\s+know",  # Handles apostrophe and right single quotation mark
                r"i['\u2019]?m\s+not\s+sure",
                r'\bi\s+wonder\b',
                r'\bmaybe\b',
                r'\bi\s+guess\b',
                r'\buncertain\b',
                r'\bconfused\b',
                r'\bnot\s+sure\b'
            ]
        ),
        'control': LanguageShape(
            id='control',
            name='Control',
            description='Language about managing, organizing, or directing',
            example_phrases=[
                "I need to control",
                "I should manage",
                "I have to organize",
                "I must handle"
            ],
            pattern_markers=[
                r'\bcontrol\b',
                r'\bmanage\b',
                r'\borganize\b',
                r'\bhandle\b',
                r'\bplan\b',
                r'\bstructure\b'
            ]
        ),
        'stuck': LanguageShape(
            id='stuck',
            name='Feeling Stuck',
            description='Expressions of being unable to move forward',
            example_phrases=[
                "I'm stuck",
                "I can't move",
                "I'm trapped",
                "I feel frozen"
            ],
            pattern_markers=[
                r'\bstuck\b',
                r'\btrapped\b',
                r'\bfrozen\b',
                r'\bcan\'t move\b',
                r'\bparalyzed\b'
            ]
        ),
        'should': LanguageShape(
            id='should',
            name='Should-ing',
            description='Self-imposed expectations or obligations',
            example_phrases=[
                "I should",
                "I ought to",
                "I need to",
                "I have to"
            ],
            pattern_markers=[
                r'\bi should\b',
                r'\bi ought to\b',
                r'\bi need to\b',
                r'\bi have to\b',
                r'\bi must\b'
            ]
        ),
        'questioning': LanguageShape(
            id='questioning',
            name='Questioning',
            description='Asking questions, exploring possibilities',
            example_phrases=[
                "What if",
                "How come",
                "Why does",
                "Is it possible"
            ],
            pattern_markers=[
                r'\bwhat if\b',
                r'\bhow come\b',
                r'\bwhy\b',
                r'\bis it\b',
                r'\bcould it be\b'
            ]
        ),
        'tension': LanguageShape(
            id='tension',
            name='Tension',
            description='Expressions of internal conflict or opposing forces',
            example_phrases=[
                "part of me wants... but",
                "on one hand... on the other",
                "I want to... but I also",
                "torn between"
            ],
            pattern_markers=[
                r'\bpart of me\b',
                r'\bon one hand\b',
                r'\bon the other\b',
                r'\bbut also\b',
                r'\btorn\b',
                r'\bconflict\b'
            ]
        )
    }
    
    def __init__(self, custom_shapes: Optional[List[LanguageShape]] = None):
        """
        Initialize detector with default or custom shapes.
        
        Args:
            custom_shapes: Optional user-defined shapes (I9: user control)
        """
        self.shapes: Dict[str, LanguageShape] = {}
        
        # Load default shapes (create new instances to avoid shared state)
        for shape_id, shape in self.DEFAULT_SHAPES.items():
            self.shapes[shape_id] = LanguageShape(
                id=shape.id,
                name=shape.name,
                description=shape.description,
                example_phrases=shape.example_phrases.copy(),
                pattern_markers=shape.pattern_markers.copy(),
                disclaimer=shape.disclaimer,
                user_renamed=False,
                user_hidden=False,
                merged_into=None
            )
        
        # Add custom shapes
        if custom_shapes:
            for shape in custom_shapes:
                self.shapes[shape.id] = shape
    
    def detect(
        self,
        content: str,
        min_confidence: float = 0.3,
        context_window: int = 50
    ) -> List[ShapeOccurrence]:
        """
        Detect language shapes in content.
        
        Args:
            content: Text to analyze
            min_confidence: Minimum confidence threshold (0.0-1.0)
            context_window: Characters of context around match
        
        Returns:
            List of detected shape occurrences
        """
        occurrences = []
        content_lower = content.lower()
        
        for shape_id, shape in self.shapes.items():
            # Skip hidden shapes (I9: user control)
            if shape.user_hidden:
                continue
            
            # Skip merged shapes (I9: user merged them)
            if shape.merged_into:
                continue
            
            matched_phrases = []
            
            # Check each pattern marker
            for pattern in shape.pattern_markers:
                matches = re.finditer(pattern, content_lower, re.IGNORECASE)
                for match in matches:
                    # Extract context
                    start = max(0, match.start() - context_window)
                    end = min(len(content), match.end() + context_window)
                    context = content[start:end].strip()
                    
                    matched_phrases.append(match.group())
            
            # Calculate confidence based on match frequency
            if matched_phrases:
                # Confidence = (matches / total_words) * multiplier
                # Capped at 1.0
                word_count = len(content.split())
                confidence = min(1.0, len(matched_phrases) / max(1, word_count) * 10)
                
                if confidence >= min_confidence:
                    occurrences.append(ShapeOccurrence(
                        shape_id=shape_id,
                        reflection_id='',  # Will be set by caller
                        matched_phrases=list(set(matched_phrases)),
                        confidence=confidence,
                        context_snippet=context if matched_phrases else ''
                    ))
        
        return occurrences
    
    def build_shape_from_history(
        self,
        reflections: List[str],
        pattern_phrases: List[str],
        shape_name: str,
        shape_description: str,
        min_occurrences: int = 3
    ) -> Optional[LanguageShape]:
        """
        Build a custom language shape from user's historical patterns.
        
        I9: User-driven shape creation from their own language.
        
        Args:
            reflections: Historical reflection texts
            pattern_phrases: Phrases to look for
            shape_name: User-defined name
            shape_description: User-defined description
            min_occurrences: Minimum times pattern must appear
        
        Returns:
            LanguageShape if pattern is recurring enough, None otherwise
        """
        # Count occurrences
        phrase_counts = Counter()
        
        for reflection in reflections:
            reflection_lower = reflection.lower()
            for phrase in pattern_phrases:
                if phrase.lower() in reflection_lower:
                    phrase_counts[phrase] += 1
        
        # Check if pattern is recurring enough
        total_occurrences = sum(phrase_counts.values())
        if total_occurrences < min_occurrences:
            return None
        
        # Build pattern markers (regex patterns)
        pattern_markers = [
            r'\b' + re.escape(phrase.lower()) + r'\b'
            for phrase in pattern_phrases
        ]
        
        # Create shape
        shape = LanguageShape(
            id=f"custom_{shape_name.lower().replace(' ', '_')}",
            name=shape_name,
            description=shape_description,
            example_phrases=list(phrase_counts.keys()),
            pattern_markers=pattern_markers,
            disclaimer="Not a diagnosis - just a pattern I notice in your language"
        )
        
        return shape
    
    def get_shape_frequency(
        self,
        reflections: List[Tuple[str, str]],  # (id, content)
        shape_id: str
    ) -> Dict[str, int]:
        """
        Get frequency of shape across reflections.
        
        I14: Only for this mirror, no cross-identity aggregation.
        
        Args:
            reflections: List of (reflection_id, content) tuples
            shape_id: Shape to analyze
        
        Returns:
            Dict mapping reflection_id to occurrence count
        """
        if shape_id not in self.shapes:
            return {}
        
        shape = self.shapes[shape_id]
        frequency = {}
        
        for reflection_id, content in reflections:
            occurrences = self.detect(content, min_confidence=0.1)
            shape_occurrences = [
                o for o in occurrences
                if o.shape_id == shape_id
            ]
            
            if shape_occurrences:
                # Count total matched phrases across all occurrences
                total_matches = sum(len(o.matched_phrases) for o in shape_occurrences)
                frequency[reflection_id] = total_matches
        
        return frequency
    
    def rename_shape(self, shape_id: str, new_name: str) -> bool:
        """
        User renames a shape (I9: user control).
        
        Args:
            shape_id: Shape to rename
            new_name: New user-defined name
        
        Returns:
            True if renamed successfully
        """
        if shape_id not in self.shapes:
            return False
        
        self.shapes[shape_id].name = new_name
        self.shapes[shape_id].user_renamed = True
        return True
    
    def hide_shape(self, shape_id: str) -> bool:
        """
        User hides a shape (I9: user control).
        
        Args:
            shape_id: Shape to hide
        
        Returns:
            True if hidden successfully
        """
        if shape_id not in self.shapes:
            return False
        
        self.shapes[shape_id].user_hidden = True
        return True
    
    def merge_shapes(self, shape_id: str, into_shape_id: str) -> bool:
        """
        User merges two shapes (I9: user control).
        
        Args:
            shape_id: Shape to merge away
            into_shape_id: Shape to merge into
        
        Returns:
            True if merged successfully
        """
        if shape_id not in self.shapes or into_shape_id not in self.shapes:
            return False
        
        # Mark as merged
        self.shapes[shape_id].merged_into = into_shape_id
        
        # Combine pattern markers
        self.shapes[into_shape_id].pattern_markers.extend(
            self.shapes[shape_id].pattern_markers
        )
        
        # Combine example phrases
        self.shapes[into_shape_id].example_phrases.extend(
            self.shapes[shape_id].example_phrases
        )
        
        return True
    
    def add_custom_shape(self, shape: LanguageShape) -> bool:
        """
        User adds a custom shape (I9: user-driven).
        
        Args:
            shape: Custom shape to add
        
        Returns:
            True if added successfully
        """
        if shape.id in self.shapes:
            return False
        
        self.shapes[shape.id] = shape
        return True
    
    def get_visible_shapes(self) -> List[LanguageShape]:
        """
        Get all shapes that aren't hidden or merged (I9).
        
        Returns:
            List of visible shapes
        """
        return [
            shape for shape in self.shapes.values()
            if not shape.user_hidden and not shape.merged_into
        ]
    
    def get_shape_statistics(
        self,
        reflections: List[Tuple[str, str]]
    ) -> Dict[str, Dict[str, any]]:
        """
        Get statistics about shape usage.
        
        I14: Only for this mirror, no cross-identity inference.
        
        Args:
            reflections: List of (reflection_id, content) tuples
        
        Returns:
            Dict mapping shape_id to statistics
        """
        stats = {}
        
        for shape_id, shape in self.shapes.items():
            # Skip hidden/merged
            if shape.user_hidden or shape.merged_into:
                continue
            
            frequency = self.get_shape_frequency(reflections, shape_id)
            total_occurrences = sum(frequency.values())
            
            stats[shape_id] = {
                'name': shape.name,
                'total_occurrences': total_occurrences,
                'reflections_with_shape': len(frequency),
                'average_per_reflection': (
                    total_occurrences / len(reflections) if reflections else 0
                ),
                'user_renamed': shape.user_renamed
            }
        
        return stats
