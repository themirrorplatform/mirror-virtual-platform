"""
Behavior Change Log - Complete audit trail of evolution events

Records every change to MirrorX behavior with:
- Before/after snapshots
- User decisions
- Critic interventions
- Rollback capability
- Compliance trail

This is the "black box recorder" for Mirror evolution.
"""

import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum


class ChangeType(Enum):
    """Types of behavior changes"""
    PROPOSAL_ADOPTED = "proposal_adopted"
    PROPOSAL_REJECTED = "proposal_rejected"
    CRITIC_VETO = "critic_veto"
    USER_OVERRIDE = "user_override"
    CONFLICT_RESOLVED = "conflict_resolved"
    ROLLBACK = "rollback"
    CONSTITUTIONAL_BLOCK = "constitutional_block"
    EMERGENCY_FREEZE = "emergency_freeze"


class BehaviorChangeLog:
    """
    Complete audit trail of all MirrorX behavior changes.
    
    Every evolution event is logged with full context for:
    - Compliance auditing
    - Debugging
    - Rollback capability
    - Pattern analysis
    - User transparency
    """
    
    def __init__(self, storage):
        self.storage = storage
        self._ensure_log_table()
    
    def _ensure_log_table(self):
        """Create log table if it doesn't exist"""
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS behavior_change_log (
                id TEXT PRIMARY KEY,
                change_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                proposal_id TEXT,
                identity_id TEXT,
                before_state TEXT,  -- JSON snapshot
                after_state TEXT,   -- JSON snapshot
                decision_maker TEXT,  -- 'user', 'critic', 'constitutional_monitor', 'system'
                decision_reason TEXT,
                user_consent INTEGER,  -- Boolean
                reversible INTEGER,    -- Boolean
                metadata TEXT,         -- JSON: additional context
                parent_log_id TEXT     -- For rollback chains
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_behavior_log_timestamp 
            ON behavior_change_log(timestamp DESC)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_behavior_log_proposal 
            ON behavior_change_log(proposal_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_behavior_log_type 
            ON behavior_change_log(change_type)
        """)
        
        self.storage.conn.commit()
    
    def log_proposal_adoption(
        self,
        proposal_id: str,
        identity_id: str,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        user_consent: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log adoption of an evolution proposal.
        
        Args:
            proposal_id: ID of adopted proposal
            identity_id: User who approved
            before_state: System state before change
            after_state: System state after change
            user_consent: Whether user explicitly consented
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.PROPOSAL_ADOPTED.value,
            datetime.utcnow().isoformat() + 'Z',
            proposal_id,
            identity_id,
            json.dumps(before_state),
            json.dumps(after_state),
            'user',
            'User approved proposal',
            1 if user_consent else 0,
            1,  # Proposals are reversible
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def log_critic_veto(
        self,
        proposal_id: str,
        critique: Dict[str, Any],
        rejected_output: str,
        regenerated_output: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log critic vetoing an output and forcing regeneration.
        
        Args:
            proposal_id: ID of proposal (if applicable)
            critique: Full critique from critic
            rejected_output: The output that was vetoed
            regenerated_output: New output after regeneration
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        
        before_state = {
            'output': rejected_output,
            'critique_score': critique.get('score'),
            'violations': critique.get('violations', [])
        }
        
        after_state = {
            'output': regenerated_output,
            'action': 'regenerated' if regenerated_output else 'blocked',
            'critique': critique
        }
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.CRITIC_VETO.value,
            datetime.utcnow().isoformat() + 'Z',
            proposal_id,
            None,
            json.dumps(before_state),
            json.dumps(after_state),
            'critic',
            f"Vetoed due to {len(critique.get('violations', []))} violations",
            0,  # Critic veto doesn't require user consent
            0,  # Not reversible - critic has final say
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def log_constitutional_block(
        self,
        proposal_id: str,
        constitutional_assessment: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log constitutional monitor blocking a proposal.
        
        Args:
            proposal_id: ID of blocked proposal
            constitutional_assessment: Full assessment from monitor
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        
        hard_blocks = constitutional_assessment.get('hard_blocks', [])
        
        before_state = {
            'proposal_id': proposal_id,
            'status': 'pending_review'
        }
        
        after_state = {
            'proposal_id': proposal_id,
            'status': 'constitutionally_blocked',
            'hard_blocks': hard_blocks,
            'assessment': constitutional_assessment
        }
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.CONSTITUTIONAL_BLOCK.value,
            datetime.utcnow().isoformat() + 'Z',
            proposal_id,
            None,
            json.dumps(before_state),
            json.dumps(after_state),
            'constitutional_monitor',
            f"Hard constitutional violations: {len(hard_blocks)}",
            0,  # Constitutional blocks don't require consent
            0,  # Not reversible - constitution is immutable
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def log_conflict_resolution(
        self,
        conflict_id: str,
        identity_id: str,
        conflicts: List[Dict],
        resolution: Dict[str, Any],
        user_decision: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log user resolving a conflict between proposals.
        
        Args:
            conflict_id: ID of conflict
            identity_id: User who resolved
            conflicts: List of conflicting proposals
            resolution: Chosen resolution
            user_decision: User's explicit decision
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        
        before_state = {
            'conflicts': conflicts,
            'frozen': True
        }
        
        after_state = {
            'resolution': resolution,
            'user_decision': user_decision,
            'frozen': False
        }
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.CONFLICT_RESOLVED.value,
            datetime.utcnow().isoformat() + 'Z',
            None,  # Multiple proposals involved
            identity_id,
            json.dumps(before_state),
            json.dumps(after_state),
            'user',
            f"User resolved {len(conflicts)} conflict(s)",
            1,  # User explicitly decided
            1,  # Conflict resolutions are reversible
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def log_user_override(
        self,
        identity_id: str,
        override_type: str,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log user explicitly overriding system behavior.
        
        Args:
            identity_id: User performing override
            override_type: Type of override
            before_state: State before override
            after_state: State after override
            reason: User's stated reason
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.USER_OVERRIDE.value,
            datetime.utcnow().isoformat() + 'Z',
            None,
            identity_id,
            json.dumps(before_state),
            json.dumps(after_state),
            'user',
            reason,
            1,  # User explicitly overrode
            1,  # User overrides are reversible
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def log_rollback(
        self,
        identity_id: str,
        original_log_id: str,
        rollback_reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log rollback of a previous change.
        
        Args:
            identity_id: User performing rollback
            original_log_id: ID of change being rolled back
            rollback_reason: Why rollback was needed
            metadata: Additional context
        
        Returns:
            Log entry ID
        """
        
        # Get original change
        cursor = self.storage.conn.execute("""
            SELECT before_state, after_state, proposal_id, reversible
            FROM behavior_change_log WHERE id = ?
        """, (original_log_id,))
        
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Log entry {original_log_id} not found")
        
        if not row['reversible']:
            raise ValueError(f"Log entry {original_log_id} is not reversible")
        
        log_id = str(uuid.uuid4())
        
        # Rollback reverses the change: after becomes before
        before_state = json.loads(row['after_state'])
        after_state = json.loads(row['before_state'])
        
        self.storage.conn.execute("""
            INSERT INTO behavior_change_log (
                id, change_type, timestamp, proposal_id, identity_id,
                before_state, after_state, decision_maker, decision_reason,
                user_consent, reversible, metadata, parent_log_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            ChangeType.ROLLBACK.value,
            datetime.utcnow().isoformat() + 'Z',
            row['proposal_id'],
            identity_id,
            json.dumps(before_state),
            json.dumps(after_state),
            'user',
            rollback_reason,
            1,  # User explicitly rolled back
            1,  # Rollbacks themselves are reversible
            json.dumps(metadata or {}),
            original_log_id
        ))
        
        self.storage.conn.commit()
        
        return log_id
    
    def get_change_history(
        self,
        identity_id: Optional[str] = None,
        change_type: Optional[ChangeType] = None,
        start_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Query change history with filters.
        
        Args:
            identity_id: Filter by user
            change_type: Filter by change type
            start_date: Only changes after this date
            limit: Maximum results
        
        Returns:
            List of change records
        """
        
        query = "SELECT * FROM behavior_change_log WHERE 1=1"
        params = []
        
        if identity_id:
            query += " AND identity_id = ?"
            params.append(identity_id)
        
        if change_type:
            query += " AND change_type = ?"
            params.append(change_type.value)
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat() + 'Z')
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor = self.storage.conn.execute(query, params)
        
        changes = []
        for row in cursor.fetchall():
            changes.append({
                'id': row['id'],
                'change_type': row['change_type'],
                'timestamp': row['timestamp'],
                'proposal_id': row['proposal_id'],
                'identity_id': row['identity_id'],
                'before_state': json.loads(row['before_state']) if row['before_state'] else None,
                'after_state': json.loads(row['after_state']) if row['after_state'] else None,
                'decision_maker': row['decision_maker'],
                'decision_reason': row['decision_reason'],
                'user_consent': bool(row['user_consent']),
                'reversible': bool(row['reversible']),
                'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                'parent_log_id': row['parent_log_id']
            })
        
        return changes
    
    def get_proposal_history(self, proposal_id: str) -> List[Dict[str, Any]]:
        """Get all log entries related to a specific proposal"""
        
        cursor = self.storage.conn.execute("""
            SELECT * FROM behavior_change_log 
            WHERE proposal_id = ?
            ORDER BY timestamp ASC
        """, (proposal_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'id': row['id'],
                'change_type': row['change_type'],
                'timestamp': row['timestamp'],
                'decision_maker': row['decision_maker'],
                'decision_reason': row['decision_reason'],
                'before_state': json.loads(row['before_state']) if row['before_state'] else None,
                'after_state': json.loads(row['after_state']) if row['after_state'] else None,
                'reversible': bool(row['reversible'])
            })
        
        return history
    
    def get_rollback_chain(self, log_id: str) -> List[Dict[str, Any]]:
        """Get full chain of rollbacks for a change"""
        
        chain = []
        current_id = log_id
        
        while current_id:
            cursor = self.storage.conn.execute("""
                SELECT * FROM behavior_change_log WHERE id = ?
            """, (current_id,))
            
            row = cursor.fetchone()
            if not row:
                break
            
            chain.append({
                'id': row['id'],
                'change_type': row['change_type'],
                'timestamp': row['timestamp'],
                'decision_reason': row['decision_reason'],
                'parent_log_id': row['parent_log_id']
            })
            
            current_id = row['parent_log_id']
        
        return chain
    
    def get_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Generate compliance report for date range.
        
        Args:
            start_date: Report start date
            end_date: Report end date
        
        Returns:
            Compliance statistics and summary
        """
        
        cursor = self.storage.conn.execute("""
            SELECT 
                change_type,
                COUNT(*) as count,
                SUM(user_consent) as consented,
                SUM(reversible) as reversible_count
            FROM behavior_change_log
            WHERE timestamp >= ? AND timestamp <= ?
            GROUP BY change_type
        """, (start_date.isoformat() + 'Z', end_date.isoformat() + 'Z'))
        
        by_type = {}
        total_changes = 0
        total_consented = 0
        
        for row in cursor.fetchall():
            by_type[row['change_type']] = {
                'count': row['count'],
                'user_consented': row['consented'],
                'reversible': row['reversible_count']
            }
            total_changes += row['count']
            total_consented += row['consented']
        
        # Get critic interventions
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as critic_vetos
            FROM behavior_change_log
            WHERE change_type = ? 
            AND timestamp >= ? AND timestamp <= ?
        """, (
            ChangeType.CRITIC_VETO.value,
            start_date.isoformat() + 'Z',
            end_date.isoformat() + 'Z'
        ))
        
        critic_vetos = cursor.fetchone()['critic_vetos']
        
        # Get constitutional blocks
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as constitutional_blocks
            FROM behavior_change_log
            WHERE change_type = ? 
            AND timestamp >= ? AND timestamp <= ?
        """, (
            ChangeType.CONSTITUTIONAL_BLOCK.value,
            start_date.isoformat() + 'Z',
            end_date.isoformat() + 'Z'
        ))
        
        constitutional_blocks = cursor.fetchone()['constitutional_blocks']
        
        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_changes': total_changes,
            'user_consent_rate': total_consented / total_changes if total_changes > 0 else 0,
            'by_type': by_type,
            'governance': {
                'critic_vetos': critic_vetos,
                'constitutional_blocks': constitutional_blocks,
                'governance_intervention_rate': (critic_vetos + constitutional_blocks) / total_changes if total_changes > 0 else 0
            }
        }
    
    def export_audit_log(
        self,
        output_path: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ):
        """
        Export complete audit log to JSON file.
        
        Args:
            output_path: File path to write JSON
            start_date: Optional start date filter
            end_date: Optional end date filter
        """
        
        query = "SELECT * FROM behavior_change_log WHERE 1=1"
        params = []
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat() + 'Z')
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat() + 'Z')
        
        query += " ORDER BY timestamp ASC"
        
        cursor = self.storage.conn.execute(query, params)
        
        audit_data = {
            'exported_at': datetime.utcnow().isoformat() + 'Z',
            'period': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None
            },
            'entries': []
        }
        
        for row in cursor.fetchall():
            audit_data['entries'].append({
                'id': row['id'],
                'change_type': row['change_type'],
                'timestamp': row['timestamp'],
                'proposal_id': row['proposal_id'],
                'identity_id': row['identity_id'],
                'before_state': json.loads(row['before_state']) if row['before_state'] else None,
                'after_state': json.loads(row['after_state']) if row['after_state'] else None,
                'decision_maker': row['decision_maker'],
                'decision_reason': row['decision_reason'],
                'user_consent': bool(row['user_consent']),
                'reversible': bool(row['reversible']),
                'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                'parent_log_id': row['parent_log_id']
            })
        
        with open(output_path, 'w') as f:
            json.dump(audit_data, f, indent=2)
