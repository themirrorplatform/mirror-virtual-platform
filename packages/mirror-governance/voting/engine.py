"""
Voting Engine

Core voting system combining:
- Direct voting
- Liquid democracy (delegation)
- Quadratic voting (anti-plutocracy)
- Minority protection (supermajority triggers)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from datetime import datetime
import uuid

from ..base import (
    GovernanceConfig,
    VoteType,
    VoteResult,
    VoteRecord,
    ChamberType,
    QuorumNotMetError,
)
from .delegation import DelegationManager
from .quadratic import QuadraticCalculator, QuadraticConfig


@dataclass
class VotingSession:
    """A voting session for a proposal."""
    id: str
    proposal_id: str
    chamber: ChamberType
    started_at: datetime
    ends_at: datetime
    votes: Dict[str, VoteRecord] = field(default_factory=dict)
    finalized: bool = False
    result: Optional[VoteResult] = None

    def is_open(self) -> bool:
        """Check if voting is still open."""
        if self.finalized:
            return False
        now = datetime.utcnow()
        return self.started_at <= now <= self.ends_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "chamber": self.chamber.value,
            "started_at": self.started_at.isoformat(),
            "ends_at": self.ends_at.isoformat(),
            "vote_count": len(self.votes),
            "finalized": self.finalized,
            "result": self.result.to_dict() if self.result else None,
        }


class VotingEngine:
    """
    Core voting engine for governance.

    Features:
    - Direct voting with liquid democracy
    - Quadratic voting to prevent plutocracy
    - Minority protection (supermajority triggers)
    - Separate chambers (users and guardians)

    Usage:
        engine = VotingEngine(config)

        # Start voting session
        session = engine.create_session(proposal_id, chamber, duration_days=7)

        # Cast votes
        engine.cast_vote(session.id, voter_id, VoteType.FOR)

        # Finalize and get result
        result = engine.finalize_session(session.id)
    """

    def __init__(
        self,
        config: GovernanceConfig = None,
        delegation_manager: DelegationManager = None,
        quadratic_calculator: QuadraticCalculator = None
    ):
        self.config = config or GovernanceConfig()
        self.delegation = delegation_manager or DelegationManager()
        self.quadratic = quadratic_calculator or QuadraticCalculator()

        self._sessions: Dict[str, VotingSession] = {}
        self._user_weights: Dict[str, float] = {}  # Base weights
        self._guardian_set: Set[str] = set()
        self._total_users = 0

    def register_user(self, user_id: str, weight: float = 1.0):
        """Register a user for voting."""
        self._user_weights[user_id] = weight
        self._total_users += 1

    def register_guardian(self, guardian_id: str, weight: float = 1.0):
        """Register a guardian (technical maintainer)."""
        self._guardian_set.add(guardian_id)
        self.register_user(guardian_id, weight)

    def create_session(
        self,
        proposal_id: str,
        chamber: ChamberType,
        duration_days: int = None
    ) -> VotingSession:
        """
        Create a new voting session.

        Args:
            proposal_id: ID of the proposal being voted on
            chamber: Which chamber is voting (USER or GUARDIAN)
            duration_days: Voting period in days

        Returns:
            Created VotingSession
        """
        if duration_days is None:
            duration_days = self.config.voting_days

        now = datetime.utcnow()
        from datetime import timedelta

        session = VotingSession(
            id=str(uuid.uuid4()),
            proposal_id=proposal_id,
            chamber=chamber,
            started_at=now,
            ends_at=now + timedelta(days=duration_days),
        )

        self._sessions[session.id] = session
        return session

    def cast_vote(
        self,
        session_id: str,
        voter_id: str,
        vote: VoteType,
        use_delegation: bool = True
    ) -> VoteRecord:
        """
        Cast a vote in a session.

        Args:
            session_id: Voting session ID
            voter_id: ID of the voter
            vote: FOR, AGAINST, or ABSTAIN
            use_delegation: Whether to apply liquid democracy

        Returns:
            VoteRecord

        Raises:
            ValueError: If session is closed or voter already voted
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        if not session.is_open():
            raise ValueError("Voting session is closed")

        if voter_id in session.votes:
            raise ValueError(f"Voter {voter_id} has already voted")

        # Check eligibility
        if session.chamber == ChamberType.GUARDIAN:
            if voter_id not in self._guardian_set:
                raise ValueError(f"Voter {voter_id} is not a guardian")

        # Calculate weight
        base_weight = self._user_weights.get(voter_id, 1.0)

        if use_delegation:
            # Get effective weight including delegations
            effective_weight = self.delegation.get_effective_weight(
                voter_id,
                topic=session.proposal_id
            )
            base_weight *= effective_weight

        # Apply quadratic voting
        if self.config.enable_quadratic:
            weight = self.quadratic.calculate_weight(base_weight)
        else:
            weight = min(base_weight, self.config.max_vote_weight)

        # Get delegation chain for transparency
        delegation_chain = self.delegation.get_delegation_chain(
            voter_id,
            topic=session.proposal_id
        )

        record = VoteRecord(
            voter_id=voter_id,
            vote=vote,
            weight=weight,
            chamber=session.chamber,
            timestamp=datetime.utcnow(),
            delegation_chain=delegation_chain,
        )

        session.votes[voter_id] = record
        return record

    def change_vote(
        self,
        session_id: str,
        voter_id: str,
        new_vote: VoteType
    ) -> VoteRecord:
        """
        Change a previously cast vote.

        Only allowed while session is open.
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        if not session.is_open():
            raise ValueError("Cannot change vote - session is closed")

        if voter_id not in session.votes:
            raise ValueError(f"Voter {voter_id} has not voted yet")

        old_record = session.votes[voter_id]
        new_record = VoteRecord(
            voter_id=voter_id,
            vote=new_vote,
            weight=old_record.weight,
            chamber=old_record.chamber,
            timestamp=datetime.utcnow(),
            delegation_chain=old_record.delegation_chain,
        )

        session.votes[voter_id] = new_record
        return new_record

    def get_session(self, session_id: str) -> Optional[VotingSession]:
        """Get a voting session."""
        return self._sessions.get(session_id)

    def get_current_tally(self, session_id: str) -> VoteResult:
        """Get current vote tally (before finalization)."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        return self._tally_votes(session)

    def finalize_session(self, session_id: str) -> VoteResult:
        """
        Finalize a voting session and determine the result.

        Args:
            session_id: Session to finalize

        Returns:
            Final VoteResult
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        if session.finalized:
            return session.result

        # Check if voting period ended
        if datetime.utcnow() < session.ends_at:
            raise ValueError("Voting period has not ended")

        result = self._tally_votes(session)
        session.result = result
        session.finalized = True

        return result

    def _tally_votes(self, session: VotingSession) -> VoteResult:
        """Tally votes for a session."""
        for_votes = 0.0
        against_votes = 0.0
        abstain_votes = 0.0

        for record in session.votes.values():
            if record.vote == VoteType.FOR:
                for_votes += record.weight
            elif record.vote == VoteType.AGAINST:
                against_votes += record.weight
            else:
                abstain_votes += record.weight

        total_votes = for_votes + against_votes + abstain_votes

        # Calculate quorum
        if session.chamber == ChamberType.USER:
            quorum_threshold = self._total_users * self.config.user_quorum
        else:
            quorum_threshold = len(self._guardian_set) * self.config.guardian_quorum

        quorum_met = len(session.votes) >= quorum_threshold

        # Calculate majority
        votes_cast = for_votes + against_votes  # Abstains don't count
        if votes_cast > 0:
            for_percentage = for_votes / votes_cast
        else:
            for_percentage = 0.0

        majority_met = for_percentage > self.config.simple_majority
        supermajority_met = for_percentage >= self.config.supermajority

        return VoteResult(
            for_votes=for_votes,
            against_votes=against_votes,
            abstain_votes=abstain_votes,
            total_votes=total_votes,
            quorum_met=quorum_met,
            majority_met=majority_met,
            supermajority_met=supermajority_met,
        )

    def check_minority_protection(self, session_id: str) -> bool:
        """
        Check if minority protection was triggered.

        If the minority (those voting against) exceeds the threshold,
        a supermajority is required to pass.

        Returns:
            True if supermajority is required
        """
        session = self._sessions.get(session_id)
        if not session:
            return False

        result = self._tally_votes(session)
        votes_cast = result.for_votes + result.against_votes

        if votes_cast == 0:
            return False

        against_percentage = result.against_votes / votes_cast
        return against_percentage >= self.config.minority_veto_threshold

    def get_voters(self, session_id: str) -> List[str]:
        """Get list of voters in a session."""
        session = self._sessions.get(session_id)
        if not session:
            return []
        return list(session.votes.keys())

    def get_non_voters(self, session_id: str) -> List[str]:
        """Get list of eligible non-voters in a session."""
        session = self._sessions.get(session_id)
        if not session:
            return []

        if session.chamber == ChamberType.USER:
            eligible = set(self._user_weights.keys())
        else:
            eligible = self._guardian_set

        voted = set(session.votes.keys())
        return list(eligible - voted)
