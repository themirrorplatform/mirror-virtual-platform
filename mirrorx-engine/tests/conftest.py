"""
Pytest configuration for MirrorX Engine tests
"""
import os
import pytest
from fastapi.testclient import TestClient

# Set test environment variables
os.environ.setdefault("ANTHROPIC_API_KEY", os.getenv("ANTHROPIC_API_KEY", "test-key"))
os.environ.setdefault("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", "test-key"))
os.environ.setdefault("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY", "test-key"))

from app.main import app


@pytest.fixture(scope="session")
def client():
    """Test client for MirrorX Engine API"""
    return TestClient(app)


@pytest.fixture
def test_user_id():
    """Test user ID"""
    return "test-user-001"


@pytest.fixture
def sample_reflection_text():
    """Sample reflection text for testing"""
    return "I've been struggling with work-life balance lately. I feel pulled between my career ambitions and spending quality time with family."


@pytest.fixture
def sample_reflection_data(test_user_id, sample_reflection_text):
    """Complete reflection data"""
    return {
        "user_id": test_user_id,
        "reflection_text": sample_reflection_text,
        "lens": "identity",
        "tone": "raw"
    }


@pytest.fixture
def mock_hume_response():
    """Mock Hume AI emotion analysis response"""
    return {
        "prosody": {
            "predictions": [{
                "emotions": [
                    {"name": "Contemplation", "score": 0.75},
                    {"name": "Concern", "score": 0.60},
                    {"name": "Anxiety", "score": 0.45}
                ]
            }]
        }
    }


@pytest.fixture
def mock_identity_graph():
    """Mock identity graph data"""
    return {
        "nodes": [
            {"id": "belief_1", "type": "belief", "label": "Career success is important"},
            {"id": "belief_2", "type": "belief", "label": "Family time is essential"},
            {"id": "value_1", "type": "value", "label": "Achievement"},
            {"id": "value_2", "type": "value", "label": "Connection"}
        ],
        "edges": [
            {"from": "belief_1", "to": "value_1", "type": "supports"},
            {"from": "belief_2", "to": "value_2", "type": "supports"}
        ]
    }
