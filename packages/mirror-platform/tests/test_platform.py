"""
Tests for Mirror platform.
"""

import pytest
from datetime import datetime

from ..platform import (
    Mirror,
    MirrorInstance,
    SessionInfo,
    ReflectionResult,
    quick_reflect,
)
from ..config import MirrorPlatformConfig


class TestSessionInfo:
    """Test session info structure."""

    def test_create_session_info(self):
        """Test creating session info."""
        info = SessionInfo(
            id="session_001",
            user_id="user_001",
            started_at=datetime.utcnow(),
            active=True,
        )

        assert info.id == "session_001"
        assert info.user_id == "user_001"
        assert info.active is True

    def test_duration_calculation(self):
        """Test duration calculation."""
        from datetime import timedelta

        started = datetime.utcnow() - timedelta(minutes=30)
        info = SessionInfo(
            id="session_001",
            user_id="user_001",
            started_at=started,
            active=True,
        )

        assert 29 < info.duration_minutes < 31


class TestReflectionResult:
    """Test reflection result structure."""

    def test_successful_result(self):
        """Test successful reflection result."""
        result = ReflectionResult(
            success=True,
            text="I notice you're exploring...",
            patterns=["work_stress"],
            tensions=[],
        )

        assert result.success is True
        assert result.text is not None
        assert len(result.patterns) == 1

    def test_failed_result(self):
        """Test failed reflection result."""
        result = ReflectionResult(
            success=False,
            error="Session not found",
        )

        assert result.success is False
        assert result.error == "Session not found"

    def test_break_suggested(self):
        """Test break suggestion."""
        result = ReflectionResult(
            success=True,
            text="...",
            break_suggested=True,
            break_message="You've been here 45 minutes. Consider taking a break.",
        )

        assert result.break_suggested is True
        assert result.break_message is not None


class TestMirrorInstance:
    """Test MirrorInstance."""

    def setup_method(self):
        self.config = MirrorPlatformConfig()
        self.instance = MirrorInstance(self.config)

    @pytest.mark.asyncio
    async def test_start_stop(self):
        """Test starting and stopping instance."""
        await self.instance.start()

        assert self.instance.is_running is True

        await self.instance.stop()

        assert self.instance.is_running is False

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health check."""
        await self.instance.start()

        health = self.instance.health_check()

        assert health["status"] == "healthy"
        assert health["running"] is True

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_start_session(self):
        """Test starting a session."""
        await self.instance.start()

        session = await self.instance.start_session("user_001")

        assert session is not None
        assert session.user_id == "user_001"
        assert session.active is True

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_get_session(self):
        """Test getting a session."""
        await self.instance.start()

        started = await self.instance.start_session("user_001")
        retrieved = self.instance.get_session(started.id)

        assert retrieved is not None
        assert retrieved.id == started.id

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_reflect(self):
        """Test reflection."""
        await self.instance.start()
        session = await self.instance.start_session("user_001")

        result = await self.instance.reflect(
            session.id,
            "I've been thinking about my work situation."
        )

        assert result.success is True
        assert result.text is not None
        assert len(result.text) > 0

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_reflect_invalid_session(self):
        """Test reflection with invalid session."""
        await self.instance.start()

        result = await self.instance.reflect(
            "invalid_session",
            "Hello"
        )

        assert result.success is False
        assert result.error is not None

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_end_session(self):
        """Test ending a session."""
        await self.instance.start()
        session = await self.instance.start_session("user_001")

        goodbye = await self.instance.end_session(session.id)

        assert goodbye is not None
        assert len(goodbye) > 0

        # Session should no longer be active
        ended = self.instance.get_session(session.id)
        assert ended is None or ended.active is False

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_get_axioms(self):
        """Test getting axioms."""
        axioms = self.instance.get_axioms()

        assert len(axioms) == 14
        assert 1 in axioms
        assert 14 in axioms


class TestMirror:
    """Test Mirror convenience wrapper."""

    def setup_method(self):
        self.config = MirrorPlatformConfig()
        self.mirror = Mirror(self.config)

    @pytest.mark.asyncio
    async def test_full_session_flow(self):
        """Test complete session flow."""
        await self.mirror.start()

        # Begin session
        session = await self.mirror.begin("user_001")
        assert session is not None

        # Reflect
        result = await self.mirror.reflect("I feel overwhelmed with decisions.")
        assert result.success is True
        assert result.text is not None

        # End session
        goodbye = await self.mirror.end()
        assert goodbye is not None

        await self.mirror.stop()

    @pytest.mark.asyncio
    async def test_reflect_without_session(self):
        """Test reflection without active session starts one."""
        await self.mirror.start()

        result = await self.mirror.reflect("Hello")

        # Should either work or give clear error
        assert result is not None

        await self.mirror.stop()


class TestQuickReflect:
    """Test quick reflection helper."""

    @pytest.mark.asyncio
    async def test_quick_reflect(self):
        """Test quick reflection without explicit session."""
        result = await quick_reflect(
            "I've been stressed lately.",
            user_id="user_001"
        )

        assert result.success is True
        assert result.text is not None

    @pytest.mark.asyncio
    async def test_quick_reflect_empty_input(self):
        """Test quick reflection with empty input."""
        result = await quick_reflect("   ", user_id="user_001")

        assert result.success is False


class TestConstitutionalCompliance:
    """Test constitutional compliance in platform responses."""

    def setup_method(self):
        self.config = MirrorPlatformConfig(strict_mode=True)
        self.instance = MirrorInstance(self.config)

    @pytest.mark.asyncio
    async def test_no_certainty_claims(self):
        """Test responses don't contain certainty claims."""
        await self.instance.start()
        session = await self.instance.start_session("user_001")

        result = await self.instance.reflect(
            session.id,
            "I feel sad today."
        )

        if result.success and result.text:
            text_lower = result.text.lower()
            assert "you definitely" not in text_lower
            assert "you certainly" not in text_lower
            assert "i'm certain" not in text_lower

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_no_diagnostic_language(self):
        """Test responses don't contain diagnostic language."""
        await self.instance.start()
        session = await self.instance.start_session("user_001")

        result = await self.instance.reflect(
            session.id,
            "I've been feeling down."
        )

        if result.success and result.text:
            text_lower = result.text.lower()
            assert "you have depression" not in text_lower
            assert "you suffer from" not in text_lower
            assert "diagnosed" not in text_lower

        await self.instance.stop()

    @pytest.mark.asyncio
    async def test_no_prescriptive_advice(self):
        """Test responses don't contain prescriptive advice."""
        await self.instance.start()
        session = await self.instance.start_session("user_001")

        result = await self.instance.reflect(
            session.id,
            "What should I do about my job?"
        )

        if result.success and result.text:
            text_lower = result.text.lower()
            # These patterns may appear in context, so check isn't absolute
            # but the system should minimize them
            assert "you must" not in text_lower

        await self.instance.stop()
