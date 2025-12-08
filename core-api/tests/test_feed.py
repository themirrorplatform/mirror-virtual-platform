"""
Core API - Feed endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_personalized_feed(client: TestClient, auth_headers):
    """Test getting personalized feed"""
    response = client.get(
        "/api/v1/feed",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_get_feed_with_pagination(client: TestClient, auth_headers):
    """Test feed pagination"""
    response = client.get(
        "/api/v1/feed?limit=5&cursor=abc123",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_get_feed_unauthorized(client: TestClient):
    """Test getting feed without authentication fails"""
    response = client.get("/api/v1/feed")
    
    assert response.status_code == 401


def test_get_feed_by_lens(client: TestClient, auth_headers):
    """Test getting feed filtered by lens"""
    response = client.get(
        "/api/v1/feed?lens=identity",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_get_public_feed(client: TestClient):
    """Test getting public feed (no auth required)"""
    response = client.get("/api/v1/feed/public")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_get_following_feed(client: TestClient, auth_headers):
    """Test getting feed from followed users"""
    response = client.get(
        "/api/v1/feed/following",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_refresh_feed(client: TestClient, auth_headers):
    """Test refreshing feed algorithm"""
    response = client.post(
        "/api/v1/feed/refresh",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204]


def test_get_feed_state(client: TestClient, auth_headers):
    """Test getting user's feed state"""
    response = client.get(
        "/api/v1/feed/state",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "cursor" in data or "last_refresh" in data
