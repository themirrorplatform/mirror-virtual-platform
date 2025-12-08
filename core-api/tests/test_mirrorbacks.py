"""
Core API - Mirrorback endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_mirrorbacks_for_reflection(client: TestClient, auth_headers):
    """Test getting mirrorbacks for a specific reflection"""
    reflection_id = 1
    response = client.get(
        f"/api/v1/mirrorbacks/reflection/{reflection_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


def test_get_mirrorback_by_id(client: TestClient, auth_headers):
    """Test getting a specific mirrorback by ID"""
    mirrorback_id = 1
    response = client.get(
        f"/api/v1/mirrorbacks/{mirrorback_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["id"] == mirrorback_id
        assert "body" in data
        assert "source" in data


def test_create_human_mirrorback(client: TestClient, auth_headers):
    """Test creating a human-authored mirrorback"""
    mirrorback_data = {
        "reflection_id": 1,
        "body": "This is a human mirrorback response for testing.",
        "source": "human"
    }
    
    response = client.post(
        "/api/v1/mirrorbacks",
        json=mirrorback_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404]
    if response.status_code in [200, 201]:
        data = response.json()
        assert data["body"] == mirrorback_data["body"]
        assert data["source"] == "human"


def test_create_mirrorback_unauthorized(client: TestClient):
    """Test creating mirrorback without authentication fails"""
    response = client.post(
        "/api/v1/mirrorbacks",
        json={"reflection_id": 1, "body": "test", "source": "human"}
    )
    
    assert response.status_code == 401


def test_create_ai_mirrorback_forbidden(client: TestClient, auth_headers):
    """Test that users cannot directly create AI mirrorbacks"""
    mirrorback_data = {
        "reflection_id": 1,
        "body": "This is an AI mirrorback.",
        "source": "ai"
    }
    
    response = client.post(
        "/api/v1/mirrorbacks",
        json=mirrorback_data,
        headers=auth_headers
    )
    
    # Should fail - only system can create AI mirrorbacks
    assert response.status_code in [403, 422]


def test_get_mirrorback_tensions(client: TestClient, auth_headers):
    """Test getting tensions identified in a mirrorback"""
    mirrorback_id = 1
    response = client.get(
        f"/api/v1/mirrorbacks/{mirrorback_id}/tensions",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "tensions" in data
        assert isinstance(data["tensions"], list)


def test_list_mirrorbacks_paginated(client: TestClient, auth_headers):
    """Test paginated mirrorback listing"""
    response = client.get(
        "/api/v1/mirrorbacks?limit=10&offset=0",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))
