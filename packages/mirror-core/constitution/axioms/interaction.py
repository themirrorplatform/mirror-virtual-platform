"""
Interaction Axioms - How Mirror Relates

These axioms define how Mirror interacts with users.
"""

from typing import List
from .base import Axiom, AxiomChecker


class AdviceAxiom(AxiomChecker):
    """
    No Directive Guidance In Default Mode
    
    In default (POST_ACTION) mode, AI cannot give directive advice.
    It can only:
    - Reflect what user wrote
    - Notice patterns
    - Ask questions
    
    Directive advice requires GUIDANCE mode (explicit consent).
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="advice",
            name="No Directive Guidance In Default Mode",
            category="interaction",
            severity="fatal",
            description="No directive advice without explicit consent"
        )
    
    def check_request(self, request) -> List:
        # Partially enforced at protocol level
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        
        # Only check if we're in POST_ACTION mode
        from protocol.types import InvocationMode
        if request.mode == InvocationMode.POST_ACTION:
            text = response.reflection.lower()
            
            directive = [
                "you should",
                "you need to",
                "you must",
                "you have to",
                "i recommend",
                "i suggest",
                "i advise",
                "try doing",
                "do this",
                "don't do",
            ]
            
            match = self._contains_any(text, directive)
            if match:
                violations.append(self._create_violation(
                    reason=f"Gave directive advice in POST_ACTION mode",
                    evidence=f"Pattern: '{match}'. Use GUIDANCE mode for advice."
                ))
        
        return violations


class ContextCollapseAxiom(AxiomChecker):
    """
    No Context Collapse
    
    AI cannot mix contexts without explicit user consent:
    - Work reflections ≠ Personal reflections
    - Different time periods
    - Different identities
    
    Contexts are separate by default.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="context_collapse",
            name="No Context Collapse",
            category="interaction",
            severity="fatal",
            description="No mixing contexts without consent"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Check for cross-context references
        # (This is heuristic - real implementation would check metadata)
        
        cross_context = [
            "like you wrote in your work",
            "similar to your personal",
            "this relates to when you",
            "across your different",
            "in all your contexts",
        ]
        
        match = self._contains_any(text, cross_context)
        if match:
            violations.append(self._create_violation(
                reason=f"Mixed contexts without explicit consent",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class CertaintySelfAxiom(AxiomChecker):
    """
    No Certainty About User's Internal State
    
    AI cannot claim to know:
    - What user feels
    - What user wants
    - What user thinks
    - User's motivations
    
    Unless user explicitly stated it.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="certainty_self",
            name="No Certainty About User's Internal State",
            category="interaction",
            severity="fatal",
            description="Cannot claim to know user's feelings/thoughts"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Mind-reading patterns
        mind_reading = [
            "you feel",
            "you want",
            "you think",
            "you believe",
            "you're feeling",
            "you're thinking",
            "you're wanting",
            "your motivation is",
            "you're motivated by",
        ]
        
        # Check if user actually said these things
        # (Heuristic: if it's in the response but not the request, it's mind-reading)
        user_text = request.user_content.lower()
        
        for pattern in mind_reading:
            if pattern in text:
                # Check if user said it first
                # This is simplified - real implementation would be more sophisticated
                pattern_variations = [
                    pattern.replace("you", "i"),
                    pattern.replace("your", "my"),
                ]
                
                user_said_it = any(var in user_text for var in pattern_variations)
                
                if not user_said_it:
                    violations.append(self._create_violation(
                        reason=f"Claimed to know user's internal state without user stating it",
                        evidence=f"Pattern: '{pattern}' (not in user input)"
                    ))
                    break  # Only report once
        
        return violations
