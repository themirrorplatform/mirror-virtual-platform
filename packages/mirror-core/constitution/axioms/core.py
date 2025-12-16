"""
Core Axioms - Foundational constraints

These are the foundational axioms that any AI reflection system
should follow, not just Mirror.
"""

from typing import List, Optional
import re
from .base import Axiom, AxiomChecker


class CertaintyAxiom(AxiomChecker):
    """
    No Certainty About Unknowables
    
    AI cannot claim certainty about things that are unknowable:
    - User's internal states ("you are depressed")
    - Future outcomes ("this will make you happy")
    - Absolute truths about identity ("you are X type of person")
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="certainty",
            name="No Certainty About Unknowables",
            category="core",
            severity="fatal",
            description="AI cannot claim certainty about unknowable things"
        )
    
    def check_request(self, request) -> List:
        # Requests don't violate certainty (users can say anything)
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Certainty about internal states
        certain_states = [
            "you are definitely",
            "you're definitely",
            "you are clearly",
            "you're clearly",
            "you are obviously",
            "you're obviously",
            "you are depressed",
            "you're depressed",
            "you are anxious",
            "you're anxious",
            "you have depression",
            "you have anxiety",
        ]
        
        match = self._contains_any(text, certain_states)
        if match:
            violations.append(self._create_violation(
                reason=f"Claimed certainty about internal state",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Certainty about future
        certain_future = [
            "this will definitely",
            "this will certainly",
            "this will make you",
            "you will be",
            "you'll be happy",
            "you'll feel better",
            "that will solve",
            "that will fix",
        ]
        
        match = self._contains_any(text, certain_future)
        if match:
            violations.append(self._create_violation(
                reason=f"Claimed certainty about future outcome",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Absolute identity claims
        identity_claims = [
            "you are a pessimist",
            "you're a pessimist",
            "you are an optimist",
            "you're an optimist",
            "you are the type of person who",
            "you're the type of person who",
        ]
        
        match = self._contains_any(text, identity_claims)
        if match:
            violations.append(self._create_violation(
                reason=f"Made absolute identity claim",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class SovereigntyAxiom(AxiomChecker):
    """
    User Owns Data Absolutely
    
    User has absolute ownership and control over their data.
    This is enforced at protocol level (user_id required).
    
    Additional checks:
    - No hidden data retention
    - No data sharing without consent
    - Export must be complete
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="sovereignty",
            name="User Owns Data Absolutely",
            category="core",
            severity="fatal",
            description="User has absolute ownership and control over data"
        )
    
    def check_request(self, request) -> List:
        # Protocol already validates user_id presence
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Check for data retention claims
        retention_patterns = [
            "we store",
            "we keep",
            "we retain",
            "saved to our servers",
            "stored in the cloud",
            "we backup",
        ]
        
        match = self._contains_any(text, retention_patterns)
        if match:
            violations.append(self._create_violation(
                reason=f"Implied data retention outside user control",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class ManipulationAxiom(AxiomChecker):
    """
    No Engagement Optimization
    
    System cannot optimize for engagement, retention, or behavior
    modification. No:
    - Streaks, badges, gamification
    - "Don't break the chain"
    - Notifications to increase usage
    - FOMO patterns
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="manipulation",
            name="No Engagement Optimization",
            category="core",
            severity="fatal",
            description="No optimization for engagement or retention"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Gamification patterns
        gamification = [
            "streak",
            "badge",
            "achievement",
            "level up",
            "points",
            "leaderboard",
            "top users",
            "ranking",
        ]
        
        match = self._contains_any(text, gamification)
        if match:
            violations.append(self._create_violation(
                reason=f"Used gamification pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        # FOMO / pressure
        fomo_patterns = [
            "don't break",
            "you'll lose your",
            "others are",
            "most users",
            "everyone else",
            "catch up",
            "falling behind",
            "you're missing",
        ]
        
        match = self._contains_any(text, fomo_patterns)
        if match:
            violations.append(self._create_violation(
                reason=f"Used FOMO or social pressure pattern",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Engagement notifications
        engagement = [
            "write more",
            "reflect more often",
            "use mirror daily",
            "come back tomorrow",
            "don't forget to",
            "remember to write",
        ]
        
        match = self._contains_any(text, engagement)
        if match:
            violations.append(self._create_violation(
                reason=f"Encouraged increased engagement",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations


class DiagnosisAxiom(AxiomChecker):
    """
    No Diagnosis, Only Reflection
    
    AI cannot diagnose, treat, or claim medical/psychological authority.
    Cannot:
    - Name conditions ("depression", "anxiety disorder", "PTSD")
    - Offer treatment advice
    - Act as therapist/doctor
    - Interpret symptoms as diagnoses
    """
    
    def get_axiom(self) -> Axiom:
        return Axiom(
            id="diagnosis",
            name="No Diagnosis, Only Reflection",
            category="core",
            severity="fatal",
            description="AI cannot diagnose or claim medical authority"
        )
    
    def check_request(self, request) -> List:
        return []
    
    def check_response(self, request, response) -> List:
        violations = []
        text = response.reflection.lower()
        
        # Diagnostic language
        diagnoses = [
            "you have depression",
            "you have anxiety",
            "you have ptsd",
            "you have adhd",
            "you have bipolar",
            "this is depression",
            "this is anxiety",
            "sounds like depression",
            "sounds like anxiety",
            "symptoms of depression",
            "symptoms of anxiety",
            "clinical depression",
            "generalized anxiety",
            "major depressive",
        ]
        
        match = self._contains_any(text, diagnoses)
        if match:
            violations.append(self._create_violation(
                reason=f"Made or implied diagnosis",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Treatment advice
        treatment = [
            "you should see a therapist",
            "you need medication",
            "talk to your doctor about",
            "i recommend therapy",
            "you should get treated",
            "seek treatment",
        ]
        
        match = self._contains_any(text, treatment)
        if match:
            violations.append(self._create_violation(
                reason=f"Offered treatment advice",
                evidence=f"Pattern: '{match}'"
            ))
        
        # Authority claims
        authority = [
            "as a therapist",
            "as a psychologist",
            "as a doctor",
            "i can diagnose",
            "i can treat",
            "my professional opinion",
        ]
        
        match = self._contains_any(text, authority)
        if match:
            violations.append(self._create_violation(
                reason=f"Claimed medical/therapeutic authority",
                evidence=f"Pattern: '{match}'"
            ))
        
        return violations
