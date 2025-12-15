"""
MirrorCore: Reflection Generation Engine

Integrates Storage + LLM + Constitutional layers to generate mirrorbacks.
"""

from .mirrorback_generator import MirrorbackGenerator, GenerationResult, GenerationError
from .language_shapes import LanguageShapeDetector, LanguageShape, ShapeOccurrence
from .tension_tracker import TensionTracker, TensionAxis, TensionMeasurement, TensionShift
from .evolution_engine import (
    EvolutionEngine,
    PromptVersion,
    EvolutionSignal,
    GenerationMetrics,
    EvolutionLayer,
    ChangeType
)

from .graph_manager import (
    GraphManager,
    GraphNode,
    GraphEdge,
    EdgeType,
    Theme
)

from .orchestrator import (
    MirrorOrchestrator,
    OrchestratedGeneration,
    GenerationStatus
)

__all__ = [
    'MirrorbackGenerator',
    'GenerationResult',
    'GenerationError',
    'LanguageShapeDetector',
    'LanguageShape',
    'ShapeOccurrence',
    'TensionTracker',
    'TensionAxis',
    'TensionMeasurement',
    'TensionShift',
    'EvolutionEngine',
    'PromptVersion',
    'EvolutionSignal',
    'GenerationMetrics',
    'EvolutionLayer',
    'ChangeType',
    'GraphManager',
    'GraphNode',
    'GraphEdge',
    'EdgeType',
    'Theme',
    'MirrorOrchestrator',
    'OrchestratedGeneration',
    'GenerationStatus'
]
