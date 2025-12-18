"""
Export & Import

Export user data with semantic meaning preserved.
Import data from exports or migrate from other systems.

Key principles:
- Export must be complete (all user data)
- Export must be readable (human-readable formats)
- Export must be portable (no platform-specific IDs)
- Export must be re-importable (round-trip integrity)
- Export is a constitutional right (always available)

Formats:
- JSON: Semantic JSON (recommended for import)
- Markdown: Human-readable for personal use
- CSV: For analytics/spreadsheet use

Usage:
    from mirror_storage.export import SemanticExporter, SemanticImporter

    exporter = SemanticExporter(storage)
    data = await exporter.export_json(user_id)
    await exporter.export_markdown(user_id, path="~/mirror-export/")
    await exporter.export_csv(user_id, path="~/mirror-export.csv")

    importer = SemanticImporter(storage)
    await importer.import_json(data)
"""

from .exporter import SemanticExporter, ExportFormat
from .importer import SemanticImporter, ImportResult

__all__ = [
    "SemanticExporter",
    "ExportFormat",
    "SemanticImporter",
    "ImportResult",
]
