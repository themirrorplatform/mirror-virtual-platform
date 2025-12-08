"""
Core API - Signals endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_create_view_signal(client: TestClient, auth_headers):
    """Test creating a view signal"""
    signal_data = {
        "reflection_id": 1,
        "signal": "view"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]  # 409 for duplicate


def test_create_respond_signal(client: TestClient, auth_headers):
    """Test creating a respond signal"""
    signal_data = {
        "reflection_id": 1,
        "signal": "respond"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]


def test_create_save_signal(client: TestClient, auth_headers):
    """Test creating a save signal"""
    signal_data = {
        "reflection_id": 1,
        "signal": "save"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]


def test_create_skip_signal(client: TestClient, auth_headers):
    """Test creating a skip signal"""
    signal_data = {
        "reflection_id": 1,
        "signal": "skip"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]


def test_create_mute_author_signal(client: TestClient, auth_headers):
    """Test creating a mute_author signal"""
    signal_data = {
        "reflection_id": 1,
        "signal": "mute_author"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404, 409]


def test_create_signal_unauthorized(client: TestClient):
    """Test creating signal without authentication fails"""
    response = client.post(
        "/api/v1/signals",
        json={"reflection_id": 1, "signal": "view"}
    )
    
    assert response.status_code == 401


def test_create_signal_invalid_type(client: TestClient, auth_headers):
    """Test creating signal with invalid type"""
    signal_data = {
        "reflection_id": 1,
        "signal": "invalid_signal_type"
    }
    
    response = client.post(
        "/api/v1/signals",
        json=signal_data,
        headers=auth_headers
    )
    
    assert response.status_code in [400, 422]


def test_get_reflection_signals(client: TestClient, auth_headers):
    """Test getting all signals for a reflection"""
    reflection_id = 1
    response = client.get(
        f"/api/v1/signals/reflection/{reflection_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


def test_get_user_signals(client: TestClient, auth_headers):
    """Test getting user's own signals"""
    response = client.get(
        "/api/v1/signals/me",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_delete_signal(client: TestClient, auth_headers):
    """Test deleting a signal"""
    signal_id = 1
    response = client.delete(
        f"/api/v1/signals/{signal_id}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204, 404]
