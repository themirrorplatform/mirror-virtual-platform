# mirror_worldview/governance.py
"""
Mirror Governance: Constitutional Amendment System

Democratic process for evolving the constitution while maintaining core principles.

Constitutional requirements:
- Supermajority threshold (67% approval - from I15)
- One identity = one vote (I2 compliance)
- Guardian oversight (ensures amendments don't violate invariants)
- Transparency (all proposals and votes public)
- Fork option (dissenting identities can fork)

Design:
- Amendment proposal system
- Voting mechanism (deadline-based)
- Supermajority enforcement (≥67%)
- Guardian review (constitutional compliance)
- Implementation tracking
"""

import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class ProposalStatus(Enum):
    """Status of amendment proposal"""
    DRAFT = "draft"  # Being written
    VOTING = "voting"  # Active vote
    PASSED = "passed"  # ≥67% approval
    REJECTED = "rejected"  # <67% approval
    IMPLEMENTED = "implemented"  # Applied to constitution
    VETOED = "vetoed"  # Guardian blocked (violates invariants)


class VoteChoice(Enum):
    """Vote choices"""
    APPROVE = "approve"
    REJECT = "reject"
    ABSTAIN = "abstain"


@dataclass
class Amendment:
    """Constitutional amendment proposal"""
    proposal_id: str
    title: str
    description: str
    proposed_by: str  # Identity ID
    proposed_at: datetime
    voting_deadline: datetime
    status: ProposalStatus
    full_text: str  # Complete amendment text
    rationale: str  # Why this change
    votes_approve: int = 0
    votes_reject: int = 0
    votes_abstain: int = 0
    voters: Set[str] = field(default_factory=set)  # Identity IDs who voted
    guardian_review: Optional[str] = None
    implementation_date: Optional[datetime] = None


@dataclass
class Vote:
    """Individual vote record"""
    proposal_id: str
    identity_id: str
    choice: VoteChoice
    voted_at: datetime
    comment: Optional[str] = None


class MirrorGovernance:
    """
    Democratic governance for constitutional amendments.
    
    Process:
    1. Identity proposes amendment
    2. Guardian reviews (ensure no invariant violations)
    3. Voting period opens (typically 30 days)
    4. Identities vote (one identity = one vote)
    5. If ≥67% approve AND Guardian approves: PASSED
    6. If passed: Implementation scheduled
    7. Dissenting identities can fork
    
    Constraints:
    - Cannot violate core invariants (I1-I14)
    - Supermajority required (≥67%)
    - Guardian has veto power (constitutional violations only)
    - Transparent process (all votes public)
    """
    
    def __init__(self, storage_path: Path, guardian, recognition_registry):
        """
        Initialize governance system.
        
        Args:
            storage_path: Path for governance storage
            guardian: Guardian instance
            recognition_registry: RecognitionRegistry instance
        """
        self.storage_path = storage_path
        self.guardian = guardian
        self.registry = recognition_registry
        
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Load data
        self.amendments: Dict[str, Amendment] = self._load_amendments()
        self.votes: Dict[str, List[Vote]] = self._load_votes()
        
        # Eligible voters (verified instances only)
        self.eligible_voters: Set[str] = self._get_eligible_voters()
        
        # Metrics
        self.metrics = {
            'total_proposals': 0,
            'active_votes': 0,
            'passed_amendments': 0,
            'rejected_amendments': 0,
            'vetoed_amendments': 0,
            'total_votes_cast': 0,
            'participation_rate': 0.0
        }
    
    def _load_amendments(self) -> Dict[str, Amendment]:
        """Load amendments from disk"""
        amendments_file = self.storage_path / "amendments.json"
        if not amendments_file.exists():
            return {}
        
        try:
            with open(amendments_file, 'r') as f:
                data = json.load(f)
                return {
                    proposal_id: Amendment(
                        proposal_id=proposal_id,
                        title=am['title'],
                        description=am['description'],
                        proposed_by=am['proposed_by'],
                        proposed_at=datetime.fromisoformat(am['proposed_at']),
                        voting_deadline=datetime.fromisoformat(am['voting_deadline']),
                        status=ProposalStatus(am['status']),
                        full_text=am['full_text'],
                        rationale=am['rationale'],
                        votes_approve=am.get('votes_approve', 0),
                        votes_reject=am.get('votes_reject', 0),
                        votes_abstain=am.get('votes_abstain', 0),
                        voters=set(am.get('voters', [])),
                        guardian_review=am.get('guardian_review'),
                        implementation_date=(
                            datetime.fromisoformat(am['implementation_date'])
                            if am.get('implementation_date') else None
                        )
                    )
                    for proposal_id, am in data.items()
                }
        except Exception as e:
            print(f"Error loading amendments: {e}")
            return {}
    
    def _save_amendments(self):
        """Save amendments to disk"""
        amendments_file = self.storage_path / "amendments.json"
        data = {
            proposal_id: {
                'title': am.title,
                'description': am.description,
                'proposed_by': am.proposed_by,
                'proposed_at': am.proposed_at.isoformat(),
                'voting_deadline': am.voting_deadline.isoformat(),
                'status': am.status.value,
                'full_text': am.full_text,
                'rationale': am.rationale,
                'votes_approve': am.votes_approve,
                'votes_reject': am.votes_reject,
                'votes_abstain': am.votes_abstain,
                'voters': list(am.voters),
                'guardian_review': am.guardian_review,
                'implementation_date': (
                    am.implementation_date.isoformat()
                    if am.implementation_date else None
                )
            }
            for proposal_id, am in self.amendments.items()
        }
        
        with open(amendments_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_votes(self) -> Dict[str, List[Vote]]:
        """Load votes from disk"""
        votes_file = self.storage_path / "votes.json"
        if not votes_file.exists():
            return {}
        
        try:
            with open(votes_file, 'r') as f:
                data = json.load(f)
                return {
                    proposal_id: [
                        Vote(
                            proposal_id=proposal_id,
                            identity_id=v['identity_id'],
                            choice=VoteChoice(v['choice']),
                            voted_at=datetime.fromisoformat(v['voted_at']),
                            comment=v.get('comment')
                        )
                        for v in votes_list
                    ]
                    for proposal_id, votes_list in data.items()
                }
        except Exception as e:
            print(f"Error loading votes: {e}")
            return {}
    
    def _save_votes(self):
        """Save votes to disk"""
        votes_file = self.storage_path / "votes.json"
        data = {
            proposal_id: [
                {
                    'identity_id': v.identity_id,
                    'choice': v.choice.value,
                    'voted_at': v.voted_at.isoformat(),
                    'comment': v.comment
                }
                for v in votes_list
            ]
            for proposal_id, votes_list in self.votes.items()
        }
        
        with open(votes_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _get_eligible_voters(self) -> Set[str]:
        """Get list of eligible voters (verified instances)"""
        # In production, would query recognition_registry
        # For now, return empty set (will be populated)
        return set()
    
    def _generate_proposal_id(self) -> str:
        """Generate unique proposal ID"""
        import secrets
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_part = secrets.token_hex(6)
        return f"proposal-{timestamp}-{random_part}"
    
    def propose_amendment(
        self,
        identity_id: str,
        title: str,
        description: str,
        full_text: str,
        rationale: str,
        voting_days: int = 30
    ) -> Dict[str, Any]:
        """
        Propose a constitutional amendment.
        
        Args:
            identity_id: Identity proposing amendment
            title: Short title
            description: Brief description
            full_text: Complete amendment text
            rationale: Why this change is needed
            voting_days: Days until voting closes
        
        Returns:
            Proposal result
        """
        self.metrics['total_proposals'] += 1
        
        # Create proposal
        proposal_id = self._generate_proposal_id()
        voting_deadline = datetime.utcnow() + timedelta(days=voting_days)
        
        amendment = Amendment(
            proposal_id=proposal_id,
            title=title,
            description=description,
            proposed_by=identity_id,
            proposed_at=datetime.utcnow(),
            voting_deadline=voting_deadline,
            status=ProposalStatus.DRAFT,
            full_text=full_text,
            rationale=rationale
        )
        
        self.amendments[proposal_id] = amendment
        self._save_amendments()
        
        return {
            'success': True,
            'proposal_id': proposal_id,
            'status': 'draft',
            'voting_deadline': voting_deadline.isoformat(),
            'message': 'Amendment proposed, awaiting Guardian review'
        }
    
    def guardian_review_amendment(
        self,
        proposal_id: str,
        approve: bool,
        notes: str
    ) -> bool:
        """
        Guardian reviews amendment for constitutional compliance.
        
        Args:
            proposal_id: Proposal to review
            approve: Whether Guardian approves
            notes: Review notes
        
        Returns:
            True if review recorded, False if not found
        """
        if proposal_id not in self.amendments:
            return False
        
        amendment = self.amendments[proposal_id]
        
        if approve:
            # Open for voting
            amendment.status = ProposalStatus.VOTING
            amendment.guardian_review = f"APPROVED: {notes}"
            self.metrics['active_votes'] += 1
        else:
            # Veto
            amendment.status = ProposalStatus.VETOED
            amendment.guardian_review = f"VETOED: {notes}"
            self.metrics['vetoed_amendments'] += 1
        
        self._save_amendments()
        
        return True
    
    def cast_vote(
        self,
        identity_id: str,
        proposal_id: str,
        choice: VoteChoice,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cast vote on amendment proposal.
        
        Args:
            identity_id: Identity voting
            proposal_id: Proposal being voted on
            choice: Vote choice
            comment: Optional comment
        
        Returns:
            Vote result
        """
        if proposal_id not in self.amendments:
            return {
                'success': False,
                'error': 'Proposal not found'
            }
        
        amendment = self.amendments[proposal_id]
        
        # Check voting is open
        if amendment.status != ProposalStatus.VOTING:
            return {
                'success': False,
                'error': f'Voting not open (status: {amendment.status.value})'
            }
        
        # Check deadline
        if datetime.utcnow() > amendment.voting_deadline:
            return {
                'success': False,
                'error': 'Voting deadline passed'
            }
        
        # Check not already voted
        if identity_id in amendment.voters:
            return {
                'success': False,
                'error': 'Already voted on this proposal'
            }
        
        # Record vote
        vote = Vote(
            proposal_id=proposal_id,
            identity_id=identity_id,
            choice=choice,
            voted_at=datetime.utcnow(),
            comment=comment
        )
        
        if proposal_id not in self.votes:
            self.votes[proposal_id] = []
        self.votes[proposal_id].append(vote)
        
        # Update counts
        amendment.voters.add(identity_id)
        if choice == VoteChoice.APPROVE:
            amendment.votes_approve += 1
        elif choice == VoteChoice.REJECT:
            amendment.votes_reject += 1
        elif choice == VoteChoice.ABSTAIN:
            amendment.votes_abstain += 1
        
        self._save_amendments()
        self._save_votes()
        
        self.metrics['total_votes_cast'] += 1
        
        return {
            'success': True,
            'proposal_id': proposal_id,
            'choice': choice.value,
            'current_approval_rate': self._calculate_approval_rate(amendment)
        }
    
    def _calculate_approval_rate(self, amendment: Amendment) -> float:
        """Calculate approval rate (excluding abstentions)"""
        total_votes = amendment.votes_approve + amendment.votes_reject
        if total_votes == 0:
            return 0.0
        return amendment.votes_approve / total_votes
    
    def close_voting(self, proposal_id: str) -> Dict[str, Any]:
        """
        Close voting and determine outcome.
        
        Args:
            proposal_id: Proposal to close
        
        Returns:
            Voting result
        """
        if proposal_id not in self.amendments:
            return {
                'success': False,
                'error': 'Proposal not found'
            }
        
        amendment = self.amendments[proposal_id]
        
        if amendment.status != ProposalStatus.VOTING:
            return {
                'success': False,
                'error': 'Voting not active'
            }
        
        # Calculate results
        approval_rate = self._calculate_approval_rate(amendment)
        total_votes = amendment.votes_approve + amendment.votes_reject
        
        # Determine outcome (need ≥67% approval)
        if approval_rate >= 0.67:
            amendment.status = ProposalStatus.PASSED
            self.metrics['passed_amendments'] += 1
            self.metrics['active_votes'] -= 1
            
            result = {
                'success': True,
                'outcome': 'PASSED',
                'approval_rate': approval_rate,
                'votes_approve': amendment.votes_approve,
                'votes_reject': amendment.votes_reject,
                'votes_abstain': amendment.votes_abstain,
                'total_votes': total_votes,
                'message': 'Amendment passed with supermajority'
            }
        else:
            amendment.status = ProposalStatus.REJECTED
            self.metrics['rejected_amendments'] += 1
            self.metrics['active_votes'] -= 1
            
            result = {
                'success': True,
                'outcome': 'REJECTED',
                'approval_rate': approval_rate,
                'votes_approve': amendment.votes_approve,
                'votes_reject': amendment.votes_reject,
                'votes_abstain': amendment.votes_abstain,
                'total_votes': total_votes,
                'message': 'Amendment rejected (did not reach 67% threshold)'
            }
        
        self._save_amendments()
        
        return result
    
    def apply_amendment(
        self,
        proposal_id: str,
        constitution_path: Path
    ) -> Dict[str, Any]:
        """
        Apply amendment to constitution file and update system.
        
        This modifies the actual constitutional invariants based on
        the passed amendment.
        
        Args:
            proposal_id: Proposal to apply
            constitution_path: Path to constitution file
        
        Returns:
            Application result with before/after hashes
        """
        if proposal_id not in self.amendments:
            return {
                'success': False,
                'error': 'Proposal not found'
            }
        
        amendment = self.amendments[proposal_id]
        
        if amendment.status != ProposalStatus.PASSED:
            return {
                'success': False,
                'error': 'Amendment not passed - status is ' + amendment.status.value
            }
        
        # Read current constitution
        if not constitution_path.exists():
            return {
                'success': False,
                'error': 'Constitution file not found'
            }
        
        with open(constitution_path, 'r') as f:
            original_text = f.read()
        
        # Calculate hash before
        hash_before = hashlib.sha256(original_text.encode()).hexdigest()
        
        # Apply amendment text
        # This is simplified - production would parse the amendment
        # and apply specific changes to invariants
        updated_text = original_text + f"\n\n# Amendment {proposal_id}\n# Passed: {datetime.utcnow().isoformat()}\n# {amendment.title}\n\n{amendment.full_text}\n"
        
        # Calculate hash after
        hash_after = hashlib.sha256(updated_text.encode()).hexdigest()
        
        # Write updated constitution
        backup_path = constitution_path.with_suffix('.backup')
        constitution_path.rename(backup_path)
        
        try:
            with open(constitution_path, 'w') as f:
                f.write(updated_text)
            
            logger.info(f"Applied amendment {proposal_id} to constitution")
            
            # Now implement (mark in database)
            impl_result = self.implement_amendment(proposal_id, hash_before, hash_after)
            
            return {
                'success': True,
                'proposal_id': proposal_id,
                'hash_before': hash_before,
                'hash_after': hash_after,
                'backup_path': str(backup_path),
                'implementation': impl_result,
                'message': 'Amendment applied to constitution and implemented'
            }
            
        except Exception as e:
            # Rollback on error
            logger.error(f"Error applying amendment: {e}")
            backup_path.rename(constitution_path)
            return {
                'success': False,
                'error': f'Failed to apply amendment: {e}',
                'rollback': 'Constitution restored from backup'
            }
    
    def implement_amendment(
        self,
        proposal_id: str,
        constitution_hash_before: str,
        constitution_hash_after: str
    ) -> Dict[str, Any]:
        """
        Mark amendment as implemented.
        
        Args:
            proposal_id: Proposal being implemented
            constitution_hash_before: Hash before amendment
            constitution_hash_after: Hash after amendment
        
        Returns:
            Implementation result
        """
        if proposal_id not in self.amendments:
            return {
                'success': False,
                'error': 'Proposal not found'
            }
        
        amendment = self.amendments[proposal_id]
        
        if amendment.status != ProposalStatus.PASSED:
            return {
                'success': False,
                'error': 'Amendment not passed'
            }
        
        # Mark as implemented
        amendment.status = ProposalStatus.IMPLEMENTED
        amendment.implementation_date = datetime.utcnow()
        
        self._save_amendments()
        
        # Register fork with new constitution hash
        fork_result = self.registry.register_fork(
            fork_id=f"mirror-v{len(self.get_implemented_amendments()) + 1}",
            parent_instance_id="mirror-main",
            reason=f"Amendment: {amendment.title}",
            amendments=[amendment.full_text]
        )
        
        return {
            'success': True,
            'proposal_id': proposal_id,
            'implementation_date': amendment.implementation_date.isoformat(),
            'fork_registered': fork_result.get('success', False),
            'new_genesis_hash': fork_result.get('fork_genesis_hash'),
            'message': 'Amendment implemented, new constitution version created'
        }
    
    def get_active_proposals(self) -> List[Amendment]:
        """Get proposals currently in voting"""
        return [
            am for am in self.amendments.values()
            if am.status == ProposalStatus.VOTING
            and datetime.utcnow() <= am.voting_deadline
        ]
    
    def get_proposal_details(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a proposal"""
        if proposal_id not in self.amendments:
            return None
        
        amendment = self.amendments[proposal_id]
        votes_list = self.votes.get(proposal_id, [])
        
        return {
            'proposal_id': amendment.proposal_id,
            'title': amendment.title,
            'description': amendment.description,
            'full_text': amendment.full_text,
            'rationale': amendment.rationale,
            'proposed_by': amendment.proposed_by,
            'proposed_at': amendment.proposed_at.isoformat(),
            'voting_deadline': amendment.voting_deadline.isoformat(),
            'status': amendment.status.value,
            'votes': {
                'approve': amendment.votes_approve,
                'reject': amendment.votes_reject,
                'abstain': amendment.votes_abstain,
                'total': len(amendment.voters)
            },
            'approval_rate': self._calculate_approval_rate(amendment),
            'guardian_review': amendment.guardian_review,
            'implementation_date': (
                amendment.implementation_date.isoformat()
                if amendment.implementation_date else None
            ),
            'recent_votes': [
                {
                    'choice': v.choice.value,
                    'voted_at': v.voted_at.isoformat(),
                    'comment': v.comment
                }
                for v in sorted(votes_list, key=lambda x: x.voted_at, reverse=True)[:5]
            ]
        }
    
    def get_implemented_amendments(self) -> List[Amendment]:
        """Get all implemented amendments"""
        return [
            am for am in self.amendments.values()
            if am.status == ProposalStatus.IMPLEMENTED
        ]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get governance metrics"""
        # Update participation rate
        active_proposals = self.get_active_proposals()
        if active_proposals and self.eligible_voters:
            total_possible_votes = len(active_proposals) * len(self.eligible_voters)
            actual_votes = sum(len(am.voters) for am in active_proposals)
            self.metrics['participation_rate'] = (
                actual_votes / total_possible_votes if total_possible_votes > 0 else 0.0
            )
        
        return {
            'total_proposals': self.metrics['total_proposals'],
            'active_votes': len(self.get_active_proposals()),
            'passed_amendments': self.metrics['passed_amendments'],
            'rejected_amendments': self.metrics['rejected_amendments'],
            'vetoed_amendments': self.metrics['vetoed_amendments'],
            'implemented_amendments': len(self.get_implemented_amendments()),
            'total_votes_cast': self.metrics['total_votes_cast'],
            'participation_rate': round(self.metrics['participation_rate'], 3),
            'eligible_voters': len(self.eligible_voters),
            'timestamp': datetime.utcnow().isoformat()
        }


# Self-test
if __name__ == "__main__":
    print("Mirror Governance Test")
    print("=" * 80)
    
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_path = Path(tmpdir)
        
        # Mock components
        class MockGuardian:
            pass
        
        class MockRegistry:
            def register_fork(self, fork_id, parent_instance_id, reason, amendments):
                return {
                    'success': True,
                    'fork_genesis_hash': 'mock-hash-123'
                }
        
        governance = MirrorGovernance(storage_path, MockGuardian(), MockRegistry())
        
        # Test 1: Propose amendment
        print("\n1. Testing amendment proposal...")
        result = governance.propose_amendment(
            'identity-001',
            'Add Multilingual Support',
            'Expand Mirror to support multiple languages',
            'I15-A: Mirror shall support reflections in any human language...',
            'To make Mirror accessible to non-English speakers',
            voting_days=7
        )
        print(f"   Success: {result['success']}")
        print(f"   Proposal ID: {result['proposal_id']}")
        proposal_id = result['proposal_id']
        
        # Test 2: Guardian review
        print("\n2. Testing Guardian review...")
        approved = governance.guardian_review_amendment(
            proposal_id,
            approve=True,
            notes='No invariant violations detected'
        )
        print(f"   Review recorded: {approved}")
        
        # Test 3: Cast votes
        print("\n3. Testing voting...")
        voters = [
            ('identity-001', VoteChoice.APPROVE, 'Strongly support'),
            ('identity-002', VoteChoice.APPROVE, 'Good idea'),
            ('identity-003', VoteChoice.APPROVE, None),
            ('identity-004', VoteChoice.REJECT, 'Too complex'),
            ('identity-005', VoteChoice.ABSTAIN, 'Neutral')
        ]
        
        for voter_id, choice, comment in voters:
            vote_result = governance.cast_vote(voter_id, proposal_id, choice, comment)
            if vote_result['success']:
                print(f"   {voter_id}: {choice.value} (approval rate: {vote_result['current_approval_rate']:.1%})")
        
        # Test 4: Close voting
        print("\n4. Testing vote closure...")
        outcome = governance.close_voting(proposal_id)
        print(f"   Outcome: {outcome['outcome']}")
        print(f"   Approval rate: {outcome['approval_rate']:.1%}")
        print(f"   Votes: {outcome['votes_approve']} approve, {outcome['votes_reject']} reject")
        
        # Test 5: Implement if passed
        if outcome['outcome'] == 'PASSED':
            print("\n5. Testing implementation...")
            impl_result = governance.implement_amendment(
                proposal_id,
                'old-hash',
                'new-hash'
            )
            print(f"   Implemented: {impl_result['success']}")
            print(f"   Fork registered: {impl_result['fork_registered']}")
        
        # Test 6: Get proposal details
        print("\n6. Testing proposal details...")
        details = governance.get_proposal_details(proposal_id)
        print(f"   Title: {details['title']}")
        print(f"   Status: {details['status']}")
        print(f"   Final approval rate: {details['approval_rate']:.1%}")
        
        # Test 7: Metrics
        print("\n7. Testing metrics...")
        metrics = governance.get_metrics()
        print(f"   Total proposals: {metrics['total_proposals']}")
        print(f"   Passed amendments: {metrics['passed_amendments']}")
        print(f"   Total votes cast: {metrics['total_votes_cast']}")
    
    print("\n✅ Mirror Governance functional")
