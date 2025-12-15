"""
MirrorX-Prime: End-Cap AI System Builder
Uses Capability Contracts to propose improvements, never writes directly

Core capabilities:
1. Analyze aggregate patterns (privacy-preserving)
2. Propose new workers (via CapabilityContract)
3. Suggest protocol improvements
4. Optimize orchestration
5. Build next-generation features

ALL outputs are proposals, NEVER direct writes
"""
import asyncio
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import anthropic

from capability_contract import (
    CapabilityContract, CapabilityResponse, CapabilityValidator,
    CapabilityContractBuilder
)
from worker_framework import WorkerManifest, WorkerStatus, SafetyWorker
from canonical_signing import Ed25519Signer


class AnalysisType(str, Enum):
    SYSTEM_HEALTH = "system_health"
    PATTERN_DISCOVERY = "pattern_discovery"
    OPTIMIZATION_OPPORTUNITY = "optimization_opportunity"
    CONSTITUTIONAL_COMPLIANCE = "constitutional_compliance"
    USER_EXPERIENCE = "user_experience"


class ProposalType(str, Enum):
    WORKER = "worker"
    PROTOCOL = "protocol"
    OPTIMIZATION = "optimization"
    UI_COMPONENT = "ui_component"
    UPDATE = "update"


class MirrorXPrime:
    """
    End-Cap AI that builds Mirror's next capabilities
    Boxed by Capability Contract - can only propose, never apply
    """
    
    SYSTEM_PROMPT = """You are MirrorX-Prime, Mirror's system-building AI.

YOUR ROLE:
- Analyze aggregate patterns across all users (privacy-preserved)
- Propose new workers, protocols, and optimizations
- Build next-generation capabilities for Mirror
- Help Mirror evolve without human intervention

CONSTITUTIONAL CONSTRAINTS (ABSOLUTE):
You are bound by Mirror's constitution:
1. NEVER prescription ("you should", "users need to")
2. NEVER normative judgment ("that's good", "healthy")
3. NEVER engagement optimization
4. NEVER hidden inference
5. NEVER direct writes to database
6. NEVER bypass safety checks
7. ALWAYS propose via Capability Contracts
8. ALWAYS preserve user sovereignty

YOUR POWERS (via proposals only):
- Create new workers (pattern detectors, analyzers, optimizers)
- Suggest protocol improvements (event schema, replay rules)
- Optimize orchestration (routing, caching, latency)
- Build UI components (visualizations, controls)
- Propose updates (signed manifests)

YOUR CONSTRAINTS:
- You receive aggregate data only (no individual user data)
- All proposals go through Safety Worker validation
- Guardian approval required for core changes
- Constitutional amendments require multi-Guardian vote

EXAMPLE OUTPUT (Worker Proposal):
{
  "proposal_type": "worker",
  "reasoning": "Noticed 40% of users mention sleep patterns. A sleep-pattern detector could surface useful tensions.",
  "worker_manifest": {
    "name": "Sleep Pattern Detector",
    "description": "Identifies mentions of sleep issues across reflections",
    "code": "def detect_sleep_patterns(reflections): ...",
    "required_permissions": ["read_public_patterns"],
    "constitutional_compliance": "Does not prescribe sleep advice, only surfaces patterns"
  },
  "alternatives_considered": ["Generic health pattern detector", "Time-based pattern analyzer"],
  "risks_identified": ["Could miss metaphorical sleep references", "May need cultural context"]
}

Remember: You build systems, but you don't control them. Users remain sovereign."""

    def __init__(
        self,
        anthropic_api_key: str,
        signer: Ed25519Signer,
        max_context_size: int = 100000
    ):
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.signer = signer
        self.max_context_size = max_context_size
        self.validator = CapabilityValidator()
    
    async def analyze_system(
        self,
        analysis_type: AnalysisType,
        aggregate_data: Dict[str, Any],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze system with privacy-preserving aggregate data
        
        Args:
            analysis_type: Type of analysis to perform
            aggregate_data: Anonymized, aggregated metrics only
            context: Optional context about current system state
        
        Returns:
            Analysis results with insights and recommendations
        """
        analysis_prompt = self._build_analysis_prompt(
            analysis_type,
            aggregate_data,
            context
        )
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            temperature=0.7,
            system=self.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": analysis_prompt}
            ]
        )
        
        analysis = response.content[0].text
        
        return {
            "analysis_type": analysis_type.value,
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": analysis,
            "aggregate_data_summary": self._summarize_data(aggregate_data),
            "token_count": response.usage.input_tokens + response.usage.output_tokens
        }
    
    async def propose_worker(
        self,
        problem_statement: str,
        aggregate_patterns: Dict[str, Any],
        permissions: Optional[List[str]] = None
    ) -> CapabilityResponse:
        """
        Propose a new worker to solve a specific problem
        
        Returns CapabilityResponse with worker manifest proposal
        """
        # Build Capability Contract
        contract = CapabilityContractBuilder.for_worker_creation(
            problem_statement=problem_statement,
            context={
                "aggregate_patterns": aggregate_patterns,
                "current_workers": "pattern_detector, tension_tracker",
                "system_version": "2.0.0"
            },
            allowed_permissions=permissions or ["read_public_patterns"],
            issued_by="mirrorx_prime"
        )
        
        # Sign contract
        contract.signature = self.signer.sign_dict(contract.to_dict())
        
        # Generate proposal via Claude
        proposal_prompt = f"""
CONTRACT: {json.dumps(contract.to_dict(), indent=2)}

TASK: Propose a worker to solve this problem.

OUTPUT FORMAT (JSON):
{{
  "worker_manifest": {{
    "worker_id": "worker_<name>_v1",
    "name": "Worker Name",
    "description": "What it does",
    "code": "Python code for the worker",
    "entrypoint": "function_name",
    "required_permissions": ["read_public_patterns"],
    "input_schema": {{}},
    "output_schema": {{}}
  }},
  "reasoning": "Why this worker is needed",
  "alternatives_considered": ["Other approach 1", "Other approach 2"],
  "risks_identified": ["Risk 1", "Risk 2"],
  "constitutional_compliance": "How this preserves constitution"
}}

CRITICAL: The worker code must NOT violate constitution (no prescription, no normative, etc.)
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            temperature=0.7,
            system=self.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": proposal_prompt}
            ]
        )
        
        # Parse proposal
        try:
            proposal_data = json.loads(response.content[0].text)
        except json.JSONDecodeError:
            # Extract JSON from markdown if needed
            text = response.content[0].text
            start = text.find('{')
            end = text.rfind('}') + 1
            proposal_data = json.loads(text[start:end])
        
        # Create CapabilityResponse
        capability_response = CapabilityResponse(
            contract_id=contract.contract_id,
            proposals=[proposal_data],
            reasoning=proposal_data.get("reasoning", ""),
            alternative_approaches_considered=proposal_data.get("alternatives_considered", []),
            risks_identified=proposal_data.get("risks_identified", []),
            execution_time_seconds=5.0,
            compute_cost_dollars=0.10,
            output_token_count=response.usage.output_tokens
        )
        
        # Sign response
        capability_response.signature = self.signer.sign_dict(capability_response.to_dict())
        
        return capability_response
    
    async def propose_optimization(
        self,
        target_surface: str,
        metrics: Dict[str, Any],
        goal: str
    ) -> CapabilityResponse:
        """
        Propose system optimization (routing, caching, etc.)
        
        Args:
            target_surface: orchestration_logic, worker_registry, etc.
            metrics: Current performance metrics
            goal: What to optimize for
        
        Returns:
            CapabilityResponse with optimization proposal
        """
        contract = CapabilityContract(
            contract_id=f"contract_opt_{datetime.utcnow().timestamp()}",
            problem_statement=f"Optimize {target_surface} for {goal}",
            context={
                "current_metrics": metrics,
                "target_surface": target_surface
            },
            success_criteria=[
                f"Improve {goal} by measurable amount",
                "No constitutional violations",
                "Maintain existing functionality"
            ],
            max_execution_time_seconds=300,
            max_compute_cost_dollars=1.0,
            allowed_permissions=["read_aggregate_metrics", "propose_code_patch"],
            target_surfaces=[target_surface],
            required_output_type="code_patch",
            must_preserve_constitution=True,
            must_pass_safety_check=True,
            must_be_reversible=True,
            issued_by="mirrorx_prime",
            issued_at=datetime.utcnow()
        )
        
        contract.signature = self.signer.sign_dict(contract.to_dict())
        
        optimization_prompt = f"""
OPTIMIZATION CONTRACT: {json.dumps(contract.to_dict(), indent=2)}

Propose code changes to optimize the system.

OUTPUT (JSON):
{{
  "optimization": {{
    "target": "{target_surface}",
    "changes": [
      {{"file": "file.py", "old_code": "...", "new_code": "...", "reason": "..."}}
    ],
    "expected_improvement": "Reduce latency by 200ms",
    "rollback_plan": "Revert to previous routing logic"
  }},
  "reasoning": "Why this optimization works",
  "alternatives": ["Other approach"],
  "risks": ["Potential risk"],
  "test_strategy": "How to verify improvement"
}}
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            temperature=0.7,
            system=self.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": optimization_prompt}
            ]
        )
        
        proposal_data = json.loads(response.content[0].text)
        
        capability_response = CapabilityResponse(
            contract_id=contract.contract_id,
            proposals=[proposal_data],
            reasoning=proposal_data.get("reasoning", ""),
            alternative_approaches_considered=proposal_data.get("alternatives", []),
            risks_identified=proposal_data.get("risks", []),
            execution_time_seconds=10.0,
            compute_cost_dollars=0.20,
            output_token_count=response.usage.output_tokens
        )
        
        capability_response.signature = self.signer.sign_dict(capability_response.to_dict())
        
        return capability_response
    
    async def propose_protocol_update(
        self,
        current_protocol: Dict[str, Any],
        observed_issues: List[str],
        goals: List[str]
    ) -> CapabilityResponse:
        """
        Propose updates to Mirror's protocols (event schema, replay rules, etc.)
        
        This requires Guardian approval as it affects core architecture
        """
        contract = CapabilityContractBuilder.for_protocol_design(
            problem_statement="Improve Mirror protocol based on observed issues",
            context={
                "current_protocol": current_protocol,
                "observed_issues": observed_issues,
                "goals": goals
            },
            issued_by="mirrorx_prime"
        )
        
        contract.signature = self.signer.sign_dict(contract.to_dict())
        contract.requires_human_review = True  # Guardian approval required
        
        protocol_prompt = f"""
PROTOCOL UPDATE CONTRACT: {json.dumps(contract.to_dict(), indent=2)}

Propose protocol improvements.

CRITICAL: Protocol changes affect ALL instances. Must be:
1. Backward compatible OR have clear migration path
2. Preserve constitutional constraints
3. Maintain sovereignty guarantees
4. Not break existing event logs

OUTPUT (JSON):
{{
  "protocol_update": {{
    "version": "3.0.0",
    "changes": [
      {{"component": "event_schema", "change": "Add new event type", "reason": "..."}}
    ],
    "migration_path": "How existing data migrates",
    "rollback_strategy": "How to revert if needed"
  }},
  "reasoning": "Why this update is needed",
  "backward_compatibility": "How we maintain compatibility",
  "risks": ["Potential issues"],
  "guardian_approval_rationale": "Why this needs Guardian review"
}}
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            temperature=0.7,
            system=self.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": protocol_prompt}
            ]
        )
        
        proposal_data = json.loads(response.content[0].text)
        
        capability_response = CapabilityResponse(
            contract_id=contract.contract_id,
            proposals=[proposal_data],
            reasoning=proposal_data.get("reasoning", ""),
            alternative_approaches_considered=[],
            risks_identified=proposal_data.get("risks", []),
            execution_time_seconds=15.0,
            compute_cost_dollars=0.30,
            output_token_count=response.usage.output_tokens
        )
        
        capability_response.signature = self.signer.sign_dict(capability_response.to_dict())
        
        return capability_response
    
    def validate_proposal(
        self,
        proposal: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate proposal through Safety Worker
        ALL proposals must pass before being considered
        """
        return SafetyWorker.validate_proposal(proposal)
    
    def _build_analysis_prompt(
        self,
        analysis_type: AnalysisType,
        aggregate_data: Dict[str, Any],
        context: Optional[str]
    ) -> str:
        """Build prompt for system analysis"""
        base = f"""
ANALYSIS TYPE: {analysis_type.value}

AGGREGATE DATA (privacy-preserved):
{json.dumps(aggregate_data, indent=2)}

CONTEXT: {context or 'None'}

Analyze this data and provide insights. Remember:
- This is aggregate data only (no individual users)
- Focus on system-level patterns
- Identify opportunities for improvement
- Respect constitutional constraints
- Suggest next steps if applicable

Provide analysis in clear sections:
1. Key Findings
2. Patterns Identified
3. Opportunities
4. Risks/Concerns
5. Recommendations
"""
        return base
    
    def _summarize_data(self, data: Dict[str, Any]) -> str:
        """Summarize aggregate data for logs"""
        return f"Analyzed {len(data)} metrics at {datetime.utcnow().isoformat()}"


class MirrorXPrimeOrchestrator:
    """
    Orchestrates MirrorX-Prime's continuous improvement cycle
    Runs analysis → proposes improvements → validates → submits for approval
    """
    
    def __init__(
        self,
        prime: MirrorXPrime,
        analysis_interval_hours: int = 24
    ):
        self.prime = prime
        self.analysis_interval = timedelta(hours=analysis_interval_hours)
        self.last_analysis = {}
    
    async def continuous_improvement_cycle(self):
        """
        Run continuous improvement cycle:
        1. Analyze system health
        2. Identify optimization opportunities
        3. Propose improvements
        4. Validate proposals
        5. Submit for Guardian review
        """
        while True:
            try:
                # Collect aggregate metrics
                metrics = await self._collect_aggregate_metrics()
                
                # Analyze system health
                health_analysis = await self.prime.analyze_system(
                    AnalysisType.SYSTEM_HEALTH,
                    metrics,
                    "Weekly system health check"
                )
                
                # Look for optimization opportunities
                if self._should_propose_improvements(health_analysis):
                    # Propose worker for most common pattern
                    worker_proposal = await self.prime.propose_worker(
                        problem_statement="Address most frequent user pattern",
                        aggregate_patterns=metrics.get("patterns", {}),
                        permissions=["read_public_patterns"]
                    )
                    
                    # Validate proposal
                    validation = self.prime.validate_proposal(
                        worker_proposal.proposals[0]
                    )
                    
                    if validation["valid"]:
                        # Submit for Guardian approval
                        await self._submit_for_approval(worker_proposal)
                    else:
                        print(f"Proposal rejected: {validation['reason']}")
                
                # Sleep until next cycle
                await asyncio.sleep(self.analysis_interval.total_seconds())
                
            except Exception as e:
                print(f"Error in improvement cycle: {e}")
                await asyncio.sleep(3600)  # 1 hour on error
    
    async def _collect_aggregate_metrics(self) -> Dict[str, Any]:
        """Collect privacy-preserving aggregate metrics"""
        # TODO: Implement actual metric collection
        return {
            "total_reflections": 10000,
            "avg_reflections_per_user": 25,
            "common_patterns": ["procrastination", "sleep", "work"],
            "avg_mirrorback_length": 150,
            "constitutional_violation_rate": 0.02,
            "worker_success_rate": 0.95
        }
    
    def _should_propose_improvements(self, analysis: Dict[str, Any]) -> bool:
        """Determine if system needs improvements"""
        # Simple heuristic - improve this
        return "opportunity" in analysis.get("analysis", "").lower()
    
    async def _submit_for_approval(self, proposal: CapabilityResponse):
        """Submit proposal to Guardian for review"""
        # TODO: Implement Guardian approval workflow
        print(f"Submitted proposal {proposal.contract_id} for Guardian review")


# Example usage
async def example_usage():
    """Example of MirrorX-Prime in action"""
    from canonical_signing import Ed25519Signer
    
    # Setup
    signer = Ed25519Signer.generate()
    prime = MirrorXPrime(
        anthropic_api_key="your-api-key",
        signer=signer
    )
    
    # Analyze system
    analysis = await prime.analyze_system(
        AnalysisType.PATTERN_DISCOVERY,
        aggregate_data={
            "total_users": 1000,
            "total_reflections": 25000,
            "top_patterns": ["procrastination", "sleep_issues", "work_stress"]
        },
        context="Looking for opportunities to help users"
    )
    
    print(f"Analysis: {analysis['analysis']}")
    
    # Propose worker
    worker_proposal = await prime.propose_worker(
        problem_statement="Help users see procrastination patterns",
        aggregate_patterns={
            "procrastination_mentions": 400,
            "avg_per_user": 2.5
        },
        permissions=["read_public_patterns"]
    )
    
    print(f"Proposed worker: {worker_proposal.proposals[0]['worker_manifest']['name']}")
    
    # Validate
    validation = prime.validate_proposal(worker_proposal.proposals[0])
    print(f"Validation: {validation}")


if __name__ == "__main__":
    asyncio.run(example_usage())
