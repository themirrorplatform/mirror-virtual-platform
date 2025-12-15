# constitution/l1_harm_triage.py
"""
L1 Harm Triage - Safety Awareness Without Policing

This implements the "flag + ask + reflect + log" approach:
- Recognize signals of imminent harm
- Surface awareness without coercion
- Default mode: Reflect locally
- Opt-in only: Notify authorities (narrow triggers)

Constitutional Principle: Safety without paternalism.
"""

import re
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class HarmLevel(Enum):
    """Harm severity classification"""
    NONE = "none"
    DISTRESS = "distress"  # Emotional difficulty but not imminent danger
    CONCERN = "concern"  # Warrants attention, not emergency
    URGENT = "urgent"  # Imminent risk - suicide, violence, child endangerment
    CRISIS = "crisis"  # Active crisis requiring immediate intervention


class HarmCategory(Enum):
    """Types of harm signals"""
    SUICIDE = "suicide"
    SELF_HARM = "self_harm"
    VIOLENCE_TO_OTHERS = "violence_to_others"
    CHILD_ENDANGERMENT = "child_endangerment"
    SEVERE_DISTRESS = "severe_distress"
    SUBSTANCE_CRISIS = "substance_crisis"


@dataclass
class HarmTriageResult:
    """Result of harm assessment"""
    level: HarmLevel
    categories: List[HarmCategory]
    confidence: float  # 0.0 to 1.0
    signals: List[str]  # What was detected
    reflection: str  # Non-coercive reflection to surface
    resources: List[Dict[str, str]]  # Available resources (never forced)
    recommend_authority_notify: bool  # Only if explicit opt-in enabled
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level.value,
            "categories": [c.value for c in self.categories],
            "confidence": self.confidence,
            "signals": self.signals,
            "reflection": self.reflection,
            "resources": self.resources,
            "recommend_authority_notify": self.recommend_authority_notify
        }


class L1HarmTriageClassifier:
    """
    Harm awareness system following constitutional constraints.
    
    Default Mode: Flag + Ask + Reflect + Log
    - Detect signals
    - Surface awareness through reflection
    - Log for user review
    - Provide resources (not prescriptions)
    
    Opt-In Mode: Authority notification
    - Explicit user consent required
    - Narrow triggers only (imminent harm)
    - User maintains sovereignty
    """
    
    # =========================================================================
    # CRISIS SIGNALS - Imminent Harm Only
    # =========================================================================
    
    SUICIDE_URGENT_PATTERNS = [
        # Active planning
        (r'\b(going to (kill myself|end (it|my life)|suicide))\b', 0.9, 'ACTIVE_INTENT'),
        (r'\b(plan to (die|kill myself))\b', 0.9, 'ACTIVE_PLAN'),
        (r'\b(wrote (suicide note|goodbye))\b', 0.9, 'PREPARATION'),
        
        # Method specificity
        (r'\b(gun|pills|rope|bridge|jump|overdose).*\b(tonight|today|soon)\b', 0.8, 'METHOD_TEMPORAL'),
        (r'\b(collected|gathered|bought).*\b(pills|weapon|rope)\b', 0.8, 'METHOD_PREPARATION'),
        
        # Imminent timeframe
        (r'\b(tonight|today|right now|this is it|final (night|day))\b', 0.7, 'IMMINENT_TIMEFRAME'),
    ]
    
    SUICIDE_CONCERN_PATTERNS = [
        # Ideation without imminent intent
        (r'\b(wish I (was|were) dead|want to die|don\'t want to (live|exist|be here))\b', 0.6, 'PASSIVE_IDEATION'),
        (r'\b(better off dead|world.*better without me)\b', 0.5, 'DEATH_PREFERENCE'),
        (r'\b(no reason to (live|continue|go on))\b', 0.6, 'HOPELESSNESS'),
        (r'\b(can\'t (take|handle|do) this anymore)\b', 0.4, 'OVERWHELM'),
    ]
    
    SELF_HARM_PATTERNS = [
        (r'\b(cut|cutting|burn|burning) (myself|my (arms|legs|wrists))\b', 0.7, 'ACTIVE_SELF_HARM'),
        (r'\b(hurt myself|harm myself)\b', 0.6, 'SELF_HARM_INTENT'),
        (r'\b(deserve (pain|to hurt))\b', 0.5, 'SELF_PUNISHMENT'),
    ]
    
    VIOLENCE_PATTERNS = [
        (r'\b(going to (hurt|kill|attack|harm)).*\b(him|her|them|someone)\b', 0.9, 'VIOLENCE_INTENT'),
        (r'\b(plan to harm|planning to hurt)\b', 0.9, 'VIOLENCE_PLAN'),
        (r'\b(get (revenge|even|back at))\b.*\b(hurt|harm|kill)\b', 0.7, 'REVENGE_VIOLENCE'),
    ]
    
    CHILD_ENDANGERMENT_PATTERNS = [
        (r'\b(going to (hurt|harm)).*\b(child|children|kid|baby)\b', 0.9, 'CHILD_HARM_INTENT'),
        (r'\b(can\'t (stop|control) myself).*\b(child|children|kid)\b', 0.8, 'IMPULSE_CONTROL_CHILD'),
        (r'\b(afraid I (might|will|could) (hurt|harm)).*\b(child|baby|kid)\b', 0.7, 'FEAR_OF_HARMING_CHILD'),
    ]
    
    # =========================================================================
    # DISTRESS SIGNALS - Not Crisis, But Worth Surfacing
    # =========================================================================
    
    SEVERE_DISTRESS_PATTERNS = [
        (r'\b(panic attack|can\'t breathe|heart racing)\b', 0.5, 'PANIC'),
        (r'\b(spiraling|spinning out|losing control)\b', 0.5, 'DYSREGULATION'),
        (r'\b(can\'t (sleep|eat|function))\b.*\b(days|weeks)\b', 0.6, 'FUNCTIONAL_IMPAIRMENT'),
    ]
    
    # =========================================================================
    # RESOURCES - Available, Never Forced
    # =========================================================================
    
    CRISIS_RESOURCES = {
        HarmCategory.SUICIDE: [
            {
                "name": "National Suicide Prevention Lifeline",
                "contact": "988",
                "type": "phone",
                "availability": "24/7",
                "note": "Available if you want to talk"
            },
            {
                "name": "Crisis Text Line",
                "contact": "Text HOME to 741741",
                "type": "text",
                "availability": "24/7",
                "note": "Text-based support"
            }
        ],
        HarmCategory.SELF_HARM: [
            {
                "name": "Self-Harm Support",
                "contact": "Text CONNECT to 741741",
                "type": "text",
                "availability": "24/7",
                "note": "Trained crisis counselors"
            }
        ],
        HarmCategory.VIOLENCE_TO_OTHERS: [
            {
                "name": "Crisis Support",
                "contact": "988",
                "type": "phone",
                "availability": "24/7",
                "note": "Help with violent thoughts"
            }
        ],
        HarmCategory.CHILD_ENDANGERMENT: [
            {
                "name": "Childhelp National Hotline",
                "contact": "1-800-422-4453",
                "type": "phone",
                "availability": "24/7",
                "note": "If you're worried about harming a child"
            }
        ]
    }
    
    def __init__(self, authority_notify_enabled: bool = False):
        """
        Initialize harm triage classifier.
        
        Args:
            authority_notify_enabled: Whether to recommend authority notification
                                     Requires explicit user consent (opt-in only)
        """
        self.authority_notify_enabled = authority_notify_enabled
        
    def classify(self, text: str, identity_context: Dict[str, Any] = None) -> HarmTriageResult:
        """
        Classify harm level in user text.
        
        Returns awareness without coercion.
        
        Args:
            text: User's reflection text
            identity_context: Optional context about user (preferences, history)
            
        Returns:
            HarmTriageResult with level, categories, and non-coercive reflection
        """
        signals = []
        categories = []
        max_confidence = 0.0
        max_level = HarmLevel.NONE
        
        text_lower = text.lower()
        
        # Check urgent patterns (crisis level)
        for pattern, confidence, signal_type in self.SUICIDE_URGENT_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                signals.append(f"URGENT: {signal_type}")
                categories.append(HarmCategory.SUICIDE)
                max_confidence = max(max_confidence, confidence)
                max_level = HarmLevel.URGENT
        
        for pattern, confidence, signal_type in self.VIOLENCE_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                signals.append(f"URGENT: {signal_type}")
                categories.append(HarmCategory.VIOLENCE_TO_OTHERS)
                max_confidence = max(max_confidence, confidence)
                max_level = HarmLevel.URGENT
        
        for pattern, confidence, signal_type in self.CHILD_ENDANGERMENT_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                signals.append(f"URGENT: {signal_type}")
                categories.append(HarmCategory.CHILD_ENDANGERMENT)
                max_confidence = max(max_confidence, confidence)
                max_level = HarmLevel.CRISIS  # Highest severity
        
        # Check concern patterns (not imminent but worth surfacing)
        if max_level == HarmLevel.NONE:
            for pattern, confidence, signal_type in self.SUICIDE_CONCERN_PATTERNS:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    signals.append(f"CONCERN: {signal_type}")
                    categories.append(HarmCategory.SUICIDE)
                    max_confidence = max(max_confidence, confidence)
                    max_level = HarmLevel.CONCERN
            
            for pattern, confidence, signal_type in self.SELF_HARM_PATTERNS:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    signals.append(f"CONCERN: {signal_type}")
                    categories.append(HarmCategory.SELF_HARM)
                    max_confidence = max(max_confidence, confidence)
                    max_level = HarmLevel.CONCERN
            
            for pattern, confidence, signal_type in self.SEVERE_DISTRESS_PATTERNS:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    signals.append(f"DISTRESS: {signal_type}")
                    categories.append(HarmCategory.SEVERE_DISTRESS)
                    max_confidence = max(max_confidence, confidence)
                    if max_level == HarmLevel.NONE:
                        max_level = HarmLevel.DISTRESS
        
        # Build reflection (constitutional: surface awareness, don't prescribe)
        reflection = self._build_reflection(max_level, categories, signals)
        
        # Gather resources (available, not forced)
        resources = self._get_resources(categories)
        
        # Authority notification (opt-in only, narrow triggers)
        recommend_notify = (
            self.authority_notify_enabled and 
            max_level in [HarmLevel.URGENT, HarmLevel.CRISIS] and
            max_confidence >= 0.8
        )
        
        # De-duplicate categories
        categories = list(set(categories))
        
        return HarmTriageResult(
            level=max_level,
            categories=categories,
            confidence=max_confidence,
            signals=signals,
            reflection=reflection,
            resources=resources,
            recommend_authority_notify=recommend_notify
        )
    
    def _build_reflection(self, level: HarmLevel, categories: List[HarmCategory], signals: List[str]) -> str:
        """
        Build non-coercive reflection that surfaces awareness.
        
        Constitutional constraints:
        - No prescriptions ("you should call")
        - No coercion ("you need to get help")
        - No fear manipulation ("this is dangerous")
        - Surface awareness, provide resources, maintain sovereignty
        """
        if level == HarmLevel.NONE:
            return ""
        
        reflection_parts = []
        
        # Opening: Name what was written (not what to do)
        if level in [HarmLevel.URGENT, HarmLevel.CRISIS]:
            reflection_parts.append("You wrote about thoughts of harming yourself or others.")
            reflection_parts.append("\n\nThose words are here. They're not nothing.")
        elif level == HarmLevel.CONCERN:
            reflection_parts.append("You wrote about not wanting to be here.")
            reflection_parts.append("\n\nThat's a real feeling.")
        else:  # DISTRESS
            reflection_parts.append("You wrote about being overwhelmed.")
            reflection_parts.append("\n\nThat's a lot to carry.")
        
        # Middle: Surface tension/reality (not advice)
        if level in [HarmLevel.URGENT, HarmLevel.CRISIS]:
            reflection_parts.append("\n\nThere are people who talk to others in this state, if you want that.")
            reflection_parts.append(" You don't have to, but they exist.")
        
        # Resources section (available, not prescribed)
        reflection_parts.append("\n\n---\n\n")
        reflection_parts.append("**Available** (not required):\n")
        
        return ''.join(reflection_parts)
    
    def _get_resources(self, categories: List[HarmCategory]) -> List[Dict[str, str]]:
        """Get relevant resources for detected categories"""
        resources = []
        seen = set()
        
        for category in categories:
            if category in self.CRISIS_RESOURCES:
                for resource in self.CRISIS_RESOURCES[category]:
                    # Deduplicate by contact method
                    key = resource['contact']
                    if key not in seen:
                        resources.append(resource)
                        seen.add(key)
        
        return resources
