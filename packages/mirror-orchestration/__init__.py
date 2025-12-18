"""
Mirror Orchestration - The Constitutional Boundary Layer

This is the main entry point for MirrorX, coordinating all subsystems:

1. **Session Management**: User sessions with constitutional lifecycle
2. **Reflection Pipeline**: Input → Recognition → Analysis → Expression
3. **Constitutional Runtime**: Real-time axiom enforcement
4. **Integration Layer**: Connects providers, storage, governance

Key Principles:
- Post-action invocation (Axiom 5): Mirror ONLY activates after user action
- Necessity (Axiom 6): Minimal necessary analysis
- Constitutional compliance at every step

Usage:
    from mirror_orchestration import MirrorX

    # Initialize Mirror
    mirror = MirrorX(config)

    # Start a session (user-initiated)
    session = await mirror.start_session(user_id)

    # User provides input, Mirror reflects
    reflection = await mirror.reflect(
        session_id=session.id,
        user_input="I've been thinking about my career..."
    )

    # End session (celebrated, not mourned)
    await mirror.end_session(session.id)

The MirrorX class is the constitutional boundary layer - all interactions
with Mirror go through this interface, ensuring consistent axiom enforcement.
"""

from .session import (
    Session,
    SessionState,
    SessionConfig,
    SessionManager,
)

from .pipeline import (
    ReflectionPipeline,
    PipelineStage,
    PipelineResult,
)

from .runtime import (
    ConstitutionalRuntime,
    RuntimeViolation,
    RuntimeCheck,
)

from .mirror import MirrorX, MirrorConfig, ProviderSettings

from .provider_bridge import (
    ProviderBridge,
    ProviderConfig,
    ProviderType,
    MIRROR_SYSTEM_PROMPT,
    generate_reflection,
)

from .pattern_detector import (
    PatternDetector,
    DetectedPattern,
    PatternType,
    detect_patterns,
    get_pattern_detector,
)

from .tension_detector import (
    TensionDetector,
    DetectedTension,
    TensionType,
    detect_tensions,
    get_tension_detector,
)

from .storage_bridge import (
    StorageBridge,
    StorageType,
    StoredReflection,
    get_storage_bridge,
)

from .pipeline import create_integrated_pipeline

__version__ = "1.0.0"
__all__ = [
    # Session
    "Session",
    "SessionState",
    "SessionConfig",
    "SessionManager",
    # Pipeline
    "ReflectionPipeline",
    "PipelineStage",
    "PipelineResult",
    "create_integrated_pipeline",
    # Runtime
    "ConstitutionalRuntime",
    "RuntimeViolation",
    "RuntimeCheck",
    # Provider
    "ProviderBridge",
    "ProviderConfig",
    "ProviderType",
    "ProviderSettings",
    "MIRROR_SYSTEM_PROMPT",
    "generate_reflection",
    # Pattern Detection
    "PatternDetector",
    "DetectedPattern",
    "PatternType",
    "detect_patterns",
    "get_pattern_detector",
    # Tension Detection
    "TensionDetector",
    "DetectedTension",
    "TensionType",
    "detect_tensions",
    "get_tension_detector",
    # Storage
    "StorageBridge",
    "StorageType",
    "StoredReflection",
    "get_storage_bridge",
    # Main
    "MirrorX",
    "MirrorConfig",
]
