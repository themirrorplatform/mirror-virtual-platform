"""
MirrorX - The Constitutional Boundary Layer for Intelligence

This is the main entry point for Mirror. All interactions go through
this class, which enforces constitutional constraints at every step.

MirrorX is the "Constitutional Boundary Layer" - the interface between
users and the AI reflection system that ensures all 14 axioms are
upheld at all times.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime
import uuid

from .session import Session, SessionManager, SessionConfig, SessionState
from .pipeline import (
    ReflectionPipeline,
    PipelineContext,
    PipelineResult,
    PipelineStage,
    StageResult,
    PipelineStatus,
    create_default_pipeline,
)
from .runtime import (
    ConstitutionalRuntime,
    RuntimeGuard,
    RuntimeViolation,
    ConstitutionalHalt,
)


@dataclass
class ProviderSettings:
    """Settings for AI provider."""
    provider_type: str = "ollama"  # ollama, anthropic, openai
    model: Optional[str] = None  # None = use default for provider
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 500


@dataclass
class MirrorConfig:
    """Configuration for MirrorX."""
    # Session settings
    session_config: SessionConfig = field(default_factory=SessionConfig)

    # Provider settings
    provider: ProviderSettings = field(default_factory=ProviderSettings)

    # Runtime settings
    strict_mode: bool = True  # Halt on any violation
    log_violations: bool = True

    # Features
    enable_patterns: bool = True
    enable_tensions: bool = True
    enable_leave_ability: bool = True
    enable_llm: bool = True  # Use real LLM vs fallback

    # Transparency
    show_axiom_references: bool = False  # Show which axioms apply to responses

    def to_dict(self) -> dict:
        return {
            "session_config": self.session_config.to_dict(),
            "provider_type": self.provider.provider_type,
            "strict_mode": self.strict_mode,
            "log_violations": self.log_violations,
            "enable_patterns": self.enable_patterns,
            "enable_tensions": self.enable_tensions,
            "enable_leave_ability": self.enable_leave_ability,
            "enable_llm": self.enable_llm,
            "show_axiom_references": self.show_axiom_references,
        }


@dataclass
class ReflectionResponse:
    """Response from a reflection request."""
    success: bool
    session_id: str
    reflection_text: Optional[str] = None

    # Patterns and tensions
    patterns_detected: List[str] = field(default_factory=list)
    tensions_detected: List[str] = field(default_factory=list)

    # Leave-ability
    break_suggested: bool = False
    break_message: Optional[str] = None
    session_should_end: bool = False

    # Axiom compliance
    axiom_references: List[str] = field(default_factory=list)

    # Errors
    error: Optional[str] = None
    halted_by_axiom: Optional[int] = None

    # Metadata
    pipeline_duration_ms: float = 0.0

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "session_id": self.session_id,
            "reflection_text": self.reflection_text,
            "patterns_detected": self.patterns_detected,
            "tensions_detected": self.tensions_detected,
            "break_suggested": self.break_suggested,
            "break_message": self.break_message,
            "session_should_end": self.session_should_end,
            "axiom_references": self.axiom_references,
            "error": self.error,
            "halted_by_axiom": self.halted_by_axiom,
            "pipeline_duration_ms": self.pipeline_duration_ms,
        }


class MirrorX:
    """
    The Constitutional Boundary Layer for Intelligence.

    MirrorX is the main interface for all Mirror interactions.
    It orchestrates:
    - Session management
    - Reflection pipeline
    - Constitutional runtime checks
    - Leave-ability enforcement

    All 14 axioms are enforced at this layer. No interaction
    bypasses constitutional checks.

    Usage:
        # Initialize
        mirror = MirrorX()

        # Start session (user-initiated only)
        session = await mirror.start_session(user_id="user_001")

        # Reflect on user input
        response = await mirror.reflect(
            session_id=session.id,
            user_input="I've been thinking about work..."
        )

        # Check response
        if response.success:
            print(response.reflection_text)

        if response.break_suggested:
            print(response.break_message)

        # End session (celebrated)
        goodbye = await mirror.end_session(session.id)

    Constitutional Properties:
    - Post-action only: Mirror never initiates
    - Exit freedom: User can always leave
    - No diagnosis: Never pathologizes
    - No certainty: Never claims to know user's psychology
    - No capture: Actively prevents dependency
    """

    def __init__(self, config: MirrorConfig = None):
        self.config = config or MirrorConfig()

        # Initialize components
        self.session_manager = SessionManager(self.config.session_config)
        self.pipeline = create_default_pipeline()
        self.runtime = ConstitutionalRuntime()
        self.guard = RuntimeGuard(self.runtime)

        # Provider bridge (initialized lazily)
        self._provider_bridge = None
        self._provider_initialized = False

        # Conversation history per session
        self._conversation_history: Dict[str, List[Dict]] = {}

        # Statistics
        self._total_reflections = 0
        self._total_sessions = 0
        self._constitutional_halts = 0

    async def _ensure_provider(self) -> None:
        """Lazily initialize the provider bridge."""
        if self._provider_initialized or not self.config.enable_llm:
            return

        try:
            from .provider_bridge import ProviderBridge, ProviderConfig, ProviderType

            # Map string to enum
            provider_map = {
                "ollama": ProviderType.OLLAMA,
                "anthropic": ProviderType.ANTHROPIC,
                "openai": ProviderType.OPENAI,
            }

            provider_enum = provider_map.get(
                self.config.provider.provider_type.lower(),
                ProviderType.OLLAMA
            )

            config = ProviderConfig(
                provider_type=provider_enum,
                model=self.config.provider.model,
                api_key=self.config.provider.api_key,
                api_base=self.config.provider.api_base,
                temperature=self.config.provider.temperature,
                max_tokens=self.config.provider.max_tokens,
            )

            self._provider_bridge = ProviderBridge(config)
            await self._provider_bridge.initialize()
            self._provider_initialized = True

        except Exception as e:
            # Provider init failed - will use fallback
            self._provider_bridge = None
            self._provider_initialized = True  # Don't retry

    # Session Management

    async def start_session(
        self,
        user_id: str,
        config: SessionConfig = None,
    ) -> Session:
        """
        Start a new session for a user.

        Sessions are ONLY started in response to user action (Axiom 5).
        This method should only be called when user explicitly
        initiates interaction.

        Args:
            user_id: The user's ID
            config: Optional session-specific configuration

        Returns:
            The new session
        """
        # Get patterns to continue from previous sessions
        continued_patterns = self.session_manager.get_continued_patterns(user_id)

        session = await self.session_manager.start_session(
            user_id=user_id,
            config=config or self.config.session_config,
            continued_patterns=continued_patterns,
        )

        self._total_sessions += 1

        return session

    async def end_session(
        self,
        session_id: str,
        reason: str = "user_ended"
    ) -> str:
        """
        End a session.

        Endings are CELEBRATED (Axiom 7: Exit Freedom).
        This should be a positive experience, not guilt-inducing.

        Returns:
            A departure celebration message
        """
        session = await self.session_manager.end_session(session_id, reason)

        if not session:
            return "Session not found."

        # Generate departure celebration
        messages = [
            "Take care. The world needs you out there.",
            "Go well. Living is more important than reflecting.",
            "Until next time. Trust yourself.",
            "Goodbye. You're the expert on your own life.",
        ]

        import random
        return random.choice(messages)

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        return self.session_manager.get_session(session_id)

    def get_active_session(self, user_id: str) -> Optional[Session]:
        """Get the active session for a user."""
        return self.session_manager.get_active_session(user_id)

    # Core Reflection

    async def reflect(
        self,
        session_id: str,
        user_input: str,
    ) -> ReflectionResponse:
        """
        Generate a reflection in response to user input.

        This is the main interaction method. It:
        1. Validates the session
        2. Runs constitutional pre-checks
        3. Executes the reflection pipeline
        4. Runs constitutional post-checks
        5. Checks leave-ability
        6. Returns the response

        Args:
            session_id: The session ID
            user_input: The user's input text

        Returns:
            ReflectionResponse with reflection and metadata
        """
        # Get session
        session = self.session_manager.get_session(session_id)
        if not session:
            return ReflectionResponse(
                success=False,
                session_id=session_id,
                error="Session not found",
            )

        if not session.is_active():
            return ReflectionResponse(
                success=False,
                session_id=session_id,
                error="Session is not active",
            )

        # Record activity
        self.session_manager.record_activity(session_id, "message_received")

        # Ensure provider is initialized (lazy)
        await self._ensure_provider()

        # Get/create conversation history for this session
        if session_id not in self._conversation_history:
            self._conversation_history[session_id] = []

        # Add user message to history
        self._conversation_history[session_id].append({
            "role": "user",
            "content": user_input,
        })

        # Build runtime context for checks
        runtime_context = {
            "user_initiated": True,
            "user_input": user_input,
            "session_id": session_id,
            "user_id": session.user_id,
        }

        try:
            # Pre-action constitutional check
            async with self.guard.check(runtime_context):
                # Build pipeline context with provider bridge
                pipeline_context = PipelineContext(
                    user_id=session.user_id,
                    session_id=session_id,
                    user_input=user_input,
                    metadata={
                        "continued_patterns": session.continued_patterns,
                    },
                    provider_bridge=self._provider_bridge,
                    conversation_history=self._conversation_history.get(session_id, []),
                )

                # Add session metrics for leave-ability
                pipeline_context.session_duration_minutes = session.metrics.duration_minutes()
                pipeline_context.session_message_count = session.metrics.messages_received

                # Execute pipeline
                pipeline_result = await self.pipeline.execute(pipeline_context)

        except ConstitutionalHalt as halt:
            self._constitutional_halts += 1
            return ReflectionResponse(
                success=False,
                session_id=session_id,
                error="Constitutional violation prevented response",
                halted_by_axiom=halt.violations[0].axiom_number if halt.violations else None,
            )

        # Post-action checks
        runtime_context["output"] = pipeline_result.reflection_text or ""
        post_violations = self.runtime.check_post_action(runtime_context)

        if self.runtime.should_halt(post_violations) and self.config.strict_mode:
            self._constitutional_halts += 1
            return ReflectionResponse(
                success=False,
                session_id=session_id,
                error="Response failed constitutional review",
                halted_by_axiom=post_violations[0].axiom_number if post_violations else None,
            )

        # Check session limits
        session_should_end = session.should_end()

        # Issue warning if needed
        if session.should_warn():
            self.session_manager.issue_warning(session_id)

        # Record patterns and tensions
        for pattern_id in pipeline_result.patterns_detected:
            self.session_manager.record_pattern(session_id, pattern_id)

        for tension_id in pipeline_result.tensions_detected:
            self.session_manager.record_tension(session_id, tension_id)

        self.session_manager.record_activity(session_id, "reflection")
        self._total_reflections += 1

        # Store assistant response in conversation history
        if pipeline_result.reflection_text:
            self._conversation_history[session_id].append({
                "role": "assistant",
                "content": pipeline_result.reflection_text,
            })

        # Build response
        response = ReflectionResponse(
            success=pipeline_result.status == PipelineStatus.COMPLETED,
            session_id=session_id,
            reflection_text=pipeline_result.reflection_text,
            patterns_detected=pipeline_result.patterns_detected,
            tensions_detected=pipeline_result.tensions_detected,
            break_suggested=pipeline_result.break_suggested or session.state == SessionState.WARNING,
            break_message=pipeline_result.break_message,
            session_should_end=session_should_end,
            pipeline_duration_ms=pipeline_result.total_duration_ms,
        )

        # Add axiom references if enabled
        if self.config.show_axiom_references:
            response.axiom_references = self._get_applicable_axioms(pipeline_result)

        return response

    def _get_applicable_axioms(self, result: PipelineResult) -> List[str]:
        """Get list of axioms that applied to this reflection."""
        axioms = []

        # Axiom 5 always applies (post-action)
        axioms.append("Axiom 5: Post-action invocation")

        # Axiom 6 if we limited analysis
        if any(s.stage == PipelineStage.ANALYSIS for s in result.stages):
            axioms.append("Axiom 6: Minimal necessary analysis")

        # Axiom 7 if break suggested
        if result.break_suggested:
            axioms.append("Axiom 7: Exit freedom supported")

        return axioms

    # Transparency and Metrics

    def get_compliance_metrics(self) -> Dict[str, Any]:
        """Get constitutional compliance metrics."""
        return {
            **self.runtime.get_compliance_metrics(),
            "total_reflections": self._total_reflections,
            "total_sessions": self._total_sessions,
            "constitutional_halts": self._constitutional_halts,
        }

    def get_session_stats(self, user_id: str) -> Dict[str, Any]:
        """Get session statistics for a user."""
        return self.session_manager.get_session_stats(user_id)

    def get_violation_history(
        self,
        limit: int = 100,
        axiom_filter: int = None
    ) -> List[RuntimeViolation]:
        """Get runtime violation history."""
        return self.runtime.get_violation_history(limit, axiom_filter)

    # Health and Status

    def health_check(self) -> Dict[str, Any]:
        """Check system health."""
        return {
            "status": "healthy",
            "runtime_checks_enabled": sum(1 for c in self.runtime._checks if c.enabled),
            "total_checks": len(self.runtime._checks),
            "strict_mode": self.config.strict_mode,
            "constitutional_halts": self._constitutional_halts,
        }

    def get_axioms(self) -> Dict[int, str]:
        """Get the 14 constitutional axioms."""
        return self.runtime.AXIOMS.copy()


# Convenience factory functions

def create_mirror(config: MirrorConfig = None) -> MirrorX:
    """Create a new MirrorX instance with optional configuration."""
    return MirrorX(config)


def create_strict_mirror() -> MirrorX:
    """Create a MirrorX instance in strict mode."""
    return MirrorX(MirrorConfig(strict_mode=True))


def create_development_mirror() -> MirrorX:
    """Create a MirrorX instance for development (less strict)."""
    return MirrorX(MirrorConfig(
        strict_mode=False,
        log_violations=True,
        show_axiom_references=True,
    ))
