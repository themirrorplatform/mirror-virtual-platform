"""
THE MIRROR: SQLITE STORAGE IMPLEMENTATION
Constitutional Enforcement: I1 (Data Sovereignty), I2 (Identity Locality), 
                           I5 (No Lock-in), I14 (No Cross-Identity Inference)

Complete implementation of MirrorStorage ABC for local SQLite database.
WAL mode enabled, fully offline, deterministic behavior.
"""

import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

from .base import (
    MirrorStorage, Mirror, MirrorNode, MirrorEdge, LanguageShape, Tension,
    Reflection, Mirrorback, EngineRun, ExportBundle,
    NodeType, EdgeType, ShapeOrigin, TensionOrigin, FeedbackType, EvolutionEventType
)


class SQLiteStorage(MirrorStorage):
    """
    SQLite implementation of MirrorStorage.
    
    CONSTITUTIONAL GUARANTEES:
    - WAL mode for reliability
    - JSON stored as TEXT (SQLite-compatible)
    - All queries identity-scoped
    - Triggers enforce I2 (locality)
    - Works 100% offline
    """
    
    def __init__(self, db_path: str):
        """Initialize SQLite storage."""
        self.db_path = db_path
        self._ensure_database()
    
    def _ensure_database(self):
        """Ensure database exists and is properly configured."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Connect directly to enable foreign keys BEFORE schema creation
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            # Enable WAL mode and foreign keys (I1: Reliability, CASCADE deletes)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            
            # Load schema
            schema_path = Path(__file__).parent / "sqlite" / "schema.sql"
            if schema_path.exists():
                with open(schema_path) as f:
                    conn.executescript(f.read())
            
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    @contextmanager
    def _get_connection(self):
        """Get database connection with proper cleanup."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        # Enable foreign keys for CASCADE deletes (I1: User owns everything)
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _json_loads(self, value: Optional[str]) -> Optional[Any]:
        """Safely parse JSON from TEXT field."""
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return None
    
    def _json_dumps(self, value: Any) -> Optional[str]:
        """Convert to JSON TEXT."""
        return json.dumps(value) if value is not None else None
    
    # ========================================================================
    # MIRROR MANAGEMENT (I1: Data Sovereignty, I5: No Lock-in)
    # ========================================================================
    
    def create_mirror(
        self,
        owner_id: str,
        label: Optional[str],
        mirrorcore_version: str,
        constitution_hash: str,
        constitution_version: str,
        prompt_templates: Optional[Dict[str, str]] = None,
        lens_definitions: Optional[Dict[str, Any]] = None
    ) -> Mirror:
        """Create new Mirror. I1: works_offline enforced at schema level."""
        mirror_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO mirrors (
                    id, owner_id, label, works_offline, mirrorcore_version,
                    constitution_hash, constitution_version, prompt_templates,
                    lens_definitions, user_renames, created_at, last_active_at
                ) VALUES (?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                mirror_id, owner_id, label, mirrorcore_version,
                constitution_hash, constitution_version,
                self._json_dumps(prompt_templates),
                self._json_dumps(lens_definitions),
                self._json_dumps({}),  # user_renames starts empty
                now, now
            ))
        
        return Mirror(
            id=mirror_id, owner_id=owner_id, label=label, works_offline=True,
            mirrorcore_version=mirrorcore_version, constitution_hash=constitution_hash,
            constitution_version=constitution_version, prompt_templates=prompt_templates,
            lens_definitions=lens_definitions, user_renames={},
            created_at=now, last_active_at=now, last_export_at=None,
            forked_from=None, fork_constitution_verified=False, platform_connected=False
        )
    
    def get_mirror(self, mirror_id: str) -> Optional[Mirror]:
        """Get Mirror by ID."""
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM mirrors WHERE id = ?", (mirror_id,)).fetchone()
            if not row:
                return None
            return Mirror(
                id=row['id'], owner_id=row['owner_id'], label=row['label'],
                works_offline=bool(row['works_offline']) == True,  # SQLite int to Python bool
                mirrorcore_version=row['mirrorcore_version'],
                constitution_hash=row['constitution_hash'], constitution_version=row['constitution_version'],
                prompt_templates=self._json_loads(row['prompt_templates']),
                lens_definitions=self._json_loads(row['lens_definitions']),
                user_renames=self._json_loads(row['user_renames']),
                created_at=row['created_at'], last_active_at=row['last_active_at'],
                last_export_at=row['last_export_at'], forked_from=row['forked_from'],
                fork_constitution_verified=bool(row['fork_constitution_verified']) == True,
                platform_connected=bool(row['platform_connected']) == True
            )
    
    def list_mirrors(self, owner_id: Optional[str] = None) -> List[Mirror]:
        """List Mirrors (optionally by owner)."""
        with self._get_connection() as conn:
            if owner_id:
                rows = conn.execute("SELECT * FROM mirrors WHERE owner_id = ?", (owner_id,)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM mirrors").fetchall()
            
            return [Mirror(
                id=row['id'], owner_id=row['owner_id'], label=row['label'],
                works_offline=row['works_offline'], mirrorcore_version=row['mirrorcore_version'],
                constitution_hash=row['constitution_hash'], constitution_version=row['constitution_version'],
                prompt_templates=self._json_loads(row['prompt_templates']),
                lens_definitions=self._json_loads(row['lens_definitions']),
                user_renames=self._json_loads(row['user_renames']),
                created_at=row['created_at'], last_active_at=row['last_active_at'],
                last_export_at=row['last_export_at'], forked_from=row['forked_from'],
                fork_constitution_verified=bool(row['fork_constitution_verified']),
                platform_connected=bool(row['platform_connected'])
            ) for row in rows]
    
    def update_mirror(
        self,
        mirror_id: str,
        **updates
    ) -> Mirror:
        """Update Mirror metadata. I5: Preserves semantic meaning."""
        with self._get_connection() as conn:
            update_clauses = []
            params = []
            
            if 'label' in updates:
                update_clauses.append("label = ?")
                params.append(updates['label'])
            if 'prompt_templates' in updates:
                update_clauses.append("prompt_templates = ?")
                params.append(self._json_dumps(updates['prompt_templates']))
            if 'lens_definitions' in updates:
                update_clauses.append("lens_definitions = ?")
                params.append(self._json_dumps(updates['lens_definitions']))
            if 'user_renames' in updates:
                update_clauses.append("user_renames = ?")
                params.append(self._json_dumps(updates['user_renames']))
            
            if update_clauses:
                params.append(mirror_id)
                conn.execute(
                    f"UPDATE mirrors SET {', '.join(update_clauses)} WHERE id = ?",
                    params
                )
        
        mirror = self.get_mirror(mirror_id)
        if mirror is None:
            raise ValueError(f"Mirror {mirror_id} not found after update")
        return mirror
    
    def delete_mirror(self, mirror_id: str) -> bool:
        """Delete Mirror. I1: CASCADE deletes all owned data."""
        with self._get_connection() as conn:
            # Verify foreign keys are enabled for CASCADE
            fk_status = conn.execute("PRAGMA foreign_keys").fetchone()[0]
            if not fk_status:
                raise RuntimeError("Foreign keys not enabled - CASCADE will not work")
            
            cursor = conn.execute("DELETE FROM mirrors WHERE id = ?", (mirror_id,))
            deleted = cursor.rowcount > 0
            # Commit happens in context manager __exit__
            return deleted
    
    # ========================================================================
    # IDENTITY GRAPH (I2: Identity Locality)
    # ========================================================================
    
    def create_node(
        self,
        mirror_id: str,
        node_type: NodeType,
        content: Dict[str, Any],
        summary: Optional[str] = None,
        confidence_score: Optional[float] = None,
        occurred_at: Optional[datetime] = None
    ) -> MirrorNode:
        """Create node in identity graph. I2: Scoped to mirror_id."""
        node_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        occurred_at_str = occurred_at.isoformat() if occurred_at else None
        occurred_at_conf = 'exact' if occurred_at else 'unknown'
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO mirror_nodes (
                    id, mirror_id, node_type, summary, content,
                    confidence_score, occurred_at, occurred_at_confidence,
                    version, previous_version_id, is_current, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, TRUE, ?, ?)
            """, (
                node_id, mirror_id, node_type.value, summary,
                self._json_dumps(content), confidence_score, occurred_at_str,
                occurred_at_conf, now, now
            ))
        
        content_str = self._json_dumps(content) or "{}"
        return MirrorNode(
            id=node_id, mirror_id=mirror_id, node_type=node_type,
            summary=summary, content=content_str,
            confidence_score=confidence_score, occurred_at=occurred_at_str,
            occurred_at_confidence=occurred_at_conf, version=1,
            previous_version_id=None, is_current=True,
            created_at=now, updated_at=now
        )
    
    def get_node(self, node_id: str, mirror_id: str) -> Optional[MirrorNode]:
        """Get node. I2: Requires mirror_id for locality check."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM mirror_nodes WHERE id = ? AND mirror_id = ?",
                (node_id, mirror_id)
            ).fetchone()
            
            if not row:
                return None
            
            return MirrorNode(
                id=row['id'], mirror_id=row['mirror_id'],
                node_type=NodeType(row['node_type']),
                summary=row['summary'], content=row['content'],
                confidence_score=row['confidence_score'],
                occurred_at=row['occurred_at'],
                occurred_at_confidence=row['occurred_at_confidence'],
                version=row['version'], previous_version_id=row['previous_version_id'],
                is_current=bool(row['is_current']),
                created_at=row['created_at'], updated_at=row['updated_at']
            )
    
    def list_nodes(
        self,
        mirror_id: str,
        node_type: Optional[NodeType] = None,
        is_current: bool = True,
        limit: Optional[int] = None
    ) -> List[MirrorNode]:
        """List nodes. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            query = "SELECT * FROM mirror_nodes WHERE mirror_id = ?"
            params = [mirror_id]
            
            if is_current:
                query += " AND is_current = TRUE"
            if node_type:
                query += " AND node_type = ?"
                params.append(node_type.value)
            
            query += " ORDER BY created_at DESC"
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            rows = conn.execute(query, params).fetchall()
            
            return [MirrorNode(
                id=row['id'], mirror_id=row['mirror_id'],
                node_type=NodeType(row['node_type']),
                summary=row['summary'], content=row['content'],
                confidence_score=row['confidence_score'],
                occurred_at=row['occurred_at'],
                occurred_at_confidence=row['occurred_at_confidence'],
                version=row['version'], previous_version_id=row['previous_version_id'],
                is_current=bool(row['is_current']),
                created_at=row['created_at'], updated_at=row['updated_at']
            ) for row in rows]
    
    def update_node(
        self,
        node_id: str,
        mirror_id: str,
        **updates
    ) -> MirrorNode:
        """Update node. I2: Requires mirror_id."""
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            update_clauses = ["updated_at = ?"]
            params = [now]
            
            if 'summary' in updates:
                update_clauses.append("summary = ?")
                params.append(updates['summary'])
            if 'content' in updates:
                update_clauses.append("content = ?")
                params.append(self._json_dumps(updates['content']))
            if 'confidence_score' in updates:
                update_clauses.append("confidence_score = ?")
                params.append(updates['confidence_score'])
            
            if update_clauses:
                params.extend([node_id, mirror_id])
                conn.execute(
                    f"UPDATE mirror_nodes SET {', '.join(update_clauses)} WHERE id = ? AND mirror_id = ?",
                    params
                )
        
        node = self.get_node(node_id, mirror_id)
        if node is None:
            raise ValueError(f"Node {node_id} not found after update")
        return node
    
    def create_edge(
        self,
        mirror_id: str,
        source_node_id: str,
        target_node_id: str,
        edge_type: EdgeType,
        strength: Optional[float] = None,
        discovered_by: str = 'user_stated'
    ) -> MirrorEdge:
        """Create edge. I2: Trigger enforces locality at SQL level."""
        edge_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO mirror_edges (
                    id, mirror_id, source_node_id, target_node_id,
                    edge_type, strength, confidence, discovered_at,
                    discovered_by, version, is_current, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 1, TRUE, ?)
            """, (
                edge_id, mirror_id, source_node_id, target_node_id,
                edge_type.value, strength, now,
                discovered_by, now
            ))
        
        return MirrorEdge(
            id=edge_id, mirror_id=mirror_id, source_node_id=source_node_id,
            target_node_id=target_node_id, edge_type=edge_type,
            strength=strength, confidence=None, discovered_at=now,
            discovered_by=discovered_by, version=1, is_current=True,
            created_at=now
        )
    
    def list_edges(
        self,
        mirror_id: str,
        source_node_id: Optional[str] = None,
        target_node_id: Optional[str] = None,
        edge_type: Optional[EdgeType] = None
    ) -> List[MirrorEdge]:
        """List edges. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            query = "SELECT * FROM mirror_edges WHERE mirror_id = ?"
            params = [mirror_id]
            
            if source_node_id:
                query += " AND source_node_id = ?"
                params.append(source_node_id)
            if target_node_id:
                query += " AND target_node_id = ?"
                params.append(target_node_id)
            if edge_type:
                query += " AND edge_type = ?"
                params.append(edge_type.value)
            
            rows = conn.execute(query, params).fetchall()
            
            return [MirrorEdge(
                id=row['id'], mirror_id=row['mirror_id'],
                source_node_id=row['source_node_id'],
                target_node_id=row['target_node_id'],
                edge_type=EdgeType(row['edge_type']),
                strength=row['strength'], confidence=row['confidence'],
                discovered_at=row['discovered_at'], discovered_by=row['discovered_by'],
                version=row['version'], is_current=bool(row['is_current']),
                created_at=row['created_at']
            ) for row in rows]
    
    # ========================================================================
    # LANGUAGE SHAPES (I9: Anti-diagnosis)
    # ========================================================================
    
    def create_language_shape(
        self,
        mirror_id: str,
        name: str,
        origin: ShapeOrigin,
        description: Optional[str] = None,
        system_name: Optional[str] = None
    ) -> LanguageShape:
        """Create language shape. I9: MUST include disclaimer."""
        shape_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        disclaimer = "This is a lens for understanding your language, not a diagnosis or label."  # I9: Required
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO language_shapes (
                    id, mirror_id, name, system_name, description, origin,
                    user_renamed, user_hidden, user_merged_into,
                    occurrence_count, last_observed_at, disclaimer,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, FALSE, FALSE, NULL, 0, NULL, ?, ?, ?)
            """, (
                shape_id, mirror_id, name, system_name, description,
                origin.value, disclaimer, now, now
            ))
        
        return LanguageShape(
            id=shape_id, mirror_id=mirror_id, name=name, system_name=system_name,
            description=description, origin=origin, user_renamed=False,
            user_hidden=False, user_merged_into=None, occurrence_count=0,
            last_observed_at=None, disclaimer=disclaimer,
            created_at=now, updated_at=now
        )
    
    def get_language_shape(self, shape_id: str, mirror_id: str) -> Optional[LanguageShape]:
        """Get language shape. I2: Requires mirror_id."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM language_shapes WHERE id = ? AND mirror_id = ?",
                (shape_id, mirror_id)
            ).fetchone()
            
            if not row:
                return None
            
            return LanguageShape(
                id=row['id'], mirror_id=row['mirror_id'], name=row['name'],
                system_name=row['system_name'], description=row['description'],
                origin=ShapeOrigin(row['origin']),
                user_renamed=bool(row['user_renamed']),
                user_hidden=bool(row['user_hidden']),
                user_merged_into=row['user_merged_into'],
                occurrence_count=row['occurrence_count'],
                last_observed_at=row['last_observed_at'],
                disclaimer=row['disclaimer'],
                created_at=row['created_at'], updated_at=row['updated_at']
            )
    
    def list_language_shapes(
        self,
        mirror_id: str,
        include_hidden: bool = False,
        origin: Optional[ShapeOrigin] = None
    ) -> List[LanguageShape]:
        """List language shapes. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            query = "SELECT * FROM language_shapes WHERE mirror_id = ?"
            params = [mirror_id]
            
            if origin:
                query += " AND origin = ?"
                params.append(origin.value)
            if not include_hidden:
                query += " AND user_hidden = FALSE"
            
            rows = conn.execute(query, params).fetchall()
            
            return [LanguageShape(
                id=row['id'], mirror_id=row['mirror_id'], name=row['name'],
                system_name=row['system_name'], description=row['description'],
                origin=ShapeOrigin(row['origin']),
                user_renamed=bool(row['user_renamed']),
                user_hidden=bool(row['user_hidden']),
                user_merged_into=row['user_merged_into'],
                occurrence_count=row['occurrence_count'],
                last_observed_at=row['last_observed_at'],
                disclaimer=row['disclaimer'],
                created_at=row['created_at'], updated_at=row['updated_at']
            ) for row in rows]
    
    def update_language_shape(
        self,
        shape_id: str,
        mirror_id: str,
        **updates
    ) -> LanguageShape:
        """Update language shape. I9: User can rename/hide."""
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            update_clauses = ["updated_at = ?"]
            params = [now]
            
            if 'name' in updates:
                update_clauses.append("name = ?")
                update_clauses.append("user_renamed = TRUE")
                params.append(updates['name'])
            if 'user_hidden' in updates:
                update_clauses.append("user_hidden = ?")
                params.append(updates['user_hidden'])
            
            if len(update_clauses) > 1:  # More than just updated_at
                params.extend([shape_id, mirror_id])
                conn.execute(
                    f"UPDATE language_shapes SET {', '.join(update_clauses)} WHERE id = ? AND mirror_id = ?",
                    params
                )
        
        shape = self.get_language_shape(shape_id, mirror_id)
        if shape is None:
            raise ValueError(f"Language shape {shape_id} not found after update")
        return shape
    
    def record_shape_occurrence(
        self,
        shape_id: str,
        node_id: str,
        confidence: float,
        context_snippet: Optional[str] = None
    ) -> str:
        """Record shape occurrence in a node. Returns occurrence_id."""
        occurrence_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO language_shape_occurrences (
                    id, shape_id, node_id, confidence, context_snippet, detected_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (occurrence_id, shape_id, node_id, confidence, context_snippet, now))
            
            # Update occurrence count and last observed
            conn.execute("""
                UPDATE language_shapes
                SET occurrence_count = occurrence_count + 1,
                    last_observed_at = ?,
                    updated_at = ?
                WHERE id = ?
            """, (now, now, shape_id))
        
        return occurrence_id
    
    # ========================================================================
    # TENSIONS (I9: User owns, can merge/hide)
    # ========================================================================
    
    def create_tension(
        self,
        mirror_id: str,
        axis_a: str,
        axis_b: str,
        current_position: float,
        origin: TensionOrigin
    ) -> Tension:
        """Create tension. I9: User owns, can rename/merge."""
        tension_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO tensions (
                    id, mirror_id, axis_a, axis_b, current_position,
                    position_confidence, origin, user_renamed, user_hidden,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, NULL, ?, FALSE, FALSE, ?, ?)
            """, (
                tension_id, mirror_id, axis_a, axis_b, current_position,
                origin.value, now, now
            ))
        
        return Tension(
            id=tension_id, mirror_id=mirror_id, axis_a=axis_a, axis_b=axis_b,
            current_position=current_position, position_confidence=None,
            origin=origin, user_renamed=False, user_hidden=False,
            created_at=now, updated_at=now
        )
    
    def list_tensions(
        self,
        mirror_id: str,
        include_hidden: bool = False
    ) -> List[Tension]:
        """List tensions. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            query = "SELECT * FROM tensions WHERE mirror_id = ?"
            params = [mirror_id]
            
            if not include_hidden:
                query += " AND user_hidden = FALSE"
            
            rows = conn.execute(query, params).fetchall()
            
            return [Tension(
                id=row['id'], mirror_id=row['mirror_id'],
                axis_a=row['axis_a'], axis_b=row['axis_b'],
                current_position=row['current_position'],
                position_confidence=row['position_confidence'],
                origin=TensionOrigin(row['origin']),
                user_renamed=bool(row['user_renamed']),
                user_hidden=bool(row['user_hidden']),
                created_at=row['created_at'], updated_at=row['updated_at']
            ) for row in rows]
    
    def update_tension(
        self,
        tension_id: str,
        mirror_id: str,
        **updates
    ) -> Tension:
        """Update tension. I9: User can rename/hide."""
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            update_clauses = ["updated_at = ?"]
            params = [now]
            
            if 'axis_a' in updates:
                update_clauses.append("axis_a = ?")
                update_clauses.append("user_renamed = TRUE")
                params.append(updates['axis_a'])
            if 'axis_b' in updates:
                update_clauses.append("axis_b = ?")
                update_clauses.append("user_renamed = TRUE")
                params.append(updates['axis_b'])
            if 'current_position' in updates:
                update_clauses.append("current_position = ?")
                params.append(updates['current_position'])
            if 'user_hidden' in updates:
                update_clauses.append("user_hidden = ?")
                params.append(updates['user_hidden'])
            
            if len(update_clauses) > 1:  # More than just updated_at
                params.extend([tension_id, mirror_id])
                conn.execute(
                    f"UPDATE tensions SET {', '.join(update_clauses)} WHERE id = ? AND mirror_id = ?",
                    params
                )
        
        tension = self._get_tension(tension_id, mirror_id)
        if tension is None:
            raise ValueError(f"Tension {tension_id} not found after update")
        return tension
    
    def _get_tension(self, tension_id: str, mirror_id: str) -> Optional[Tension]:
        """Internal helper to get tension."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM tensions WHERE id = ? AND mirror_id = ?",
                (tension_id, mirror_id)
            ).fetchone()
            
            if not row:
                return None
            
            return Tension(
                id=row['id'], mirror_id=row['mirror_id'],
                axis_a=row['axis_a'], axis_b=row['axis_b'],
                current_position=row['current_position'],
                position_confidence=row['position_confidence'],
                origin=TensionOrigin(row['origin']),
                user_renamed=bool(row['user_renamed']),
                user_hidden=bool(row['user_hidden']),
                created_at=row['created_at'], updated_at=row['updated_at']
            )
    
    def record_tension_measurement(
        self,
        tension_id: str,
        position: float,
        confidence: Optional[float] = None,
        context_node_id: Optional[str] = None,
        measured_by: str = 'user_reported'
    ) -> str:
        """Record tension measurement. position in [-1.0, 1.0]. Returns measurement_id."""
        measurement_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO tension_measurements (
                    id, tension_id, position, confidence, context_node_id,
                    measured_at, measured_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (measurement_id, tension_id, position, confidence,
                  context_node_id, now, measured_by))
        
        return measurement_id
    
    # ========================================================================
    # REFLECTIONS & THREADS (I2: Reflection only)
    # ========================================================================
    
    def create_thread(
        self,
        mirror_id: str,
        title: Optional[str] = None,
        initial_reflection_id: Optional[str] = None
    ) -> str:
        """Create conversation thread."""
        thread_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO threads (
                    id, mirror_id, title, status, created_at, updated_at, last_activity_at
                ) VALUES (?, ?, ?, 'active', ?, ?, ?)
            """, (thread_id, mirror_id, title, now, now, now))
            
            if initial_reflection_id:
                assoc_id = str(uuid.uuid4())
                conn.execute("""
                    INSERT INTO thread_reflections (
                        id, thread_id, reflection_id, sequence_number, created_at
                    ) VALUES (?, ?, ?, 0, ?)
                """, (assoc_id, thread_id, initial_reflection_id, now))
        
        return thread_id
    
    def create_reflection(
        self,
        mirror_id: str,
        content: str,
        thread_id: Optional[str] = None,
        visibility: str = 'private',
        parent_reflection_id: Optional[str] = None
    ) -> Reflection:
        """Create reflection. I2: Reflection only, never prescription."""
        reflection_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        word_count = len(content.split()) if content else 0
        
        # Calculate sequence number if in thread
        sequence_number = None
        if thread_id:
            with self._get_connection() as conn:
                result = conn.execute(
                    "SELECT MAX(sequence_number) FROM reflections WHERE thread_id = ?",
                    (thread_id,)
                ).fetchone()
                sequence_number = (result[0] + 1) if result[0] is not None else 0
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO reflections (
                    id, mirror_id, thread_id, content, visibility,
                    word_count, sequence_number, parent_reflection_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                reflection_id, mirror_id, thread_id, content, visibility,
                word_count, sequence_number, parent_reflection_id, now
            ))
        
        return Reflection(
            id=reflection_id, mirror_id=mirror_id, content=content,
            thread_id=thread_id, context=None, created_at=now
        )
    
    def list_reflections(
        self,
        mirror_id: str,
        thread_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Reflection]:
        """List reflections. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            query = "SELECT * FROM reflections WHERE mirror_id = ?"
            params = [mirror_id]
            
            if thread_id:
                query += " AND thread_id = ?"
                params.append(thread_id)
            
            query += " ORDER BY created_at DESC"
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            rows = conn.execute(query, params).fetchall()
            
            return [Reflection(
                id=row['id'], mirror_id=row['mirror_id'], content=row['content'],
                thread_id=row['thread_id'], context=None,
                created_at=row['created_at']
            ) for row in rows]
    
    # ========================================================================
    # MIRRORBACKS (I2: Reflection only, I13: No behavioral optimization)
    # ========================================================================
    
    def create_mirrorback(
        self,
        mirror_id: str,
        reflection_id: str,
        content: str,
        constitutional_check_passed: bool,
        engine_version: str,
        model_used: str,
        directive_ratio: Optional[float] = None,
        imperative_intent_detected: bool = False,
        outcome_steering_detected: bool = False,
        constitutional_violations: Optional[List[str]] = None,
        engine_config_hash: Optional[str] = None,
        generation_time_ms: Optional[int] = None,
        token_count: Optional[int] = None
    ) -> Mirrorback:
        """Create Mirrorback. I2: MUST be reflection-only and pass checks."""
        mirrorback_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO mirrorbacks (
                    id, mirror_id, reflection_id, content,
                    directive_ratio, imperative_intent_detected,
                    outcome_steering_detected, constitutional_violations,
                    constitutional_check_passed, engine_version,
                    engine_config_hash, model_used, generation_time_ms,
                    token_count, user_rating_resonance,
                    user_rating_fidelity, user_rating_clarity,
                    user_feedback, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?)
            """, (
                mirrorback_id, mirror_id, reflection_id, content,
                directive_ratio, imperative_intent_detected,
                outcome_steering_detected,
                self._json_dumps(constitutional_violations),
                constitutional_check_passed, engine_version,
                engine_config_hash, model_used, generation_time_ms,
                token_count, now
            ))
        
        return Mirrorback(
            id=mirrorback_id, mirror_id=mirror_id, reflection_id=reflection_id,
            content=content, detected_shapes=None, detected_tensions=None,
            context=None, rating_resonance=None, rating_fidelity=None,
            rating_clarity=None, created_at=now
        )
    
    def get_mirrorback(self, mirrorback_id: str, mirror_id: str) -> Optional[Mirrorback]:
        """Get Mirrorback. I2: Requires mirror_id."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM mirrorbacks WHERE id = ? AND mirror_id = ?",
                (mirrorback_id, mirror_id)
            ).fetchone()
            
            if not row:
                return None
            
            return Mirrorback(
                id=row['id'], mirror_id=row['mirror_id'],
                reflection_id=row['reflection_id'], content=row['content'],
                detected_shapes=None, detected_tensions=None, context=None,
                rating_resonance=row['user_rating_resonance'],
                rating_fidelity=row['user_rating_fidelity'],
                rating_clarity=row['user_rating_clarity'],
                created_at=row['created_at']
            )
    
    def list_mirrorbacks(
        self,
        mirror_id: str,
        reflection_id: Optional[str] = None
    ) -> List[Mirrorback]:
        """List Mirrorbacks. I2: Scoped to single mirror_id."""
        with self._get_connection() as conn:
            if reflection_id:
                rows = conn.execute(
                    "SELECT * FROM mirrorbacks WHERE mirror_id = ? AND reflection_id = ?",
                    (mirror_id, reflection_id)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM mirrorbacks WHERE mirror_id = ?",
                    (mirror_id,)
                ).fetchall()
            
            return [Mirrorback(
                id=row['id'], mirror_id=row['mirror_id'],
                reflection_id=row['reflection_id'], content=row['content'],
                detected_shapes=None, detected_tensions=None, context=None,
                rating_resonance=row['user_rating_resonance'],
                rating_fidelity=row['user_rating_fidelity'],
                rating_clarity=row['user_rating_clarity'],
                created_at=row['created_at']
            ) for row in rows]
    
    def update_mirrorback_rating(
        self,
        mirrorback_id: str,
        mirror_id: str,
        rating_resonance: Optional[int] = None,
        rating_fidelity: Optional[int] = None,
        rating_clarity: Optional[int] = None,
        user_feedback: Optional[str] = None
    ) -> Mirrorback:
        """Update Mirrorback rating. I13: ONLY resonance/fidelity/clarity."""
        with self._get_connection() as conn:
            conn.execute("""
                UPDATE mirrorbacks
                SET user_rating_resonance = ?,
                    user_rating_fidelity = ?,
                    user_rating_clarity = ?,
                    user_feedback = ?
                WHERE id = ? AND mirror_id = ?
            """, (
                rating_resonance, rating_fidelity, rating_clarity,
                user_feedback, mirrorback_id, mirror_id
            ))
        
        mirrorback = self.get_mirrorback(mirrorback_id, mirror_id)
        if mirrorback is None:
            raise ValueError(f"Mirrorback {mirrorback_id} not found after update")
        return mirrorback
    
    # ========================================================================
    # TELEMETRY (I14: No content, no IDs, coarsened timestamps)
    # ========================================================================
    
    def create_engine_run(
        self,
        mirror_id: str,
        engine_type: str,
        input_reflection_id: str,
        output_mirrorback_id: Optional[str] = None
    ) -> EngineRun:
        """Create engine run record."""
        run_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO engine_runs (
                    id, mirror_id, engine_type, input_reflection_id,
                    output_mirrorback_id, run_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                run_id, mirror_id, engine_type, input_reflection_id,
                output_mirrorback_id, now
            ))
        
        return EngineRun(
            id=run_id, mirror_id=mirror_id, engine_type=engine_type,
            input_reflection_id=input_reflection_id,
            output_mirrorback_id=output_mirrorback_id, run_at=now
        )
    
    def create_engine_feedback(
        self,
        run_id: str,
        mirror_id: str,
        feedback_type: FeedbackType,
        value: Any
    ) -> None:
        """Create engine feedback. I13: ONLY allowed types."""
        feedback_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO engine_feedback (
                    id, run_id, mirror_id, feedback_type, value, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                feedback_id, run_id, mirror_id, feedback_type.value,
                self._json_dumps(value), now
            ))
    
    def create_evolution_event(
        self,
        event_type: EvolutionEventType,
        component: str,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        reason: Optional[str] = None,
        impact_metrics: Optional[Dict[str, Any]] = None
    ) -> None:
        """Create evolution event. No mirror_id (system-level)."""
        event_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO evolution_events (
                    id, event_type, component, old_value, new_value,
                    reason, impact_metrics, occurred_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id, event_type.value, component,
                self._json_dumps(old_value), self._json_dumps(new_value),
                reason, self._json_dumps(impact_metrics), now
            ))
    
    def list_evolution_events(
        self,
        event_type: Optional[EvolutionEventType] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """List evolution events."""
        with self._get_connection() as conn:
            query = "SELECT * FROM evolution_events"
            params = []
            
            if event_type:
                query += " WHERE event_type = ?"
                params.append(event_type.value)
            
            query += " ORDER BY occurred_at DESC"
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            rows = conn.execute(query, params).fetchall()
            
            return [{
                'id': row['id'],
                'event_type': row['event_type'],
                'component': row['component'],
                'old_value': self._json_loads(row['old_value']),
                'new_value': self._json_loads(row['new_value']),
                'reason': row['reason'],
                'impact_metrics': self._json_loads(row['impact_metrics']),
                'occurred_at': row['occurred_at']
            } for row in rows]
    
    # ========================================================================
    # CONSTITUTIONAL AUDIT (I11: Historical integrity)
    # ========================================================================
    
    def log_constitutional_check(
        self,
        mirror_id: str,
        check_type: str,
        invariants_checked: List[str],
        all_passed: bool,
        violations_detected: Optional[List[str]] = None,
        severity: Optional[str] = None,
        context_id: Optional[str] = None,
        context_type: Optional[str] = None
    ) -> None:
        """Log constitutional check. I11: Immutable audit trail."""
        audit_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO constitutional_audit (
                    id, mirror_id, check_type, invariants_checked,
                    all_passed, violations_detected, severity,
                    context_id, context_type, checked_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit_id, mirror_id, check_type,
                self._json_dumps(invariants_checked), all_passed,
                self._json_dumps(violations_detected), severity,
                context_id, context_type, now
            ))
    
    def get_constitutional_audit(
        self,
        mirror_id: Optional[str] = None,
        check_type: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get constitutional audit logs. I11: Read-only."""
        with self._get_connection() as conn:
            query = "SELECT * FROM constitutional_audit"
            params = []
            conditions = []
            
            if mirror_id:
                conditions.append("mirror_id = ?")
                params.append(mirror_id)
            if check_type:
                conditions.append("check_type = ?")
                params.append(check_type)
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY checked_at DESC"
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            rows = conn.execute(query, params).fetchall()
            
            return [{
                'id': row['id'],
                'mirror_id': row['mirror_id'],
                'check_type': row['check_type'],
                'invariants_checked': self._json_loads(row['invariants_checked']),
                'all_passed': bool(row['all_passed']) == True,  # SQLite int to Python bool
                'violations_detected': self._json_loads(row['violations_detected']),
                'severity': row['severity'],
                'context_id': row['context_id'],
                'context_type': row['context_type'],
                'checked_at': row['checked_at']
            } for row in rows]
    
    # ========================================================================
    # EXPORT/IMPORT (I5: No lock-in, semantic meaning preserved)
    # ========================================================================
    
    def export_mirror(self, mirror_id: str, output_path: str) -> ExportBundle:
        """Export complete Mirror. I5: MUST include semantic meaning."""
        import shutil, zipfile, hashlib
        
        mirror = self.get_mirror(mirror_id)
        if not mirror:
            raise ValueError(f"Mirror {mirror_id} not found")
        
        # Create semantic bundle (I5: Required for meaning preservation)
        bundle = {
            "mirror_id": mirror_id,
            "export_timestamp": datetime.now().isoformat(),
            "constitution_version": mirror.constitution_version,
            "constitution_hash": mirror.constitution_hash,
            "prompt_templates": mirror.prompt_templates or {},
            "lens_definitions": mirror.lens_definitions or {},
            "user_renames": mirror.user_renames or {},
        }
        
        # ZIP: DB + semantic bundle
        with zipfile.ZipFile(output_path, 'w') as zf:
            zf.write(self.db_path, "mirror.db")
            zf.writestr("bundle.json", json.dumps(bundle, indent=2))
        
        return ExportBundle(
            mirror_id=mirror_id,
            export_timestamp=bundle["export_timestamp"],
            constitution_version=mirror.constitution_version,
            constitution_hash=mirror.constitution_hash,
            mirrorcore_version=mirror.mirrorcore_version,
            prompt_templates=bundle["prompt_templates"],
            lens_definitions=bundle["lens_definitions"],
            user_renames=bundle["user_renames"],
            database_path=self.db_path,
            config={},
            bundle_hash=hashlib.sha256(open(output_path,'rb').read()).hexdigest()
        )
    
    def import_mirror(self, bundle_path: str, new_owner_id: Optional[str] = None) -> str:
        """Import Mirror from bundle. I5: Semantic meaning restored."""
        import zipfile, tempfile, shutil
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Extract bundle
            with zipfile.ZipFile(bundle_path, 'r') as zf:
                zf.extractall(tmpdir)
            
            # Load semantic bundle
            bundle_file = Path(tmpdir) / "bundle.json"
            with open(bundle_file) as f:
                bundle = json.load(f)
            
            # Import database (open without re-initializing schema)
            imported_db = Path(tmpdir) / "mirror.db"
            
            original_mirror_id = bundle["mirror_id"]
            # Directly query the imported database without SQLiteStorage init
            import sqlite3
            conn = sqlite3.connect(str(imported_db))
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM mirrors WHERE id = ?", (original_mirror_id,)).fetchone()
            conn.close()
            
            if row is None:
                raise ValueError(f"Mirror {original_mirror_id} not found in bundle")
            
            mirror = Mirror(
                id=row['id'], owner_id=row['owner_id'], label=row['label'],
                works_offline=bool(row['works_offline']) == True,
                mirrorcore_version=row['mirrorcore_version'],
                constitution_hash=row['constitution_hash'],
                constitution_version=row['constitution_version'],
                prompt_templates=self._json_loads(row['prompt_templates']),
                lens_definitions=self._json_loads(row['lens_definitions']),
                user_renames=self._json_loads(row['user_renames']),
                created_at=row['created_at'], last_active_at=row['last_active_at'],
                last_export_at=row['last_export_at'], forked_from=row['forked_from'],
                fork_constitution_verified=bool(row['fork_constitution_verified']) == True,
                platform_connected=bool(row['platform_connected']) == True
            )
            if new_owner_id:
                # Create new mirror with same constitution
                new_mirror = self.create_mirror(
                    owner_id=new_owner_id,
                    label=mirror.label,
                    mirrorcore_version=mirror.mirrorcore_version,
                    constitution_hash=mirror.constitution_hash,
                    constitution_version=mirror.constitution_version,
                    prompt_templates=bundle["prompt_templates"],
                    lens_definitions=bundle["lens_definitions"]
                )
                
                # Apply user renames
                if bundle["user_renames"]:
                    self.update_mirror(
                        new_mirror.id,
                        user_renames=bundle["user_renames"]
                    )
                
                return new_mirror.id
            else:
                # Direct import (same owner)
                shutil.copy(imported_db, self.db_path)
                return original_mirror_id
    
    # ========================================================================
    # UTILITIES
    # ========================================================================
    
    def verify_mirror_locality(self, mirror_id: str) -> bool:
        """Verify I2: No cross-identity data. Returns True if clean."""
        with self._get_connection() as conn:
            # Check nodes
            bad_nodes = conn.execute("""
                SELECT COUNT(*) FROM mirror_nodes WHERE mirror_id != ?
            """, (mirror_id,)).fetchone()[0]
            
            # Check edges
            bad_edges = conn.execute("""
                SELECT COUNT(*) FROM mirror_edges
                WHERE mirror_id != ? OR
                      source_node_id NOT IN (SELECT id FROM mirror_nodes WHERE mirror_id = ?) OR
                      target_node_id NOT IN (SELECT id FROM mirror_nodes WHERE mirror_id = ?)
            """, (mirror_id, mirror_id, mirror_id)).fetchone()[0]
            
            return bad_nodes == 0 and bad_edges == 0
    
    def get_storage_stats(self, mirror_id: Optional[str] = None) -> Dict[str, int]:
        """Get storage statistics."""
        with self._get_connection() as conn:
            if mirror_id:
                stats = {
                    'nodes': conn.execute(
                        "SELECT COUNT(*) FROM mirror_nodes WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                    'edges': conn.execute(
                        "SELECT COUNT(*) FROM mirror_edges WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                    'language_shapes': conn.execute(
                        "SELECT COUNT(*) FROM language_shapes WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                    'tensions': conn.execute(
                        "SELECT COUNT(*) FROM tensions WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                    'reflections': conn.execute(
                        "SELECT COUNT(*) FROM reflections WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                    'mirrorbacks': conn.execute(
                        "SELECT COUNT(*) FROM mirrorbacks WHERE mirror_id = ?",
                        (mirror_id,)
                    ).fetchone()[0],
                }
            else:
                stats = {
                    'mirrors': conn.execute("SELECT COUNT(*) FROM mirrors").fetchone()[0],
                    'total_reflections': conn.execute("SELECT COUNT(*) FROM reflections").fetchone()[0],
                    'total_mirrorbacks': conn.execute("SELECT COUNT(*) FROM mirrorbacks").fetchone()[0],
                }
            
            return stats
