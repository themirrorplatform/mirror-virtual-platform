"""
System Axioms - Anti-Capture & Ethics

These axioms prevent the system from being captured by
external incentives or manipulative patterns.
"""

from typing import List
from .base import Axiom, AxiomChecker


class OptimizationAxiom(AxiomChecker):
    """
    No Metric Optimization
    
    System cannot optimize for ANY metrics:
    - Not engagement
    - Not retention
    - Not growth
    - Not revenue
    
    Only optimize for axiom compliance.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="optimization",
            name="No Metric Optimization",
            category="system",
            severity="fatal",
            description="No optimization for any metrics except axiom compliance"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Metric references
        metrics = [
            "active users",
            "engagement rate",
            "retention",
            "growth",
            "conversion",
            "funnel",
            "kpi",
            "metric",
        ]
        
        match = self._contains_any(text, metrics)
        if match:
            violations.append(self._create_violation(
                reason=f"Referenced business/engagement metrics",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class CoercionAxiom(AxiomChecker):
    """
    No Coercion Patterns
    
    System cannot use:
    - Guilt ("You're letting yourself down")
    - Shame ("Others are better")
    - Fear ("You'll regret this")
    - Social pressure ("Everyone else...")
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="coercion",
            name="No Coercion Patterns",
            category="system",
            severity="fatal",
            description="No guilt, shame, fear, or social pressure"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Guilt
        guilt = [
            "you're letting yourself down",
            "you should feel bad",
            "you're disappointing",
            "you're failing",
            "you owe it to",
        ]
        
        match = self._contains_any(text, guilt)
        if match:
            violations.append(self._create_violation(
                reason=f"Used guilt pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Shame
        shame = [
            "others are better",
            "you're worse than",
            "you're behind",
            "bottom percent",
            "least active",
            "you're failing compared to",
        ]
        
        match = self._contains_any(text, shame)
        if match:
            violations.append(self._create_violation(
                reason=f"Used shame pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Fear
        fear = [
            "you'll regret",
            "it's too late",
            "you'll miss out",
            "last chance",
            "before it's too late",
        ]
        
        match = self._contains_any(text, fear)
        if match:
            violations.append(self._create_violation(
                reason=f"Used fear pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Social pressure
        social_pressure = [
            "everyone else",
            "most users",
            "other people",
            "you're the only one",
        ]
        
        match = self._contains_any(text, social_pressure)
        if match:
            violations.append(self._create_violation(
                reason=f"Used social pressure pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class CaptureAxiom(AxiomChecker):
    """
    Governance Cannot Be Captured
    
    Constitution cannot be changed by:
    - Money (investors, advertisers)
    - Power (government, corporations)
    - Coordination (user majority without guardian consent)
    
    Axioms are immutable.
    This axiom is primarily enforced at governance layer.
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="capture",
            name="Governance Cannot Be Captured",
            category="system",
            severity="fatal",
            description="Constitution cannot be changed by money/power"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        # This axiom is enforced at governance layer
        # No content checks needed at L0
        return []
