"""
Learning Exclusion System - User Control Over Training Data

Allows users to:
- Mark reflections as "do not learn from this"
- Retroactively exclude data from learning
- Audit what has been excluded
- Verify exclusions are enforced

Sovereignty principle: Users control what Mirror learns from.
"""

import json
import uuid
from typing import Dict, List, Optional, Set
from datetime import datetime
from enum import Enum


class ExclusionReason(str, Enum):
    """Why user excluded a reflection from learning"""
    PRIVATE = "private"                    # Too personal
    CRISIS = "crisis"                      # Crisis moment, not representative
    MISTAKE = "mistake"                    # User mistake, not real reflection
    EXPERIMENT = "experiment"              # Just testing
    HARMFUL = "harmful"                    # Would teach harmful patterns
    USER_CHOICE = "user_choice"            # No specific reason given


class LearningExclusionSystem:
    """
    Manages user exclusions from learning/training data.
    
    Core principles:
    - User has absolute control
    - Retroactive exclusions supported
    - Complete audit trail
    - Verifiable enforcement
    """
    
    def __init__(self, storage):
        self.storage = storage
        self._ensure_exclusion_tables()
    
    def _ensure_exclusion_tables(self):
        """Create exclusion tracking tables"""
        
        # Exclusions table
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS learning_exclusions (
                id TEXT PRIMARY KEY,
                reflection_id TEXT NOT NULL,
                identity_id TEXT NOT NULL,
                excluded_at TEXT NOT NULL,
                reason TEXT NOT NULL,
                retroactive INTEGER NOT NULL DEFAULT 0,  -- Boolean
                user_notes TEXT,
                metadata TEXT,  -- JSON
                FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE,
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
                UNIQUE(reflection_id)  -- Can only exclude once
            )
        """)
        
        # Exclusion audit log
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS exclusion_audit_log (
                id TEXT PRIMARY KEY,
                exclusion_id TEXT NOT NULL,
                action TEXT NOT NULL,  -- 'excluded', 'unexcluded', 'verified'
                timestamp TEXT NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (exclusion_id) REFERENCES learning_exclusions(id) ON DELETE CASCADE
            )
        """)
        
        # Learning events that used excluded data (for retroactive cleanup)
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS learning_event_reflections (
                id TEXT PRIMARY KEY,
                learning_event_id TEXT NOT NULL,  -- Evolution proposal, pattern, etc.
                reflection_id TEXT NOT NULL,
                contributed_at TEXT NOT NULL,
                contribution_type TEXT,  -- 'evidence', 'pattern_example', 'training_data'
                metadata TEXT  -- JSON
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_exclusions_reflection 
            ON learning_exclusions(reflection_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_exclusions_identity 
            ON learning_exclusions(identity_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_learning_events_reflection 
            ON learning_event_reflections(reflection_id)
        """)
        
        self.storage.conn.commit()
    
    def exclude_reflection(
        self,
        reflection_id: str,
        identity_id: str,
        reason: ExclusionReason,
        user_notes: Optional[str] = None,
        retroactive: bool = False
    ) -> Dict:
        """
        Mark a reflection as excluded from learning.
        
        Args:
            reflection_id: Reflection to exclude
            identity_id: User performing exclusion
            reason: Why excluding
            user_notes: Optional user explanation
            retroactive: If True, flag affected learning events
        
        Returns:
            Exclusion record with affected events
        """
        
        # Check if already excluded
        cursor = self.storage.conn.execute("""
            SELECT id FROM learning_exclusions WHERE reflection_id = ?
        """, (reflection_id,))
        
        if cursor.fetchone():
            return {
                'success': False,
                'error': 'Reflection already excluded'
            }
        
        # Verify reflection exists and belongs to user
        cursor = self.storage.conn.execute("""
            SELECT identity_id FROM reflections WHERE id = ?
        """, (reflection_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Reflection not found'
            }
        
        if row['identity_id'] != identity_id:
            return {
                'success': False,
                'error': 'Can only exclude your own reflections'
            }
        
        # Create exclusion
        exclusion_id = str(uuid.uuid4())
        
        self.storage.conn.execute("""
            INSERT INTO learning_exclusions (
                id, reflection_id, identity_id, excluded_at, reason,
                retroactive, user_notes, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            exclusion_id,
            reflection_id,
            identity_id,
            datetime.utcnow().isoformat() + 'Z',
            reason.value,
            1 if retroactive else 0,
            user_notes,
            json.dumps({})
        ))
        
        # Audit log
        self._log_exclusion_event(exclusion_id, 'excluded', {
            'reason': reason.value,
            'retroactive': retroactive
        })
        
        self.storage.conn.commit()
        
        # Handle retroactive exclusion
        affected_events = []
        if retroactive:
            affected_events = self._handle_retroactive_exclusion(reflection_id)
        
        return {
            'success': True,
            'exclusion_id': exclusion_id,
            'reflection_id': reflection_id,
            'retroactive': retroactive,
            'affected_events': affected_events,
            'message': f"Reflection excluded from learning. {len(affected_events)} event(s) affected." if retroactive else "Reflection excluded from future learning."
        }
    
    def unexclude_reflection(
        self,
        reflection_id: str,
        identity_id: str
    ) -> Dict:
        """
        Remove exclusion, allow learning again.
        
        Args:
            reflection_id: Reflection to unexclude
            identity_id: User performing action
        
        Returns:
            Success status
        """
        
        # Get exclusion
        cursor = self.storage.conn.execute("""
            SELECT id, identity_id FROM learning_exclusions 
            WHERE reflection_id = ?
        """, (reflection_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Reflection not excluded'
            }
        
        if row['identity_id'] != identity_id:
            return {
                'success': False,
                'error': 'Can only unexclude your own reflections'
            }
        
        exclusion_id = row['id']
        
        # Log before deleting
        self._log_exclusion_event(exclusion_id, 'unexcluded', {})
        
        # Remove exclusion
        self.storage.conn.execute("""
            DELETE FROM learning_exclusions WHERE id = ?
        """, (exclusion_id,))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'reflection_id': reflection_id,
            'message': 'Reflection can now be used for learning'
        }
    
    def _handle_retroactive_exclusion(self, reflection_id: str) -> List[Dict]:
        """
        Find and flag all learning events that used this reflection.
        
        Returns list of affected events.
        """
        
        # Find all learning events that used this reflection
        cursor = self.storage.conn.execute("""
            SELECT learning_event_id, contribution_type
            FROM learning_event_reflections
            WHERE reflection_id = ?
        """, (reflection_id,))
        
        affected = []
        for row in cursor.fetchall():
            affected.append({
                'event_id': row['learning_event_id'],
                'contribution_type': row['contribution_type']
            })
        
        # Mark these events as tainted
        for event in affected:
            self._flag_learning_event_tainted(
                event['event_id'],
                reflection_id,
                'reflection_excluded'
            )
        
        return affected
    
    def _flag_learning_event_tainted(
        self,
        event_id: str,
        reflection_id: str,
        reason: str
    ):
        """Mark a learning event as potentially compromised"""
        
        # Update evolution proposal metadata to mark as needing review
        self.storage.conn.execute("""
            UPDATE evolution_proposals
            SET metadata = json_set(
                COALESCE(metadata, '{}'),
                '$.tainted',
                1
            ),
            metadata = json_set(
                metadata,
                '$.tainted_reason',
                ?
            ),
            metadata = json_set(
                metadata,
                '$.tainted_reflection',
                ?
            )
            WHERE id = ?
        """, (reason, reflection_id, event_id))
        
        self.storage.conn.commit()
    
    def is_reflection_excluded(self, reflection_id: str) -> bool:
        """Check if reflection is excluded from learning"""
        
        cursor = self.storage.conn.execute("""
            SELECT 1 FROM learning_exclusions WHERE reflection_id = ?
        """, (reflection_id,))
        
        return cursor.fetchone() is not None
    
    def get_excluded_reflections(
        self,
        identity_id: str,
        include_metadata: bool = False
    ) -> List[Dict]:
        """Get all excluded reflections for a user"""
        
        if include_metadata:
            cursor = self.storage.conn.execute("""
                SELECT e.*, r.content, r.created_at as reflection_created_at
                FROM learning_exclusions e
                JOIN reflections r ON e.reflection_id = r.id
                WHERE e.identity_id = ?
                ORDER BY e.excluded_at DESC
            """, (identity_id,))
        else:
            cursor = self.storage.conn.execute("""
                SELECT id, reflection_id, reason, excluded_at, retroactive, user_notes
                FROM learning_exclusions
                WHERE identity_id = ?
                ORDER BY excluded_at DESC
            """, (identity_id,))
        
        exclusions = []
        for row in cursor.fetchall():
            exclusion = {
                'id': row['id'],
                'reflection_id': row['reflection_id'],
                'reason': row['reason'],
                'excluded_at': row['excluded_at'],
                'retroactive': bool(row['retroactive']),
                'user_notes': row['user_notes']
            }
            
            if include_metadata:
                exclusion['reflection_content'] = row['content']
                exclusion['reflection_created_at'] = row['reflection_created_at']
            
            exclusions.append(exclusion)
        
        return exclusions
    
    def record_learning_event_usage(
        self,
        learning_event_id: str,
        reflection_ids: List[str],
        contribution_type: str
    ):
        """
        Record that specific reflections were used in a learning event.
        
        This enables retroactive exclusion tracking.
        
        Args:
            learning_event_id: ID of proposal, pattern, etc.
            reflection_ids: Reflections that contributed
            contribution_type: How they contributed
        """
        
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        for reflection_id in reflection_ids:
            record_id = str(uuid.uuid4())
            
            self.storage.conn.execute("""
                INSERT INTO learning_event_reflections (
                    id, learning_event_id, reflection_id,
                    contributed_at, contribution_type, metadata
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                record_id,
                learning_event_id,
                reflection_id,
                timestamp,
                contribution_type,
                json.dumps({})
            ))
        
        self.storage.conn.commit()
    
    def verify_exclusion_enforcement(
        self,
        learning_event_id: str
    ) -> Dict:
        """
        Verify that a learning event didn't use any excluded reflections.
        
        Args:
            learning_event_id: Event to verify
        
        Returns:
            Verification report
        """
        
        # Get reflections used in this event
        cursor = self.storage.conn.execute("""
            SELECT reflection_id FROM learning_event_reflections
            WHERE learning_event_id = ?
        """, (learning_event_id,))
        
        used_reflections = [row['reflection_id'] for row in cursor.fetchall()]
        
        if not used_reflections:
            return {
                'verified': True,
                'message': 'No reflections tracked for this event',
                'violations': []
            }
        
        # Check if any are excluded
        placeholders = ','.join('?' * len(used_reflections))
        cursor = self.storage.conn.execute(f"""
            SELECT reflection_id, reason, excluded_at
            FROM learning_exclusions
            WHERE reflection_id IN ({placeholders})
        """, used_reflections)
        
        violations = []
        for row in cursor.fetchall():
            violations.append({
                'reflection_id': row['reflection_id'],
                'exclusion_reason': row['reason'],
                'excluded_at': row['excluded_at']
            })
        
        verified = len(violations) == 0
        
        # Log verification
        self._log_verification(learning_event_id, verified, violations)
        
        return {
            'verified': verified,
            'total_reflections_checked': len(used_reflections),
            'violations': violations,
            'message': 'Exclusions properly enforced' if verified else f'{len(violations)} excluded reflection(s) were used'
        }
    
    def _log_exclusion_event(
        self,
        exclusion_id: str,
        action: str,
        metadata: Dict
    ):
        """Log exclusion action to audit trail"""
        
        log_id = str(uuid.uuid4())
        
        self.storage.conn.execute("""
            INSERT INTO exclusion_audit_log (
                id, exclusion_id, action, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            log_id,
            exclusion_id,
            action,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps(metadata)
        ))
        
        self.storage.conn.commit()
    
    def _log_verification(
        self,
        learning_event_id: str,
        verified: bool,
        violations: List[Dict]
    ):
        """Log verification check"""
        
        # Store in metadata for now (could be separate table)
        pass
    
    def get_exclusion_statistics(self, identity_id: str) -> Dict:
        """Get statistics about user's exclusions"""
        
        # Total exclusions
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count FROM learning_exclusions
            WHERE identity_id = ?
        """, (identity_id,))
        
        total = cursor.fetchone()['count']
        
        # By reason
        cursor = self.storage.conn.execute("""
            SELECT reason, COUNT(*) as count
            FROM learning_exclusions
            WHERE identity_id = ?
            GROUP BY reason
        """, (identity_id,))
        
        by_reason = {row['reason']: row['count'] for row in cursor.fetchall()}
        
        # Retroactive count
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count FROM learning_exclusions
            WHERE identity_id = ? AND retroactive = 1
        """, (identity_id,))
        
        retroactive_count = cursor.fetchone()['count']
        
        # Total reflections
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count FROM reflections
            WHERE identity_id = ?
        """, (identity_id,))
        
        total_reflections = cursor.fetchone()['count']
        
        exclusion_rate = total / total_reflections if total_reflections > 0 else 0
        
        return {
            'total_exclusions': total,
            'total_reflections': total_reflections,
            'exclusion_rate': exclusion_rate,
            'retroactive_exclusions': retroactive_count,
            'by_reason': by_reason
        }
    
    def get_affected_learning_events(self, reflection_id: str) -> List[Dict]:
        """Get all learning events affected by a reflection's exclusion"""
        
        cursor = self.storage.conn.execute("""
            SELECT 
                e.learning_event_id,
                e.contribution_type,
                e.contributed_at,
                p.title,
                p.status
            FROM learning_event_reflections e
            LEFT JOIN evolution_proposals p ON e.learning_event_id = p.id
            WHERE e.reflection_id = ?
            ORDER BY e.contributed_at DESC
        """, (reflection_id,))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                'event_id': row['learning_event_id'],
                'contribution_type': row['contribution_type'],
                'contributed_at': row['contributed_at'],
                'title': row['title'],
                'status': row['status']
            })
        
        return events
    
    def bulk_exclude_by_date_range(
        self,
        identity_id: str,
        start_date: datetime,
        end_date: datetime,
        reason: ExclusionReason,
        user_notes: Optional[str] = None
    ) -> Dict:
        """
        Exclude all reflections in a date range.
        
        Useful for excluding crisis periods or experimental phases.
        
        Args:
            identity_id: User
            start_date: Start of range
            end_date: End of range
            reason: Why excluding
            user_notes: Optional explanation
        
        Returns:
            Bulk exclusion results
        """
        
        # Get reflections in range
        cursor = self.storage.conn.execute("""
            SELECT id FROM reflections
            WHERE identity_id = ?
            AND created_at >= ?
            AND created_at <= ?
            AND id NOT IN (SELECT reflection_id FROM learning_exclusions)
        """, (
            identity_id,
            start_date.isoformat() + 'Z',
            end_date.isoformat() + 'Z'
        ))
        
        reflection_ids = [row['id'] for row in cursor.fetchall()]
        
        excluded_count = 0
        for reflection_id in reflection_ids:
            result = self.exclude_reflection(
                reflection_id,
                identity_id,
                reason,
                user_notes,
                retroactive=False  # Bulk operations not retroactive by default
            )
            if result['success']:
                excluded_count += 1
        
        return {
            'success': True,
            'excluded_count': excluded_count,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'reason': reason.value
        }
