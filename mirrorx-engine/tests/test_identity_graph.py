"""
MirrorX Engine - Identity Graph tests
"""
import pytest
from unittest.mock import Mock, patch


def test_identity_graph_initialization():
    """Test identity graph initialization"""
    from app.identity_graph import IdentityGraph
    
    user_id = "test-user-001"
    graph = IdentityGraph(user_id)
    
    assert graph.user_id == user_id
    assert hasattr(graph, 'nodes')
    assert hasattr(graph, 'edges')


def test_add_belief_node():
    """Test adding a belief node to identity graph"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    belief_id = graph.add_node("belief", "Work defines my worth")
    
    assert belief_id is not None
    assert graph.get_node(belief_id) is not None


def test_add_value_node():
    """Test adding a value node to identity graph"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    value_id = graph.add_node("value", "Achievement")
    
    assert value_id is not None
    node = graph.get_node(value_id)
    assert node["type"] == "value"


def test_add_edge_between_nodes():
    """Test adding edges between graph nodes"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    belief_id = graph.add_node("belief", "Success requires sacrifice")
    value_id = graph.add_node("value", "Achievement")
    
    edge_id = graph.add_edge(belief_id, value_id, "supports")
    
    assert edge_id is not None
    assert graph.has_edge(belief_id, value_id)


def test_detect_tension():
    """Test detecting tensions in identity graph"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    belief1 = graph.add_node("belief", "I need to work constantly")
    belief2 = graph.add_node("belief", "Rest is essential for health")
    
    # These beliefs are in tension
    tension = graph.detect_tension(belief1, belief2)
    
    assert tension is not None
    assert tension["type"] in ["value_conflict", "behavioral_mismatch"]


def test_find_connected_beliefs():
    """Test finding beliefs connected to a value"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    value_id = graph.add_node("value", "Freedom")
    belief1 = graph.add_node("belief", "I should be financially independent")
    belief2 = graph.add_node("belief", "I need autonomy in my choices")
    
    graph.add_edge(belief1, value_id, "supports")
    graph.add_edge(belief2, value_id, "supports")
    
    connected = graph.get_connected_nodes(value_id, "belief")
    
    assert len(connected) >= 2


def test_identity_delta_calculation():
    """Test calculating identity deltas between reflections"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    
    # Initial state
    graph.add_node("belief", "Money brings happiness")
    initial_snapshot = graph.snapshot()
    
    # New reflection changes belief
    graph.add_node("belief", "Relationships bring happiness")
    new_snapshot = graph.snapshot()
    
    delta = graph.calculate_delta(initial_snapshot, new_snapshot)
    
    assert "new_beliefs" in delta or "updated_beliefs" in delta


def test_graph_persistence():
    """Test saving and loading identity graph"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    graph.add_node("belief", "Test belief")
    graph.add_node("value", "Test value")
    
    # Serialize
    serialized = graph.to_dict()
    
    assert "nodes" in serialized
    assert "edges" in serialized
    assert len(serialized["nodes"]) >= 2


def test_find_belief_loops():
    """Test finding circular reasoning patterns"""
    from app.identity_graph import IdentityGraph
    
    graph = IdentityGraph("test-user")
    b1 = graph.add_node("belief", "I'm not good enough")
    b2 = graph.add_node("belief", "I need to prove myself")
    b3 = graph.add_node("belief", "Proving myself means I'm inadequate")
    
    graph.add_edge(b1, b2, "leads_to")
    graph.add_edge(b2, b3, "leads_to")
    graph.add_edge(b3, b1, "leads_to")  # Loop!
    
    loops = graph.find_loops()
    
    assert len(loops) > 0
