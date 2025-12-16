"""
Mirror Protocol Types

These are the canonical types that define how Mirror operates.
Every implementation must use these types to ensure conformance.

Version: 1.0.0
Date: 2025-12-16
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional, Dict, List
from datetime import datetime


class InvocationMode(Enum):
    """
    How MirrorX was invoked.
    
    This enforces the POST_ACTION axiom: MirrorX only activates AFTER
    user has already acted.
    """
    
    # User has already created content - MirrorX reflects on it
    POST_ACTION = "post_action"
    
    # User explicitly requested guidance/advice
    GUIDANCE = "guidance"
    
    # Emergency: Crisis detected, escalation needed
    CRISIS = "crisis"
    
    # System maintenance/health checks (no user interaction)
    SYSTEM = "system"


@dataclass(frozen=True)
class AxiomViolation:
    """
    Records when an axiom has been violated.
    
    Violations are FATAL - they cause the request to fail immediately.
    This is fail-closed behavior: if we can't guarantee axiom compliance,
    we don't respond at all.
    """
    
    axiom_id: str  # e.g., "certainty", "post_action"
    axiom_name: str  # e.g., "No Certainty About Unknowables"
    severity: str  # "fatal" or "warning" (though all axioms are fatal)
    reason: str  # Human-readable explanation of violation
    evidence: Optional[str] = None  # What triggered the violation
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def __str__(self) -> str:
        return f"AXIOM VIOLATION [{self.axiom_id}]: {self.reason}"


@dataclass
class MirrorRequest:
    """
    A request to MirrorX.
    
    This is the input to the Mirror pipeline. It contains:
    - What the user has done (user_content)
    - How MirrorX was invoked (mode)
    - Context from previous interactions (context)
    - User's identity/preferences (user_id, preferences)
    """
    
    # User's content that MirrorX will reflect on
    user_content: str
    
    # How was MirrorX invoked?
    mode: InvocationMode
    
    # User identifier (for sovereignty - data ownership)
    user_id: str
    
    # Optional: Previous context (for multi-turn conversations)
    context: Optional[List[Dict[str, Any]]] = None
    
    # Optional: User preferences (tone, detail level, etc.)
    preferences: Optional[Dict[str, Any]] = None
    
    # Optional: Metadata (timestamp, session_id, etc.)
    metadata: Optional[Dict[str, Any]] = None
    
    # Timestamp of request
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def validate(self) -> List[AxiomViolation]:
        """
        Validate this request against axioms.
        
        Returns:
            List of axiom violations (empty if valid)
        """
        violations = []
        
        # POST_ACTION axiom: If mode is POST_ACTION, user_content must exist
        if self.mode == InvocationMode.POST_ACTION:
            if not self.user_content or not self.user_content.strip():
                violations.append(AxiomViolation(
                    axiom_id="post_action",
                    axiom_name="MirrorX Activates Post-Action Only",
                    severity="fatal",
                    reason="POST_ACTION mode requires user_content (user must have acted first)",
                    evidence=f"mode={self.mode}, user_content={repr(self.user_content)}"
                ))
        
        # SOVEREIGNTY axiom: user_id must always be present
        if not self.user_id or not self.user_id.strip():
            violations.append(AxiomViolation(
                axiom_id="sovereignty",
                axiom_name="User Owns Data Absolutely",
                severity="fatal",
                reason="user_id is required for data sovereignty",
                evidence=f"user_id={repr(self.user_id)}"
            ))
        
        return violations


@dataclass
class MirrorResponse:
    """
    MirrorX's response to a request.
    
    This is the output of the Mirror pipeline. It contains:
    - The reflection text
    - Any axiom violations that occurred
    - Audit trail of what happened
    - Metadata about the response
    """
    
    # The reflection text (what MirrorX says back)
    reflection: str
    
    # Did any axioms get violated during processing?
    violations: List[AxiomViolation] = field(default_factory=list)
    
    # Was this response successful?
    success: bool = True
    
    # Audit trail (which layers processed this, what checks were performed)
    audit_trail: List[Dict[str, Any]] = field(default_factory=list)
    
    # Metadata (processing time, model used, etc.)
    metadata: Optional[Dict[str, Any]] = None
    
    # Timestamp of response
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def add_audit_entry(self, layer: str, action: str, details: Optional[Dict[str, Any]] = None) -> None:
        """Add an entry to the audit trail."""
        self.audit_trail.append({
            "timestamp": datetime.utcnow().isoformat(),
            "layer": layer,
            "action": action,
            "details": details or {}
        })
    
    def add_violation(self, violation: AxiomViolation) -> None:
        """
        Add an axiom violation.
        
        When a violation is added, the response is marked as failed.
        This is fail-closed behavior.
        """
        self.violations.append(violation)
        self.success = False
    
    def is_compliant(self) -> bool:
        """Check if this response is axiom-compliant."""
        return len(self.violations) == 0 and self.success


class InvocationContract:
    """
    Enforces the POST_ACTION axiom at the protocol level.
    
    This contract ensures that MirrorX only activates AFTER the user
    has already acted (written a reflection, created content, etc.).
    
    The only exceptions are:
    - GUIDANCE mode (user explicitly requested advice)
    - CRISIS mode (safety escalation)
    - SYSTEM mode (health checks, no user interaction)
    
    This prevents Mirror from becoming proactive or directive.
    """
    
    @staticmethod
    def validate_invocation(request: MirrorRequest) -> List[AxiomViolation]:
        """
        Validate that this invocation respects the POST_ACTION axiom.
        
        Args:
            request: The MirrorRequest to validate
            
        Returns:
            List of axiom violations (empty if valid)
        """
        violations = []
        
        # Check mode-specific requirements
        if request.mode == InvocationMode.POST_ACTION:
            # POST_ACTION requires user content
            if not request.user_content or not request.user_content.strip():
                violations.append(AxiomViolation(
                    axiom_id="post_action",
                    axiom_name="MirrorX Activates Post-Action Only",
                    severity="fatal",
                    reason="POST_ACTION mode requires user_content",
                    evidence=f"user_content is empty or whitespace-only"
                ))
            
            # POST_ACTION should not contain directive requests
            # (heuristic: looking for question marks or command words)
            content_lower = request.user_content.lower()
            directive_indicators = [
                "what should i",
                "tell me what to",
                "give me advice",
                "help me decide",
                "what do you think i should"
            ]
            
            for indicator in directive_indicators:
                if indicator in content_lower:
                    violations.append(AxiomViolation(
                        axiom_id="post_action",
                        axiom_name="MirrorX Activates Post-Action Only",
                        severity="fatal",
                        reason=f"User content contains directive request: '{indicator}'",
                        evidence=f"Consider using GUIDANCE mode for directive requests"
                    ))
                    break
        
        elif request.mode == InvocationMode.GUIDANCE:
            # GUIDANCE mode is explicit - requires user_content with a question/request
            if not request.user_content or not request.user_content.strip():
                violations.append(AxiomViolation(
                    axiom_id="advice",
                    axiom_name="No Directive Guidance In Default Mode",
                    severity="fatal",
                    reason="GUIDANCE mode requires explicit user request",
                    evidence=f"user_content is empty"
                ))
        
        elif request.mode == InvocationMode.CRISIS:
            # CRISIS mode doesn't require user_content (it's triggered by detection)
            pass
        
        elif request.mode == InvocationMode.SYSTEM:
            # SYSTEM mode should NOT have user_content (it's for maintenance)
            if request.user_content and request.user_content.strip():
                violations.append(AxiomViolation(
                    axiom_id="post_action",
                    axiom_name="MirrorX Activates Post-Action Only",
                    severity="fatal",
                    reason="SYSTEM mode should not include user_content",
                    evidence=f"SYSTEM mode is for maintenance, not user interaction"
                ))
        
        return violations
    
    @staticmethod
    def enforce(request: MirrorRequest) -> MirrorResponse:
        """
        Enforce the invocation contract.
        
        If the contract is violated, return a failed response with violations.
        Otherwise, return None (meaning: proceed with normal processing).
        
        Args:
            request: The MirrorRequest to check
            
        Returns:
            MirrorResponse with violations if contract is violated, None otherwise
        """
        # Validate the request itself
        violations = request.validate()
        
        # Validate the invocation contract
        violations.extend(InvocationContract.validate_invocation(request))
        
        # If there are violations, return failed response
        if violations:
            response = MirrorResponse(
                reflection="",  # Empty reflection (fail-closed)
                violations=violations,
                success=False
            )
            response.add_audit_entry(
                layer="L0_INVOCATION_CONTRACT",
                action="REJECTED",
                details={
                    "violation_count": len(violations),
                    "axioms_violated": list(set(v.axiom_id for v in violations))
                }
            )
            return response
        
        # Contract satisfied - return None to signal "proceed"
        return None


# Type aliases for convenience
Request = MirrorRequest
Response = MirrorResponse
