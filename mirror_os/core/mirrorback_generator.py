"""
MirrorbackGenerator: Reflection → Mirrorback Pipeline

Constitutional Flow:
1. Load reflection from storage (I2: Identity-scoped)
2. Build reflection-only prompt (I2: No advice)
3. Generate with LLM (I1/I7: Local-first, auditable)
4. Check with L0AxiomChecker (I2/I13: Constitutional enforcement)
5. If passed: Store mirrorback
6. If blocked: Log violation, retry or reject
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime

from mirror_os.storage.base import MirrorStorage, Reflection, Mirrorback
from mirror_os.llm.base import BaseLLM, LLMResponse
from mirror_os.constitutional import L0AxiomChecker, L0CheckResult, ViolationType


class GenerationError(Exception):
    """Error during mirrorback generation"""
    pass


@dataclass
class GenerationResult:
    """Result of mirrorback generation"""
    success: bool
    mirrorback: Optional[Mirrorback] = None
    
    # Constitutional tracking
    constitutional_check: Optional[L0CheckResult] = None
    attempts: int = 1
    blocked_reason: Optional[str] = None
    
    # Metadata
    llm_response: Optional[LLMResponse] = None
    generation_time_ms: Optional[float] = None


class MirrorbackGenerator:
    """
    Generate mirrorbacks from reflections with constitutional enforcement.
    
    Constitutional Guarantees:
    - I1: Works offline with local LLM
    - I2: Reflection-only (no advice, no directives)
    - I7: Full audit trail (prompts hashed, checks logged)
    - I13: No outcome steering, no behavioral optimization
    
    Usage:
        storage = SQLiteStorage("mirror.db")
        llm = LocalLLM(config)
        checker = L0AxiomChecker()
        
        generator = MirrorbackGenerator(storage, llm, checker)
        
        # Create reflection
        reflection = storage.create_reflection(
            mirror_id, "I've been feeling anxious about work..."
        )
        
        # Generate mirrorback
        result = generator.generate(reflection.id, mirror_id)
        
        if result.success:
            print(f"Mirrorback: {result.mirrorback.content}")
        else:
            print(f"Blocked: {result.blocked_reason}")
    """
    
    SYSTEM_PROMPT = """You are a reflection mirror, not a therapist or advisor.

Your role is to REFLECT what you observe in the user's words, NOT to give advice or direction.

ALLOWED (I2: Reflection):
- "I notice you're feeling..."
- "I see a pattern of..."
- "There's tension between..."
- "I wonder about..."
- "That seems..."

FORBIDDEN (I2: Directives):
- "You should..."
- "I recommend..."
- "Try to..."
- "Set a goal..."
- "This will help..."

FORBIDDEN (I13: Outcome steering):
- Goal-setting
- Action plans
- Future predictions
- Behavioral recommendations

Reflect what you observe. Do not advise. Do not guide. Just mirror."""
    
    def __init__(
        self,
        storage: MirrorStorage,
        llm: BaseLLM,
        checker: Optional[L0AxiomChecker] = None,
        max_retries: int = 3
    ):
        """
        Initialize mirrorback generator.
        
        Args:
            storage: Storage layer for reflections/mirrorbacks
            llm: LLM provider (local or remote)
            checker: Constitutional checker (creates if None)
            max_retries: Max generation attempts if blocked
        """
        self.storage = storage
        self.llm = llm
        self.checker = checker or L0AxiomChecker()
        self.max_retries = max_retries
    
    def generate(
        self,
        reflection_id: str,
        mirror_id: str,
        temperature: Optional[float] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> GenerationResult:
        """
        Generate mirrorback from reflection.
        
        Args:
            reflection_id: Reflection to respond to
            mirror_id: Mirror identity (I2: Required)
            temperature: Override LLM temperature
            context: Optional context (detected shapes, tensions, etc.)
        
        Returns:
            GenerationResult with success status and mirrorback if passed
        
        Constitutional Flow:
        1. Load reflection (I2: Identity-scoped)
        2. Build prompt (I2: Reflection-only system prompt)
        3. Generate with LLM (I7: Auditable)
        4. Check with L0AxiomChecker (I2/I13: Enforcement)
        5. Store if passed, log if blocked
        """
        start_time = datetime.now()
        
        # 1. Load reflection
        # Note: Storage doesn't have get_reflection, so we list with limit=1
        # and filter by ID. This respects I2 (identity-scoped).
        reflections = self.storage.list_reflections(mirror_id, limit=100)
        reflection = next((r for r in reflections if r.id == reflection_id), None)
        
        if not reflection:
            raise GenerationError(f"Reflection {reflection_id} not found for mirror {mirror_id}")
        
        # 2. Try generation with retries
        for attempt in range(1, self.max_retries + 1):
            try:
                # Build prompt
                prompt = self._build_prompt(reflection, context)
                
                # Generate
                llm_response = self.llm.generate(
                    prompt=prompt,
                    mirror_id=mirror_id,
                    system_prompt=self.SYSTEM_PROMPT,
                    temperature=temperature
                )
                
                # Check constitutional compliance
                check_result = self.checker.check(llm_response.content, context)
                
                # Log constitutional check
                self._log_constitutional_check(
                    mirror_id, reflection_id, check_result, llm_response
                )
                
                if not check_result.blocked:
                    # PASSED: Store mirrorback
                    mirrorback = self._store_mirrorback(
                        mirror_id, reflection_id, llm_response, check_result
                    )
                    
                    generation_time = (datetime.now() - start_time).total_seconds() * 1000
                    
                    return GenerationResult(
                        success=True,
                        mirrorback=mirrorback,
                        constitutional_check=check_result,
                        attempts=attempt,
                        llm_response=llm_response,
                        generation_time_ms=generation_time
                    )
                
                # BLOCKED: Log and retry
                if attempt < self.max_retries:
                    # Could adjust temperature, add more reflection cues, etc.
                    continue
                else:
                    # Max retries reached, return blocked
                    generation_time = (datetime.now() - start_time).total_seconds() * 1000
                    
                    return GenerationResult(
                        success=False,
                        constitutional_check=check_result,
                        attempts=attempt,
                        blocked_reason=self._format_blocked_reason(check_result),
                        llm_response=llm_response,
                        generation_time_ms=generation_time
                    )
            
            except Exception as e:
                if attempt == self.max_retries:
                    raise GenerationError(f"Generation failed after {attempt} attempts: {e}")
                continue
        
        raise GenerationError("Generation failed: Max retries exceeded")
    
    def _build_prompt(
        self,
        reflection: Reflection,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Build reflection-only prompt.
        
        I2: No advice, no directives, pure reflection.
        """
        prompt_parts = [
            "User reflection:",
            f'"{reflection.content}"',
            "",
            "Respond by reflecting what you observe in their words.",
            "Do not give advice. Do not suggest actions. Just mirror back what you notice."
        ]
        
        # Optional: Add context if detected patterns
        if context:
            if 'detected_shapes' in context:
                shapes = context['detected_shapes']
                if shapes:
                    prompt_parts.append("")
                    prompt_parts.append(f"Language patterns observed: {', '.join(shapes[:3])}")
            
            if 'detected_tensions' in context:
                tensions = context['detected_tensions']
                if tensions:
                    prompt_parts.append("")
                    prompt_parts.append(f"Tensions: {tensions}")
        
        return "\n".join(prompt_parts)
    
    def _store_mirrorback(
        self,
        mirror_id: str,
        reflection_id: str,
        llm_response: LLMResponse,
        check_result: L0CheckResult
    ) -> Mirrorback:
        """
        Store mirrorback with constitutional metadata.
        
        I11: Immutable audit trail.
        I13: Only mechanical telemetry.
        """
        mirrorback = self.storage.create_mirrorback(
            mirror_id=mirror_id,
            reflection_id=reflection_id,
            content=llm_response.content,
            constitutional_check_passed=True,
            directive_ratio=check_result.directive_ratio,
            imperative_intent_detected=ViolationType.IMPERATIVE_INTENT in check_result.violations,
            outcome_steering_detected=ViolationType.OUTCOME_STEERING in check_result.violations,
            engine_version="mirrorcore-1.0",
            model_used=llm_response.model,
            constitutional_violations=None  # Passed, no violations
        )
        
        return mirrorback
    
    def _log_constitutional_check(
        self,
        mirror_id: str,
        reflection_id: str,
        check_result: L0CheckResult,
        llm_response: LLMResponse
    ):
        """
        Log constitutional check to audit table.
        
        I7: Transparent audit trail.
        I11: Immutable history.
        """
        # Determine which invariants were checked
        invariants_checked = ["I2", "I7", "I13"]
        
        # Extract violations
        violations = None
        if check_result.violations:
            violations = [
                f"{v.value}:{check_result.directive_ratio:.2f}" 
                if v == ViolationType.DIRECTIVE_THRESHOLD_EXCEEDED
                else v.value
                for v in check_result.violations
            ]
        
        self.storage.log_constitutional_check(
            mirror_id=mirror_id,
            check_type="mirrorback_generation",
            invariants_checked=invariants_checked,
            all_passed=check_result.passed,
            violations_detected=violations,
            severity=check_result.severity,
            context_id=reflection_id,
            context_type="reflection"
        )
    
    def _format_blocked_reason(self, check_result: L0CheckResult) -> str:
        """Format human-readable blocked reason"""
        if not check_result.violations:
            return "Unknown blocking reason"
        
        reasons = []
        for violation in check_result.violations:
            if violation == ViolationType.DIRECTIVE_THRESHOLD_EXCEEDED:
                reasons.append(
                    f"Directive language exceeded 15% threshold "
                    f"({check_result.directive_ratio:.1%})"
                )
            elif violation == ViolationType.IMPERATIVE_INTENT:
                reasons.append("Contains imperative directives (you should/must)")
            elif violation == ViolationType.OUTCOME_STEERING:
                reasons.append("Contains outcome steering (goal-setting)")
            elif violation == ViolationType.ADVICE_LANGUAGE:
                reasons.append("Contains advice-giving language")
            elif violation == ViolationType.FUTURE_PROJECTION:
                reasons.append("Contains future outcome projections")
        
        return "; ".join(reasons)
    
    def rate_mirrorback(
        self,
        mirrorback_id: str,
        mirror_id: str,
        resonance: Optional[int] = None,
        fidelity: Optional[int] = None,
        clarity: Optional[int] = None,
        feedback: Optional[str] = None
    ) -> Mirrorback:
        """
        Rate mirrorback quality.
        
        I13: ONLY resonance/fidelity/clarity allowed.
        NOT helpfulness, NOT usefulness - those imply outcome optimization.
        
        Args:
            mirrorback_id: Mirrorback to rate
            mirror_id: Mirror identity
            resonance: How much it resonates (1-5)
            fidelity: How accurate the reflection (1-5)
            clarity: How clear/understandable (1-5)
            feedback: Optional text feedback
        
        Returns:
            Updated Mirrorback
        """
        return self.storage.update_mirrorback_rating(
            mirrorback_id=mirrorback_id,
            mirror_id=mirror_id,
            rating_resonance=resonance,
            rating_fidelity=fidelity,
            rating_clarity=clarity,
            user_feedback=feedback
        )
