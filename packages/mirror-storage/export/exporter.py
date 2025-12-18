"""
Semantic Exporter

Export user data with semantic meaning preserved.
Multiple formats supported for different use cases.
"""

import json
import csv
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass
import hashlib

from ..base import MirrorStorage, Reflection, Pattern, Tension, AuditEvent


class ExportFormat(Enum):
    """Supported export formats."""
    JSON = "json"          # Full semantic export (recommended)
    MARKDOWN = "markdown"  # Human-readable
    CSV = "csv"            # Analytics-friendly


@dataclass
class ExportMetadata:
    """Metadata for an export."""
    export_id: str
    export_date: datetime
    format: ExportFormat
    user_id: str
    version: str = "1.0.0"

    # Statistics
    reflection_count: int = 0
    pattern_count: int = 0
    tension_count: int = 0
    audit_event_count: int = 0

    # Integrity
    content_hash: str = ""

    def to_dict(self) -> dict:
        return {
            "export_id": self.export_id,
            "export_date": self.export_date.isoformat(),
            "format": self.format.value,
            "user_id": self.user_id,
            "version": self.version,
            "statistics": {
                "reflections": self.reflection_count,
                "patterns": self.pattern_count,
                "tensions": self.tension_count,
                "audit_events": self.audit_event_count,
            },
            "content_hash": self.content_hash,
        }


class SemanticExporter:
    """
    Export user data with semantic meaning preserved.

    Constitutional requirement: Users must be able to export
    all their data at any time, in a portable format.

    Usage:
        exporter = SemanticExporter(storage)

        # JSON export (recommended for import)
        json_data = await exporter.export_json(user_id)

        # Write to file
        await exporter.export_to_file(user_id, "export.json", ExportFormat.JSON)

        # Markdown export (human-readable)
        md_content = await exporter.export_markdown(user_id)

        # CSV export (analytics)
        csv_data = await exporter.export_csv(user_id)
    """

    VERSION = "1.0.0"

    def __init__(self, storage: MirrorStorage):
        self.storage = storage

    async def export_json(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data as semantic JSON.

        This is the recommended format for:
        - Backup and restore
        - Migration to another Mirror instance
        - Long-term archival

        The export includes:
        - All reflections with content and responses
        - All detected patterns
        - All detected tensions
        - Complete audit trail
        - Export metadata for verification
        """
        # Gather all data
        reflections = await self.storage.get_reflections(user_id, limit=100000)
        patterns = await self.storage.get_patterns(user_id)
        tensions = await self.storage.get_tensions(user_id)
        audit_trail = await self.storage.get_audit_trail(user_id, limit=100000)

        # Build export data
        export_data = {
            "reflections": [r.to_dict() for r in reflections],
            "patterns": [p.to_dict() for p in patterns],
            "tensions": [t.to_dict() for t in tensions],
            "audit_trail": [a.to_dict() for a in audit_trail],
        }

        # Compute content hash
        content_str = json.dumps(export_data, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        # Build metadata
        export_id = hashlib.sha256(
            f"{user_id}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        metadata = ExportMetadata(
            export_id=export_id,
            export_date=datetime.utcnow(),
            format=ExportFormat.JSON,
            user_id=user_id,
            version=self.VERSION,
            reflection_count=len(reflections),
            pattern_count=len(patterns),
            tension_count=len(tensions),
            audit_event_count=len(audit_trail),
            content_hash=content_hash,
        )

        return {
            "metadata": metadata.to_dict(),
            "data": export_data,
        }

    async def export_markdown(self, user_id: str) -> str:
        """
        Export as human-readable Markdown.

        Great for:
        - Personal review of reflections
        - Printing for offline reading
        - Sharing specific insights (after review)
        """
        reflections = await self.storage.get_reflections(user_id, limit=100000)
        patterns = await self.storage.get_patterns(user_id)
        tensions = await self.storage.get_tensions(user_id)

        lines = [
            "# Mirror Export",
            f"",
            f"**User:** {user_id}",
            f"**Exported:** {datetime.utcnow().isoformat()}",
            f"**Reflections:** {len(reflections)}",
            f"**Patterns:** {len(patterns)}",
            f"**Tensions:** {len(tensions)}",
            "",
            "---",
            "",
        ]

        # Reflections section
        lines.append("## Reflections")
        lines.append("")

        for r in sorted(reflections, key=lambda x: x.created_at, reverse=True):
            date_str = r.created_at.strftime("%Y-%m-%d %H:%M")
            lines.append(f"### {date_str}")
            lines.append("")
            lines.append(f"**Mode:** {r.mode}")
            lines.append("")
            lines.append("**You wrote:**")
            lines.append(f"> {r.content}")
            lines.append("")

            if r.response:
                lines.append("**Mirror reflected:**")
                lines.append(f"> {r.response}")
                lines.append("")

            lines.append("---")
            lines.append("")

        # Patterns section
        if patterns:
            lines.append("## Observed Patterns")
            lines.append("")
            lines.append("These are themes that appeared in your reflections.")
            lines.append("")

            for p in sorted(patterns, key=lambda x: x.occurrences, reverse=True):
                lines.append(f"### {p.name}")
                lines.append("")
                lines.append(f"- **Type:** {p.pattern_type}")
                lines.append(f"- **Occurrences:** {p.occurrences}")
                lines.append(f"- **Confidence:** {p.confidence:.0%}")
                lines.append(f"- **First seen:** {p.first_seen.strftime('%Y-%m-%d')}")
                lines.append(f"- **Last seen:** {p.last_seen.strftime('%Y-%m-%d')}")
                lines.append("")

        # Tensions section
        if tensions:
            lines.append("## Observed Tensions")
            lines.append("")
            lines.append("These are contradictions or conflicts noticed in your reflections.")
            lines.append("")

            for t in tensions:
                lines.append(f"### {t.tension_type}")
                lines.append("")
                lines.append(f"> {t.description}")
                lines.append("")
                lines.append(f"- **Intensity:** {t.severity:.0%}")
                lines.append(f"- **First detected:** {t.first_detected.strftime('%Y-%m-%d')}")
                lines.append("")

        return "\n".join(lines)

    async def export_csv(self, user_id: str) -> Dict[str, str]:
        """
        Export as CSV files (one per data type).

        Great for:
        - Analysis in spreadsheet software
        - Data science / visualization
        - Integration with other tools

        Returns dict mapping filename to CSV content.
        """
        reflections = await self.storage.get_reflections(user_id, limit=100000)
        patterns = await self.storage.get_patterns(user_id)
        tensions = await self.storage.get_tensions(user_id)

        result = {}

        # Reflections CSV
        if reflections:
            lines = ["id,created_at,mode,content,response"]
            for r in reflections:
                content = r.content.replace('"', '""')
                response = (r.response or "").replace('"', '""')
                lines.append(
                    f'"{r.id}","{r.created_at.isoformat()}","{r.mode}",'
                    f'"{content}","{response}"'
                )
            result["reflections.csv"] = "\n".join(lines)

        # Patterns CSV
        if patterns:
            lines = ["id,type,name,occurrences,confidence,first_seen,last_seen"]
            for p in patterns:
                lines.append(
                    f'"{p.id}","{p.pattern_type}","{p.name}",'
                    f'{p.occurrences},{p.confidence:.4f},'
                    f'"{p.first_seen.isoformat()}","{p.last_seen.isoformat()}"'
                )
            result["patterns.csv"] = "\n".join(lines)

        # Tensions CSV
        if tensions:
            lines = ["id,type,description,severity,first_detected,last_detected"]
            for t in tensions:
                desc = t.description.replace('"', '""')
                lines.append(
                    f'"{t.id}","{t.tension_type}","{desc}",'
                    f'{t.severity:.4f},'
                    f'"{t.first_detected.isoformat()}","{t.last_detected.isoformat()}"'
                )
            result["tensions.csv"] = "\n".join(lines)

        return result

    async def export_to_file(
        self,
        user_id: str,
        path: str,
        format: ExportFormat = ExportFormat.JSON
    ) -> str:
        """
        Export directly to a file.

        Args:
            user_id: User to export
            path: Output file path
            format: Export format

        Returns:
            Path to the created file
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        if format == ExportFormat.JSON:
            data = await self.export_json(user_id)
            content = json.dumps(data, indent=2, ensure_ascii=False)
            path.write_text(content, encoding="utf-8")

        elif format == ExportFormat.MARKDOWN:
            content = await self.export_markdown(user_id)
            path.write_text(content, encoding="utf-8")

        elif format == ExportFormat.CSV:
            csv_data = await self.export_csv(user_id)
            # For CSV, create a directory with multiple files
            csv_dir = path.parent / path.stem
            csv_dir.mkdir(exist_ok=True)
            for filename, content in csv_data.items():
                (csv_dir / filename).write_text(content, encoding="utf-8")
            return str(csv_dir)

        return str(path)

    async def create_attestation(self, user_id: str) -> Dict[str, Any]:
        """
        Create a cryptographic attestation of the export.

        This proves what data existed at a specific point in time.
        Useful for legal/compliance purposes.
        """
        json_export = await self.export_json(user_id)

        # Compute Merkle root of all data
        reflections_hash = hashlib.sha256(
            json.dumps(json_export["data"]["reflections"], sort_keys=True).encode()
        ).hexdigest()
        patterns_hash = hashlib.sha256(
            json.dumps(json_export["data"]["patterns"], sort_keys=True).encode()
        ).hexdigest()
        tensions_hash = hashlib.sha256(
            json.dumps(json_export["data"]["tensions"], sort_keys=True).encode()
        ).hexdigest()
        audit_hash = hashlib.sha256(
            json.dumps(json_export["data"]["audit_trail"], sort_keys=True).encode()
        ).hexdigest()

        # Combine into Merkle root
        combined = f"{reflections_hash}{patterns_hash}{tensions_hash}{audit_hash}"
        merkle_root = hashlib.sha256(combined.encode()).hexdigest()

        return {
            "attestation_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "merkle_root": merkle_root,
            "component_hashes": {
                "reflections": reflections_hash,
                "patterns": patterns_hash,
                "tensions": tensions_hash,
                "audit_trail": audit_hash,
            },
            "statistics": json_export["metadata"]["statistics"],
            "version": self.VERSION,
        }
