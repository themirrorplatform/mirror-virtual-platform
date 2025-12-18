"""
Session Management

Manages user sessions with constitutional lifecycle:
- Sessions are user-initiated (Axiom 5: Post-action)
- Sessions have clear boundaries
- Session endings are celebrated (Axiom 7: Exit Freedom)

A session represents a bounded interaction period between
the user and Mirror.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


class SessionState(Enum):
    """State of a session."""
    INITIALIZING = "initializing"  # Being set up
    ACTIVE = "active"  # Currently active
    PAUSED = "paused"  # Temporarily paused
    WARNING = "warning"  # Time warning issued
    ENDING = "ending"  # In process of ending
    ENDED = "ended"  # Completed
    ABANDONED = "abandoned"  # Left without explicit end


@dataclass
class SessionConfig:
    """Configuration for sessions."""
    # Time limits
    warning_minutes: int = 45
    hard_limit_minutes: int = 90

    # Interaction limits
    max_messages: int = 100
    max_reflections: int = 50

    # Cooldown
    min_cooldown_minutes: int = 30

    # Features
    enable_pattern_tracking: bool = True
    enable_tension_detection: bool = True
    store_session_history: bool = True

    def to_dict(self) -> dict:
        return {
            "warning_minutes": self.warning_minutes,
            "hard_limit_minutes": self.hard_limit_minutes,
            "max_messages": self.max_messages,
            "max_reflections": self.max_reflections,
            "min_cooldown_minutes": self.min_cooldown_minutes,
        }


@dataclass
class SessionMetrics:
    """Metrics for a session."""
    messages_sent: int = 0
    messages_received: int = 0
    reflections_generated: int = 0
    patterns_detected: int = 0
    tensions_surfaced: int = 0
    break_suggestions_shown: int = 0

    # Timing
    started_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_active_seconds: float = 0.0

    def duration_minutes(self) -> float:
        """Get session duration in minutes."""
        if not self.started_at:
            return 0.0
        end = self.ended_at or datetime.utcnow()
        return (end - self.started_at).total_seconds() / 60

    def to_dict(self) -> dict:
        return {
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "reflections_generated": self.reflections_generated,
            "patterns_detected": self.patterns_detected,
            "tensions_surfaced": self.tensions_surfaced,
            "break_suggestions_shown": self.break_suggestions_shown,
            "duration_minutes": self.duration_minutes(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


@dataclass
class Session:
    """
    A user session with Mirror.

    Sessions are:
    - User-initiated (never proactive)
    - Time-bounded with warnings
    - Tracked for pattern continuity
    - Celebrated when ending
    """
    id: str
    user_id: str
    state: SessionState
    config: SessionConfig
    metrics: SessionMetrics = field(default_factory=SessionMetrics)

    # Session context
    patterns_this_session: List[str] = field(default_factory=list)
    tensions_this_session: List[str] = field(default_factory=list)

    # Continuation from previous sessions
    continued_patterns: List[str] = field(default_factory=list)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    warning_issued_at: Optional[datetime] = None

    def is_active(self) -> bool:
        """Check if session is currently active."""
        return self.state in [SessionState.ACTIVE, SessionState.WARNING]

    def time_remaining_minutes(self) -> float:
        """Get time remaining before hard limit."""
        elapsed = self.metrics.duration_minutes()
        return max(0, self.config.hard_limit_minutes - elapsed)

    def should_warn(self) -> bool:
        """Check if time warning should be issued."""
        if self.warning_issued_at:
            return False  # Already warned
        return self.metrics.duration_minutes() >= self.config.warning_minutes

    def should_end(self) -> bool:
        """Check if session should end due to limits."""
        if self.metrics.duration_minutes() >= self.config.hard_limit_minutes:
            return True
        if self.metrics.messages_received >= self.config.max_messages:
            return True
        return False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "state": self.state.value,
            "metrics": self.metrics.to_dict(),
            "patterns_this_session": self.patterns_this_session,
            "tensions_this_session": self.tensions_this_session,
            "time_remaining_minutes": self.time_remaining_minutes(),
            "created_at": self.created_at.isoformat(),
        }


class SessionManager:
    """
    Manages user sessions.

    Key responsibilities:
    - Session creation (user-initiated only)
    - Session lifecycle management
    - Cooldown enforcement
    - Historical session tracking

    Usage:
        manager = SessionManager()

        # Start session
        session = await manager.start_session(user_id)

        # Update on activity
        manager.record_activity(session.id)

        # Check limits
        if session.should_warn():
            manager.issue_warning(session.id)

        # End session
        await manager.end_session(session.id)
    """

    def __init__(self, config: SessionConfig = None):
        self.default_config = config or SessionConfig()
        self._sessions: Dict[str, Session] = {}
        self._user_sessions: Dict[str, List[str]] = {}  # user_id -> session_ids
        self._user_last_session: Dict[str, datetime] = {}

    async def start_session(
        self,
        user_id: str,
        config: SessionConfig = None,
        continued_patterns: List[str] = None
    ) -> Session:
        """
        Start a new session for a user.

        This is ONLY called in response to user action (Axiom 5).
        """
        # Check cooldown
        cooldown_check = self._check_cooldown(user_id)
        if cooldown_check:
            # Instead of blocking, we note the quick return
            pass  # Could add a warning to the session

        session = Session(
            id=str(uuid.uuid4()),
            user_id=user_id,
            state=SessionState.ACTIVE,
            config=config or self.default_config,
            continued_patterns=continued_patterns or [],
        )

        session.metrics.started_at = datetime.utcnow()
        session.metrics.last_activity = datetime.utcnow()

        self._sessions[session.id] = session

        if user_id not in self._user_sessions:
            self._user_sessions[user_id] = []
        self._user_sessions[user_id].append(session.id)

        return session

    def _check_cooldown(self, user_id: str) -> Optional[str]:
        """Check if user is within cooldown period."""
        last_session = self._user_last_session.get(user_id)
        if not last_session:
            return None

        elapsed = (datetime.utcnow() - last_session).total_seconds() / 60
        if elapsed < self.default_config.min_cooldown_minutes:
            return f"Last session ended {int(elapsed)} minutes ago"

        return None

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def get_active_session(self, user_id: str) -> Optional[Session]:
        """Get the active session for a user."""
        session_ids = self._user_sessions.get(user_id, [])
        for sid in reversed(session_ids):
            session = self._sessions.get(sid)
            if session and session.is_active():
                return session
        return None

    def record_activity(self, session_id: str, activity_type: str = "message"):
        """Record activity in a session."""
        session = self._sessions.get(session_id)
        if not session:
            return

        session.metrics.last_activity = datetime.utcnow()

        if activity_type == "message_sent":
            session.metrics.messages_sent += 1
        elif activity_type == "message_received":
            session.metrics.messages_received += 1
        elif activity_type == "reflection":
            session.metrics.reflections_generated += 1
        elif activity_type == "pattern":
            session.metrics.patterns_detected += 1
        elif activity_type == "tension":
            session.metrics.tensions_surfaced += 1

    def record_pattern(self, session_id: str, pattern_id: str):
        """Record a pattern detected in this session."""
        session = self._sessions.get(session_id)
        if session and pattern_id not in session.patterns_this_session:
            session.patterns_this_session.append(pattern_id)
            session.metrics.patterns_detected += 1

    def record_tension(self, session_id: str, tension_id: str):
        """Record a tension surfaced in this session."""
        session = self._sessions.get(session_id)
        if session and tension_id not in session.tensions_this_session:
            session.tensions_this_session.append(tension_id)
            session.metrics.tensions_surfaced += 1

    def issue_warning(self, session_id: str) -> bool:
        """Issue a time warning for a session."""
        session = self._sessions.get(session_id)
        if not session or session.warning_issued_at:
            return False

        session.state = SessionState.WARNING
        session.warning_issued_at = datetime.utcnow()
        session.metrics.break_suggestions_shown += 1
        return True

    def check_limits(self, session_id: str) -> Dict[str, Any]:
        """Check session limits and return status."""
        session = self._sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        duration = session.metrics.duration_minutes()
        messages = session.metrics.messages_received

        return {
            "duration_minutes": duration,
            "duration_limit": session.config.hard_limit_minutes,
            "duration_pct": duration / session.config.hard_limit_minutes,
            "messages": messages,
            "message_limit": session.config.max_messages,
            "should_warn": session.should_warn(),
            "should_end": session.should_end(),
            "time_remaining": session.time_remaining_minutes(),
        }

    async def end_session(
        self,
        session_id: str,
        reason: str = "user_ended"
    ) -> Optional[Session]:
        """
        End a session.

        Endings are CELEBRATED (Axiom 7: Exit Freedom).
        """
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.state = SessionState.ENDED
        session.metrics.ended_at = datetime.utcnow()

        # Record for cooldown
        self._user_last_session[session.user_id] = datetime.utcnow()

        return session

    async def pause_session(self, session_id: str) -> Optional[Session]:
        """Pause a session temporarily."""
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.state = SessionState.PAUSED
        return session

    async def resume_session(self, session_id: str) -> Optional[Session]:
        """Resume a paused session."""
        session = self._sessions.get(session_id)
        if not session or session.state != SessionState.PAUSED:
            return None

        session.state = SessionState.ACTIVE
        session.metrics.last_activity = datetime.utcnow()
        return session

    def get_user_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Session]:
        """Get session history for a user."""
        session_ids = self._user_sessions.get(user_id, [])
        sessions = []

        for sid in reversed(session_ids):
            session = self._sessions.get(sid)
            if session:
                sessions.append(session)
                if len(sessions) >= limit:
                    break

        return sessions

    def get_continued_patterns(self, user_id: str, limit: int = 5) -> List[str]:
        """
        Get patterns that should continue into new session.

        Only includes patterns from recent sessions.
        """
        history = self.get_user_history(user_id, limit=3)

        patterns = []
        seen = set()

        for session in history:
            for pattern in session.patterns_this_session:
                if pattern not in seen:
                    patterns.append(pattern)
                    seen.add(pattern)
                    if len(patterns) >= limit:
                        return patterns

        return patterns

    def get_session_stats(self, user_id: str) -> Dict[str, Any]:
        """Get aggregate statistics for a user's sessions."""
        history = self.get_user_history(user_id, limit=100)

        if not history:
            return {"total_sessions": 0}

        total_duration = sum(s.metrics.duration_minutes() for s in history)
        total_messages = sum(s.metrics.messages_received for s in history)
        total_reflections = sum(s.metrics.reflections_generated for s in history)

        return {
            "total_sessions": len(history),
            "total_duration_minutes": total_duration,
            "average_duration_minutes": total_duration / len(history),
            "total_messages": total_messages,
            "total_reflections": total_reflections,
            "average_messages_per_session": total_messages / len(history),
        }
