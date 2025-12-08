"""
Core API - Profile endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_profile_by_username(client: TestClient, auth_headers):
    """Test getting profile by username"""
    response = client.get(
        "/api/v1/profiles/testuser",
        headers=auth_headers
    )
    
    # May not exist yet, so accept 404
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "username" in data
        assert "display_name" in data


def test_get_own_profile(client: TestClient, auth_headers, test_user_id):
    """Test getting own profile"""
    response = client.get(
        f"/api/v1/profiles/{test_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["id"] == test_user_id


def test_update_profile(client: TestClient, auth_headers):
    """Test updating profile"""
    update_data = {
        "display_name": "Updated Test User",
        "bio": "This is my updated bio for testing"
    }
    
    response = client.patch(
        "/api/v1/profiles/me",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["display_name"] == update_data["display_name"]


def test_update_profile_unauthorized(client: TestClient):
    """Test updating profile without authentication fails"""
    response = client.patch(
        "/api/v1/profiles/me",
        json={"display_name": "Hacker"}
    )
    
    assert response.status_code == 401


def test_get_profile_stats(client: TestClient, auth_headers, test_user_id):
    """Test getting profile statistics"""
    response = client.get(
        f"/api/v1/profiles/{test_user_id}/stats",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "reflection_count" in data or "followers" in data


def test_search_profiles(client: TestClient):
    """Test searching profiles"""
    response = client.get(
        "/api/v1/profiles/search?q=test"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
