"""
Mirror OS Export/Import System

Handles data export, import, and backup/restore for data sovereignty.
Users must be able to export their data at any time and import it elsewhere.

Philosophy:
- Data sovereignty: Users own their data completely
- Portability: Export to open formats (JSON, Markdown)
- Privacy: No telemetry or tracking in exports
- Completeness: Export includes all user data (reflections, patterns, tensions)
- Human-readable: Markdown exports for easy reading without tools
"""

import sqlite3
import json
import os
import zipfile
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import shutil


class DataExporter:
    """Exports Mirror OS data to various formats"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def export_to_json(
        self,
        output_path: str,
        identity_id: Optional[str] = None,
        include_metadata: bool = True
    ) -> Dict:
        """
        Export data to JSON format
        
        Args:
            output_path: Path to write JSON file
            identity_id: Export specific identity (None = all)
            include_metadata: Include system metadata
        
        Returns:
            Dict with export statistics
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            export_data = {
                "format": "mirror_os_export_v1",
                "exported_at": datetime.utcnow().isoformat() + 'Z',
                "schema_version": self._get_schema_version(conn)
            }
            
            # Export identities
            identities = self._export_identities(conn, identity_id)
            export_data["identities"] = identities
            
            # For each identity, export their data
            for identity in identities:
                iid = identity["id"]
                
                # Reflections
                identity["reflections"] = self._export_reflections(conn, iid)
                
                # Mirrorbacks
                identity["mirrorbacks"] = self._export_mirrorbacks(conn, iid)
                
                # Patterns
                identity["patterns"] = self._export_patterns(conn, iid)
                
                # Tensions
                identity["tensions"] = self._export_tensions(conn, iid)
                
                # Threads
                identity["threads"] = self._export_threads(conn, iid)
                
                # Settings (if any)
                identity["settings"] = self._export_settings(conn, iid)
            
            # Write to file
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            # Calculate statistics
            stats = {
                "status": "success",
                "output_path": output_path,
                "file_size_bytes": os.path.getsize(output_path),
                "identities_exported": len(identities),
                "total_reflections": sum(len(i.get("reflections", [])) for i in identities),
                "total_mirrorbacks": sum(len(i.get("mirrorbacks", [])) for i in identities),
                "total_patterns": sum(len(i.get("patterns", [])) for i in identities),
                "total_tensions": sum(len(i.get("tensions", [])) for i in identities)
            }
            
            return stats
            
        finally:
            conn.close()
    
    def export_to_markdown(
        self,
        output_dir: str,
        identity_id: Optional[str] = None
    ) -> Dict:
        """
        Export data to human-readable Markdown files
        
        Args:
            output_dir: Directory to write markdown files
            identity_id: Export specific identity (None = all)
        
        Returns:
            Dict with export statistics
        """
        os.makedirs(output_dir, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            identities = self._export_identities(conn, identity_id)
            files_created = []
            
            for identity in identities:
                iid = identity["id"]
                identity_dir = os.path.join(output_dir, f"identity_{iid[:8]}")
                os.makedirs(identity_dir, exist_ok=True)
                
                # Export reflections to markdown
                reflections_file = self._export_reflections_markdown(
                    conn, iid, identity_dir
                )
                files_created.append(reflections_file)
                
                # Export patterns to markdown
                patterns_file = self._export_patterns_markdown(
                    conn, iid, identity_dir
                )
                files_created.append(patterns_file)
                
                # Export tensions to markdown
                tensions_file = self._export_tensions_markdown(
                    conn, iid, identity_dir
                )
                files_created.append(tensions_file)
                
                # Create index file
                index_file = os.path.join(identity_dir, "README.md")
                self._create_index_markdown(conn, iid, index_file)
                files_created.append(index_file)
            
            return {
                "status": "success",
                "output_dir": output_dir,
                "identities_exported": len(identities),
                "files_created": len(files_created),
                "files": files_created
            }
            
        finally:
            conn.close()
    
    def create_backup(
        self,
        backup_path: str,
        include_database: bool = True
    ) -> Dict:
        """
        Create a complete backup archive
        
        Args:
            backup_path: Path to backup zip file
            include_database: Include raw database file
        
        Returns:
            Dict with backup info
        """
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add database file
            if include_database:
                zipf.write(self.db_path, arcname="mirror.db")
            
            # Add JSON export
            json_export = "export.json"
            self.export_to_json(json_export)
            zipf.write(json_export, arcname="export.json")
            os.remove(json_export)
            
            # Add metadata
            metadata = {
                "backup_created_at": datetime.utcnow().isoformat() + 'Z',
                "mirror_os_version": "1.0.0",
                "database_included": include_database
            }
            zipf.writestr("backup_metadata.json", json.dumps(metadata, indent=2))
        
        return {
            "status": "success",
            "backup_path": backup_path,
            "file_size_bytes": os.path.getsize(backup_path),
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
    
    # Helper methods for data extraction
    
    def _get_schema_version(self, conn: sqlite3.Connection) -> int:
        """Get current schema version"""
        try:
            cursor = conn.execute("""
                SELECT MAX(version) FROM schema_migrations 
                WHERE rolled_back = 0
            """)
            result = cursor.fetchone()[0]
            return result if result is not None else 1
        except sqlite3.OperationalError:
            return 1
    
    def _export_identities(
        self,
        conn: sqlite3.Connection,
        identity_id: Optional[str]
    ) -> List[Dict]:
        """Export identity records"""
        if identity_id:
            cursor = conn.execute(
                "SELECT * FROM identities WHERE id = ?",
                (identity_id,)
            )
        else:
            cursor = conn.execute("SELECT * FROM identities")
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _export_reflections(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> List[Dict]:
        """Export reflections for an identity"""
        cursor = conn.execute("""
            SELECT * FROM reflections 
            WHERE identity_id = ? 
            ORDER BY created_at DESC
        """, (identity_id,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _export_mirrorbacks(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> List[Dict]:
        """Export mirrorbacks for an identity"""
        cursor = conn.execute("""
            SELECT m.* FROM mirrorbacks m
            JOIN reflections r ON m.reflection_id = r.id
            WHERE r.identity_id = ?
            ORDER BY m.created_at DESC
        """, (identity_id,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _export_patterns(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> List[Dict]:
        """Export patterns for an identity"""
        cursor = conn.execute("""
            SELECT DISTINCT p.* FROM patterns p
            JOIN pattern_occurrences po ON p.id = po.pattern_id
            JOIN reflections r ON po.reflection_id = r.id
            WHERE r.identity_id = ?
        """, (identity_id,))
        
        patterns = [dict(row) for row in cursor.fetchall()]
        
        # Add occurrences to each pattern
        for pattern in patterns:
            cursor = conn.execute("""
                SELECT po.* FROM pattern_occurrences po
                JOIN reflections r ON po.reflection_id = r.id
                WHERE po.pattern_id = ? AND r.identity_id = ?
                ORDER BY po.detected_at DESC
            """, (pattern["id"], identity_id))
            pattern["occurrences"] = [dict(row) for row in cursor.fetchall()]
        
        return patterns
    
    def _export_tensions(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> List[Dict]:
        """Export tensions for an identity"""
        cursor = conn.execute("""
            SELECT t.* FROM tensions t
            JOIN reflections r ON t.reflection_id = r.id
            WHERE r.identity_id = ?
            ORDER BY t.detected_at DESC
        """, (identity_id,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _export_threads(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> List[Dict]:
        """Export threads for an identity"""
        cursor = conn.execute("""
            SELECT * FROM threads 
            WHERE identity_id = ?
            ORDER BY created_at DESC
        """, (identity_id,))
        
        threads = [dict(row) for row in cursor.fetchall()]
        
        # Add reflections to each thread
        for thread in threads:
            cursor = conn.execute("""
                SELECT reflection_id FROM thread_reflections 
                WHERE thread_id = ?
                ORDER BY added_at
            """, (thread["id"],))
            thread["reflection_ids"] = [row[0] for row in cursor.fetchall()]
        
        return threads
    
    def _export_settings(
        self,
        conn: sqlite3.Connection,
        identity_id: str
    ) -> Dict:
        """Export settings for an identity"""
        cursor = conn.execute("""
            SELECT key, value FROM settings 
            WHERE identity_id = ?
        """, (identity_id,))
        
        return {row[0]: row[1] for row in cursor.fetchall()}
    
    def _export_reflections_markdown(
        self,
        conn: sqlite3.Connection,
        identity_id: str,
        output_dir: str
    ) -> str:
        """Export reflections to markdown file"""
        reflections = self._export_reflections(conn, identity_id)
        
        output_file = os.path.join(output_dir, "reflections.md")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Reflections\n\n")
            f.write(f"Total reflections: {len(reflections)}\n\n")
            f.write("---\n\n")
            
            for i, reflection in enumerate(reflections, 1):
                f.write(f"## Reflection {i}\n\n")
                f.write(f"**Date**: {reflection['created_at']}\n\n")
                if reflection.get('tags'):
                    f.write(f"**Tags**: {reflection['tags']}\n\n")
                f.write(f"{reflection['content']}\n\n")
                
                # Get mirrorback if exists
                cursor = conn.execute("""
                    SELECT content FROM mirrorbacks 
                    WHERE reflection_id = ?
                """, (reflection['id'],))
                mirrorback = cursor.fetchone()
                
                if mirrorback:
                    f.write("### Mirrorback\n\n")
                    f.write(f"> {mirrorback[0]}\n\n")
                
                f.write("---\n\n")
        
        return output_file
    
    def _export_patterns_markdown(
        self,
        conn: sqlite3.Connection,
        identity_id: str,
        output_dir: str
    ) -> str:
        """Export patterns to markdown file"""
        patterns = self._export_patterns(conn, identity_id)
        
        output_file = os.path.join(output_dir, "patterns.md")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Patterns\n\n")
            f.write(f"Discovered patterns: {len(patterns)}\n\n")
            f.write("---\n\n")
            
            for pattern in patterns:
                f.write(f"## {pattern['name']}\n\n")
                f.write(f"{pattern['description']}\n\n")
                f.write(f"**Occurrences**: {len(pattern.get('occurrences', []))}\n\n")
                f.write(f"**First detected**: {pattern['first_detected']}\n\n")
                f.write(f"**Last detected**: {pattern['last_detected']}\n\n")
                f.write("---\n\n")
        
        return output_file
    
    def _export_tensions_markdown(
        self,
        conn: sqlite3.Connection,
        identity_id: str,
        output_dir: str
    ) -> str:
        """Export tensions to markdown file"""
        tensions = self._export_tensions(conn, identity_id)
        
        # Group by tension name
        tensions_by_name = {}
        for tension in tensions:
            name = tension['name']
            if name not in tensions_by_name:
                tensions_by_name[name] = []
            tensions_by_name[name].append(tension)
        
        output_file = os.path.join(output_dir, "tensions.md")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Tensions\n\n")
            f.write(f"Active tensions: {len(tensions_by_name)}\n\n")
            f.write("---\n\n")
            
            for name, instances in tensions_by_name.items():
                f.write(f"## {name}\n\n")
                
                if instances:
                    first = instances[0]
                    f.write(f"**Polarity**: {first['axis_a']} ↔ {first['axis_b']}\n\n")
                
                f.write(f"**Detected {len(instances)} times**\n\n")
                
                # Calculate average position and intensity
                avg_position = sum(t['position'] for t in instances) / len(instances)
                avg_intensity = sum(t.get('intensity', 0.5) for t in instances) / len(instances)
                
                f.write(f"**Average position**: {avg_position:.2f} (-1 to +1)\n\n")
                f.write(f"**Average intensity**: {avg_intensity:.2f} (0 to 1)\n\n")
                
                # Show trend
                if len(instances) >= 2:
                    first_pos = instances[-1]['position']
                    last_pos = instances[0]['position']
                    trend = "→ more " + (first['axis_b'] if last_pos > first_pos else first['axis_a'])
                    f.write(f"**Trend**: {trend}\n\n")
                
                f.write("---\n\n")
        
        return output_file
    
    def _create_index_markdown(
        self,
        conn: sqlite3.Connection,
        identity_id: str,
        output_file: str
    ):
        """Create index markdown file"""
        reflections = self._export_reflections(conn, identity_id)
        patterns = self._export_patterns(conn, identity_id)
        tensions = self._export_tensions(conn, identity_id)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Mirror OS Export\n\n")
            f.write(f"**Identity**: {identity_id[:8]}...\n\n")
            f.write(f"**Exported**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n")
            f.write("---\n\n")
            f.write("## Summary\n\n")
            f.write(f"- **Reflections**: {len(reflections)}\n")
            f.write(f"- **Patterns**: {len(patterns)}\n")
            f.write(f"- **Tensions**: {len(set(t['name'] for t in tensions))}\n\n")
            f.write("## Files\n\n")
            f.write("- [reflections.md](reflections.md) - All your reflections and mirrorbacks\n")
            f.write("- [patterns.md](patterns.md) - Detected patterns in your thinking\n")
            f.write("- [tensions.md](tensions.md) - Internal tensions and paradoxes\n\n")
            f.write("---\n\n")
            f.write("This export represents your complete data from the Mirror Platform.\n")
            f.write("You own this data completely and can use it however you choose.\n")


class DataImporter:
    """Imports data into Mirror OS"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def import_from_json(
        self,
        import_path: str,
        merge: bool = False
    ) -> Dict:
        """
        Import data from JSON export
        
        Args:
            import_path: Path to JSON file
            merge: If True, merge with existing data; if False, require empty database
        
        Returns:
            Dict with import statistics
        """
        with open(import_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if data.get("format") != "mirror_os_export_v1":
            return {
                "status": "error",
                "message": "Unsupported export format"
            }
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Check if database is empty
            cursor = conn.execute("SELECT COUNT(*) FROM identities")
            existing_identities = cursor.fetchone()[0]
            
            if existing_identities > 0 and not merge:
                return {
                    "status": "error",
                    "message": "Database is not empty. Use merge=True to merge data."
                }
            
            stats = {
                "identities_imported": 0,
                "reflections_imported": 0,
                "mirrorbacks_imported": 0,
                "patterns_imported": 0,
                "tensions_imported": 0
            }
            
            # Import each identity
            for identity in data.get("identities", []):
                self._import_identity(conn, identity, stats)
            
            conn.commit()
            
            return {
                "status": "success",
                "message": f"Imported {stats['identities_imported']} identity/identities",
                **stats
            }
            
        except Exception as e:
            conn.rollback()
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            conn.close()
    
    def restore_from_backup(
        self,
        backup_path: str,
        restore_dir: str
    ) -> Dict:
        """
        Restore from backup archive
        
        Args:
            backup_path: Path to backup zip file
            restore_dir: Directory to restore to
        
        Returns:
            Dict with restore info
        """
        os.makedirs(restore_dir, exist_ok=True)
        
        with zipfile.ZipFile(backup_path, 'r') as zipf:
            zipf.extractall(restore_dir)
        
        # Check if database file exists
        db_file = os.path.join(restore_dir, "mirror.db")
        if os.path.exists(db_file):
            return {
                "status": "success",
                "message": "Backup restored successfully",
                "database_path": db_file,
                "restore_dir": restore_dir
            }
        else:
            # Try importing from JSON
            json_file = os.path.join(restore_dir, "export.json")
            if os.path.exists(json_file):
                new_db = os.path.join(restore_dir, "mirror.db")
                # Create new database and import
                # (Requires schema initialization first)
                return {
                    "status": "partial",
                    "message": "JSON export found, manual import required",
                    "json_path": json_file
                }
        
        return {
            "status": "error",
            "message": "No valid backup data found"
        }
    
    def _import_identity(
        self,
        conn: sqlite3.Connection,
        identity_data: Dict,
        stats: Dict
    ):
        """Import a single identity and all its data"""
        # Import identity
        conn.execute("""
            INSERT OR REPLACE INTO identities (id, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        """, (
            identity_data["id"],
            identity_data.get("metadata"),
            identity_data["created_at"],
            identity_data["updated_at"]
        ))
        stats["identities_imported"] += 1
        
        # Import reflections
        for reflection in identity_data.get("reflections", []):
            conn.execute("""
                INSERT OR REPLACE INTO reflections 
                (id, content, identity_id, visibility, tags, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                reflection["id"],
                reflection["content"],
                reflection["identity_id"],
                reflection.get("visibility", "local_only"),
                reflection.get("tags"),
                reflection["created_at"],
                reflection["updated_at"]
            ))
            stats["reflections_imported"] += 1
        
        # Import mirrorbacks
        for mirrorback in identity_data.get("mirrorbacks", []):
            conn.execute("""
                INSERT OR REPLACE INTO mirrorbacks 
                (id, reflection_id, content, llm_provider, llm_model, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                mirrorback["id"],
                mirrorback["reflection_id"],
                mirrorback["content"],
                mirrorback.get("llm_provider"),
                mirrorback.get("llm_model"),
                mirrorback.get("metadata"),
                mirrorback["created_at"]
            ))
            stats["mirrorbacks_imported"] += 1
        
        # Note: Patterns and tensions would require more complex merging logic
        # For now, we skip them to avoid duplicates


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python exporter.py <db_path> <command> [args]")
        print("Commands:")
        print("  export-json <output_file>")
        print("  export-markdown <output_dir>")
        print("  backup <backup_file>")
        print("  import-json <input_file>")
        sys.exit(1)
    
    db_path = sys.argv[1]
    command = sys.argv[2]
    
    if command == "export-json":
        output_file = sys.argv[3] if len(sys.argv) > 3 else "export.json"
        exporter = DataExporter(db_path)
        result = exporter.export_to_json(output_file)
        print(json.dumps(result, indent=2))
    
    elif command == "export-markdown":
        output_dir = sys.argv[3] if len(sys.argv) > 3 else "export_markdown"
        exporter = DataExporter(db_path)
        result = exporter.export_to_markdown(output_dir)
        print(json.dumps(result, indent=2))
    
    elif command == "backup":
        backup_file = sys.argv[3] if len(sys.argv) > 3 else "backup.zip"
        exporter = DataExporter(db_path)
        result = exporter.create_backup(backup_file)
        print(json.dumps(result, indent=2))
    
    elif command == "import-json":
        import_file = sys.argv[3]
        importer = DataImporter(db_path)
        result = importer.import_from_json(import_file, merge=True)
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
