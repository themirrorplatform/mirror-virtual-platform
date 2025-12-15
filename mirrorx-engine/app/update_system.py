"""
Update Distribution System for Mirror
Signed manifests, three channels (stable/beta/dev), rollback, compatibility

Enables "update in sections" architecture:
- Orchestration updates: Frequent (routing, caching)
- Workers updates: Regular (new capabilities)
- Governance updates: Slow (RRP, multi-Guardian)
- Constitution updates: Rare (multi-sig required)
"""
import json
import sqlite3
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import sys
import os
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))
from canonical_signing import Ed25519Signer, Ed25519Verifier, canonical_json_str, sha256_hash


class UpdateChannel(str, Enum):
    STABLE = "stable"    # Production-ready, tested
    BETA = "beta"        # Preview features, mostly stable
    DEV = "dev"          # Bleeding edge, may break


class UpdateSection(str, Enum):
    ORCHESTRATION = "orchestration"    # Routing, caching, latency policies
    WORKERS = "workers"                # Worker capabilities, sandbox rules
    GOVERNANCE = "governance"          # RRP, certification, key rotation
    CONSTITUTION = "constitution"      # Core rules (multi-sig required)
    UI = "ui"                         # Frontend components
    PROTOCOL = "protocol"             # Event schema, replay rules


class UpdateStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    APPLYING = "applying"
    APPLIED = "applied"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class UpdateManifest:
    """Signed update manifest"""
    def __init__(
        self,
        update_id: str,
        version: str,
        section: UpdateSection,
        channel: UpdateChannel,
        title: str,
        description: str,
        changes: List[str],
        artifacts: Dict[str, str],  # filename -> hash
        dependencies: List[str],  # Required update_ids
        conflicts: List[str],  # Conflicting update_ids
        min_version: str,
        max_version: Optional[str],
        rollback_manifest: Optional[str],
        issued_at: datetime,
        issued_by: str,
        signature: Optional[str] = None
    ):
        self.update_id = update_id
        self.version = version
        self.section = section
        self.channel = channel
        self.title = title
        self.description = description
        self.changes = changes
        self.artifacts = artifacts
        self.dependencies = dependencies
        self.conflicts = conflicts
        self.min_version = min_version
        self.max_version = max_version
        self.rollback_manifest = rollback_manifest
        self.issued_at = issued_at
        self.issued_by = issued_by
        self.signature = signature
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "update_id": self.update_id,
            "version": self.version,
            "section": self.section.value,
            "channel": self.channel.value,
            "title": self.title,
            "description": self.description,
            "changes": self.changes,
            "artifacts": self.artifacts,
            "dependencies": self.dependencies,
            "conflicts": self.conflicts,
            "min_version": self.min_version,
            "max_version": self.max_version,
            "rollback_manifest": self.rollback_manifest,
            "issued_at": self.issued_at.isoformat(),
            "issued_by": self.issued_by
        }
    
    def canonical_payload(self) -> str:
        """Canonical representation for signing"""
        return canonical_json_str(self.to_dict())


class UpdateRegistry:
    """Registry of available updates"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize update registry database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Updates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS updates (
                update_id TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                section TEXT NOT NULL,
                channel TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                changes TEXT,  -- JSON array
                artifacts TEXT,  -- JSON object
                dependencies TEXT,  -- JSON array
                conflicts TEXT,  -- JSON array
                min_version TEXT NOT NULL,
                max_version TEXT,
                rollback_manifest TEXT,
                issued_at TEXT NOT NULL,
                issued_by TEXT NOT NULL,
                signature TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_updates_section ON updates(section)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_updates_channel ON updates(channel)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_updates_version ON updates(version)")
        
        # Applied updates table (per instance)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS applied_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                instance_id TEXT NOT NULL,
                update_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                applied_at TEXT,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (update_id) REFERENCES updates(update_id)
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_applied_instance ON applied_updates(instance_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_applied_update ON applied_updates(update_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_applied_status ON applied_updates(status)")
        
        # Version compatibility matrix
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS version_compatibility (
                current_version TEXT NOT NULL,
                section TEXT NOT NULL,
                min_compatible TEXT NOT NULL,
                max_compatible TEXT,
                PRIMARY KEY (current_version, section)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def register_update(self, manifest: UpdateManifest) -> str:
        """Register new update manifest"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO updates
            (update_id, version, section, channel, title, description, changes,
             artifacts, dependencies, conflicts, min_version, max_version,
             rollback_manifest, issued_at, issued_by, signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            manifest.update_id,
            manifest.version,
            manifest.section.value,
            manifest.channel.value,
            manifest.title,
            manifest.description,
            json.dumps(manifest.changes),
            json.dumps(manifest.artifacts),
            json.dumps(manifest.dependencies),
            json.dumps(manifest.conflicts),
            manifest.min_version,
            manifest.max_version,
            manifest.rollback_manifest,
            manifest.issued_at.isoformat(),
            manifest.issued_by,
            manifest.signature
        ))
        
        conn.commit()
        conn.close()
        
        return manifest.update_id
    
    def get_available_updates(
        self,
        instance_id: str,
        current_version: str,
        section: Optional[UpdateSection] = None,
        channel: UpdateChannel = UpdateChannel.STABLE
    ) -> List[UpdateManifest]:
        """Get updates available for instance"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get already applied updates
        cursor.execute("""
            SELECT update_id
            FROM applied_updates
            WHERE instance_id = ? AND status = 'applied'
        """, (instance_id,))
        
        applied_ids = {row[0] for row in cursor.fetchall()}
        
        # Get available updates
        query = """
            SELECT update_id, version, section, channel, title, description, changes,
                   artifacts, dependencies, conflicts, min_version, max_version,
                   rollback_manifest, issued_at, issued_by, signature
            FROM updates
            WHERE channel = ?
        """
        params = [channel.value]
        
        if section:
            query += " AND section = ?"
            params.append(section.value)
        
        query += " ORDER BY issued_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        manifests = []
        for row in rows:
            if row[0] in applied_ids:
                continue  # Already applied
            
            manifest = UpdateManifest(
                update_id=row[0],
                version=row[1],
                section=UpdateSection(row[2]),
                channel=UpdateChannel(row[3]),
                title=row[4],
                description=row[5],
                changes=json.loads(row[6]),
                artifacts=json.loads(row[7]),
                dependencies=json.loads(row[8]),
                conflicts=json.loads(row[9]),
                min_version=row[10],
                max_version=row[11],
                rollback_manifest=row[12],
                issued_at=datetime.fromisoformat(row[13]),
                issued_by=row[14],
                signature=row[15]
            )
            
            # Check version compatibility
            if self._is_compatible(current_version, manifest):
                manifests.append(manifest)
        
        return manifests
    
    def _is_compatible(self, current_version: str, manifest: UpdateManifest) -> bool:
        """Check if update is compatible with current version"""
        # Simple version comparison (should use semver in production)
        return current_version >= manifest.min_version and (
            manifest.max_version is None or current_version <= manifest.max_version
        )
    
    def mark_applied(self, instance_id: str, update_id: str):
        """Mark update as applied"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO applied_updates (instance_id, update_id, status, applied_at)
            VALUES (?, ?, ?, ?)
        """, (
            instance_id,
            update_id,
            UpdateStatus.APPLIED.value,
            datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def mark_failed(self, instance_id: str, update_id: str, error: str):
        """Mark update as failed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO applied_updates (instance_id, update_id, status, error_message)
            VALUES (?, ?, ?, ?)
        """, (
            instance_id,
            update_id,
            UpdateStatus.FAILED.value,
            error
        ))
        
        conn.commit()
        conn.close()


class UpdateApplier:
    """Apply updates with rollback capability"""
    
    def __init__(self, registry: UpdateRegistry, guardian_verifier: Ed25519Verifier):
        self.registry = registry
        self.guardian_verifier = guardian_verifier
    
    def apply_update(
        self,
        instance_id: str,
        manifest: UpdateManifest,
        artifacts_dir: str
    ) -> bool:
        """
        Apply update to instance
        
        Returns True if successful, False otherwise
        """
        # Verify signature
        if not self._verify_manifest(manifest):
            self.registry.mark_failed(
                instance_id,
                manifest.update_id,
                "Signature verification failed"
            )
            return False
        
        # Check dependencies
        if not self._check_dependencies(instance_id, manifest):
            self.registry.mark_failed(
                instance_id,
                manifest.update_id,
                "Dependency check failed"
            )
            return False
        
        # Verify artifact hashes
        if not self._verify_artifacts(manifest, artifacts_dir):
            self.registry.mark_failed(
                instance_id,
                manifest.update_id,
                "Artifact verification failed"
            )
            return False
        
        try:
            # Apply update (implementation depends on section)
            if manifest.section == UpdateSection.WORKERS:
                self._apply_worker_update(manifest, artifacts_dir)
            elif manifest.section == UpdateSection.ORCHESTRATION:
                self._apply_orchestration_update(manifest, artifacts_dir)
            # ... other sections
            
            # Mark as applied
            self.registry.mark_applied(instance_id, manifest.update_id)
            return True
            
        except Exception as e:
            self.registry.mark_failed(instance_id, manifest.update_id, str(e))
            return False
    
    def _verify_manifest(self, manifest: UpdateManifest) -> bool:
        """Verify manifest signature"""
        return self.guardian_verifier.verify_base64(
            manifest.canonical_payload().encode('utf-8'),
            manifest.signature
        )
    
    def _check_dependencies(self, instance_id: str, manifest: UpdateManifest) -> bool:
        """Check that all dependencies are satisfied"""
        # Query applied updates for this instance
        # Check that all manifest.dependencies are in applied_updates
        # Simplified for now
        return True
    
    def _verify_artifacts(self, manifest: UpdateManifest, artifacts_dir: str) -> bool:
        """Verify artifact hashes match manifest"""
        for filename, expected_hash in manifest.artifacts.items():
            artifact_path = os.path.join(artifacts_dir, filename)
            
            if not os.path.exists(artifact_path):
                return False
            
            with open(artifact_path, 'rb') as f:
                actual_hash = sha256_hash(f.read())
            
            if actual_hash != expected_hash:
                return False
        
        return True
    
    def _apply_worker_update(self, manifest: UpdateManifest, artifacts_dir: str):
        """Apply worker update"""
        # Install new worker code, update registry, etc
        pass
    
    def _apply_orchestration_update(self, manifest: UpdateManifest, artifacts_dir: str):
        """Apply orchestration update"""
        # Update routing rules, caching policies, etc
        pass
    
    def rollback(self, instance_id: str, update_id: str) -> bool:
        """Rollback an applied update"""
        # Get update manifest
        # Load rollback_manifest
        # Apply rollback
        # Mark as rolled back
        return True


# Example usage
if __name__ == "__main__":
    from canonical_signing import Ed25519Signer
    
    # Setup
    guardian_signer = Ed25519Signer.generate()
    registry = UpdateRegistry("updates.db")
    
    # Create update manifest
    manifest = UpdateManifest(
        update_id="update_orchestration_v2.1.0",
        version="2.1.0",
        section=UpdateSection.ORCHESTRATION,
        channel=UpdateChannel.STABLE,
        title="Improved routing performance",
        description="Optimized reflection routing with new caching layer",
        changes=[
            "Added Redis caching for routing decisions",
            "Reduced Claude API calls by 40%",
            "Improved latency by 200ms"
        ],
        artifacts={
            "orchestrator.py": "a1b2c3d4e5f6...",
            "routing_cache.py": "f6e5d4c3b2a1..."
        },
        dependencies=[],
        conflicts=["update_orchestration_v2.0.x"],
        min_version="2.0.0",
        max_version=None,
        rollback_manifest="update_orchestration_v2.0.5",
        issued_at=datetime.utcnow(),
        issued_by="guardian"
    )
    
    # Sign manifest
    manifest.signature = guardian_signer.sign_base64(
        manifest.canonical_payload().encode('utf-8')
    )
    
    # Register update
    registry.register_update(manifest)
    print(f"Registered update: {manifest.update_id}")
    
    # Check available updates
    available = registry.get_available_updates(
        instance_id="instance-123",
        current_version="2.0.5",
        channel=UpdateChannel.STABLE
    )
    
    print(f"Available updates: {len(available)}")
    for update in available:
        print(f"  - {update.title} ({update.version})")
