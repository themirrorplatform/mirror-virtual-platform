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

from .mirror import MirrorX, MirrorConfig

from .storage_bridge import (
    StorageBridge,
    StorageConfig,
    StorageType,
    StorageReflection,
    StoragePattern,
    StorageTension,
    StorageAuditEvent,
)

from .pattern_detector import (
    PatternDetector,
    DetectedPattern,
    detect_patterns,
    get_user_patterns,
)

from .tension_detector import (
    TensionDetector,
    DetectedTension,
    detect_tensions,
    get_user_tensions,
)

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
    # Runtime
    "ConstitutionalRuntime",
    "RuntimeViolation",
    "RuntimeCheck",
    # Storage
    "StorageBridge",
    "StorageConfig",
    "StorageType",
    "StorageReflection",
    "StoragePattern",
    "StorageTension",
    "StorageAuditEvent",
    # Pattern Detection
    "PatternDetector",
    "DetectedPattern",
    "detect_patterns",
    "get_user_patterns",
    # Tension Detection
    "TensionDetector",
    "DetectedTension",
    "detect_tensions",
    "get_user_tensions",
    # Main
    "MirrorX",
    "MirrorConfig",
]
