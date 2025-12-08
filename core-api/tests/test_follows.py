"""
Core API - Follows (Social Graph) endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_follow_user(client: TestClient, auth_headers):
    """Test following another user"""
    target_user_id = "00000000-0000-0000-0000-000000000002"
    follow_data = {
        "following_id": target_user_id
    }
    
    response = client.post(
        "/api/v1/follows",
        json=follow_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]  # 409 if already following


def test_follow_self_fails(client: TestClient, auth_headers, test_user_id):
    """Test that following yourself fails"""
    follow_data = {
        "following_id": test_user_id
    }
    
    response = client.post(
        "/api/v1/follows",
        json=follow_data,
        headers=auth_headers
    )
    
    assert response.status_code in [400, 422]


def test_unfollow_user(client: TestClient, auth_headers):
    """Test unfollowing a user"""
    target_user_id = "00000000-0000-0000-0000-000000000002"
    response = client.delete(
        f"/api/v1/follows/{target_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204, 404]


def test_get_followers(client: TestClient, auth_headers, test_user_id):
    """Test getting user's followers"""
    response = client.get(
        f"/api/v1/follows/followers/{test_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_following(client: TestClient, auth_headers, test_user_id):
    """Test getting users that user follows"""
    response = client.get(
        f"/api/v1/follows/following/{test_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_check_follow_status(client: TestClient, auth_headers):
    """Test checking if following a specific user"""
    target_user_id = "00000000-0000-0000-0000-000000000002"
    response = client.get(
        f"/api/v1/follows/status/{target_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "is_following" in data


def test_get_mutual_follows(client: TestClient, auth_headers):
    """Test getting mutual follows"""
    response = client.get(
        "/api/v1/follows/mutual",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
