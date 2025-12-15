"""
Tests for Graph Manager - Phase 3 Task 2

Validates graph operations, theme detection, and constitutional compliance.
"""

import pytest
from mirror_os.core import (
    GraphManager,
    GraphNode,
    GraphEdge,
    EdgeType,
    Theme
)
from mirror_os.storage.sqlite_storage import SQLiteStorage


class TestGraphBasics:
    """Test basic graph operations."""
    
    def test_manager_initialization(self, tmp_path):
        """Should initialize with storage."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        assert manager.storage == storage
        assert len(manager.nodes) == 0
        assert len(manager.edges) == 0
        assert len(manager.themes) == 0
    
    def test_add_node(self, tmp_path):
        """Should add nodes to graph."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        node = GraphNode(
            node_id="node_1",
            mirror_id="mirror_1",
            node_type="reflection",
            content="Test content"
        )
        
        success = manager.add_node(node)
        
        assert success is True
        assert "node_1" in manager.nodes
        assert manager.nodes["node_1"].mirror_id == "mirror_1"
    
    def test_add_duplicate_node(self, tmp_path):
        """Should not add duplicate nodes."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        node = GraphNode(
            node_id="node_1",
            mirror_id="mirror_1",
            node_type="reflection"
        )
        
        success1 = manager.add_node(node)
        success2 = manager.add_node(node)
        
        assert success1 is True
        assert success2 is False
    
    def test_add_edge(self, tmp_path):
        """Should add edges between nodes."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        node1 = GraphNode(node_id="node_1", mirror_id="mirror_1", node_type="reflection")
        node2 = GraphNode(node_id="node_2", mirror_id="mirror_1", node_type="reflection")
        
        manager.add_node(node1)
        manager.add_node(node2)
        
        edge = GraphEdge(
            from_node="node_1",
            to_node="node_2",
            edge_type=EdgeType.SIMILAR,
            weight=0.8
        )
        
        success = manager.add_edge(edge)
        
        assert success is True
        assert edge in manager.edges
    
    def test_add_edge_requires_existing_nodes(self, tmp_path):
        """Should raise error if nodes don't exist."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        edge = GraphEdge(
            from_node="nonexistent_1",
            to_node="nonexistent_2",
            edge_type=EdgeType.SIMILAR
        )
        
        with pytest.raises(ValueError, match="Both nodes must exist"):
            manager.add_edge(edge)
    
    def test_add_edge_same_mirror_only(self, tmp_path):
        """I2: Should reject edges between different mirrors."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        node1 = GraphNode(node_id="node_1", mirror_id="mirror_1", node_type="reflection")
        node2 = GraphNode(node_id="node_2", mirror_id="mirror_2", node_type="reflection")
        
        manager.add_node(node1)
        manager.add_node(node2)
        
        edge = GraphEdge(
            from_node="node_1",
            to_node="node_2",
            edge_type=EdgeType.SIMILAR
        )
        
        with pytest.raises(ValueError, match="I2 violation"):
            manager.add_edge(edge)


class TestGraphTraversal:
    """Test graph traversal operations."""
    
    def test_get_neighbors_outgoing(self, tmp_path):
        """Should get outgoing neighbors."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create simple graph: 1 -> 2, 1 -> 3
        for i in range(1, 4):
            manager.add_node(GraphNode(
                node_id=f"node_{i}",
                mirror_id="mirror_1",
                node_type="reflection"
            ))
        
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_1", "node_3", EdgeType.DEVELOPS))
        
        neighbors = manager.get_neighbors("node_1", direction="outgoing")
        
        assert len(neighbors) == 2
        neighbor_ids = {n.node_id for n in neighbors}
        assert neighbor_ids == {"node_2", "node_3"}
    
    def test_get_neighbors_incoming(self, tmp_path):
        """Should get incoming neighbors."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create graph: 1 -> 3, 2 -> 3
        for i in range(1, 4):
            manager.add_node(GraphNode(
                node_id=f"node_{i}",
                mirror_id="mirror_1",
                node_type="reflection"
            ))
        
        manager.add_edge(GraphEdge("node_1", "node_3", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_2", "node_3", EdgeType.DEVELOPS))
        
        neighbors = manager.get_neighbors("node_3", direction="incoming")
        
        assert len(neighbors) == 2
        neighbor_ids = {n.node_id for n in neighbors}
        assert neighbor_ids == {"node_1", "node_2"}
    
    def test_get_neighbors_filter_by_type(self, tmp_path):
        """Should filter neighbors by edge type."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        for i in range(1, 4):
            manager.add_node(GraphNode(
                node_id=f"node_{i}",
                mirror_id="mirror_1",
                node_type="reflection"
            ))
        
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_1", "node_3", EdgeType.DEVELOPS))
        
        similar_neighbors = manager.get_neighbors("node_1", edge_type=EdgeType.SIMILAR, direction="outgoing")
        
        assert len(similar_neighbors) == 1
        assert similar_neighbors[0].node_id == "node_2"
    
    def test_find_path(self, tmp_path):
        """Should find shortest path between nodes."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create path: 1 -> 2 -> 3 -> 4
        for i in range(1, 5):
            manager.add_node(GraphNode(
                node_id=f"node_{i}",
                mirror_id="mirror_1",
                node_type="reflection"
            ))
        
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.DEVELOPS))
        manager.add_edge(GraphEdge("node_2", "node_3", EdgeType.DEVELOPS))
        manager.add_edge(GraphEdge("node_3", "node_4", EdgeType.DEVELOPS))
        
        path = manager.find_path("node_1", "node_4")
        
        assert path == ["node_1", "node_2", "node_3", "node_4"]
    
    def test_find_path_no_connection(self, tmp_path):
        """Should return None if no path exists."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create disconnected nodes
        manager.add_node(GraphNode("node_1", "mirror_1", "reflection"))
        manager.add_node(GraphNode("node_2", "mirror_1", "reflection"))
        
        path = manager.find_path("node_1", "node_2")
        
        assert path is None
    
    def test_get_connected_component(self, tmp_path):
        """Should find all nodes in connected component."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create two separate components
        # Component 1: 1 <-> 2 <-> 3
        for i in range(1, 4):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_2", "node_3", EdgeType.SIMILAR))
        
        # Component 2: 4 <-> 5
        for i in range(4, 6):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        manager.add_edge(GraphEdge("node_4", "node_5", EdgeType.SIMILAR))
        
        component1 = manager.get_connected_component("node_1")
        component2 = manager.get_connected_component("node_4")
        
        assert component1 == {"node_1", "node_2", "node_3"}
        assert component2 == {"node_4", "node_5"}


class TestThemeDetection:
    """Test theme detection."""
    
    def test_detect_themes_minimum_nodes(self, tmp_path):
        """Should require minimum nodes for theme."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add only 2 nodes
        manager.add_node(GraphNode("node_1", "mirror_1", "reflection"))
        manager.add_node(GraphNode("node_2", "mirror_1", "reflection"))
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        
        themes = manager.detect_themes("mirror_1", min_nodes=3)
        
        assert len(themes) == 0  # Not enough nodes
    
    def test_detect_theme_in_cluster(self, tmp_path):
        """Should detect theme in densely connected cluster."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create fully connected cluster of 4 nodes
        for i in range(1, 5):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        
        # Make it densely connected
        for i in range(1, 5):
            for j in range(i + 1, 5):
                manager.add_edge(GraphEdge(f"node_{i}", f"node_{j}", EdgeType.SIMILAR))
        
        themes = manager.detect_themes("mirror_1", min_nodes=3, min_confidence=0.3)
        
        assert len(themes) >= 1
        assert themes[0].mirror_id == "mirror_1"
        assert len(themes[0].node_ids) >= 3
    
    def test_themes_have_disclaimers(self, tmp_path):
        """I9: All themes must have non-diagnostic disclaimers."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create cluster
        for i in range(1, 5):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        for i in range(1, 5):
            for j in range(i + 1, 5):
                manager.add_edge(GraphEdge(f"node_{i}", f"node_{j}", EdgeType.SIMILAR))
        
        themes = manager.detect_themes("mirror_1", min_nodes=3, min_confidence=0.3)
        
        if themes:
            assert themes[0].disclaimer
            assert "not" in themes[0].disclaimer.lower()
            assert "diagnosis" in themes[0].disclaimer.lower() or "judgment" in themes[0].disclaimer.lower()
    
    def test_theme_with_diagnostic_language_rejected(self, tmp_path):
        """I9: Should reject themes with diagnostic language."""
        with pytest.raises(ValueError, match="I9 violation"):
            Theme(
                theme_id="bad_theme",
                mirror_id="mirror_1",
                label="anxiety disorder pattern",
                description="Shows symptoms of pathology",
                node_ids=["node_1", "node_2"],
                confidence=0.8
            )
    
    def test_detect_themes_per_mirror(self, tmp_path):
        """I2: Themes should be detected per-mirror only."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add nodes for mirror_1
        for i in range(1, 5):
            manager.add_node(GraphNode(f"m1_node_{i}", "mirror_1", "reflection"))
        for i in range(1, 5):
            for j in range(i + 1, 5):
                manager.add_edge(GraphEdge(f"m1_node_{i}", f"m1_node_{j}", EdgeType.SIMILAR))
        
        # Add nodes for mirror_2
        for i in range(1, 5):
            manager.add_node(GraphNode(f"m2_node_{i}", "mirror_2", "reflection"))
        for i in range(1, 5):
            for j in range(i + 1, 5):
                manager.add_edge(GraphEdge(f"m2_node_{i}", f"m2_node_{j}", EdgeType.SIMILAR))
        
        themes_m1 = manager.detect_themes("mirror_1", min_nodes=3, min_confidence=0.3)
        themes_m2 = manager.detect_themes("mirror_2", min_nodes=3, min_confidence=0.3)
        
        # Themes should be separate
        if themes_m1:
            assert all(t.mirror_id == "mirror_1" for t in themes_m1)
            assert all(nid.startswith("m1_") for t in themes_m1 for nid in t.node_ids)
        
        if themes_m2:
            assert all(t.mirror_id == "mirror_2" for t in themes_m2)
            assert all(nid.startswith("m2_") for t in themes_m2 for nid in t.node_ids)


class TestCentrality:
    """Test centrality measures."""
    
    def test_get_central_nodes(self, tmp_path):
        """Should identify most central nodes."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create star graph: node_1 connected to all others
        for i in range(1, 6):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        
        # node_1 is hub
        for i in range(2, 6):
            manager.add_edge(GraphEdge("node_1", f"node_{i}", EdgeType.SIMILAR))
        
        central = manager.get_central_nodes("mirror_1", top_k=1)
        
        assert len(central) == 1
        assert central[0][0] == "node_1"  # node_id
        assert central[0][1] > 0.0  # centrality score
    
    def test_centrality_per_mirror(self, tmp_path):
        """I2: Centrality should be calculated per-mirror."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # mirror_1: node_1 is central
        for i in range(1, 5):
            manager.add_node(GraphNode(f"m1_node_{i}", "mirror_1", "reflection"))
        for i in range(2, 5):
            manager.add_edge(GraphEdge("m1_node_1", f"m1_node_{i}", EdgeType.SIMILAR))
        
        # mirror_2: node_2 is central
        for i in range(1, 5):
            manager.add_node(GraphNode(f"m2_node_{i}", "mirror_2", "reflection"))
        for i in range(1, 4):
            manager.add_edge(GraphEdge(f"m2_node_{i}", "m2_node_4", EdgeType.SIMILAR))
        
        central_m1 = manager.get_central_nodes("mirror_1", top_k=1)
        central_m2 = manager.get_central_nodes("mirror_2", top_k=1)
        
        assert central_m1[0][0] == "m1_node_1"
        assert central_m2[0][0] == "m2_node_4"


class TestStatistics:
    """Test graph statistics."""
    
    def test_system_wide_statistics(self, tmp_path):
        """Should calculate system-wide statistics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add nodes across multiple mirrors
        for i in range(1, 4):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        for i in range(4, 6):
            manager.add_node(GraphNode(f"node_{i}", "mirror_2", "concept"))
        
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_4", "node_5", EdgeType.DEVELOPS))
        
        stats = manager.get_statistics()
        
        assert stats["node_count"] == 5
        assert stats["edge_count"] == 2
        assert "reflection" in stats["node_types"]
        assert "concept" in stats["node_types"]
    
    def test_per_mirror_statistics(self, tmp_path):
        """Should calculate per-mirror statistics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # mirror_1: 3 nodes, 2 edges
        for i in range(1, 4):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_2", "node_3", EdgeType.DEVELOPS))
        
        # mirror_2: 2 nodes, 1 edge
        for i in range(4, 6):
            manager.add_node(GraphNode(f"node_{i}", "mirror_2", "concept"))
        manager.add_edge(GraphEdge("node_4", "node_5", EdgeType.CONTRASTS))
        
        stats_m1 = manager.get_statistics(mirror_id="mirror_1")
        stats_m2 = manager.get_statistics(mirror_id="mirror_2")
        
        assert stats_m1["node_count"] == 3
        assert stats_m1["edge_count"] == 2
        assert stats_m2["node_count"] == 2
        assert stats_m2["edge_count"] == 1


class TestConstitutionalCompliance:
    """Test I2, I9, I14 constitutional guarantees."""
    
    def test_i2_all_operations_per_mirror(self, tmp_path):
        """I2: All graph operations scoped to single mirror."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add nodes from different mirrors
        node1 = GraphNode("node_1", "mirror_1", "reflection")
        node2 = GraphNode("node_2", "mirror_2", "reflection")
        
        manager.add_node(node1)
        manager.add_node(node2)
        
        # Cannot create edge between different mirrors
        edge = GraphEdge("node_1", "node_2", EdgeType.SIMILAR)
        
        with pytest.raises(ValueError, match="I2 violation"):
            manager.add_edge(edge)
    
    def test_i9_themes_not_diagnostic(self, tmp_path):
        """I9: Themes must be descriptive, not diagnostic."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Create cluster
        for i in range(1, 5):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        for i in range(1, 5):
            for j in range(i + 1, 5):
                manager.add_edge(GraphEdge(f"node_{i}", f"node_{j}", EdgeType.SIMILAR))
        
        themes = manager.detect_themes("mirror_1", min_nodes=3)
        
        # Check no forbidden terms in detected themes
        forbidden = ["disorder", "pathology", "symptom", "disease", "diagnosis"]
        for theme in themes:
            text = f"{theme.label} {theme.description}".lower()
            for term in forbidden:
                assert term not in text, f"I9 violation: '{term}' in theme"
    
    def test_i14_no_cross_mirror_aggregation(self, tmp_path):
        """I14: Statistics never cross-identify mirrors."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add data for two mirrors
        for i in range(1, 4):
            manager.add_node(GraphNode(f"m1_{i}", "mirror_1", "reflection"))
        for i in range(1, 4):
            manager.add_node(GraphNode(f"m2_{i}", "mirror_2", "reflection"))
        
        # Get per-mirror stats
        stats_m1 = manager.get_statistics("mirror_1")
        stats_m2 = manager.get_statistics("mirror_2")
        
        # Should be separate
        assert stats_m1["node_count"] == 3
        assert stats_m2["node_count"] == 3
        assert stats_m1["mirror_id"] == "mirror_1"
        assert stats_m2["mirror_id"] == "mirror_2"
    
    def test_i1_data_sovereignty_clear_mirror(self, tmp_path):
        """I1: User can delete all their mirror data."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        # Add data for mirror_1
        for i in range(1, 4):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        
        # Add data for mirror_2
        manager.add_node(GraphNode("node_4", "mirror_2", "reflection"))
        
        # Clear mirror_1 data
        removed = manager.clear_mirror_data("mirror_1")
        
        assert removed == 3
        assert "node_1" not in manager.nodes
        assert "node_4" in manager.nodes  # mirror_2 data preserved


class TestEdgeTypes:
    """Test different edge types."""
    
    def test_similar_edge(self, tmp_path):
        """Should handle SIMILAR edges."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        manager.add_node(GraphNode("node_1", "mirror_1", "reflection"))
        manager.add_node(GraphNode("node_2", "mirror_1", "reflection"))
        
        edge = GraphEdge("node_1", "node_2", EdgeType.SIMILAR, weight=0.9)
        manager.add_edge(edge)
        
        neighbors = manager.get_neighbors("node_1", edge_type=EdgeType.SIMILAR)
        assert len(neighbors) == 1
    
    def test_contrasts_edge(self, tmp_path):
        """Should handle CONTRASTS edges."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        manager.add_node(GraphNode("node_1", "mirror_1", "reflection"))
        manager.add_node(GraphNode("node_2", "mirror_1", "reflection"))
        
        edge = GraphEdge("node_1", "node_2", EdgeType.CONTRASTS)
        manager.add_edge(edge)
        
        neighbors = manager.get_neighbors("node_1", edge_type=EdgeType.CONTRASTS)
        assert len(neighbors) == 1
    
    def test_multiple_edge_types(self, tmp_path):
        """Should handle multiple edge types in statistics."""
        storage = SQLiteStorage(str(tmp_path / "test.db"))
        manager = GraphManager(storage)
        
        for i in range(1, 4):
            manager.add_node(GraphNode(f"node_{i}", "mirror_1", "reflection"))
        
        manager.add_edge(GraphEdge("node_1", "node_2", EdgeType.SIMILAR))
        manager.add_edge(GraphEdge("node_2", "node_3", EdgeType.DEVELOPS))
        
        stats = manager.get_statistics("mirror_1")
        
        assert "similar" in stats["edge_types"]
        assert "develops" in stats["edge_types"]
        assert stats["edge_types"]["similar"] == 1
        assert stats["edge_types"]["develops"] == 1
