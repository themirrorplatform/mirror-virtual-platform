"""
Constitution Versioning

Tracks constitutional changes with full history.
Every change to the constitution creates a new version.

Key properties:
1. Immutable history - versions cannot be modified
2. Full provenance - every change linked to proposal
3. Semantic versioning - major/minor/patch
4. Diff capability - see what changed between versions
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from datetime import datetime
import hashlib
import json
import copy


@dataclass
class ConstitutionVersion:
    """A specific version of the constitution."""
    version: str  # Semantic version (e.g., "1.2.3")
    content: Dict[str, Any]  # Full constitution content
    content_hash: str  # SHA-256 hash of content
    created_at: datetime

    # Provenance
    parent_version: Optional[str] = None
    proposal_id: Optional[str] = None  # What proposal created this
    change_summary: str = ""

    # Metadata
    is_genesis: bool = False  # First version
    is_current: bool = False  # Currently active version

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "content_hash": self.content_hash,
            "created_at": self.created_at.isoformat(),
            "parent_version": self.parent_version,
            "proposal_id": self.proposal_id,
            "change_summary": self.change_summary,
            "is_genesis": self.is_genesis,
            "is_current": self.is_current,
        }


@dataclass
class VersionDiff:
    """Difference between two constitution versions."""
    from_version: str
    to_version: str
    added: Dict[str, Any] = field(default_factory=dict)
    removed: Dict[str, Any] = field(default_factory=dict)
    modified: Dict[str, dict] = field(default_factory=dict)  # {path: {old, new}}

    def to_dict(self) -> dict:
        return {
            "from_version": self.from_version,
            "to_version": self.to_version,
            "added": self.added,
            "removed": self.removed,
            "modified": self.modified,
        }


class VersionManager:
    """
    Manages constitution versions.

    Provides:
    - Version creation and tracking
    - History traversal
    - Diff generation
    - Rollback support

    Usage:
        manager = VersionManager()

        # Create genesis version
        v1 = manager.create_genesis(constitution_content)

        # Create new version from proposal
        v2 = manager.create_version(
            content=updated_content,
            proposal_id="prop_123",
            change_summary="Added new invariant"
        )

        # Compare versions
        diff = manager.diff("1.0.0", "1.1.0")

        # Get history
        history = manager.get_history()
    """

    def __init__(self):
        self._versions: Dict[str, ConstitutionVersion] = {}
        self._version_order: List[str] = []  # Ordered list of versions
        self._current_version: Optional[str] = None

    @staticmethod
    def compute_hash(content: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of constitution content."""
        content_str = json.dumps(content, sort_keys=True)
        return hashlib.sha256(content_str.encode()).hexdigest()

    def create_genesis(
        self,
        content: Dict[str, Any],
        version: str = "1.0.0"
    ) -> ConstitutionVersion:
        """
        Create the genesis (first) version of the constitution.

        The genesis version has no parent and cannot be rolled back past.
        """
        if self._versions:
            raise ValueError("Genesis version already exists")

        content_hash = self.compute_hash(content)

        genesis = ConstitutionVersion(
            version=version,
            content=copy.deepcopy(content),
            content_hash=content_hash,
            created_at=datetime.utcnow(),
            parent_version=None,
            is_genesis=True,
            is_current=True,
            change_summary="Genesis constitution",
        )

        self._versions[version] = genesis
        self._version_order.append(version)
        self._current_version = version

        return genesis

    def create_version(
        self,
        content: Dict[str, Any],
        proposal_id: str,
        change_summary: str,
        version: str = None,
        version_bump: str = "minor"
    ) -> ConstitutionVersion:
        """
        Create a new constitution version.

        Args:
            content: New constitution content
            proposal_id: ID of the proposal that created this version
            change_summary: Human-readable summary of changes
            version: Explicit version string (auto-generated if not provided)
            version_bump: Type of bump if auto-generating ("major", "minor", "patch")
        """
        if not self._current_version:
            raise ValueError("No current version - create genesis first")

        parent = self._versions[self._current_version]

        # Auto-generate version number
        if version is None:
            version = self._bump_version(parent.version, version_bump)

        # Ensure version doesn't already exist
        if version in self._versions:
            raise ValueError(f"Version {version} already exists")

        content_hash = self.compute_hash(content)

        # Mark old version as not current
        parent.is_current = False

        new_version = ConstitutionVersion(
            version=version,
            content=copy.deepcopy(content),
            content_hash=content_hash,
            created_at=datetime.utcnow(),
            parent_version=parent.version,
            proposal_id=proposal_id,
            change_summary=change_summary,
            is_current=True,
        )

        self._versions[version] = new_version
        self._version_order.append(version)
        self._current_version = version

        return new_version

    def _bump_version(self, current: str, bump_type: str) -> str:
        """Bump semantic version."""
        parts = current.split(".")
        if len(parts) != 3:
            # Default to appending .1
            return f"{current}.1"

        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])

        if bump_type == "major":
            return f"{major + 1}.0.0"
        elif bump_type == "minor":
            return f"{major}.{minor + 1}.0"
        else:  # patch
            return f"{major}.{minor}.{patch + 1}"

    def get_version(self, version: str) -> Optional[ConstitutionVersion]:
        """Get a specific version."""
        return self._versions.get(version)

    def get_current(self) -> Optional[ConstitutionVersion]:
        """Get the current version."""
        if self._current_version:
            return self._versions.get(self._current_version)
        return None

    def get_history(self, limit: int = None) -> List[ConstitutionVersion]:
        """Get version history (most recent first)."""
        versions = [self._versions[v] for v in reversed(self._version_order)]
        if limit:
            return versions[:limit]
        return versions

    def get_lineage(self, version: str) -> List[ConstitutionVersion]:
        """Get the full lineage from genesis to a specific version."""
        lineage = []
        current = self._versions.get(version)

        while current:
            lineage.append(current)
            if current.parent_version:
                current = self._versions.get(current.parent_version)
            else:
                break

        return list(reversed(lineage))

    def diff(self, from_version: str, to_version: str) -> VersionDiff:
        """
        Generate diff between two versions.

        Shows what was added, removed, and modified.
        """
        from_v = self._versions.get(from_version)
        to_v = self._versions.get(to_version)

        if not from_v:
            raise ValueError(f"Version not found: {from_version}")
        if not to_v:
            raise ValueError(f"Version not found: {to_version}")

        diff = VersionDiff(
            from_version=from_version,
            to_version=to_version,
        )

        # Find differences
        self._diff_dicts(from_v.content, to_v.content, "", diff)

        return diff

    def _diff_dicts(
        self,
        old: Dict,
        new: Dict,
        path: str,
        diff: VersionDiff
    ):
        """Recursively diff two dictionaries."""
        old_keys = set(old.keys())
        new_keys = set(new.keys())

        # Added keys
        for key in new_keys - old_keys:
            full_path = f"{path}.{key}" if path else key
            diff.added[full_path] = new[key]

        # Removed keys
        for key in old_keys - new_keys:
            full_path = f"{path}.{key}" if path else key
            diff.removed[full_path] = old[key]

        # Check for modifications
        for key in old_keys & new_keys:
            full_path = f"{path}.{key}" if path else key
            old_val = old[key]
            new_val = new[key]

            if isinstance(old_val, dict) and isinstance(new_val, dict):
                self._diff_dicts(old_val, new_val, full_path, diff)
            elif old_val != new_val:
                diff.modified[full_path] = {
                    "old": old_val,
                    "new": new_val,
                }

    def verify_integrity(self, version: str) -> bool:
        """Verify the integrity of a version by recomputing its hash."""
        v = self._versions.get(version)
        if not v:
            return False

        computed = self.compute_hash(v.content)
        return computed == v.content_hash

    def verify_chain(self) -> List[str]:
        """
        Verify the entire version chain.

        Returns list of versions with integrity issues.
        """
        issues = []

        for version_str in self._version_order:
            if not self.verify_integrity(version_str):
                issues.append(version_str)

        return issues

    def rollback_to(self, version: str) -> ConstitutionVersion:
        """
        Rollback to a previous version.

        This creates a NEW version that contains the content of the old version.
        History is preserved - we don't actually delete versions.
        """
        target = self._versions.get(version)
        if not target:
            raise ValueError(f"Version not found: {version}")

        # Create a new version with the old content
        rollback_version = self.create_version(
            content=copy.deepcopy(target.content),
            proposal_id=f"rollback_to_{version}",
            change_summary=f"Rollback to version {version}",
            version_bump="patch",
        )

        return rollback_version

    def export_version(self, version: str) -> Dict[str, Any]:
        """Export a version for backup or transfer."""
        v = self._versions.get(version)
        if not v:
            raise ValueError(f"Version not found: {version}")

        return {
            "metadata": v.to_dict(),
            "content": v.content,
        }

    def import_version(self, data: Dict[str, Any]) -> ConstitutionVersion:
        """Import a previously exported version."""
        metadata = data.get("metadata", {})
        content = data.get("content", {})

        version_str = metadata.get("version")
        if not version_str:
            raise ValueError("No version in export data")

        if version_str in self._versions:
            raise ValueError(f"Version {version_str} already exists")

        # Verify hash
        computed_hash = self.compute_hash(content)
        expected_hash = metadata.get("content_hash")
        if expected_hash and computed_hash != expected_hash:
            raise ValueError("Content hash mismatch - data may be corrupted")

        version = ConstitutionVersion(
            version=version_str,
            content=content,
            content_hash=computed_hash,
            created_at=datetime.fromisoformat(metadata["created_at"]),
            parent_version=metadata.get("parent_version"),
            proposal_id=metadata.get("proposal_id"),
            change_summary=metadata.get("change_summary", ""),
            is_genesis=metadata.get("is_genesis", False),
            is_current=False,  # Imported versions are not current by default
        )

        self._versions[version_str] = version
        self._version_order.append(version_str)

        return version
