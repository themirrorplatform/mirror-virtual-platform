# mirror_os/runtime.py
"""
Mirror OS - Local Runtime

This is the sovereign substrate: the system that lets The Mirror
run completely offline, with full data ownership and portability.

Key capabilities:
- Works without internet connection
- Semantic export (not just raw data)
- Identity graph with contradictions
- Sync protocol with dual-consent
- Fork mechanism (legitimate branching)

This is what makes exit always available.
"""

import json
import sqlite3
import hashlib
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class MirrorOSInfo:
    """Information about the Mirror OS instance"""
    version: str
    constitution_hash: str
    created_at: str
    last_sync: Optional[str]
    identity_id: str
    offline_capable: bool
    export_format_version: str


class MirrorOSRuntime:
    """
    Local runtime for Mirror OS.
    
    This enables:
    1. Offline operation - works without internet
    2. Data sovereignty - all data stays local
    3. Semantic export - constitution + prompts + lenses, not just raw data
    4. Portability - can move between systems
    5. Fork capability - legitimate branching
    """
    
    def __init__(self, data_dir: Optional[Path] = None):
        """
        Initialize Mirror OS runtime.
        
        Args:
            data_dir: Directory for local data storage. 
                     Defaults to ~/.mirror/
        """
        if data_dir is None:
            data_dir = Path.home() / ".mirror"
        
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Core paths
        self.db_path = self.data_dir / "mirror.db"
        self.constitution_path = self.data_dir / "constitution.json"
        self.prompts_path = self.data_dir / "prompts.json"
        self.lenses_path = self.data_dir / "lenses.json"
        
        # Initialize if needed
        self._initialize_if_needed()
    
    def _initialize_if_needed(self):
        """Initialize Mirror OS if this is first run"""
        if not self.db_path.exists():
            self._create_runtime_db()
            self._save_constitution()
            self._save_default_prompts()
            self._save_default_lenses()
    
    def _create_runtime_db(self):
        """Create runtime database schema"""
        with sqlite3.connect(self.db_path) as conn:
            # Mirror OS metadata
            conn.execute("""
                CREATE TABLE IF NOT EXISTS os_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # Identity graph with contradictions
            conn.execute("""
                CREATE TABLE IF NOT EXISTS identity_graph (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    identity_id TEXT NOT NULL,
                    concept_a TEXT NOT NULL,
                    concept_b TEXT NOT NULL,
                    relationship TEXT NOT NULL,  -- 'supports', 'contradicts', 'refines'
                    strength REAL DEFAULT 1.0,
                    first_observed TEXT NOT NULL,
                    last_observed TEXT NOT NULL,
                    observation_count INTEGER DEFAULT 1
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_graph_identity 
                ON identity_graph(identity_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_graph_concepts 
                ON identity_graph(concept_a, concept_b)
            """)
            
            # Mirror Archive (long-term semantic memory)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS archive (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    identity_id TEXT NOT NULL,
                    semantic_summary TEXT NOT NULL,
                    themes TEXT NOT NULL,  -- JSON array
                    tensions TEXT NOT NULL,  -- JSON array
                    time_period_start TEXT NOT NULL,
                    time_period_end TEXT NOT NULL,
                    reflection_ids TEXT NOT NULL,  -- JSON array
                    created_at TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_archive_identity 
                ON archive(identity_id)
            """)
            
            # Sync protocol state
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_state (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    remote_endpoint TEXT NOT NULL,
                    last_sync TEXT,
                    consent_given BOOLEAN DEFAULT FALSE,
                    consent_given_at TEXT,
                    sync_direction TEXT,  -- 'push', 'pull', 'bidirectional'
                    last_sync_hash TEXT
                )
            """)
            
            # Fork history
            conn.execute("""
                CREATE TABLE IF NOT EXISTS fork_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fork_timestamp TEXT NOT NULL,
                    fork_reason TEXT NOT NULL,
                    parent_hash TEXT NOT NULL,
                    fork_hash TEXT NOT NULL,
                    constitutional_changes TEXT,  -- JSON or NULL if no changes
                    forked_by TEXT NOT NULL
                )
            """)
            
            conn.commit()
    
    def _save_constitution(self):
        """Save constitution bundle locally"""
        from constitution.genesis import GENESIS_HASH
        
        constitution_data = {
            "genesis_hash": GENESIS_HASH,
            "version": "1.0",
            "invariants": {
                "L0": [
                    "I1: Non-prescription",
                    "I2: Identity locality",
                    "I3: Transparent uncertainty",
                    "I4: Non-coercion",
                    "I5: Data sovereignty",
                    "I6: No fixed teleology",
                    "I7: Architectural honesty",
                    "I8: Objective transparency",
                    "I9: Anti-diagnosis",
                    "I10: Non-complicity",
                    "I11: Historical integrity",
                    "I12: Training prohibition",
                    "I13: No behavioral optimization",
                    "I14: No cross-identity inference"
                ],
                "L1": "Safety & legality (two-tier jurisdictional model)",
                "L2": "Philosophical stances (evolvable with supermajority)",
                "L3": "Implementation (freely evolvable)"
            },
            "export_date": datetime.utcnow().isoformat() + "Z"
        }
        
        with open(self.constitution_path, 'w', encoding='utf-8') as f:
            json.dump(constitution_data, f, indent=2)
    
    def _save_default_prompts(self):
        """Save default prompt templates"""
        prompts_data = {
            "version": "1.0",
            "templates": {
                "reflection": {
                    "system": "You are The Mirror - a constitutional reflection system.",
                    "context": "Constitution constrains: no prescription, no coercion, no diagnosis.",
                    "task": "Generate reflective mirrorback that holds tensions, surfaces patterns, avoids directives."
                },
                "pattern_detection": {
                    "system": "Analyze text for recurring themes without judgment.",
                    "task": "Identify: recurring language, relational patterns, temporal patterns, tensions."
                }
            },
            "export_date": datetime.utcnow().isoformat() + "Z"
        }
        
        with open(self.prompts_path, 'w', encoding='utf-8') as f:
            json.dump(prompts_data, f, indent=2)
    
    def _save_default_lenses(self):
        """Save default lens definitions"""
        lenses_data = {
            "version": "1.0",
            "lenses": {
                "language_shapes": {
                    "description": "Patterns in how user expresses thoughts",
                    "categories": ["certainty", "uncertainty", "questioning", "asserting", "hedging"]
                },
                "relational_patterns": {
                    "description": "How user describes relationships",
                    "categories": ["connection", "separation", "conflict", "harmony", "ambivalence"]
                },
                "temporal_patterns": {
                    "description": "Time orientation in reflections",
                    "categories": ["past-focused", "present-focused", "future-focused", "timeless"]
                },
                "tensions": {
                    "description": "Contradictions and unresolved themes",
                    "categories": ["internal_conflict", "external_pressure", "value_tension", "identity_uncertainty"]
                }
            },
            "export_date": datetime.utcnow().isoformat() + "Z"
        }
        
        with open(self.lenses_path, 'w', encoding='utf-8') as f:
            json.dump(lenses_data, f, indent=2)
    
    def get_os_info(self) -> MirrorOSInfo:
        """Get Mirror OS runtime information"""
        from constitution.genesis import GENESIS_HASH
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT value FROM os_metadata WHERE key = 'identity_id'
            """)
            row = cursor.fetchone()
            identity_id = row[0] if row else "not_set"
            
            cursor = conn.execute("""
                SELECT value FROM os_metadata WHERE key = 'last_sync'
            """)
            row = cursor.fetchone()
            last_sync = row[0] if row else None
        
        return MirrorOSInfo(
            version="1.0",
            constitution_hash=GENESIS_HASH,
            created_at=datetime.utcnow().isoformat() + "Z",
            last_sync=last_sync,
            identity_id=identity_id,
            offline_capable=True,
            export_format_version="1.0"
        )
    
    def export_semantic_bundle(self, identity_id: str, output_path: Path) -> Dict[str, Any]:
        """
        Export complete semantic bundle.
        
        This is I5 (Data Sovereignty) in action: user gets EVERYTHING,
        including constitution, prompts, lenses - not just raw data.
        
        The export is portable and can be imported into any Mirror-compatible system.
        
        Args:
            identity_id: Identity to export
            output_path: Where to save export
        
        Returns:
            Export metadata
        """
        from mirrorcore.storage.local_db import LocalDB
        
        # Create export bundle
        bundle = {
            "export_format_version": "1.0",
            "export_timestamp": datetime.utcnow().isoformat() + "Z",
            "identity_id": identity_id,
            
            # Constitutional foundation
            "constitution": json.load(open(self.constitution_path)),
            
            # Semantic interpretation layers
            "prompts": json.load(open(self.prompts_path)),
            "lenses": json.load(open(self.lenses_path)),
            
            # Identity data
            "reflections": [],
            "identity_graph": [],
            "archive_entries": []
        }
        
        # Export reflections from LocalDB
        db = LocalDB(self.db_path)
        reflections = db.list_reflections(identity_id=identity_id, limit=None)
        bundle["reflections"] = reflections
        
        # Export identity graph
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM identity_graph WHERE identity_id = ?
            """, (identity_id,))
            bundle["identity_graph"] = [dict(row) for row in cursor.fetchall()]
            
            cursor = conn.execute("""
                SELECT * FROM archive WHERE identity_id = ?
            """, (identity_id,))
            bundle["archive_entries"] = [dict(row) for row in cursor.fetchall()]
        
        # Save bundle
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, indent=2)
        
        # Compute bundle hash for verification
        with open(output_path, 'rb') as f:
            bundle_hash = hashlib.sha256(f.read()).hexdigest()
        
        return {
            "export_path": str(output_path),
            "bundle_hash": bundle_hash,
            "export_timestamp": bundle["export_timestamp"],
            "reflection_count": len(bundle["reflections"]),
            "graph_edges": len(bundle["identity_graph"]),
            "archive_entries": len(bundle["archive_entries"])
        }
    
    def import_semantic_bundle(self, bundle_path: Path) -> Dict[str, Any]:
        """
        Import semantic bundle from another Mirror instance.
        
        This enables portability and fork capability.
        
        Args:
            bundle_path: Path to bundle file
        
        Returns:
            Import metadata
        """
        # Load bundle
        with open(bundle_path, 'r', encoding='utf-8') as f:
            bundle = json.load(f)
        
        # Verify format version
        if bundle.get("export_format_version") != "1.0":
            raise ValueError(f"Unsupported export format: {bundle.get('export_format_version')}")
        
        # Import constitution (verify hash)
        imported_hash = bundle["constitution"]["genesis_hash"]
        from constitution.genesis import GENESIS_HASH
        
        if imported_hash != GENESIS_HASH:
            print(f"WARNING: Constitution hash mismatch!")
            print(f"  Local:    {GENESIS_HASH}")
            print(f"  Imported: {imported_hash}")
            print("This may be a fork or different version.")
        
        # Import reflections
        from mirrorcore.storage.local_db import LocalDB
        db = LocalDB(self.db_path)
        
        identity_id = bundle["identity_id"]
        db.ensure_identity(identity_id)
        
        imported_reflections = 0
        for reflection in bundle["reflections"]:
            try:
                db.create_reflection(
                    content=reflection["content"],
                    identity_id=identity_id,
                    mirrorback=reflection.get("mirrorback"),
                    metadata=reflection.get("metadata", {})
                )
                imported_reflections += 1
            except Exception as e:
                print(f"Warning: Failed to import reflection: {e}")
        
        # Import identity graph
        with sqlite3.connect(self.db_path) as conn:
            for edge in bundle["identity_graph"]:
                conn.execute("""
                    INSERT INTO identity_graph (
                        identity_id, concept_a, concept_b, relationship,
                        strength, first_observed, last_observed, observation_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    identity_id,
                    edge["concept_a"],
                    edge["concept_b"],
                    edge["relationship"],
                    edge["strength"],
                    edge["first_observed"],
                    edge["last_observed"],
                    edge["observation_count"]
                ))
            
            conn.commit()
        
        return {
            "imported_at": datetime.utcnow().isoformat() + "Z",
            "identity_id": identity_id,
            "reflections_imported": imported_reflections,
            "graph_edges_imported": len(bundle["identity_graph"]),
            "constitution_hash_match": imported_hash == GENESIS_HASH
        }
    
    def create_fork(
        self,
        reason: str,
        forked_by: str,
        constitutional_changes: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a legitimate fork of this Mirror instance.
        
        Forks are allowed and legitimate. They represent:
        - Constitutional evolution experiments
        - Personal customization
        - Community branches
        
        The original genesis hash is preserved in fork history
        so the provenance chain is transparent.
        
        Args:
            reason: Why this fork was created
            forked_by: Who created the fork
            constitutional_changes: Changes to constitution (if any)
        
        Returns:
            Fork hash (new genesis hash for the fork)
        """
        # Get current state hash
        with open(self.constitution_path, 'rb') as f:
            parent_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Generate fork hash
        fork_data = {
            "parent_hash": parent_hash,
            "fork_timestamp": datetime.utcnow().isoformat() + "Z",
            "reason": reason,
            "forked_by": forked_by,
            "constitutional_changes": constitutional_changes
        }
        
        fork_hash = hashlib.sha256(
            json.dumps(fork_data, sort_keys=True).encode()
        ).hexdigest()
        
        # Record fork in history
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO fork_history (
                    fork_timestamp, fork_reason, parent_hash, fork_hash,
                    constitutional_changes, forked_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                fork_data["fork_timestamp"],
                reason,
                parent_hash,
                fork_hash,
                json.dumps(constitutional_changes) if constitutional_changes else None,
                forked_by
            ))
            conn.commit()
        
        return fork_hash


# Self-test
if __name__ == "__main__":
    print("Mirror OS Runtime Test")
    print("=" * 80)
    
    # Create temporary runtime
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        runtime = MirrorOSRuntime(Path(tmpdir))
        
        # Show OS info
        info = runtime.get_os_info()
        print(f"Version: {info.version}")
        print(f"Constitution hash: {info.constitution_hash[:16]}...")
        print(f"Offline capable: {info.offline_capable}")
        print(f"Export format: {info.export_format_version}")
        
        # Test export
        print("\nTesting semantic export...")
        export_path = Path(tmpdir) / "export.json"
        export_meta = runtime.export_semantic_bundle("test_identity", export_path)
        print(f"Exported to: {export_meta['export_path']}")
        print(f"Bundle hash: {export_meta['bundle_hash'][:16]}...")
        
        # Test fork
        print("\nTesting fork creation...")
        fork_hash = runtime.create_fork(
            reason="Testing fork mechanism",
            forked_by="test_user",
            constitutional_changes={"L3": "Custom implementation"}
        )
        print(f"Fork hash: {fork_hash[:16]}...")
        
        print("\n✅ Mirror OS runtime functional")
