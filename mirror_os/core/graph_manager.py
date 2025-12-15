"""
Graph Manager - Phase 3 Task 2

Manages identity graph operations - semantic connections, theme detection, traversal.

Constitutional Guarantees:
- I2 (Identity Locality): All operations scoped to single mirror
- I14 (No Cross-Identity Inference): No aggregation across mirrors
- I9 (Anti-Diagnosis): Themes are descriptive, not diagnostic

The identity graph is the semantic structure of a mirror's reflections:
- Nodes: Reflections, concepts, tensions
- Edges: Semantic relationships (similar, contrasts, develops, resolves)
- Themes: Emergent patterns detected within the graph
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime
from enum import Enum
import math


class EdgeType(Enum):
    """Types of relationships between nodes."""
    SIMILAR = "similar"  # Similar themes/content
    CONTRASTS = "contrasts"  # Opposing ideas
    DEVELOPS = "develops"  # One develops/builds on another
    RESOLVES = "resolves"  # One resolves tension from another
    REFERENCES = "references"  # Explicit reference
    TEMPORAL = "temporal"  # Temporal sequence


@dataclass
class GraphNode:
    """
    A node in the identity graph.
    
    I2: Always scoped to a single mirror.
    """
    node_id: str
    mirror_id: str
    node_type: str  # "reflection", "concept", "tension"
    content: Optional[str] = None
    metadata: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    
    def __hash__(self):
        return hash(self.node_id)
    
    def __eq__(self, other):
        if not isinstance(other, GraphNode):
            return False
        return self.node_id == other.node_id


@dataclass
class GraphEdge:
    """
    An edge connecting two nodes.
    
    I2: Both nodes must be from same mirror.
    """
    from_node: str
    to_node: str
    edge_type: EdgeType
    weight: float = 1.0  # Strength of relationship (0.0-1.0)
    metadata: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    
    def __hash__(self):
        return hash((self.from_node, self.to_node, self.edge_type.value))
    
    def __eq__(self, other):
        if not isinstance(other, GraphEdge):
            return False
        return (self.from_node == other.from_node and 
                self.to_node == other.to_node and
                self.edge_type == other.edge_type)


@dataclass
class Theme:
    """
    An emergent theme detected in the graph.
    
    I9: Themes are descriptive, not diagnostic.
    I2: Themes are per-mirror only.
    """
    theme_id: str
    mirror_id: str
    label: str
    description: str
    node_ids: List[str]  # Nodes that contribute to this theme
    confidence: float  # 0.0-1.0
    detected_at: datetime = field(default_factory=datetime.now)
    disclaimer: str = "This is an observed pattern, not a diagnosis or judgment."
    
    def __post_init__(self):
        # I9: Verify no diagnostic language
        forbidden = ["disorder", "pathology", "symptom", "disease", "diagnosis"]
        text = f"{self.label} {self.description}".lower()
        for term in forbidden:
            if term in text:
                raise ValueError(f"I9 violation: Diagnostic term '{term}' not allowed in theme")


class GraphManager:
    """
    Manages identity graph for a mirror.
    
    I2: All operations are per-mirror.
    I14: No cross-mirror analysis.
    I9: Theme detection is descriptive, not diagnostic.
    """
    
    def __init__(self, storage):
        """
        Initialize graph manager.
        
        Args:
            storage: MirrorStorage instance for persistence
        """
        self.storage = storage
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: Set[GraphEdge] = set()
        self.themes: Dict[str, Theme] = {}
        
        # Adjacency lists for efficient traversal
        self.outgoing: Dict[str, List[GraphEdge]] = {}  # node_id -> edges from node
        self.incoming: Dict[str, List[GraphEdge]] = {}  # node_id -> edges to node
    
    def add_node(self, node: GraphNode) -> bool:
        """
        Add a node to the graph.
        
        I2: Node must have mirror_id.
        
        Args:
            node: GraphNode to add
            
        Returns:
            True if added, False if already exists
        """
        if node.node_id in self.nodes:
            return False
        
        self.nodes[node.node_id] = node
        self.outgoing[node.node_id] = []
        self.incoming[node.node_id] = []
        
        return True
    
    def add_edge(self, edge: GraphEdge) -> bool:
        """
        Add an edge between nodes.
        
        I2: Both nodes must exist and be from same mirror.
        
        Args:
            edge: GraphEdge to add
            
        Returns:
            True if added, False if already exists or nodes from different mirrors
        """
        # Verify both nodes exist
        if edge.from_node not in self.nodes or edge.to_node not in self.nodes:
            raise ValueError(f"Both nodes must exist: {edge.from_node}, {edge.to_node}")
        
        # I2: Verify same mirror
        from_mirror = self.nodes[edge.from_node].mirror_id
        to_mirror = self.nodes[edge.to_node].mirror_id
        if from_mirror != to_mirror:
            raise ValueError(f"I2 violation: Cannot connect nodes from different mirrors ({from_mirror}, {to_mirror})")
        
        if edge in self.edges:
            return False
        
        self.edges.add(edge)
        self.outgoing[edge.from_node].append(edge)
        self.incoming[edge.to_node].append(edge)
        
        return True
    
    def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Get a node by ID."""
        return self.nodes.get(node_id)
    
    def get_neighbors(
        self,
        node_id: str,
        edge_type: Optional[EdgeType] = None,
        direction: str = "outgoing"
    ) -> List[GraphNode]:
        """
        Get neighboring nodes.
        
        Args:
            node_id: Node to get neighbors for
            edge_type: Optional filter by edge type
            direction: "outgoing", "incoming", or "both"
            
        Returns:
            List of neighboring GraphNodes
        """
        if node_id not in self.nodes:
            return []
        
        neighbors = []
        
        if direction in ["outgoing", "both"]:
            for edge in self.outgoing[node_id]:
                if edge_type is None or edge.edge_type == edge_type:
                    neighbors.append(self.nodes[edge.to_node])
        
        if direction in ["incoming", "both"]:
            for edge in self.incoming[node_id]:
                if edge_type is None or edge.edge_type == edge_type:
                    neighbors.append(self.nodes[edge.from_node])
        
        return neighbors
    
    def find_path(
        self,
        from_node_id: str,
        to_node_id: str,
        max_depth: int = 5
    ) -> Optional[List[str]]:
        """
        Find shortest path between two nodes using BFS.
        
        Args:
            from_node_id: Starting node
            to_node_id: Target node
            max_depth: Maximum path length
            
        Returns:
            List of node IDs representing path, or None if no path
        """
        if from_node_id not in self.nodes or to_node_id not in self.nodes:
            return None
        
        if from_node_id == to_node_id:
            return [from_node_id]
        
        # BFS
        queue = [(from_node_id, [from_node_id])]
        visited = {from_node_id}
        
        while queue:
            current, path = queue.pop(0)
            
            if len(path) >= max_depth:
                continue
            
            for edge in self.outgoing[current]:
                next_node = edge.to_node
                
                if next_node == to_node_id:
                    return path + [next_node]
                
                if next_node not in visited:
                    visited.add(next_node)
                    queue.append((next_node, path + [next_node]))
        
        return None
    
    def get_connected_component(self, node_id: str) -> Set[str]:
        """
        Get all nodes in the connected component containing this node.
        
        Args:
            node_id: Starting node
            
        Returns:
            Set of node IDs in same connected component
        """
        if node_id not in self.nodes:
            return set()
        
        component = set()
        stack = [node_id]
        
        while stack:
            current = stack.pop()
            if current in component:
                continue
            
            component.add(current)
            
            # Add all neighbors (both directions)
            for edge in self.outgoing[current]:
                if edge.to_node not in component:
                    stack.append(edge.to_node)
            
            for edge in self.incoming[current]:
                if edge.from_node not in component:
                    stack.append(edge.from_node)
        
        return component
    
    def detect_themes(
        self,
        mirror_id: str,
        min_nodes: int = 3,
        min_confidence: float = 0.5
    ) -> List[Theme]:
        """
        Detect themes in the graph using community detection.
        
        I2: Only detects themes within single mirror.
        I9: Themes are descriptive, not diagnostic.
        
        Args:
            mirror_id: Mirror to detect themes for
            min_nodes: Minimum nodes required for a theme
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of detected Theme objects
        """
        # Filter nodes for this mirror
        mirror_nodes = {
            nid: node for nid, node in self.nodes.items()
            if node.mirror_id == mirror_id
        }
        
        if len(mirror_nodes) < min_nodes:
            return []
        
        # Find densely connected components
        visited = set()
        themes = []
        theme_count = 0
        
        for node_id in mirror_nodes:
            if node_id in visited:
                continue
            
            # Get connected component
            component = self._get_dense_subgraph(node_id, mirror_nodes)
            
            if len(component) >= min_nodes:
                visited.update(component)
                
                # Calculate density/confidence
                edge_count = sum(
                    1 for edge in self.edges
                    if edge.from_node in component and edge.to_node in component
                )
                max_edges = len(component) * (len(component) - 1)
                confidence = edge_count / max_edges if max_edges > 0 else 0.0
                
                if confidence >= min_confidence:
                    # Generate theme
                    theme_id = f"theme_{mirror_id}_{theme_count}"
                    theme_count += 1
                    
                    # Simple label based on node types
                    node_types = [self.nodes[nid].node_type for nid in component]
                    primary_type = max(set(node_types), key=node_types.count)
                    
                    theme = Theme(
                        theme_id=theme_id,
                        mirror_id=mirror_id,
                        label=f"Connected {primary_type} cluster",
                        description=f"Group of {len(component)} related {primary_type} nodes",
                        node_ids=list(component),
                        confidence=confidence
                    )
                    
                    themes.append(theme)
                    self.themes[theme_id] = theme
        
        return themes
    
    def _get_dense_subgraph(
        self,
        start_node: str,
        valid_nodes: Dict[str, GraphNode],
        density_threshold: float = 0.3
    ) -> Set[str]:
        """
        Get a dense subgraph starting from a node.
        
        Args:
            start_node: Starting node ID
            valid_nodes: Set of valid node IDs to consider
            density_threshold: Minimum edge density
            
        Returns:
            Set of node IDs in dense subgraph
        """
        if start_node not in valid_nodes:
            return set()
        
        subgraph = {start_node}
        candidates = set(self.get_neighbors(start_node, direction="both"))
        candidates = {n.node_id for n in candidates if n.node_id in valid_nodes}
        
        # Grow subgraph by adding nodes that increase density
        while candidates:
            best_node = None
            best_density = 0.0
            
            for candidate in candidates:
                # Calculate density if we add this node
                test_graph = subgraph | {candidate}
                edge_count = sum(
                    1 for edge in self.edges
                    if edge.from_node in test_graph and edge.to_node in test_graph
                )
                max_edges = len(test_graph) * (len(test_graph) - 1)
                density = edge_count / max_edges if max_edges > 0 else 0.0
                
                if density > best_density:
                    best_density = density
                    best_node = candidate
            
            if best_node and best_density >= density_threshold:
                subgraph.add(best_node)
                # Add new candidates
                new_neighbors = self.get_neighbors(best_node, direction="both")
                candidates.update({n.node_id for n in new_neighbors if n.node_id in valid_nodes})
                candidates -= subgraph
            else:
                break
        
        return subgraph
    
    def get_central_nodes(
        self,
        mirror_id: str,
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Get most central nodes using degree centrality.
        
        I2: Only within single mirror.
        
        Args:
            mirror_id: Mirror to analyze
            top_k: Number of top nodes to return
            
        Returns:
            List of (node_id, centrality_score) tuples
        """
        # Filter nodes for this mirror
        mirror_nodes = {
            nid for nid, node in self.nodes.items()
            if node.mirror_id == mirror_id
        }
        
        if not mirror_nodes:
            return []
        
        # Calculate degree centrality
        centrality = {}
        for node_id in mirror_nodes:
            degree = len(self.outgoing[node_id]) + len(self.incoming[node_id])
            # Normalize by max possible degree
            max_degree = 2 * (len(mirror_nodes) - 1)
            centrality[node_id] = degree / max_degree if max_degree > 0 else 0.0
        
        # Sort and return top k
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        return sorted_nodes[:top_k]
    
    def get_statistics(self, mirror_id: Optional[str] = None) -> Dict:
        """
        Get graph statistics.
        
        I2: Can be per-mirror or system-wide.
        I14: Never cross-identify.
        
        Args:
            mirror_id: Optional mirror to filter by
            
        Returns:
            Dict with statistics
        """
        # Filter nodes
        if mirror_id:
            nodes = {
                nid: node for nid, node in self.nodes.items()
                if node.mirror_id == mirror_id
            }
        else:
            nodes = self.nodes
        
        if not nodes:
            return {
                "node_count": 0,
                "edge_count": 0,
                "mirror_id": mirror_id
            }
        
        # Filter edges
        node_ids = set(nodes.keys())
        edges = [
            edge for edge in self.edges
            if edge.from_node in node_ids and edge.to_node in node_ids
        ]
        
        # Calculate statistics
        edge_types = {}
        for edge in edges:
            edge_types[edge.edge_type.value] = edge_types.get(edge.edge_type.value, 0) + 1
        
        # Node types
        node_types = {}
        for node in nodes.values():
            node_types[node.node_type] = node_types.get(node.node_type, 0) + 1
        
        # Average degree
        total_degree = sum(
            len(self.outgoing.get(nid, [])) + len(self.incoming.get(nid, []))
            for nid in node_ids
        )
        avg_degree = total_degree / len(nodes) if nodes else 0.0
        
        return {
            "node_count": len(nodes),
            "edge_count": len(edges),
            "mirror_id": mirror_id,
            "node_types": node_types,
            "edge_types": edge_types,
            "average_degree": avg_degree,
            "theme_count": len([t for t in self.themes.values() if not mirror_id or t.mirror_id == mirror_id])
        }
    
    def clear_mirror_data(self, mirror_id: str) -> int:
        """
        Remove all data for a mirror (for I1 data sovereignty).
        
        Args:
            mirror_id: Mirror to clear data for
            
        Returns:
            Number of nodes removed
        """
        # Find nodes to remove
        nodes_to_remove = [
            nid for nid, node in self.nodes.items()
            if node.mirror_id == mirror_id
        ]
        
        # Remove nodes
        for node_id in nodes_to_remove:
            del self.nodes[node_id]
            del self.outgoing[node_id]
            del self.incoming[node_id]
        
        # Remove edges
        edges_to_remove = [
            edge for edge in self.edges
            if edge.from_node in nodes_to_remove or edge.to_node in nodes_to_remove
        ]
        
        for edge in edges_to_remove:
            self.edges.remove(edge)
            # Update adjacency lists for remaining nodes
            if edge.from_node not in nodes_to_remove:
                self.outgoing[edge.from_node] = [
                    e for e in self.outgoing[edge.from_node] if e != edge
                ]
            if edge.to_node not in nodes_to_remove:
                self.incoming[edge.to_node] = [
                    e for e in self.incoming[edge.to_node] if e != edge
                ]
        
        # Remove themes
        themes_to_remove = [
            tid for tid, theme in self.themes.items()
            if theme.mirror_id == mirror_id
        ]
        
        for theme_id in themes_to_remove:
            del self.themes[theme_id]
        
        return len(nodes_to_remove)
