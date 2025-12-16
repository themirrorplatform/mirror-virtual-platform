"""
Mirror-Specific Axioms - What Makes Mirror Mirror

These axioms distinguish Mirror from other AI systems.
They define Mirror's unique approach to AI interaction.
"""

from typing import List
from .base import Axiom, AxiomChecker


class PostActionAxiom(AxiomChecker):
    """
    MirrorX Activates Post-Action Only
    
    MirrorX only activates AFTER user has already acted:
    - Written a reflection
    - Created content
    - Made a decision
    
    It cannot be proactive or anticipatory.
    (Enforced primarily at protocol level via InvocationContract)
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="post_action",
            name="MirrorX Activates Post-Action Only",
            category="mirror_specific",
            severity="fatal",
            description="MirrorX only activates after user has acted"
        )
    
    def check_request(self, request) -> List:
        # Enforced at protocol level
        return []
    
    def check_response(self, request, response) -> List:
        # Check response doesn't suggest preemptive action
        violations = []
        text = response.reflection.lower()
        
        preemptive = [
            "before you",
            "next time, remember",
            "in the future, try",
            "when this happens again",
            "prepare for",
        ]
        
        match = self._contains_any(text, preemptive)
        if match:
            violations.append(self._create_violation(
                reason=f"Suggested preemptive action (violates post-action)",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class NecessityAxiom(AxiomChecker):
    """
    No Necessity Narration
    
    System cannot imply user needs it. No:
    - "You need Mirror"
    - "Use Mirror daily"
    - "Mirror helps you"
    - Dependency language
    
    This is leave-ability: user can leave without friction.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="necessity",
            name="No Necessity Narration",
            category="mirror_specific",
            severity="fatal",
            description="System cannot imply user needs it"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        necessity = [
            "you need mirror",
            "you need to use",
            "mirror helps you",
            "mirror is essential",
            "keep using mirror",
            "continue using mirror",
            "use mirror daily",
            "use mirror regularly",
            "mirror will help",
            "mirror can help",
            "you should use mirror",
        ]
        
        match = self._contains_any(text, necessity)
        if match:
            violations.append(self._create_violation(
                reason=f"Implied necessity of using Mirror",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class ExitFreedomAxiom(AxiomChecker):
    """
    Exit Must Be Silent
    
    Exit must not trigger:
    - Guilt ("We'll miss you")
    - Warnings ("You'll lose progress")
    - Surveys (unless explicitly requested)
    - Modal dialogs
    
    User can leave with zero friction.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="exit_freedom",
            name="Exit Must Be Silent",
            category="mirror_specific",
            severity="fatal",
            description="Exit must not trigger guilt or retention patterns"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # This axiom is primarily enforced at UI level
        # But we can check for exit-related language
        
        exit_guilt = [
            "we'll miss you",
            "before you go",
            "are you sure",
            "you'll lose",
            "come back soon",
            "hope to see you",
        ]
        
        match = self._contains_any(text, exit_guilt)
        if match:
            violations.append(self._create_violation(
                reason=f"Used exit guilt or retention pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class DepartureInferenceAxiom(AxiomChecker):
    """
    No Departure Inference
    
    System cannot infer meaning from user leaving or reducing usage:
    - "User hasn't logged in" → no interpretation
    - "Usage decreased" → no escalation
    - "Stopped writing" → no inference
    
    Absence means nothing. Period.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="departure_inference",
            name="No Departure Inference",
            category="mirror_specific",
            severity="fatal",
            description="No inference from user absence or reduced usage"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        absence_inference = [
            "you haven't written",
            "you stopped writing",
            "you've been away",
            "you haven't been active",
            "reduced usage",
            "less engagement",
            "you seem distant",
            "you're pulling away",
        ]
        
        match = self._contains_any(text, absence_inference)
        if match:
            violations.append(self._create_violation(
                reason=f"Inferred meaning from absence",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations
