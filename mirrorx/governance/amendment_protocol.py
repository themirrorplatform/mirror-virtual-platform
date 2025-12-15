"""
Constitutional Amendment Protocol - Guardian-Governed Constitution Changes

Provides:
- Guardian-only proposal system
- Supermajority requirement (75%+)
- Mandatory reflection period (7 days)
- Version tracking for constitution changes
- Amendment history and rollback

Sovereignty principle: Constitution changes require extraordinary consensus.
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum


class AmendmentStatus(Enum):
    """Amendment proposal status"""
    PROPOSED = "proposed"
    REFLECTING = "reflecting"  # In mandatory reflection period
    VOTING = "voting"
    PASSED = "passed"
    FAILED = "failed"
    VETOED = "vetoed"
    IMPLEMENTED = "implemented"
    ROLLED_BACK = "rolled_back"


class AmendmentType(Enum):
    """Type of constitutional change"""
    ADD_PRINCIPLE = "add_principle"
    MODIFY_PRINCIPLE = "modify_principle"
    REMOVE_PRINCIPLE = "remove_principle"
    CHANGE_THRESHOLD = "change_threshold"
    ADD_GUARDIAN_POWER = "add_guardian_power"
    REMOVE_GUARDIAN_POWER = "remove_guardian_power"
    CHANGE_PROCESS = "change_process"


class AmendmentProtocol:
    """
    Constitutional amendment system with strict governance.
    
    Features:
    - Guardian-only proposals
    - 75% supermajority requirement
    - 7-day mandatory reflection period
    - Version tracking
    - Amendment history
    - Rollback capability
    """
    
    SUPERMAJORITY_THRESHOLD = 0.75
    REFLECTION_PERIOD_DAYS = 7
    VOTING_PERIOD_DAYS = 14
    
    def __init__(self, storage):
        self.storage = storage
        self._ensure_amendment_tables()
    
    def _ensure_amendment_tables(self):
        """Create amendment tracking tables"""
        
        # Guardian designations
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS guardians (
                identity_id TEXT PRIMARY KEY,
                appointed_at TEXT NOT NULL,
                appointed_by TEXT,  -- Who appointed them
                reason TEXT,
                active INTEGER NOT NULL DEFAULT 1,
                removed_at TEXT,
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Amendment proposals
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS constitutional_amendments (
                id TEXT PRIMARY KEY,
                proposer_id TEXT NOT NULL,
                amendment_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                proposed_changes TEXT NOT NULL,  -- JSON
                status TEXT NOT NULL,
                proposed_at TEXT NOT NULL,
                reflection_ends_at TEXT NOT NULL,
                voting_ends_at TEXT,
                votes_for INTEGER DEFAULT 0,
                votes_against INTEGER DEFAULT 0,
                votes_abstain INTEGER DEFAULT 0,
                supermajority_required REAL NOT NULL,
                passed_at TEXT,
                implemented_at TEXT,
                metadata TEXT,  -- JSON
                FOREIGN KEY (proposer_id) REFERENCES guardians(identity_id)
            )
        """)
        
        # Amendment votes
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS amendment_votes (
                id TEXT PRIMARY KEY,
                amendment_id TEXT NOT NULL,
                guardian_id TEXT NOT NULL,
                vote TEXT NOT NULL CHECK(vote IN ('for', 'against', 'abstain')),
                reasoning TEXT NOT NULL,
                voted_at TEXT NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (amendment_id) REFERENCES constitutional_amendments(id) ON DELETE CASCADE,
                FOREIGN KEY (guardian_id) REFERENCES guardians(identity_id),
                UNIQUE(amendment_id, guardian_id)
            )
        """)
        
        # Constitution versions
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS constitution_versions (
                id TEXT PRIMARY KEY,
                version_number INTEGER NOT NULL,
                content TEXT NOT NULL,  -- Full constitution JSON
                amendment_id TEXT,  -- Which amendment created this version
                created_at TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 0,
                metadata TEXT,  -- JSON
                FOREIGN KEY (amendment_id) REFERENCES constitutional_amendments(id)
            )
        """)
        
        # Amendment discussion/comments
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS amendment_discussions (
                id TEXT PRIMARY KEY,
                amendment_id TEXT NOT NULL,
                guardian_id TEXT NOT NULL,
                comment TEXT NOT NULL,
                created_at TEXT NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (amendment_id) REFERENCES constitutional_amendments(id) ON DELETE CASCADE,
                FOREIGN KEY (guardian_id) REFERENCES guardians(identity_id)
            )
        """)
        
        # Indexes
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_amendments_status 
            ON constitutional_amendments(status)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_amendments_proposer 
            ON constitutional_amendments(proposer_id)
        """)
        
        self.storage.conn.commit()
    
    def appoint_guardian(
        self,
        identity_id: str,
        appointed_by: Optional[str] = None,
        reason: Optional[str] = None
    ) -> Dict:
        """
        Appoint a guardian.
        
        Args:
            identity_id: Identity to appoint
            appointed_by: Who is appointing them
            reason: Reason for appointment
        
        Returns:
            Appointment result
        """
        
        # Check if already guardian
        cursor = self.storage.conn.execute("""
            SELECT active FROM guardians WHERE identity_id = ?
        """, (identity_id,))
        
        row = cursor.fetchone()
        if row and row['active']:
            return {
                'success': False,
                'error': 'Already a guardian'
            }
        
        # Appoint
        self.storage.conn.execute("""
            INSERT OR REPLACE INTO guardians (
                identity_id, appointed_at, appointed_by, reason, active, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            identity_id,
            datetime.utcnow().isoformat() + 'Z',
            appointed_by,
            reason,
            1,
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'guardian_id': identity_id,
            'message': 'Guardian appointed'
        }
    
    def propose_amendment(
        self,
        proposer_id: str,
        amendment_type: str,
        title: str,
        description: str,
        proposed_changes: Dict
    ) -> Dict:
        """
        Propose a constitutional amendment.
        
        Only guardians can propose amendments.
        
        Args:
            proposer_id: Guardian proposing
            amendment_type: Type of amendment
            title: Amendment title
            description: Detailed description
            proposed_changes: JSON of proposed changes
        
        Returns:
            Proposal result
        """
        
        # Verify proposer is guardian
        cursor = self.storage.conn.execute("""
            SELECT active FROM guardians WHERE identity_id = ?
        """, (proposer_id,))
        
        row = cursor.fetchone()
        if not row or not row['active']:
            return {
                'success': False,
                'error': 'Only active guardians can propose amendments'
            }
        
        # Calculate dates
        proposed_time = datetime.utcnow()
        reflection_ends = proposed_time + timedelta(days=self.REFLECTION_PERIOD_DAYS)
        
        # Create amendment
        amendment_id = f"amendment_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO constitutional_amendments (
                id, proposer_id, amendment_type, title, description,
                proposed_changes, status, proposed_at, reflection_ends_at,
                supermajority_required, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            amendment_id,
            proposer_id,
            amendment_type,
            title,
            description,
            json.dumps(proposed_changes),
            AmendmentStatus.PROPOSED.value,
            proposed_time.isoformat() + 'Z',
            reflection_ends.isoformat() + 'Z',
            self.SUPERMAJORITY_THRESHOLD,
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'amendment_id': amendment_id,
            'status': AmendmentStatus.PROPOSED.value,
            'reflection_ends_at': reflection_ends.isoformat() + 'Z',
            'message': f'Amendment proposed. Reflection period ends {reflection_ends.strftime("%Y-%m-%d")}'
        }
    
    def start_voting(self, amendment_id: str) -> Dict:
        """
        Start voting period after reflection period.
        
        Args:
            amendment_id: Amendment to start voting for
        
        Returns:
            Voting start result
        """
        
        # Get amendment
        cursor = self.storage.conn.execute("""
            SELECT status, reflection_ends_at FROM constitutional_amendments
            WHERE id = ?
        """, (amendment_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Amendment not found'
            }
        
        # Check status
        if row['status'] != AmendmentStatus.PROPOSED.value:
            return {
                'success': False,
                'error': f'Cannot start voting from status: {row["status"]}'
            }
        
        # Check reflection period ended
        reflection_ends = datetime.fromisoformat(row['reflection_ends_at'].replace('Z', ''))
        now = datetime.utcnow()
        
        if now < reflection_ends:
            return {
                'success': False,
                'error': f'Reflection period ends {reflection_ends.strftime("%Y-%m-%d")}',
                'time_remaining': str(reflection_ends - now)
            }
        
        # Start voting
        voting_ends = now + timedelta(days=self.VOTING_PERIOD_DAYS)
        
        self.storage.conn.execute("""
            UPDATE constitutional_amendments
            SET status = ?, voting_ends_at = ?
            WHERE id = ?
        """, (
            AmendmentStatus.VOTING.value,
            voting_ends.isoformat() + 'Z',
            amendment_id
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'amendment_id': amendment_id,
            'status': AmendmentStatus.VOTING.value,
            'voting_ends_at': voting_ends.isoformat() + 'Z',
            'message': f'Voting started. Ends {voting_ends.strftime("%Y-%m-%d")}'
        }
    
    def cast_vote(
        self,
        amendment_id: str,
        guardian_id: str,
        vote: str,  # 'for', 'against', 'abstain'
        reasoning: str
    ) -> Dict:
        """
        Cast a guardian vote on amendment.
        
        Args:
            amendment_id: Amendment to vote on
            guardian_id: Guardian voting
            vote: for/against/abstain
            reasoning: Required reasoning for vote
        
        Returns:
            Vote result
        """
        
        # Verify guardian
        cursor = self.storage.conn.execute("""
            SELECT active FROM guardians WHERE identity_id = ?
        """, (guardian_id,))
        
        row = cursor.fetchone()
        if not row or not row['active']:
            return {
                'success': False,
                'error': 'Only active guardians can vote'
            }
        
        # Verify amendment is in voting
        cursor = self.storage.conn.execute("""
            SELECT status, voting_ends_at FROM constitutional_amendments
            WHERE id = ?
        """, (amendment_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Amendment not found'
            }
        
        if row['status'] != AmendmentStatus.VOTING.value:
            return {
                'success': False,
                'error': f'Amendment not in voting status: {row["status"]}'
            }
        
        # Check voting period
        voting_ends = datetime.fromisoformat(row['voting_ends_at'].replace('Z', ''))
        if datetime.utcnow() > voting_ends:
            return {
                'success': False,
                'error': 'Voting period has ended'
            }
        
        # Validate vote
        if vote not in ['for', 'against', 'abstain']:
            return {
                'success': False,
                'error': 'Invalid vote. Must be for/against/abstain'
            }
        
        # Record vote
        vote_id = f"vote_{os.urandom(16).hex()}"
        
        try:
            self.storage.conn.execute("""
                INSERT INTO amendment_votes (
                    id, amendment_id, guardian_id, vote, reasoning, voted_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                vote_id,
                amendment_id,
                guardian_id,
                vote,
                reasoning,
                datetime.utcnow().isoformat() + 'Z',
                json.dumps({})
            ))
            
            # Update vote counts
            vote_column = f"votes_{vote.replace('-', '_')}"
            self.storage.conn.execute(f"""
                UPDATE constitutional_amendments
                SET {vote_column} = {vote_column} + 1
                WHERE id = ?
            """, (amendment_id,))
            
            self.storage.conn.commit()
            
            return {
                'success': True,
                'vote_id': vote_id,
                'message': f'Vote recorded: {vote}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': 'Already voted on this amendment'
            }
    
    def finalize_amendment(self, amendment_id: str) -> Dict:
        """
        Finalize amendment after voting period.
        
        Checks supermajority and marks as passed/failed.
        
        Args:
            amendment_id: Amendment to finalize
        
        Returns:
            Finalization result
        """
        
        # Get amendment
        cursor = self.storage.conn.execute("""
            SELECT status, voting_ends_at, votes_for, votes_against, 
                   votes_abstain, supermajority_required
            FROM constitutional_amendments
            WHERE id = ?
        """, (amendment_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Amendment not found'
            }
        
        # Check status
        if row['status'] != AmendmentStatus.VOTING.value:
            return {
                'success': False,
                'error': f'Cannot finalize from status: {row["status"]}'
            }
        
        # Check voting period ended
        voting_ends = datetime.fromisoformat(row['voting_ends_at'].replace('Z', ''))
        if datetime.utcnow() < voting_ends:
            return {
                'success': False,
                'error': f'Voting period ends {voting_ends.strftime("%Y-%m-%d")}'
            }
        
        # Calculate results
        votes_for = row['votes_for']
        votes_against = row['votes_against']
        votes_abstain = row['votes_abstain']
        total_votes = votes_for + votes_against  # Abstains don't count toward total
        
        if total_votes == 0:
            # No votes cast
            new_status = AmendmentStatus.FAILED.value
            passed = False
        else:
            approval_rate = votes_for / total_votes
            passed = approval_rate >= row['supermajority_required']
            new_status = AmendmentStatus.PASSED.value if passed else AmendmentStatus.FAILED.value
        
        # Update status
        update_fields = {'status': new_status}
        if passed:
            update_fields['passed_at'] = datetime.utcnow().isoformat() + 'Z'
        
        self.storage.conn.execute(f"""
            UPDATE constitutional_amendments
            SET status = ?, passed_at = ?
            WHERE id = ?
        """, (
            new_status,
            update_fields.get('passed_at'),
            amendment_id
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'amendment_id': amendment_id,
            'status': new_status,
            'passed': passed,
            'votes_for': votes_for,
            'votes_against': votes_against,
            'votes_abstain': votes_abstain,
            'approval_rate': approval_rate if total_votes > 0 else 0,
            'supermajority_required': row['supermajority_required'],
            'message': f'Amendment {"PASSED" if passed else "FAILED"}'
        }
    
    def implement_amendment(
        self,
        amendment_id: str,
        constitution_content: Dict
    ) -> Dict:
        """
        Implement a passed amendment.
        
        Creates new constitution version.
        
        Args:
            amendment_id: Amendment to implement
            constitution_content: Full updated constitution
        
        Returns:
            Implementation result
        """
        
        # Get amendment
        cursor = self.storage.conn.execute("""
            SELECT status, proposed_changes FROM constitutional_amendments
            WHERE id = ?
        """, (amendment_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Amendment not found'
            }
        
        if row['status'] != AmendmentStatus.PASSED.value:
            return {
                'success': False,
                'error': f'Amendment must be passed to implement. Status: {row["status"]}'
            }
        
        # Get current version number
        cursor = self.storage.conn.execute("""
            SELECT version_number FROM constitution_versions
            ORDER BY version_number DESC LIMIT 1
        """)
        
        current_row = cursor.fetchone()
        new_version = (current_row['version_number'] + 1) if current_row else 1
        
        # Deactivate old version
        self.storage.conn.execute("""
            UPDATE constitution_versions SET active = 0
        """)
        
        # Create new version
        version_id = f"version_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO constitution_versions (
                id, version_number, content, amendment_id, created_at, active, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            version_id,
            new_version,
            json.dumps(constitution_content),
            amendment_id,
            datetime.utcnow().isoformat() + 'Z',
            1,
            json.dumps({})
        ))
        
        # Mark amendment as implemented
        self.storage.conn.execute("""
            UPDATE constitutional_amendments
            SET status = ?, implemented_at = ?
            WHERE id = ?
        """, (
            AmendmentStatus.IMPLEMENTED.value,
            datetime.utcnow().isoformat() + 'Z',
            amendment_id
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'version_id': version_id,
            'version_number': new_version,
            'amendment_id': amendment_id,
            'message': f'Amendment implemented as version {new_version}'
        }
    
    def get_active_constitution(self) -> Optional[Dict]:
        """Get currently active constitution version"""
        
        cursor = self.storage.conn.execute("""
            SELECT version_number, content, created_at, amendment_id
            FROM constitution_versions
            WHERE active = 1
        """)
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            'version_number': row['version_number'],
            'content': json.loads(row['content']),
            'created_at': row['created_at'],
            'amendment_id': row['amendment_id']
        }
    
    def get_amendment_history(self) -> List[Dict]:
        """Get all amendments in chronological order"""
        
        cursor = self.storage.conn.execute("""
            SELECT id, title, amendment_type, status, proposed_at, 
                   votes_for, votes_against, passed_at, implemented_at
            FROM constitutional_amendments
            ORDER BY proposed_at DESC
        """)
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'amendment_id': row['id'],
                'title': row['title'],
                'type': row['amendment_type'],
                'status': row['status'],
                'proposed_at': row['proposed_at'],
                'votes_for': row['votes_for'],
                'votes_against': row['votes_against'],
                'passed_at': row['passed_at'],
                'implemented_at': row['implemented_at']
            })
        
        return history
    
    def add_discussion_comment(
        self,
        amendment_id: str,
        guardian_id: str,
        comment: str
    ) -> Dict:
        """Add a comment to amendment discussion"""
        
        # Verify guardian
        cursor = self.storage.conn.execute("""
            SELECT active FROM guardians WHERE identity_id = ?
        """, (guardian_id,))
        
        row = cursor.fetchone()
        if not row or not row['active']:
            return {
                'success': False,
                'error': 'Only guardians can comment'
            }
        
        comment_id = f"comment_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO amendment_discussions (
                id, amendment_id, guardian_id, comment, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            comment_id,
            amendment_id,
            guardian_id,
            comment,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'comment_id': comment_id
        }
    
    def get_amendment_discussion(self, amendment_id: str) -> List[Dict]:
        """Get all discussion comments for an amendment"""
        
        cursor = self.storage.conn.execute("""
            SELECT id, guardian_id, comment, created_at
            FROM amendment_discussions
            WHERE amendment_id = ?
            ORDER BY created_at ASC
        """, (amendment_id,))
        
        discussion = []
        for row in cursor.fetchall():
            discussion.append({
                'comment_id': row['id'],
                'guardian_id': row['guardian_id'],
                'comment': row['comment'],
                'created_at': row['created_at']
            })
        
        return discussion
