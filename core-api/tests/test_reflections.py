"""
Core API - Reflection endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_create_reflection(client: TestClient, auth_headers, sample_reflection_data):
    """Test creating a new reflection"""
    response = client.post(
        "/api/v1/reflections",
        json=sample_reflection_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["body"] == sample_reflection_data["body"]
    assert data["visibility"] == sample_reflection_data["visibility"]
    assert "id" in data
    assert "created_at" in data


def test_create_reflection_unauthorized(client: TestClient, sample_reflection_data):
    """Test creating reflection without authentication fails"""
    response = client.post(
        "/api/v1/reflections",
        json=sample_reflection_data
    )
    
    assert response.status_code == 401


def test_create_reflection_invalid_data(client: TestClient, auth_headers):
    """Test creating reflection with invalid data"""
    response = client.post(
        "/api/v1/reflections",
        json={"invalid": "data"},
        headers=auth_headers
    )
    
    assert response.status_code in [400, 422]  # Validation error


def test_get_reflection(client: TestClient, auth_headers, sample_reflection_data):
    """Test retrieving a specific reflection"""
    # First create a reflection
    create_response = client.post(
        "/api/v1/reflections",
        json=sample_reflection_data,
        headers=auth_headers
    )
    assert create_response.status_code in [200, 201]
    reflection_id = create_response.json()["id"]
    
    # Then retrieve it
    get_response = client.get(
        f"/api/v1/reflections/{reflection_id}",
        headers=auth_headers
    )
    
    assert get_response.status_code == 200
    data = get_response.json()
    assert data["id"] == reflection_id
    assert data["body"] == sample_reflection_data["body"]


def test_list_reflections(client: TestClient, auth_headers):
    """Test listing reflections"""
    response = client.get(
        "/api/v1/reflections",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    # Should return a list (may be empty)
    assert isinstance(response.json(), list)


def test_delete_reflection(client: TestClient, auth_headers, sample_reflection_data):
    """Test deleting a reflection"""
    # First create a reflection
    create_response = client.post(
        "/api/v1/reflections",
        json=sample_reflection_data,
        headers=auth_headers
    )
    assert create_response.status_code in [200, 201]
    reflection_id = create_response.json()["id"]
    
    # Then delete it
    delete_response = client.delete(
        f"/api/v1/reflections/{reflection_id}",
        headers=auth_headers
    )
    
    assert delete_response.status_code in [200, 204]
    
    # Verify it's gone
    get_response = client.get(
        f"/api/v1/reflections/{reflection_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


def test_reflection_rate_limiting(client: TestClient, auth_headers, sample_reflection_data):
    """Test rate limiting on reflection creation"""
    # This test may need to be adjusted based on rate limit settings
    # Try to create many reflections rapidly
    responses = []
    for _ in range(35):  # Exceeds 30/minute limit
        response = client.post(
            "/api/v1/reflections",
            json=sample_reflection_data,
            headers=auth_headers
        )
        responses.append(response.status_code)
    
    # At least one should be rate limited
    assert 429 in responses, "Rate limiting should trigger after 30 requests"
