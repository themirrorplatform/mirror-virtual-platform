"""
Simple API Test Script

Tests the Mirror API without complex fixtures.
"""

import requests
import json

BASE_URL = "http://localhost:8000"
MIRROR_ID = "test_mirror_12345"

def test_health():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health Check: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    print("✅ Health check passed\n")

def test_root():
    """Test root endpoint."""
    response = requests.get(f"{BASE_URL}/")
    print(f"Root: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert "constitution" in response.json()
    print("✅ Root endpoint passed\n")

def test_reflect_without_mirror_id():
    """Test reflect requires mirror_id."""
    response = requests.post(
        f"{BASE_URL}/api/v1/reflect",
        json={"text": "I feel uncertain about my path"}
    )
    print(f"Reflect without mirror_id: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 400
    print("✅ Mirror ID validation passed\n")

def test_reflect_with_mirror_id():
    """Test reflect with valid mirror_id."""
    response = requests.post(
        f"{BASE_URL}/api/v1/reflect",
        headers={"X-Mirror-Id": MIRROR_ID},
        json={"text": "I'm feeling stuck between two choices"}
    )
    print(f"Reflect with mirror_id: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Reflection ID: {data.get('reflection_id')}")
        print(f"Mirrorback: {data.get('mirrorback')[:100]}...")
        print(f"Shapes: {data.get('detected_shapes')}")
        print(f"Tensions: {data.get('tension_count')}")
        print(f"Blocked: {data.get('blocked')}")
        assert "reflection_id" in data
        assert "mirrorback" in data
        print("✅ Reflection generation passed\n")
        return data.get('reflection_id')
    else:
        print(f"Error: {response.json()}")
        return None

def test_get_recent_reflections():
    """Test getting recent reflections."""
    response = requests.get(
        f"{BASE_URL}/api/v1/reflections/recent",
        headers={"X-Mirror-Id": MIRROR_ID}
    )
    print(f"Get recent reflections: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} reflections")
        print("✅ Get recent reflections passed\n")
    else:
        print(f"Error: {response.json()}")

def test_graph_stats():
    """Test graph statistics."""
    response = requests.get(
        f"{BASE_URL}/api/v1/graph/stats",
        headers={"X-Mirror-Id": MIRROR_ID}
    )
    print(f"Graph stats: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print("✅ Graph stats passed\n")
    else:
        print(f"Error: {response.json()}")

def test_shape_stats():
    """Test shape statistics."""
    response = requests.get(
        f"{BASE_URL}/api/v1/statistics/shapes",
        headers={"X-Mirror-Id": MIRROR_ID}
    )
    print(f"Shape stats: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print("✅ Shape stats passed\n")
    else:
        print(f"Error: {response.json()}")

def test_constitutional_headers():
    """Test constitutional headers."""
    response = requests.get(f"{BASE_URL}/health")
    print("Constitutional Headers:")
    print(f"X-Behavioral-Tracking: {response.headers.get('X-Behavioral-Tracking')}")
    assert response.headers.get('X-Behavioral-Tracking') == 'false'
    print("✅ Constitutional headers passed\n")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Mirror API Manual Tests")
    print("=" * 60)
    print()
    
    try:
        print("Starting tests...\n")
        
        test_health()
        test_root()
        test_constitutional_headers()
        test_reflect_without_mirror_id()
        reflection_id = test_reflect_with_mirror_id()
        test_get_recent_reflections()
        test_graph_stats()
        test_shape_stats()
        
        print("=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print("Please start the API server first:")
        print("  cd mirror_api")
        print("  python main.py")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
