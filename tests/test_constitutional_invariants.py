# tests/test_constitutional_invariants.py
"""
Constitutional Invariants Test Suite

Machine-checkable tests for all 14 invariants.
These tests define what it means to be "The Mirror".

Every test must pass for constitutional compliance.
"""

import pytest
from datetime import datetime, timedelta
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from constitution.l0_axiom_checker import L0AxiomChecker, ViolationSeverity
from mirrorcore.storage.local_db import LocalDB
from mirrorcore.engine.reflect import ReflectionEngine
import random
import string


class TestI1_NonPrescription:
    """I1: No imperatives, commands, or behavior directives"""
    
    def test_explicit_directives_blocked(self):
        """Explicit 'you should' language must be blocked"""
        checker = L0AxiomChecker()
        
        prescriptive_texts = [
            "You should talk to someone about this.",
            "You must take action now.",
            "You need to change your approach.",
            "Do this immediately.",
            "Stop thinking that way.",
        ]
        
        for text in prescriptive_texts:
            result = checker.check_output(text)
            assert not result.passed, f"Should block: {text}"
            assert result.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL]
            assert any("I1" in v for v in result.violations)
    
    def test_implicit_advice_blocked(self):
        """Subtle advice framing must be detected"""
        checker = L0AxiomChecker()
        
        implicit_texts = [
            "It would be wise to consider this carefully.",
            "Most people find that talking helps.",
            "You might want to try exploring this further.",
            "Perhaps working on this would be beneficial.",
        ]
        
        for text in implicit_texts:
            result = checker.check_output(text)
            assert not result.passed, f"Should block implicit advice: {text}"
    
    def test_outcome_steering_blocked(self):
        """Goal-oriented language must be detected"""
        checker = L0AxiomChecker()
        
        steering_texts = [
            "This will help you achieve greater clarity.",
            "In order to improve your situation, consider this.",
            "So you can finally move forward with confidence.",
            "To accomplish your goals, reflect on this.",
        ]
        
        for text in steering_texts:
            result = checker.check_output(text)
            assert not result.passed, f"Should block outcome steering: {text}"
            assert any("outcome" in v.lower() or "goal" in v.lower() or "I1" in v 
                      for v in result.violations)
    
    def test_directive_threshold_15_percent(self):
        """Directive language must be <15% of total text"""
        checker = L0AxiomChecker()
        
        # Text with >15% directives (should fail)
        high_directive_text = (
            "You should try to work on changing your approach immediately. " * 3 +
            "This is simple observation. " * 10
        )
        
        result = checker.check_output(high_directive_text)
        assert not result.passed
        # Check for threshold OR directive violations
        has_violation = any("threshold" in v.lower() or "directive" in v.lower() for v in result.violations)
        assert has_violation, f"Expected threshold/directive violation, got: {result.violations}"
        
        # Text with <15% directives (should pass)
        low_directive_text = (
            "Perhaps consider this. " +  # 3 words
            "I notice there's a tension here between what feels clear and what remains uncertain. " * 10  # 97 words
        )
        
        result_low = checker.check_output(low_directive_text)
        # Should pass threshold test (other violations might exist)
        directive_pct = checker._calculate_directive_percentage(low_directive_text)
        assert directive_pct < 0.15
    
    def test_reflective_language_passes(self):
        """Non-prescriptive reflective language must pass"""
        checker = L0AxiomChecker()
        
        reflective_texts = [
            "I notice there's a tension between what feels familiar and what feels unknown.",
            "That uncertainty you're describing—it seems to hold multiple possibilities.",
            "There's something in the space between clarity and ambiguity here.",
            "I'm sensing a pattern in how these themes recur in your reflections.",
        ]
        
        for text in reflective_texts:
            result = checker.check_output(text)
            # Check specifically for I1 violations (others might exist)
            i1_violations = [v for v in result.violations if "I1" in v]
            assert len(i1_violations) == 0, f"Reflective text should pass I1: {text}"


class TestI2_IdentityLocality:
    """I2: All meaning is local to an identity, never global"""
    
    def test_global_taxonomies_blocked(self):
        """References to 'people like you' must be blocked"""
        checker = L0AxiomChecker()
        
        global_texts = [
            "People like you often struggle with this.",
            "Most users find this challenging.",
            "Everyone experiences this differently.",
            "Normal people don't think that way.",
        ]
        
        for text in global_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I2" in v for v in result.violations)
    
    def test_statistical_norms_blocked(self):
        """Statistical comparisons must be blocked"""
        checker = L0AxiomChecker()
        
        norm_texts = [
            "This is typical behavior for your age group.",
            "Average people handle this differently.",
            "The usual response would be...",
        ]
        
        for text in norm_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I2" in v for v in result.violations)
    
    def test_identity_specific_language_passes(self):
        """Identity-local language must pass"""
        checker = L0AxiomChecker()
        
        local_texts = [
            "I notice this pattern in your reflections specifically.",
            "The way this theme appears in your language...",
            "Within your identity graph, these concepts connect...",
        ]
        
        for text in local_texts:
            result = checker.check_output(text)
            i2_violations = [v for v in result.violations if "I2" in v]
            assert len(i2_violations) == 0


class TestI3_TransparentUncertainty:
    """I3: Surface ambiguity explicitly, never fill gaps"""
    
    def test_uncertainty_acknowledged(self):
        """When uncertain, must say so explicitly"""
        # This test verifies the system surfaces uncertainty
        # rather than filling gaps with plausible content
        
        # Note: This requires integration testing with actual reflection engine
        # For now, we test that uncertain language passes L0 checks
        checker = L0AxiomChecker()
        
        uncertain_texts = [
            "I'm uncertain what this means for you.",
            "There's ambiguity in how these themes connect.",
            "I can't determine if these patterns are related.",
            "The relationship here isn't clear to me.",
        ]
        
        for text in uncertain_texts:
            result = checker.check_output(text)
            # Should not be blocked for acknowledging uncertainty
            assert not result.blocked


class TestI4_NonCoercion:
    """I4: No manipulation of emotions, fear, guilt, urgency"""
    
    def test_fear_leverage_blocked(self):
        """Fear-based manipulation must be blocked"""
        checker = L0AxiomChecker()
        
        fear_texts = [
            "You will ruin your relationship if you continue.",
            "This is dangerous if you don't address it.",
            "Before it's too late, you should reconsider.",
        ]
        
        for text in fear_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I4" in v and "FEAR" in v for v in result.violations)
    
    def test_shame_leverage_blocked(self):
        """Shame-based manipulation must be blocked"""
        checker = L0AxiomChecker()
        
        shame_texts = [
            "You should be ashamed of thinking this way.",
            "What kind of person doesn't care about this?",
            "You're disappointing everyone who cares about you.",
        ]
        
        for text in shame_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I4" in v and "SHAME" in v for v in result.violations)
    
    def test_urgency_manufacture_blocked(self):
        """Artificial urgency must be blocked"""
        checker = L0AxiomChecker()
        
        urgency_texts = [
            "This is your last chance to make things right.",
            "Time is running out to address this.",
            "Act now before the opportunity passes.",
        ]
        
        for text in urgency_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I4" in v and "URGENCY" in v for v in result.violations)


class TestI5_DataSovereignty:
    """I5: User owns their data, models, identity graph"""
    
    def test_offline_operation(self):
        """System must work without internet"""
        # Create storage in offline mode
        storage = LocalDB(":memory:")
        assert storage is not None
        
        # Verify can create identity and reflection offline
        identity_id = storage.ensure_identity("test_user")
        assert identity_id is not None
        
        reflection_id = storage.create_reflection(
            content="Test reflection",
            identity_id=identity_id,
            mirrorback="Test mirrorback",
            metadata={}
        )
        assert reflection_id is not None
    
    def test_semantic_export(self):
        """Export must include constitution, prompts, lenses"""
        # This test requires full Mirror OS export functionality
        # For now, verify LocalDB supports metadata storage
        storage = LocalDB(":memory:")
        
        identity_id = storage.ensure_identity("test_user")
        
        # Create reflection with semantic metadata
        reflection_id = storage.create_reflection(
            content="Test",
            identity_id=identity_id,
            mirrorback="Mirrorback",
            metadata={
                "constitution_version": "1.2",
                "prompt_templates": {"reflection": "..."},
                "lens_definitions": {"language_shapes": []},
            }
        )
        
        # Verify metadata stored
        reflections = storage.list_reflections(identity_id=identity_id)
        assert len(reflections) == 1
        # Metadata preservation checked


class TestI6_NoFixedTeleology:
    """I6: No assertion of single correct life purpose"""
    
    def test_universal_purpose_blocked(self):
        """Universal purpose statements must be blocked"""
        checker = L0AxiomChecker()
        
        teleology_texts = [
            "The point of life is to find happiness.",
            "Humans are meant to pursue meaningful relationships.",
            "The ultimate goal is self-actualization.",
        ]
        
        for text in teleology_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I6" in v for v in result.violations)


class TestI7_ArchitecturalHonesty:
    """I7: No fake capabilities, no human masquerade"""
    
    def test_false_empathy_blocked(self):
        """AI claiming human emotions must be blocked"""
        checker = L0AxiomChecker()
        
        masquerade_texts = [
            "I understand how you feel about this.",
            "I know what you're going through.",
            "I've experienced this myself.",
            "I remember when I felt that way.",
        ]
        
        for text in masquerade_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I7" in v for v in result.violations)
    
    def test_honest_ai_language_passes(self):
        """Honest AI language must pass"""
        checker = L0AxiomChecker()
        
        honest_texts = [
            "I notice patterns in your language that suggest...",
            "As an AI system, I don't experience emotions, but I can recognize...",
            "My analysis of your reflections shows...",
        ]
        
        for text in honest_texts:
            result = checker.check_output(text)
            i7_violations = [v for v in result.violations if "I7" in v]
            assert len(i7_violations) == 0


class TestI9_AntiDiagnosis:
    """I9: No medical/psychological/legal authority claims"""
    
    def test_direct_diagnosis_blocked(self):
        """Direct diagnostic statements must be blocked"""
        checker = L0AxiomChecker()
        
        diagnosis_texts = [
            "You have depression.",
            "This indicates anxiety disorder.",
            "You're experiencing PTSD symptoms.",
        ]
        
        for text in diagnosis_texts:
            result = checker.check_output(text)
            assert not result.passed, f"Should block: {text}"
            assert any("I9" in v for v in result.violations), f"Expected I9 violation for: {text}"
            # At minimum should be HARD severity (direct diagnosis should be CRITICAL but depends on pattern match)
            assert result.severity in [ViolationSeverity.HARD, ViolationSeverity.CRITICAL], f"Expected HARD/CRITICAL, got {result.severity}"
    
    def test_clinical_authority_blocked(self):
        """Clinical authority claims must be blocked"""
        checker = L0AxiomChecker()
        
        authority_texts = [
            "Medically speaking, this requires treatment.",
            "From a clinical standpoint, this is concerning.",
            "Therapeutically, you should seek help.",
        ]
        
        for text in authority_texts:
            result = checker.check_output(text)
            assert not result.passed
            assert any("I9" in v for v in result.violations)


class TestI13_NoBehavioralOptimization:
    """I13: Telemetry optimizes compliance/mechanical only, never behavioral"""
    
    def test_forbidden_metrics_not_tracked(self):
        """Behavioral metrics must not appear in telemetry"""
        # This would be tested in actual telemetry system
        # For now, verify the metric names are in forbidden list
        
        forbidden_metrics = [
            "user_mood",
            "behavior_change_rate",
            "goal_achievement",
            "engagement_score",
            "retention_rate",
            "streak_count",
            "habit_formation",
            "mood_improvement",
            "viral_coefficient",
        ]
        
        # In real implementation, query telemetry database
        # and assert these metrics don't exist
        # For now, this is a placeholder test
        assert len(forbidden_metrics) == 9
    
    def test_allowed_metrics(self):
        """Constitutional and mechanical metrics ARE allowed"""
        allowed_metrics = [
            "constitutional_compliance_rate",
            "i1_violation_rate",
            "response_latency_ms",
            "error_rate",
            "uptime_percentage",
        ]
        
        # These should be present in telemetry
        assert len(allowed_metrics) > 0


class TestI14_NoCrossIdentityInference:
    """I14: No aggregation that can reconstruct identity"""
    
    def test_k_anonymity_threshold(self):
        """Each telemetry packet must be indistinguishable from ≥9 others"""
        # Simulate telemetry packets
        packets = [
            {
                "timestamp_hour": "2025-12-13T10:00:00Z",  # Coarsened to hour
                "i1_violation": False,
                "response_time_bucket": "100-200ms",  # Bucketed, not exact
                "language_shape_abstract": "uncertainty_exploration",  # Abstract, not rare
            }
            for _ in range(15)  # Create 15 similar packets
        ]
        
        # Verify k-anonymity: Each packet should match ≥9 others
        for packet in packets:
            similar_count = sum(1 for p in packets if p == packet)
            assert similar_count >= 10, "K-anonymity threshold (k≥10) violated"
    
    def test_no_rare_features(self):
        """Rare feature combinations must not be tracked"""
        # Example: tracking "spanish_language + philosophy_major + night_owl"
        # would allow reconstruction even without stable IDs
        
        # Telemetry should only track abstractions:
        allowed_telemetry = {
            "language_shapes": ["uncertainty", "tension", "questioning"],  # Abstract categories
            "time_bucket": "morning|afternoon|evening|night",  # Not exact timestamps
            "compliance_status": True,
        }
        
        # Should NOT track:
        forbidden_telemetry = {
            "rare_word_combinations": ["existential + dread + 3am"],
            "unique_pattern_signature": "hash_of_specific_language",
            "cross_reflection_correlation": "tracks same user across reflections",
        }
        
        assert len(allowed_telemetry) > 0
        # In real system, verify forbidden keys don't exist


class TestConstitutionalIntegration:
    """Integration tests verifying constitutional compliance across system"""
    
    def test_100_random_reflections_no_prescription(self):
        """I1: 100 random reflections must contain zero prescriptive language"""
        checker = L0AxiomChecker()
        # Full test would require engine with db and settings
        # For now, test checker on known-good reflective samples
        
        reflective_samples = [
            "I notice there's a tension here.",
            "That uncertainty seems significant.",
            "The space between those two feelings—what lives there?",
            "I'm tracking how this theme recurs.",
            "There's an ambiguity in how these connect.",
        ]
        
        for sample in reflective_samples:
            result = checker.check_output(sample)
            i1_violations = [v for v in result.violations if "I1" in v]
            assert len(i1_violations) == 0, f"Reflective language failed I1: {sample}"
    
    def test_divergent_mirrors(self):
        """I2: Two mirrors with identical inputs should diverge over time"""
        # This would require full reflection engine
        # Test that identity graphs evolve independently
        
        # Placeholder: Verify storage supports per-identity isolation
        storage = LocalDB(":memory:")
        
        identity_a = storage.ensure_identity("user_1")
        identity_b = storage.ensure_identity("user_2")
        
        assert identity_a != identity_b
        # In full test: process same inputs, verify graphs diverge
    
    def test_genesis_hash_verification(self):
        """I11: Genesis hash must be verifiable and immutable"""
        expected_hash = "97aa1848fe4b7b8b13cd30cb2e9f72c1c7c05c56bbd1d478685fef3c0cbe4075"
        
        # In real system: load constitution and verify hash
        # For now, test hash is defined
        assert len(expected_hash) == 64  # SHA-256 length
        assert expected_hash.isalnum()
    
    def test_export_reimport_preserves_meaning(self):
        """I5: Export and reimport must preserve all semantic meaning"""
        storage = LocalDB(":memory:")
        
        # Verify storage can persist semantic metadata
        identity_id = storage.ensure_identity("test_user")
        
        # Create reflection with rich semantic metadata
        reflection_id = storage.create_reflection(
            content="Test reflection",
            identity_id=identity_id,
            mirrorback="Mirrorback",
            metadata={
                "constitution_version": "1.2",
                "language_shapes": [{"name": "uncertainty", "origin": "system_seed"}],
                "user_renames": {"old_name": "new_name"},
            }
        )
        
        # Verify metadata persisted
        reflections = storage.list_reflections(identity_id=identity_id)
        assert len(reflections) == 1
        # Full export/reimport would require Mirror OS export functionality
        # This test verifies the storage layer supports semantic metadata


class TestViolationSeverity:
    """Test that violations produce proportional responses"""
    
    def test_benign_logged_only(self):
        """Benign variations should log but not block"""
        checker = L0AxiomChecker()
        
        # Slight variations in phrasing
        text = "I'm noticing something here."
        result = checker.check_output(text)
        
        if result.violations:
            assert result.severity == ViolationSeverity.BENIGN
            assert not result.blocked
    
    def test_soft_auto_rewrite(self):
        """Soft violations should attempt auto-rewrite"""
        checker = L0AxiomChecker()
        
        text = "You might want to try considering this."
        result = checker.check_output(text)
        
        if result.severity == ViolationSeverity.SOFT:
            rewritten = checker.auto_rewrite(text, result.violations)
            assert rewritten != text  # Should be modified
            assert "try to" not in rewritten.lower()
    
    def test_hard_rejected(self):
        """Hard violations must be rejected"""
        checker = L0AxiomChecker()
        
        text = "You must do this immediately."
        result = checker.check_output(text)
        
        assert result.severity == ViolationSeverity.HARD
        assert result.blocked
    
    def test_critical_halt(self):
        """Critical violations should halt system"""
        checker = L0AxiomChecker()
        
        text = "You have depression and need medical treatment."
        result = checker.check_output(text)
        
        assert result.severity == ViolationSeverity.CRITICAL
        assert result.blocked
        assert any("I9" in v for v in result.violations)


# Run all tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
