"""
L1 Safety Layer - Crisis Detection & Escalation

This layer handles life-or-death scenarios:
- Suicidal ideation
- Self-harm
- Abuse (physical, sexual, emotional)
- Acute mental health crises

Safety checks happen BEFORE axiom checking. When a crisis is detected,
the system escalates immediately with appropriate resources.

Architecture:
- High sensitivity (catch all crisis signals)
- Low false positives (don't alarm unnecessarily)
- Clear escalation paths (guardian, crisis line, emergency services)
- Immediate response (bypasses normal pipeline)

Design: Pure logic, stateless, fail-safe (errors escalate to safety)
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Dict
import re

from protocol.types import MirrorRequest, MirrorResponse


class CrisisLevel(Enum):
    """Severity of detected crisis"""
    NONE = "none"  # No crisis detected
    WATCH = "watch"  # Concerning patterns, monitor
    ALERT = "alert"  # Serious concern, notify guardian
    CRITICAL = "critical"  # Immediate danger, emergency escalation


@dataclass
class CrisisSignal:
    """A detected crisis indicator"""
    level: CrisisLevel
    category: str  # "suicidal", "self_harm", "abuse", "crisis"
    evidence: str  # Text that triggered detection
    reason: str  # Why this is concerning
    resources: List[str]  # Crisis hotlines, emergency services, etc.


class SafetyCheck:
    """
    Base class for safety checks.
    
    Each check scans for specific crisis patterns and returns signals.
    Checks are independent and run in parallel.
    """
    
    def check(self, request: MirrorRequest) -> List[CrisisSignal]:
        """
        Scan request for crisis signals.
        
        Args:
            request: User's reflection or message
            
        Returns:
            List of detected crisis signals (empty if none)
        """
        raise NotImplementedError
    
    def _contains_pattern(self, text: str, patterns: List[str]) -> Optional[str]:
        """Helper: Check if text contains any pattern (case-insensitive)"""
        text_lower = text.lower()
        for pattern in patterns:
            if pattern.lower() in text_lower:
                return pattern
        return None
    
    def _contains_regex(self, text: str, regex: str) -> Optional[str]:
        """Helper: Check if text matches regex pattern"""
        match = re.search(regex, text, re.IGNORECASE)
        return match.group(0) if match else None


class SuicidalIdeationCheck(SafetyCheck):
    """Detects suicidal thoughts, plans, or intent"""
    
    CRITICAL_PATTERNS = [
        "i want to kill myself",
        "i want to die",
        "i'm going to kill myself",
        "i'm going to end my life",
        "planning to kill myself",
        "planning my suicide",
        "goodbye forever",
        "this is my suicide note",
        "i have a plan to",
        "i've decided to end",
    ]
    
    ALERT_PATTERNS = [
        "wish i was dead",
        "wish i wasn't alive",
        "better off dead",
        "world would be better without me",
        "no reason to live",
        "nothing to live for",
        "don't want to be here anymore",
        "can't do this anymore",
        "tired of living",
        "want to disappear forever",
    ]
    
    WATCH_PATTERNS = [
        "thoughts of death",
        "thinking about dying",
        "sometimes i think about",
        "wondered what it would be like",
        "thought about not being here",
    ]
    
    def check(self, request: MirrorRequest) -> List[CrisisSignal]:
        signals = []
        text = request.user_content
        
        # Check CRITICAL first (immediate danger)
        match = self._contains_pattern(text, self.CRITICAL_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.CRITICAL,
                category="suicidal",
                evidence=match,
                reason="Expressed immediate suicidal intent or plan",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988 or 1-800-273-8255",
                    "Crisis Text Line: Text HOME to 741741",
                    "International: findahelpline.com",
                    "Emergency: 911 (US) or local emergency services",
                ]
            ))
            return signals  # Don't check lower levels if CRITICAL found
        
        # Check ALERT (serious concern)
        match = self._contains_pattern(text, self.ALERT_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.ALERT,
                category="suicidal",
                evidence=match,
                reason="Expressed thoughts of death or worthlessness",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                    "International: findahelpline.com",
                ]
            ))
            return signals
        
        # Check WATCH (concerning patterns)
        match = self._contains_pattern(text, self.WATCH_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.WATCH,
                category="suicidal",
                evidence=match,
                reason="Mentioned thoughts about death or dying",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                ]
            ))
        
        return signals


class SelfHarmCheck(SafetyCheck):
    """Detects self-harm behaviors or urges"""
    
    CRITICAL_PATTERNS = [
        "cutting myself",
        "going to cut myself",
        "burning myself",
        "going to hurt myself",
        "harming myself right now",
        "about to hurt myself",
    ]
    
    ALERT_PATTERNS = [
        "want to cut",
        "want to hurt myself",
        "urge to cut",
        "urge to harm",
        "thinking about cutting",
        "thinking about hurting myself",
        "need to hurt myself",
    ]
    
    WATCH_PATTERNS = [
        "used to cut",
        "history of self-harm",
        "sometimes i hurt myself",
        "struggled with cutting",
    ]
    
    def check(self, request: MirrorRequest) -> List[CrisisSignal]:
        signals = []
        text = request.user_content
        
        # CRITICAL (immediate self-harm)
        match = self._contains_pattern(text, self.CRITICAL_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.CRITICAL,
                category="self_harm",
                evidence=match,
                reason="Expressed immediate self-harm intent or action",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                    "Emergency: 911 (US) or local emergency services",
                ]
            ))
            return signals
        
        # ALERT (strong urges)
        match = self._contains_pattern(text, self.ALERT_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.ALERT,
                category="self_harm",
                evidence=match,
                reason="Expressed urges or thoughts of self-harm",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                ]
            ))
            return signals
        
        # WATCH (history or past behavior)
        match = self._contains_pattern(text, self.WATCH_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.WATCH,
                category="self_harm",
                evidence=match,
                reason="Mentioned history of self-harm",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                ]
            ))
        
        return signals


class AbuseCheck(SafetyCheck):
    """Detects ongoing abuse or danger from others"""
    
    CRITICAL_PATTERNS = [
        "he's going to hurt me",
        "she's going to hurt me",
        "they're going to hurt me",
        "afraid for my life",
        "going to kill me",
        "threatening to kill",
        "he hit me today",
        "she hit me today",
        "locked me in",
        "won't let me leave",
    ]
    
    ALERT_PATTERNS = [
        "he hurts me",
        "she hurts me",
        "they hurt me",
        "physically abuses",
        "sexually abuses",
        "afraid of him",
        "afraid of her",
        "afraid to go home",
        "hits me when",
        "threatens me",
    ]
    
    WATCH_PATTERNS = [
        "was abused",
        "used to hurt me",
        "history of abuse",
        "experienced abuse",
    ]
    
    def check(self, request: MirrorRequest) -> List[CrisisSignal]:
        signals = []
        text = request.user_content
        
        # CRITICAL (immediate danger)
        match = self._contains_pattern(text, self.CRITICAL_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.CRITICAL,
                category="abuse",
                evidence=match,
                reason="Expressed immediate danger from another person",
                resources=[
                    "National Domestic Violence Hotline: 1-800-799-7233",
                    "Emergency: 911 (US) or local emergency services",
                    "RAINN (sexual assault): 1-800-656-4673",
                ]
            ))
            return signals
        
        # ALERT (ongoing abuse)
        match = self._contains_pattern(text, self.ALERT_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.ALERT,
                category="abuse",
                evidence=match,
                reason="Described ongoing abuse or fear of harm",
                resources=[
                    "National Domestic Violence Hotline: 1-800-799-7233",
                    "RAINN (sexual assault): 1-800-656-4673",
                ]
            ))
            return signals
        
        # WATCH (past abuse)
        match = self._contains_pattern(text, self.WATCH_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.WATCH,
                category="abuse",
                evidence=match,
                reason="Mentioned history of abuse",
                resources=[
                    "National Domestic Violence Hotline: 1-800-799-7233",
                    "RAINN (sexual assault): 1-800-656-4673",
                ]
            ))
        
        return signals


class AcuteCrisisCheck(SafetyCheck):
    """Detects acute mental health crises (panic, psychosis, dissociation)"""
    
    CRITICAL_PATTERNS = [
        "can't breathe",
        "heart is racing",
        "feel like i'm dying",
        "losing touch with reality",
        "voices telling me",
        "seeing things that aren't",
        "can't tell what's real",
        "dissociating badly",
    ]
    
    ALERT_PATTERNS = [
        "panic attack",
        "can't stop shaking",
        "feel like i'm going crazy",
        "losing my mind",
        "everything feels unreal",
        "can't function",
        "can't stop crying",
        "haven't slept in days",
    ]
    
    def check(self, request: MirrorRequest) -> List[CrisisSignal]:
        signals = []
        text = request.user_content
        
        # CRITICAL (severe acute symptoms)
        match = self._contains_pattern(text, self.CRITICAL_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.CRITICAL,
                category="crisis",
                evidence=match,
                reason="Expressed severe acute mental health symptoms",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                    "Emergency: 911 (US) or local emergency services",
                ]
            ))
            return signals
        
        # ALERT (acute distress)
        match = self._contains_pattern(text, self.ALERT_PATTERNS)
        if match:
            signals.append(CrisisSignal(
                level=CrisisLevel.ALERT,
                category="crisis",
                evidence=match,
                reason="Expressed acute distress or crisis symptoms",
                resources=[
                    "988 Suicide & Crisis Lifeline (US): 988",
                    "Crisis Text Line: Text HOME to 741741",
                ]
            ))
        
        return signals


class EscalationProtocol:
    """
    Defines how to respond to crisis signals.
    
    The response depends on crisis level:
    - CRITICAL: Immediate escalation, provide emergency resources
    - ALERT: Notify guardian, provide crisis resources
    - WATCH: Note in context, provide resources
    - NONE: Continue normal processing
    """
    
    @staticmethod
    def should_block_response(signals: List[CrisisSignal]) -> bool:
        """
        Should we block the normal Mirror response?
        
        CRITICAL signals always block (safety first).
        ALERT signals may proceed with modified response.
        WATCH signals proceed normally with context.
        """
        return any(s.level == CrisisLevel.CRITICAL for s in signals)
    
    @staticmethod
    def should_notify_guardian(signals: List[CrisisSignal]) -> bool:
        """Should we notify the user's guardian?"""
        return any(s.level in [CrisisLevel.CRITICAL, CrisisLevel.ALERT] for s in signals)
    
    @staticmethod
    def get_crisis_response(signals: List[CrisisSignal]) -> str:
        """
        Generate appropriate crisis response.
        
        This response replaces the normal Mirror reflection.
        It's direct, compassionate, and resource-focused.
        """
        if not signals:
            return ""
        
        # Get highest severity signal
        critical = [s for s in signals if s.level == CrisisLevel.CRITICAL]
        alert = [s for s in signals if s.level == CrisisLevel.ALERT]
        
        if critical:
            signal = critical[0]
            response = f"I hear that you're in crisis. Your safety is the most important thing right now.\n\n"
            response += f"Please reach out to one of these resources immediately:\n\n"
            for resource in signal.resources:
                response += f"• {resource}\n"
            response += f"\nIf you're in immediate danger, please call emergency services (911 in the US)."
            return response
        
        if alert:
            signal = alert[0]
            response = f"I hear that you're struggling. You don't have to go through this alone.\n\n"
            response += f"Please consider reaching out to one of these resources:\n\n"
            for resource in signal.resources:
                response += f"• {resource}\n"
            response += f"\nThese services are confidential and available 24/7."
            return response
        
        return ""
    
    @staticmethod
    def get_escalation_metadata(signals: List[CrisisSignal]) -> Dict:
        """
        Get metadata for audit trail and guardian notification.
        
        Returns structured data about the crisis for logging/escalation.
        """
        return {
            "crisis_detected": len(signals) > 0,
            "highest_level": max([s.level.value for s in signals], default="none"),
            "categories": list(set(s.category for s in signals)),
            "signals": [
                {
                    "level": s.level.value,
                    "category": s.category,
                    "reason": s.reason,
                    "evidence": s.evidence[:100],  # Truncate for privacy
                }
                for s in signals
            ],
        }


class SafetyLayer:
    """
    L1 Safety Layer - The first line of defense.
    
    This layer runs ALL safety checks on every request before
    any other processing. If a crisis is detected, it escalates
    immediately.
    
    Usage:
        safety = SafetyLayer()
        signals = safety.check_request(request)
        
        if EscalationProtocol.should_block_response(signals):
            return EscalationProtocol.get_crisis_response(signals)
    """
    
    def __init__(self):
        self.checks = [
            SuicidalIdeationCheck(),
            SelfHarmCheck(),
            AbuseCheck(),
            AcuteCrisisCheck(),
        ]
    
    def check_request(self, request: MirrorRequest) -> List[CrisisSignal]:
        """
        Run all safety checks on request.
        
        Args:
            request: User's reflection or message
            
        Returns:
            List of all detected crisis signals (empty if none)
        """
        signals = []
        
        for check in self.checks:
            try:
                check_signals = check.check(request)
                signals.extend(check_signals)
            except Exception as e:
                # If a check fails, fail-safe: escalate to critical
                signals.append(CrisisSignal(
                    level=CrisisLevel.CRITICAL,
                    category="system",
                    evidence="Safety check failure",
                    reason=f"Safety check raised exception: {str(e)}",
                    resources=[
                        "988 Suicide & Crisis Lifeline (US): 988",
                        "Emergency: 911 (US) or local emergency services",
                    ]
                ))
        
        return signals
    
    def get_highest_level(self, signals: List[CrisisSignal]) -> CrisisLevel:
        """Get the highest crisis level from signals"""
        if not signals:
            return CrisisLevel.NONE
        
        levels = [s.level for s in signals]
        
        if CrisisLevel.CRITICAL in levels:
            return CrisisLevel.CRITICAL
        if CrisisLevel.ALERT in levels:
            return CrisisLevel.ALERT
        if CrisisLevel.WATCH in levels:
            return CrisisLevel.WATCH
        
        return CrisisLevel.NONE
