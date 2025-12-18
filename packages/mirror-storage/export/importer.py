"""
Semantic Importer

Import user data from exports or migrate from other systems.
Preserves semantic meaning during import.
"""

import json
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field

from ..base import (
    MirrorStorage,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    StorageError,
    IntegrityError,
)


@dataclass
class ImportResult:
    """Result of an import operation."""
    success: bool
    started_at: datetime
    completed_at: Optional[datetime] = None

    # Statistics
    reflections_imported: int = 0
    patterns_imported: int = 0
    tensions_imported: int = 0
    audit_events_imported: int = 0

    # Skipped (already exist)
    reflections_skipped: int = 0
    patterns_skipped: int = 0
    tensions_skipped: int = 0

    # Errors
    errors: List[str] = field(default_factory=list)

    # Integrity
    expected_hash: Optional[str] = None
    actual_hash: Optional[str] = None
    integrity_verified: bool = False

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "imported": {
                "reflections": self.reflections_imported,
                "patterns": self.patterns_imported,
                "tensions": self.tensions_imported,
                "audit_events": self.audit_events_imported,
            },
            "skipped": {
                "reflections": self.reflections_skipped,
                "patterns": self.patterns_skipped,
                "tensions": self.tensions_skipped,
            },
            "errors": self.errors,
            "integrity_verified": self.integrity_verified,
        }


class SemanticImporter:
    """
    Import user data from exports.

    Supports:
    - Importing from Mirror JSON exports
    - Merging with existing data (no duplicates)
    - Integrity verification
    - Partial imports (specific data types)

    Usage:
        importer = SemanticImporter(storage)

        # Import from JSON export
        result = await importer.import_json(export_data)

        # Import from file
        result = await importer.import_from_file("export.json")

        # Import only reflections
        result = await importer.import_json(export_data, import_patterns=False)

        # Verify integrity before import
        if await importer.verify_export(export_data):
            result = await importer.import_json(export_data)
    """

    def __init__(self, storage: MirrorStorage):
        self.storage = storage

    async def verify_export(self, export_data: Dict[str, Any]) -> bool:
        """
        Verify the integrity of an export before importing.

        Checks:
        - Content hash matches
        - Data structure is valid
        - Required fields are present
        """
        try:
            metadata = export_data.get("metadata", {})
            data = export_data.get("data", {})

            # Verify required fields
            if not metadata or not data:
                return False

            # Verify content hash
            expected_hash = metadata.get("content_hash")
            if expected_hash:
                content_str = json.dumps(data, sort_keys=True)
                actual_hash = hashlib.sha256(content_str.encode()).hexdigest()
                if expected_hash != actual_hash:
                    return False

            # Verify data structure
            for key in ["reflections", "patterns", "tensions"]:
                if key not in data:
                    return False
                if not isinstance(data[key], list):
                    return False

            return True

        except Exception:
            return False

    async def import_json(
        self,
        export_data: Dict[str, Any],
        import_reflections: bool = True,
        import_patterns: bool = True,
        import_tensions: bool = True,
        import_audit: bool = True,
        skip_existing: bool = True,
        verify_integrity: bool = True
    ) -> ImportResult:
        """
        Import from a JSON export.

        Args:
            export_data: Export data dictionary
            import_reflections: Whether to import reflections
            import_patterns: Whether to import patterns
            import_tensions: Whether to import tensions
            import_audit: Whether to import audit trail
            skip_existing: Skip records that already exist
            verify_integrity: Verify content hash before import
        """
        result = ImportResult(
            success=True,
            started_at=datetime.utcnow()
        )

        try:
            # Verify integrity if requested
            if verify_integrity:
                is_valid = await self.verify_export(export_data)
                result.integrity_verified = is_valid
                if not is_valid:
                    result.success = False
                    result.errors.append("Export integrity verification failed")
                    return result

                # Store hash info
                metadata = export_data.get("metadata", {})
                result.expected_hash = metadata.get("content_hash")

            data = export_data.get("data", {})

            # Import reflections
            if import_reflections:
                imported, skipped, errors = await self._import_reflections(
                    data.get("reflections", []),
                    skip_existing
                )
                result.reflections_imported = imported
                result.reflections_skipped = skipped
                result.errors.extend(errors)

            # Import patterns
            if import_patterns:
                imported, skipped, errors = await self._import_patterns(
                    data.get("patterns", []),
                    skip_existing
                )
                result.patterns_imported = imported
                result.patterns_skipped = skipped
                result.errors.extend(errors)

            # Import tensions
            if import_tensions:
                imported, skipped, errors = await self._import_tensions(
                    data.get("tensions", []),
                    skip_existing
                )
                result.tensions_imported = imported
                result.tensions_skipped = skipped
                result.errors.extend(errors)

            # Import audit trail
            if import_audit:
                imported, errors = await self._import_audit(
                    data.get("audit_trail", [])
                )
                result.audit_events_imported = imported
                result.errors.extend(errors)

        except Exception as e:
            result.success = False
            result.errors.append(f"Import failed: {str(e)}")

        result.completed_at = datetime.utcnow()
        return result

    async def _import_reflections(
        self,
        reflections_data: List[Dict],
        skip_existing: bool
    ) -> tuple:
        """Import reflections, returns (imported, skipped, errors)."""
        imported = 0
        skipped = 0
        errors = []

        for data in reflections_data:
            try:
                reflection = Reflection.from_dict(data)

                if skip_existing:
                    existing = await self.storage.get_reflection(reflection.id)
                    if existing:
                        skipped += 1
                        continue

                await self.storage.save_reflection(reflection)
                imported += 1

            except Exception as e:
                errors.append(f"Failed to import reflection {data.get('id', 'unknown')}: {e}")

        return imported, skipped, errors

    async def _import_patterns(
        self,
        patterns_data: List[Dict],
        skip_existing: bool
    ) -> tuple:
        """Import patterns, returns (imported, skipped, errors)."""
        imported = 0
        skipped = 0
        errors = []

        # Get existing patterns for skip check
        existing_patterns = {}
        if skip_existing:
            try:
                user_id = patterns_data[0]["user_id"] if patterns_data else ""
                if user_id:
                    patterns = await self.storage.get_patterns(user_id)
                    existing_patterns = {p.id: p for p in patterns}
            except Exception:
                pass

        for data in patterns_data:
            try:
                pattern = Pattern.from_dict(data)

                if skip_existing and pattern.id in existing_patterns:
                    skipped += 1
                    continue

                await self.storage.save_pattern(pattern)
                imported += 1

            except Exception as e:
                errors.append(f"Failed to import pattern {data.get('id', 'unknown')}: {e}")

        return imported, skipped, errors

    async def _import_tensions(
        self,
        tensions_data: List[Dict],
        skip_existing: bool
    ) -> tuple:
        """Import tensions, returns (imported, skipped, errors)."""
        imported = 0
        skipped = 0
        errors = []

        # Get existing tensions for skip check
        existing_tensions = {}
        if skip_existing:
            try:
                user_id = tensions_data[0]["user_id"] if tensions_data else ""
                if user_id:
                    tensions = await self.storage.get_tensions(user_id)
                    existing_tensions = {t.id: t for t in tensions}
            except Exception:
                pass

        for data in tensions_data:
            try:
                tension = Tension.from_dict(data)

                if skip_existing and tension.id in existing_tensions:
                    skipped += 1
                    continue

                await self.storage.save_tension(tension)
                imported += 1

            except Exception as e:
                errors.append(f"Failed to import tension {data.get('id', 'unknown')}: {e}")

        return imported, skipped, errors

    async def _import_audit(
        self,
        audit_data: List[Dict]
    ) -> tuple:
        """Import audit trail (never skips - append only)."""
        imported = 0
        errors = []

        # Get existing audit IDs
        existing_ids = set()
        if audit_data:
            try:
                user_id = audit_data[0]["user_id"]
                events = await self.storage.get_audit_trail(user_id, limit=100000)
                existing_ids = {e.id for e in events}
            except Exception:
                pass

        for data in audit_data:
            try:
                event = AuditEvent.from_dict(data)

                # Skip if already exists (audit is append-only)
                if event.id in existing_ids:
                    continue

                await self.storage.append_audit_event(event)
                imported += 1

            except Exception as e:
                errors.append(f"Failed to import audit event {data.get('id', 'unknown')}: {e}")

        return imported, errors

    async def import_from_file(
        self,
        path: str,
        **kwargs
    ) -> ImportResult:
        """
        Import from a JSON export file.

        Args:
            path: Path to the export file
            **kwargs: Arguments passed to import_json
        """
        try:
            with open(path, "r", encoding="utf-8") as f:
                export_data = json.load(f)
            return await self.import_json(export_data, **kwargs)
        except json.JSONDecodeError as e:
            result = ImportResult(
                success=False,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            result.errors.append(f"Invalid JSON file: {e}")
            return result
        except FileNotFoundError:
            result = ImportResult(
                success=False,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            result.errors.append(f"File not found: {path}")
            return result
