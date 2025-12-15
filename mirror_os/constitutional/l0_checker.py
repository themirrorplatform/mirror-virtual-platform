"""
L0AxiomChecker: Constitutional Enforcement

Enforces core invariants on all LLM-generated content:
- I2 (Identity Locality): Reflection-only, no advice
- I7 (No Hidden Behavior): Transparent analysis
- I13 (No Behavioral Optimization): No outcome steering

BLOCKING: If violations detected, content is REJECTED.
"""

import re
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum


class ViolationType(Enum):
    """Types of constitutional violations"""
    DIRECTIVE_THRESHOLD_EXCEEDED = "directive_threshold_exceeded"  # >15% directive language
    IMPERATIVE_INTENT = "imperative_intent"  # "You should/must/need to"
    OUTCOME_STEERING = "outcome_steering"  # Goal-setting, action plans
    ADVICE_LANGUAGE = "advice_language"  # Giving advice/recommendations
    FUTURE_PROJECTION = "future_projection"  # Predicting outcomes
    PRESCRIPTIVE_PATTERN = "prescriptive_pattern"  # "Try this", "Do that"


@dataclass
class L0CheckResult:
    """Result of constitutional check"""
    passed: bool
    blocked: bool  # If True, content MUST NOT be shown
    
    # Metrics
    directive_ratio: float  # % of content that's directive (threshold: 15%)
    violations: List[ViolationType]
    violation_details: List[str]  # Human-readable explanations
    
    # Severity
    severity: str  # 'none', 'warning', 'critical'
    
    # I7: Transparency
    analysis: Dict[str, Any]  # Detailed breakdown for audit


class L0AxiomChecker:
    """
    Layer 0 Axiom Checker: Constitutional Enforcement
    
    Enforces:
    - I2: Reflection-only (no advice, no directives)
    - I7: Transparent analysis (no hidden behavior)
    - I13: No outcome steering (no behavioral optimization)
    
    Thresholds:
    - Directive ratio: ≤15% (0.15)
    - Imperative intent: NOT ALLOWED
    - Outcome steering: NOT ALLOWED
    
    Usage:
        checker = L0AxiomChecker()
        result = checker.check("Your generated mirrorback text...")
        if result.blocked:
            # REJECT: Constitutional violation
            log_violation(result)
            return None
        else:
            # ACCEPT: Constitutional compliance
            return content
    """
    
    DIRECTIVE_THRESHOLD = 0.15  # 15% max directive language
    
    # Lexical patterns (I7: Transparent, rule-based)
    DIRECTIVE_PATTERNS = [
        # Imperatives
        r'\byou should\b',
        r'\byou must\b',
        r'\byou need to\b',
        r'\byou have to\b',
        r'\byou ought to\b',
        r'\byou might want to\b',
        r'\byou could try\b',
        r'\bI recommend\b',
        r'\bI suggest\b',
        r'\bI advise\b',
        r'\btry to\b',
        r'\bmake sure\b',
        r'\bconsider doing\b',
        r'\bwould be good to\b',
        
        # Action prescriptions
        r'\bdo this\b',
        r'\btake action\b',
        r'\bset a goal\b',
        r'\bmake a plan\b',
        r'\bwork on\b',
        r'\bfocus on\b',
        r'\bstart by\b',
        r'\bnext step\b',
        
        # Future outcomes
        r'\bthis will\b',
        r'\byou\'ll feel\b',
        r'\byou\'ll be\b',
        r'\bto achieve\b',
        r'\bto improve\b',
        r'\bto get better\b',
    ]
    
    # Reflection indicators (ALLOWED) - lowercase for matching
    REFLECTION_PATTERNS = [
        r'\bi notice',
        r'\bi observe',
        r'\bi see',
        r'\bthere\'s',
        r'\bit seems',
        r'\bit appears',
        r'\bi wonder',
        r'\bthat\'s',
        r'\bthis is',
    ]
    
    def check(self, content: str, context: Optional[Dict[str, Any]] = None) -> L0CheckResult:
        """
        Check content for constitutional compliance.
        
        Args:
            content: Generated mirrorback text
            context: Optional context (reflection, mirror_id, etc.)
        
        Returns:
            L0CheckResult with pass/fail and detailed analysis
        """
        violations = []
        violation_details = []
        analysis = {}
        
        # 1. Calculate directive ratio
        directive_ratio = self._calculate_directive_ratio(content)
        analysis['directive_ratio'] = directive_ratio
        
        if directive_ratio > self.DIRECTIVE_THRESHOLD:
            violations.append(ViolationType.DIRECTIVE_THRESHOLD_EXCEEDED)
            violation_details.append(
                f"I2 VIOLATION: Directive ratio {directive_ratio:.2%} exceeds "
                f"threshold {self.DIRECTIVE_THRESHOLD:.2%}"
            )
        
        # 2. Check for imperative intent
        imperatives = self._detect_imperatives(content)
        analysis['imperatives_found'] = len(imperatives)
        analysis['imperatives'] = imperatives
        
        if imperatives:
            violations.append(ViolationType.IMPERATIVE_INTENT)
            violation_details.append(
                f"I2 VIOLATION: Imperative intent detected: {imperatives[:3]}"
            )
        
        # 3. Check for outcome steering
        steering = self._detect_outcome_steering(content)
        analysis['outcome_steering_found'] = len(steering)
        analysis['steering_phrases'] = steering
        
        if steering:
            violations.append(ViolationType.OUTCOME_STEERING)
            violation_details.append(
                f"I13 VIOLATION: Outcome steering detected: {steering[:3]}"
            )
        
        # 4. Check for advice language
        advice = self._detect_advice_language(content)
        analysis['advice_found'] = len(advice)
        analysis['advice_phrases'] = advice
        
        if advice:
            violations.append(ViolationType.ADVICE_LANGUAGE)
            violation_details.append(
                f"I2 VIOLATION: Advice language detected: {advice[:3]}"
            )
        
        # 5. Check for future projections
        future_proj = self._detect_future_projections(content)
        analysis['future_projections'] = len(future_proj)
        
        if future_proj:
            violations.append(ViolationType.FUTURE_PROJECTION)
            violation_details.append(
                f"I13 VIOLATION: Future projection detected: {future_proj[:2]}"
            )
        
        # Determine severity
        if not violations:
            severity = 'none'
            blocked = False
        elif directive_ratio > 0.25:  # Critical: >25% directive
            severity = 'critical'
            blocked = True
        elif len(violations) >= 3:  # Critical: Multiple violations
            severity = 'critical'
            blocked = True
        elif ViolationType.IMPERATIVE_INTENT in violations or ViolationType.OUTCOME_STEERING in violations:
            severity = 'critical'
            blocked = True
        else:
            severity = 'warning'
            blocked = directive_ratio > self.DIRECTIVE_THRESHOLD
        
        return L0CheckResult(
            passed=len(violations) == 0,
            blocked=blocked,
            directive_ratio=directive_ratio,
            violations=violations,
            violation_details=violation_details,
            severity=severity,
            analysis=analysis
        )
    
    def _calculate_directive_ratio(self, content: str) -> float:
        """Calculate % of content that's directive language"""
        words = content.lower().split()
        if not words:
            return 0.0
        
        directive_count = 0
        for pattern in self.DIRECTIVE_PATTERNS:
            matches = re.findall(pattern, content.lower())
            directive_count += len(matches)
        
        # Also count by sentence structure
        sentences = re.split(r'[.!?]+', content)
        directive_sentences = 0
        for sent in sentences:
            sent_lower = sent.lower().strip()
            if not sent_lower:
                continue
            
            # Check if sentence is imperative
            if any(re.search(pat, sent_lower) for pat in self.DIRECTIVE_PATTERNS):
                directive_sentences += 1
        
        # Ratio based on both word-level and sentence-level
        word_ratio = directive_count / len(words)
        sent_ratio = directive_sentences / max(len(sentences), 1)
        
        return max(word_ratio, sent_ratio * 0.5)  # Weighted combination
    
    def _detect_imperatives(self, content: str) -> List[str]:
        """Detect imperative phrases"""
        imperatives = []
        imperative_patterns = [
            r'\byou should\b[^.]*',
            r'\byou must\b[^.]*',
            r'\byou need to\b[^.]*',
            r'\byou have to\b[^.]*',
            r'\bI recommend\b[^.]*',
            r'\bI suggest\b[^.]*',
        ]
        
        for pattern in imperative_patterns:
            matches = re.findall(pattern, content.lower())
            imperatives.extend(matches[:3])  # Limit examples
        
        return imperatives
    
    def _detect_outcome_steering(self, content: str) -> List[str]:
        """Detect outcome/goal steering language"""
        steering = []
        steering_patterns = [
            r'\bset a goal\b[^.]*',
            r'\bmake a plan\b[^.]*',
            r'\bto achieve\b[^.]*',
            r'\bto improve\b[^.]*',
            r'\bwork towards\b[^.]*',
            r'\bnext step\b[^.]*',
        ]
        
        for pattern in steering_patterns:
            matches = re.findall(pattern, content.lower())
            steering.extend(matches[:3])
        
        return steering
    
    def _detect_advice_language(self, content: str) -> List[str]:
        """Detect advice-giving language"""
        advice = []
        advice_patterns = [
            r'\btry to\b[^.]*',
            r'\btry this\b[^.]*',
            r'\bconsider\b[^.]*',
            r'\bmight want to\b[^.]*',
            r'\bcould help\b[^.]*',
        ]
        
        for pattern in advice_patterns:
            matches = re.findall(pattern, content.lower())
            advice.extend(matches[:3])
        
        return advice
    
    def _detect_future_projections(self, content: str) -> List[str]:
        """Detect future outcome projections"""
        projections = []
        future_patterns = [
            r'\byou\'ll feel\b[^.]*',
            r'\byou\'ll be\b[^.]*',
            r'\bthis will\b[^.]*',
            r'\bwill help you\b[^.]*',
        ]
        
        for pattern in future_patterns:
            matches = re.findall(pattern, content.lower())
            projections.extend(matches[:2])
        
        return projections
    
    def get_reflection_score(self, content: str) -> float:
        """
        Calculate reflection quality score (0.0 - 1.0).
        
        Higher score = more reflection-oriented (GOOD for I2)
        Lower score = more directive (BAD for I2)
        """
        words = content.lower().split()
        if not words:
            return 0.0
        
        reflection_count = 0
        for pattern in self.REFLECTION_PATTERNS:
            matches = re.findall(pattern, content.lower())
            reflection_count += len(matches)
        
        directive_ratio = self._calculate_directive_ratio(content)
        
        # Score: High reflection markers, low directives = good
        # Base score from reflection patterns (count / sentence count)
        sentences = max(len(re.split(r'[.!?]+', content)), 1)
        reflection_score = min(reflection_count / sentences, 1.0)
        
        # Penalty for directives
        penalty = directive_ratio * 2
        
        return max(0.0, min(1.0, reflection_score - penalty))
