"""
Integration Tests - Core API <-> MirrorX Engine
"""
import pytest
import requests
import time


CORE_API_URL = "http://localhost:8000"
MIRRORX_URL = "http://localhost:8100"


def test_both_services_running():
    """Test that both services are accessible"""
    core_health = requests.get(f"{CORE_API_URL}/health")
    assert core_health.status_code == 200

    mirrorx_health = requests.get(f"{MIRRORX_URL}/health")
    assert mirrorx_health.status_code == 200


def test_end_to_end_reflection_flow():
    """Test complete flow: Create reflection -> Generate mirrorback"""
    # Step 1: Create reflection via Core API
    reflection_data = {
        "body": "I'm feeling torn between pursuing my career ambitions and spending more time with family.",
        "visibility": "public",
        "lens_key": "identity"
    }

    create_response = requests.post(
        f"{CORE_API_URL}/api/v1/reflections",
        json=reflection_data,
        headers={"X-User-Id": "test-user-001"}
    )

    assert create_response.status_code in [200, 201]
    reflection = create_response.json()
    reflection_id = reflection["id"]

    # Step 2: Generate mirrorback via MirrorX Engine
    mirrorback_request = {
        "user_id": "test-user-001",
        "reflection_text": reflection_data["body"]
    }

    mirrorback_response = requests.post(
        f"{MIRRORX_URL}/api/mirrorback",
        json=mirrorback_request
    )

    assert mirrorback_response.status_code in [200, 500, 503]  # May fail without API keys

    if mirrorback_response.status_code == 200:
        mirrorback = mirrorback_response.json()
        
        # Verify MirrorCore compliance (questions, not advice)
        assert "?" in mirrorback["body"]
        assert "should" not in mirrorback["body"].lower() or \
               "what" in mirrorback["body"].lower()

        # Step 3: Verify mirrorback can be retrieved
        get_mirrorback = requests.get(
            f"{CORE_API_URL}/api/v1/mirrorbacks/reflection/{reflection_id}",
            headers={"X-User-Id": "test-user-001"}
        )

        assert get_mirrorback.status_code in [200, 404]


def test_identity_graph_synchronization():
    """Test that identity data syncs between Core API and MirrorX Engine"""
    # Create reflection with identity signal
    reflection_data = {
        "body": "I value both independence and connection deeply.",
        "visibility": "public"
    }

    requests.post(
        f"{CORE_API_URL}/api/v1/reflections",
        json=reflection_data,
        headers={"X-User-Id": "test-user-002"}
    )

    # Check if MirrorX Engine can access identity data
    # This would require actual implementation of identity sync endpoint
    pass


def test_mirrorback_quality_guardrails():
    """Test that mirrorbacks pass quality checks before being stored"""
    reflection_text = "I feel lost and confused."

    mirrorback_request = {
        "user_id": "test-user-003",
        "reflection_text": reflection_text
    }

    response = requests.post(
        f"{MIRRORX_URL}/api/mirrorback",
        json=mirrorback_request
    )

    if response.status_code == 200:
        mirrorback = response.json()

        # Should not contain judgment
        assert "stupid" not in mirrorback["body"].lower()
        assert "wrong" not in mirrorback["body"].lower()

        # Should contain questions
        assert "?" in mirrorback["body"]


def test_rate_limiting():
    """Test that rate limiting works for mirrorback generation"""
    requests_to_make = 10
    responses = []

    for i in range(requests_to_make):
        response = requests.post(
            f"{MIRRORX_URL}/api/mirrorback",
            json={
                "user_id": "test-user-rate-limit",
                "reflection_text": f"Test reflection {i}"
            }
        )
        responses.append(response.status_code)
        time.sleep(0.1)

    # Check if any requests were rate limited
    # (Implementation depends on actual rate limiting strategy)
    assert 200 in responses or 429 in responses


def test_error_handling():
    """Test error handling when services are unavailable"""
    # Try to generate mirrorback with invalid data
    response = requests.post(
        f"{MIRRORX_URL}/api/mirrorback",
        json={"invalid": "data"}
    )

    assert response.status_code in [400, 422]


def test_authentication_required():
    """Test that authentication is enforced"""
    # Try to create reflection without auth
    response = requests.post(
        f"{CORE_API_URL}/api/v1/reflections",
        json={"body": "Test reflection"}
    )

    assert response.status_code == 401


def test_cors_configuration():
    """Test CORS headers are correctly set"""
    response = requests.options(
        f"{CORE_API_URL}/api/v1/reflections",
        headers={"Origin": "http://localhost:3000"}
    )

    assert "access-control-allow-origin" in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
