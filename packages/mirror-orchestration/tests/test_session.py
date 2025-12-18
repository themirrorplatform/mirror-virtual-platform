"""
Tests for session management.
"""

import pytest
from datetime import datetime, timedelta

from ..session import (
    Session,
    SessionState,
    SessionConfig,
    SessionManager,
    SessionMetrics,
)


class TestSessionConfig:
    """Test session configuration."""

    def test_default_config(self):
        """Test default configuration values."""
        config = SessionConfig()

        assert config.warning_minutes == 45
        assert config.hard_limit_minutes == 90
        assert config.max_messages == 100


class TestSessionMetrics:
    """Test session metrics."""

    def test_duration_calculation(self):
        """Test duration calculation."""
        metrics = SessionMetrics(
            started_at=datetime.utcnow() - timedelta(minutes=30)
        )

        duration = metrics.duration_minutes()
        assert 29 < duration < 31  # Allow tolerance


class TestSession:
    """Test session structure."""

    def test_create_session(self):
        """Test session creation."""
        session = Session(
            id="session_001",
            user_id="user_001",
            state=SessionState.ACTIVE,
            config=SessionConfig(),
        )

        assert session.is_active()
        assert session.id == "session_001"

    def test_should_warn(self):
        """Test warning threshold detection."""
        config = SessionConfig(warning_minutes=30)
        session = Session(
            id="session_001",
            user_id="user_001",
            state=SessionState.ACTIVE,
            config=config,
        )
        session.metrics.started_at = datetime.utcnow() - timedelta(minutes=35)

        assert session.should_warn()

        # After warning issued, should not warn again
        session.warning_issued_at = datetime.utcnow()
        assert not session.should_warn()

    def test_should_end_time_limit(self):
        """Test session end due to time limit."""
        config = SessionConfig(hard_limit_minutes=60)
        session = Session(
            id="session_001",
            user_id="user_001",
            state=SessionState.ACTIVE,
            config=config,
        )
        session.metrics.started_at = datetime.utcnow() - timedelta(minutes=65)

        assert session.should_end()

    def test_should_end_message_limit(self):
        """Test session end due to message limit."""
        config = SessionConfig(max_messages=10)
        session = Session(
            id="session_001",
            user_id="user_001",
            state=SessionState.ACTIVE,
            config=config,
        )
        session.metrics.messages_received = 12

        assert session.should_end()

    def test_time_remaining(self):
        """Test time remaining calculation."""
        config = SessionConfig(hard_limit_minutes=60)
        session = Session(
            id="session_001",
            user_id="user_001",
            state=SessionState.ACTIVE,
            config=config,
        )
        session.metrics.started_at = datetime.utcnow() - timedelta(minutes=20)

        remaining = session.time_remaining_minutes()
        assert 38 < remaining < 42


class TestSessionManager:
    """Test session manager."""

    def setup_method(self):
        self.manager = SessionManager()

    @pytest.mark.asyncio
    async def test_start_session(self):
        """Test starting a new session."""
        session = await self.manager.start_session("user_001")

        assert session is not None
        assert session.user_id == "user_001"
        assert session.state == SessionState.ACTIVE

    @pytest.mark.asyncio
    async def test_get_session(self):
        """Test getting a session by ID."""
        session = await self.manager.start_session("user_001")

        retrieved = self.manager.get_session(session.id)

        assert retrieved is not None
        assert retrieved.id == session.id

    @pytest.mark.asyncio
    async def test_get_active_session(self):
        """Test getting the active session for a user."""
        session = await self.manager.start_session("user_001")

        active = self.manager.get_active_session("user_001")

        assert active is not None
        assert active.id == session.id

    @pytest.mark.asyncio
    async def test_no_active_session_for_new_user(self):
        """Test no active session for new user."""
        active = self.manager.get_active_session("user_002")
        assert active is None

    @pytest.mark.asyncio
    async def test_record_activity(self):
        """Test recording activity."""
        session = await self.manager.start_session("user_001")

        self.manager.record_activity(session.id, "message_received")
        self.manager.record_activity(session.id, "message_received")
        self.manager.record_activity(session.id, "reflection")

        updated = self.manager.get_session(session.id)
        assert updated.metrics.messages_received == 2
        assert updated.metrics.reflections_generated == 1

    @pytest.mark.asyncio
    async def test_record_pattern(self):
        """Test recording patterns."""
        session = await self.manager.start_session("user_001")

        self.manager.record_pattern(session.id, "pattern_001")
        self.manager.record_pattern(session.id, "pattern_002")
        self.manager.record_pattern(session.id, "pattern_001")  # Duplicate

        updated = self.manager.get_session(session.id)
        assert len(updated.patterns_this_session) == 2  # No duplicates

    @pytest.mark.asyncio
    async def test_issue_warning(self):
        """Test issuing a warning."""
        session = await self.manager.start_session("user_001")

        success = self.manager.issue_warning(session.id)

        assert success
        updated = self.manager.get_session(session.id)
        assert updated.state == SessionState.WARNING
        assert updated.warning_issued_at is not None

    @pytest.mark.asyncio
    async def test_end_session(self):
        """Test ending a session."""
        session = await self.manager.start_session("user_001")

        ended = await self.manager.end_session(session.id)

        assert ended is not None
        assert ended.state == SessionState.ENDED
        assert ended.metrics.ended_at is not None

    @pytest.mark.asyncio
    async def test_pause_and_resume(self):
        """Test pausing and resuming a session."""
        session = await self.manager.start_session("user_001")

        paused = await self.manager.pause_session(session.id)
        assert paused.state == SessionState.PAUSED

        resumed = await self.manager.resume_session(session.id)
        assert resumed.state == SessionState.ACTIVE

    @pytest.mark.asyncio
    async def test_get_user_history(self):
        """Test getting user session history."""
        await self.manager.start_session("user_001")
        await self.manager.end_session(
            (await self.manager.start_session("user_001")).id
        )
        await self.manager.start_session("user_001")

        history = self.manager.get_user_history("user_001")

        assert len(history) == 3

    @pytest.mark.asyncio
    async def test_get_continued_patterns(self):
        """Test getting continued patterns from previous sessions."""
        # First session with patterns
        s1 = await self.manager.start_session("user_001")
        self.manager.record_pattern(s1.id, "pattern_001")
        self.manager.record_pattern(s1.id, "pattern_002")
        await self.manager.end_session(s1.id)

        # Get continued patterns
        patterns = self.manager.get_continued_patterns("user_001")

        assert "pattern_001" in patterns
        assert "pattern_002" in patterns

    @pytest.mark.asyncio
    async def test_session_stats(self):
        """Test session statistics."""
        s1 = await self.manager.start_session("user_001")
        self.manager.record_activity(s1.id, "message_received")
        self.manager.record_activity(s1.id, "message_received")
        await self.manager.end_session(s1.id)

        stats = self.manager.get_session_stats("user_001")

        assert stats["total_sessions"] == 1
        assert stats["total_messages"] == 2
