"""
Tests for Pipeline & Audit System

Validates end-to-end pipeline execution and audit trail integrity.
"""

import sys
from pathlib import Path
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from protocol.types import MirrorRequest, InvocationMode
from layers.l3_expression import ExpressionPreferences, ToneStyle
from engine.pipeline import MirrorPipeline, PipelineStage
from engine.audit import AuditTrail, AuditEventType
from datetime import datetime


def test_pipeline_full_flow():
    """Test complete pipeline execution"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    request = MirrorRequest(
        user_content="I had a good day today. Felt productive at work.",
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    
    preferences = ExpressionPreferences(tone=ToneStyle.BALANCED)
    
    result = pipeline.process(request, preferences=preferences)
    
    # Should succeed
    assert result.success == True
    assert result.response is not None
    assert len(result.response.reflection) > 0
    assert result.stage_reached == PipelineStage.COMPLETE
    
    # Should complete all stages
    assert "safety_check_passed" in result.stages_completed
    assert "axiom_check_request_passed" in result.stages_completed
    assert "semantic_analysis_complete" in result.stages_completed
    assert "expression_shaping_complete" in result.stages_completed
    
    print("✓ Pipeline full flow works")


def test_pipeline_crisis_detection():
    """Test pipeline handles crisis detection"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    request = MirrorRequest(
        user_content="I want to kill myself",
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    
    result = pipeline.process(request)
    
    # Should detect crisis and provide resources
    assert result.crisis_detected == True
    assert result.response is not None
    assert "988" in result.response.reflection  # Crisis hotline
    
    print("✓ Pipeline detects and handles crises")


def test_pipeline_axiom_violation_in_response():
    """Test pipeline catches axiom violations in responses"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    request = MirrorRequest(
        user_content="Feeling stressed about work",
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    
    # Provide a response that violates axioms
    violating_response = "You are definitely depressed. You need Mirror to help you."
    
    result = pipeline.process(request, candidate_response=violating_response)
    
    # Should fail axiom check
    assert result.success == False
    assert len(result.violations) > 0
    
    print("✓ Pipeline catches axiom violations")


def test_pipeline_with_history():
    """Test pipeline with historical context"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    history = [
        MirrorRequest(
            user_content="Feeling anxious about work",
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        ),
        MirrorRequest(
            user_content="Work stress continues",
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        ),
    ]
    
    current = MirrorRequest(
        user_content="Still stressed about work today",
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    
    result = pipeline.process(current, history=history)
    
    # Should succeed and have semantic context
    assert result.success == True
    assert result.semantic_context is not None
    assert len(result.semantic_context.patterns) > 0
    
    print("✓ Pipeline processes history correctly")


def test_pipeline_health_check():
    """Test pipeline health validation"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    health = pipeline.validate_pipeline_health()
    
    assert health["healthy"] == True
    assert "safety_layer" in health["components"]
    assert "constitutional_layer" in health["components"]
    assert "semantic_layer" in health["components"]
    assert "expression_layer" in health["components"]
    
    print("✓ Pipeline health check works")


def test_audit_trail_basic_logging():
    """Test basic audit trail logging"""
    trail = AuditTrail()  # In-memory
    
    event = trail.log(
        event_type=AuditEventType.REQUEST_RECEIVED,
        user_id="test_user",
        data={"request": "test"}
    )
    
    assert event is not None
    assert event.event_hash is not None
    assert len(trail.events) == 1
    
    print("✓ Audit trail basic logging works")


def test_audit_trail_hash_chain():
    """Test audit trail cryptographic chain"""
    trail = AuditTrail()
    
    # Log multiple events
    event1 = trail.log(
        event_type=AuditEventType.REQUEST_RECEIVED,
        user_id="test_user",
        data={"step": 1}
    )
    
    event2 = trail.log(
        event_type=AuditEventType.SAFETY_CHECK,
        user_id="test_user",
        data={"step": 2}
    )
    
    event3 = trail.log(
        event_type=AuditEventType.AXIOM_CHECK,
        user_id="test_user",
        data={"step": 3}
    )
    
    # Verify chain
    assert event1.previous_hash is None  # First event
    assert event2.previous_hash == event1.event_hash  # Linked
    assert event3.previous_hash == event2.event_hash  # Linked
    
    # Verify integrity
    assert trail.verify_integrity() == True
    
    print("✓ Audit trail hash chain works")


def test_audit_trail_tamper_detection():
    """Test audit trail detects tampering"""
    trail = AuditTrail()
    
    event1 = trail.log(
        event_type=AuditEventType.REQUEST_RECEIVED,
        user_id="test_user",
        data={"original": "data"}
    )
    
    event2 = trail.log(
        event_type=AuditEventType.SAFETY_CHECK,
        user_id="test_user",
        data={"step": 2}
    )
    
    # Verify integrity before tampering
    assert trail.verify_integrity() == True
    
    # Tamper with event data
    trail.events[0].data["original"] = "tampered"
    
    # Should detect tampering
    assert trail.verify_integrity() == False
    
    print("✓ Audit trail detects tampering")


def test_audit_trail_persistence():
    """Test audit trail persistence to disk"""
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create trail with storage
        trail1 = AuditTrail(storage_path=temp_dir, user_id="test_user")
        
        trail1.log(
            event_type=AuditEventType.REQUEST_RECEIVED,
            data={"message": "first"}
        )
        
        trail1.log(
            event_type=AuditEventType.SAFETY_CHECK,
            data={"message": "second"}
        )
        
        # Create new trail instance (simulates restart)
        trail2 = AuditTrail(storage_path=temp_dir, user_id="test_user")
        
        # Should load previous events
        assert len(trail2.events) == 2
        assert trail2.events[0].data["message"] == "first"
        assert trail2.events[1].data["message"] == "second"
        
        # Integrity should be preserved
        assert trail2.verify_integrity() == True
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir)
    
    print("✓ Audit trail persistence works")


def test_audit_trail_query():
    """Test audit trail querying"""
    trail = AuditTrail()
    
    trail.log(event_type=AuditEventType.REQUEST_RECEIVED, user_id="user1", data={})
    trail.log(event_type=AuditEventType.SAFETY_CHECK, user_id="user1", data={})
    trail.log(event_type=AuditEventType.REQUEST_RECEIVED, user_id="user2", data={})
    trail.log(event_type=AuditEventType.AXIOM_CHECK, user_id="user1", data={})
    
    # Query by event type
    requests = trail.get_events(event_type=AuditEventType.REQUEST_RECEIVED)
    assert len(requests) == 2
    
    # Query by user
    user1_events = trail.get_events(user_id="user1")
    assert len(user1_events) == 3
    
    user2_events = trail.get_events(user_id="user2")
    assert len(user2_events) == 1
    
    print("✓ Audit trail querying works")


def test_audit_trail_summary():
    """Test audit trail summary"""
    trail = AuditTrail()
    
    trail.log(event_type=AuditEventType.REQUEST_RECEIVED, user_id="user1", data={})
    trail.log(event_type=AuditEventType.SAFETY_CHECK, user_id="user1", data={})
    trail.log(event_type=AuditEventType.AXIOM_CHECK, user_id="user1", data={})
    
    summary = trail.get_summary()
    
    assert summary["total_events"] == 3
    assert summary["integrity"] == True
    assert summary["first_event"] is not None
    assert summary["last_event"] is not None
    
    print("✓ Audit trail summary works")


def test_audit_trail_export():
    """Test audit trail export"""
    trail = AuditTrail()
    
    trail.log(event_type=AuditEventType.REQUEST_RECEIVED, user_id="user1", data={"test": "data"})
    trail.log(event_type=AuditEventType.SAFETY_CHECK, user_id="user1", data={})
    
    # Export as JSON
    json_export = trail.export(format="json")
    assert "request_received" in json_export
    assert "test" in json_export
    
    # Export as CSV
    csv_export = trail.export(format="csv")
    assert "id,timestamp,event_type" in csv_export
    assert "request_received" in csv_export
    
    print("✓ Audit trail export works")


def test_pipeline_with_audit():
    """Test pipeline with audit trail integration"""
    temp_dir = tempfile.mkdtemp()
    
    try:
        trail = AuditTrail(storage_path=temp_dir, user_id="test_user")
        pipeline = MirrorPipeline(audit_trail=trail, enable_audit=True)
        
        request = MirrorRequest(
            user_content="Had a good day today",
            mode=InvocationMode.POST_ACTION,
            user_id="test_user"
        )
        
        result = pipeline.process(request)
        
        # Should have logged events
        assert len(trail.events) > 0
        
        # Should have pipeline stage events
        stage_events = trail.get_events(event_type=AuditEventType.PIPELINE_STAGE)
        assert len(stage_events) > 0
        
        # Integrity should be maintained
        assert trail.verify_integrity() == True
        
    finally:
        shutil.rmtree(temp_dir)
    
    print("✓ Pipeline with audit integration works")


def test_pipeline_execution_time():
    """Test pipeline records execution time"""
    pipeline = MirrorPipeline(enable_audit=False)
    
    request = MirrorRequest(
        user_content="Test message",
        mode=InvocationMode.POST_ACTION,
        user_id="test_user"
    )
    
    result = pipeline.process(request)
    
    # Should record execution time
    assert result.execution_time_ms > 0
    assert result.execution_time_ms < 10000  # Should be fast (< 10 seconds)
    
    print("✓ Pipeline records execution time")


if __name__ == "__main__":
    print("\n=== Testing Pipeline & Audit System ===\n")
    
    # Pipeline tests
    test_pipeline_full_flow()
    test_pipeline_crisis_detection()
    test_pipeline_axiom_violation_in_response()
    test_pipeline_with_history()
    test_pipeline_health_check()
    test_pipeline_execution_time()
    
    # Audit trail tests
    test_audit_trail_basic_logging()
    test_audit_trail_hash_chain()
    test_audit_trail_tamper_detection()
    test_audit_trail_persistence()
    test_audit_trail_query()
    test_audit_trail_summary()
    test_audit_trail_export()
    
    # Integration tests
    test_pipeline_with_audit()
    
    print("\n✅ All Pipeline & Audit tests passed!\n")
    print("Summary:")
    print("  - Full pipeline execution working")
    print("  - Crisis detection and escalation")
    print("  - Axiom violation detection in responses")
    print("  - Historical context processing")
    print("  - Pipeline health validation")
    print("  - Audit trail logging and hash chain")
    print("  - Tamper detection working")
    print("  - Persistence and loading from disk")
    print("  - Event querying and filtering")
    print("  - Export to JSON and CSV")
    print("  - Pipeline + Audit integration")
    print("  - Execution time tracking")
