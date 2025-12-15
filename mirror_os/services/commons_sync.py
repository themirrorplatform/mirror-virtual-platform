"""
Commons Sync Protocol - Distributed synchronization of evolution proposals

Enables mirrors to share proposals, votes, and versions across the network
while maintaining data sovereignty and preventing conflicts.

Protocol Features:
- Broadcast proposals to commons (optional)
- Aggregate votes from multiple mirrors
- Resolve conflicts (same proposal from different sources)
- Sync evolution versions across network
- Maintain local-first with eventual consistency
"""

from typing import Dict, List, Optional, Any, Set
from datetime import datetime
import json
import hashlib
from enum import Enum

from mirror_os.services.evolution_engine import (
    EvolutionProposal, ProposalType, ProposalStatus,
    Vote, VoteChoice, EvolutionVersion
)


class SyncStatus(str, Enum):
    """Status of sync operation"""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    CONFLICT = "conflict"


class ConflictResolution(str, Enum):
    """Strategies for resolving conflicts"""
    KEEP_LOCAL = "keep_local"           # Keep local version
    KEEP_REMOTE = "keep_remote"         # Keep remote version
    MERGE = "merge"                      # Merge both versions
    CREATE_VARIANT = "create_variant"   # Create as variant proposal


class CommonsSync:
    """
    Handles synchronization of evolution data with the commons
    
    The commons is a shared space where mirrors can:
    - Broadcast proposals for wider voting
    - Aggregate votes from multiple mirrors
    - Share approved patterns/tensions
    - Sync evolution versions
    """
    
    def __init__(self, storage, evolution_engine):
        """
        Initialize commons sync
        
        Args:
            storage: Storage implementation
            evolution_engine: EvolutionEngine instance
        """
        self.storage = storage
        self.evolution_engine = evolution_engine
        self.sync_enabled = True
        self.commons_url = None  # Set when connecting to commons
        self.local_mirror_id = self._get_or_create_mirror_id()
    
    def _get_or_create_mirror_id(self) -> str:
        """
        Get or create unique mirror ID for this instance
        
        Returns:
            Mirror ID
        """
        # Check settings for existing mirror ID
        cursor = self.storage.conn.execute(
            "SELECT value FROM settings WHERE key = ?",
            ("mirror_id",)
        )
        row = cursor.fetchone()
        
        if row:
            return row["value"]
        
        # Create new mirror ID
        import uuid
        mirror_id = str(uuid.uuid4())
        
        self.storage.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            ("mirror_id", mirror_id)
        )
        self.storage.conn.commit()
        
        return mirror_id
    
    def broadcast_proposal(
        self,
        proposal_id: str,
        target_commons: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Broadcast a proposal to the commons for wider voting
        
        Args:
            proposal_id: ID of proposal to broadcast
            target_commons: Optional specific commons URL
        
        Returns:
            {
                "status": "success" | "failed",
                "broadcast_id": "...",
                "message": "..."
            }
        """
        proposal = self.evolution_engine.get_proposal(proposal_id)
        if not proposal:
            return {"status": "failed", "message": "Proposal not found"}
        
        if not self.sync_enabled:
            return {"status": "failed", "message": "Sync disabled"}
        
        # Create broadcast record
        broadcast_id = self._create_broadcast_record(proposal_id)
        
        # In production, this would make HTTP request to commons API
        # For now, simulate successful broadcast
        
        return {
            "status": "success",
            "broadcast_id": broadcast_id,
            "message": f"Proposal broadcast to commons",
            "proposal_id": proposal_id,
            "mirror_id": self.local_mirror_id
        }
    
    def _create_broadcast_record(self, proposal_id: str) -> str:
        """
        Create a record of proposal broadcast
        
        Args:
            proposal_id: ID of proposal broadcast
        
        Returns:
            Broadcast ID
        """
        import uuid
        broadcast_id = str(uuid.uuid4())
        
        # Store broadcast metadata in settings as JSON
        broadcasts_key = "proposal_broadcasts"
        cursor = self.storage.conn.execute(
            "SELECT value FROM settings WHERE key = ?",
            (broadcasts_key,)
        )
        row = cursor.fetchone()
        
        broadcasts = json.loads(row["value"]) if row else []
        broadcasts.append({
            "id": broadcast_id,
            "proposal_id": proposal_id,
            "broadcast_at": datetime.utcnow().isoformat() + 'Z',
            "mirror_id": self.local_mirror_id
        })
        
        self.storage.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            (broadcasts_key, json.dumps(broadcasts))
        )
        self.storage.conn.commit()
        
        return broadcast_id
    
    def receive_proposal(
        self,
        proposal_data: Dict[str, Any],
        source_mirror_id: str
    ) -> Dict[str, Any]:
        """
        Receive a proposal from another mirror or commons
        
        Args:
            proposal_data: Proposal data from remote source
            source_mirror_id: ID of mirror that sent the proposal
        
        Returns:
            {
                "status": "success" | "conflict" | "failed",
                "proposal_id": "...",
                "message": "..."
            }
        """
        # Check if proposal already exists
        existing = self._find_similar_proposal(proposal_data)
        
        if existing:
            # Conflict - proposal already exists
            resolution = self._resolve_proposal_conflict(
                existing,
                proposal_data,
                source_mirror_id
            )
            return resolution
        
        # Create new proposal
        try:
            proposal = self.evolution_engine.create_proposal(
                proposal_type=ProposalType(proposal_data["type"]),
                title=proposal_data["title"],
                description=proposal_data["description"],
                content=json.loads(proposal_data["content"]) if isinstance(proposal_data["content"], str) else proposal_data["content"],
                proposer_identity_id=source_mirror_id,
                metadata={
                    "source": "commons",
                    "original_mirror": source_mirror_id
                }
            )
            
            return {
                "status": "success",
                "proposal_id": proposal.id,
                "message": "Proposal received and created"
            }
        
        except Exception as e:
            return {
                "status": "failed",
                "message": f"Failed to create proposal: {str(e)}"
            }
    
    def _find_similar_proposal(
        self,
        proposal_data: Dict[str, Any]
    ) -> Optional[EvolutionProposal]:
        """
        Find existing proposal that matches incoming proposal
        
        Uses content hash to detect duplicates
        
        Args:
            proposal_data: Incoming proposal data
        
        Returns:
            Existing proposal or None
        """
        # Calculate content hash
        content_str = json.dumps(proposal_data["content"], sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()
        
        # Check for proposals with same type and similar content
        proposals = self.evolution_engine.list_proposals(
            proposal_type=ProposalType(proposal_data["type"]),
            limit=100
        )
        
        for proposal in proposals:
            existing_content = json.dumps(proposal.content, sort_keys=True)
            existing_hash = hashlib.sha256(existing_content.encode()).hexdigest()
            
            if content_hash == existing_hash:
                return proposal
        
        return None
    
    def _resolve_proposal_conflict(
        self,
        existing: EvolutionProposal,
        incoming_data: Dict[str, Any],
        source_mirror_id: str
    ) -> Dict[str, Any]:
        """
        Resolve conflict when same proposal exists
        
        Args:
            existing: Existing local proposal
            incoming_data: Incoming proposal data
            source_mirror_id: Source of incoming proposal
        
        Returns:
            Resolution result
        """
        # Default: keep local, add note about duplicate
        return {
            "status": "conflict",
            "resolution": "keep_local",
            "existing_proposal_id": existing.id,
            "message": f"Proposal already exists locally. Keeping local version.",
            "source_mirror": source_mirror_id
        }
    
    def aggregate_votes(
        self,
        proposal_id: str
    ) -> Dict[str, Any]:
        """
        Aggregate votes from commons for a proposal
        
        In production, this would query commons API for votes
        from other mirrors on this proposal.
        
        Args:
            proposal_id: ID of proposal to aggregate votes for
        
        Returns:
            {
                "status": "success",
                "votes_added": int,
                "total_votes": int
            }
        """
        # In production, make HTTP request to commons
        # For now, return mock aggregation
        
        proposal = self.evolution_engine.get_proposal(proposal_id)
        if not proposal:
            return {"status": "failed", "message": "Proposal not found"}
        
        return {
            "status": "success",
            "votes_added": 0,
            "total_votes": int(proposal.total_vote_weight),
            "proposal_id": proposal_id
        }
    
    def sync_version(
        self,
        version_id: str
    ) -> Dict[str, Any]:
        """
        Sync an evolution version to the commons
        
        Args:
            version_id: ID of version to sync
        
        Returns:
            Sync result
        """
        # Get version from storage
        cursor = self.storage.conn.execute(
            "SELECT * FROM evolution_versions WHERE id = ?",
            (version_id,)
        )
        row = cursor.fetchone()
        
        if not row:
            return {"status": "failed", "message": "Version not found"}
        
        # In production, broadcast to commons
        # For now, return success
        
        return {
            "status": "success",
            "version_id": version_id,
            "version_number": row["version_number"],
            "message": "Version synced to commons"
        }
    
    def pull_versions(self) -> Dict[str, Any]:
        """
        Pull latest evolution versions from commons
        
        Returns:
            {
                "status": "success",
                "versions_pulled": int,
                "latest_version": "..."
            }
        """
        # In production, query commons API
        # For now, return mock result
        
        return {
            "status": "success",
            "versions_pulled": 0,
            "latest_version": "1.0.0",
            "message": "No new versions available"
        }
    
    def get_sync_status(self) -> Dict[str, Any]:
        """
        Get current sync status with commons
        
        Returns:
            {
                "enabled": bool,
                "mirror_id": str,
                "last_sync": str,
                "proposals_broadcast": int,
                "votes_aggregated": int
            }
        """
        # Get broadcast count
        cursor = self.storage.conn.execute(
            "SELECT value FROM settings WHERE key = ?",
            ("proposal_broadcasts",)
        )
        row = cursor.fetchone()
        broadcasts = json.loads(row["value"]) if row else []
        
        return {
            "enabled": self.sync_enabled,
            "mirror_id": self.local_mirror_id,
            "last_sync": datetime.utcnow().isoformat() + 'Z',
            "proposals_broadcast": len(broadcasts),
            "votes_aggregated": 0,
            "commons_url": self.commons_url or "Not connected"
        }
    
    def enable_sync(self, commons_url: str):
        """
        Enable sync with commons
        
        Args:
            commons_url: URL of commons API
        """
        self.sync_enabled = True
        self.commons_url = commons_url
        
        self.storage.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            ("commons_url", commons_url)
        )
        self.storage.conn.commit()
    
    def disable_sync(self):
        """Disable sync with commons"""
        self.sync_enabled = False


class ConflictResolver:
    """
    Helper class for resolving various types of conflicts
    """
    
    @staticmethod
    def resolve_proposal_conflict(
        local: EvolutionProposal,
        remote: Dict[str, Any],
        strategy: ConflictResolution = ConflictResolution.KEEP_LOCAL
    ) -> Dict[str, Any]:
        """
        Resolve conflict between local and remote proposal
        
        Args:
            local: Local proposal
            remote: Remote proposal data
            strategy: Resolution strategy
        
        Returns:
            Resolution result
        """
        if strategy == ConflictResolution.KEEP_LOCAL:
            return {
                "action": "keep_local",
                "proposal_id": local.id,
                "message": "Kept local proposal"
            }
        
        elif strategy == ConflictResolution.KEEP_REMOTE:
            return {
                "action": "replace_local",
                "old_proposal_id": local.id,
                "message": "Replaced with remote proposal"
            }
        
        elif strategy == ConflictResolution.MERGE:
            # Merge logic: combine votes, keep higher consensus
            return {
                "action": "merge",
                "proposal_id": local.id,
                "message": "Merged local and remote proposals"
            }
        
        else:  # CREATE_VARIANT
            return {
                "action": "create_variant",
                "original_id": local.id,
                "message": "Created variant proposal"
            }
    
    @staticmethod
    def resolve_vote_conflict(
        local_votes: List[Vote],
        remote_votes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Resolve conflicts in vote lists
        
        Args:
            local_votes: Local votes
            remote_votes: Remote votes
        
        Returns:
            Merged vote list
        """
        # Deduplicate by identity_id - keep first vote
        seen_identities: Set[str] = set()
        merged_votes = []
        
        for vote in local_votes:
            if vote.identity_id not in seen_identities:
                merged_votes.append(vote.to_dict())
                seen_identities.add(vote.identity_id)
        
        for vote_data in remote_votes:
            if vote_data["identity_id"] not in seen_identities:
                merged_votes.append(vote_data)
                seen_identities.add(vote_data["identity_id"])
        
        return merged_votes
