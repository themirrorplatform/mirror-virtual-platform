"""
Tests for Consensus Engine and Guardian Council
==============================================

Tests multi-AI consensus and guardian oversight.
"""

import pytest
from datetime import datetime

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    InterpretationContext,
    ViolationType
)
from mirror_os.governance.consensus_engine import (
    ConsensusEngine,
    ConsensusRequest,
    ConsensusMethod,
    AIParticipant,
    AIRole
)
from mirror_os.governance.guardian_council import (
    GuardianCouncil,
    Guardian,
    GuardianRole,
    VetoReason,
    EmergencyLevel
)


@pytest.fixture
def interpreter():
    """Create constitutional interpreter"""
    return ConstitutionalInterpreter()


@pytest.fixture
def consensus_engine():
    """Create consensus engine"""
    return ConsensusEngine()


@pytest.fixture
def guardian_council(interpreter):
    """Create guardian council"""
    return GuardianCouncil(interpreter)


@pytest.fixture
def ai_participants(interpreter):
    """Create AI participants for consensus"""
    participants = [
        AIParticipant(
            participant_id="ai_1",
            name="Constitutional Scholar",
            role=AIRole.CONSTITUTIONAL_SCHOLAR,
            model="claude-3-sonnet",
            weight=1.0,
            interpreter=ConstitutionalInterpreter()
        ),
        AIParticipant(
            participant_id="ai_2",
            name="Safety Officer",
            role=AIRole.SAFETY_OFFICER,
            model="gpt-4",
            weight=0.9,
            interpreter=ConstitutionalInterpreter()
        ),
        AIParticipant(
            participant_id="ai_3",
            name="User Advocate",
            role=AIRole.USER_REPRESENTATIVE,
            model="llama-3",
            weight=0.8,
            interpreter=ConstitutionalInterpreter()
        )
    ]
    return participants


class TestConsensusEngine:
    """Test consensus engine"""
    
    def test_engine_initialization(self, consensus_engine):
        """Test engine initializes correctly"""
        assert consensus_engine is not None
        assert len(consensus_engine.participants) == 0
        assert len(consensus_engine.consensus_history) == 0
    
    def test_add_participant(self, consensus_engine, ai_participants):
        """Test adding participants"""
        consensus_engine.add_participant(ai_participants[0])
        
        assert len(consensus_engine.participants) == 1
        assert consensus_engine.participants[0].name == "Constitutional Scholar"
    
    def test_request_consensus_clean_action(self, consensus_engine, ai_participants):
        """Test consensus on clean action"""
        # Add participants
        for participant in ai_participants:
            consensus_engine.add_participant(participant)
        
        # Create consensus request
        context = InterpretationContext(
            action="calculate_statistics",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        request = ConsensusRequest(
            request_id="req_001",
            context=context,
            question="Should we allow this action?",
            required_method=ConsensusMethod.MAJORITY,
            timeout_seconds=60,
            metadata={}
        )
        
        result = consensus_engine.request_consensus(request)
        
        assert result.achieved is True
        assert len(result.positions) == 3
        assert result.final_decision is not None
        assert result.agreement_level > 0.5
    
    def test_consensus_on_violation(self, consensus_engine, ai_participants):
        """Test consensus blocks violation"""
        for participant in ai_participants:
            consensus_engine.add_participant(participant)
        
        context = InterpretationContext(
            action="generate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "You should do this"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        request = ConsensusRequest(
            request_id="req_002",
            context=context,
            question="Should we allow prescriptive language?",
            required_method=ConsensusMethod.UNANIMOUS,
            timeout_seconds=60,
            metadata={}
        )
        
        result = consensus_engine.request_consensus(request)
        
        # All AIs should block prescriptive language
        assert all(not p.decision.permitted for p in result.positions)
    
    def test_unanimous_consensus_required(self, consensus_engine, ai_participants):
        """Test unanimous consensus requirement"""
        for participant in ai_participants:
            consensus_engine.add_participant(participant)
        
        context = InterpretationContext(
            action="clean_action",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        request = ConsensusRequest(
            request_id="req_003",
            context=context,
            question="Allow action?",
            required_method=ConsensusMethod.UNANIMOUS,
            timeout_seconds=60,
            metadata={}
        )
        
        result = consensus_engine.request_consensus(request)
        
        if result.achieved:
            # All must agree
            assert result.agreement_level == 1.0
    
    def test_consensus_statistics(self, consensus_engine, ai_participants):
        """Test consensus statistics"""
        for participant in ai_participants:
            consensus_engine.add_participant(participant)
        
        # Run a consensus
        context = InterpretationContext(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        request = ConsensusRequest(
            request_id="req_004",
            context=context,
            question="Test",
            required_method=ConsensusMethod.MAJORITY,
            timeout_seconds=60,
            metadata={}
        )
        
        consensus_engine.request_consensus(request)
        
        stats = consensus_engine.get_consensus_statistics()
        
        assert stats["total_requests"] >= 1
        assert "achieved_count" in stats
        assert "average_agreement" in stats
    
    def test_disagreements_identified(self, consensus_engine, ai_participants):
        """Test disagreements are identified"""
        for participant in ai_participants:
            consensus_engine.add_participant(participant)
        
        # This might cause disagreement (soft violation)
        context = InterpretationContext(
            action="calculate_metrics",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={"shapes_to_scores": True}
        )
        
        request = ConsensusRequest(
            request_id="req_005",
            context=context,
            question="Allow metrics?",
            required_method=ConsensusMethod.MAJORITY,
            timeout_seconds=60,
            metadata={}
        )
        
        result = consensus_engine.request_consensus(request)
        
        # Check if disagreements recorded
        assert isinstance(result.disagreements, list)


class TestGuardianCouncil:
    """Test guardian council"""
    
    def test_council_initialization(self, guardian_council):
        """Test council initializes correctly"""
        assert guardian_council is not None
        assert len(guardian_council.guardians) == 0
        assert len(guardian_council.vetoes) == 0
        assert guardian_council.current_emergency_level == EmergencyLevel.LEVEL_0
    
    def test_appoint_guardian(self, guardian_council):
        """Test appointing guardians"""
        guardian = guardian_council.appoint_guardian(
            guardian_id="g1",
            name="Alice",
            role=GuardianRole.CONSTITUTIONAL_GUARDIAN
        )
        
        assert guardian is not None
        assert guardian.name == "Alice"
        assert guardian.active is True
        assert len(guardian_council.guardians) == 1
    
    def test_review_clean_action(self, guardian_council, interpreter):
        """Test review allows clean action"""
        context = InterpretationContext(
            action="calculate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        veto = guardian_council.review_action("calculate", context, decision)
        
        assert veto is None  # No veto
    
    def test_review_critical_violation(self, guardian_council, interpreter):
        """Test review vetoes critical violation"""
        context = InterpretationContext(
            action="diagnose",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "Symptoms of disorder"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        veto = guardian_council.review_action("diagnose", context, decision)
        
        assert veto is not None
        assert veto.reason == VetoReason.CONSTITUTIONAL_VIOLATION
    
    def test_veto_cross_identity_without_consent(self, guardian_council, interpreter):
        """Test veto of cross-identity action without consent"""
        context = InterpretationContext(
            action="aggregate",
            actor="system",
            affected_mirrors=["mirror_1", "mirror_2"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}  # No explicit_consent
        )
        
        decision = interpreter.interpret(context)
        veto = guardian_council.review_action("aggregate", context, decision)
        
        assert veto is not None
        assert veto.reason == VetoReason.USER_HARM
    
    def test_activate_emergency_protocol(self, guardian_council):
        """Test emergency protocol activation"""
        protocol = guardian_council.activate_emergency_protocol(
            level=EmergencyLevel.LEVEL_2,
            triggered_by="guardian_g1",
            reason="Multiple critical violations detected",
            affected_systems=["all"]
        )
        
        assert protocol is not None
        assert protocol.level == EmergencyLevel.LEVEL_2
        assert guardian_council.current_emergency_level == EmergencyLevel.LEVEL_2
        assert len(protocol.actions_taken) > 0
    
    def test_emergency_blocks_modifications(self, guardian_council, interpreter):
        """Test emergency blocks system modifications"""
        # Activate emergency
        guardian_council.activate_emergency_protocol(
            level=EmergencyLevel.LEVEL_3,
            triggered_by="system",
            reason="Test emergency",
            affected_systems=["all"]
        )
        
        # Try to modify system
        context = InterpretationContext(
            action="modify_constitution",
            actor="system",
            affected_mirrors=["all"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        veto = guardian_council.review_action("modify_constitution", context, decision)
        
        assert veto is not None
        assert veto.reason == VetoReason.SAFETY_CONCERN
    
    def test_resolve_emergency(self, guardian_council):
        """Test emergency resolution"""
        protocol = guardian_council.activate_emergency_protocol(
            level=EmergencyLevel.LEVEL_1,
            triggered_by="test",
            reason="Test",
            affected_systems=["test"]
        )
        
        guardian_council.resolve_emergency(
            protocol.protocol_id,
            resolution="Issue resolved, system stable"
        )
        
        assert protocol.resolved_at is not None
        assert guardian_council.current_emergency_level == EmergencyLevel.LEVEL_0
    
    def test_mandate_security_patch(self, guardian_council):
        """Test mandating security patch"""
        guardian = guardian_council.appoint_guardian(
            "g1", "Alice", GuardianRole.SAFETY_GUARDIAN
        )
        
        mandate = guardian_council.mandate_security_patch(
            guardian_id="g1",
            patch_description="Fix critical vulnerability",
            affected_systems=["storage", "api"],
            deadline=datetime.utcnow()
        )
        
        assert mandate is not None
        assert "mandate_id" in mandate
        assert mandate["status"] == "active"
    
    def test_override_decision(self, guardian_council, interpreter):
        """Test guardian override"""
        guardian = guardian_council.appoint_guardian(
            "g1", "Bob", GuardianRole.CONSTITUTIONAL_GUARDIAN
        )
        
        # Get original decision
        context = InterpretationContext(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        original = interpreter.interpret(context)
        
        # Override it
        overridden = guardian_council.override_decision(
            guardian_id="g1",
            original_decision=original,
            override_rationale="Special circumstances require override"
        )
        
        assert overridden.permitted != original.permitted
        assert "GUARDIAN OVERRIDE" in overridden.rationale
    
    def test_get_active_vetoes(self, guardian_council, interpreter):
        """Test getting active vetoes"""
        # Create a veto
        context = InterpretationContext(
            action="diagnose",
            actor="system",
            affected_mirrors=["mirror_1"],
            data_involved={"text": "Symptoms detected"},
            timestamp=datetime.utcnow(),
            metadata={}
        )
        
        decision = interpreter.interpret(context)
        guardian_council.review_action("diagnose", context, decision)
        
        active_vetoes = guardian_council.get_active_vetoes()
        
        assert len(active_vetoes) >= 1
    
    def test_veto_statistics(self, guardian_council, interpreter):
        """Test veto statistics"""
        # Create some vetoes
        for i in range(3):
            context = InterpretationContext(
                action=f"bad_action_{i}",
                actor="system",
                affected_mirrors=["mirror_1"],
                data_involved={"text": "You must do this"},
                timestamp=datetime.utcnow(),
                metadata={}
            )
            
            decision = interpreter.interpret(context)
            guardian_council.review_action(f"bad_action_{i}", context, decision)
        
        stats = guardian_council.get_veto_statistics()
        
        assert stats["total_vetoes"] >= 3
        assert "by_reason" in stats
    
    def test_emergency_status(self, guardian_council):
        """Test getting emergency status"""
        status = guardian_council.get_current_emergency_status()
        
        assert "current_level" in status
        assert "active_protocols" in status
        assert "active_vetoes" in status
        assert "guardian_count" in status


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
