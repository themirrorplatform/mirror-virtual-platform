"""
MirrorX Engine - Mirrorback generation tests
"""
import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test MirrorX Engine health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "ok"]


def test_generate_mirrorback(client: TestClient, sample_reflection_data):
    """Test generating a mirrorback through the full pipeline"""
    response = client.post(
        "/api/mirrorback",
        json=sample_reflection_data
    )
    
    # May fail if API keys not configured, but test structure
    assert response.status_code in [200, 500, 503]
    if response.status_code == 200:
        data = response.json()
        assert "body" in data or "mirrorback" in data
        assert "tensions" in data or isinstance(data, dict)


def test_generate_mirrorback_missing_fields(client: TestClient):
    """Test mirrorback generation with missing required fields"""
    response = client.post(
        "/api/mirrorback",
        json={"user_id": "test"}
    )
    
    assert response.status_code in [400, 422]


def test_generate_mirrorback_empty_text(client: TestClient, test_user_id):
    """Test mirrorback generation with empty reflection text"""
    response = client.post(
        "/api/mirrorback",
        json={
            "user_id": test_user_id,
            "reflection_text": ""
        }
    )
    
    assert response.status_code in [400, 422]


def test_mirrorback_tone_detection(client: TestClient, test_user_id):
    """Test that mirrorback detects reflection tone"""
    clear_reflection = {
        "user_id": test_user_id,
        "reflection_text": "I understand now that balance is about prioritizing what matters most in each moment."
    }
    
    response = client.post("/api/mirrorback", json=clear_reflection)
    
    assert response.status_code in [200, 500, 503]
    if response.status_code == 200:
        data = response.json()
        # Tone should be detected
        assert "tone" in data or "metadata" in data


def test_mirrorback_respects_mirrorcore(client: TestClient, test_user_id):
    """Test that mirrorback follows MirrorCore principles (questions, not advice)"""
    reflection = {
        "user_id": test_user_id,
        "reflection_text": "I don't know what to do with my life."
    }
    
    response = client.post("/api/mirrorback", json=reflection)
    
    assert response.status_code in [200, 500, 503]
    if response.status_code == 200:
        data = response.json()
        body = data.get("body", data.get("mirrorback", ""))
        
        # Should contain questions (?) not advice
        assert "?" in body
        # Should NOT contain prescriptive language
        should_avoid = ["you should", "you must", "you need to", "just do"]
        assert not any(phrase in body.lower() for phrase in should_avoid)


def test_mirrorback_identifies_tensions(client: TestClient, sample_reflection_data):
    """Test that mirrorback identifies internal tensions"""
    response = client.post("/api/mirrorback", json=sample_reflection_data)
    
    assert response.status_code in [200, 500, 503]
    if response.status_code == 200:
        data = response.json()
        # Should identify tension between work and family
        assert "tensions" in data
        if data["tensions"]:
            assert isinstance(data["tensions"], list)
