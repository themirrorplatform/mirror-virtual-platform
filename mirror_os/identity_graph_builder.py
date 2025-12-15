# mirror_os/identity_graph_builder.py
"""
Identity Graph Builder - Automatic Contradiction Detection

This builds the identity graph by analyzing reflections and detecting:
- Recurring themes
- Contradictions (I2: Identity locality enforcement)
- Evolving patterns
- Relational structures

The graph is LOCAL to each identity - no cross-identity inference.
"""

import re
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Tuple, Set
from datetime import datetime
from collections import defaultdict, Counter


class IdentityGraphBuilder:
    """
    Builds identity graph from reflections.
    
    Detects:
    - Concept relationships (supports, contradicts, refines)
    - Recurring themes
    - Evolution over time
    - Tensions and contradictions
    """
    
    def __init__(self, db_path: Path):
        """Initialize graph builder"""
        self.db_path = db_path
    
    def build_graph_for_identity(self, identity_id: str) -> Dict[str, Any]:
        """
        Build complete identity graph from reflections.
        
        Args:
            identity_id: Identity to analyze
        
        Returns:
            Graph statistics
        """
        # Get all reflections
        reflections = self._get_reflections(identity_id)
        
        if not reflections:
            return {"edges": 0, "concepts": 0, "contradictions": 0}
        
        # Extract concepts from reflections
        concept_occurrences = defaultdict(list)
        
        for reflection in reflections:
            concepts = self._extract_concepts(reflection["content"])
            timestamp = reflection["created_at"]
            
            for concept in concepts:
                concept_occurrences[concept].append({
                    "reflection_id": reflection["id"],
                    "timestamp": timestamp
                })
        
        # Build edges between co-occurring concepts
        edges_added = 0
        contradictions = 0
        
        for reflection in reflections:
            concepts = self._extract_concepts(reflection["content"])
            timestamp = reflection["created_at"]
            
            # Create edges between concepts in same reflection
            for i, concept_a in enumerate(concepts):
                for concept_b in concepts[i+1:]:
                    relationship = self._detect_relationship(
                        concept_a,
                        concept_b,
                        reflection["content"]
                    )
                    
                    if relationship:
                        self._add_or_update_edge(
                            identity_id,
                            concept_a,
                            concept_b,
                            relationship,
                            timestamp
                        )
                        edges_added += 1
                        
                        if relationship == "contradicts":
                            contradictions += 1
        
        return {
            "edges": edges_added,
            "concepts": len(concept_occurrences),
            "contradictions": contradictions,
            "reflections_analyzed": len(reflections)
        }
    
    def _get_reflections(self, identity_id: str) -> List[Dict[str, Any]]:
        """Get all reflections for identity"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT id, content, created_at
                FROM reflections
                WHERE identity_id = ?
                ORDER BY created_at ASC
            """, (identity_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def _extract_concepts(self, text: str) -> List[str]:
        """
        Extract key concepts from text.
        
        Uses simple heuristics:
        - Repeated noun phrases
        - Capitalized terms
        - Quoted phrases
        - Emotional words
        """
        concepts = set()
        
        # Extract quoted phrases
        quoted = re.findall(r'"([^"]+)"', text)
        concepts.update(q.lower().strip() for q in quoted if len(q.split()) <= 4)
        
        # Extract emotional/relational words
        emotional_words = [
            "love", "fear", "anxiety", "hope", "anger", "joy", "sadness",
            "connection", "distance", "clarity", "confusion", "certainty", "doubt",
            "trust", "betrayal", "growth", "stagnation", "freedom", "constraint"
        ]
        
        text_lower = text.lower()
        for word in emotional_words:
            if word in text_lower:
                concepts.add(word)
        
        # Extract capitalized multi-word phrases (but not sentence starts)
        capitalized = re.findall(r'(?<!^)(?<!\. )([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', text)
        concepts.update(c.lower() for c in capitalized if len(c.split()) <= 3)
        
        return list(concepts)[:20]  # Limit to top 20 concepts per reflection
    
    def _detect_relationship(
        self,
        concept_a: str,
        concept_b: str,
        context: str
    ) -> str:
        """
        Detect relationship between two concepts.
        
        Returns: 'supports', 'contradicts', 'refines', or None
        """
        context_lower = context.lower()
        
        # Build context window around concepts
        a_pos = context_lower.find(concept_a.lower())
        b_pos = context_lower.find(concept_b.lower())
        
        if a_pos == -1 or b_pos == -1:
            return "co-occurs"
        
        # Get text between concepts
        start = min(a_pos, b_pos)
        end = max(a_pos, b_pos) + len(concept_a if a_pos > b_pos else concept_b)
        between = context_lower[start:end]
        
        # Detect contradiction markers
        contradiction_markers = [
            "but", "however", "although", "though", "yet", "despite",
            "on the other hand", "in contrast", "contradicts", "opposed"
        ]
        
        if any(marker in between for marker in contradiction_markers):
            return "contradicts"
        
        # Detect support markers
        support_markers = [
            "and", "also", "moreover", "furthermore", "because", "since",
            "supports", "reinforces", "aligns with", "consistent with"
        ]
        
        if any(marker in between for marker in support_markers):
            return "supports"
        
        # Detect refinement markers
        refinement_markers = [
            "specifically", "in particular", "more precisely", "to clarify",
            "that is", "namely", "refines", "elaborates"
        ]
        
        if any(marker in between for marker in refinement_markers):
            return "refines"
        
        # Default: co-occurrence
        return "co-occurs"
    
    def _add_or_update_edge(
        self,
        identity_id: str,
        concept_a: str,
        concept_b: str,
        relationship: str,
        timestamp: str
    ):
        """Add or update edge in identity graph"""
        with sqlite3.connect(self.db_path) as conn:
            # Check if edge exists
            cursor = conn.execute("""
                SELECT id, observation_count, strength
                FROM identity_graph
                WHERE identity_id = ?
                  AND concept_a = ?
                  AND concept_b = ?
                  AND relationship = ?
            """, (identity_id, concept_a, concept_b, relationship))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing edge
                edge_id, count, strength = existing
                new_count = count + 1
                new_strength = min(1.0, strength + 0.1)  # Increase strength, max 1.0
                
                conn.execute("""
                    UPDATE identity_graph
                    SET observation_count = ?,
                        strength = ?,
                        last_observed = ?
                    WHERE id = ?
                """, (new_count, new_strength, timestamp, edge_id))
            else:
                # Create new edge
                conn.execute("""
                    INSERT INTO identity_graph (
                        identity_id, concept_a, concept_b, relationship,
                        strength, first_observed, last_observed, observation_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    identity_id, concept_a, concept_b, relationship,
                    0.5, timestamp, timestamp, 1
                ))
            
            conn.commit()
    
    def get_contradictions(self, identity_id: str) -> List[Dict[str, Any]]:
        """Get all contradictions in identity graph"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM identity_graph
                WHERE identity_id = ?
                  AND relationship = 'contradicts'
                ORDER BY strength DESC, observation_count DESC
            """, (identity_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_strongest_themes(
        self,
        identity_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get strongest themes (most observed concepts)"""
        with sqlite3.connect(self.db_path) as conn:
            # Count concept occurrences
            cursor = conn.execute("""
                SELECT concept_a AS concept, SUM(observation_count) AS total_count
                FROM identity_graph
                WHERE identity_id = ?
                GROUP BY concept_a
                UNION ALL
                SELECT concept_b AS concept, SUM(observation_count) AS total_count
                FROM identity_graph
                WHERE identity_id = ?
                GROUP BY concept_b
            """, (identity_id, identity_id))
            
            concept_counts = defaultdict(int)
            for row in cursor.fetchall():
                concept_counts[row[0]] += row[1]
            
            # Sort by count
            sorted_concepts = sorted(
                concept_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:limit]
            
            return [
                {"concept": concept, "observation_count": count}
                for concept, count in sorted_concepts
            ]
    
    def visualize_graph(
        self,
        identity_id: str,
        output_path: Path
    ):
        """
        Export graph in GraphViz DOT format for visualization.
        
        Args:
            identity_id: Identity to visualize
            output_path: Where to save .dot file
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT concept_a, concept_b, relationship, strength, observation_count
                FROM identity_graph
                WHERE identity_id = ?
            """, (identity_id,))
            
            edges = cursor.fetchall()
        
        # Build DOT format
        dot_lines = [
            "digraph IdentityGraph {",
            "  rankdir=LR;",
            "  node [shape=ellipse, style=filled, fillcolor=lightblue];",
            ""
        ]
        
        for concept_a, concept_b, relationship, strength, count in edges:
            # Color by relationship
            color_map = {
                "supports": "green",
                "contradicts": "red",
                "refines": "blue",
                "co-occurs": "gray"
            }
            color = color_map.get(relationship, "black")
            
            # Line width by strength
            width = max(1.0, strength * 3.0)
            
            # Label with observation count
            label = f"{relationship} ({count})"
            
            dot_lines.append(
                f'  "{concept_a}" -> "{concept_b}" '
                f'[label="{label}", color={color}, penwidth={width}];'
            )
        
        dot_lines.append("}")
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(dot_lines))
    
    def get_identity_state(self, identity_id: str) -> Dict[str, Any]:
        """
        Get current state of identity for evolution tracking.
        
        Returns:
            Dictionary with concepts, themes, tensions
        """
        themes = self.get_strongest_themes(identity_id, limit=10)
        contradictions = self.get_contradictions(identity_id)
        
        # Get all concepts
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT DISTINCT concept_a FROM identity_graph
                WHERE identity_id = ?
                UNION
                SELECT DISTINCT concept_b FROM identity_graph
                WHERE identity_id = ?
            """, (identity_id, identity_id))
            concepts = [row[0] for row in cursor.fetchall()]
        
        return {
            'timestamp': datetime.utcnow(),
            'concepts': concepts,
            'themes': [
                {
                    'name': t['concept'],
                    'theme': t['concept'],
                    'strength': min(1.0, t['observation_count'] / 10.0)
                }
                for t in themes
            ],
            'tensions': [
                {
                    'concept_a': c['concept_a'],
                    'concept_b': c['concept_b']
                }
                for c in contradictions
            ]
        }
    
    def add_concepts(self, identity_id: str, concepts: List[str]):
        """Add concepts to identity graph"""
        timestamp = datetime.utcnow().isoformat()
        
        # Add edges between all pairs of concepts
        for i, concept_a in enumerate(concepts):
            for concept_b in concepts[i+1:]:
                self._add_or_update_edge(
                    identity_id,
                    concept_a,
                    concept_b,
                    "co-occurs",
                    timestamp
                )
    
    def add_contradiction(self, identity_id: str, concept_a: str, concept_b: str):
        """Add contradiction edge to identity graph"""
        timestamp = datetime.utcnow().isoformat()
        self._add_or_update_edge(
            identity_id,
            concept_a,
            concept_b,
            "contradicts",
            timestamp
        )


# Self-test
if __name__ == "__main__":
    print("Identity Graph Builder Test")
    print("=" * 80)
    
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        from mirror_os.runtime import MirrorOSRuntime
        from mirrorcore.storage.local_db import LocalDB
        
        db_path = Path(tmpdir) / "test.db"
        
        # Create runtime and storage
        runtime = MirrorOSRuntime(Path(tmpdir))
        db = LocalDB(db_path)
        
        identity_id = db.ensure_identity("test_user")
        
        # Create test reflections with contradictions
        test_reflections = [
            "I feel deep connection with my family, but sometimes I need distance from them.",
            "I value certainty in my decisions, yet I'm drawn to uncertainty and exploration.",
            "Work brings me clarity and purpose, although it also creates anxiety and stress.",
            "I trust people easily, but I've been betrayed before and fear opening up."
        ]
        
        for content in test_reflections:
            db.create_reflection(
                content=content,
                identity_id=identity_id,
                mirrorback="Reflection noted",
                metadata={}
            )
        
        # Build graph
        builder = IdentityGraphBuilder(db_path)
        stats = builder.build_graph_for_identity(identity_id)
        
        print(f"Graph built:")
        print(f"  Edges: {stats['edges']}")
        print(f"  Concepts: {stats['concepts']}")
        print(f"  Contradictions: {stats['contradictions']}")
        print(f"  Reflections: {stats['reflections_analyzed']}")
        
        # Get contradictions
        contradictions = builder.get_contradictions(identity_id)
        print(f"\nContradictions found: {len(contradictions)}")
        for c in contradictions[:3]:
            print(f"  - {c['concept_a']} ↔ {c['concept_b']}")
        
        # Get themes
        themes = builder.get_strongest_themes(identity_id)
        print(f"\nStrongest themes:")
        for theme in themes[:5]:
            print(f"  - {theme['concept']}: {theme['observation_count']} observations")
        
        print("\n✅ Identity graph builder functional")
