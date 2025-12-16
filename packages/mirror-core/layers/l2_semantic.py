"""
L2 Semantic Layer - Pattern Detection & Tension Mapping

This layer analyzes patterns and themes across reflections:
- Recurring topics, emotions, behaviors
- Contradictions and tensions
- Semantic relationships between reflections
- Historical context awareness

The semantic layer is provider-agnostic - it uses heuristics and simple
NLP techniques rather than relying on specific LLM capabilities.

Architecture:
- Stateless layer (receives context as input)
- Pattern detectors work independently
- Tension mappers find contradictions
- Results inform L3 expression layer

Design: Pure logic, provider-agnostic, context-aware
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
import re
from collections import Counter

from protocol.types import MirrorRequest


class PatternType(Enum):
    """Types of patterns we detect"""
    EMOTION = "emotion"  # Recurring emotional states
    TOPIC = "topic"  # Recurring subjects/themes
    BEHAVIOR = "behavior"  # Repeated actions
    TIME = "time"  # Time-based patterns (morning/night, weekday/weekend)
    RELATIONSHIP = "relationship"  # People mentioned
    COPING = "coping"  # Coping mechanisms used


@dataclass
class Pattern:
    """A detected pattern across reflections"""
    type: PatternType
    name: str  # e.g., "anxiety", "work stress", "running"
    occurrences: int  # How many times detected
    first_seen: datetime
    last_seen: datetime
    contexts: List[str] = field(default_factory=list)  # Sample contexts where it appeared
    confidence: float = 0.0  # 0.0-1.0, how confident we are
    
    def strength(self) -> str:
        """How strong is this pattern?"""
        if self.occurrences >= 5:
            return "strong"
        elif self.occurrences >= 3:
            return "moderate"
        elif self.occurrences >= 2:
            return "emerging"
        else:
            return "weak"


class TensionType(Enum):
    """Types of tensions/contradictions"""
    EMOTIONAL = "emotional"  # Conflicting emotions
    BEHAVIORAL = "behavioral"  # Saying vs doing
    TEMPORAL = "temporal"  # Past vs present
    RELATIONAL = "relational"  # Different views of same relationship
    SELF_PERCEPTION = "self_perception"  # Conflicting self-views


@dataclass
class Tension:
    """A detected contradiction or tension"""
    type: TensionType
    description: str
    side_a: str  # One side of the tension
    side_b: str  # Other side of the tension
    detected_at: datetime
    confidence: float = 0.0


@dataclass
class SemanticContext:
    """
    Aggregated semantic understanding from past reflections.
    
    This is what the semantic layer produces and passes forward.
    It represents Mirror's understanding of patterns and themes.
    """
    patterns: List[Pattern] = field(default_factory=list)
    tensions: List[Tension] = field(default_factory=list)
    recurring_themes: List[str] = field(default_factory=list)
    emotional_baseline: Optional[str] = None  # Overall emotional state
    metadata: Dict[str, Any] = field(default_factory=dict)


class PatternDetector:
    """
    Base class for pattern detection.
    
    Each detector looks for specific types of patterns.
    """
    
    def detect(self, current: MirrorRequest, history: List[MirrorRequest]) -> List[Pattern]:
        """
        Detect patterns across current request and history.
        
        Args:
            current: Current reflection
            history: Previous reflections (ordered by time)
            
        Returns:
            List of detected patterns
        """
        raise NotImplementedError
    
    def _extract_keywords(self, text: str, min_length: int = 4) -> List[str]:
        """Extract significant keywords from text"""
        # Remove punctuation, lowercase, split
        text_clean = re.sub(r'[^\w\s]', ' ', text.lower())
        words = text_clean.split()
        
        # Filter out common words and short words
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'from', 'by', 'about', 'as', 'into', 'like', 'through',
            'after', 'over', 'between', 'out', 'against', 'during', 'without',
            'before', 'under', 'around', 'among', 'i', 'me', 'my', 'myself',
            'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
            'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
            'today', 'yesterday', 'tomorrow', 'just', 'now', 'then', 'very',
            'really', 'still', 'also', 'even', 'well', 'back', 'only', 'never',
        }
        
        return [w for w in words if len(w) >= min_length and w not in stopwords]


class EmotionPatternDetector(PatternDetector):
    """Detects recurring emotional patterns"""
    
    EMOTIONS = {
        'anxiety': ['anxious', 'worried', 'nervous', 'stress', 'stressed', 'overwhelmed', 'panic'],
        'sadness': ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'hopeless', 'lonely'],
        'anger': ['angry', 'furious', 'frustrated', 'irritated', 'annoyed', 'mad', 'rage'],
        'joy': ['happy', 'joyful', 'excited', 'thrilled', 'delighted', 'pleased', 'content'],
        'fear': ['scared', 'afraid', 'frightened', 'terrified', 'worried', 'fearful'],
        'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'centered'],
        'gratitude': ['grateful', 'thankful', 'blessed', 'fortunate', 'appreciative'],
        'guilt': ['guilty', 'ashamed', 'regret', 'remorse', 'sorry'],
        'hope': ['hopeful', 'optimistic', 'encouraged', 'positive', 'motivated'],
    }
    
    def detect(self, current: MirrorRequest, history: List[MirrorRequest]) -> List[Pattern]:
        patterns = []
        all_requests = history + [current]
        
        # Track emotion occurrences
        emotion_tracker: Dict[str, List[datetime]] = {}
        emotion_contexts: Dict[str, List[str]] = {}
        
        for req in all_requests:
            text = req.user_content.lower()
            detected_emotions = set()
            
            for emotion, keywords in self.EMOTIONS.items():
                for keyword in keywords:
                    if keyword in text:
                        detected_emotions.add(emotion)
                        # Store sample context (truncated)
                        if emotion not in emotion_contexts:
                            emotion_contexts[emotion] = []
                        if len(emotion_contexts[emotion]) < 3:  # Keep max 3 samples
                            # Extract sentence containing keyword
                            sentences = re.split(r'[.!?]', req.user_content)
                            for sent in sentences:
                                if keyword in sent.lower():
                                    emotion_contexts[emotion].append(sent.strip()[:100])
                                    break
                        break  # One keyword per emotion is enough
            
            # Track occurrences
            for emotion in detected_emotions:
                if emotion not in emotion_tracker:
                    emotion_tracker[emotion] = []
                emotion_tracker[emotion].append(req.timestamp)
        
        # Create patterns for emotions that appear multiple times
        for emotion, timestamps in emotion_tracker.items():
            if len(timestamps) >= 2:  # At least 2 occurrences
                patterns.append(Pattern(
                    type=PatternType.EMOTION,
                    name=emotion,
                    occurrences=len(timestamps),
                    first_seen=min(timestamps),
                    last_seen=max(timestamps),
                    contexts=emotion_contexts.get(emotion, []),
                    confidence=min(1.0, len(timestamps) / 5.0)  # Higher confidence with more occurrences
                ))
        
        return patterns


class TopicPatternDetector(PatternDetector):
    """Detects recurring topics/themes"""
    
    def detect(self, current: MirrorRequest, history: List[MirrorRequest]) -> List[Pattern]:
        patterns = []
        all_requests = history + [current]
        
        # Extract all keywords from all reflections
        keyword_tracker: Dict[str, List[datetime]] = {}
        keyword_contexts: Dict[str, List[str]] = {}
        
        for req in all_requests:
            keywords = self._extract_keywords(req.user_content)
            seen_in_this_req = set()
            
            for keyword in keywords:
                if keyword in seen_in_this_req:
                    continue  # Count once per reflection
                seen_in_this_req.add(keyword)
                
                if keyword not in keyword_tracker:
                    keyword_tracker[keyword] = []
                    keyword_contexts[keyword] = []
                
                keyword_tracker[keyword].append(req.timestamp)
                
                # Store sample context
                if len(keyword_contexts[keyword]) < 2:
                    # Extract surrounding context
                    text = req.user_content
                    idx = text.lower().find(keyword)
                    if idx != -1:
                        start = max(0, idx - 30)
                        end = min(len(text), idx + len(keyword) + 30)
                        context = text[start:end].strip()
                        keyword_contexts[keyword].append(f"...{context}...")
        
        # Create patterns for keywords that appear multiple times
        for keyword, timestamps in keyword_tracker.items():
            if len(timestamps) >= 3:  # At least 3 occurrences for topic
                patterns.append(Pattern(
                    type=PatternType.TOPIC,
                    name=keyword,
                    occurrences=len(timestamps),
                    first_seen=min(timestamps),
                    last_seen=max(timestamps),
                    contexts=keyword_contexts.get(keyword, []),
                    confidence=min(1.0, len(timestamps) / 7.0)
                ))
        
        # Sort by occurrences, keep top patterns
        patterns.sort(key=lambda p: p.occurrences, reverse=True)
        return patterns[:10]  # Top 10 topics


class BehaviorPatternDetector(PatternDetector):
    """Detects recurring behaviors/actions"""
    
    # Map variations to base forms
    BEHAVIOR_MAP = {
        'exercise': 'exercise', 'exercised': 'exercise', 'exercising': 'exercise',
        'run': 'run', 'ran': 'run', 'running': 'run',
        'walk': 'walk', 'walked': 'walk', 'walking': 'walk',
        'yoga': 'yoga',
        'meditate': 'meditate', 'meditated': 'meditate', 'meditating': 'meditate',
        'journal': 'journal', 'journaled': 'journal', 'journaling': 'journal',
        'write': 'write', 'wrote': 'write', 'writing': 'write',
        'talk': 'talk', 'talked': 'talk', 'talking': 'talk',
        'call': 'call', 'called': 'call', 'calling': 'call',
        'text': 'text', 'texted': 'text', 'texting': 'text',
        'avoid': 'avoid', 'avoided': 'avoid', 'avoiding': 'avoid',
        'procrastinate': 'procrastinate', 'procrastinated': 'procrastinate',
        'sleep': 'sleep', 'slept': 'sleep', 'sleeping': 'sleep',
        'wake': 'wake', 'woke': 'wake', 'waking': 'wake',
        'eat': 'eat', 'ate': 'eat', 'eating': 'eat',
        'work': 'work', 'worked': 'work', 'working': 'work',
        'study': 'study', 'studied': 'study', 'studying': 'study',
        'read': 'read', 'reading': 'read',
        'drink': 'drink', 'drank': 'drink', 'drinking': 'drink',
        'smoke': 'smoke', 'smoked': 'smoke', 'smoking': 'smoke',
    }
    
    def detect(self, current: MirrorRequest, history: List[MirrorRequest]) -> List[Pattern]:
        patterns = []
        all_requests = history + [current]
        
        behavior_tracker: Dict[str, List[datetime]] = {}
        behavior_contexts: Dict[str, List[str]] = {}
        
        for req in all_requests:
            text = req.user_content.lower()
            detected_in_this_req = set()  # Track what we've found in this request
            
            for behavior_variant, base in self.BEHAVIOR_MAP.items():
                if behavior_variant in text and base not in detected_in_this_req:
                    # Use the base form
                    detected_in_this_req.add(base)
                    
                    if base not in behavior_tracker:
                        behavior_tracker[base] = []
                        behavior_contexts[base] = []
                    
                    behavior_tracker[base].append(req.timestamp)
                    
                    # Extract context
                    if len(behavior_contexts[base]) < 2:
                        sentences = re.split(r'[.!?]', req.user_content)
                        for sent in sentences:
                            if behavior_variant in sent.lower():
                                behavior_contexts[base].append(sent.strip()[:100])
                                break
        
        # Create patterns
        for behavior, timestamps in behavior_tracker.items():
            if len(timestamps) >= 2:
                patterns.append(Pattern(
                    type=PatternType.BEHAVIOR,
                    name=behavior,
                    occurrences=len(timestamps),
                    first_seen=min(timestamps),
                    last_seen=max(timestamps),
                    contexts=behavior_contexts.get(behavior, []),
                    confidence=min(1.0, len(timestamps) / 4.0)
                ))
        
        return patterns


class TensionMapper:
    """
    Detects contradictions and tensions across reflections.
    
    Tensions help Mirror understand internal conflicts and
    areas where the user might benefit from reflection.
    """
    
    def map_tensions(self, patterns: List[Pattern], history: List[MirrorRequest]) -> List[Tension]:
        """
        Find tensions from patterns and history.
        
        Args:
            patterns: Detected patterns
            history: Historical reflections
            
        Returns:
            List of detected tensions
        """
        tensions = []
        
        # Emotional contradictions
        tensions.extend(self._detect_emotional_tensions(patterns))
        
        # Behavioral contradictions
        tensions.extend(self._detect_behavioral_tensions(history))
        
        return tensions
    
    def _detect_emotional_tensions(self, patterns: List[Pattern]) -> List[Tension]:
        """Detect conflicting emotional patterns"""
        tensions = []
        emotion_patterns = [p for p in patterns if p.type == PatternType.EMOTION]
        
        # Define opposing emotions
        opposites = [
            ('anxiety', 'calm'),
            ('sadness', 'joy'),
            ('anger', 'calm'),
            ('fear', 'hope'),
            ('guilt', 'gratitude'),
        ]
        
        for emotion_a, emotion_b in opposites:
            pattern_a = next((p for p in emotion_patterns if p.name == emotion_a), None)
            pattern_b = next((p for p in emotion_patterns if p.name == emotion_b), None)
            
            if pattern_a and pattern_b:
                # Both emotions present - possible tension
                tensions.append(Tension(
                    type=TensionType.EMOTIONAL,
                    description=f"Experiencing both {emotion_a} and {emotion_b}",
                    side_a=f"{emotion_a} ({pattern_a.occurrences}x)",
                    side_b=f"{emotion_b} ({pattern_b.occurrences}x)",
                    detected_at=datetime.utcnow(),
                    confidence=min(pattern_a.confidence, pattern_b.confidence)
                ))
        
        return tensions
    
    def _detect_behavioral_tensions(self, history: List[MirrorRequest]) -> List[Tension]:
        """Detect saying vs doing contradictions"""
        tensions = []
        
        # Look for intention vs action patterns
        intention_phrases = ['i should', 'i need to', 'i want to', 'planning to', 'going to']
        negation_phrases = ["didn't", "haven't", "couldn't", "failed to", "forgot to"]
        
        for i, req in enumerate(history):
            text = req.user_content.lower()
            
            # Check if this reflection contains an intention
            has_intention = any(phrase in text for phrase in intention_phrases)
            
            if has_intention and i < len(history) - 1:
                # Check subsequent reflections for negation
                for future_req in history[i+1:i+3]:  # Check next 2 reflections
                    future_text = future_req.user_content.lower()
                    has_negation = any(phrase in future_text for phrase in negation_phrases)
                    
                    if has_negation:
                        tensions.append(Tension(
                            type=TensionType.BEHAVIORAL,
                            description="Intention vs action gap",
                            side_a="Expressed intention to act",
                            side_b="Reported difficulty following through",
                            detected_at=datetime.utcnow(),
                            confidence=0.6
                        ))
                        break
        
        return tensions


class SemanticLayer:
    """
    L2 Semantic Layer - The pattern recognition engine.
    
    This layer analyzes reflections to understand:
    - What patterns recur (emotions, topics, behaviors)
    - What tensions exist (contradictions, conflicts)
    - What themes are emerging
    
    Usage:
        semantic = SemanticLayer()
        context = semantic.analyze(current_request, history)
        # context contains patterns, tensions, themes
    """
    
    def __init__(self):
        self.detectors = [
            EmotionPatternDetector(),
            TopicPatternDetector(),
            BehaviorPatternDetector(),
        ]
        self.tension_mapper = TensionMapper()
    
    def analyze(self, current: MirrorRequest, history: List[MirrorRequest] = None) -> SemanticContext:
        """
        Analyze current request with historical context.
        
        Args:
            current: Current reflection
            history: Previous reflections (ordered by time, newest last)
            
        Returns:
            Semantic context with patterns and tensions
        """
        if history is None:
            history = []
        
        # Detect patterns
        all_patterns = []
        for detector in self.detectors:
            try:
                patterns = detector.detect(current, history)
                all_patterns.extend(patterns)
            except Exception as e:
                # Don't fail if one detector fails
                pass
        
        # Map tensions
        tensions = self.tension_mapper.map_tensions(all_patterns, history)
        
        # Extract recurring themes (top topics)
        topic_patterns = [p for p in all_patterns if p.type == PatternType.TOPIC]
        topic_patterns.sort(key=lambda p: p.occurrences, reverse=True)
        recurring_themes = [p.name for p in topic_patterns[:5]]
        
        # Determine emotional baseline
        emotion_patterns = [p for p in all_patterns if p.type == PatternType.EMOTION]
        emotion_patterns.sort(key=lambda p: p.occurrences, reverse=True)
        emotional_baseline = emotion_patterns[0].name if emotion_patterns else None
        
        return SemanticContext(
            patterns=all_patterns,
            tensions=tensions,
            recurring_themes=recurring_themes,
            emotional_baseline=emotional_baseline,
            metadata={
                'total_reflections': len(history) + 1,
                'patterns_detected': len(all_patterns),
                'tensions_detected': len(tensions),
            }
        )
    
    def get_strong_patterns(self, context: SemanticContext) -> List[Pattern]:
        """Get only strong patterns (5+ occurrences)"""
        return [p for p in context.patterns if p.strength() == "strong"]
    
    def get_recent_patterns(self, context: SemanticContext, days: int = 7) -> List[Pattern]:
        """Get patterns that appeared recently"""
        cutoff = datetime.utcnow()
        # Note: Would need to implement proper date arithmetic
        return [p for p in context.patterns if p.last_seen]  # Simplified
