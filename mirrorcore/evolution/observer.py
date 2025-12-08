# mirrorcore/evolution/observer.py
"""
Evolution Observer - Logs engine behavior for self-analysis

This is the foundation of collective intelligence:
Each Mirror observes its own behavior to enable self-improvement.

Core principle: Local observation, opt-in contribution.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path

from mirrorcore.storage.local_db import LocalDB
from mirrorcore.config.settings import get_settings


class EngineObserver:
    """
    Observes and logs MirrorCore engine behavior.
    
    Tracks:
    - What patterns were detected
    - What mirrorback was generated
    - How long it took
    - What version of engine
    - Any constitutional flags
    
    Does NOT log:
    - Raw reflection text (privacy)
    - Personal identifiers
    - Location or device info
    """
    
    def __init__(self, db: Optional[LocalDB] = None):
        self.db = db or LocalDB()
        self.settings = get_settings()
        self._ensure_tables()
    
    def _ensure_tables(self):
        """Create observation tables if they don't exist"""
        
        # Engine runs table
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS engine_runs (
                id TEXT PRIMARY KEY,
                reflection_id TEXT NOT NULL,
                config_version TEXT NOT NULL,
                engine_mode TEXT NOT NULL,
                
                -- What was detected
                patterns_detected TEXT,  -- JSON array
                tensions_surfaced TEXT,  -- JSON array
                
                -- What was generated
                mirrorback_length INTEGER,
                mirrorback_hash TEXT,  -- Hash for deduplication, not content
                
                -- Performance
                duration_ms INTEGER,
                token_count INTEGER,
                
                -- Flags
                constitutional_flags TEXT,  -- JSON: over_advice, missed_pattern, etc.
                
                -- Metadata
                timestamp TEXT NOT NULL,
                
                FOREIGN KEY (reflection_id) REFERENCES reflections(id)
            )
        """)
        
        # User feedback table
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS engine_feedback (
                id TEXT PRIMARY KEY,
                engine_run_id TEXT NOT NULL,
                
                -- Rating
                rating INTEGER,  -- 1-5 stars
                
                -- Specific issues
                flags TEXT,  -- JSON: [too_directive, missed_tension, too_generic]
                notes TEXT,  -- Optional user notes
                
                -- Metadata
                timestamp TEXT NOT NULL,
                
                FOREIGN KEY (engine_run_id) REFERENCES engine_runs(id)
            )
        """)
        
        # Create indices
        self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_engine_runs_timestamp 
            ON engine_runs(timestamp DESC)
        """)
        
        self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_engine_feedback_run 
            ON engine_feedback(engine_run_id)
        """)
        
        self.db.commit()
    
    def log_engine_run(
        self,
        reflection_id: str,
        patterns_detected: List[str],
        tensions_surfaced: List[str],
        mirrorback: str,
        duration_ms: int,
        token_count: Optional[int] = None,
        constitutional_flags: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log an engine run for analysis.
        
        Args:
            reflection_id: ID of the reflection
            patterns_detected: List of pattern names detected
            tensions_surfaced: List of tensions identified
            mirrorback: Generated mirrorback text
            duration_ms: How long generation took
            token_count: Number of tokens used (if remote LLM)
            constitutional_flags: Any constitutional violations detected
        
        Returns:
            engine_run_id: ID of logged run
        """
        
        run_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Hash mirrorback for deduplication without storing content
        import hashlib
        mirrorback_hash = hashlib.sha256(mirrorback.encode()).hexdigest()[:16]
        
        self.db.execute("""
            INSERT INTO engine_runs (
                id, reflection_id, config_version, engine_mode,
                patterns_detected, tensions_surfaced,
                mirrorback_length, mirrorback_hash,
                duration_ms, token_count,
                constitutional_flags, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id,
            reflection_id,
            self.settings.version,
            self.settings.engine_mode,
            json.dumps(patterns_detected),
            json.dumps(tensions_surfaced),
            len(mirrorback),
            mirrorback_hash,
            duration_ms,
            token_count,
            json.dumps(constitutional_flags or {}),
            now
        ))
        
        self.db.commit()
        
        return run_id
    
    def log_user_feedback(
        self,
        engine_run_id: str,
        rating: Optional[int] = None,
        flags: Optional[List[str]] = None,
        notes: str = ""
    ) -> str:
        """
        Log user's feedback on a reflection.
        
        Args:
            engine_run_id: ID of the engine run being rated
            rating: 1-5 stars
            flags: List of issue types:
                - too_directive: Gave advice instead of reflecting
                - missed_tension: Didn't surface obvious tension
                - too_generic: Response felt formulaic
                - too_deep: Went too far too fast
                - perfect: No issues (positive flag)
            notes: Optional user notes
        
        Returns:
            feedback_id: ID of logged feedback
        """
        
        feedback_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        self.db.execute("""
            INSERT INTO engine_feedback (
                id, engine_run_id, rating, flags, notes, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            feedback_id,
            engine_run_id,
            rating,
            json.dumps(flags or []),
            notes,
            now
        ))
        
        self.db.commit()
        
        return feedback_id
    
    def get_recent_runs(
        self,
        limit: int = 100,
        include_feedback: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get recent engine runs for analysis.
        
        Args:
            limit: Number of runs to retrieve
            include_feedback: Whether to join feedback data
        
        Returns:
            List of engine runs with feedback
        """
        
        if include_feedback:
            runs = self.db.fetch_all("""
                SELECT 
                    r.*,
                    f.rating,
                    f.flags as feedback_flags,
                    f.notes as feedback_notes
                FROM engine_runs r
                LEFT JOIN engine_feedback f ON r.id = f.engine_run_id
                ORDER BY r.timestamp DESC
                LIMIT ?
            """, (limit,))
        else:
            runs = self.db.fetch_all("""
                SELECT * FROM engine_runs
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
        
        # Parse JSON fields
        for run in runs:
            if run.get('patterns_detected'):
                run['patterns_detected'] = json.loads(run['patterns_detected'])
            if run.get('tensions_surfaced'):
                run['tensions_surfaced'] = json.loads(run['tensions_surfaced'])
            if run.get('constitutional_flags'):
                run['constitutional_flags'] = json.loads(run['constitutional_flags'])
            if run.get('feedback_flags'):
                run['feedback_flags'] = json.loads(run['feedback_flags'])
        
        return runs
    
    def get_constitutional_violations(
        self,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get runs with constitutional flags.
        
        Args:
            days: How many days back to look
        
        Returns:
            List of runs with violations
        """
        
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        runs = self.db.fetch_all("""
            SELECT * FROM engine_runs
            WHERE constitutional_flags != '{}'
            AND timestamp > ?
            ORDER BY timestamp DESC
        """, (cutoff,))
        
        for run in runs:
            if run.get('constitutional_flags'):
                run['constitutional_flags'] = json.loads(run['constitutional_flags'])
        
        return runs
    
    def get_feedback_summary(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get summary of user feedback.
        
        Args:
            days: How many days back to analyze
        
        Returns:
            Summary statistics
        """
        
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        # Get all feedback in period
        feedback = self.db.fetch_all("""
            SELECT rating, flags FROM engine_feedback
            WHERE timestamp > ?
        """, (cutoff,))
        
        if not feedback:
            return {
                'total': 0,
                'average_rating': None,
                'flag_counts': {}
            }
        
        # Calculate stats
        ratings = [f['rating'] for f in feedback if f['rating']]
        average_rating = sum(ratings) / len(ratings) if ratings else None
        
        # Count flags
        from collections import Counter
        flag_counts = Counter()
        for f in feedback:
            if f['flags']:
                flags = json.loads(f['flags'])
                for flag in flags:
                    flag_counts[flag] += 1
        
        return {
            'total': len(feedback),
            'average_rating': average_rating,
            'ratings_distribution': Counter(ratings),
            'flag_counts': dict(flag_counts)
        }
    
    def export_telemetry(
        self,
        days: int = 30,
        anonymize: bool = True
    ) -> Dict[str, Any]:
        """
        Export telemetry data for analysis.
        
        Args:
            days: How many days of data to export
            anonymize: Whether to remove identifying info
        
        Returns:
            Exportable telemetry packet
        """
        
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        runs = self.db.fetch_all("""
            SELECT 
                r.config_version,
                r.engine_mode,
                r.patterns_detected,
                r.tensions_surfaced,
                r.mirrorback_length,
                r.duration_ms,
                r.constitutional_flags,
                f.rating,
                f.flags as feedback_flags
            FROM engine_runs r
            LEFT JOIN engine_feedback f ON r.id = f.engine_run_id
            WHERE r.timestamp > ?
        """, (cutoff,))
        
        if anonymize:
            # Remove any potentially identifying patterns
            for run in runs:
                # Keep only pattern types, not specific content
                if run.get('patterns_detected'):
                    patterns = json.loads(run['patterns_detected'])
                    run['pattern_count'] = len(patterns)
                    run.pop('patterns_detected', None)
                
                # Keep only tension types
                if run.get('tensions_surfaced'):
                    tensions = json.loads(run['tensions_surfaced'])
                    run['tension_count'] = len(tensions)
                    run.pop('tensions_surfaced', None)
        
        return {
            'export_timestamp': datetime.now(timezone.utc).isoformat(),
            'days_included': days,
            'anonymized': anonymize,
            'total_runs': len(runs),
            'runs': runs,
            'summary': self.get_feedback_summary(days)
        }


# Convenience function for global observer
_observer: Optional[EngineObserver] = None


def get_observer() -> EngineObserver:
    """Get global observer instance"""
    global _observer
    if _observer is None:
        _observer = EngineObserver()
    return _observer


def log_reflection(
    reflection_id: str,
    patterns: List[str],
    tensions: List[str],
    mirrorback: str,
    duration_ms: int,
    **kwargs
) -> str:
    """Convenience function to log a reflection"""
    return get_observer().log_engine_run(
        reflection_id=reflection_id,
        patterns_detected=patterns,
        tensions_surfaced=tensions,
        mirrorback=mirrorback,
        duration_ms=duration_ms,
        **kwargs
    )


def log_feedback(
    engine_run_id: str,
    rating: Optional[int] = None,
    flags: Optional[List[str]] = None,
    notes: str = ""
) -> str:
    """Convenience function to log feedback"""
    return get_observer().log_user_feedback(
        engine_run_id=engine_run_id,
        rating=rating,
        flags=flags,
        notes=notes
    )
