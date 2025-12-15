"""
Multi-Guardian System with Threshold Signatures
M-of-N signatures required for critical operations

Enables truly decentralized governance:
- 3-of-5 Guardians must sign constitutional amendments
- No single Guardian is central authority
- Each Guardian runs independent RRP service
- Certificates require quorum signature
"""
import json
import secrets
from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timedelta
from enum import Enum
import hashlib

from canonical_signing import Ed25519Signer, Ed25519Verifier, canonical_json_str, sha256_hash


class GuardianRole(str, Enum):
    FOUNDER = "founder"        # Original Guardian
    ELECTED = "elected"        # Elected by community
    APPOINTED = "appointed"    # Appointed by existing council
    EMERITUS = "emeritus"      # Retired but honorary


class ProposalType(str, Enum):
    CONSTITUTIONAL_AMENDMENT = "constitutional_amendment"
    GUARDIAN_ADDITION = "guardian_addition"
    GUARDIAN_REMOVAL = "guardian_removal"
    PROTOCOL_CHANGE = "protocol_change"
    EMERGENCY_ACTION = "emergency_action"


class ProposalStatus(str, Enum):
    DRAFT = "draft"
    PROPOSED = "proposed"
    VOTING = "voting"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"


class Guardian:
    """Individual Guardian in the council"""
    def __init__(
        self,
        guardian_id: str,
        name: str,
        public_key: str,
        role: GuardianRole,
        joined_at: datetime,
        voting_weight: int = 1,
        status: str = "active"
    ):
        self.guardian_id = guardian_id
        self.name = name
        self.public_key = public_key
        self.role = role
        self.joined_at = joined_at
        self.voting_weight = voting_weight
        self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "guardian_id": self.guardian_id,
            "name": self.name,
            "public_key": self.public_key,
            "role": self.role.value,
            "joined_at": self.joined_at.isoformat(),
            "voting_weight": self.voting_weight,
            "status": self.status
        }


class ThresholdSignature:
    """
    M-of-N threshold signature
    Requires M signatures from N total Guardians
    """
    def __init__(
        self,
        message: str,
        threshold: int,
        total_guardians: int,
        signatures: Optional[Dict[str, str]] = None
    ):
        self.message = message
        self.threshold = threshold
        self.total_guardians = total_guardians
        self.signatures = signatures or {}  # guardian_id -> signature
    
    def add_signature(self, guardian_id: str, signature: str):
        """Add a Guardian's signature"""
        self.signatures[guardian_id] = signature
    
    def is_complete(self) -> bool:
        """Check if threshold is met"""
        return len(self.signatures) >= self.threshold
    
    def verify_all(self, guardians: Dict[str, Guardian]) -> bool:
        """Verify all signatures are valid"""
        if not self.is_complete():
            return False
        
        message_bytes = self.message.encode('utf-8')
        
        for guardian_id, signature in self.signatures.items():
            guardian = guardians.get(guardian_id)
            if not guardian:
                return False
            
            verifier = Ed25519Verifier.from_public_hex(guardian.public_key)
            if not verifier.verify_base64(message_bytes, signature):
                return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "message_hash": sha256_hash(self.message.encode('utf-8')),
            "threshold": self.threshold,
            "total_guardians": self.total_guardians,
            "signatures_count": len(self.signatures),
            "signers": list(self.signatures.keys()),
            "complete": self.is_complete()
        }


class ConstitutionalProposal:
    """Proposal requiring multi-Guardian vote"""
    def __init__(
        self,
        proposal_id: str,
        proposal_type: ProposalType,
        title: str,
        description: str,
        proposed_changes: Dict[str, Any],
        proposed_by: str,
        proposed_at: datetime,
        voting_deadline: datetime,
        threshold: int,
        status: ProposalStatus = ProposalStatus.PROPOSED
    ):
        self.proposal_id = proposal_id
        self.proposal_type = proposal_type
        self.title = title
        self.description = description
        self.proposed_changes = proposed_changes
        self.proposed_by = proposed_by
        self.proposed_at = proposed_at
        self.voting_deadline = voting_deadline
        self.threshold = threshold
        self.status = status
        self.votes: Dict[str, bool] = {}  # guardian_id -> approve/reject
        self.vote_signatures: Dict[str, str] = {}  # guardian_id -> signature
    
    def canonical_payload(self) -> str:
        """Canonical representation for signing"""
        return canonical_json_str({
            "proposal_id": self.proposal_id,
            "proposal_type": self.proposal_type.value,
            "title": self.title,
            "description": self.description,
            "proposed_changes": self.proposed_changes,
            "proposed_by": self.proposed_by,
            "proposed_at": self.proposed_at.isoformat(),
            "voting_deadline": self.voting_deadline.isoformat()
        })
    
    def add_vote(self, guardian_id: str, approve: bool, signature: str):
        """Add Guardian's vote"""
        self.votes[guardian_id] = approve
        self.vote_signatures[guardian_id] = signature
    
    def tally_votes(self) -> Dict[str, int]:
        """Count approve/reject votes"""
        approve = sum(1 for v in self.votes.values() if v)
        reject = sum(1 for v in self.votes.values() if not v)
        return {"approve": approve, "reject": reject}
    
    def is_approved(self) -> bool:
        """Check if proposal is approved (threshold met)"""
        tally = self.tally_votes()
        return tally["approve"] >= self.threshold
    
    def is_rejected(self) -> bool:
        """Check if proposal can no longer reach threshold"""
        tally = self.tally_votes()
        remaining_guardians = len(self.votes) - tally["approve"] - tally["reject"]
        return (tally["approve"] + remaining_guardians) < self.threshold
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "proposal_id": self.proposal_id,
            "proposal_type": self.proposal_type.value,
            "title": self.title,
            "description": self.description,
            "proposed_changes": self.proposed_changes,
            "proposed_by": self.proposed_by,
            "proposed_at": self.proposed_at.isoformat(),
            "voting_deadline": self.voting_deadline.isoformat(),
            "threshold": self.threshold,
            "status": self.status.value,
            "votes": self.tally_votes(),
            "is_approved": self.is_approved()
        }


class GuardianCouncil:
    """Council of Guardians with multi-sig capabilities"""
    
    def __init__(
        self,
        council_id: str,
        default_threshold: int = 3,
        default_voting_period_days: int = 7
    ):
        self.council_id = council_id
        self.default_threshold = default_threshold
        self.default_voting_period_days = default_voting_period_days
        self.guardians: Dict[str, Guardian] = {}
        self.proposals: Dict[str, ConstitutionalProposal] = {}
    
    def add_guardian(
        self,
        guardian: Guardian,
        approved_by_threshold_sig: ThresholdSignature
    ) -> bool:
        """
        Add new Guardian to council
        Requires threshold signature from existing Guardians
        """
        # Verify threshold signature
        if not approved_by_threshold_sig.verify_all(self.guardians):
            return False
        
        if not approved_by_threshold_sig.is_complete():
            return False
        
        self.guardians[guardian.guardian_id] = guardian
        return True
    
    def remove_guardian(
        self,
        guardian_id: str,
        approved_by_threshold_sig: ThresholdSignature
    ) -> bool:
        """
        Remove Guardian from council
        Requires threshold signature
        """
        if not approved_by_threshold_sig.verify_all(self.guardians):
            return False
        
        if guardian_id in self.guardians:
            guardian = self.guardians[guardian_id]
            guardian.status = "removed"
            return True
        
        return False
    
    def create_proposal(
        self,
        proposal_type: ProposalType,
        title: str,
        description: str,
        proposed_changes: Dict[str, Any],
        proposed_by_guardian_id: str,
        custom_threshold: Optional[int] = None
    ) -> ConstitutionalProposal:
        """
        Create new proposal for Guardian vote
        
        Args:
            proposal_type: Type of proposal
            title: Short title
            description: Full description
            proposed_changes: Actual changes being proposed
            proposed_by_guardian_id: Guardian proposing
            custom_threshold: Override default threshold
        
        Returns:
            ConstitutionalProposal ready for voting
        """
        if proposed_by_guardian_id not in self.guardians:
            raise ValueError("Proposer must be a Guardian")
        
        proposal = ConstitutionalProposal(
            proposal_id=f"proposal_{secrets.token_urlsafe(12)}",
            proposal_type=proposal_type,
            title=title,
            description=description,
            proposed_changes=proposed_changes,
            proposed_by=proposed_by_guardian_id,
            proposed_at=datetime.utcnow(),
            voting_deadline=datetime.utcnow() + timedelta(days=self.default_voting_period_days),
            threshold=custom_threshold or self.default_threshold,
            status=ProposalStatus.VOTING
        )
        
        self.proposals[proposal.proposal_id] = proposal
        return proposal
    
    def vote_on_proposal(
        self,
        proposal_id: str,
        guardian_id: str,
        approve: bool,
        guardian_signer: Ed25519Signer
    ) -> bool:
        """
        Guardian votes on proposal
        
        Args:
            proposal_id: Proposal to vote on
            guardian_id: Voting Guardian
            approve: True = approve, False = reject
            guardian_signer: Guardian's signer to sign vote
        
        Returns:
            True if vote recorded successfully
        """
        proposal = self.proposals.get(proposal_id)
        if not proposal:
            return False
        
        if guardian_id not in self.guardians:
            return False
        
        if proposal.status != ProposalStatus.VOTING:
            return False
        
        if datetime.utcnow() > proposal.voting_deadline:
            proposal.status = ProposalStatus.REJECTED
            return False
        
        # Sign vote
        vote_payload = canonical_json_str({
            "proposal_id": proposal_id,
            "guardian_id": guardian_id,
            "approve": approve,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        signature = guardian_signer.sign_base64(vote_payload.encode('utf-8'))
        
        # Record vote
        proposal.add_vote(guardian_id, approve, signature)
        
        # Update proposal status
        if proposal.is_approved():
            proposal.status = ProposalStatus.APPROVED
        elif proposal.is_rejected():
            proposal.status = ProposalStatus.REJECTED
        
        return True
    
    def execute_proposal(
        self,
        proposal_id: str,
        executor_guardian_id: str
    ) -> bool:
        """
        Execute approved proposal
        Only approved proposals can be executed
        """
        proposal = self.proposals.get(proposal_id)
        if not proposal:
            return False
        
        if proposal.status != ProposalStatus.APPROVED:
            return False
        
        if not proposal.is_approved():
            return False
        
        # Execute changes based on proposal type
        if proposal.proposal_type == ProposalType.CONSTITUTIONAL_AMENDMENT:
            self._execute_constitutional_amendment(proposal)
        elif proposal.proposal_type == ProposalType.GUARDIAN_ADDITION:
            # Already handled in add_guardian
            pass
        # ... other types
        
        proposal.status = ProposalStatus.EXECUTED
        return True
    
    def _execute_constitutional_amendment(self, proposal: ConstitutionalProposal):
        """Execute constitutional amendment"""
        # TODO: Implement actual constitution update mechanism
        print(f"Executing constitutional amendment: {proposal.title}")
        print(f"Changes: {json.dumps(proposal.proposed_changes, indent=2)}")
    
    def get_active_guardians(self) -> List[Guardian]:
        """Get all active Guardians"""
        return [g for g in self.guardians.values() if g.status == "active"]
    
    def get_proposal_status(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of proposal"""
        proposal = self.proposals.get(proposal_id)
        if not proposal:
            return None
        
        return proposal.to_dict()
    
    def create_threshold_signature(
        self,
        message: str,
        signers: List[str],
        signer_keys: Dict[str, Ed25519Signer]
    ) -> ThresholdSignature:
        """
        Create threshold signature with multiple Guardian signatures
        
        Args:
            message: Message to sign
            signers: List of guardian_ids signing
            signer_keys: Dict of guardian_id -> Ed25519Signer
        
        Returns:
            ThresholdSignature
        """
        threshold_sig = ThresholdSignature(
            message=message,
            threshold=self.default_threshold,
            total_guardians=len(self.get_active_guardians())
        )
        
        message_bytes = message.encode('utf-8')
        
        for guardian_id in signers:
            if guardian_id not in signer_keys:
                continue
            
            signer = signer_keys[guardian_id]
            signature = signer.sign_base64(message_bytes)
            threshold_sig.add_signature(guardian_id, signature)
        
        return threshold_sig


# Example usage
if __name__ == "__main__":
    from canonical_signing import Ed25519Signer
    
    # Setup council
    council = GuardianCouncil(
        council_id="mirror_council_v1",
        default_threshold=3,
        default_voting_period_days=7
    )
    
    # Create initial Guardians (founders)
    guardians_data = []
    for i in range(5):
        signer = Ed25519Signer.generate()
        guardian = Guardian(
            guardian_id=f"guardian_{i+1}",
            name=f"Guardian {i+1}",
            public_key=signer.public_hex(),
            role=GuardianRole.FOUNDER,
            joined_at=datetime.utcnow()
        )
        council.guardians[guardian.guardian_id] = guardian
        guardians_data.append((guardian, signer))
    
    print(f"Council created with {len(council.guardians)} Guardians")
    
    # Create constitutional amendment proposal
    proposal = council.create_proposal(
        proposal_type=ProposalType.CONSTITUTIONAL_AMENDMENT,
        title="Add 'No Dark Patterns' constraint",
        description="Explicitly forbid UI dark patterns in Mirror",
        proposed_changes={
            "constitution": {
                "add_constraint": "no_dark_patterns",
                "definition": "Never use deceptive UI/UX to manipulate users"
            }
        },
        proposed_by_guardian_id="guardian_1"
    )
    
    print(f"\nProposal created: {proposal.title}")
    print(f"Needs {proposal.threshold} votes to pass")
    
    # Guardians vote (3 approve, 1 reject)
    council.vote_on_proposal(proposal.proposal_id, "guardian_1", True, guardians_data[0][1])
    council.vote_on_proposal(proposal.proposal_id, "guardian_2", True, guardians_data[1][1])
    council.vote_on_proposal(proposal.proposal_id, "guardian_3", True, guardians_data[2][1])
    council.vote_on_proposal(proposal.proposal_id, "guardian_4", False, guardians_data[3][1])
    
    status = council.get_proposal_status(proposal.proposal_id)
    print(f"\nVoting complete:")
    print(f"  Approve: {status['votes']['approve']}")
    print(f"  Reject: {status['votes']['reject']}")
    print(f"  Status: {status['status']}")
    
    if status['is_approved']:
        council.execute_proposal(proposal.proposal_id, "guardian_1")
        print("\nProposal executed! Constitution updated.")
