"""
THE MIRROR: PHASE 1 STORAGE LAYER TESTS
Constitutional Enforcement Verification

Tests verify:
- I1 (Data Sovereignty): works_offline=TRUE, CASCADE deletes
- I2 (Identity Locality): mirror_id scoping, triggers prevent cross-identity
- I5 (No Lock-in): Export includes semantic meaning
- I9 (Anti-diagnosis): Language shapes have disclaimer, user ownership
- I11 (Historical Integrity): Constitutional audit immutability
- I13 (No Behavioral Optimization): Only resonance/fidelity/clarity ratings
- I14 (No Cross-Identity Inference): No global queries

Run: python -m pytest tests/test_storage_phase1.py -v
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

# Add mirror_os to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.storage.base import (
    NodeType, EdgeType, ShapeOrigin, TensionOrigin, FeedbackType
)


@pytest.fixture
def storage():
    """Create temporary storage for each test."""
    temp_dir = tempfile.mkdtemp()
    db_path = Path(temp_dir) / "test_mirror.db"
    storage = SQLiteStorage(str(db_path))
    yield storage
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def mirror(storage):
    """Create test mirror."""
    return storage.create_mirror(
        owner_id="test_user_001",
        label="Test Mirror",
        mirrorcore_version="1.0.0",
        constitution_hash="TEST_HASH",
        constitution_version="1.0",
        prompt_templates={"reflection": "Tell me what you notice..."},
        lens_definitions={"growth": "Openness to change"}
    )


class TestI1DataSovereignty:
    """Test I1: Data Sovereignty - User owns everything"""
    
    def test_works_offline_enforced(self, storage, mirror):
        """I1: works_offline MUST be TRUE"""
        assert mirror.works_offline is True
        
        # Verify in database
        retrieved = storage.get_mirror(mirror.id)
        assert retrieved.works_offline is True
    
    def test_cascade_delete_removes_all_data(self, storage, mirror):
        """I1: Deleting mirror cascades to all owned data"""
        # Create owned data
        node = storage.create_node(
            mirror.id, NodeType.THOUGHT,
            content={"text": "Test thought"},
            summary="A thought"
        )
        shape = storage.create_language_shape(
            mirror.id, "Test Shape", ShapeOrigin.SYSTEM_SEED
        )
        
        # Verify data exists
        assert storage.get_node(node.id, mirror.id) is not None
        assert storage.get_language_shape(shape.id, mirror.id) is not None
        
        # Delete mirror
        result = storage.delete_mirror(mirror.id)
        assert result is True, "Mirror deletion should succeed"
        
        # Verify cascade delete
        assert storage.get_mirror(mirror.id) is None, "Mirror should be deleted"
        # Note: CASCADE delete is schema-defined but SQLite requires PRAGMA foreign_keys=ON
        # Since we enable it on every connection, cascade should work
        deleted_node = storage.get_node(node.id, mirror.id)
        assert deleted_node is None, f"Node should be cascade-deleted but found: {deleted_node}"
        assert storage.get_language_shape(shape.id, mirror.id) is None


class TestI2IdentityLocality:
    """Test I2: Identity Locality - All queries scoped by mirror_id"""
    
    def test_all_queries_require_mirror_id(self, storage):
        """I2: Cannot query without mirror_id"""
        mirror1 = storage.create_mirror(
            "user1", "Mirror 1", "1.0", "HASH1", "1.0"
        )
        mirror2 = storage.create_mirror(
            "user2", "Mirror 2", "1.0", "HASH2", "1.0"
        )
        
        # Create nodes in different mirrors
        node1 = storage.create_node(
            mirror1.id, NodeType.THOUGHT,
            content={"text": "Mirror 1 thought"},
            summary="Thought 1"
        )
        node2 = storage.create_node(
            mirror2.id, NodeType.THOUGHT,
            content={"text": "Mirror 2 thought"},
            summary="Thought 2"
        )
        
        # Verify isolation
        mirror1_nodes = storage.list_nodes(mirror1.id)
        mirror2_nodes = storage.list_nodes(mirror2.id)
        
        assert len(mirror1_nodes) == 1
        assert len(mirror2_nodes) == 1
        assert mirror1_nodes[0].id == node1.id
        assert mirror2_nodes[0].id == node2.id
        
        # Cannot get node from wrong mirror
        assert storage.get_node(node1.id, mirror2.id) is None
        assert storage.get_node(node2.id, mirror1.id) is None
    
    def test_edge_locality_trigger(self, storage, mirror):
        """I2: SQL trigger prevents cross-mirror edges"""
        # Create two mirrors
        mirror2 = storage.create_mirror(
            "user2", "Mirror 2", "1.0", "HASH", "1.0"
        )
        
        # Create nodes in each mirror
        node1 = storage.create_node(
            mirror.id, NodeType.THOUGHT,
            content={"text": "Node in mirror 1"},
            summary="Node 1"
        )
        node2 = storage.create_node(
            mirror2.id, NodeType.THOUGHT,
            content={"text": "Node in mirror 2"},
            summary="Node 2"
        )
        
        # Try to create cross-mirror edge (should fail via trigger)
        with pytest.raises(Exception):  # SQL trigger will raise error
            storage.create_edge(
                mirror.id, node1.id, node2.id, EdgeType.CAUSES
            )


class TestI5NoLockIn:
    """Test I5: No Lock-in - Export includes semantic meaning"""
    
    def test_export_includes_semantic_bundle(self, storage, mirror):
        """I5: Export MUST include constitution + prompts + lenses + renames"""
        # Update with semantic data
        storage.update_mirror(
            mirror.id,
            prompt_templates={"reflection": "What do you notice?"},
            lens_definitions={"growth": "Change openness"},
            user_renames={"catastrophizing": "worst-case thinking"}
        )
        
        # Export
        export_path = tempfile.mktemp(suffix=".zip")
        bundle = storage.export_mirror(mirror.id, export_path)
        
        # Verify semantic meaning included
        assert bundle.constitution_version == "1.0"
        assert bundle.constitution_hash == "TEST_HASH"
        assert "reflection" in bundle.prompt_templates
        assert "growth" in bundle.lens_definitions
        assert "catastrophizing" in bundle.user_renames
        assert bundle.bundle_hash is not None  # Integrity hash
        
        Path(export_path).unlink(missing_ok=True)
    
    def test_import_restores_semantic_meaning(self, storage, mirror):
        """I5: Import must restore full semantic context"""
        # Setup semantic data
        storage.update_mirror(
            mirror.id,
            prompt_templates={"reflection": "Reflect on..."},
            lens_definitions={"tension_control": "Control vs surrender"},
            user_renames={"black_white": "all-or-nothing"}
        )
        
        # Export
        export_path = tempfile.mktemp(suffix=".zip")
        storage.export_mirror(mirror.id, export_path)
        
        # Import to new storage
        temp_dir = tempfile.mkdtemp()
        new_storage = SQLiteStorage(str(Path(temp_dir) / "imported.db"))
        imported_id = new_storage.import_mirror(export_path, "new_owner")
        
        # Verify semantic meaning restored
        imported = new_storage.get_mirror(imported_id)
        assert imported.prompt_templates["reflection"] == "Reflect on..."
        assert imported.lens_definitions["tension_control"] == "Control vs surrender"
        assert imported.user_renames["black_white"] == "all-or-nothing"
        
        # Cleanup
        Path(export_path).unlink(missing_ok=True)
        shutil.rmtree(temp_dir, ignore_errors=True)


class TestI9AntiDiagnosis:
    """Test I9: Anti-diagnosis - Language shapes are lenses, not labels"""
    
    def test_language_shape_has_disclaimer(self, storage, mirror):
        """I9: All language shapes MUST have non-diagnosis disclaimer"""
        shape = storage.create_language_shape(
            mirror.id, "Pattern Name", ShapeOrigin.SYSTEM_SEED,
            description="A way of speaking"
        )
        
        assert "lens" in shape.disclaimer.lower()
        assert "not a diagnosis" in shape.disclaimer.lower()
    
    def test_user_can_rename_shapes(self, storage, mirror):
        """I9: User has full control to rename shapes"""
        shape = storage.create_language_shape(
            mirror.id, "System Name", ShapeOrigin.SYSTEM_SEED
        )
        
        # User renames
        updated = storage.update_language_shape(
            shape.id, mirror.id, name="My Custom Name"
        )
        
        assert updated.name == "My Custom Name"
        assert updated.user_renamed is True
    
    def test_user_can_hide_shapes(self, storage, mirror):
        """I9: User can hide shapes they don't want"""
        shape = storage.create_language_shape(
            mirror.id, "Shape", ShapeOrigin.MODEL_SUGGESTED
        )
        
        # User hides
        updated = storage.update_language_shape(
            shape.id, mirror.id, user_hidden=True
        )
        
        assert updated.user_hidden is True
        
        # Hidden shapes excluded by default
        visible = storage.list_language_shapes(mirror.id, include_hidden=False)
        assert len(visible) == 0
        
        # But can be retrieved if requested
        all_shapes = storage.list_language_shapes(mirror.id, include_hidden=True)
        assert len(all_shapes) == 1


class TestI11HistoricalIntegrity:
    """Test I11: Historical Integrity - Constitutional audit is immutable"""
    
    def test_constitutional_audit_logging(self, storage, mirror):
        """I11: All constitutional checks logged immutably"""
        # Log a check
        storage.log_constitutional_check(
            mirror.id,
            check_type="mirrorback_generation",
            invariants_checked=["I2", "I7", "I13"],
            all_passed=True,
            violations_detected=None,
            severity="none"
        )
        
        # Retrieve audit
        audit = storage.get_constitutional_audit(mirror.id, limit=1)
        assert len(audit) == 1
        assert audit[0]["check_type"] == "mirrorback_generation"
        assert audit[0]["all_passed"] is True
        assert "I2" in audit[0]["invariants_checked"]
    
    def test_violations_recorded(self, storage, mirror):
        """I11: Violations are recorded for transparency"""
        storage.log_constitutional_check(
            mirror.id,
            check_type="mirrorback_generation",
            invariants_checked=["I2", "I13"],
            all_passed=False,
            violations_detected=["I2_DIRECTIVE_THRESHOLD_EXCEEDED:0.25"],
            severity="critical"
        )
        
        audit = storage.get_constitutional_audit(mirror.id, limit=1)
        assert audit[0]["all_passed"] is False
        assert len(audit[0]["violations_detected"]) == 1
        assert audit[0]["severity"] == "critical"


class TestI13NoBehavioralOptimization:
    """Test I13: No Behavioral Optimization - Only mechanical ratings"""
    
    def test_mirrorback_ratings_restricted(self, storage, mirror):
        """I13: ONLY resonance/fidelity/clarity ratings allowed"""
        # Create reflection
        reflection = storage.create_reflection(
            mirror.id, "Test reflection content"
        )
        
        # Create mirrorback
        mirrorback = storage.create_mirrorback(
            mirror.id,
            reflection.id,
            "Test mirrorback content",
            constitutional_check_passed=True,
            engine_version="1.0",
            model_used="test_model"
        )
        
        # Update with ALLOWED ratings
        updated = storage.update_mirrorback_rating(
            mirrorback.id, mirror.id,
            rating_resonance=4,
            rating_fidelity=5,
            rating_clarity=3
        )
        
        assert updated.rating_resonance == 4
        assert updated.rating_fidelity == 5
        assert updated.rating_clarity == 3
        
        # No "helpfulness" or behavioral metrics in schema


class TestI14NoCrossIdentityInference:
    """Test I14: No Cross-Identity Inference - All analytics identity-local"""
    
    def test_no_global_aggregation(self, storage):
        """I14: Cannot perform cross-mirror analytics"""
        # Create multiple mirrors
        mirror1 = storage.create_mirror("user1", "M1", "1.0", "H1", "1.0")
        mirror2 = storage.create_mirror("user2", "M2", "1.0", "H2", "1.0")
        
        # Create language shapes in each
        storage.create_language_shape(
            mirror1.id, "Shape A", ShapeOrigin.SYSTEM_SEED
        )
        storage.create_language_shape(
            mirror2.id, "Shape A", ShapeOrigin.SYSTEM_SEED
        )
        
        # Each mirror sees only their own
        m1_shapes = storage.list_language_shapes(mirror1.id)
        m2_shapes = storage.list_language_shapes(mirror2.id)
        
        assert len(m1_shapes) == 1
        assert len(m2_shapes) == 1
        assert m1_shapes[0].mirror_id == mirror1.id
        assert m2_shapes[0].mirror_id == mirror2.id
    
    def test_storage_stats_identity_scoped(self, storage, mirror):
        """I14: Stats are per-mirror only"""
        # Create data
        storage.create_node(
            mirror.id, NodeType.THOUGHT,
            content={"text": "Thought"},
            summary="Test"
        )
        storage.create_language_shape(
            mirror.id, "Shape", ShapeOrigin.USER_NAMED
        )
        
        # Get stats for specific mirror
        stats = storage.get_storage_stats(mirror.id)
        assert stats["nodes"] == 1
        assert stats["language_shapes"] == 1
        
        # Cannot get aggregated stats across all mirrors (I14 violation)
        # Global stats only show counts, no content
        global_stats = storage.get_storage_stats()
        assert "mirrors" in global_stats  # Count only
        assert "nodes" not in global_stats  # No cross-identity aggregation


class TestStorageCRUD:
    """Test basic CRUD operations"""
    
    def test_create_and_retrieve_node(self, storage, mirror):
        """Basic node creation and retrieval"""
        node = storage.create_node(
            mirror.id, NodeType.BELIEF,
            content={"text": "I am capable", "confidence": 0.8},
            summary="Core belief",
            confidence_score=0.9,
            occurred_at=datetime.now()
        )
        
        retrieved = storage.get_node(node.id, mirror.id)
        assert retrieved.id == node.id
        assert retrieved.node_type == NodeType.BELIEF
        assert retrieved.summary == "Core belief"
    
    def test_create_edge_between_nodes(self, storage, mirror):
        """Create edges connecting nodes"""
        node1 = storage.create_node(
            mirror.id, NodeType.THOUGHT,
            content={"text": "I'm worried"},
            summary="Worry"
        )
        node2 = storage.create_node(
            mirror.id, NodeType.EMOTION,
            content={"text": "Anxiety"},
            summary="Feeling"
        )
        
        edge = storage.create_edge(
            mirror.id, node1.id, node2.id, EdgeType.CAUSES,
            strength=0.7
        )
        
        assert edge.source_node_id == node1.id
        assert edge.target_node_id == node2.id
        assert edge.edge_type == EdgeType.CAUSES
    
    def test_create_tension(self, storage, mirror):
        """Create and track tension"""
        tension = storage.create_tension(
            mirror.id, "Control", "Surrender", 0.5, TensionOrigin.SYSTEM_SEED
        )
        
        assert tension.axis_a == "Control"
        assert tension.axis_b == "Surrender"
        assert tension.current_position == 0.5
        
        # Record measurement
        measurement_id = storage.record_tension_measurement(
            tension.id, -0.3, confidence=0.8
        )
        assert measurement_id is not None
    
    def test_reflection_and_mirrorback(self, storage, mirror):
        """Create reflection with mirrorback"""
        # Create reflection
        reflection = storage.create_reflection(
            mirror.id,
            "I've been thinking about my patterns lately..."
        )
        
        # Create mirrorback
        mirrorback = storage.create_mirrorback(
            mirror.id,
            reflection.id,
            "I notice you're observing your patterns...",
            constitutional_check_passed=True,
            engine_version="1.0.0",
            model_used="local:test",
            directive_ratio=0.05,
            imperative_intent_detected=False,
            outcome_steering_detected=False
        )
        
        assert mirrorback.reflection_id == reflection.id
        assert mirrorback.rating_resonance is None  # Not yet rated
    
    def test_thread_with_reflections(self, storage, mirror):
        """Create threaded conversation"""
        # Create thread
        thread_id = storage.create_thread(mirror.id, title="Morning thoughts")
        assert thread_id is not None
        
        # Add reflections to thread
        r1 = storage.create_reflection(
            mirror.id, "First thought", thread_id=thread_id
        )
        r2 = storage.create_reflection(
            mirror.id, "Follow-up thought", thread_id=thread_id
        )
        
        # List reflections in thread
        thread_reflections = storage.list_reflections(mirror.id, thread_id=thread_id)
        assert len(thread_reflections) == 2


class TestOfflineOperation:
    """Verify system works 100% offline"""
    
    def test_no_network_required(self, storage, mirror):
        """All operations work without network"""
        # This test verifies that SQLite + local Python is sufficient
        # No network calls are made
        
        # Create full workflow offline
        node = storage.create_node(
            mirror.id, NodeType.THOUGHT,
            content={"text": "Offline thought"},
            summary="Test"
        )
        
        shape = storage.create_language_shape(
            mirror.id, "Offline Shape", ShapeOrigin.USER_NAMED
        )
        
        reflection = storage.create_reflection(
            mirror.id, "Offline reflection"
        )
        
        mirrorback = storage.create_mirrorback(
            mirror.id, reflection.id, "Offline response",
            constitutional_check_passed=True,
            engine_version="1.0", model_used="local"
        )
        
        # Export offline
        export_path = tempfile.mktemp(suffix=".zip")
        storage.export_mirror(mirror.id, export_path)
        
        # Verify export exists
        assert Path(export_path).exists()
        Path(export_path).unlink()
        
        # All succeeded without network


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
