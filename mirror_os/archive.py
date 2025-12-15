# mirror_os/archive.py
"""
Mirror Archive - Long-Term Semantic Memory

Compresses older reflections into semantic summaries while preserving:
- Key themes
- Tensions
- Evolution patterns
- Original reflection IDs (for retrieval)

This prevents the database from growing unbounded while maintaining
semantic richness for long-term identity evolution tracking.
"""

import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict


class MirrorArchive:
    """
    Semantic compression of older reflections.
    
    Strategy:
    1. Group reflections by time period (e.g., month)
    2. Extract themes, tensions, patterns
    3. Create semantic summary
    4. Store compressed version
    5. Keep original reflection IDs for retrieval
    """
    
    def __init__(self, db_path: Path):
        """Initialize archive system"""
        self.db_path = db_path
    
    def archive_older_reflections(
        self,
        identity_id: str,
        days_threshold: int = 90
    ) -> Dict[str, Any]:
        """
        Archive reflections older than threshold.
        
        Args:
            identity_id: Identity to archive
            days_threshold: Archive reflections older than this many days
        
        Returns:
            Archive statistics
        """
        cutoff_date = (
            datetime.utcnow() - timedelta(days=days_threshold)
        ).isoformat() + "Z"
        
        # Get reflections to archive
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT id, content, mirrorback, created_at
                FROM reflections
                WHERE identity_id = ?
                  AND created_at < ?
                ORDER BY created_at ASC
            """, (identity_id, cutoff_date))
            
            reflections = [dict(row) for row in cursor.fetchall()]
        
        if not reflections:
            return {"archived_entries": 0, "reflections_compressed": 0}
        
        # Group by month
        grouped = self._group_by_time_period(reflections)
        
        entries_created = 0
        total_reflections = 0
        
        for (year, month), period_reflections in grouped.items():
            # Create semantic summary
            summary = self._create_semantic_summary(period_reflections)
            
            # Extract themes and tensions
            themes = self._extract_themes(period_reflections)
            tensions = self._extract_tensions(period_reflections)
            
            # Time period bounds
            start = period_reflections[0]["created_at"]
            end = period_reflections[-1]["created_at"]
            
            # Reflection IDs (for retrieval)
            reflection_ids = [r["id"] for r in period_reflections]
            
            # Store archive entry
            self._create_archive_entry(
                identity_id=identity_id,
                semantic_summary=summary,
                themes=themes,
                tensions=tensions,
                time_period_start=start,
                time_period_end=end,
                reflection_ids=reflection_ids
            )
            
            entries_created += 1
            total_reflections += len(period_reflections)
        
        return {
            "archived_entries": entries_created,
            "reflections_compressed": total_reflections,
            "compression_ratio": total_reflections / entries_created if entries_created > 0 else 0
        }
    
    def _group_by_time_period(
        self,
        reflections: List[Dict[str, Any]]
    ) -> Dict[tuple, List[Dict[str, Any]]]:
        """Group reflections by (year, month)"""
        grouped = defaultdict(list)
        
        for reflection in reflections:
            timestamp = reflection["created_at"]
            # Parse ISO format: "2025-01-13T10:30:00Z"
            year = int(timestamp[:4])
            month = int(timestamp[5:7])
            
            grouped[(year, month)].append(reflection)
        
        return dict(grouped)
    
    def _create_semantic_summary(
        self,
        reflections: List[Dict[str, Any]]
    ) -> str:
        """
        Create semantic summary of reflection period.
        
        This is a simple extractive approach. In production, would use
        LLM to generate coherent summary.
        """
        # Count word frequencies
        word_counts = Counter()
        
        for reflection in reflections:
            content = reflection["content"].lower()
            words = content.split()
            
            # Filter common words
            common_words = {
                "the", "a", "an", "and", "or", "but", "in", "on", "at",
                "to", "for", "of", "with", "by", "is", "are", "was", "were",
                "i", "you", "he", "she", "it", "we", "they", "my", "your"
            }
            
            meaningful_words = [w for w in words if w not in common_words and len(w) > 3]
            word_counts.update(meaningful_words)
        
        # Get top themes
        top_words = [word for word, count in word_counts.most_common(10)]
        
        # Extract sample sentences with high keyword density
        sample_sentences = []
        
        for reflection in reflections[:5]:  # Sample from first 5
            content = reflection["content"]
            sentences = content.split(". ")
            
            for sentence in sentences:
                keyword_count = sum(1 for word in top_words if word in sentence.lower())
                if keyword_count >= 2:
                    sample_sentences.append(sentence.strip())
                    if len(sample_sentences) >= 3:
                        break
            
            if len(sample_sentences) >= 3:
                break
        
        # Build summary
        summary_parts = [
            f"During this period, {len(reflections)} reflections explored themes around: {', '.join(top_words[:5])}.",
            ""
        ]
        
        if sample_sentences:
            summary_parts.append("Key passages:")
            for s in sample_sentences[:3]:
                summary_parts.append(f"- {s}")
        
        return "\n".join(summary_parts)
    
    def _extract_themes(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[str]:
        """Extract recurring themes from reflections"""
        # Simple keyword extraction
        # In production, would use NLP/LLM
        
        theme_keywords = {
            "relationships": ["relationship", "connection", "family", "friend", "love"],
            "work": ["work", "career", "job", "professional", "workplace"],
            "identity": ["identity", "self", "who i am", "myself", "person"],
            "emotions": ["feel", "emotion", "anxiety", "fear", "joy", "sad"],
            "growth": ["growth", "change", "develop", "learn", "evolve"],
            "uncertainty": ["uncertain", "unsure", "doubt", "question", "unclear"],
            "conflict": ["conflict", "tension", "struggle", "difficult", "challenge"]
        }
        
        theme_counts = defaultdict(int)
        
        for reflection in reflections:
            content = reflection["content"].lower()
            
            for theme, keywords in theme_keywords.items():
                if any(keyword in content for keyword in keywords):
                    theme_counts[theme] += 1
        
        # Return themes that appear in >30% of reflections
        threshold = len(reflections) * 0.3
        return [theme for theme, count in theme_counts.items() if count >= threshold]
    
    def _extract_tensions(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[str]:
        """Extract tensions/contradictions from reflections"""
        tensions = []
        
        # Look for contradiction markers
        contradiction_markers = [
            "but ", "however", "although", "though", "yet ",
            "on the other hand", "in contrast", "despite"
        ]
        
        for reflection in reflections:
            content = reflection["content"]
            
            for marker in contradiction_markers:
                if marker in content.lower():
                    # Extract sentence containing contradiction
                    sentences = content.split(". ")
                    for sentence in sentences:
                        if marker in sentence.lower():
                            tensions.append(sentence.strip())
                            break
        
        # Deduplicate similar tensions
        unique_tensions = []
        for tension in tensions:
            if not any(self._similar(tension, existing) for existing in unique_tensions):
                unique_tensions.append(tension)
                if len(unique_tensions) >= 5:
                    break
        
        return unique_tensions
    
    def _similar(self, str1: str, str2: str) -> bool:
        """Check if two strings are similar (simple word overlap)"""
        words1 = set(str1.lower().split())
        words2 = set(str2.lower().split())
        
        overlap = len(words1 & words2)
        total = len(words1 | words2)
        
        return (overlap / total) > 0.5 if total > 0 else False
    
    def _create_archive_entry(
        self,
        identity_id: str,
        semantic_summary: str,
        themes: List[str],
        tensions: List[str],
        time_period_start: str,
        time_period_end: str,
        reflection_ids: List[int]
    ):
        """Create archive entry in database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO archive (
                    identity_id, semantic_summary, themes, tensions,
                    time_period_start, time_period_end, reflection_ids, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                identity_id,
                semantic_summary,
                json.dumps(themes),
                json.dumps(tensions),
                time_period_start,
                time_period_end,
                json.dumps(reflection_ids),
                datetime.utcnow().isoformat() + "Z"
            ))
            conn.commit()
    
    def get_archive_entries(
        self,
        identity_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get archive entries for identity"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = """
                SELECT * FROM archive
                WHERE identity_id = ?
                ORDER BY time_period_start DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cursor = conn.execute(query, (identity_id,))
            
            entries = []
            for row in cursor.fetchall():
                entry = dict(row)
                entry["themes"] = json.loads(entry["themes"])
                entry["tensions"] = json.loads(entry["tensions"])
                entry["reflection_ids"] = json.loads(entry["reflection_ids"])
                entries.append(entry)
            
            return entries
    
    def retrieve_original_reflections(
        self,
        archive_entry_id: int
    ) -> List[Dict[str, Any]]:
        """Retrieve original reflections from archive entry"""
        # Get reflection IDs from archive
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT reflection_ids FROM archive WHERE id = ?
            """, (archive_entry_id,))
            
            row = cursor.fetchone()
            if not row:
                return []
            
            reflection_ids = json.loads(row[0])
            
            # Fetch original reflections
            conn.row_factory = sqlite3.Row
            
            placeholders = ",".join("?" * len(reflection_ids))
            cursor = conn.execute(f"""
                SELECT * FROM reflections
                WHERE id IN ({placeholders})
                ORDER BY created_at ASC
            """, reflection_ids)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def search_archive(
        self,
        identity_id: str,
        query: str
    ) -> List[Dict[str, Any]]:
        """Search archive by themes or summary text"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM archive
                WHERE identity_id = ?
                  AND (semantic_summary LIKE ?
                       OR themes LIKE ?
                       OR tensions LIKE ?)
                ORDER BY time_period_start DESC
            """, (identity_id, f"%{query}%", f"%{query}%", f"%{query}%"))
            
            entries = []
            for row in cursor.fetchall():
                entry = dict(row)
                entry["themes"] = json.loads(entry["themes"])
                entry["tensions"] = json.loads(entry["tensions"])
                entry["reflection_ids"] = json.loads(entry["reflection_ids"])
                entries.append(entry)
            
            return entries
    
    def get_reflections(
        self,
        identity_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get recent reflections for evolution tracking.
        
        Args:
            identity_id: Identity to get reflections for
            limit: Maximum number of reflections
        
        Returns:
            List of reflection dictionaries with timestamp and themes
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT content, created_at, metadata
                FROM reflections
                WHERE identity_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (identity_id, limit))
            
            reflections = []
            for row in cursor.fetchall():
                content, created_at, metadata_json = row
                
                # Parse timestamp
                try:
                    timestamp = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    timestamp = datetime.utcnow()
                
                # Simple theme extraction (would use L2 in production)
                themes = self._extract_themes_simple(content)
                
                reflections.append({
                    'timestamp': timestamp,
                    'content': content,
                    'concepts': themes,
                    'themes': [
                        {'name': theme, 'theme': theme, 'strength': 0.5}
                        for theme in themes
                    ],
                    'tensions': []
                })
            
            return reflections
    
    def _extract_themes_simple(self, content: str) -> List[str]:
        """Simple theme extraction (keywords)"""
        # Common important words
        keywords = [
            'work', 'career', 'relationship', 'family', 'health',
            'growth', 'identity', 'purpose', 'stress', 'anxiety',
            'happiness', 'fulfillment', 'uncertainty', 'change'
        ]
        
        content_lower = content.lower()
        found_themes = []
        
        for keyword in keywords:
            if keyword in content_lower:
                found_themes.append(keyword)
        
        return found_themes[:5]  # Limit to 5


# Self-test
if __name__ == "__main__":
    print("Mirror Archive Test")
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
        
        # Create old reflections (backdated)
        old_timestamp = (datetime.utcnow() - timedelta(days=100)).isoformat() + "Z"
        
        test_reflections = [
            "I'm feeling anxious about work relationships and uncertain about my career path.",
            "There's tension between wanting connection with others and needing solitude.",
            "I value growth and learning, but fear making mistakes and looking foolish.",
            "Work brings both clarity and confusion - I know what I'm doing but not why.",
            "Family relationships are complicated. I love them but need distance sometimes."
        ]
        
        # Manually insert old reflections
        with sqlite3.connect(db_path) as conn:
            for content in test_reflections:
                conn.execute("""
                    INSERT INTO reflections (
                        content, identity_id, mirrorback, created_at, metadata
                    ) VALUES (?, ?, ?, ?, ?)
                """, (content, identity_id, "Test", old_timestamp, "{}"))
            conn.commit()
        
        # Archive them
        archive = MirrorArchive(db_path)
        stats = archive.archive_older_reflections(identity_id, days_threshold=30)
        
        print(f"Archive created:")
        print(f"  Entries: {stats['archived_entries']}")
        print(f"  Reflections compressed: {stats['reflections_compressed']}")
        print(f"  Compression ratio: {stats['compression_ratio']:.1f}x")
        
        # Get archive entries
        entries = archive.get_archive_entries(identity_id)
        print(f"\nArchive entries: {len(entries)}")
        
        if entries:
            entry = entries[0]
            print(f"\nFirst entry:")
            print(f"  Themes: {', '.join(entry['themes'])}")
            print(f"  Tensions: {len(entry['tensions'])}")
            print(f"  Reflections: {len(entry['reflection_ids'])}")
            print(f"\n  Summary (first 100 chars):")
            print(f"  {entry['semantic_summary'][:100]}...")
        
        print("\n✅ Mirror archive functional")
