"""
Identity Graph: User's inner structure map

Nodes: thought, belief, emotion, action, experience, consequence
Edges: reinforces, contradicts, undermines, leads_to, co_occurs_with
Derived: tensions, loops, axes, energy scores

This stays LOCAL. Never leaves the device.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime
from enum import Enum
import json
from pathlib import Path


class NodeType(Enum):
    """Types of graph nodes"""
    THOUGHT = "thought"
    BELIEF = "belief"
    EMOTION = "emotion"
    ACTION = "action"
    EXPERIENCE = "experience"
    CONSEQUENCE = "consequence"


class EdgeType(Enum):
    """Types of relationships between nodes"""
    REINFORCES = "reinforces"
    CONTRADICTS = "contradicts"
    UNDERMINES = "undermines"
    LEADS_TO = "leads_to"
    CO_OCCURS_WITH = "co_occurs_with"


@dataclass
class EdgeWeight:
    """Weight components for graph edges"""
    frequency: float  # How often this relationship occurs
    intensity: float  # Emotional load (0.0 to 1.0)
    recency: float  # Time decay factor
    confidence: float  # Epistemic certainty (0.0 to 1.0)
    
    def composite_score(self) -> float:
        """Combined weight for routing decisions"""
        return (self.frequency * 0.3 + 
                self.intensity * 0.4 + 
                self.recency * 0.2 + 
                self.confidence * 0.1)


@dataclass
class GraphNode:
    """Node in identity graph"""
    id: str
    node_type: NodeType
    label: str
    content: str
    lens_tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activated: datetime = field(default_factory=datetime.utcnow)
    activation_count: int = 0
    user_editable: bool = True
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'node_type': self.node_type.value,
            'label': self.label,
            'content': self.content,
            'lens_tags': self.lens_tags,
            'created_at': self.created_at.isoformat(),
            'last_activated': self.last_activated.isoformat(),
            'activation_count': self.activation_count,
        }


@dataclass
class GraphEdge:
    """Edge connecting nodes in identity graph"""
    source_id: str
    target_id: str
    edge_type: EdgeType
    weight: EdgeWeight
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_observed: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'source_id': self.source_id,
            'target_id': self.target_id,
            'edge_type': self.edge_type.value,
            'weight': {
                'frequency': self.weight.frequency,
                'intensity': self.weight.intensity,
                'recency': self.weight.recency,
                'confidence': self.weight.confidence,
            },
            'last_observed': self.last_observed.isoformat(),
        }


@dataclass
class Tension:
    """Stable contradiction in the graph"""
    id: str
    node_a_id: str
    node_b_id: str
    name: str
    energy: float  # How active/unresolved
    duration_days: int
    lens_tags: List[str] = field(default_factory=list)
    
    def is_active(self) -> bool:
        return self.energy >= 0.5


@dataclass
class Loop:
    """Recurring pattern/cycle in the graph"""
    id: str
    node_ids: List[str]
    recurrence_count: int
    last_occurred: datetime
    pattern_name: str
    
    def is_recurring(self) -> bool:
        return self.recurrence_count >= 3


@dataclass
class Axis:
    """Identity direction (value/fear/desire vector)"""
    id: str
    axis_type: str  # "value", "fear", "desire", "boundary"
    positive_node_id: str
    negative_node_id: Optional[str]
    strength: float
    trend: str  # "rising", "falling", "stable"


class IdentityGraph:
    """
    Local identity structure.
    
    Never sent over network. Used only to generate Finder Targets.
    User can inspect and edit all nodes/edges.
    """
    
    def __init__(self, user_id: str, storage_path: Path):
        self.user_id = user_id
        self.storage_path = storage_path
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.tensions: Dict[str, Tension] = {}
        self.loops: Dict[str, Loop] = {}
        self.axes: Dict[str, Axis] = {}
        
        self._load()
    
    def add_node(self, node: GraphNode) -> None:
        """Add node to graph"""
        self.nodes[node.id] = node
        self._save()
    
    def add_edge(self, edge: GraphEdge) -> None:
        """Add edge to graph"""
        self.edges.append(edge)
        self._detect_tensions()
        self._detect_loops()
        self._save()
    
    def get_active_tensions(self, min_energy: float = 0.7) -> List[Tension]:
        """Get high-energy unresolved tensions"""
        return [t for t in self.tensions.values() 
                if t.energy >= min_energy]
    
    def get_recurring_loops(self, min_recurrence: int = 3) -> List[Loop]:
        """Get patterns that repeat frequently"""
        return [loop for loop in self.loops.values() 
                if loop.recurrence_count >= min_recurrence]
    
    def get_contradictions(self, min_intensity: float = 0.7) -> List[GraphEdge]:
        """Get high-intensity contradictions"""
        return [e for e in self.edges 
                if e.edge_type == EdgeType.CONTRADICTS 
                and e.weight.intensity >= min_intensity]
    
    def get_snapshot(self) -> dict:
        """
        Generate graph snapshot for Finder Target synthesis.
        
        User can edit this before targets are generated.
        """
        return {
            'active_tensions': [t.to_dict() for t in self.get_active_tensions()],
            'recurring_loops': [l.to_dict() for l in self.get_recurring_loops()],
            'contradictions': [e.to_dict() for e in self.get_contradictions()],
            'axes': [a.to_dict() for a in self.axes.values()],
            'total_nodes': len(self.nodes),
            'total_edges': len(self.edges),
            'generated_at': datetime.utcnow().isoformat(),
        }
    
    def _detect_tensions(self):
        """Detect stable contradictions"""
        # Find contradiction edges that persist
        contradictions = [e for e in self.edges 
                         if e.edge_type == EdgeType.CONTRADICTS]
        
        for edge in contradictions:
            tension_id = f"{edge.source_id}_{edge.target_id}"
            if tension_id not in self.tensions:
                source = self.nodes.get(edge.source_id)
                target = self.nodes.get(edge.target_id)
                if source and target:
                    self.tensions[tension_id] = Tension(
                        id=tension_id,
                        node_a_id=edge.source_id,
                        node_b_id=edge.target_id,
                        name=f"{source.label} ↔ {target.label}",
                        energy=edge.weight.intensity,
                        duration_days=0,
                        lens_tags=list(set(source.lens_tags + target.lens_tags))
                    )
    
    def _detect_loops(self):
        """Detect recurring cycles"""
        # Simple cycle detection (would be more sophisticated in production)
        # Track sequences of nodes that repeat
        pass  # TODO: Implement cycle detection algorithm
    
    def _load(self):
        """Load graph from storage"""
        graph_file = self.storage_path / f"identity_graph_{self.user_id}.json"
        if graph_file.exists():
            with open(graph_file, 'r') as f:
                data = json.load(f)
                # Reconstruct nodes, edges, tensions, loops, axes
                # TODO: Full deserialization
    
    def _save(self):
        """Save graph to storage"""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        graph_file = self.storage_path / f"identity_graph_{self.user_id}.json"
        
        data = {
            'user_id': self.user_id,
            'nodes': {nid: n.to_dict() for nid, n in self.nodes.items()},
            'edges': [e.to_dict() for e in self.edges],
            'tensions': {tid: self._tension_to_dict(t) 
                        for tid, t in self.tensions.items()},
            'updated_at': datetime.utcnow().isoformat(),
        }
        
        with open(graph_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _tension_to_dict(self, tension: Tension) -> dict:
        return {
            'id': tension.id,
            'node_a_id': tension.node_a_id,
            'node_b_id': tension.node_b_id,
            'name': tension.name,
            'energy': tension.energy,
            'duration_days': tension.duration_days,
            'lens_tags': tension.lens_tags,
        }
