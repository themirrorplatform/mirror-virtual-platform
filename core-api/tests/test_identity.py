"""
Core API - Identity endpoint tests (Mirror OS Multi-Self)
"""
import pytest
from fastapi.testclient import TestClient


def test_list_user_identities(client: TestClient, auth_headers):
    """Test listing user's identities"""
    response = client.get(
        "/api/v1/identities",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should have at least primary identity
    if len(data) > 0:
        assert "label" in data[0]
        assert "is_active" in data[0]


def test_create_identity(client: TestClient, auth_headers):
    """Test creating a new identity"""
    identity_data = {
        "label": "work-self",
        "is_active": True
    }
    
    response = client.post(
        "/api/v1/identities",
        json=identity_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 409]  # 409 if already exists
    if response.status_code in [200, 201]:
        data = response.json()
        assert data["label"] == identity_data["label"]


def test_create_identity_unauthorized(client: TestClient):
    """Test creating identity without authentication fails"""
    response = client.post(
        "/api/v1/identities",
        json={"label": "test"}
    )
    
    assert response.status_code == 401


def test_get_active_identity(client: TestClient, auth_headers):
    """Test getting currently active identity"""
    response = client.get(
        "/api/v1/identities/active",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["is_active"] is True


def test_switch_active_identity(client: TestClient, auth_headers):
    """Test switching active identity"""
    identity_id = "00000000-0000-0000-0000-000000000001"
    response = client.post(
        f"/api/v1/identities/{identity_id}/activate",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]


def test_get_identity_axes(client: TestClient, auth_headers):
    """Test getting identity axes for a user"""
    response = client.get(
        "/api/v1/identities/axes",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_identity_axis(client: TestClient, auth_headers):
    """Test creating a new identity axis"""
    axis_data = {
        "key": "introvert_extrovert",
        "label": "Introvert ↔ Extrovert",
        "origin": "user_created"
    }
    
    response = client.post(
        "/api/v1/identities/axes",
        json=axis_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 409]


def test_record_axis_value(client: TestClient, auth_headers):
    """Test recording a value for an identity axis"""
    axis_id = 1
    value_data = {
        "value": 0.7,
        "context": "After reflecting on social interactions"
    }
    
    response = client.post(
        f"/api/v1/identities/axes/{axis_id}/values",
        json=value_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201, 404]


def test_get_identity_snapshot(client: TestClient, auth_headers):
    """Test getting identity snapshot"""
    response = client.get(
        "/api/v1/identities/snapshot",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "snapshot" in data or "axes" in data
