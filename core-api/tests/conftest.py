"""
Pytest configuration for Core API tests
"""
import os
import pytest
from fastapi.testclient import TestClient

# Set test environment variables before importing app
os.environ.setdefault("DATABASE_URL", os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL") or "postgresql://postgres:postgres@localhost:5432/mirror_test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")

from app.main import app


@pytest.fixture(scope="session")
def client():
    """
    Test client fixture.
    Uses TestClient which handles lifespan events automatically.
    """
    return TestClient(app)


@pytest.fixture
def test_user_id():
    """Test user ID for authentication"""
    return "00000000-0000-0000-0000-000000000001"


@pytest.fixture
def auth_headers(test_user_id):
    """Authentication headers for requests"""
    return {"X-User-Id": test_user_id}


@pytest.fixture
def sample_reflection_data():
    """Sample reflection data for testing"""
    return {
        "body": "This is a test reflection about identity and growth.",
        "visibility": "public",
        "lens_key": "identity",
        "metadata": {
            "title": "Test Reflection",
            "tags": ["testing", "identity"]
        }
    }
