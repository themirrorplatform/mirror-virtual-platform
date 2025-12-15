"""
Mirror Orchestrator - Phase 3 Task 3

Coordinates complete generation flow integrating all Phase 2-3 components:
- Language shape detection
- Tension measurement
- Graph context retrieval
- Mirrorback generation with enriched context
- Graph updates
- Evolution metrics recording

Constitutional Guarantees:
- I2: All operations scoped to single mirror_id
- I9: No diagnostic language throughout pipeline
- I13: Evolution tracks compliance, not behavior
- I14: No cross-identity inference
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, List, Any
from enum import Enum

from mirror_os.storage.base import MirrorStorage
from .mirrorback_generator import MirrorbackGenerator
from .language_shapes import LanguageShapeDetector, ShapeOccurrence
from .tension_tracker import TensionTracker, TensionMeasurement
from .graph_manager import GraphManager, GraphNode, GraphEdge, EdgeType
from .evolution_engine import EvolutionEngine, GenerationMetrics


class GenerationStatus(Enum):
    """Status of orchestrated generation."""
    SUCCESS = "success"
    BLOCKED = "blocked"
    ERROR = "error"
    PARTIAL = "partial"  # Some components succeeded, others failed


@dataclass
class OrchestratedGeneration:
    """Complete result bundle from orchestrated generation."""
    
    # Core generation
    reflection_id: str
    reflection_text: str
    mirror_id: str
    mirrorback_text: Optional[str] = None
    
    # Status
    status: GenerationStatus = GenerationStatus.SUCCESS
    error_message: Optional[str] = None
    
    # Enrichment data
    detected_shapes: List[ShapeOccurrence] = field(default_factory=list)
    tension_measurements: List[TensionMeasurement] = field(default_factory=list)
    graph_context: List[str] = field(default_factory=list)  # Related reflection IDs
    
    # Constitutional
    constitutional_violations: List[str] = field(default_factory=list)
    blocked: bool = False
    blocked_reason: Optional[str] = None
    
    # Metadata
    generated_at: datetime = field(default_factory=datetime.now)
    retry_count: int = 0
    
    # Graph updates
    new_graph_nodes: List[str] = field(default_factory=list)  # Node IDs added
    new_graph_edges: List[tuple] = field(default_factory=list)  # (from, to, type)
    new_themes: List[str] = field(default_factory=list)  # Theme IDs detected


class MirrorOrchestrator:
    """
    Coordinates complete mirror generation flow.
    
    Integrates all Phase 2-3 components into cohesive pipeline:
    1. Detect language shapes in reflection
    2. Measure tension positions
    3. Query graph for similar/related reflections
    4. Generate mirrorback with enriched context
    5. Add reflection to identity graph
    6. Record metrics for evolution
    7. Return complete bundle
    
    Constitutional Guarantees:
    - I2: All operations require mirror_id, never cross-identity
    - I9: No diagnostic terms throughout pipeline
    - I13: Evolution based on compliance, not sentiment
    - I14: No cross-mirror aggregation
    """
    
    def __init__(
        self,
        storage: MirrorStorage,
        generator: MirrorbackGenerator,
        shape_detector: Optional[LanguageShapeDetector] = None,
        tension_tracker: Optional[TensionTracker] = None,
        graph_manager: Optional[GraphManager] = None,
        evolution_engine: Optional[EvolutionEngine] = None
    ):
        """
        Initialize orchestrator with required and optional components.
        
        Args:
            storage: Storage backend (required)
            generator: Mirrorback generator (required)
            shape_detector: Language shape detector (optional, created if None)
            tension_tracker: Tension tracker (optional, created if None)
            graph_manager: Graph manager (optional, created if None)
            evolution_engine: Evolution engine (optional, created if None)
        """
        self.storage = storage
        self.generator = generator
        
        # Initialize optional components
        self.shape_detector = shape_detector or LanguageShapeDetector()
        self.tension_tracker = tension_tracker or TensionTracker()
        self.graph_manager = graph_manager or GraphManager(storage)
        self.evolution_engine = evolution_engine or EvolutionEngine(storage)
    
    def generate_with_context(
        self,
        reflection_text: str,
        mirror_id: str,
        additional_context: Optional[str] = None,
        max_retries: int = 3
    ) -> OrchestratedGeneration:
        """
        Generate mirrorback with full context enrichment.
        
        Flow:
        1. Validate input (I2: mirror_id required)
        2. Detect language shapes
        3. Measure tensions
        4. Query graph for related reflections
        5. Build enriched context
        6. Generate mirrorback
        7. Update graph (add nodes/edges)
        8. Record evolution metrics
        9. Return complete bundle
        
        Args:
            reflection_text: User's reflection text
            mirror_id: Identity scope (I2 required)
            additional_context: Optional extra context
            max_retries: Max constitutional retry attempts
        
        Returns:
            OrchestratedGeneration with complete result bundle
        """
        if not mirror_id:
            raise ValueError("I2: mirror_id required for all operations")
        
        # Create base result
        reflection_id = f"reflection_{datetime.now().timestamp()}"
        result = OrchestratedGeneration(
            reflection_id=reflection_id,
            reflection_text=reflection_text,
            mirror_id=mirror_id
        )
        
        try:
            # Step 1: Detect language shapes (I9: descriptive only)
            shapes = self._detect_shapes(reflection_text, mirror_id)
            result.detected_shapes = shapes
            
            # Step 2: Measure tensions (I9: descriptive only)
            tensions = self._measure_tensions(reflection_text, mirror_id)
            result.tension_measurements = tensions
            
            # Step 3: Query graph for related reflections (I2: same mirror only)
            related_ids = self._get_related_reflections(
                reflection_text, mirror_id, shapes, tensions
            )
            result.graph_context = related_ids
            
            # Step 4: Build enriched context
            enriched_context = self._build_enriched_context(
                reflection_text, related_ids, shapes, tensions, additional_context
            )
            
            # Step 5: Generate mirrorback with retries
            generation_result = self.generator.generate(
                reflection_text=reflection_text,
                mirror_id=mirror_id,
                context=enriched_context,
                max_retries=max_retries
            )
            
            # Update result with generation outcome
            result.mirrorback_text = generation_result.mirrorback_text
            result.constitutional_violations = generation_result.constitutional_violations
            result.blocked = generation_result.blocked
            result.blocked_reason = generation_result.blocked_reason
            result.retry_count = generation_result.retry_count
            
            if result.blocked:
                result.status = GenerationStatus.BLOCKED
            else:
                result.status = GenerationStatus.SUCCESS
                
                # Step 6: Update graph (only on success)
                graph_updates = self._update_graph(
                    reflection_id, reflection_text, mirror_id, shapes, tensions
                )
                result.new_graph_nodes = graph_updates["nodes"]
                result.new_graph_edges = graph_updates["edges"]
                result.new_themes = graph_updates["themes"]
                
                # Step 7: Record evolution metrics (I13: compliance only)
                self._record_evolution_metrics(result)
        
        except Exception as e:
            result.status = GenerationStatus.ERROR
            result.error_message = str(e)
        
        return result
    
    def _detect_shapes(
        self, reflection_text: str, mirror_id: str
    ) -> List[ShapeOccurrence]:
        """
        Detect language shapes in reflection.
        
        I9: Shapes are descriptive, not diagnostic.
        I2: Detection scoped to mirror_id.
        """
        try:
            shapes = self.shape_detector.detect_shapes(reflection_text)
            
            # Store detections (I2: with mirror_id)
            for shape in shapes:
                self.shape_detector.record_detection(
                    mirror_id=mirror_id,
                    shape_name=shape.shape_name,
                    context=shape.context
                )
            
            return shapes
        except Exception:
            return []  # Non-critical, continue without shapes
    
    def _measure_tensions(
        self, reflection_text: str, mirror_id: str
    ) -> List[TensionMeasurement]:
        """
        Measure tension positions in reflection.
        
        I9: Tensions are descriptive positions, not judgments.
        I2: Measurements scoped to mirror_id.
        """
        try:
            tensions = self.tension_tracker.measure_all_tensions(
                reflection_text, mirror_id
            )
            return [t for t in tensions if t is not None]
        except Exception:
            return []  # Non-critical, continue without tensions
    
    def _get_related_reflections(
        self,
        reflection_text: str,
        mirror_id: str,
        shapes: List[ShapeOccurrence],
        tensions: List[TensionMeasurement]
    ) -> List[str]:
        """
        Query graph for related reflections.
        
        I2: Only returns reflections from same mirror.
        I14: Never cross-identity inference.
        
        Strategy:
        - Find nodes with similar language shapes
        - Find nodes with similar tension positions
        - Return top matches
        """
        try:
            related = set()
            
            # Get all reflection nodes for this mirror (I2)
            mirror_nodes = [
                node for node in self.graph_manager.nodes.values()
                if node.mirror_id == mirror_id and node.node_type == "reflection"
            ]
            
            # Simple similarity: shared language shapes
            if shapes:
                shape_names = {s.shape_name for s in shapes}
                for node in mirror_nodes:
                    node_shapes = node.metadata.get("shapes", []) if node.metadata else []
                    if any(s in shape_names for s in node_shapes):
                        related.add(node.node_id)
            
            # Return limited set (top 5 most related)
            return list(related)[:5]
        
        except Exception:
            return []  # Non-critical, continue without context
    
    def _build_enriched_context(
        self,
        reflection_text: str,
        related_ids: List[str],
        shapes: List[ShapeOccurrence],
        tensions: List[TensionMeasurement],
        additional_context: Optional[str]
    ) -> str:
        """
        Build enriched context string for generation.
        
        Includes:
        - Related reflection texts
        - Detected language shapes
        - Measured tensions
        - Additional context if provided
        
        I9: All descriptions non-diagnostic.
        """
        context_parts = []
        
        # Add related reflections
        if related_ids:
            context_parts.append("Similar past reflections:")
            for rid in related_ids[:3]:  # Limit to 3
                # In real implementation, fetch from storage
                context_parts.append(f"- [Related: {rid}]")
        
        # Add detected shapes (I9: with disclaimers)
        if shapes:
            context_parts.append("\nDetected patterns (descriptive only, not diagnostic):")
            for shape in shapes[:3]:  # Limit to 3
                context_parts.append(f"- {shape.shape_name}")
        
        # Add tensions (I9: with disclaimers)
        if tensions:
            context_parts.append("\nTension positions (descriptive, not evaluative):")
            for tension in tensions[:3]:  # Limit to 3
                position_desc = "center" if abs(tension.position) < 0.3 else tension.position
                context_parts.append(
                    f"- {tension.axis_name}: {position_desc}"
                )
        
        # Add additional context
        if additional_context:
            context_parts.append(f"\nAdditional context:\n{additional_context}")
        
        return "\n".join(context_parts) if context_parts else ""
    
    def _update_graph(
        self,
        reflection_id: str,
        reflection_text: str,
        mirror_id: str,
        shapes: List[ShapeOccurrence],
        tensions: List[TensionMeasurement]
    ) -> Dict[str, List]:
        """
        Update identity graph with new reflection.
        
        I2: All nodes/edges scoped to mirror_id.
        I9: No diagnostic language in node metadata.
        
        Returns dict with:
        - nodes: List of added node IDs
        - edges: List of added edges (from, to, type)
        - themes: List of detected theme IDs
        """
        updates = {
            "nodes": [],
            "edges": [],
            "themes": []
        }
        
        try:
            # Add reflection node
            node = GraphNode(
                node_id=reflection_id,
                mirror_id=mirror_id,
                node_type="reflection",
                content=reflection_text[:500],  # Truncate for storage
                metadata={
                    "shapes": [s.shape_name for s in shapes],
                    "tensions": {
                        t.axis_name: t.position for t in tensions
                    }
                }
            )
            
            if self.graph_manager.add_node(node):
                updates["nodes"].append(reflection_id)
            
            # Add edges to similar nodes (simple: same shapes)
            if shapes:
                shape_names = {s.shape_name for s in shapes}
                for existing_node in self.graph_manager.nodes.values():
                    if (existing_node.mirror_id == mirror_id and 
                        existing_node.node_id != reflection_id and
                        existing_node.node_type == "reflection"):
                        
                        existing_shapes = existing_node.metadata.get("shapes", []) if existing_node.metadata else []
                        shared = len(shape_names.intersection(set(existing_shapes)))
                        
                        if shared >= 2:  # At least 2 shared shapes
                            edge = GraphEdge(
                                from_node=reflection_id,
                                to_node=existing_node.node_id,
                                edge_type=EdgeType.SIMILAR,
                                weight=shared / len(shape_names)
                            )
                            if self.graph_manager.add_edge(edge):
                                updates["edges"].append((
                                    reflection_id,
                                    existing_node.node_id,
                                    "similar"
                                ))
            
            # Detect themes (I9: non-diagnostic)
            themes = self.graph_manager.detect_themes(
                mirror_id, min_nodes=3, min_confidence=0.4
            )
            updates["themes"] = [t.theme_id for t in themes]
        
        except Exception:
            pass  # Non-critical, continue without graph updates
        
        return updates
    
    def _record_evolution_metrics(self, result: OrchestratedGeneration) -> None:
        """
        Record generation metrics for evolution.
        
        I13: Records constitutional compliance, NOT sentiment/behavior.
        I2: Scoped to mirror_id.
        """
        try:
            metrics = GenerationMetrics(
                reflection_id=result.reflection_id,
                mirror_id=result.mirror_id,
                constitutional_violations=result.constitutional_violations,
                blocked=result.blocked,
                retry_count=result.retry_count,
                quality_ratings={},  # I13: No sentiment ratings
                patterns_detected=[s.shape_name for s in result.detected_shapes]
            )
            
            self.evolution_engine.record_generation(metrics)
        except Exception:
            pass  # Non-critical, continue without evolution tracking
    
    def get_generation_statistics(
        self, mirror_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get statistics across all orchestrator components.
        
        I2: Per-mirror if mirror_id provided, system-wide otherwise.
        I14: Never aggregates across identities.
        
        Returns:
            Dict with statistics from each component
        """
        stats = {
            "mirror_id": mirror_id,
            "shapes": {},
            "tensions": {},
            "graph": {},
            "evolution": {}
        }
        
        try:
            # Language shapes stats (I14: per-mirror)
            if mirror_id:
                stats["shapes"] = self.shape_detector.get_shape_statistics(mirror_id)
            
            # Tension stats (I14: per-mirror only)
            if mirror_id:
                stats["tensions"] = self.tension_tracker.get_all_statistics(mirror_id)
            
            # Graph stats (I2/I14: scoped appropriately)
            stats["graph"] = self.graph_manager.get_statistics(mirror_id)
            
            # Evolution stats (I2/I14: scoped appropriately)
            stats["evolution"] = self.evolution_engine.get_statistics(mirror_id)
        
        except Exception as e:
            stats["error"] = str(e)
        
        return stats
    
    def analyze_generation_quality(
        self, mirror_id: str, lookback_count: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze recent generation quality for mirror.
        
        I2: Per-mirror only.
        I13: Analyzes constitutional compliance, not behavior.
        
        Returns:
            Dict with quality analysis
        """
        if not mirror_id:
            raise ValueError("I2: mirror_id required")
        
        analysis = {
            "mirror_id": mirror_id,
            "constitutional_health": None,
            "evolution_recommendations": [],
            "error": None
        }
        
        try:
            # Get evolution analysis (I13: compliance-based)
            evo_analysis = self.evolution_engine.analyze_evolution_needs(
                mirror_id=mirror_id,
                lookback_count=lookback_count
            )
            
            if evo_analysis:
                analysis["constitutional_health"] = {
                    "compliance_rate": evo_analysis.get("compliance_rate", 0.0),
                    "sample_size": evo_analysis.get("sample_size", 0)
                }
                analysis["evolution_recommendations"] = evo_analysis.get("recommendations", [])
        
        except Exception as e:
            analysis["error"] = str(e)
        
        return analysis
