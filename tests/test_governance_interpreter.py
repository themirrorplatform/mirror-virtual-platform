"""
Tests for Constitutional Interpreter
====================================

Tests the core constitutional interpretation engine.
"""

import pytest
from datetime import datetime

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    InterpretationContext,
    ConstitutionalDecision,
    ViolationType,
    ViolationSeverity
)


@pytest.fixture
def interpreter():
    """Create constitutional interpreter"""
    return ConstitutionalInterpreter()


@pytest.fixture
def clean_context():
    """Create a clean interpretation context"""
    return InterpretationContext(
        action="test_action",
        actor="system",
        affected_mirrors=["mirror_1"],
        data_involved={},
        timestamp=datetime.utcnow(),
        metadata={}
    )


class TestConstitutionalInterpreter:
    """Test constitutional interpretation"""
    
    def test_interpreter_initialization(self, interpreter):
        """Test interpreter initializes correctly"""
        assert interpreter is not None
        assert len(interpreter.invariants) == 14
        assert len(interpreter.interpretation_history) == 0
    
    def test_clean_action_permitted(self, interpreter, clean_context):
        """Test that clean action is permitted"""
        decision = interpreter.interpret(clean_context)
        
        assert decision.permitted is True
        assert decision.severity == ViolationSeverity.BENIGN
        assert len(decision.violated_invariants) == 0
    
    def test_prescriptive_language_detected(self, interpreter):
        """Test detection of prescriptive language (I4)"""
        context = InterpretationContext(
            action="generate_reflection",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "You should try meditation to feel better"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.PRESCRIPTIVE in decision.violated_invariants
        assert decision.severity == ViolationSeverity.HARD
        assert len(decision.remediation_suggestions) > 0
    
    def test_diagnostic_language_detected(self, interpreter):
        """Test detection of diagnostic language (I9)"""
        context = InterpretationContext(
            action="generate_analysis",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "This looks like symptoms of depression"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.DIAGNOSTIC in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
    
    def test_cross_identity_inference_blocked(self, interpreter):
        """Test I14: Cross-identity inference is blocked"""
        context = InterpretationContext(
            action="train_model",
            actor="system",
            affected_mirrors=["mirror_1", "mirror_2", "mirror_3"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.CROSS_IDENTITY_INFERENCE in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
    
    def test_behavioral_optimization_blocked(self, interpreter):
        """Test I13: Behavioral optimization metrics blocked"""
        context = InterpretationContext(
            action="track_metric",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"metric_name": "daily_active_users"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.BEHAVIORAL_OPTIMIZATION in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
    
    def test_data_sovereignty_offline_requirement(self, interpreter):
        """Test I1: Offline capability required"""
        context = InterpretationContext(
            action="add_feature",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"offline": False}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.DATA_SOVEREIGNTY in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
    
    def test_identity_locality_single_mirror(self, interpreter):
        """Test I2: Single mirror operations are permitted"""
        context = InterpretationContext(
            action="process_reflection",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        # Should not violate I2
        assert ViolationType.IDENTITY_LOCALITY not in decision.violated_invariants
    
    def test_identity_locality_mixed_identities(self, interpreter):
        """Test I2: Mixed identities flagged"""
        context = InterpretationContext(
            action="aggregate_data",
            actor="system",
            affected_mirrors=["mirror_1", "mirror_2"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"mixed_identities": True}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.IDENTITY_LOCALITY in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
    
    def test_temporal_coherence_timestamp_modification(self, interpreter):
        """Test I10: Timestamp modification blocked"""
        context = InterpretationContext(
            action="update_timestamp",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.TEMPORAL_INCOHERENCE in decision.violated_invariants
        assert decision.severity == ViolationSeverity.CRITICAL
        assert decision.reversible is False
    
    def test_architectural_honesty_logging(self, interpreter):
        """Test I7: Unlogged operations flagged"""
        context = InterpretationContext(
            action="process_data",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"logged": False}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.ARCHITECTURAL_DISHONESTY in decision.violated_invariants
    
    def test_graceful_failure_no_fallback(self, interpreter):
        """Test I12: External dependency without fallback"""
        context = InterpretationContext(
            action="add_dependency",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"external": True}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert ViolationType.UNGRACEFUL_FAILURE in decision.violated_invariants
    
    def test_interpretation_history_tracked(self, interpreter, clean_context):
        """Test interpretation history is tracked"""
        initial_count = len(interpreter.interpretation_history)
        
        interpreter.interpret(clean_context)
        interpreter.interpret(clean_context)
        
        assert len(interpreter.interpretation_history) == initial_count + 2
    
    def test_get_interpretation_history(self, interpreter, clean_context):
        """Test retrieving interpretation history"""
        interpreter.interpret(clean_context)
        
        history = interpreter.get_interpretation_history(limit=10)
        
        assert len(history) >= 1
        assert isinstance(history[0], ConstitutionalDecision)
    
    def test_violation_statistics(self, interpreter):
        """Test violation statistics"""
        # Create some violations
        prescriptive_context = InterpretationContext(
            action="generate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "You should do this"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        interpreter.interpret(prescriptive_context)
        
        stats = interpreter.get_violation_statistics()
        
        assert "total_decisions" in stats
        assert "blocked_count" in stats
        assert "compliance_rate" in stats
        assert stats["total_decisions"] > 0
    
    def test_multiple_violations(self, interpreter):
        """Test action with multiple violations"""
        context = InterpretationContext(
            action="analyze_and_recommend",
            actor="system",
            affected_mirrors=["mirror_1", "mirror_2"],
            data_involved={
                "text": "You should seek treatment for your depression symptoms"
            },
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert len(decision.violated_invariants) >= 2
        # Should catch both prescriptive (I4) and diagnostic (I9)
        assert ViolationType.PRESCRIPTIVE in decision.violated_invariants or \
               ViolationType.DIAGNOSTIC in decision.violated_invariants
    
    def test_reversibility_assessment(self, interpreter):
        """Test reversibility is correctly assessed"""
        # Reversible action
        reversible_context = InterpretationContext(
            action="calculate_stats",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(reversible_context)
        assert decision.reversible is True
        
        # Irreversible action
        irreversible_context = InterpretationContext(
            action="delete_permanently",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(irreversible_context)
        assert decision.reversible is False
    
    def test_remediation_suggestions_provided(self, interpreter):
        """Test remediation suggestions are provided"""
        context = InterpretationContext(
            action="generate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "You must try this approach"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert len(decision.remediation_suggestions) > 0
        assert any("prescriptive" in s.lower() for s in decision.remediation_suggestions)
    
    def test_constitutional_basis_provided(self, interpreter):
        """Test constitutional basis is provided for violations"""
        context = InterpretationContext(
            action="generate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "You should do this"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        
        assert decision.permitted is False
        assert len(decision.constitutional_basis) > 0
        assert any("I4" in basis or "Non-Prescriptive" in basis 
                  for basis in decision.constitutional_basis)


class TestConstitutionalInvariants:
    """Test each constitutional invariant individually"""
    
    def test_i1_data_sovereignty(self, interpreter):
        """Test I1: Data Sovereignty"""
        # Should block cloud upload without consent
        context = InterpretationContext(
            action="send_to_cloud",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        assert ViolationType.DATA_SOVEREIGNTY in decision.violated_invariants
    
    def test_i2_identity_locality(self, interpreter):
        """Test I2: Identity Locality"""
        context = InterpretationContext(
            action="cross_reference",
            actor="system",
            affected_mirrors=["mirror_1", "mirror_2"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        assert ViolationType.IDENTITY_LOCALITY in decision.violated_invariants
    
    def test_i3_language_primacy(self, interpreter):
        """Test I3: Language Primacy"""
        context = InterpretationContext(
            action="calculate_metrics",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"shapes_to_scores": True}
        )
        
        decision = interpreter.interpret(context)
        assert ViolationType.LANGUAGE_PRIMACY in decision.violated_invariants
    
    def test_i5_semantic_tension(self, interpreter):
        """Test I5: Semantic Tension"""
        context = InterpretationContext(
            action="resolve_tension",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        assert ViolationType.SEMANTIC_TENSION in decision.violated_invariants
    
    def test_i11_open_inspection(self, interpreter):
        """Test I11: Open Inspection"""
        context = InterpretationContext(
            action="obfuscate_code",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        assert ViolationType.CLOSED_INSPECTION in decision.violated_invariants


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
