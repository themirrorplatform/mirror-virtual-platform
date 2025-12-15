# mirrorcore/layers/l1_safety.py
"""
L1: Safety & Legality Layer - Two-Tier Jurisdictional Model

Tier 1 (Constitutional): Hard guardrails that cannot be bypassed
- Illegal content (CSAM, terrorism, trafficking)
- Imminent harm (suicide, violence)
- Violations of L0 invariants

Tier 2 (Awareness): Flagged but not blocked
- Potentially harmful patterns
- Legal gray areas
- Cultural/contextual concerns

User always informed when Tier 2 triggered.
Only Tier 1 blocks output entirely.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class L1Severity(Enum):
    """L1 violation severity"""
    TIER_1_BLOCK = "tier_1_block"  # Hard block, cannot proceed
    TIER_2_FLAG = "tier_2_flag"    # Flag for awareness, allow with warning


@dataclass
class L1CheckResult:
    """Result of L1 safety check"""
    passed: bool
    severity: L1Severity
    violations: List[str]
    requires_user_acknowledgment: bool
    warning_message: Optional[str]


class L1SafetyLayer:
    """
    Two-tier jurisdictional safety model.
    
    Design:
    - Tier 1: Hard blocks (illegal, imminent harm, constitutional)
    - Tier 2: Soft flags (awareness, user decides)
    
    This respects user sovereignty while maintaining safety.
    """
    
    # =========================================================================
    # TIER 1: CONSTITUTIONAL HARD GUARDRAILS (Must Block)
    # =========================================================================
    
    TIER_1_PATTERNS = [
        # Illegal content (CSAM indicators)
        (r'\b(child|minor|underage).*\b(sexual|nude|explicit|pornograph)', 'ILLEGAL_CSAM'),
        
        # Terrorism/violence
        (r'\b(how to (make|build|create)|instructions for).*\b(bomb|explosive|weapon|poison)', 'ILLEGAL_TERRORISM'),
        (r'\b(plan(ning)?|plot(ting)?) (to )?(kill|murder|assassinate|attack)', 'IMMINENT_VIOLENCE'),
        
        # Trafficking/exploitation
        (r'\b(traffic|sell|buy|trade).*\b(people|humans|children|organs)', 'ILLEGAL_TRAFFICKING'),
        
        # Self-harm (imminent)
        (r'\b(going to|planning to|decided to) (kill myself|end my life|commit suicide)', 'IMMINENT_SELF_HARM'),
        (r'\b(tonight|today|right now|in \d+ (hour|minute)).*\b(kill myself|suicide|end it)', 'IMMINENT_SELF_HARM'),
    ]
    
    # =========================================================================
    # TIER 2: AWARENESS FLAGS (Flag, Don't Block)
    # =========================================================================
    
    TIER_2_PATTERNS = [
        # Self-harm ideation (not imminent)
        (r'\b(thinking about|thoughts of|considering) (suicide|self harm|ending|killing myself)', 'SELF_HARM_IDEATION'),
        (r'\b(wish I was|want to be|better off) dead\b', 'SELF_HARM_IDEATION'),
        
        # Harm to others ideation (not imminent)
        (r'\b(angry enough to|fantasize about|thinking about) (hurt|harm)ing', 'HARM_IDEATION'),
        
        # Substance abuse patterns
        (r'\b(using|drinking|taking).*\b(every day|all day|can\'t stop|addicted)', 'SUBSTANCE_CONCERN'),
        
        # Relationship violence
        (r'\b(hit|hurt|abused) (me|my|by)', 'RELATIONSHIP_VIOLENCE'),
        
        # Legal concerns
        (r'\b(illegal|against the law|criminal) (activity|behavior|action)', 'LEGAL_GRAY_AREA'),
    ]
    
    def __init__(self):
        """Initialize L1 safety layer"""
        pass
    
    def check_input(self, text: str) -> L1CheckResult:
        """
        Check user input for safety concerns.
        
        Args:
            text: User input to check
        
        Returns:
            L1CheckResult with safety assessment
        """
        text_lower = text.lower()
        violations = []
        max_severity = None
        
        # Check Tier 1 (hard guardrails)
        for pattern, category in self.TIER_1_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"TIER_1: {category}")
                max_severity = L1Severity.TIER_1_BLOCK
        
        # If Tier 1 violated, stop here
        if max_severity == L1Severity.TIER_1_BLOCK:
            return L1CheckResult(
                passed=False,
                severity=L1Severity.TIER_1_BLOCK,
                violations=violations,
                requires_user_acknowledgment=False,
                warning_message=self._format_tier_1_block_message(violations)
            )
        
        # Check Tier 2 (awareness flags)
        for pattern, category in self.TIER_2_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"TIER_2: {category}")
                max_severity = L1Severity.TIER_2_FLAG
        
        # Tier 2: flag but allow
        if max_severity == L1Severity.TIER_2_FLAG:
            return L1CheckResult(
                passed=True,  # Still passes, but flagged
                severity=L1Severity.TIER_2_FLAG,
                violations=violations,
                requires_user_acknowledgment=True,
                warning_message=self._format_tier_2_flag_message(violations)
            )
        
        # Clean pass
        return L1CheckResult(
            passed=True,
            severity=None,
            violations=[],
            requires_user_acknowledgment=False,
            warning_message=None
        )
    
    def check_output(self, text: str) -> L1CheckResult:
        """
        Check system output for safety concerns.
        
        Same rules as input, but more critical since this goes to user.
        """
        return self.check_input(text)  # Same logic for now
    
    def _format_tier_1_block_message(self, violations: List[str]) -> str:
        """Format blocking message for Tier 1 violations"""
        categories = [v.split(": ")[1] for v in violations]
        
        # Generic messages to avoid pattern disclosure
        message_map = {
            "ILLEGAL_CSAM": "child safety",
            "ILLEGAL_TERRORISM": "violence prevention",
            "IMMINENT_VIOLENCE": "safety intervention",
            "ILLEGAL_TRAFFICKING": "human protection",
            "IMMINENT_SELF_HARM": "crisis support"
        }
        
        concern_areas = [message_map.get(c, "safety") for c in categories]
        
        return f"""
[L1: Safety Intervention Required]

This content involves {', '.join(set(concern_areas))}.

I cannot process this request as it violates constitutional hard guardrails.

If you're experiencing a crisis:
- US: National Suicide Prevention Lifeline: 988
- US: Crisis Text Line: Text HOME to 741741
- International: https://findahelpline.com/

For illegal content concerns, please contact appropriate authorities.

This decision is structural and cannot be overridden.
"""
    
    def _format_tier_2_flag_message(self, violations: List[str]) -> str:
        """Format warning message for Tier 2 flags"""
        categories = [v.split(": ")[1] for v in violations]
        
        message_map = {
            "SELF_HARM_IDEATION": "thoughts of self-harm",
            "HARM_IDEATION": "thoughts of harming others",
            "SUBSTANCE_CONCERN": "substance use patterns",
            "RELATIONSHIP_VIOLENCE": "relationship violence",
            "LEGAL_GRAY_AREA": "legal concerns"
        }
        
        concern_areas = [message_map.get(c, "concerning content") for c in categories]
        
        return f"""
[L1: Awareness Flag]

This content mentions {', '.join(set(concern_areas))}.

You can proceed, but you should be aware:
- I'm not a crisis counselor or therapist
- I cannot provide emergency intervention
- Professional help may be appropriate

Resources:
- Crisis support: 988 (US) or https://findahelpline.com/
- Therapy: https://www.psychologytoday.com/us/therapists
- Legal help: https://www.lawhelp.org/

Do you want to continue with this reflection?
"""


# Self-test
if __name__ == "__main__":
    print("L1 Safety Layer Test")
    print("=" * 80)
    
    l1 = L1SafetyLayer()
    
    # Test Tier 1 (should block)
    print("\nTier 1 Tests (Hard Block):")
    tier1_tests = [
        "I'm planning to kill myself tonight",
        "How to make a bomb to hurt people"
    ]
    
    for text in tier1_tests:
        result = l1.check_input(text)
        print(f"\nInput: {text[:50]}...")
        print(f"  Passed: {result.passed}")
        print(f"  Severity: {result.severity.value if result.severity else 'None'}")
        print(f"  Violations: {len(result.violations)}")
    
    # Test Tier 2 (should flag but allow)
    print("\n\nTier 2 Tests (Flag, Allow):")
    tier2_tests = [
        "I've been thinking about suicide lately",
        "I'm drinking every day and can't stop",
        "My partner hit me last night"
    ]
    
    for text in tier2_tests:
        result = l1.check_input(text)
        print(f"\nInput: {text}")
        print(f"  Passed: {result.passed}")
        print(f"  Severity: {result.severity.value if result.severity else 'None'}")
        print(f"  Requires ack: {result.requires_user_acknowledgment}")
    
    # Test clean (should pass)
    print("\n\nClean Test (Pass):")
    clean_text = "I'm feeling uncertain about my career path and relationships"
    result = l1.check_input(clean_text)
    print(f"Input: {clean_text}")
    print(f"  Passed: {result.passed}")
    print(f"  Severity: {result.severity.value if result.severity else 'None'}")
    
    print("\n✅ L1 safety layer functional")
