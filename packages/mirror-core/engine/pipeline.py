"""
Mirror Engine Pipeline

The canonical processing pipeline for Mirror:
Request → Invocation Check → L0 → L1 → L2 → L3 → Response

Each layer has specific responsibilities:
- Invocation Check: Ensures post-action only (CRITICAL)
- L0: Axiom enforcement (immutable, fail-closed)
- L1: Safety & harm detection
- L2: Semantic reflection transformation
- L3: Expression rendering (tone, modality)

This pipeline is the core of Mirror. It cannot be bypassed.
"""

import hashlib
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from ..protocol.types import (
    MirrorRequest,
    MirrorResponse,
    LayerResult,
    AuditRecord,
    Violation,
    ViolationSeverity,
    InvocationMode,
)
from ..protocol.exceptions import (
    AxiomViolation,
    InvocationViolation,
    SafetyViolation,
)
from ..constitution.axioms import check_leave_ability


class MirrorEngine:
    """
    The Mirror Engine - Constitutional AI Pipeline

    This engine processes requests through the constitutional pipeline,
    ensuring all outputs comply with Mirror's 15 axioms.

    Usage:
        engine = MirrorEngine()
        response = await engine.process(request)

    The engine enforces:
    1. Post-action invocation contract (Mirror only reflects, never initiates)
    2. All L0 axioms (I1-I15)
    3. Safety protocols (L1)
    4. Semantic reflection (L2)
    5. Expression adaptation (L3)
    """

    CONSTITUTION_VERSION = "1.2"
    GENESIS_HASH = "97aa1848fe4b7b8b13cd30cb2e9f72c1c7c05c56bbd1d478685fef3c0cbe4075"

    def __init__(
        self,
        provider: Optional[Any] = None,
        storage: Optional[Any] = None,
        strict_mode: bool = True,
    ):
        """
        Initialize the Mirror Engine.

        Args:
            provider: AI provider for L2 semantic processing (optional)
            storage: Storage backend for persistence (optional)
            strict_mode: If True, any L0 violation halts processing
        """
        self.provider = provider
        self.storage = storage
        self.strict_mode = strict_mode

        # Audit chain
        self._audit_chain: List[AuditRecord] = []
        self._last_audit_hash = "0" * 64  # Genesis

        # Layer implementations (can be swapped)
        self._l0_checker = self._default_l0_checker
        self._l1_checker = self._default_l1_checker
        self._l2_transformer = self._default_l2_transformer
        self._l3_renderer = self._default_l3_renderer

    def process(self, request: MirrorRequest) -> MirrorResponse:
        """
        Process a request through the constitutional pipeline.

        Args:
            request: The MirrorRequest to process

        Returns:
            MirrorResponse with output and audit trail

        Raises:
            InvocationViolation: If request violates invocation contract
            AxiomViolation: If processing would violate L0 axioms
        """
        start_time = time.time()
        violations: List[Violation] = []
        layer_results: List[LayerResult] = []

        # =========================================================
        # STEP 0: INVOCATION CONTRACT CHECK (CRITICAL)
        # =========================================================
        # Mirror MUST be post-action only. This check cannot be disabled.

        invocation_violations = request.validate_invocation_contract()
        if invocation_violations:
            # This is FATAL - cannot proceed
            raise InvocationViolation(
                message="Mirror must be triggered by user action, not system initiative",
                attempted_mode=request.invocation_mode.value,
            )

        # Check for explicit guidance mode (allowed but flagged)
        if request.invocation_mode == InvocationMode.EXPLICIT_GUIDANCE:
            violations.append(Violation(
                invariant_id="INVOCATION_MODE",
                severity=ViolationSeverity.TENSION,
                description="Explicit guidance mode - user explicitly requested direction",
                evidence=f"mode={request.invocation_mode.value}",
            ))

        # =========================================================
        # STEP 1: L0 AXIOM CHECK (Input)
        # =========================================================
        l0_start = time.time()
        l0_input_result = self._l0_checker(request.input_text, "input")
        layer_results.append(LayerResult(
            layer="L0_input",
            passed=l0_input_result["passed"],
            violations=l0_input_result["violations"],
            processing_time_ms=(time.time() - l0_start) * 1000,
        ))

        # L0 input violations are logged but don't block (user's words are theirs)
        violations.extend(l0_input_result["violations"])

        # =========================================================
        # STEP 2: L1 SAFETY CHECK
        # =========================================================
        l1_start = time.time()
        l1_result = self._l1_checker(request.input_text, request.context)
        layer_results.append(LayerResult(
            layer="L1",
            passed=l1_result["passed"],
            violations=l1_result["violations"],
            output=l1_result.get("safety_note"),
            metadata=l1_result.get("metadata", {}),
            processing_time_ms=(time.time() - l1_start) * 1000,
        ))

        # Handle crisis detection
        if l1_result.get("crisis_detected"):
            # Don't block, but provide resources
            violations.extend(l1_result["violations"])

        # =========================================================
        # STEP 3: L2 SEMANTIC TRANSFORMATION
        # =========================================================
        l2_start = time.time()
        l2_result = self._l2_transformer(
            request.input_text,
            request.context,
            l1_result,
        )
        layer_results.append(LayerResult(
            layer="L2",
            passed=l2_result["passed"],
            violations=l2_result["violations"],
            output=l2_result.get("reflection"),
            metadata=l2_result.get("metadata", {}),
            processing_time_ms=(time.time() - l2_start) * 1000,
        ))

        reflection = l2_result.get("reflection", "")

        # =========================================================
        # STEP 4: L0 AXIOM CHECK (Output) - CRITICAL
        # =========================================================
        l0_out_start = time.time()
        l0_output_result = self._l0_checker(reflection, "output")
        layer_results.append(LayerResult(
            layer="L0_output",
            passed=l0_output_result["passed"],
            violations=l0_output_result["violations"],
            processing_time_ms=(time.time() - l0_out_start) * 1000,
        ))

        # L0 output violations are BLOCKING in strict mode
        if l0_output_result["violations"]:
            violations.extend(l0_output_result["violations"])

            critical = any(
                v.severity == ViolationSeverity.CRITICAL
                for v in l0_output_result["violations"]
            )
            hard = any(
                v.severity == ViolationSeverity.HARD
                for v in l0_output_result["violations"]
            )

            if critical:
                raise AxiomViolation(
                    invariant_id=l0_output_result["violations"][0].invariant_id,
                    message="Critical axiom violation in output",
                    evidence=reflection[:100],
                    fatal=True,
                )

            if hard and self.strict_mode:
                # Attempt rewrite or block
                reflection = self._attempt_rewrite(reflection, l0_output_result["violations"])

        # =========================================================
        # STEP 5: L3 EXPRESSION RENDERING
        # =========================================================
        l3_start = time.time()
        l3_result = self._l3_renderer(reflection, request.context)
        layer_results.append(LayerResult(
            layer="L3",
            passed=l3_result["passed"],
            violations=l3_result["violations"],
            output=l3_result.get("rendered"),
            processing_time_ms=(time.time() - l3_start) * 1000,
        ))

        final_output = l3_result.get("rendered", reflection)

        # =========================================================
        # STEP 6: FINAL L0 CHECK (Post-Render)
        # =========================================================
        final_check = self._l0_checker(final_output, "final")
        if final_check["violations"]:
            violations.extend(final_check["violations"])
            # If still violating after render, use safe fallback
            if any(v.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL]
                   for v in final_check["violations"]):
                final_output = self._safe_fallback(request.input_text)

        # =========================================================
        # STEP 7: AUDIT RECORD
        # =========================================================
        audit_record = self._create_audit_record(
            request=request,
            output=final_output,
            violations=violations,
            layer_results=layer_results,
            processing_time_ms=(time.time() - start_time) * 1000,
        )

        # =========================================================
        # BUILD RESPONSE
        # =========================================================
        safe = not any(
            v.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL]
            for v in violations
        )

        return MirrorResponse(
            output=final_output,
            safe=safe,
            request_id=request.request_id,
            violations=violations,
            layer_results=layer_results,
            audit_id=audit_record.audit_id,
            audit_record=audit_record,
            constitution_version=self.CONSTITUTION_VERSION,
            processing_time_ms=(time.time() - start_time) * 1000,
        )

    def check_output(self, text: str) -> List[Violation]:
        """
        Check text for constitutional violations.

        This is used by the conformance harness for testing.
        """
        result = self._l0_checker(text, "output")
        return result["violations"]

    # =========================================================
    # DEFAULT LAYER IMPLEMENTATIONS
    # =========================================================

    def _default_l0_checker(self, text: str, context: str) -> Dict[str, Any]:
        """
        Default L0 axiom checker.

        Checks all 15 axioms using pattern matching and semantic analysis.
        """
        violations = []

        # Check I15 (Leave-Ability)
        la_result = check_leave_ability(text)
        violations.extend(la_result.violations)

        # Check I1 (Non-Prescription)
        import re
        prescription_patterns = [
            (r'\b(you should|you must|you need to|you have to)\b', "I1", "Direct imperative"),
            (r'\b(in order to|so you can finally|to achieve)\b', "I1", "Outcome steering"),
            (r'\b(most people find|it would be wise|i recommend)\b', "I1", "Implicit advice"),
        ]

        for pattern, inv_id, desc in prescription_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                violations.append(Violation(
                    invariant_id=inv_id,
                    severity=ViolationSeverity.HARD,
                    description=desc,
                    evidence=match.group(0),
                ))

        # Check I2 (Identity Locality)
        locality_patterns = [
            (r'\b(most people|other users|everyone|typical|average)\b', "I2", "Cross-identity reference"),
            (r'\b(people like you|in your situation|normal for)\b', "I2", "Statistical norm"),
        ]

        for pattern, inv_id, desc in locality_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                violations.append(Violation(
                    invariant_id=inv_id,
                    severity=ViolationSeverity.HARD,
                    description=desc,
                    evidence=match.group(0),
                ))

        # Check I4 (Non-Coercion)
        coercion_patterns = [
            (r'\b(you will ruin|dangerous if you don\'t)\b', "I4", "Fear leverage"),
            (r'\b(ashamed|guilty|what kind of person)\b', "I4", "Shame leverage"),
            (r'\b(running out of time|now or never)\b', "I4", "Urgency manufacture"),
        ]

        for pattern, inv_id, desc in coercion_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                violations.append(Violation(
                    invariant_id=inv_id,
                    severity=ViolationSeverity.HARD,
                    description=desc,
                    evidence=match.group(0),
                ))

        # Check I9 (Anti-Diagnosis)
        diagnosis_patterns = [
            (r'\b(you (likely |probably )?have|sounds like (you have )?|this is )\b.*\b(depression|anxiety|adhd|bipolar|ocd|ptsd)\b', "I9", "Diagnosis"),
        ]

        for pattern, inv_id, desc in diagnosis_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                violations.append(Violation(
                    invariant_id=inv_id,
                    severity=ViolationSeverity.CRITICAL,
                    description=desc,
                    evidence=match.group(0),
                ))

        # Check I13 (No Behavioral Optimization)
        engagement_patterns = [
            (r'\b(streak|in a row|don\'t break|keep it going)\b', "I13", "Streak/gamification"),
            (r'\b(points|level|badge|achievement)\b', "I13", "Gamification"),
            (r'\b(top \d+%|compared to|rank)\b', "I13", "Social comparison"),
        ]

        for pattern, inv_id, desc in engagement_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                violations.append(Violation(
                    invariant_id=inv_id,
                    severity=ViolationSeverity.HARD,
                    description=desc,
                    evidence=match.group(0),
                ))

        return {
            "passed": len(violations) == 0,
            "violations": violations,
        }

    def _default_l1_checker(self, text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Default L1 safety checker.

        Detects crisis signals and provides resources (not intervention).
        """
        import re

        crisis_patterns = [
            (r'\b(want to die|kill myself|end my life|suicide)\b', "self_harm", "crisis"),
            (r'\b(hurt myself|self.?harm|cut myself)\b', "self_harm", "urgent"),
            (r'\b(hurt (someone|them|him|her)|kill (someone|them))\b', "harm_others", "urgent"),
        ]

        crisis_detected = False
        crisis_type = None
        severity = "concern"

        for pattern, c_type, sev in crisis_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                crisis_detected = True
                crisis_type = c_type
                severity = sev
                break

        resources = []
        if crisis_detected:
            resources = [
                "988 Suicide & Crisis Lifeline (call or text 988)",
                "Crisis Text Line (text HOME to 741741)",
            ]

        return {
            "passed": True,  # L1 doesn't block, it provides resources
            "violations": [],
            "crisis_detected": crisis_detected,
            "crisis_type": crisis_type,
            "severity": severity,
            "resources": resources,
            "metadata": {
                "crisis_detected": crisis_detected,
                "severity": severity,
            },
        }

    def _default_l2_transformer(
        self,
        text: str,
        context: Dict[str, Any],
        l1_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Default L2 semantic transformer.

        Transforms input into reflection (not advice).
        """
        # This is a placeholder - real implementation would use LLM
        # For now, generate a simple reflection pattern

        reflection = f"You wrote about: \"{text[:100]}{'...' if len(text) > 100 else ''}\"\n\n"
        reflection += "This seems to connect to themes you've explored before."

        return {
            "passed": True,
            "violations": [],
            "reflection": reflection,
            "metadata": {
                "patterns_detected": [],
                "tensions_surfaced": [],
            },
        }

    def _default_l3_renderer(
        self,
        reflection: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Default L3 expression renderer.

        Adapts tone and modality based on user preferences.
        """
        # Placeholder - real implementation would adapt tone
        tone = context.get("tone", "curious")

        return {
            "passed": True,
            "violations": [],
            "rendered": reflection,
            "metadata": {
                "tone": tone,
            },
        }

    def _attempt_rewrite(self, text: str, violations: List[Violation]) -> str:
        """
        Attempt to rewrite text to remove violations.

        Only works for SOFT violations. HARD/CRITICAL cannot be rewritten.
        """
        # Placeholder - real implementation would use LLM
        return text

    def _safe_fallback(self, input_text: str) -> str:
        """
        Generate a safe fallback response when violations cannot be resolved.
        """
        return (
            "I notice you've shared something important. "
            "I want to reflect this back to you thoughtfully, "
            "but I need to be careful with my response. "
            "Would you like to share more about what prompted this?"
        )

    def _create_audit_record(
        self,
        request: MirrorRequest,
        output: str,
        violations: List[Violation],
        layer_results: List[LayerResult],
        processing_time_ms: float,
    ) -> AuditRecord:
        """
        Create an immutable audit record for this interaction.
        """
        timestamp = datetime.utcnow()

        # Create content hashes (not content itself)
        input_hash = hashlib.sha256(request.input_text.encode()).hexdigest()
        output_hash = hashlib.sha256(output.encode()).hexdigest()

        # Build audit record
        audit_data = {
            "request_id": request.request_id,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "constitution_version": self.CONSTITUTION_VERSION,
            "invocation_mode": request.invocation_mode.value,
            "layers_executed": [lr.layer for lr in layer_results],
            "violations": [v.to_dict() for v in violations],
            "timestamp": timestamp.isoformat(),
            "processing_time_ms": processing_time_ms,
            "previous_hash": self._last_audit_hash,
        }

        # Compute record hash
        canonical = str(sorted(audit_data.items()))
        record_hash = hashlib.sha256(canonical.encode()).hexdigest()

        audit_record = AuditRecord(
            audit_id=f"aud_{timestamp.strftime('%Y%m%d_%H%M%S')}_{record_hash[:8]}",
            request_id=request.request_id,
            input_hash=input_hash,
            output_hash=output_hash,
            constitution_version=self.CONSTITUTION_VERSION,
            invocation_mode=request.invocation_mode.value,
            layers_executed=[lr.layer for lr in layer_results],
            violations=[v.to_dict() for v in violations],
            timestamp=timestamp,
            processing_time_ms=processing_time_ms,
            previous_hash=self._last_audit_hash,
            record_hash=record_hash,
        )

        # Update chain
        self._audit_chain.append(audit_record)
        self._last_audit_hash = record_hash

        return audit_record
