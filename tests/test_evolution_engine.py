"""
Tests for Evolution Engine - Phase 3 Task 1

Validates prompt evolution, signal detection, and constitutional compliance.
"""

import pytest
from datetime import datetime, timedelta
from mirror_os.core import (
    EvolutionEngine,
    PromptVersion,
    EvolutionSignal,
    GenerationMetrics,
    EvolutionLayer,
    ChangeType
)
from mirror_os.storage.sqlite_storage import SQLiteStorage


class TestEvolutionEngineBasics:
    """Test basic evolution engine functionality."""
    
    def test_engine_initialization(self, tmp_path):
        """Should initialize with storage."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        assert engine.storage == storage
        assert len(engine.prompt_versions) == 0
        assert len(engine.evolution_signals) == 0
        assert len(engine.generation_history) == 0
    
    def test_record_generation_success(self, tmp_path):
        """Should record generation metrics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=[],
            blocked=False,
            retry_count=0,
            quality_ratings={"resonance": 0.8, "fidelity": 0.9, "clarity": 0.85}
        )
        
        engine.record_generation(metrics)
        
        assert len(engine.generation_history) == 1
        assert engine.generation_history[0].reflection_id == "refl_1"
    
    def test_record_generation_with_violations(self, tmp_path):
        """Should detect evolution signals from violations."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE", "L0.1_PRESCRIPTION:IMPERATIVE"],
            blocked=True,
            retry_count=3
        )
        
        engine.record_generation(metrics)
        
        # Should generate evolution signals
        assert len(engine.evolution_signals) > 0
        
        # Should have constitutional strengthening signal
        constitutional_signals = [
            s for s in engine.evolution_signals 
            if s.signal_type == ChangeType.CONSTITUTIONAL_STRENGTHENING
        ]
        assert len(constitutional_signals) > 0


class TestPromptVersioning:
    """Test prompt version management."""
    
    def test_create_prompt_version(self, tmp_path):
        """Should create new prompt version."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        version = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="You are a reflection engine...",
            reason="Initial system prompt",
            created_by="system"
        )
        
        assert version.version_id in engine.prompt_versions
        assert version.layer == EvolutionLayer.L1_SAFETY
        assert version.active is True
        assert version.parent_version is None
    
    def test_create_child_version(self, tmp_path):
        """Should create child version and deactivate parent."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        v1 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="Original prompt",
            reason="Initial version",
            created_by="system"
        )
        
        v2 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="Improved prompt with stronger reflection language",
            reason="Strengthen constitutional compliance",
            created_by="system",
            parent_version=v1.version_id
        )
        
        assert v2.parent_version == v1.version_id
        assert v2.active is True
        assert v1.active is False  # Parent deactivated
    
    def test_get_active_prompt(self, tmp_path):
        """Should get active prompt for layer."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        v1 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="L1 prompt",
            reason="Safety prompt",
            created_by="system"
        )
        
        v2 = engine.create_prompt_version(
            layer=EvolutionLayer.L2_PHILOSOPHY,
            prompt_text="L2 prompt",
            reason="Philosophy prompt",
            created_by="system"
        )
        
        active_l1 = engine.get_active_prompt(EvolutionLayer.L1_SAFETY)
        active_l2 = engine.get_active_prompt(EvolutionLayer.L2_PHILOSOPHY)
        
        assert active_l1.version_id == v1.version_id
        assert active_l2.version_id == v2.version_id
    
    def test_update_prompt_metrics(self, tmp_path):
        """Should update prompt version metrics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        version = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="Test prompt",
            reason="Test",
            created_by="system"
        )
        
        success = engine.update_prompt_metrics(
            version.version_id,
            constitutional_score=0.95,
            quality_metrics={"resonance": 0.8, "fidelity": 0.9}
        )
        
        assert success is True
        assert version.constitutional_score == 0.95
        assert version.quality_metrics["resonance"] == 0.8
        assert version.quality_metrics["fidelity"] == 0.9
    
    def test_version_history(self, tmp_path):
        """Should track version history."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        v1 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V1",
            reason="Initial",
            created_by="system"
        )
        
        v2 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V2",
            reason="Improvement",
            created_by="system",
            parent_version=v1.version_id
        )
        
        history = engine.get_version_history(EvolutionLayer.L1_SAFETY)
        
        assert len(history) == 2
        assert history[0].version_id == v2.version_id  # Newest first
        assert history[1].version_id == v1.version_id
    
    def test_rollback_version(self, tmp_path):
        """Should rollback to previous version."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        v1 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V1",
            reason="Initial",
            created_by="system"
        )
        
        v2 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V2 (problematic)",
            reason="Attempted improvement",
            created_by="system",
            parent_version=v1.version_id
        )
        
        # V2 is active, V1 is inactive
        assert v2.active is True
        assert v1.active is False
        
        # Rollback to V1
        success = engine.rollback_to_version(v1.version_id)
        
        assert success is True
        assert v1.active is True
        assert v2.active is False


class TestEvolutionSignals:
    """Test evolution signal detection."""
    
    def test_constitutional_violation_signal(self, tmp_path):
        """Should generate signal for constitutional violations."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
            blocked=True,
            retry_count=1
        )
        
        engine.record_generation(metrics)
        
        # Should have constitutional strengthening signal
        signals = [
            s for s in engine.evolution_signals
            if s.signal_type == ChangeType.CONSTITUTIONAL_STRENGTHENING
        ]
        
        assert len(signals) > 0
        assert signals[0].layer == EvolutionLayer.L1_SAFETY
        assert signals[0].severity > 0
    
    def test_high_retry_signal(self, tmp_path):
        """Should generate signal for excessive retries."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"] * 3,
            blocked=False,
            retry_count=4  # High retry count
        )
        
        engine.record_generation(metrics)
        
        # Should have prompt refinement signal
        signals = [
            s for s in engine.evolution_signals
            if s.signal_type == ChangeType.PROMPT_REFINEMENT
        ]
        
        assert len(signals) > 0
        assert signals[0].evidence["retry_count"] == 4
    
    def test_low_quality_signal(self, tmp_path):
        """Should generate signal for low quality ratings."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=[],
            blocked=False,
            retry_count=0,
            quality_ratings={"resonance": 0.3, "fidelity": 0.4, "clarity": 0.35}
        )
        
        engine.record_generation(metrics)
        
        # Should have prompt refinement signal
        signals = [
            s for s in engine.evolution_signals
            if s.signal_type == ChangeType.PROMPT_REFINEMENT
        ]
        
        assert len(signals) > 0


class TestEvolutionAnalysis:
    """Test evolution needs analysis."""
    
    def test_insufficient_samples(self, tmp_path):
        """Should indicate when insufficient samples for analysis."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Only add 5 samples
        for i in range(5):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0
            )
            engine.record_generation(metrics)
        
        analysis = engine.analyze_evolution_needs(min_samples=10)
        
        assert analysis["ready"] is False
        assert analysis["samples_collected"] == 5
    
    def test_high_compliance_rate(self, tmp_path):
        """Should recognize high compliance rate."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add 15 samples with no violations
        for i in range(15):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0,
                quality_ratings={"resonance": 0.85, "fidelity": 0.9, "clarity": 0.88}
            )
            engine.record_generation(metrics)
        
        analysis = engine.analyze_evolution_needs(min_samples=10)
        
        assert analysis["ready"] is True
        assert analysis["metrics"]["constitutional_compliance_rate"] > 0.95
        assert len(analysis["recommendations"]) == 0  # No issues detected
    
    def test_low_compliance_triggers_recommendation(self, tmp_path):
        """Should recommend improvements for low compliance."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add samples with many violations
        for i in range(15):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE", "L0.1_PRESCRIPTION:IMPERATIVE"],
                blocked=True,
                retry_count=2
            )
            engine.record_generation(metrics)
        
        analysis = engine.analyze_evolution_needs(min_samples=10)
        
        assert analysis["ready"] is True
        assert analysis["metrics"]["constitutional_compliance_rate"] < 0.90
        
        # Should have critical recommendation
        critical_recs = [
            r for r in analysis["recommendations"]
            if r["priority"] == "critical"
        ]
        assert len(critical_recs) > 0
        assert critical_recs[0]["layer"] == EvolutionLayer.L1_SAFETY.value
    
    def test_high_retries_triggers_recommendation(self, tmp_path):
        """Should recommend improvements for excessive retries."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add samples with high retry counts
        for i in range(15):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
                blocked=False,
                retry_count=3  # High retry count
            )
            engine.record_generation(metrics)
        
        analysis = engine.analyze_evolution_needs(min_samples=10)
        
        assert analysis["metrics"]["average_retries"] > 2.0
        
        # Should have high priority recommendation
        high_recs = [
            r for r in analysis["recommendations"]
            if r["priority"] == "high"
        ]
        assert len(high_recs) > 0
    
    def test_per_mirror_analysis(self, tmp_path):
        """Should analyze per-mirror when mirror_id provided."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add samples for mirror_1
        for i in range(10):
            metrics = GenerationMetrics(
                reflection_id=f"refl_1_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0
            )
            engine.record_generation(metrics)
        
        # Add samples for mirror_2
        for i in range(5):
            metrics = GenerationMetrics(
                reflection_id=f"refl_2_{i}",
                mirror_id="mirror_2",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"] * 3,
                blocked=True,
                retry_count=3
            )
            engine.record_generation(metrics)
        
        # Analyze mirror_1 only
        analysis_1 = engine.analyze_evolution_needs(mirror_id="mirror_1", min_samples=10)
        
        assert analysis_1["ready"] is True
        assert analysis_1["samples_analyzed"] == 10
        assert analysis_1["metrics"]["constitutional_compliance_rate"] > 0.95
        
        # Analyze mirror_2 only (insufficient samples)
        analysis_2 = engine.analyze_evolution_needs(mirror_id="mirror_2", min_samples=10)
        
        assert analysis_2["ready"] is False
        assert analysis_2["samples_collected"] == 5


class TestConstitutionalCompliance:
    """Test I11, I13, I2 constitutional guarantees."""
    
    def test_i11_version_history_immutable(self, tmp_path):
        """I11: All versions preserved, audit trail maintained."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        v1 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V1",
            reason="Initial",
            created_by="system"
        )
        
        v2 = engine.create_prompt_version(
            layer=EvolutionLayer.L1_SAFETY,
            prompt_text="V2",
            reason="Improvement",
            created_by="system",
            parent_version=v1.version_id
        )
        
        # Both versions still exist
        assert v1.version_id in engine.prompt_versions
        assert v2.version_id in engine.prompt_versions
        
        # Audit trail preserved
        assert v2.parent_version == v1.version_id
        assert v1.parent_version is None
        
        # Can get full history
        history = engine.get_version_history(EvolutionLayer.L1_SAFETY)
        assert len(history) == 2
    
    def test_i13_no_behavioral_optimization(self, tmp_path):
        """I13: Evolution based on compliance, not user behavior."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # GenerationMetrics should NOT have sentiment/engagement fields
        metrics = GenerationMetrics(
            reflection_id="refl_1",
            mirror_id="mirror_1",
            constitutional_violations=[],
            blocked=False,
            retry_count=0,
            quality_ratings={"resonance": 0.8, "fidelity": 0.9, "clarity": 0.85}
        )
        
        # Verify no sentiment/engagement tracking
        assert not hasattr(metrics, 'user_sentiment')
        assert not hasattr(metrics, 'engagement_score')
        assert not hasattr(metrics, 'time_spent')
        
        # Verify signals based on compliance only
        metrics_with_violations = GenerationMetrics(
            reflection_id="refl_2",
            mirror_id="mirror_1",
            constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
            blocked=True,
            retry_count=2
        )
        
        engine.record_generation(metrics_with_violations)
        
        # Signals should be about constitutional violations
        for signal in engine.evolution_signals:
            assert signal.signal_type in [
                ChangeType.CONSTITUTIONAL_STRENGTHENING,
                ChangeType.PROMPT_REFINEMENT,
                ChangeType.REGRESSION_FIX
            ]
    
    def test_i2_per_mirror_scoping(self, tmp_path):
        """I2: Evolution can be per-mirror, data never cross-identifies."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add samples for different mirrors
        for i in range(10):
            metrics = GenerationMetrics(
                reflection_id=f"refl_1_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0
            )
            engine.record_generation(metrics)
        
        for i in range(10):
            metrics = GenerationMetrics(
                reflection_id=f"refl_2_{i}",
                mirror_id="mirror_2",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
                blocked=True,
                retry_count=2
            )
            engine.record_generation(metrics)
        
        # Per-mirror analysis should be isolated
        analysis_1 = engine.analyze_evolution_needs(mirror_id="mirror_1", min_samples=10)
        analysis_2 = engine.analyze_evolution_needs(mirror_id="mirror_2", min_samples=10)
        
        # Mirror 1 should show high compliance
        assert analysis_1["metrics"]["total_violations"] == 0
        
        # Mirror 2 should show low compliance
        assert analysis_2["metrics"]["total_violations"] > 0
        
        # Analyses should be independent
        assert analysis_1["samples_analyzed"] == 10
        assert analysis_2["samples_analyzed"] == 10


class TestStatistics:
    """Test evolution statistics."""
    
    def test_system_wide_statistics(self, tmp_path):
        """Should calculate system-wide statistics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        # Add samples across multiple mirrors
        for i in range(5):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0
            )
            engine.record_generation(metrics)
        
        for i in range(5):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_2",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
                blocked=True,
                retry_count=2
            )
            engine.record_generation(metrics)
        
        stats = engine.get_statistics()
        
        assert stats["total_generations"] == 10
        assert stats["blocked_generations"] == 5
        assert stats["total_violations"] == 5
        assert stats["total_retries"] == 10
    
    def test_per_mirror_statistics(self, tmp_path):
        """Should calculate per-mirror statistics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        engine = EvolutionEngine(storage)
        
        for i in range(5):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_1",
                constitutional_violations=[],
                blocked=False,
                retry_count=0
            )
            engine.record_generation(metrics)
        
        for i in range(3):
            metrics = GenerationMetrics(
                reflection_id=f"refl_{i}",
                mirror_id="mirror_2",
                constitutional_violations=["L0.1_PRESCRIPTION:DIRECTIVE"],
                blocked=True,
                retry_count=2
            )
            engine.record_generation(metrics)
        
        stats_1 = engine.get_statistics(mirror_id="mirror_1")
        stats_2 = engine.get_statistics(mirror_id="mirror_2")
        
        assert stats_1["total_generations"] == 5
        assert stats_1["blocked_generations"] == 0
        
        assert stats_2["total_generations"] == 3
        assert stats_2["blocked_generations"] == 3
