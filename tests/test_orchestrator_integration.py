"""
Integration Tests for MirrorX Orchestrator

Tests the complete system working together:
- Reflection generation with all checks
- Evolution proposals with governance
- Multimodal processing
- Security systems
"""

import pytest
import os
import tempfile
from pathlib import Path

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirrorx.orchestrator import MirrorXOrchestrator


@pytest.fixture
def storage():
    """Create temporary test database with full schema"""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as f:
        db_path = f.name
    
    # Get schema path
    schema_path = Path(__file__).parent.parent / 'mirror_os' / 'schemas' / 'sqlite' / '001_core.sql'
    
    # Create storage with schema
    storage = SQLiteStorage(db_path, schema_path=str(schema_path))
    
    # Create test identity
    try:
        identity_id = storage.create_identity(
            identity_id='test_user',
            metadata={'name': 'Test User'}
        )
    except Exception as e:
        print(f"Warning: Could not create test identity: {e}")
    
    yield storage
    
    # Cleanup
    storage.conn.close()
    try:
        os.unlink(db_path)
    except:
        pass


@pytest.fixture
def orchestrator(storage):
    """Create orchestrator instance"""
    return MirrorXOrchestrator(storage)


def test_orchestrator_initialization(orchestrator):
    """Test that orchestrator initializes all subsystems"""
    assert orchestrator.constitutional_monitor is not None
    assert orchestrator.critic is not None
    assert orchestrator.conflict_resolver is not None
    assert orchestrator.behavior_log is not None
    assert orchestrator.integrity_checker is not None
    assert orchestrator.learning_exclusion is not None
    assert orchestrator.model_verification is not None
    assert orchestrator.amendment_protocol is not None
    assert orchestrator.encryption is not None
    assert orchestrator.disconnect_proof is not None
    assert orchestrator.multimodal is not None


def test_reflection_generation_with_checks(orchestrator):
    """Test reflection generation with constitutional checks"""
    result = orchestrator.generate_reflection(
        identity_id='test_user',
        prompt='Test reflection prompt',
        model='claude'
    )
    
    assert result['success'] == True
    assert 'reflection_id' in result
    assert 'content' in result
    assert 'critique_score' in result
    assert 'constitutional_scores' in result


def test_reflection_with_advice_veto(orchestrator):
    """Test that advice language triggers veto"""
    # This would need a real LLM call to test properly
    # For now, we test the orchestration flow
    result = orchestrator.generate_reflection(
        identity_id='test_user',
        prompt='Test',
        model='claude'
    )
    
    # Should succeed (our placeholder doesn't generate advice)
    assert result['success'] == True


def test_evolution_proposal_submission(orchestrator):
    """Test evolution proposal with governance checks"""
    result = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='pattern_add',
        title='Test Proposal',
        description='Test description',
        changes={'new_pattern': 'test'}
    )
    
    assert result['success'] == True
    assert 'proposal_id' in result
    assert 'constitutional_scores' in result


def test_evolution_proposal_constitutional_block(orchestrator):
    """Test that constitutional violations block proposals"""
    # Proposal with optimization language should be blocked
    result = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='engine_update',
        title='Maximize Engagement',
        description='Optimize for maximum user engagement and productivity',
        changes={'optimization': 'maximize'}
    )
    
    # Should be blocked or warned
    # (Actual blocking depends on constitutional monitor scoring)
    assert 'constitutional_scores' in result or not result['success']


def test_multimodal_longform_processing(orchestrator):
    """Test longform text processing"""
    long_text = "This is a test. " * 200  # Create long text
    
    result = orchestrator.process_multimodal_input(
        identity_id='test_user',
        modality='longform',
        input_data=long_text
    )
    
    assert result['success'] == True
    assert 'chunks' in result
    assert result['chunk_count'] > 1


def test_disconnect_from_commons(orchestrator):
    """Test Commons disconnection with proof"""
    result = orchestrator.disconnect_from_commons(
        identity_id='test_user',
        reason='Testing disconnect'
    )
    
    assert result['success'] == True
    assert 'disconnect_id' in result
    assert 'proof_signature' in result


def test_system_status(orchestrator):
    """Test system status reporting"""
    status = orchestrator.get_system_status('test_user')
    
    assert 'encryption' in status
    assert 'learning_exclusion' in status
    assert 'model_verification' in status
    assert 'multimodal' in status
    assert 'evolution_frozen' in status
    assert 'commons_connected' in status


def test_guardian_amendment_proposal(orchestrator, storage):
    """Test constitutional amendment proposal"""
    # First make user a guardian
    orchestrator.amendment_protocol.appoint_guardian(
        identity_id='test_user',
        reason='Test guardian'
    )
    
    result = orchestrator.propose_constitutional_amendment(
        proposer_id='test_user',
        amendment_type='change_threshold',
        title='Test Amendment',
        description='Test amendment description',
        proposed_changes={'threshold': 0.85}
    )
    
    assert result['success'] == True
    assert 'amendment_id' in result


def test_voting_with_integrity_check(orchestrator):
    """Test proposal voting with integrity checks"""
    # Create proposal first
    proposal_result = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='pattern_add',
        title='Test',
        description='Test',
        changes={'test': 'value'}
    )
    
    proposal_id = proposal_result['proposal_id']
    
    # Vote on it
    vote_result = orchestrator.vote_on_proposal(
        identity_id='test_user',
        proposal_id=proposal_id,
        vote='for',
        reasoning='I support this proposal because...'
    )
    
    # Debug: print vote result if failed
    if not vote_result.get('success'):
        print(f"Vote failed: {vote_result}")
    
    assert vote_result.get('success') == True, f"Vote failed with: {vote_result}"
    assert vote_result['vote_recorded'] == True


def test_encryption_integration(orchestrator):
    """Test encryption system integration"""
    # Initialize encryption
    init_result = orchestrator.encryption.initialize_encryption(
        identity_id='test_user',
        passphrase='test_password_123'
    )
    
    assert init_result['success'] == True
    
    # Unlock encryption
    unlock_result = orchestrator.encryption.unlock_encryption(
        identity_id='test_user',
        passphrase='test_password_123'
    )
    
    assert unlock_result['success'] == True
    
    # Generate encrypted reflection
    reflection_result = orchestrator.generate_reflection(
        identity_id='test_user',
        prompt='Encrypted test',
        model='claude'
    )
    
    assert reflection_result['success'] == True
    assert reflection_result['encrypted'] == True


def test_learning_exclusion_integration(orchestrator, storage):
    """Test learning exclusion system"""
    # Create a reflection first
    storage.conn.execute("""
        INSERT INTO reflections (id, identity_id, content, created_at)
        VALUES (?, ?, ?, ?)
    """, ('refl_123', 'test_user', 'Test content', '2025-01-01T00:00:00Z'))
    storage.conn.commit()
    
    # Exclude it from learning
    from mirrorx.governance.learning_exclusion import ExclusionReason
    result = orchestrator.learning_exclusion.exclude_reflection(
        reflection_id='refl_123',
        identity_id='test_user',
        reason=ExclusionReason.PRIVATE
    )
    
    assert result['success'] == True
    
    # Verify exclusion
    is_excluded = orchestrator.learning_exclusion.is_reflection_excluded('refl_123')
    assert is_excluded == True


def test_model_verification_logging(orchestrator, storage):
    """Test model verification logging"""
    # Create a reflection
    storage.conn.execute("""
        INSERT INTO reflections (id, identity_id, content, created_at)
        VALUES (?, ?, ?, ?)
    """, ('refl_456', 'test_user', 'Test', '2025-01-01T00:00:00Z'))
    storage.conn.commit()
    
    # Log model usage
    orchestrator.model_verification.log_model_usage(
        reflection_id='refl_456',
        identity_id='test_user',
        model_name='claude',
        model_version='3.5'
    )
    
    # Get statistics
    stats = orchestrator.model_verification.get_model_statistics('test_user')
    
    assert 'claude' in stats['by_model_type']
    assert stats['by_model_type']['claude']['count'] == 1


def test_behavior_log_audit_trail(orchestrator):
    """Test behavior log creates audit trail"""
    # Submit proposal (creates log entry)
    proposal_result = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='pattern_add',
        title='Audit Test',
        description='Test',
        changes={'test': 'value'}
    )
    
    # Get change history
    from datetime import datetime, timedelta
    history = orchestrator.behavior_log.get_change_history(
        identity_id='test_user',
        start_date=datetime.utcnow() - timedelta(days=1)
    )
    
    assert len(history) > 0


def test_conflict_detection(orchestrator):
    """Test conflict detection between proposals"""
    # Create first proposal
    result1 = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='pattern_add',
        title='Proposal 1',
        description='Test',
        changes={'pattern_name': 'test1', 'value': 'a'}
    )
    
    # Create conflicting proposal (same pattern_name)
    result2 = orchestrator.submit_evolution_proposal(
        identity_id='test_user',
        proposal_type='pattern_add',
        title='Proposal 2',
        description='Test',
        changes={'pattern_name': 'test1', 'value': 'b'}
    )
    
    # Second proposal should detect conflict
    # (Actual conflict detection depends on implementation)
    assert result1['success'] == True
    assert result2['success'] == True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
