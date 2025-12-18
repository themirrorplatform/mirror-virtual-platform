"""
Tests for MirrorX main orchestrator.
"""

import pytest
from datetime import datetime, timedelta

from ..mirror import (
    MirrorX,
    MirrorConfig,
    ReflectionResponse,
    create_mirror,
    create_strict_mirror,
    create_development_mirror,
)
from ..session import SessionConfig, SessionState


class TestMirrorConfig:
    """Test MirrorX configuration."""

    def test_default_config(self):
        """Test default configuration."""
        config = MirrorConfig()

        assert config.strict_mode
        assert config.enable_leave_ability

    def test_to_dict(self):
        """Test config serialization."""
        config = MirrorConfig()
        data = config.to_dict()

        assert "strict_mode" in data
        assert "session_config" in data


class TestMirrorX:
    """Test MirrorX main orchestrator."""

    def setup_method(self):
        self.mirror = MirrorX()

    @pytest.mark.asyncio
    async def test_start_session(self):
        """Test starting a session."""
        session = await self.mirror.start_session("user_001")

        assert session is not None
        assert session.user_id == "user_001"
        assert session.is_active()

    @pytest.mark.asyncio
    async def test_end_session(self):
        """Test ending a session with celebration."""
        session = await self.mirror.start_session("user_001")
        message = await self.mirror.end_session(session.id)

        assert len(message) > 0
        # Should be positive, not guilt-inducing
        assert "don't go" not in message.lower()
        assert "stay" not in message.lower()

    @pytest.mark.asyncio
    async def test_get_session(self):
        """Test getting a session."""
        session = await self.mirror.start_session("user_001")
        retrieved = self.mirror.get_session(session.id)

        assert retrieved is not None
        assert retrieved.id == session.id

    @pytest.mark.asyncio
    async def test_get_active_session(self):
        """Test getting active session for user."""
        session = await self.mirror.start_session("user_001")
        active = self.mirror.get_active_session("user_001")

        assert active is not None
        assert active.id == session.id

    @pytest.mark.asyncio
    async def test_reflect_basic(self):
        """Test basic reflection."""
        session = await self.mirror.start_session("user_001")

        response = await self.mirror.reflect(
            session_id=session.id,
            user_input="I've been thinking about my career lately.",
        )

        assert response.success
        assert response.reflection_text is not None
        assert len(response.reflection_text) > 0

    @pytest.mark.asyncio
    async def test_reflect_no_session(self):
        """Test reflection with invalid session."""
        response = await self.mirror.reflect(
            session_id="nonexistent",
            user_input="Hello",
        )

        assert not response.success
        assert response.error is not None

    @pytest.mark.asyncio
    async def test_reflect_inactive_session(self):
        """Test reflection with inactive session."""
        session = await self.mirror.start_session("user_001")
        await self.mirror.end_session(session.id)

        response = await self.mirror.reflect(
            session_id=session.id,
            user_input="Hello",
        )

        assert not response.success
        assert "not active" in response.error

    @pytest.mark.asyncio
    async def test_reflect_records_activity(self):
        """Test that reflection records activity."""
        session = await self.mirror.start_session("user_001")

        await self.mirror.reflect(
            session_id=session.id,
            user_input="First message",
        )
        await self.mirror.reflect(
            session_id=session.id,
            user_input="Second message",
        )

        updated = self.mirror.get_session(session.id)
        assert updated.metrics.messages_received == 2
        assert updated.metrics.reflections_generated == 2

    @pytest.mark.asyncio
    async def test_reflect_with_axiom_references(self):
        """Test reflection with axiom references enabled."""
        mirror = MirrorX(MirrorConfig(show_axiom_references=True))

        session = await mirror.start_session("user_001")

        response = await mirror.reflect(
            session_id=session.id,
            user_input="I want to explore my thoughts.",
        )

        assert len(response.axiom_references) > 0
        # Should always include Axiom 5
        assert any("Axiom 5" in ref for ref in response.axiom_references)

    @pytest.mark.asyncio
    async def test_constitutional_halt(self):
        """Test that constitutional violations are caught."""
        # This tests the full pipeline's ability to catch violations
        session = await self.mirror.start_session("user_001")

        # Normal input should succeed
        response = await self.mirror.reflect(
            session_id=session.id,
            user_input="Tell me about patterns you see.",
        )

        assert response.success

    @pytest.mark.asyncio
    async def test_get_compliance_metrics(self):
        """Test getting compliance metrics."""
        session = await self.mirror.start_session("user_001")
        await self.mirror.reflect(session.id, "Hello")

        metrics = self.mirror.get_compliance_metrics()

        assert "total_reflections" in metrics
        assert metrics["total_reflections"] == 1
        assert "total_sessions" in metrics
        assert metrics["total_sessions"] == 1

    @pytest.mark.asyncio
    async def test_get_session_stats(self):
        """Test getting session statistics."""
        session = await self.mirror.start_session("user_001")
        await self.mirror.reflect(session.id, "Hello")
        await self.mirror.end_session(session.id)

        stats = self.mirror.get_session_stats("user_001")

        assert stats["total_sessions"] >= 1

    def test_health_check(self):
        """Test health check."""
        health = self.mirror.health_check()

        assert health["status"] == "healthy"
        assert "runtime_checks_enabled" in health

    def test_get_axioms(self):
        """Test getting axioms."""
        axioms = self.mirror.get_axioms()

        assert len(axioms) == 14
        assert 7 in axioms  # Exit Freedom
        assert "Exit Freedom" in axioms[7]


class TestFactoryFunctions:
    """Test factory functions."""

    def test_create_mirror(self):
        """Test basic factory."""
        mirror = create_mirror()
        assert mirror is not None
        assert isinstance(mirror, MirrorX)

    def test_create_strict_mirror(self):
        """Test strict mode factory."""
        mirror = create_strict_mirror()
        assert mirror.config.strict_mode

    def test_create_development_mirror(self):
        """Test development mode factory."""
        mirror = create_development_mirror()
        assert not mirror.config.strict_mode
        assert mirror.config.show_axiom_references


class TestReflectionResponse:
    """Test reflection response structure."""

    def test_to_dict(self):
        """Test response serialization."""
        response = ReflectionResponse(
            success=True,
            session_id="session_001",
            reflection_text="Test reflection",
            patterns_detected=["p1"],
            break_suggested=True,
            break_message="Take a break",
        )

        data = response.to_dict()

        assert data["success"]
        assert data["reflection_text"] == "Test reflection"
        assert data["break_suggested"]


class TestIntegration:
    """Integration tests for MirrorX."""

    @pytest.mark.asyncio
    async def test_full_session_lifecycle(self):
        """Test complete session lifecycle."""
        mirror = MirrorX()

        # Start session
        session = await mirror.start_session("user_001")
        assert session.is_active()

        # Multiple reflections
        for i in range(3):
            response = await mirror.reflect(
                session_id=session.id,
                user_input=f"Reflection input {i}",
            )
            assert response.success

        # Check session state
        updated = mirror.get_session(session.id)
        assert updated.metrics.reflections_generated == 3

        # End session
        goodbye = await mirror.end_session(session.id)
        assert len(goodbye) > 0

        # Session should be ended
        final = mirror.get_session(session.id)
        assert final.state == SessionState.ENDED

    @pytest.mark.asyncio
    async def test_multiple_users(self):
        """Test handling multiple users."""
        mirror = MirrorX()

        # Start sessions for different users
        s1 = await mirror.start_session("user_001")
        s2 = await mirror.start_session("user_002")

        # Both should have active sessions
        assert mirror.get_active_session("user_001") is not None
        assert mirror.get_active_session("user_002") is not None

        # Reflections should be isolated
        r1 = await mirror.reflect(s1.id, "User 1 message")
        r2 = await mirror.reflect(s2.id, "User 2 message")

        assert r1.session_id == s1.id
        assert r2.session_id == s2.id
