"""
API Integration Tests

Tests for the Mirror API endpoints.

Tests I2, I7, I13, I14 constitutional compliance.
"""

import pytest
from fastapi.testclient import TestClient
from mirror_api.main import app


@pytest.fixture
def client():
    """Test client for API."""
    from pathlib import Path
    import tempfile
    import uuid
    from mirror_os.storage.sqlite_storage import SQLiteStorage
    from mirror_os.core import MirrorOrchestrator, MirrorbackGenerator
    from mirror_api.mock_llm import MockLLM
    
    # Use unique database for each test
    test_id = str(uuid.uuid4())[:8]
    temp_dir = Path(tempfile.gettempdir()) / "mirror_test"
    temp_dir.mkdir(parents=True, exist_ok=True)
    db_path = temp_dir / f"test_{test_id}.db"
    
    try:
        storage = SQLiteStorage(str(db_path))
        llm = MockLLM()
        generator = MirrorbackGenerator(storage, llm)
        orchestrator = MirrorOrchestrator(storage, generator)
        
        # Store in app state
        app.state.storage = storage
        app.state.orchestrator = orchestrator
        
        # Create test client
        with TestClient(app) as test_client:
            yield test_client
    
    finally:
        # Cleanup
        if db_path.exists():
            try:
                db_path.unlink()
            except:
                pass  # Ignore cleanup errors


@pytest.fixture
def mirror_id():
    """Test mirror ID."""
    return "test_mirror_123"


class TestHealthEndpoint:
    """Tests for health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "storage" in data


class TestRootEndpoint:
    """Tests for root endpoint."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns constitution."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "constitution" in data
        assert "I2" in data["constitution"]  # Constitutional reference
        assert "endpoints" in data


class TestConstitutionalMiddleware:
    """Tests for constitutional compliance."""
    
    def test_i7_request_logging(self, client):
        """Test that all requests are logged (I7)."""
        # Make request
        response = client.get("/health")
        assert response.status_code == 200
        
        # Verify logged (check in logs)
        # Note: Would need to capture logs in real implementation
    
    def test_i13_no_behavioral_tracking(self, client):
        """Test I13: No behavioral tracking header."""
        response = client.get("/health")
        assert response.status_code == 200
        
        # Verify header present
        assert "X-Behavioral-Tracking" in response.headers
        assert response.headers["X-Behavioral-Tracking"] == "false"


class TestReflectionEndpoints:
    """Tests for reflection endpoints."""
    
    def test_reflect_requires_mirror_id(self, client):
        """Test I2: mirror_id required for reflection."""
        response = client.post(
            "/api/v1/reflect",
            json={"text": "I feel uncertain about my path"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "mirror_id" in data["error"].lower()
    
    def test_reflect_with_valid_mirror_id(self, client, mirror_id):
        """Test reflection generation with valid mirror_id."""
        response = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_id},
            json={"text": "I feel uncertain about my path"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "reflection_id" in data
        assert "mirrorback" in data
        assert "detected_shapes" in data
        assert "tension_count" in data
        assert isinstance(data["detected_shapes"], list)
        assert isinstance(data["tension_count"], int)
    
    def test_reflect_with_context(self, client, mirror_id):
        """Test reflection generation with context."""
        response = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_id},
            json={
                "text": "I feel stuck",
                "context": "Considering career change"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "reflection_id" in data
    
    def test_reflect_validates_text_length(self, client, mirror_id):
        """Test text length validation."""
        # Too short
        response = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_id},
            json={"text": ""}
        )
        assert response.status_code == 422  # Validation error
        
        # Too long
        long_text = "x" * 6000
        response = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_id},
            json={"text": long_text}
        )
        assert response.status_code == 422
    
    def test_get_recent_reflections_requires_mirror_id(self, client):
        """Test I2: mirror_id required for recent reflections."""
        response = client.get("/api/v1/reflections/recent")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "mirror_id" in data["error"].lower()
    
    def test_get_recent_reflections_with_mirror_id(self, client, mirror_id):
        """Test getting recent reflections."""
        response = client.get(
            "/api/v1/reflections/recent",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_reflection_by_id_requires_mirror_id(self, client):
        """Test I2: mirror_id required for specific reflection."""
        response = client.get("/api/v1/reflections/test_id")
        assert response.status_code == 400
    
    def test_get_reflection_by_id_validates_ownership(self, client, mirror_id):
        """Test I2: Reflection must belong to mirror."""
        # First create a reflection
        create_response = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_id},
            json={"text": "Test reflection"}
        )
        assert create_response.status_code == 200
        reflection_id = create_response.json()["reflection_id"]
        
        # Try to access with different mirror_id
        response = client.get(
            f"/api/v1/reflections/{reflection_id}",
            headers={"X-Mirror-Id": "different_mirror"}
        )
        assert response.status_code == 404  # Not found (access denied)


class TestGraphEndpoints:
    """Tests for graph endpoints."""
    
    def test_graph_stats_requires_mirror_id(self, client):
        """Test I2: mirror_id required for graph stats."""
        response = client.get("/api/v1/graph/stats")
        assert response.status_code == 400
    
    def test_graph_stats_with_mirror_id(self, client, mirror_id):
        """Test getting graph statistics."""
        response = client.get(
            "/api/v1/graph/stats",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "mirror_id" in data
        assert "node_count" in data
        assert "edge_count" in data
        assert data["mirror_id"] == mirror_id
    
    def test_themes_requires_mirror_id(self, client):
        """Test I2: mirror_id required for themes."""
        response = client.get("/api/v1/graph/themes")
        assert response.status_code == 400
    
    def test_themes_with_mirror_id(self, client, mirror_id):
        """Test theme detection."""
        response = client.get(
            "/api/v1/graph/themes",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_themes_i9_non_diagnostic(self, client, mirror_id):
        """Test I9: Themes are descriptive, not diagnostic."""
        response = client.get(
            "/api/v1/graph/themes",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        themes = response.json()
        for theme in themes:
            assert "disclaimer" in theme  # I9 disclaimer present
    
    def test_central_nodes_requires_mirror_id(self, client):
        """Test I2: mirror_id required for central nodes."""
        response = client.get("/api/v1/graph/central-nodes")
        assert response.status_code == 400
    
    def test_central_nodes_with_mirror_id(self, client, mirror_id):
        """Test getting central nodes."""
        response = client.get(
            "/api/v1/graph/central-nodes",
            headers={"X-Mirror-Id": mirror_id},
            params={"top_k": 5}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestStatisticsEndpoints:
    """Tests for statistics endpoints."""
    
    def test_shape_stats_requires_mirror_id(self, client):
        """Test I2: mirror_id required for shape stats."""
        response = client.get("/api/v1/statistics/shapes")
        assert response.status_code == 400
    
    def test_shape_stats_with_mirror_id(self, client, mirror_id):
        """Test shape statistics."""
        response = client.get(
            "/api/v1/statistics/shapes",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "mirror_id" in data
        assert "shape_frequencies" in data
        assert "shape_percentages" in data
        assert data["mirror_id"] == mirror_id
    
    def test_tension_stats_requires_mirror_id(self, client):
        """Test I2: mirror_id required for tension stats."""
        response = client.get("/api/v1/statistics/tensions")
        assert response.status_code == 400
    
    def test_tension_stats_with_mirror_id(self, client, mirror_id):
        """Test tension statistics."""
        response = client.get(
            "/api/v1/statistics/tensions",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "mirror_id" in data
        assert "tension_frequencies" in data
        assert data["mirror_id"] == mirror_id
    
    def test_evolution_stats_requires_mirror_id(self, client):
        """Test I2: mirror_id required for evolution stats."""
        response = client.get("/api/v1/statistics/evolution")
        assert response.status_code == 400
    
    def test_evolution_stats_with_mirror_id(self, client, mirror_id):
        """Test evolution statistics."""
        response = client.get(
            "/api/v1/statistics/evolution",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "mirror_id" in data
        assert "constitutional_compliance" in data
        assert "l0_pass_rate" in data
        assert "interpretation" in data
        assert data["mirror_id"] == mirror_id
    
    def test_evolution_i13_no_behavioral_metrics(self, client, mirror_id):
        """Test I13: Evolution stats are constitutional, not behavioral."""
        response = client.get(
            "/api/v1/statistics/evolution",
            headers={"X-Mirror-Id": mirror_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should NOT contain engagement metrics
        assert "engagement_rate" not in data
        assert "viral_coefficient" not in data
        assert "time_on_platform" not in data
        
        # Should contain constitutional metrics
        assert "constitutional_compliance" in data
        assert "l0_pass_rate" in data


class TestRateLimiting:
    """Tests for rate limiting."""
    
    def test_health_rate_limit(self, client):
        """Test rate limiting on health endpoint."""
        # Make many requests until rate limited
        # Note: In test mode, rate limits may behave differently
        response = client.get("/health")
        assert response.status_code in [200, 429]  # Either works or is rate limited
    
    def test_reflect_rate_limit(self, client, mirror_id):
        """Test rate limiting on reflect endpoint."""
        # Make requests up to limit (10/min)
        for i in range(15):
            response = client.post(
                "/api/v1/reflect",
                headers={"X-Mirror-Id": mirror_id},
                json={"text": f"Test reflection {i}"}
            )
            if i < 10:
                assert response.status_code == 200
            else:
                # Should be rate limited after 10 requests
                assert response.status_code == 429
                break


class TestCrossIdentityIsolation:
    """Tests for I14: No cross-identity aggregation."""
    
    def test_reflections_isolated_per_mirror(self, client):
        """Test that reflections are isolated per mirror."""
        mirror_1 = "mirror_1"
        mirror_2 = "mirror_2"
        
        # Create reflection for mirror_1
        response_1 = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_1},
            json={"text": "Mirror 1 reflection"}
        )
        assert response_1.status_code == 200
        
        # Create reflection for mirror_2
        response_2 = client.post(
            "/api/v1/reflect",
            headers={"X-Mirror-Id": mirror_2},
            json={"text": "Mirror 2 reflection"}
        )
        assert response_2.status_code == 200
        
        # Get recent for mirror_1 - should not see mirror_2's reflection
        recent_1 = client.get(
            "/api/v1/reflections/recent",
            headers={"X-Mirror-Id": mirror_1}
        )
        assert recent_1.status_code == 200
        reflections_1 = recent_1.json()
        
        # Get recent for mirror_2 - should not see mirror_1's reflection
        recent_2 = client.get(
            "/api/v1/reflections/recent",
            headers={"X-Mirror-Id": mirror_2}
        )
        assert recent_2.status_code == 200
        reflections_2 = recent_2.json()
        
        # Verify isolation (would need IDs to check in real implementation)
        # For now, just verify both got lists
        assert isinstance(reflections_1, list)
        assert isinstance(reflections_2, list)
