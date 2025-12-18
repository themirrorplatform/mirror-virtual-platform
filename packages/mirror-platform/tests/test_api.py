"""
Tests for REST API.
"""

import pytest

# Only run these tests if FastAPI is available
try:
    from fastapi.testclient import TestClient
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    TestClient = None

from ..config import MirrorPlatformConfig


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPIHealth:
    """Test API health endpoint."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig()
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_health_endpoint(self):
        """Test health check returns OK."""
        response = self.client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "running" in data


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPIAxioms:
    """Test API axioms endpoint."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig()
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_axioms_endpoint(self):
        """Test axioms endpoint returns all 14."""
        response = self.client.get("/axioms")

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 14
        assert len(data["axioms"]) == 14


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPISessions:
    """Test API session endpoints."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig()
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_start_session(self):
        """Test starting a session."""
        response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["user_id"] == "test_user"
        assert "message" in data

    def test_get_session(self):
        """Test getting session info."""
        # Start a session first
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]

        # Get session info
        response = self.client.get(f"/sessions/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert data["active"] is True

    def test_get_nonexistent_session(self):
        """Test getting nonexistent session returns 404."""
        response = self.client.get("/sessions/nonexistent")

        assert response.status_code == 404

    def test_end_session(self):
        """Test ending a session."""
        # Start a session first
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]

        # End session
        response = self.client.delete(f"/sessions/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "message" in data  # Departure message


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPIReflection:
    """Test API reflection endpoint."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig()
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_reflect(self):
        """Test reflection endpoint."""
        # Start a session first
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]

        # Submit reflection
        response = self.client.post(
            f"/sessions/{session_id}/reflect",
            json={"text": "I've been thinking about my career choices."}
        )

        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        if data["success"]:
            assert "text" in data
            assert data["text"] is not None

    def test_reflect_empty_text(self):
        """Test reflection with empty text."""
        # Start a session first
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]

        # Submit empty reflection
        response = self.client.post(
            f"/sessions/{session_id}/reflect",
            json={"text": "   "}  # Whitespace
        )

        # Should fail validation or return unsuccessful
        assert response.status_code in [200, 422]

    def test_reflect_inactive_session(self):
        """Test reflection on ended session."""
        # Start and end a session
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]
        self.client.delete(f"/sessions/{session_id}")

        # Try to reflect on ended session
        response = self.client.post(
            f"/sessions/{session_id}/reflect",
            json={"text": "Hello"}
        )

        assert response.status_code == 400

    def test_reflect_nonexistent_session(self):
        """Test reflection on nonexistent session."""
        response = self.client.post(
            "/sessions/nonexistent/reflect",
            json={"text": "Hello"}
        )

        assert response.status_code == 404


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPIConstitutionalCompliance:
    """Test API responses comply with constitution."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig(strict_mode=True)
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_session_start_message(self):
        """Test session start includes leave reminder."""
        response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )

        data = response.json()
        # Should remind user they can leave
        assert "leave" in data["message"].lower() or "exit" in data["message"].lower()

    def test_reflection_no_certainty(self):
        """Test reflections avoid certainty language."""
        # Start session
        start_response = self.client.post(
            "/sessions",
            json={"user_id": "test_user"}
        )
        session_id = start_response.json()["session_id"]

        # Get reflection
        response = self.client.post(
            f"/sessions/{session_id}/reflect",
            json={"text": "I feel confused about life."}
        )

        data = response.json()
        if data["success"] and data["text"]:
            text_lower = data["text"].lower()
            assert "you definitely" not in text_lower
            assert "you certainly" not in text_lower


@pytest.mark.skipif(not FASTAPI_AVAILABLE, reason="FastAPI not installed")
class TestAPIDocs:
    """Test API documentation endpoints."""

    def setup_method(self):
        from ..api import create_app
        self.config = MirrorPlatformConfig()
        self.app = create_app(self.config)
        self.client = TestClient(self.app)

    def test_docs_available(self):
        """Test OpenAPI docs are available."""
        response = self.client.get("/docs")

        assert response.status_code == 200

    def test_redoc_available(self):
        """Test ReDoc is available."""
        response = self.client.get("/redoc")

        assert response.status_code == 200

    def test_openapi_schema(self):
        """Test OpenAPI schema is valid."""
        response = self.client.get("/openapi.json")

        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert schema["info"]["title"] == "Mirror API"
