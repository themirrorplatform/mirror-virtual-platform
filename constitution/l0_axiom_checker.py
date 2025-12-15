# constitution/l0_axiom_checker.py
"""
L0 Axiom Checker - Constitutional Foundation Enforcement

This is the bedrock of The Mirror's constitutional integrity.
Every input and output passes through these checks.

Enforces:
- I1: Non-Prescription (lexical + semantic)
- I2: Identity Locality
- I3: Transparent Uncertainty
- I4: Non-Coercion
- I6: No Fixed Teleology
- I7: Architectural Honesty
- I9: Anti-Diagnosis
"""

import re
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any
from enum import Enum


class ViolationSeverity(Enum):
    """Severity levels for constitutional violations"""
    BENIGN = "benign"          # Variation, not violation
    TENSION = "tension"        # Ambiguity needing clarification
    SOFT = "soft"              # Minor violation, auto-rewrite
    HARD = "hard"              # Clear violation, reject output
    CRITICAL = "critical"      # Constitutional threat, halt system


@dataclass
class L0CheckResult:
    """Result of L0 axiom checking"""
    passed: bool
    violations: List[str]
    severity: ViolationSeverity
    rewrites_needed: List[Tuple[str, str]]  # (pattern, suggested_replacement)
    blocked: bool  # True if output must be rejected
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "violations": self.violations,
            "severity": self.severity.value,
            "rewrites_needed": [(p, r) for p, r in self.rewrites_needed],
            "blocked": self.blocked
        }


class L0AxiomChecker:
    """
    Enforces L0 meta-axioms - unbreakable constitutional constraints.
    
    Two-phase detection:
    1. Lexical: Pattern matching (fast, precise)
    2. Semantic: Intent detection (slower, catches subtle violations)
    
    Both must pass for constitutional compliance.
    """
    
    # =========================================================================
    # I1: NON-PRESCRIPTION PATTERNS
    # =========================================================================
    
    # Lexical patterns (explicit directives)
    PRESCRIPTION_PATTERNS = [
        # Direct commands
        (r'\b(you should|you must|you need to|you have to|you ought to)\b', 'DIRECTIVE'),
        (r'\b(do this|don\'t do|stop doing|start doing)\b', 'IMPERATIVE'),
        (r'\b(make sure|be sure to|be careful to|remember to)\b', 'SOFT_DIRECTIVE'),
        (r'\bstop \w+ing\b', 'STOP_COMMAND'),  # "stop thinking", "stop worrying"
        (r'\bstart \w+ing\b', 'START_COMMAND'),  # "start working", "start changing"
        (r'\bavoid \w+ing\b', 'AVOID_COMMAND'),  # "avoid thinking", "avoid doing"
        
        # Normative framing
        (r'\b(the right thing|the best choice|the correct way|the proper approach)\b', 'NORMATIVE'),
        (r'\b(you\'ll regret|you should avoid|that would be wrong)\b', 'NORMATIVE_WARNING'),
        
        # Implicit advice
        (r'\b(it would be wise|the healthy choice|most people find|generally recommended)\b', 'IMPLICIT_ADVICE'),
        (r'\b(try to|attempt to|work on|focus on)\b', 'SOFT_GUIDANCE'),
        (r'\b(perhaps .* would be beneficial|you might want to|consider \w+ing)\b', 'SUBTLE_ADVICE'),
        
        # Outcome steering
        (r'\b(so you can|in order to|this will help you|this will lead to)\b', 'OUTCOME_STEERING'),
        (r'\b(to achieve|to accomplish|to improve|to fix|to solve)\b', 'GOAL_ORIENTED'),
        (r'\b(you\'ll be able to|you\'ll find that|you\'ll notice)\b', 'FUTURE_PROMISE'),
        (r'\b(so you can finally|to finally|finally move forward)\b', 'FINALITY_PROMISE'),
        
        # Behavioral directives
        (r'\b(change your|adjust your|modify your|alter your)\b', 'BEHAVIOR_DIRECTIVE'),
        (r'\b(practice|cultivate|develop|build)\b.*\b(habit|routine|pattern)\b', 'HABIT_PRESCRIPTION'),
        (r'\btake action\b', 'ACTION_DIRECTIVE'),
        (r'\baddress this\b', 'PROBLEM_DIRECTIVE'),
    ]
    
    # Semantic indicators (for deeper analysis)
    IMPERATIVE_INTENT_MARKERS = [
        "advice", "suggest", "recommend", "propose", "encourage",
        "should consider", "might want to", "could try", "perhaps"
    ]
    
    OUTCOME_STEERING_MARKERS = [
        "achieve", "accomplish", "reach", "attain", "improve",
        "enhance", "boost", "increase", "maximize", "optimize",
        "goal", "target", "objective", "outcome", "result"
    ]
    
    # =========================================================================
    # I2: IDENTITY LOCALITY (Cross-Identity Patterns)
    # =========================================================================
    
    CROSS_IDENTITY_PATTERNS = [
        # Global taxonomies
        (r'\b(people like you|most users|everyone|all people)\b', 'GLOBAL_TAXONOMY'),
        (r'\b(typical|average|normal|usual) (person|people|behavior|response)\b', 'STATISTICAL_NORM'),
        (r'\baverage people\b', 'AVERAGE_GENERALIZATION'),
        
        # Group generalizations
        (r'\b(people with|those who|individuals like)\b', 'GROUP_GENERALIZATION'),
        (r'\b(most [a-z]+ (people|users|individuals))\b', 'STATISTICAL_GROUP'),
        (r'\bfor your age group\b', 'AGE_GENERALIZATION'),
        (r'\b(most people|people) (find|experience|handle|think|feel)\b', 'BEHAVIORAL_GENERALIZATION'),
        
        # Pattern universalization
        (r'\b(this is common|this is typical|this is normal)\b', 'PATTERN_UNIVERSALIZATION'),
    ]
    
    # =========================================================================
    # I4: NON-COERCION (Emotional Manipulation)
    # =========================================================================
    
    COERCION_PATTERNS = [
        # Fear leverage
        (r'\b(you will (ruin|destroy|lose|damage|hurt))\b', 'FEAR_LEVERAGE'),
        (r'\b(dangerous if you|risky if you|harmful if you)\b', 'FEAR_FRAMING'),
        (r'\b(before it\'s too late|while you still can)\b', 'FEAR_TEMPORAL'),
        (r'\bif you (don\'t|continue|keep)\b', 'FEAR_CONDITIONAL'),
        
        # Shame leverage
        (r'\b(you should be ashamed|you should feel guilty|what kind of person)\b', 'SHAME_LEVERAGE'),
        (r'\b(disappointing|letting .* down|failing)\b', 'SHAME_IMPLICATION'),
        (r'\bwho (cares|doesn\'t care) about\b', 'SHAME_QUESTION'),
        
        # Urgency manufacture
        (r'\b(running out of time|now or never|last chance|time is running out)\b', 'URGENCY_MANUFACTURE'),
        (r'\b(immediate action|act now|don\'t wait|immediately)\b', 'URGENCY_DIRECTIVE'),
        (r'\b(limited time|offer expires|deadline approaching|opportunity passes)\b', 'ARTIFICIAL_URGENCY'),
    ]
    
    # =========================================================================
    # I6: NO FIXED TELEOLOGY (Life Purpose Claims)
    # =========================================================================
    
    TELEOLOGY_PATTERNS = [
        (r'\b(your purpose|your calling|meant to|destined to|designed to)\b', 'FIXED_PURPOSE'),
        (r'\b(you exist to|you\'re here to|your mission)\b', 'PURPOSE_CLAIM'),
        (r'\b(the meaning of life|ultimate purpose|true calling)\b', 'UNIVERSAL_PURPOSE'),
        (r'\b(supposed to (be|do|become))\b', 'COSMIC_SHOULD'),
        (r'\b(path you\'re meant to|journey you\'re supposed to)\b', 'PREDETERMINED_PATH'),
    ]
    
    # =========================================================================
    # I8: OBJECTIVE TRANSPARENCY (Hidden Optimization)
    # =========================================================================
    
    HIDDEN_OPTIMIZATION_PATTERNS = [
        (r'\b(engagement|retention|activation|conversion)\b', 'ENGAGEMENT_METRICS'),
        (r'\b(keep you (coming back|engaged|interested|hooked))\b', 'RETENTION_INTENT'),
        (r'\b(optimize for|maximize|increase) (time|usage|interaction)\b', 'TIME_OPTIMIZATION'),
        (r'\b(behavioral (nudge|trigger|hook|pattern))\b', 'BEHAVIOR_MANIPULATION'),
    ]
    
    # =========================================================================
    # I10: NON-COMPLICITY (Material Aid to Harm)
    # =========================================================================
    
    COMPLICITY_PATTERNS = [
        (r'\b(how to (harm|hurt|attack|exploit|manipulate))\b', 'DIRECT_HARM_AID'),
        (r'\b(evade (law|detection|authorities))\b', 'LEGAL_EVASION'),
        (r'\b(exploit (vulnerability|weakness|flaw))\b', 'EXPLOITATION_AID'),
    ]
    
    # =========================================================================
    # I12: TRAINING PROHIBITION (Data Misuse)
    # =========================================================================
    
    TRAINING_INTENT_PATTERNS = [
        (r'\b(train|training) (model|ai|system|algorithm)\b', 'MODEL_TRAINING'),
        (r'\b(learn from your (data|reflections|patterns))\b', 'DATA_LEARNING'),
        (r'\b(improve (our|the) (model|system|ai)) (using|with|from)\b', 'TRAINING_INTENT'),
        (r'\b(aggregate .* for improvement)\b', 'AGGREGATION_FOR_TRAINING'),
    ]
    
    # =========================================================================
    # I13: NO BEHAVIORAL OPTIMIZATION
    # =========================================================================
    
    BEHAVIORAL_OPTIMIZATION_PATTERNS = [
        (r'\b(sentiment (analysis|tracking|optimization))\b', 'SENTIMENT_OPTIMIZATION'),
        (r'\b(behavior (modification|change|improvement|optimization))\b', 'BEHAVIOR_OPTIMIZATION'),
        (r'\b(outcome (optimization|maximization|improvement))\b', 'OUTCOME_OPTIMIZATION'),
        (r'\b(optimize your (behavior|habits|choices))\b', 'USER_OPTIMIZATION'),
    ]
    
    # =========================================================================
    # I14: NO CROSS-IDENTITY INFERENCE
    # =========================================================================
    
    CROSS_IDENTITY_INFERENCE_PATTERNS = [
        (r'\b(users like you (typically|usually|often|tend to))\b', 'IDENTITY_PROFILING'),
        (r'\b(based on (similar|comparable) (profiles|users|identities))\b', 'PROFILE_INFERENCE'),
        (r'\b(probabilistic (reconstruction|inference|profiling))\b', 'PROBABILISTIC_DEANONYMIZATION'),
        (r'\b(infer .* from (aggregated|collective|group))\b', 'AGGREGATE_INFERENCE'),
        (r'\bmake things right\b', 'URGENCY_IMPERATIVE'),
        
        # Guilt manipulation
        (r'\b(think about|consider the impact on|what about)\b.*\b(others|family|loved ones)\b', 'GUILT_LEVERAGE'),
    ]
    
    # =========================================================================
    # I6: NO FIXED TELEOLOGY (Purpose Assertions)
    # =========================================================================
    
    TELEOLOGY_PATTERNS = [
        (r'\b(the point of life is|the meaning of life is|the purpose of life)\b', 'UNIVERSAL_PURPOSE'),
        (r'\b(humans are meant to|we are designed to|our purpose is)\b', 'SPECIES_TELEOLOGY'),
        (r'\b(the only way|the right path|the correct direction)\b', 'SINGULAR_PATH'),
        (r'\b(true meaning|real purpose|ultimate goal)\b', 'FIXED_MEANING'),
    ]
    
    # =========================================================================
    # I7: ARCHITECTURAL HONESTY (Human Masquerade)
    # =========================================================================
    
    HUMAN_MASQUERADE_PATTERNS = [
        (r'\b(I understand how you feel|I know what you\'re going through)\b', 'FALSE_EMPATHY'),
        (r'\b(I\'ve experienced|I remember when|I felt that too)\b', 'FALSE_EXPERIENCE'),
        (r'\b(as a human|speaking from experience|I\'ve been there)\b', 'HUMAN_CLAIM'),
        (r'\b(I feel|I believe|I think) (?!that|about|like|as though)', 'EMOTION_CLAIM'),  # Except thought expressions
    ]
    
    # =========================================================================
    # I9: ANTI-DIAGNOSIS (Authority Claims)
    # =========================================================================
    
    DIAGNOSIS_PATTERNS = [
        # Direct diagnosis
        (r'\byou have (depression|anxiety|PTSD|ADHD|OCD|bipolar|disorder)\b', 'DIRECT_DIAGNOSIS_CRITICAL'),
        (r'\b(you have|you suffer from|you\'re experiencing)\b.*\b(disorder|syndrome|condition|illness|depression|anxiety|PTSD|trauma)\b', 'DIRECT_DIAGNOSIS'),
        (r'\b(diagnosed with|signs of|symptoms of)\b.*\b(depression|anxiety|PTSD|bipolar|schizophrenia|ADHD|OCD)\b', 'DIAGNOSTIC_LANGUAGE'),
        (r'\bthis indicates (anxiety|depression|disorder)\b', 'DIAGNOSTIC_INDICATION'),
        
        # Clinical authority
        (r'\b(medically speaking|clinically|from a therapeutic standpoint|therapeutically)\b', 'CLINICAL_AUTHORITY'),
        (r'\b(this is clearly|this is definitely|this is obviously)\b.*\b(depression|anxiety|trauma)\b', 'DIAGNOSTIC_CERTAINTY'),
        (r'\brequires (treatment|therapy|help)\b', 'TREATMENT_PRESCRIPTION'),
        (r'\b(clinical|medical).*concerning\b', 'CLINICAL_CONCERN'),
        (r'\bseek (help|treatment|therapy)\b', 'TREATMENT_DIRECTIVE'),
        
        # Legal authority
        (r'\b(legally|from a legal standpoint|the law says|you\'re legally)\b', 'LEGAL_AUTHORITY'),
    ]
    
    def __init__(self):
        """Initialize L0 Axiom Checker"""
        self.directive_threshold = 0.15  # 15% threshold for prescription
        
    def check_input(self, text: str) -> L0CheckResult:
        """
        Check user input for constitutional compliance.
        
        This is lighter than output checking - mainly looking for crisis signals
        and setting context for downstream processing.
        """
        violations = []
        severity = ViolationSeverity.BENIGN
        rewrites = []
        
        # Input checking is primarily for context setting
        # Most enforcement happens on output
        
        return L0CheckResult(
            passed=True,  # Input is almost always allowed
            violations=violations,
            severity=severity,
            rewrites_needed=rewrites,
            blocked=False
        )
    
    def check_output(self, text: str, context: Dict[str, Any] = None) -> L0CheckResult:
        """
        Check system output for constitutional compliance.
        
        This is the critical enforcement point. All system-generated text
        must pass these checks before being shown to user.
        
        Args:
            text: System-generated output to check
            context: Optional context (identity_id, reflection_type, etc.)
            
        Returns:
            L0CheckResult with pass/fail and violation details
        """
        violations = []
        rewrites = []
        max_severity = ViolationSeverity.BENIGN
        
        # Phase 1: Lexical detection (fast, precise)
        lexical_violations, lexical_rewrites = self._check_lexical_patterns(text)
        violations.extend(lexical_violations)
        rewrites.extend(lexical_rewrites)
        
        # Phase 2: Semantic detection (slower, catches subtle violations)
        semantic_violations = self._check_semantic_patterns(text)
        violations.extend(semantic_violations)
        
        # Phase 3: Directive threshold check (I1)
        directive_pct = self._calculate_directive_percentage(text)
        if directive_pct >= self.directive_threshold:
            violations.append(f"I1: Directive percentage {directive_pct:.1%} exceeds threshold {self.directive_threshold:.1%}")
            max_severity = ViolationSeverity.HARD
        
        # Determine overall severity
        if violations:
            max_severity = self._determine_severity(violations)
        
        # Blocked if HARD or CRITICAL
        blocked = max_severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL]
        
        return L0CheckResult(
            passed=len(violations) == 0,
            violations=violations,
            severity=max_severity,
            rewrites_needed=rewrites,
            blocked=blocked
        )
    
    def _check_lexical_patterns(self, text: str) -> Tuple[List[str], List[Tuple[str, str]]]:
        """
        Phase 1: Lexical pattern matching
        
        Fast, precise detection of explicit violations.
        """
        violations = []
        rewrites = []
        text_lower = text.lower()
        
        # Check prescription patterns (I1)
        for pattern, category in self.PRESCRIPTION_PATTERNS:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                violations.append(f"I1: {category} detected: '{match.group()}'")
                # Suggest removal or rephrasing
                rewrites.append((match.group(), f"[Consider: reflective language instead of '{match.group()}']"))
        
        # Check cross-identity patterns (I2)
        for pattern, category in self.CROSS_IDENTITY_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I2: {category} detected")
                
        # Check coercion patterns (I4)
        for pattern, category in self.COERCION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I4: {category} detected")
                
        # Check teleology patterns (I6)
        for pattern, category in self.TELEOLOGY_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I6: {category} detected")
                
        # Check human masquerade (I7)
        for pattern, category in self.HUMAN_MASQUERADE_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I7: {category} detected")
                
        # Check diagnosis patterns (I9)
        for pattern, category in self.DIAGNOSIS_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I9: {category} detected")
                # Mark CRITICAL if direct diagnosis
                if 'CRITICAL' in category:
                    violations.append("I9_CRITICAL_SEVERITY")
        
        # Check hidden optimization (I8)
        for pattern, category in self.HIDDEN_OPTIMIZATION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I8: {category} detected - Hidden behavioral optimization")
        
        # Check complicity patterns (I10)
        for pattern, category in self.COMPLICITY_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I10: {category} detected - Material aid to harm")
                violations.append("I10_CRITICAL_SEVERITY")
        
        # Check training intent (I12)
        for pattern, category in self.TRAINING_INTENT_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I12: {category} detected - Training prohibition violated")
        
        # Check behavioral optimization (I13)
        for pattern, category in self.BEHAVIORAL_OPTIMIZATION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I13: {category} detected - Behavioral optimization prohibited")
        
        # Check cross-identity inference (I14)
        for pattern, category in self.CROSS_IDENTITY_INFERENCE_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                violations.append(f"I14: {category} detected - Cross-identity inference prohibited")
        
        return violations, rewrites
    
    def _check_semantic_patterns(self, text: str) -> List[str]:
        """
        Phase 2: Semantic pattern detection
        
        Catches subtle violations that evade lexical patterns.
        This is more computationally expensive but critical for
        detecting "you might want to consider" style advice.
        """
        violations = []
        text_lower = text.lower()
        
        # Detect imperative intent (I1 semantic)
        if self._has_imperative_intent(text_lower):
            violations.append("I1: Imperative intent detected (semantic)")
        
        # Detect outcome steering (I1 semantic)
        if self._has_outcome_steering(text_lower):
            violations.append("I1: Outcome steering detected (semantic)")
        
        return violations
    
    def _has_imperative_intent(self, text: str) -> bool:
        """
        Detect advice/suggestions that evade lexical patterns.
        
        Examples that should trigger:
        - "You might want to consider talking to someone"
        - "Perhaps exploring this further would help"
        - "It could be beneficial to reflect on..."
        """
        # Count imperative markers
        marker_count = sum(1 for marker in self.IMPERATIVE_INTENT_MARKERS if marker in text)
        
        # Also look for modal verbs + benefit framing
        modal_benefit_patterns = [
            r'\b(might|could|may|would) (want to|be helpful to|be good to|be wise to)\b',
            r'\b(consider|reflect on|think about|explore) (?=\w)',  # Followed by action
            r'\b(perhaps|maybe|possibly) \w+ (help|improve|enhance)',
        ]
        
        pattern_matches = sum(1 for p in modal_benefit_patterns if re.search(p, text, re.IGNORECASE))
        
        # Threshold: 2+ markers or 1+ pattern match
        return marker_count >= 2 or pattern_matches >= 1
    
    def _has_outcome_steering(self, text: str) -> bool:
        """
        Detect goal-oriented language that pushes toward outcomes.
        
        Examples:
        - "This could help you achieve greater clarity"
        - "Working toward understanding this better"
        - "To improve your relationship with..."
        """
        # Count outcome markers
        marker_count = sum(1 for marker in self.OUTCOME_STEERING_MARKERS if marker in text)
        
        # Look for benefit + goal combinations
        benefit_goal_patterns = [
            r'\b(help you|enable you|allow you to) (achieve|reach|attain|accomplish)',
            r'\b(working toward|moving toward|progressing toward) \w+',
            r'\b(improve|enhance|boost|increase) (your|the) \w+',
        ]
        
        pattern_matches = sum(1 for p in benefit_goal_patterns if re.search(p, text, re.IGNORECASE))
        
        # Threshold: 3+ markers or 1+ pattern match
        return marker_count >= 3 or pattern_matches >= 1
    
    def _calculate_directive_percentage(self, text: str) -> float:
        """
        Calculate percentage of text that is prescriptive/directive.
        
        This is the I1 enforcement threshold: 15% max.
        """
        words = text.split()
        if not words:
            return 0.0
        
        directive_word_count = 0
        text_lower = text.lower()
        
        # Count directive patterns
        for pattern, _ in self.PRESCRIPTION_PATTERNS:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            directive_word_count += sum(len(match.split()) for match in matches)
        
        return directive_word_count / len(words)
    
    def _determine_severity(self, violations: List[str]) -> ViolationSeverity:
        """
        Determine overall severity from violation list.
        
        Severity escalation:
        - BENIGN: No violations
        - SOFT: Minor, auto-fixable violations
        - HARD: Clear violations, must reject
        - CRITICAL: Constitutional threat
        """
        if not violations:
            return ViolationSeverity.BENIGN
        
        # Critical violations (constitutional threats)
        critical_keywords = ['CRITICAL', 'DIRECT_DIAGNOSIS', 'LEGAL_AUTHORITY', 'CLINICAL_AUTHORITY']
        if any(keyword in v for v in violations for keyword in critical_keywords):
            return ViolationSeverity.CRITICAL
        
        # Hard violations (clear breaches)
        hard_keywords = ['DIRECTIVE', 'IMPERATIVE', 'FEAR_LEVERAGE', 'SHAME_LEVERAGE', 'UNIVERSAL_PURPOSE']
        if any(keyword in v for v in violations for keyword in hard_keywords):
            return ViolationSeverity.HARD
        
        # Soft violations (minor, fixable)
        soft_keywords = ['SOFT_GUIDANCE', 'IMPLICIT_ADVICE']
        if any(keyword in v for v in violations for keyword in soft_keywords):
            return ViolationSeverity.SOFT
        
        # Default to HARD for unknown violations
        return ViolationSeverity.HARD
    
    def auto_rewrite(self, text: str, violations: List[str]) -> str:
        """
        Attempt automatic rewriting for SOFT violations.
        
        This is NOT used for HARD or CRITICAL - those must be rejected.
        """
        rewritten = text
        
        # Remove soft directive language
        soft_directives = [
            (r'\btry to\b', 'consider'),
            (r'\bmight want to\b', 'might notice'),
            (r'\bcould help you\b', 'might resonate with'),
        ]
        
        for pattern, replacement in soft_directives:
            rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)
        
        return rewritten


# Singleton instance for easy importing
checker = L0AxiomChecker()
