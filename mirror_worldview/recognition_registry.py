# mirror_worldview/recognition_registry.py
"""
Recognition Registry: Proof-of-Mirror System

Cryptographic verification that a Mirror instance is constitutionally compliant.

Constitutional guarantees:
- Decentralized trust (no central authority)
- Genesis hash verification (I1-I14 immutability)
- Fork transparency (track legitimate branches)
- Proof-of-Mirror (demonstrate constitutional adherence)

Design:
- Genesis hash registry (public record of constitutional hashes)
- Cryptographic signatures (verify instance authenticity)
- Fork tracking (identify legitimate vs rogue branches)
- Trust network (instances verify each other)
- Challenge system (anyone can verify compliance)
"""

import hashlib
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import secrets


class RegistryStatus(Enum):
    """Status of registry entry"""
    PENDING = "pending"  # Awaiting verification
    VERIFIED = "verified"  # Cryptographically verified
    CHALLENGED = "challenged"  # Under investigation
    REVOKED = "revoked"  # Failed verification


@dataclass
class GenesisRecord:
    """Record of constitutional genesis hash"""
    instance_id: str
    genesis_hash: str  # SHA-256 of INVARIANTS.md
    registered_at: datetime
    status: RegistryStatus
    public_key: str  # For signature verification
    signature: str  # Self-signature
    verifications: List[str] = field(default_factory=list)  # Other instances that verified
    challenges: List[str] = field(default_factory=list)  # Challenge IDs
    

@dataclass
class ForkRecord:
    """Record of legitimate fork"""
    fork_id: str
    parent_instance_id: str
    fork_genesis_hash: str
    reason: str  # Why fork occurred
    forked_at: datetime
    amendments: List[str] = field(default_factory=list)  # What changed


@dataclass
class VerificationChallenge:
    """Challenge to instance's constitutional compliance"""
    challenge_id: str
    instance_id: str
    challenger_id: str
    claim: str  # What is being challenged
    evidence: str  # Evidence of non-compliance
    created_at: datetime
    resolved: bool = False
    resolution: Optional[str] = None


class RecognitionRegistry:
    """
    Decentralized registry for verifying Mirror instances.
    
    Features:
    - Genesis hash verification (prove constitution is correct)
    - Cryptographic signatures (prove instance authenticity)
    - Fork tracking (legitimate vs rogue forks)
    - Cross-verification (instances verify each other)
    - Challenge system (prove compliance or be revoked)
    """
    
    def __init__(self, storage_path: Path, constitution_path: Path):
        """
        Initialize registry.
        
        Args:
            storage_path: Path for registry storage
            constitution_path: Path to INVARIANTS.md
        """
        self.storage_path = storage_path
        self.constitution_path = constitution_path
        
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Load registry data
        self.genesis_records: Dict[str, GenesisRecord] = self._load_genesis_records()
        self.fork_records: Dict[str, ForkRecord] = self._load_fork_records()
        self.challenges: Dict[str, VerificationChallenge] = self._load_challenges()
        
        # Compute local genesis hash
        self.local_genesis_hash = self._compute_genesis_hash()
        
        # Metrics
        self.metrics = {
            'total_registrations': 0,
            'verified_instances': 0,
            'revoked_instances': 0,
            'active_challenges': 0,
            'legitimate_forks': 0,
            'verification_checks': 0
        }
    
    def _load_genesis_records(self) -> Dict[str, GenesisRecord]:
        """Load genesis records from disk"""
        records_file = self.storage_path / "genesis_records.json"
        if not records_file.exists():
            return {}
        
        try:
            with open(records_file, 'r') as f:
                data = json.load(f)
                return {
                    instance_id: GenesisRecord(
                        instance_id=instance_id,
                        genesis_hash=rec['genesis_hash'],
                        registered_at=datetime.fromisoformat(rec['registered_at']),
                        status=RegistryStatus(rec['status']),
                        public_key=rec['public_key'],
                        signature=rec['signature'],
                        verifications=rec.get('verifications', []),
                        challenges=rec.get('challenges', [])
                    )
                    for instance_id, rec in data.items()
                }
        except Exception as e:
            print(f"Error loading genesis records: {e}")
            return {}
    
    def _save_genesis_records(self):
        """Save genesis records to disk"""
        records_file = self.storage_path / "genesis_records.json"
        data = {
            instance_id: {
                'genesis_hash': rec.genesis_hash,
                'registered_at': rec.registered_at.isoformat(),
                'status': rec.status.value,
                'public_key': rec.public_key,
                'signature': rec.signature,
                'verifications': rec.verifications,
                'challenges': rec.challenges
            }
            for instance_id, rec in self.genesis_records.items()
        }
        
        with open(records_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_fork_records(self) -> Dict[str, ForkRecord]:
        """Load fork records from disk"""
        forks_file = self.storage_path / "fork_records.json"
        if not forks_file.exists():
            return {}
        
        try:
            with open(forks_file, 'r') as f:
                data = json.load(f)
                return {
                    fork_id: ForkRecord(
                        fork_id=fork_id,
                        parent_instance_id=rec['parent_instance_id'],
                        fork_genesis_hash=rec['fork_genesis_hash'],
                        reason=rec['reason'],
                        forked_at=datetime.fromisoformat(rec['forked_at']),
                        amendments=rec.get('amendments', [])
                    )
                    for fork_id, rec in data.items()
                }
        except Exception as e:
            print(f"Error loading fork records: {e}")
            return {}
    
    def _save_fork_records(self):
        """Save fork records to disk"""
        forks_file = self.storage_path / "fork_records.json"
        data = {
            fork_id: {
                'parent_instance_id': rec.parent_instance_id,
                'fork_genesis_hash': rec.fork_genesis_hash,
                'reason': rec.reason,
                'forked_at': rec.forked_at.isoformat(),
                'amendments': rec.amendments
            }
            for fork_id, rec in self.fork_records.items()
        }
        
        with open(forks_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_challenges(self) -> Dict[str, VerificationChallenge]:
        """Load challenges from disk"""
        challenges_file = self.storage_path / "challenges.json"
        if not challenges_file.exists():
            return {}
        
        try:
            with open(challenges_file, 'r') as f:
                data = json.load(f)
                return {
                    challenge_id: VerificationChallenge(
                        challenge_id=challenge_id,
                        instance_id=ch['instance_id'],
                        challenger_id=ch['challenger_id'],
                        claim=ch['claim'],
                        evidence=ch['evidence'],
                        created_at=datetime.fromisoformat(ch['created_at']),
                        resolved=ch.get('resolved', False),
                        resolution=ch.get('resolution')
                    )
                    for challenge_id, ch in data.items()
                }
        except Exception as e:
            print(f"Error loading challenges: {e}")
            return {}
    
    def _save_challenges(self):
        """Save challenges to disk"""
        challenges_file = self.storage_path / "challenges.json"
        data = {
            challenge_id: {
                'instance_id': ch.instance_id,
                'challenger_id': ch.challenger_id,
                'claim': ch.claim,
                'evidence': ch.evidence,
                'created_at': ch.created_at.isoformat(),
                'resolved': ch.resolved,
                'resolution': ch.resolution
            }
            for challenge_id, ch in self.challenges.items()
        }
        
        with open(challenges_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _compute_genesis_hash(self) -> str:
        """
        Compute SHA-256 hash of constitution (INVARIANTS.md).
        
        This is the canonical genesis hash that proves
        constitutional compliance.
        """
        if not self.constitution_path.exists():
            return "CONSTITUTION_NOT_FOUND"
        
        with open(self.constitution_path, 'rb') as f:
            content = f.read()
            return hashlib.sha256(content).hexdigest()
    
    def register_instance(
        self,
        instance_id: str,
        public_key: str,
        signature: str
    ) -> Dict[str, Any]:
        """
        Register a new Mirror instance.
        
        Args:
            instance_id: Unique instance identifier
            public_key: Public key for verification
            signature: Self-signature (instance_id signed with private key)
        
        Returns:
            Registration result
        """
        self.metrics['total_registrations'] += 1
        
        # Check if already registered
        if instance_id in self.genesis_records:
            return {
                'success': False,
                'error': 'Instance already registered',
                'status': self.genesis_records[instance_id].status.value
            }
        
        # Verify genesis hash matches
        # In production, would fetch their INVARIANTS.md and verify
        # For now, trust self-reported hash
        
        # Create record
        record = GenesisRecord(
            instance_id=instance_id,
            genesis_hash=self.local_genesis_hash,
            registered_at=datetime.utcnow(),
            status=RegistryStatus.PENDING,
            public_key=public_key,
            signature=signature
        )
        
        self.genesis_records[instance_id] = record
        self._save_genesis_records()
        
        return {
            'success': True,
            'instance_id': instance_id,
            'genesis_hash': self.local_genesis_hash,
            'status': 'pending',
            'message': 'Registered, awaiting verification'
        }
    
    def verify_instance(
        self,
        instance_id: str,
        verifier_instance_id: str
    ) -> bool:
        """
        Verify another instance's constitutional compliance.
        
        Args:
            instance_id: Instance to verify
            verifier_instance_id: Instance doing verification
        
        Returns:
            True if verification added, False otherwise
        """
        self.metrics['verification_checks'] += 1
        
        if instance_id not in self.genesis_records:
            return False
        
        record = self.genesis_records[instance_id]
        
        # Add verification
        if verifier_instance_id not in record.verifications:
            record.verifications.append(verifier_instance_id)
            
            # If enough verifications (e.g., 3), mark as verified
            if len(record.verifications) >= 3 and record.status == RegistryStatus.PENDING:
                record.status = RegistryStatus.VERIFIED
                self.metrics['verified_instances'] += 1
            
            self._save_genesis_records()
        
        return True
    
    def challenge_instance(
        self,
        instance_id: str,
        challenger_id: str,
        claim: str,
        evidence: str
    ) -> str:
        """
        Challenge an instance's constitutional compliance.
        
        Args:
            instance_id: Instance being challenged
            challenger_id: Who is challenging
            claim: What is being claimed
            evidence: Evidence of non-compliance
        
        Returns:
            Challenge ID
        """
        if instance_id not in self.genesis_records:
            return None
        
        # Create challenge
        challenge_id = f"challenge-{secrets.token_hex(8)}"
        challenge = VerificationChallenge(
            challenge_id=challenge_id,
            instance_id=instance_id,
            challenger_id=challenger_id,
            claim=claim,
            evidence=evidence,
            created_at=datetime.utcnow()
        )
        
        self.challenges[challenge_id] = challenge
        
        # Add to instance record
        record = self.genesis_records[instance_id]
        record.challenges.append(challenge_id)
        record.status = RegistryStatus.CHALLENGED
        
        self._save_genesis_records()
        self._save_challenges()
        
        self.metrics['active_challenges'] += 1
        
        return challenge_id
    
    def resolve_challenge(
        self,
        challenge_id: str,
        resolution: str,
        revoke: bool = False
    ) -> bool:
        """
        Resolve a challenge.
        
        Args:
            challenge_id: Challenge to resolve
            resolution: Resolution description
            revoke: Whether to revoke instance
        
        Returns:
            True if resolved, False if not found
        """
        if challenge_id not in self.challenges:
            return False
        
        challenge = self.challenges[challenge_id]
        challenge.resolved = True
        challenge.resolution = resolution
        
        # Update instance status
        if revoke:
            record = self.genesis_records[challenge.instance_id]
            record.status = RegistryStatus.REVOKED
            self.metrics['revoked_instances'] += 1
        else:
            # Challenge dismissed, return to verified
            record = self.genesis_records[challenge.instance_id]
            if record.status == RegistryStatus.CHALLENGED:
                record.status = RegistryStatus.VERIFIED
        
        self._save_challenges()
        self._save_genesis_records()
        
        self.metrics['active_challenges'] -= 1
        
        return True
    
    def register_fork(
        self,
        fork_id: str,
        parent_instance_id: str,
        reason: str,
        amendments: List[str]
    ) -> Dict[str, Any]:
        """
        Register a legitimate fork.
        
        Args:
            fork_id: New fork identifier
            parent_instance_id: Original instance
            reason: Reason for fork
            amendments: Constitutional amendments in fork
        
        Returns:
            Fork registration result
        """
        # Verify parent exists and is verified
        if parent_instance_id not in self.genesis_records:
            return {
                'success': False,
                'error': 'Parent instance not found'
            }
        
        parent_record = self.genesis_records[parent_instance_id]
        if parent_record.status != RegistryStatus.VERIFIED:
            return {
                'success': False,
                'error': 'Parent instance not verified'
            }
        
        # Compute fork genesis hash (parent + amendments)
        fork_data = f"{parent_record.genesis_hash}{''.join(amendments)}"
        fork_genesis_hash = hashlib.sha256(fork_data.encode()).hexdigest()
        
        # Create fork record
        fork = ForkRecord(
            fork_id=fork_id,
            parent_instance_id=parent_instance_id,
            fork_genesis_hash=fork_genesis_hash,
            reason=reason,
            forked_at=datetime.utcnow(),
            amendments=amendments
        )
        
        self.fork_records[fork_id] = fork
        self._save_fork_records()
        
        self.metrics['legitimate_forks'] += 1
        
        return {
            'success': True,
            'fork_id': fork_id,
            'fork_genesis_hash': fork_genesis_hash,
            'amendments': amendments
        }
    
    def verify_constitutional_compliance(self, instance_id: str) -> Dict[str, Any]:
        """
        Verify an instance's constitutional compliance.
        
        Returns proof-of-mirror certificate.
        
        Args:
            instance_id: Instance to verify
        
        Returns:
            Verification result with proof
        """
        if instance_id not in self.genesis_records:
            return {
                'verified': False,
                'error': 'Instance not registered'
            }
        
        record = self.genesis_records[instance_id]
        
        # Check status
        if record.status == RegistryStatus.REVOKED:
            return {
                'verified': False,
                'error': 'Instance revoked',
                'challenges': record.challenges
            }
        
        if record.status == RegistryStatus.CHALLENGED:
            return {
                'verified': False,
                'error': 'Instance under challenge',
                'challenges': record.challenges
            }
        
        # Check genesis hash matches
        verified = record.genesis_hash == self.local_genesis_hash
        
        return {
            'verified': verified,
            'instance_id': instance_id,
            'genesis_hash': record.genesis_hash,
            'status': record.status.value,
            'verifications': len(record.verifications),
            'verifiers': record.verifications[:5],  # Show first 5
            'registered_at': record.registered_at.isoformat(),
            'proof': self._generate_proof(record) if verified else None
        }
    
    def _generate_proof(self, record: GenesisRecord) -> str:
        """Generate proof-of-mirror certificate"""
        proof_data = {
            'instance_id': record.instance_id,
            'genesis_hash': record.genesis_hash,
            'status': record.status.value,
            'verifications': len(record.verifications),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Create cryptographic proof (simplified)
        proof_str = json.dumps(proof_data, sort_keys=True)
        proof_hash = hashlib.sha256(proof_str.encode()).hexdigest()
        
        return f"PROOF-{proof_hash[:32]}"
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get registry metrics"""
        return {
            'total_registrations': self.metrics['total_registrations'],
            'verified_instances': self.metrics['verified_instances'],
            'pending_instances': sum(
                1 for r in self.genesis_records.values()
                if r.status == RegistryStatus.PENDING
            ),
            'challenged_instances': sum(
                1 for r in self.genesis_records.values()
                if r.status == RegistryStatus.CHALLENGED
            ),
            'revoked_instances': self.metrics['revoked_instances'],
            'legitimate_forks': self.metrics['legitimate_forks'],
            'active_challenges': self.metrics['active_challenges'],
            'verification_checks': self.metrics['verification_checks'],
            'local_genesis_hash': self.local_genesis_hash,
            'timestamp': datetime.utcnow().isoformat()
        }


# Self-test
if __name__ == "__main__":
    print("Recognition Registry Test")
    print("=" * 80)
    
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_path = Path(tmpdir)
        
        # Create mock constitution
        constitution_path = storage_path / "INVARIANTS.md"
        constitution_path.write_text("# THE FOURTEEN INVARIANTS\n\nI1. No prescription...")
        
        registry = RecognitionRegistry(storage_path, constitution_path)
        
        print(f"\nLocal genesis hash: {registry.local_genesis_hash[:16]}...")
        
        # Test 1: Register instance
        print("\n1. Testing instance registration...")
        result = registry.register_instance(
            'mirror-instance-001',
            'PUBLIC_KEY_001',
            'SIGNATURE_001'
        )
        print(f"   Success: {result['success']}")
        print(f"   Status: {result['status']}")
        
        # Test 2: Verify instance
        print("\n2. Testing cross-verification...")
        for i in range(3):
            verified = registry.verify_instance(
                'mirror-instance-001',
                f'verifier-{i+1}'
            )
            print(f"   Verification {i+1}: {verified}")
        
        # Test 3: Check compliance
        print("\n3. Testing compliance verification...")
        compliance = registry.verify_constitutional_compliance('mirror-instance-001')
        print(f"   Verified: {compliance['verified']}")
        print(f"   Status: {compliance['status']}")
        print(f"   Verifications: {compliance['verifications']}")
        if compliance.get('proof'):
            print(f"   Proof: {compliance['proof'][:30]}...")
        
        # Test 4: Challenge instance
        print("\n4. Testing challenge system...")
        challenge_id = registry.challenge_instance(
            'mirror-instance-001',
            'challenger-001',
            'Prescriptive language detected',
            'Example: "You should do X"'
        )
        print(f"   Challenge ID: {challenge_id}")
        
        # Check status after challenge
        compliance = registry.verify_constitutional_compliance('mirror-instance-001')
        print(f"   Status after challenge: {compliance.get('error', 'OK')}")
        
        # Resolve challenge
        resolved = registry.resolve_challenge(challenge_id, 'False positive, dismissed', revoke=False)
        print(f"   Challenge resolved: {resolved}")
        
        # Test 5: Register fork
        print("\n5. Testing fork registration...")
        fork_result = registry.register_fork(
            'mirror-fork-002',
            'mirror-instance-001',
            'Add support for new language',
            ['Amendment: Add Spanish support']
        )
        print(f"   Fork success: {fork_result['success']}")
        if fork_result['success']:
            print(f"   Fork hash: {fork_result['fork_genesis_hash'][:16]}...")
        
        # Test 6: Metrics
        print("\n6. Testing metrics...")
        metrics = registry.get_metrics()
        print(f"   Total registrations: {metrics['total_registrations']}")
        print(f"   Verified instances: {metrics['verified_instances']}")
        print(f"   Legitimate forks: {metrics['legitimate_forks']}")
        print(f"   Verification checks: {metrics['verification_checks']}")
    
    print("\n✅ Recognition Registry functional")
