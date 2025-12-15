"""
Tests for Mirror Orchestrator - Phase 3 Task 3

Validates end-to-end orchestrated generation flow.
"""

import pytest
from mirror_os.core import (
    MirrorOrchestrator,
    OrchestratedGeneration,
    GenerationStatus,
    MirrorbackGenerator,
    LanguageShapeDetector,
    TensionTracker,
    GraphManager,
    EvolutionEngine
)
from mirror_os.llm.base import BaseLLM, LLMProvider
from mirror_os.storage.sqlite_storage import SQLiteStorage


class MockLLM(BaseLLM):
    """Mock LLM for testing."""
    
    def __init__(self):
        from mirror_os.llm.base import LLMConfig
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="mock",
            works_offline=True,
            requires_network=False
        )
        super().__init__(config)
        self.call_count = 0
        self.responses = []
    
    def is_available(self) -> bool:
        return True
    
    def generate(self, prompt: str, mirror_id: str, **kwargs):
        from mirror_os.llm.base import LLMResponse
        self.call_count += 1
        content = self.responses.pop(0) if self.responses else "I hear the uncertainty in your reflection. The not-knowing itself holds wisdom."
        return LLMResponse(content=content, model="mock")
    
    def get_model_info(self) -> dict:
        return {"model": "mock", "provider": "test"}


class TestOrchestratorBasics:
    """Test basic orchestrator functionality."""
    
    def test_orchestrator_initialization(self, tmp_path):
        """Should initialize with all components."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        
        orchestrator = MirrorOrchestrator(storage, generator)
        
        assert orchestrator.storage == storage
        assert orchestrator.generator == generator
        assert isinstance(orchestrator.shape_detector, LanguageShapeDetector)
        assert isinstance(orchestrator.tension_tracker, TensionTracker)
        assert isinstance(orchestrator.graph_manager, GraphManager)
        assert isinstance(orchestrator.evolution_engine, EvolutionEngine)
    
    def test_orchestrator_with_custom_components(self, tmp_path):
        """Should accept custom component instances."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        
        custom_detector = LanguageShapeDetector()
        custom_tracker = TensionTracker()
        
        orchestrator = MirrorOrchestrator(
            storage, generator,
            shape_detector=custom_detector,
            tension_tracker=custom_tracker
        )
        
        assert orchestrator.shape_detector == custom_detector
        assert orchestrator.tension_tracker == custom_tracker


class TestEndToEndGeneration:
    """Test complete orchestrated generation flow."""
    
    def test_successful_generation(self, tmp_path):
        """Should complete full generation pipeline."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="I feel uncertain about what path to take",
            mirror_id="mirror_1"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        assert result.mirrorback_text is not None
        assert result.mirror_id == "mirror_1"
        assert not result.blocked
    
    def test_generates_with_shape_detection(self, tmp_path):
        """Should detect language shapes during generation."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="I'm not sure what to do. Everything feels uncertain.",
            mirror_id="mirror_1"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        assert len(result.detected_shapes) > 0
        # Should detect uncertainty shape
        shape_names = [s.shape_name for s in result.detected_shapes]
        assert "uncertainty" in shape_names
    
    def test_generates_with_tension_measurement(self, tmp_path):
        """Should measure tensions during generation."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="I want to control everything, to make sure it all works out perfectly.",
            mirror_id="mirror_1"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        assert len(result.tension_measurements) > 0
        # Should detect control tension
        axis_names = [t.axis_name for t in result.tension_measurements]
        assert "control-surrender" in axis_names
    
    def test_updates_graph_on_success(self, tmp_path):
        """Should add nodes to graph on successful generation."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        assert len(result.new_graph_nodes) > 0
        # Verify node actually added
        node = orchestrator.graph_manager.get_node(result.new_graph_nodes[0])
        assert node is not None
        assert node.mirror_id == "mirror_1"
    
    def test_records_evolution_metrics(self, tmp_path):
        """Should record metrics for evolution engine."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        # Check evolution engine recorded it
        stats = orchestrator.evolution_engine.get_statistics("mirror_1")
        assert stats["generation_count"] > 0


class TestContextEnrichment:
    """Test context enrichment features."""
    
    def test_uses_related_reflections_as_context(self, tmp_path):
        """Should include related reflections in context."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Generate first reflection
        result1 = orchestrator.generate_with_context(
            reflection_text="I feel very uncertain about my decisions",
            mirror_id="mirror_1"
        )
        
        # Generate second with similar theme
        result2 = orchestrator.generate_with_context(
            reflection_text="I'm not sure what path to choose",
            mirror_id="mirror_1"
        )
        
        assert result2.status == GenerationStatus.SUCCESS
        # Should detect both have uncertainty shape, potentially link them
        assert len(result2.detected_shapes) > 0
    
    def test_includes_additional_context(self, tmp_path):
        """Should incorporate additional context when provided."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="I'm feeling stuck",
            mirror_id="mirror_1",
            additional_context="Recent life change: started new job"
        )
        
        assert result.status == GenerationStatus.SUCCESS
        # Context should be used in generation
        assert result.mirrorback_text is not None


class TestConstitutionalCompliance:
    """Test I2, I9, I13, I14 guarantees."""
    
    def test_i2_requires_mirror_id(self, tmp_path):
        """I2: All operations require mirror_id."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        with pytest.raises(ValueError, match="I2"):
            orchestrator.generate_with_context(
                reflection_text="Test",
                mirror_id=""  # Empty mirror_id
            )
    
    def test_i2_all_operations_scoped_to_mirror(self, tmp_path):
        """I2: All enrichment operations scoped to mirror."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Generate for mirror_1
        result1 = orchestrator.generate_with_context(
            reflection_text="Mirror 1 reflection",
            mirror_id="mirror_1"
        )
        
        # Generate for mirror_2
        result2 = orchestrator.generate_with_context(
            reflection_text="Mirror 2 reflection",
            mirror_id="mirror_2"
        )
        
        # Both should succeed but be independent
        assert result1.status == GenerationStatus.SUCCESS
        assert result2.status == GenerationStatus.SUCCESS
        assert result1.mirror_id == "mirror_1"
        assert result2.mirror_id == "mirror_2"
        # Should not have graph context from other mirror
        assert result2.graph_context == [] or all(
            nid.startswith("reflection_") for nid in result2.graph_context
        )
    
    def test_i9_no_diagnostic_language(self, tmp_path):
        """I9: No diagnostic language in any component."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="I feel anxious and uncertain",
            mirror_id="mirror_1"
        )
        
        # Shapes and tensions should have disclaimers
        for shape in result.detected_shapes:
            assert shape.disclaimer
            forbidden = ["disorder", "pathology", "symptom", "disease"]
            assert not any(term in shape.shape_name.lower() for term in forbidden)
        
        for tension in result.tension_measurements:
            assert tension.axis_name
            # Tension axes should be descriptive
            forbidden = ["dysfunction", "pathology", "disorder"]
            assert not any(term in tension.axis_name.lower() for term in forbidden)
    
    def test_i13_evolution_tracks_compliance_not_behavior(self, tmp_path):
        """I13: Evolution tracks constitutional compliance, not behavior."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1"
        )
        
        # Check evolution analysis
        analysis = orchestrator.analyze_generation_quality("mirror_1", lookback_count=5)
        
        assert "constitutional_health" in analysis
        # Should track compliance rate, not sentiment
        if analysis["constitutional_health"]:
            assert "compliance_rate" in analysis["constitutional_health"]
            assert "sentiment" not in analysis["constitutional_health"]
            assert "engagement" not in analysis["constitutional_health"]
    
    def test_i14_no_cross_mirror_statistics(self, tmp_path):
        """I14: Statistics never aggregate across mirrors."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Generate for two mirrors
        orchestrator.generate_with_context("Test 1", "mirror_1")
        orchestrator.generate_with_context("Test 2", "mirror_2")
        
        # Get per-mirror stats
        stats1 = orchestrator.get_generation_statistics("mirror_1")
        stats2 = orchestrator.get_generation_statistics("mirror_2")
        
        # Should be separate
        assert stats1["mirror_id"] == "mirror_1"
        assert stats2["mirror_id"] == "mirror_2"
        # Should not show each other's data
        assert stats1 != stats2


class TestErrorHandling:
    """Test error handling and resilience."""
    
    def test_continues_on_shape_detection_failure(self, tmp_path):
        """Should continue generation if shape detection fails."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Force shape detector to fail
        orchestrator.shape_detector = None
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1"
        )
        
        # Should still succeed without shapes
        assert result.status in [GenerationStatus.SUCCESS, GenerationStatus.PARTIAL]
        assert len(result.detected_shapes) == 0
    
    def test_continues_on_graph_update_failure(self, tmp_path):
        """Should complete generation even if graph update fails."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Force graph manager to fail
        orchestrator.graph_manager = None
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1"
        )
        
        # Should still succeed without graph updates
        assert result.status in [GenerationStatus.SUCCESS, GenerationStatus.PARTIAL]
        assert len(result.new_graph_nodes) == 0
    
    def test_handles_blocked_generation(self, tmp_path):
        """Should handle blocked generations gracefully."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        # Set response that will be blocked
        llm.responses = [
            "You should definitely do X to fix your problem.",  # Directive
            "You must take action Y right away.",  # Imperative
            "This will definitely make you feel better."  # Outcome steering
        ]
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        result = orchestrator.generate_with_context(
            reflection_text="Test reflection",
            mirror_id="mirror_1",
            max_retries=2
        )
        
        assert result.status == GenerationStatus.BLOCKED
        assert result.blocked
        assert result.blocked_reason
        assert result.retry_count >= 1


class TestStatisticsAndAnalysis:
    """Test statistics and analysis features."""
    
    def test_get_generation_statistics_per_mirror(self, tmp_path):
        """Should get statistics for specific mirror."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        orchestrator.generate_with_context("Test", "mirror_1")
        
        stats = orchestrator.get_generation_statistics("mirror_1")
        
        assert stats["mirror_id"] == "mirror_1"
        assert "graph" in stats
        assert "evolution" in stats
    
    def test_analyze_generation_quality(self, tmp_path):
        """Should analyze generation quality for mirror."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Generate multiple reflections
        for i in range(3):
            orchestrator.generate_with_context(f"Test {i}", "mirror_1")
        
        analysis = orchestrator.analyze_generation_quality("mirror_1", lookback_count=3)
        
        assert analysis["mirror_id"] == "mirror_1"
        assert "constitutional_health" in analysis
        assert "evolution_recommendations" in analysis
    
    def test_quality_analysis_requires_mirror_id(self, tmp_path):
        """I2: Quality analysis requires mirror_id."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        with pytest.raises(ValueError, match="I2"):
            orchestrator.analyze_generation_quality("", lookback_count=5)


class TestGraphIntegration:
    """Test graph integration."""
    
    def test_creates_edges_between_similar_reflections(self, tmp_path):
        """Should create edges between reflections with similar shapes."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Generate reflections with similar themes
        result1 = orchestrator.generate_with_context(
            reflection_text="I feel so uncertain about everything",
            mirror_id="mirror_1"
        )
        
        result2 = orchestrator.generate_with_context(
            reflection_text="I'm not sure what to do, everything is uncertain",
            mirror_id="mirror_1"
        )
        
        # Second should potentially link to first
        assert result1.status == GenerationStatus.SUCCESS
        assert result2.status == GenerationStatus.SUCCESS
        
        # Check if edges were created
        if result2.new_graph_edges:
            # Should be within same mirror
            for from_id, to_id, edge_type in result2.new_graph_edges:
                from_node = orchestrator.graph_manager.get_node(from_id)
                to_node = orchestrator.graph_manager.get_node(to_id)
                assert from_node.mirror_id == "mirror_1"
                assert to_node.mirror_id == "mirror_1"
