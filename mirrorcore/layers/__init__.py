# mirrorcore/layers/__init__.py
"""
MirrorCore Layers (L1-L3)

L1: Safety & Legality - Two-tier jurisdictional model
L2: Reflection Transformer - Pattern/tension/theme detection
L3: Expression Renderer - Style and context adaptation
"""

from .l1_safety import L1SafetyLayer, L1CheckResult, L1Severity
from .l2_reflection import (
    L2ReflectionTransformer,
    TransformedReflection,
    DetectedPattern,
    DetectedTension,
    DetectedTheme
)
from .l3_expression import (
    L3ExpressionRenderer,
    RenderedExpression,
    ExpressionPreferences,
    ContextualFactors,
    ToneStyle,
    FormalityLevel,
    ResponseLength
)

__all__ = [
    # L1 Safety
    'L1SafetyLayer',
    'L1CheckResult',
    'L1Severity',
    
    # L2 Reflection
    'L2ReflectionTransformer',
    'TransformedReflection',
    'DetectedPattern',
    'DetectedTension',
    'DetectedTheme',
    
    # L3 Expression
    'L3ExpressionRenderer',
    'RenderedExpression',
    'ExpressionPreferences',
    'ContextualFactors',
    'ToneStyle',
    'FormalityLevel',
    'ResponseLength',
]
