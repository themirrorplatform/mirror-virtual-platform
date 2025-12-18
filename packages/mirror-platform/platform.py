"""
Mirror Platform Integration

The main integration layer that connects all Mirror packages
into a cohesive platform.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime
import asyncio

from .config import MirrorPlatformConfig, load_config


@dataclass
class ReflectionResult:
    """Result from a reflection request."""
    success: bool
    text: Optional[str] = None
    patterns: List[str] = field(default_factory=list)
    tensions: List[str] = field(default_factory=list)
    break_suggested: bool = False
    break_message: Optional[str] = None
    session_should_end: bool = False
    error: Optional[str] = None
    duration_ms: float = 0.0

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "text": self.text,
            "patterns": self.patterns,
            "tensions": self.tensions,
            "break_suggested": self.break_suggested,
            "break_message": self.break_message,
            "session_should_end": self.session_should_end,
            "error": self.error,
            "duration_ms": self.duration_ms,
        }


@dataclass
class SessionInfo:
    """Information about a session."""
    id: str
    user_id: str
    active: bool
    started_at: datetime
    duration_minutes: float = 0.0
    message_count: int = 0
    reflection_count: int = 0
    patterns_detected: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "active": self.active,
            "started_at": self.started_at.isoformat(),
            "duration_minutes": self.duration_minutes,
            "message_count": self.message_count,
            "reflection_count": self.reflection_count,
            "patterns_detected": self.patterns_detected,
        }


class MirrorInstance:
    """
    A running Mirror instance.

    This class wraps the MirrorX orchestrator and provides
    a simplified interface for the platform layer.
    """

    def __init__(self, config: MirrorPlatformConfig = None):
        self.config = config or load_config()
        self._started = False
        self._mirror = None

    async def start(self):
        """Start the Mirror instance."""
        if self._started:
            return

        # Import here to avoid circular imports
        from mirror_orchestration import MirrorX, MirrorConfig
        from mirror_orchestration.session import SessionConfig

        # Build MirrorX config from platform config
        mirror_config = MirrorConfig(
            session_config=SessionConfig(
                warning_minutes=self.config.session.warning_minutes,
                hard_limit_minutes=self.config.session.limit_minutes,
                max_messages=self.config.session.max_messages,
                min_cooldown_minutes=self.config.session.cooldown_minutes,
            ),
            strict_mode=self.config.strict_mode,
            log_violations=self.config.log_violations,
            show_axiom_references=self.config.show_axiom_references,
            enable_leave_ability=self.config.expression.enable_leaveability,
        )

        self._mirror = MirrorX(mirror_config)
        self._started = True

    async def stop(self):
        """Stop the Mirror instance."""
        self._started = False
        self._mirror = None

    @property
    def is_running(self) -> bool:
        """Check if Mirror is running."""
        return self._started and self._mirror is not None

    async def start_session(self, user_id: str) -> SessionInfo:
        """Start a new session for a user."""
        if not self.is_running:
            raise RuntimeError("Mirror is not running")

        session = await self._mirror.start_session(user_id)

        return SessionInfo(
            id=session.id,
            user_id=session.user_id,
            active=session.is_active(),
            started_at=session.created_at,
        )

    async def end_session(self, session_id: str) -> str:
        """End a session and get departure message."""
        if not self.is_running:
            raise RuntimeError("Mirror is not running")

        return await self._mirror.end_session(session_id)

    async def reflect(
        self,
        session_id: str,
        user_input: str
    ) -> ReflectionResult:
        """Submit input for reflection."""
        if not self.is_running:
            return ReflectionResult(
                success=False,
                error="Mirror is not running",
            )

        response = await self._mirror.reflect(
            session_id=session_id,
            user_input=user_input,
        )

        return ReflectionResult(
            success=response.success,
            text=response.reflection_text,
            patterns=response.patterns_detected,
            tensions=response.tensions_detected,
            break_suggested=response.break_suggested,
            break_message=response.break_message,
            session_should_end=response.session_should_end,
            error=response.error,
            duration_ms=response.pipeline_duration_ms,
        )

    def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """Get session information."""
        if not self.is_running:
            return None

        session = self._mirror.get_session(session_id)
        if not session:
            return None

        return SessionInfo(
            id=session.id,
            user_id=session.user_id,
            active=session.is_active(),
            started_at=session.created_at,
            duration_minutes=session.metrics.duration_minutes(),
            message_count=session.metrics.messages_received,
            reflection_count=session.metrics.reflections_generated,
            patterns_detected=session.patterns_this_session,
        )

    def get_active_session(self, user_id: str) -> Optional[SessionInfo]:
        """Get active session for a user."""
        if not self.is_running:
            return None

        session = self._mirror.get_active_session(user_id)
        if not session:
            return None

        return SessionInfo(
            id=session.id,
            user_id=session.user_id,
            active=session.is_active(),
            started_at=session.created_at,
            duration_minutes=session.metrics.duration_minutes(),
            message_count=session.metrics.messages_received,
            reflection_count=session.metrics.reflections_generated,
            patterns_detected=session.patterns_this_session,
        )

    def health_check(self) -> Dict[str, Any]:
        """Check platform health."""
        if not self.is_running:
            return {
                "status": "stopped",
                "running": False,
            }

        mirror_health = self._mirror.health_check()

        return {
            "status": "healthy",
            "running": True,
            "environment": self.config.environment,
            "mirror": mirror_health,
        }

    def get_axioms(self) -> Dict[int, str]:
        """Get the constitutional axioms."""
        if not self.is_running:
            return {}
        return self._mirror.get_axioms()


class Mirror:
    """
    High-level Mirror interface.

    This is the main entry point for using Mirror programmatically.

    Usage:
        mirror = Mirror()
        await mirror.start()

        # Interactive session
        session = await mirror.begin("user_001")
        response = await mirror.reflect("I've been thinking...")
        print(response.text)

        await mirror.end()
        await mirror.stop()
    """

    def __init__(self, config: MirrorPlatformConfig = None):
        self.instance = MirrorInstance(config)
        self._current_session_id: Optional[str] = None
        self._current_user_id: Optional[str] = None

    async def start(self):
        """Start Mirror."""
        await self.instance.start()

    async def stop(self):
        """Stop Mirror."""
        if self._current_session_id:
            await self.end()
        await self.instance.stop()

    @property
    def is_running(self) -> bool:
        """Check if Mirror is running."""
        return self.instance.is_running

    @property
    def has_session(self) -> bool:
        """Check if there's an active session."""
        return self._current_session_id is not None

    async def begin(self, user_id: str = "default") -> SessionInfo:
        """
        Begin a new session.

        This starts a session for the given user. If there's already
        an active session, it will be ended first.
        """
        if not self.is_running:
            await self.start()

        if self._current_session_id:
            await self.end()

        session = await self.instance.start_session(user_id)
        self._current_session_id = session.id
        self._current_user_id = user_id

        return session

    async def reflect(self, user_input: str) -> ReflectionResult:
        """
        Submit input for reflection.

        If no session is active, starts one automatically.
        """
        if not self._current_session_id:
            await self.begin()

        result = await self.instance.reflect(
            session_id=self._current_session_id,
            user_input=user_input,
        )

        # Check if session should end
        if result.session_should_end:
            await self.end()

        return result

    async def end(self) -> str:
        """
        End the current session.

        Returns a departure celebration message.
        """
        if not self._current_session_id:
            return "No active session."

        message = await self.instance.end_session(self._current_session_id)
        self._current_session_id = None

        return message

    def get_session(self) -> Optional[SessionInfo]:
        """Get current session information."""
        if not self._current_session_id:
            return None
        return self.instance.get_session(self._current_session_id)

    def health(self) -> Dict[str, Any]:
        """Get health status."""
        return self.instance.health_check()

    def axioms(self) -> Dict[int, str]:
        """Get constitutional axioms."""
        return self.instance.get_axioms()


# Singleton instance for simple usage
_default_mirror: Optional[Mirror] = None


async def get_mirror() -> Mirror:
    """Get or create the default Mirror instance."""
    global _default_mirror
    if _default_mirror is None:
        _default_mirror = Mirror()
    if not _default_mirror.is_running:
        await _default_mirror.start()
    return _default_mirror


async def quick_reflect(user_input: str, user_id: str = "default") -> ReflectionResult:
    """
    Quick reflection without managing sessions.

    This is a convenience function for simple use cases.
    """
    mirror = await get_mirror()

    # Get or create session
    session = mirror.instance.get_active_session(user_id)
    if not session:
        await mirror.begin(user_id)

    return await mirror.reflect(user_input)
