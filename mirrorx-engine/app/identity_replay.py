"""
Identity Graph Replay Rules

This module defines how to rebuild the identity graph from the event log.

Key Principle:
Identity state is NEVER authoritatively stored on the server.
It is always derived by replaying the event log.

Architecture:
- Events are facts (stored)
- Identity is interpretation (computed)
- Multiple interpretations possible (forks allowed)
- Replay is deterministic

Replay Process:
1. Start with empty identity graph
2. Process events in sequence
3. Apply event-specific transformation rules
4. Result: current identity state
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional
from collections import defaultdict
import hashlib
import json

from .event_schema import (
    BaseEvent,
    ReflectionCreatedEvent,
    MetadataDeclaredEvent,
    AnnotationConsentedEvent,
    PatternSurfacedEvent,
    PostureDeclaredEvent
)


@dataclass
class GraphNode:
    """A node in the identity graph."""
    
    node_id: str
    node_type: str  # "tension", "belief", "goal", "paradox", "loop", "pattern"
    content: str
    
    # Provenance
    first_seen: str  # timestamp
    last_seen: str
    occurrence_count: int = 1
    
    # Strength (0.0-1.0)
    strength: float = 1.0
    
    # Evidence (event IDs that support this node)
    evidence: List[str] = field(default_factory=list)


@dataclass
class GraphEdge:
    """An edge in the identity graph."""
    
    edge_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str  # "reinforces", "contradicts", "leads_to", "blocks"
    
    # Weight
    weight: float = 1.0
    
    # Provenance
    first_seen: str
    last_seen: str


@dataclass
class IdentityGraph:
    """
    The derived identity graph.
    
    This is computed from events, never stored authoritatively.
    """
    
    instance_id: str
    
    # Graph structure
    nodes: Dict[str, GraphNode] = field(default_factory=dict)
    edges: Dict[str, GraphEdge] = field(default_factory=dict)
    
    # Current state
    current_posture: Optional[str] = None
    dominant_tensions: List[str] = field(default_factory=list)  # Node IDs
    
    # Timeline
    reflections: List[Dict] = field(default_factory=list)  # Ordered reflection summaries
    
    # Metadata
    last_replayed_seq: int = 0
    last_replayed_event_id: Optional[str] = None
    replayed_at: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "instance_id": self.instance_id,
            "nodes": {nid: {
                "node_id": n.node_id,
                "node_type": n.node_type,
                "content": n.content,
                "first_seen": n.first_seen,
                "last_seen": n.last_seen,
                "occurrence_count": n.occurrence_count,
                "strength": n.strength,
                "evidence": n.evidence
            } for nid, n in self.nodes.items()},
            "edges": {eid: {
                "edge_id": e.edge_id,
                "source_node_id": e.source_node_id,
                "target_node_id": e.target_node_id,
                "edge_type": e.edge_type,
                "weight": e.weight,
                "first_seen": e.first_seen,
                "last_seen": e.last_seen
            } for eid, e in self.edges.items()},
            "current_posture": self.current_posture,
            "dominant_tensions": self.dominant_tensions,
            "reflection_count": len(self.reflections),
            "last_replayed_seq": self.last_replayed_seq,
            "last_replayed_event_id": self.last_replayed_event_id,
            "replayed_at": self.replayed_at
        }
    
    def state_hash(self) -> str:
        """
        Compute deterministic hash of identity state.
        
        This allows verification that replay produced the same result.
        """
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


class ReplayEngine:
    """
    Replays events to rebuild identity graph.
    
    This is the core transformation logic that turns
    an append-only event log into derived identity state.
    """
    
    def __init__(self):
        self.handlers = {
            "reflection_created": self._handle_reflection_created,
            "metadata_declared": self._handle_metadata_declared,
            "annotation_consented": self._handle_annotation_consented,
            "pattern_surfaced": self._handle_pattern_surfaced,
            "posture_declared": self._handle_posture_declared,
        }
    
    def replay(self, events: List[BaseEvent], instance_id: str) -> IdentityGraph:
        """
        Replay events to build identity graph.
        
        Args:
            events: Ordered list of events
            instance_id: Instance to build graph for
        
        Returns: Computed identity graph
        """
        
        graph = IdentityGraph(instance_id=instance_id)
        
        for event in events:
            handler = self.handlers.get(event.event_type)
            if handler:
                handler(graph, event)
            
            # Update replay metadata
            graph.last_replayed_event_id = event.event_id
        
        # Post-processing
        self._compute_dominant_tensions(graph)
        self._apply_decay(graph)
        
        return graph
    
    def _handle_reflection_created(self, graph: IdentityGraph, event: ReflectionCreatedEvent):
        """
        Process a reflection creation event.
        
        For now, just record the reflection.
        Pattern extraction happens via annotation_consented events.
        """
        
        graph.reflections.append({
            "event_id": event.event_id,
            "timestamp": event.timestamp,
            "content": event.content,
            "modality": event.modality,
            "metadata": event.metadata
        })
    
    def _handle_metadata_declared(self, graph: IdentityGraph, event: MetadataDeclaredEvent):
        """
        Process explicit metadata declaration.
        
        User explicitly declares a goal, value, preference, or boundary.
        This becomes a node in the graph.
        """
        
        # Generate stable node ID from content
        node_id = self._generate_node_id(event.metadata_type, event.content)
        
        if node_id in graph.nodes:
            # Node exists, update it
            node = graph.nodes[node_id]
            node.last_seen = event.timestamp
            node.occurrence_count += 1
            node.evidence.append(event.event_id)
        else:
            # New node
            node = GraphNode(
                node_id=node_id,
                node_type=event.metadata_type,
                content=event.content,
                first_seen=event.timestamp,
                last_seen=event.timestamp,
                occurrence_count=1,
                strength=event.confidence if event.confidence else 1.0,
                evidence=[event.event_id]
            )
            graph.nodes[node_id] = node
    
    def _handle_annotation_consented(self, graph: IdentityGraph, event: AnnotationConsentedEvent):
        """
        Process annotation consent event.
        
        User accepted an annotation from MirrorX.
        Only accepted/modified annotations become nodes.
        """
        
        if event.user_consent == "rejected":
            # User rejected, do not add to graph
            return
        
        # Determine content (use modification if provided)
        content = event.user_modification if event.user_modification else event.annotation_content
        
        # Generate node
        node_id = self._generate_node_id(event.annotation_type, content)
        
        if node_id in graph.nodes:
            node = graph.nodes[node_id]
            node.last_seen = event.timestamp
            node.occurrence_count += 1
            node.evidence.append(event.event_id)
        else:
            node = GraphNode(
                node_id=node_id,
                node_type=event.annotation_type,
                content=content,
                first_seen=event.timestamp,
                last_seen=event.timestamp,
                occurrence_count=1,
                strength=0.8,  # Annotations start with slightly lower strength
                evidence=[event.event_id]
            )
            graph.nodes[node_id] = node
    
    def _handle_pattern_surfaced(self, graph: IdentityGraph, event: PatternSurfacedEvent):
        """
        Process pattern surfaced event.
        
        Pattern was surfaced by MirrorX.
        If user responded positively, it may generate nodes or edges.
        """
        
        if not event.user_response or event.user_response == "skip":
            # User didn't respond or skipped
            return
        
        if event.user_response == "off":
            # User said this pattern is off - don't add
            return
        
        # User said "resonates" - add pattern node
        node_id = self._generate_node_id("pattern", event.pattern_description)
        
        if node_id not in graph.nodes:
            node = GraphNode(
                node_id=node_id,
                node_type="pattern",
                content=event.pattern_description,
                first_seen=event.timestamp,
                last_seen=event.timestamp,
                occurrence_count=1,
                strength=event.confidence,
                evidence=[event.event_id]
            )
            graph.nodes[node_id] = node
        
        # Create edges to supporting reflections (if any exist as nodes)
        # This is simplified - in practice would need more sophisticated linking
    
    def _handle_posture_declared(self, graph: IdentityGraph, event: PostureDeclaredEvent):
        """
        Process posture declaration.
        
        Updates current posture (not a node, just state).
        """
        
        graph.current_posture = event.posture
    
    def _generate_node_id(self, node_type: str, content: str) -> str:
        """
        Generate stable node ID from content.
        
        Same content always produces same ID (deterministic).
        """
        content_normalized = content.lower().strip()
        combined = f"{node_type}:{content_normalized}"
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()[:16]
    
    def _compute_dominant_tensions(self, graph: IdentityGraph):
        """
        Identify dominant tensions based on strength and recency.
        
        Dominant = high strength + recently seen + multiple occurrences
        """
        
        # Filter to tension nodes
        tension_nodes = [
            (nid, node) for nid, node in graph.nodes.items()
            if node.node_type in ("tension", "paradox")
        ]
        
        # Score each
        scored = []
        for nid, node in tension_nodes:
            # Simple scoring: strength * log(occurrence_count)
            import math
            score = node.strength * math.log1p(node.occurrence_count)
            scored.append((score, nid))
        
        # Sort by score, take top 3
        scored.sort(reverse=True)
        graph.dominant_tensions = [nid for _, nid in scored[:3]]
    
    def _apply_decay(self, graph: IdentityGraph):
        """
        Apply time-based decay to node strength.
        
        Older patterns that haven't been reinforced become weaker.
        """
        
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        decay_rate = 0.1  # 10% decay per week
        
        for node in graph.nodes.values():
            last_seen = datetime.fromisoformat(node.last_seen.rstrip('Z'))
            weeks_since = (now - last_seen).days / 7
            
            if weeks_since > 0:
                decay_factor = (1 - decay_rate) ** weeks_since
                node.strength *= decay_factor
                
                # Floor at 0.1
                node.strength = max(0.1, node.strength)


class GraphDiff:
    """
    Compute difference between two identity graphs.
    
    This enables "what changed" analysis and conflict detection.
    """
    
    @staticmethod
    def diff(old_graph: IdentityGraph, new_graph: IdentityGraph) -> dict:
        """
        Compute diff between two graphs.
        
        Returns: Dictionary describing changes
        """
        
        diff = {
            "nodes_added": [],
            "nodes_removed": [],
            "nodes_modified": [],
            "edges_added": [],
            "edges_removed": []
        }
        
        # Nodes
        old_node_ids = set(old_graph.nodes.keys())
        new_node_ids = set(new_graph.nodes.keys())
        
        diff["nodes_added"] = list(new_node_ids - old_node_ids)
        diff["nodes_removed"] = list(old_node_ids - new_node_ids)
        
        # Modified nodes
        for node_id in old_node_ids & new_node_ids:
            old_node = old_graph.nodes[node_id]
            new_node = new_graph.nodes[node_id]
            
            if old_node.strength != new_node.strength or old_node.occurrence_count != new_node.occurrence_count:
                diff["nodes_modified"].append({
                    "node_id": node_id,
                    "old_strength": old_node.strength,
                    "new_strength": new_node.strength,
                    "old_count": old_node.occurrence_count,
                    "new_count": new_node.occurrence_count
                })
        
        # Edges
        old_edge_ids = set(old_graph.edges.keys())
        new_edge_ids = set(new_graph.edges.keys())
        
        diff["edges_added"] = list(new_edge_ids - old_edge_ids)
        diff["edges_removed"] = list(old_edge_ids - new_edge_ids)
        
        return diff


# Time-travel queries
class IdentityTimeTravel:
    """
    Query identity state at different points in time.
    
    Enables "identity as of X date" views.
    """
    
    def __init__(self, replay_engine: ReplayEngine):
        self.replay_engine = replay_engine
    
    def as_of(
        self,
        events: List[BaseEvent],
        instance_id: str,
        cutoff_timestamp: str
    ) -> IdentityGraph:
        """
        Rebuild identity graph as it was at a specific time.
        
        Args:
            events: Full event log
            instance_id: Instance to build
            cutoff_timestamp: ISO8601 timestamp
        
        Returns: Identity graph as of that time
        """
        
        # Filter events up to cutoff
        filtered_events = [
            e for e in events
            if e.timestamp <= cutoff_timestamp
        ]
        
        # Replay
        return self.replay_engine.replay(filtered_events, instance_id)
    
    def compare_periods(
        self,
        events: List[BaseEvent],
        instance_id: str,
        start_timestamp: str,
        end_timestamp: str
    ) -> dict:
        """
        Compare identity state between two time periods.
        
        Returns: Difference analysis
        """
        
        start_graph = self.as_of(events, instance_id, start_timestamp)
        end_graph = self.as_of(events, instance_id, end_timestamp)
        
        return GraphDiff.diff(start_graph, end_graph)
