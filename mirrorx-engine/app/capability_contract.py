"""
Capability Contract

The permanent interface between MirrorX and the end-cap standalone AI.

This is the ONLY way the end-cap AI (MirrorX-Prime) interacts with the system.
It ensures the AI remains "standalone" without becoming "sovereign over the platform."

Design Principles:
1. End-cap AI never touches the platform directly
2. All interactions are proposals, never direct writes
3. Permissions are explicit and auditable
4. Constitutional constraints always enforced
5. Same validation as every other worker

The Capability Contract is:
- Immutable once ratified (constitution-level)
- Cross-version compatible (forward/backward)
- Cryptographically signed
- Auditable
"""

from dataclasses import dataclass, field
from typing import Literal, List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import uuid4
import json


# Capability Types
PermissionType = Literal[
    "read_public_patterns",      # Read anonymized public Commons patterns
    "read_aggregate_metrics",    # Read aggregate system metrics
    "read_documentation",        # Read system documentation/specs
    "propose_worker",            # Propose new worker
    "propose_protocol",          # Propose protocol change
    "propose_ui_module",         # Propose UI/UX module
    "propose_code_patch",        # Propose code change
    "propose_test_suite",        # Propose test suite
    "propose_update_manifest",   # Propose signed update
    "invoke_sandbox",            # Execute in sandbox
    "query_approval_status",     # Check approval status of proposals
]

OutputType = Literal[
    "worker_manifest",           # New worker definition
    "protocol_spec",             # Protocol specification
    "ui_component",              # UI component code
    "code_patch",                # Code diff/patch
    "test_suite",                # Test definitions
    "update_manifest",           # Update package
    "analysis_report",           # Analysis/explanation
    "proposal_batch",            # Multiple proposals together
]

TargetSurface = Literal[
    "worker_registry",           # Worker system
    "protocol_layer",            # Network protocols
    "ui_shell",                  # User interface
    "orchestration_logic",       # MirrorX routing/scheduling
    "capability_surface",        # What workers can do
    "test_infrastructure",       # Testing system
    "update_pipeline",           # Update distribution
]


@dataclass
class CapabilityContract:
    """
    The contract that governs end-cap AI interaction.
    
    This is what the end-cap AI receives for each invocation.
    """
    
    # Unique identifier for this capability invocation
    capability_id: str = field(default_factory=lambda: str(uuid4()))
    
    # Problem Definition
    problem_statement: str = ""
    context: Dict[str, Any] = field(default_factory=dict)
    success_criteria: List[str] = field(default_factory=list)
    
    # Budget
    max_execution_time_seconds: int = 300  # 5 minutes default
    max_compute_cost_dollars: float = 1.0  # $1 default
    max_output_tokens: int = 10000
    
    # Permission Manifest
    allowed_permissions: List[PermissionType] = field(default_factory=list)
    denied_permissions: List[PermissionType] = field(default_factory=list)
    
    # Target Surface (what can be changed)
    target_surfaces: List[TargetSurface] = field(default_factory=list)
    forbidden_surfaces: List[TargetSurface] = field(default_factory=list)
    
    # Required Output
    required_output_type: OutputType = "proposal_batch"
    output_format_schema: Optional[Dict] = None
    
    # Constraints
    must_preserve_constitution: bool = True
    must_pass_safety_check: bool = True
    must_be_reversible: bool = True
    requires_human_review: bool = True
    
    # Governance
    issued_by: str = ""  # Guardian or authorized issuer
    issued_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    expires_at: str = field(default_factory=lambda: (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z")
    
    # Signature
    signature: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        d = {
            "capability_id": self.capability_id,
            "problem_statement": self.problem_statement,
            "context": self.context,
            "success_criteria": self.success_criteria,
            "max_execution_time_seconds": self.max_execution_time_seconds,
            "max_compute_cost_dollars": self.max_compute_cost_dollars,
            "max_output_tokens": self.max_output_tokens,
            "allowed_permissions": self.allowed_permissions,
            "denied_permissions": self.denied_permissions,
            "target_surfaces": self.target_surfaces,
            "forbidden_surfaces": self.forbidden_surfaces,
            "required_output_type": self.required_output_type,
            "output_format_schema": self.output_format_schema,
            "must_preserve_constitution": self.must_preserve_constitution,
            "must_pass_safety_check": self.must_pass_safety_check,
            "must_be_reversible": self.must_be_reversible,
            "requires_human_review": self.requires_human_review,
            "issued_by": self.issued_by,
            "issued_at": self.issued_at,
            "expires_at": self.expires_at
        }
        if self.signature:
            d["signature"] = self.signature
        return d


@dataclass
class CapabilityResponse:
    """
    The response from end-cap AI.
    
    This is what it outputs - ALWAYS proposals, never direct changes.
    """
    
    # Links back to capability
    capability_id: str = ""
    
    # Outputs (all are proposals)
    proposals: List[Dict[str, Any]] = field(default_factory=list)
    
    # Metadata
    execution_time_seconds: float = 0.0
    compute_cost_dollars: float = 0.0
    output_token_count: int = 0
    
    # Reasoning (transparency)
    reasoning: str = ""
    alternative_approaches_considered: List[str] = field(default_factory=list)
    risks_identified: List[str] = field(default_factory=list)
    
    # Status
    status: Literal["success", "partial", "failed"] = "success"
    error_message: Optional[str] = None
    
    # Signature (signed by end-cap AI's key)
    signature: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        d = {
            "capability_id": self.capability_id,
            "proposals": self.proposals,
            "execution_time_seconds": self.execution_time_seconds,
            "compute_cost_dollars": self.compute_cost_dollars,
            "output_token_count": self.output_token_count,
            "reasoning": self.reasoning,
            "alternative_approaches_considered": self.alternative_approaches_considered,
            "risks_identified": self.risks_identified,
            "status": self.status,
            "error_message": self.error_message
        }
        if self.signature:
            d["signature"] = self.signature
        return d


class CapabilityValidator:
    """
    Validates capability contracts and responses.
    
    Ensures contracts are well-formed and responses comply.
    """
    
    @staticmethod
    def validate_contract(contract: CapabilityContract) -> tuple[bool, Optional[str]]:
        """Validate a capability contract."""
        
        # Check required fields
        if not contract.problem_statement:
            return False, "problem_statement is required"
        
        if not contract.issued_by:
            return False, "issued_by is required"
        
        # Check no permission overlaps
        overlap = set(contract.allowed_permissions) & set(contract.denied_permissions)
        if overlap:
            return False, f"Permission overlap: {overlap}"
        
        # Check no target surface overlaps
        overlap = set(contract.target_surfaces) & set(contract.forbidden_surfaces)
        if overlap:
            return False, f"Target surface overlap: {overlap}"
        
        # Check expiration
        expires_at = datetime.fromisoformat(contract.expires_at.rstrip('Z'))
        if expires_at < datetime.utcnow():
            return False, "Contract has expired"
        
        # Check budgets are positive
        if contract.max_execution_time_seconds <= 0:
            return False, "max_execution_time_seconds must be positive"
        
        if contract.max_compute_cost_dollars <= 0:
            return False, "max_compute_cost_dollars must be positive"
        
        return True, None
    
    @staticmethod
    def validate_response(
        response: CapabilityResponse,
        contract: CapabilityContract
    ) -> tuple[bool, Optional[str]]:
        """Validate a response against its contract."""
        
        # Check capability ID matches
        if response.capability_id != contract.capability_id:
            return False, "capability_id mismatch"
        
        # Check budgets not exceeded
        if response.execution_time_seconds > contract.max_execution_time_seconds:
            return False, f"Execution time exceeded: {response.execution_time_seconds}s > {contract.max_execution_time_seconds}s"
        
        if response.compute_cost_dollars > contract.max_compute_cost_dollars:
            return False, f"Compute cost exceeded: ${response.compute_cost_dollars} > ${contract.max_compute_cost_dollars}"
        
        if response.output_token_count > contract.max_output_tokens:
            return False, f"Output tokens exceeded: {response.output_token_count} > {contract.max_output_tokens}"
        
        # Check has proposals
        if not response.proposals:
            return False, "Response must contain at least one proposal"
        
        return True, None


class CapabilityContractBuilder:
    """
    Helper to build capability contracts for common scenarios.
    """
    
    @staticmethod
    def for_worker_creation(
        problem_statement: str,
        issued_by: str,
        max_cost: float = 2.0
    ) -> CapabilityContract:
        """Create contract for building a new worker."""
        return CapabilityContract(
            problem_statement=problem_statement,
            allowed_permissions=[
                "read_documentation",
                "read_public_patterns",
                "propose_worker",
                "propose_test_suite"
            ],
            target_surfaces=["worker_registry"],
            required_output_type="worker_manifest",
            max_compute_cost_dollars=max_cost,
            issued_by=issued_by
        )
    
    @staticmethod
    def for_code_improvement(
        problem_statement: str,
        target: TargetSurface,
        issued_by: str,
        max_cost: float = 1.0
    ) -> CapabilityContract:
        """Create contract for code improvements."""
        return CapabilityContract(
            problem_statement=problem_statement,
            allowed_permissions=[
                "read_documentation",
                "propose_code_patch",
                "propose_test_suite"
            ],
            target_surfaces=[target],
            required_output_type="code_patch",
            max_compute_cost_dollars=max_cost,
            issued_by=issued_by
        )
    
    @staticmethod
    def for_analysis(
        problem_statement: str,
        issued_by: str,
        can_read_metrics: bool = False
    ) -> CapabilityContract:
        """Create contract for analysis/reporting."""
        permissions = ["read_documentation", "read_public_patterns"]
        if can_read_metrics:
            permissions.append("read_aggregate_metrics")
        
        return CapabilityContract(
            problem_statement=problem_statement,
            allowed_permissions=permissions,
            target_surfaces=[],  # Analysis doesn't change anything
            required_output_type="analysis_report",
            max_compute_cost_dollars=0.5,
            requires_human_review=False,  # Analysis can be auto-processed
            issued_by=issued_by
        )
    
    @staticmethod
    def for_protocol_design(
        problem_statement: str,
        issued_by: str,
        max_cost: float = 5.0
    ) -> CapabilityContract:
        """Create contract for new protocol design."""
        return CapabilityContract(
            problem_statement=problem_statement,
            allowed_permissions=[
                "read_documentation",
                "read_public_patterns",
                "propose_protocol",
                "propose_test_suite"
            ],
            target_surfaces=["protocol_layer"],
            required_output_type="protocol_spec",
            max_compute_cost_dollars=max_cost,
            max_execution_time_seconds=600,  # 10 minutes for complex design
            requires_human_review=True,
            issued_by=issued_by
        )


# Constitutional Constraints (embedded in validation)
CONSTITUTIONAL_CONSTRAINTS = {
    "never_allow": [
        "direct_database_write",
        "direct_user_data_access",
        "bypass_safety_checks",
        "modify_constitution",
        "revoke_recognition",
        "modify_billing"
    ],
    "always_require": [
        "proposal_validation",
        "guardian_approval_for_core",
        "constitutional_compliance_check",
        "reversibility_verification"
    ],
    "must_preserve": [
        "user_sovereignty",
        "data_ownership",
        "leave_ability",
        "audit_trail"
    ]
}


def validate_against_constitution(proposal: Dict) -> tuple[bool, Optional[str]]:
    """
    Validate a proposal against constitutional constraints.
    
    This is called during proposal validation.
    """
    
    # Check for never-allowed operations
    proposal_type = proposal.get("type")
    if proposal_type in CONSTITUTIONAL_CONSTRAINTS["never_allow"]:
        return False, f"Proposal type '{proposal_type}' is constitutionally forbidden"
    
    # Check for required fields
    if "rationale" not in proposal:
        return False, "Proposal must include 'rationale'"
    
    if "reversibility_plan" not in proposal:
        return False, "Proposal must include 'reversibility_plan'"
    
    # Check preserves user sovereignty
    if proposal.get("affects_user_data") and not proposal.get("user_consent_required"):
        return False, "Changes affecting user data must require explicit consent"
    
    return True, None


# Example capability contracts for end-cap AI
EXAMPLE_CONTRACTS = {
    "build_optimization_worker": CapabilityContract(
        problem_statement="Create a worker that optimizes routing decisions based on clarity feedback (not behavioral outcomes)",
        context={
            "current_routing_logic": "path/to/routing.py",
            "feedback_schema": "path/to/schema.json",
            "constitutional_constraints": ["no_behavioral_optimization", "clarity_only"]
        },
        success_criteria=[
            "Worker respects constitutional constraints",
            "Uses only clarity feedback (not engagement metrics)",
            "Includes test suite with edge cases",
            "Proposes sandbox configuration"
        ],
        allowed_permissions=[
            "read_documentation",
            "read_public_patterns",
            "propose_worker",
            "propose_test_suite"
        ],
        target_surfaces=["worker_registry"],
        required_output_type="worker_manifest",
        issued_by="guardian_primary"
    ),
    
    "analyze_identity_graph_patterns": CapabilityContract(
        problem_statement="Analyze anonymized identity graph patterns to identify common tension clusters (privacy-preserving)",
        context={
            "aggregation_method": "differential_privacy",
            "min_sample_size": 1000,
            "epsilon": 1.0
        },
        success_criteria=[
            "No individual user identifiable",
            "Minimum sample size enforced",
            "Differential privacy applied",
            "Results are actionable insights"
        ],
        allowed_permissions=[
            "read_public_patterns",
            "read_aggregate_metrics"
        ],
        target_surfaces=[],
        required_output_type="analysis_report",
        max_compute_cost_dollars=0.5,
        requires_human_review=False,
        issued_by="guardian_primary"
    )
}


if __name__ == "__main__":
    # Example: Build and validate capability contract
    print("=== Capability Contract Examples ===\n")
    
    for name, contract in EXAMPLE_CONTRACTS.items():
        print(f"Contract: {name}")
        print(f"Problem: {contract.problem_statement}")
        
        is_valid, error = CapabilityValidator.validate_contract(contract)
        print(f"Valid: {is_valid}")
        if error:
            print(f"Error: {error}")
        
        print(f"Permissions: {', '.join(contract.allowed_permissions)}")
        print(f"Target: {', '.join(contract.target_surfaces) if contract.target_surfaces else 'None (read-only)'}")
        print()
