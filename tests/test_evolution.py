"""
Evolution System Tests - Verify proposal lifecycle, voting, and version management

Tests the complete evolution system including:
- Proposal creation and activation
- Vote casting and weight calculation
- Consensus threshold
- Version creation and rollout
- Commons sync (mocked)
"""

import pytest
from pathlib import Path
from datetime import datetime, timedelta

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.services.evolution_engine import (
    EvolutionEngine, ProposalType, ProposalStatus, VoteChoice
)
from mirror_os.services.commons_sync import CommonsSync


@pytest.fixture
def storage():
    """Create in-memory storage for testing"""
    test_dir = Path(__file__).parent
    schema_path = test_dir.parent / "mirror_os" / "schemas" / "sqlite" / "001_core.sql"
    db = SQLiteStorage(":memory:", schema_path=str(schema_path))
    yield db
    db.close()


@pytest.fixture
def engine(storage):
    """Create evolution engine"""
    return EvolutionEngine(storage)


@pytest.fixture
def commons_sync(storage, engine):
    """Create commons sync"""
    return CommonsSync(storage, engine)


@pytest.fixture
def sample_identity(storage):
    """Create a sample identity with reflections"""
    identity_id = storage.create_identity(metadata={"name": "Test User"})
    
    # Create some reflections to give vote weight
    for i in range(5):
        storage.create_reflection(
            content=f"Test reflection {i+1}",
            identity_id=identity_id
        )
    
    return identity_id


def test_create_proposal(engine, sample_identity):
    """Test: Create evolution proposal"""
    proposal = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_ADD,
        title="Add 'Growth Mindset' Pattern",
        description="Pattern for recognizing growth-oriented thinking and learning from failures",
        content={
            "pattern_name": "Growth Mindset",
            "description": "Embracing challenges and learning from setbacks",
            "indicators": ["learning", "challenge", "growth", "failure as feedback"]
        },
        proposer_identity_id=sample_identity,
        metadata={"category": "mindset"}
    )
    
    assert proposal.id is not None
    assert proposal.type == ProposalType.PATTERN_ADD
    assert proposal.status == ProposalStatus.DRAFT
    assert proposal.title == "Add 'Growth Mindset' Pattern"
    assert proposal.votes_for == 0
    assert proposal.total_vote_weight == 0.0


def test_activate_proposal(engine, sample_identity):
    """Test: Activate proposal for voting"""
    proposal = engine.create_proposal(
        proposal_type=ProposalType.TENSION_ADD,
        title="Add 'Action vs Reflection' Tension",
        description="Tension between taking action and taking time to reflect",
        content={"axis_a": "Action", "axis_b": "Reflection"},
        proposer_identity_id=sample_identity
    )
    
    # Activate
    success = engine.activate_proposal(proposal.id)
    assert success is True
    
    # Verify status changed
    updated = engine.get_proposal(proposal.id)
    assert updated.status == ProposalStatus.ACTIVE
    assert updated.is_voting_open() is True


def test_cast_vote(engine, storage, sample_identity):
    """Test: Cast vote on proposal"""
    # Create and activate proposal
    proposal = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_ADD,
        title="Test Proposal",
        description="This is a test proposal for voting",
        content={"test": "data"},
        proposer_identity_id=sample_identity
    )
    engine.activate_proposal(proposal.id)
    
    # Create another identity to vote
    voter_id = storage.create_identity(metadata={"name": "Voter"})
    storage.create_reflection(content="Voter reflection", identity_id=voter_id)
    
    # Cast vote
    success, message = engine.cast_vote(
        proposal_id=proposal.id,
        identity_id=voter_id,
        choice=VoteChoice.FOR,
        reasoning="I support this proposal"
    )
    
    assert success is True
    assert "successfully" in message.lower()
    
    # Verify vote recorded
    updated = engine.get_proposal(proposal.id)
    assert updated.votes_for > 0
    assert updated.total_vote_weight > 0


def test_vote_weight_calculation(engine, storage):
    """Test: Vote weight based on activity"""
    # Create identity with many reflections
    active_id = storage.create_identity(metadata={"name": "Active User"})
    for i in range(20):
        storage.create_reflection(content=f"Reflection {i}", identity_id=active_id)
    
    # Create identity with few reflections
    casual_id = storage.create_identity(metadata={"name": "Casual User"})
    storage.create_reflection(content="One reflection", identity_id=casual_id)
    
    # Calculate weights
    active_weight = engine._calculate_vote_weight(active_id)
    casual_weight = engine._calculate_vote_weight(casual_id)
    
    # Active user should have more weight
    assert active_weight > casual_weight
    assert active_weight <= 1.0
    assert casual_weight >= 0.1


def test_consensus_threshold(engine, storage, sample_identity):
    """Test: Proposal reaches consensus threshold"""
    # Create proposal
    proposal = engine.create_proposal(
        proposal_type=ProposalType.CONSTITUTIONAL_ADD,
        title="Add New Constitutional Rule",
        description="Proposal for new constitutional principle",
        content={"rule": "Test rule", "category": "test"},
        proposer_identity_id=sample_identity
    )
    engine.activate_proposal(proposal.id)
    
    # Create multiple voters
    voters = []
    for i in range(10):
        voter_id = storage.create_identity(metadata={"name": f"Voter {i}"})
        # Give them reflections
        for j in range(3):
            storage.create_reflection(content=f"Reflection {j}", identity_id=voter_id)
        voters.append(voter_id)
    
    # Cast majority votes FOR
    for voter_id in voters[:7]:  # 70% vote for
        engine.cast_vote(proposal.id, voter_id, VoteChoice.FOR)
    
    # Cast minority votes AGAINST
    for voter_id in voters[7:]:  # 30% vote against
        engine.cast_vote(proposal.id, voter_id, VoteChoice.AGAINST)
    
    # Check consensus
    updated = engine.get_proposal(proposal.id)
    assert updated.get_vote_percentage() >= 0.67  # 67% threshold
    assert updated.has_reached_consensus() is True


def test_cannot_vote_twice(engine, storage, sample_identity):
    """Test: Cannot vote twice on same proposal"""
    proposal = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_MODIFY,
        title="Modify Existing Pattern",
        description="Update pattern definition",
        content={"pattern_id": "123", "changes": "..."},
        proposer_identity_id=sample_identity
    )
    engine.activate_proposal(proposal.id)
    
    voter_id = storage.create_identity(metadata={"name": "Voter"})
    storage.create_reflection(content="Reflection", identity_id=voter_id)
    
    # First vote
    success1, _ = engine.cast_vote(proposal.id, voter_id, VoteChoice.FOR)
    assert success1 is True
    
    # Second vote (should fail)
    success2, message = engine.cast_vote(proposal.id, voter_id, VoteChoice.AGAINST)
    assert success2 is False
    assert "already voted" in message.lower()


def test_voting_period_ends(engine, sample_identity):
    """Test: Voting period enforcement"""
    # Create proposal with past end date
    proposal = engine.create_proposal(
        proposal_type=ProposalType.ENGINE_UPDATE,
        title="Engine Update",
        description="Update to engine behavior",
        content={"update": "details"},
        proposer_identity_id=sample_identity
    )
    
    # Manually set voting_ends_at to past
    engine.storage.conn.execute(
        "UPDATE evolution_proposals SET voting_ends_at = ? WHERE id = ?",
        ((datetime.utcnow() - timedelta(days=1)).isoformat() + 'Z', proposal.id)
    )
    engine.storage.conn.commit()
    
    # Try to vote (should fail)
    success, message = engine.cast_vote(proposal.id, sample_identity, VoteChoice.FOR)
    assert success is False
    assert "closed" in message.lower()


def test_list_proposals(engine, sample_identity):
    """Test: List proposals with filtering"""
    # Create multiple proposals
    for i in range(5):
        proposal = engine.create_proposal(
            proposal_type=ProposalType.PATTERN_ADD,
            title=f"Proposal {i+1}",
            description=f"Description {i+1}",
            content={"index": i},
            proposer_identity_id=sample_identity
        )
        if i % 2 == 0:
            engine.activate_proposal(proposal.id)
    
    # List all
    all_proposals = engine.list_proposals(limit=10)
    assert len(all_proposals) == 5
    
    # List active only
    active_proposals = engine.list_proposals(status=ProposalStatus.ACTIVE, limit=10)
    assert len(active_proposals) == 3  # 0, 2, 4


def test_create_version(engine, storage, sample_identity):
    """Test: Create evolution version"""
    # Create and approve proposals
    proposal1 = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_ADD,
        title="Pattern 1",
        description="First pattern",
        content={"name": "Pattern 1"},
        proposer_identity_id=sample_identity
    )
    
    proposal2 = engine.create_proposal(
        proposal_type=ProposalType.TENSION_ADD,
        title="Tension 1",
        description="First tension",
        content={"name": "Tension 1"},
        proposer_identity_id=sample_identity
    )
    
    # Mark as approved
    engine.storage.conn.execute(
        "UPDATE evolution_proposals SET status = ? WHERE id IN (?, ?)",
        (ProposalStatus.APPROVED.value, proposal1.id, proposal2.id)
    )
    engine.storage.conn.commit()
    
    # Create version
    version = engine.create_version(
        version_number="2.0.0",
        description="Major update with new patterns and tensions",
        approved_proposals=[proposal1.id, proposal2.id]
    )
    
    assert version.id is not None
    assert version.version_number == "2.0.0"
    assert len(version.approved_proposals) == 2
    assert version.rollout_percentage == 0
    assert version.is_active is False


def test_version_rollout(engine, storage, sample_identity):
    """Test: Gradual version rollout"""
    # Create version
    proposal = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_ADD,
        title="Test",
        description="Test",
        content={},
        proposer_identity_id=sample_identity
    )
    
    version = engine.create_version(
        version_number="1.1.0",
        description="Minor update",
        approved_proposals=[proposal.id]
    )
    
    # Roll out to 10%
    success1 = engine.rollout_version(version.id, 10)
    assert success1 is True
    
    # Roll out to 50%
    success2 = engine.rollout_version(version.id, 50)
    assert success2 is True
    
    # Roll out to 100%
    success3 = engine.rollout_version(version.id, 100)
    assert success3 is True
    
    # Verify it's active
    active = engine.get_active_version()
    assert active is not None
    assert active.version_number == "1.1.0"
    assert active.is_active is True


def test_commons_sync_broadcast(commons_sync, engine, sample_identity):
    """Test: Broadcast proposal to commons"""
    proposal = engine.create_proposal(
        proposal_type=ProposalType.PATTERN_ADD,
        title="Commons Proposal",
        description="Proposal to broadcast",
        content={"test": "data"},
        proposer_identity_id=sample_identity
    )
    
    result = commons_sync.broadcast_proposal(proposal.id)
    
    assert result["status"] == "success"
    assert "broadcast_id" in result
    assert result["proposal_id"] == proposal.id


def test_commons_sync_status(commons_sync):
    """Test: Get sync status"""
    status = commons_sync.get_sync_status()
    
    assert "enabled" in status
    assert "mirror_id" in status
    assert "proposals_broadcast" in status
    assert status["mirror_id"] is not None


def test_enable_disable_sync(commons_sync):
    """Test: Enable and disable commons sync"""
    # Enable
    commons_sync.enable_sync("https://commons.mirror.test/api")
    assert commons_sync.sync_enabled is True
    assert commons_sync.commons_url == "https://commons.mirror.test/api"
    
    # Disable
    commons_sync.disable_sync()
    assert commons_sync.sync_enabled is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
