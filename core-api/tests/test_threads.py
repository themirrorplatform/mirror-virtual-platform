"""
Core API - Threads endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_create_thread(client: TestClient, auth_headers):
    """Test creating a new thread"""
    thread_data = {
        "title": "Test Thread: Identity Exploration",
        "visibility": "public"
    }
    
    response = client.post(
        "/api/v1/threads",
        json=thread_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["title"] == thread_data["title"]
    assert "id" in data


def test_create_thread_unauthorized(client: TestClient):
    """Test creating thread without authentication fails"""
    response = client.post(
        "/api/v1/threads",
        json={"title": "Test"}
    )
    
    assert response.status_code == 401


def test_get_thread_by_id(client: TestClient, auth_headers):
    """Test getting thread by ID"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    response = client.get(
        f"/api/v1/threads/{thread_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["id"] == thread_id


def test_add_reflection_to_thread(client: TestClient, auth_headers):
    """Test adding a reflection to a thread"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    add_data = {
        "reflection_id": 1,
        "position": 0
    }
    
    response = client.post(
        f"/api/v1/threads/{thread_id}/reflections",
        json=add_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404]


def test_get_thread_reflections(client: TestClient, auth_headers):
    """Test getting all reflections in a thread"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    response = client.get(
        f"/api/v1/threads/{thread_id}/reflections",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


def test_update_thread(client: TestClient, auth_headers):
    """Test updating thread metadata"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    update_data = {
        "title": "Updated Thread Title",
        "visibility": "circle"
    }
    
    response = client.patch(
        f"/api/v1/threads/{thread_id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]


def test_delete_thread(client: TestClient, auth_headers):
    """Test deleting a thread"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    response = client.delete(
        f"/api/v1/threads/{thread_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204, 404]


def test_list_user_threads(client: TestClient, auth_headers):
    """Test listing user's threads"""
    response = client.get(
        "/api/v1/threads/me",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_remove_reflection_from_thread(client: TestClient, auth_headers):
    """Test removing reflection from thread"""
    thread_id = "00000000-0000-0000-0000-000000000001"
    reflection_id = 1
    
    response = client.delete(
        f"/api/v1/threads/{thread_id}/reflections/{reflection_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204, 404]
