"""
Timelock Manager

Enforces mandatory waiting periods between proposal approval and enactment.
This provides a "cooling off" period where:
- Community can review approved changes
- Minority can organize opposition
- Emergency halt can be triggered if problems found

Anti-capture properties:
1. Prevents surprise changes
2. Allows time for community response
3. Creates predictable change cadence
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TimelockStatus(Enum):
    """Status of a timelock."""
    PENDING = "pending"  # Waiting for timelock to start
    ACTIVE = "active"  # Timelock in progress
    READY = "ready"  # Timelock complete, ready for enactment
    EXECUTED = "executed"  # Change has been enacted
    CANCELLED = "cancelled"  # Timelock was cancelled
    HALTED = "halted"  # Emergency halt triggered


@dataclass
class TimelockConfig:
    """Configuration for timelocks."""
    # Default periods in days
    minor_days: int = 3
    standard_days: int = 7
    major_days: int = 14
    constitutional_days: int = 30

    # Emergency halt threshold (% of users who can trigger halt)
    emergency_halt_threshold: float = 0.20

    # Minimum halt signers
    min_halt_signers: int = 10

    # Extension allowed (additional review time)
    max_extension_days: int = 14


@dataclass
class Timelock:
    """A timelock for a proposal."""
    id: str
    proposal_id: str
    status: TimelockStatus
    duration_days: int
    created_at: datetime
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None

    # Halt tracking
    halt_signatures: List[str] = field(default_factory=list)
    halted_at: Optional[datetime] = None
    halt_reason: Optional[str] = None

    # Extension tracking
    extensions: List[dict] = field(default_factory=list)

    def is_active(self) -> bool:
        """Check if timelock is currently active."""
        if self.status != TimelockStatus.ACTIVE:
            return False
        now = datetime.utcnow()
        return self.starts_at <= now < self.ends_at

    def is_ready(self) -> bool:
        """Check if timelock has completed and is ready for execution."""
        if self.status == TimelockStatus.READY:
            return True
        if self.status != TimelockStatus.ACTIVE:
            return False
        return datetime.utcnow() >= self.ends_at

    def time_remaining(self) -> Optional[timedelta]:
        """Get time remaining in the timelock."""
        if not self.ends_at:
            return None
        if self.status not in [TimelockStatus.ACTIVE, TimelockStatus.PENDING]:
            return None
        remaining = self.ends_at - datetime.utcnow()
        return max(remaining, timedelta(0))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "status": self.status.value,
            "duration_days": self.duration_days,
            "created_at": self.created_at.isoformat(),
            "starts_at": self.starts_at.isoformat() if self.starts_at else None,
            "ends_at": self.ends_at.isoformat() if self.ends_at else None,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "halt_signature_count": len(self.halt_signatures),
            "halted_at": self.halted_at.isoformat() if self.halted_at else None,
            "halt_reason": self.halt_reason,
            "extensions": self.extensions,
        }


class TimelockManager:
    """
    Manages timelocks for governance proposals.

    Features:
    - Mandatory waiting periods before enactment
    - Emergency halt mechanism
    - Extension requests for additional review
    - Transparent countdown

    Usage:
        manager = TimelockManager(config)

        # Create timelock after proposal approval
        timelock = manager.create_timelock(
            proposal_id="prop_123",
            duration_days=14
        )

        # Start the timelock
        manager.start_timelock(timelock.id)

        # Check status
        if timelock.is_ready():
            # Can execute the proposal
            manager.execute(timelock.id)

        # Emergency halt
        manager.sign_halt(timelock.id, user_id, reason="Security concern")
        if manager.check_halt_threshold(timelock.id, total_users):
            manager.halt_timelock(timelock.id)
    """

    def __init__(self, config: TimelockConfig = None):
        self.config = config or TimelockConfig()
        self._timelocks: Dict[str, Timelock] = {}
        self._proposal_timelocks: Dict[str, str] = {}  # proposal_id -> timelock_id

    def create_timelock(
        self,
        proposal_id: str,
        duration_days: int = None,
        category: str = None
    ) -> Timelock:
        """
        Create a new timelock for a proposal.

        Args:
            proposal_id: ID of the approved proposal
            duration_days: Override duration (uses category default if not provided)
            category: Proposal category for default duration
        """
        # Determine duration
        if duration_days is None:
            if category == "minor":
                duration_days = self.config.minor_days
            elif category == "major":
                duration_days = self.config.major_days
            elif category == "constitutional":
                duration_days = self.config.constitutional_days
            else:
                duration_days = self.config.standard_days

        timelock = Timelock(
            id=str(uuid.uuid4()),
            proposal_id=proposal_id,
            status=TimelockStatus.PENDING,
            duration_days=duration_days,
            created_at=datetime.utcnow(),
        )

        self._timelocks[timelock.id] = timelock
        self._proposal_timelocks[proposal_id] = timelock.id

        return timelock

    def start_timelock(self, timelock_id: str) -> Timelock:
        """Start the countdown on a timelock."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if timelock.status != TimelockStatus.PENDING:
            raise ValueError(f"Timelock is not pending: {timelock.status.value}")

        now = datetime.utcnow()
        timelock.starts_at = now
        timelock.ends_at = now + timedelta(days=timelock.duration_days)
        timelock.status = TimelockStatus.ACTIVE

        return timelock

    def get_timelock(self, timelock_id: str) -> Optional[Timelock]:
        """Get a timelock by ID."""
        return self._timelocks.get(timelock_id)

    def get_proposal_timelock(self, proposal_id: str) -> Optional[Timelock]:
        """Get the timelock for a proposal."""
        timelock_id = self._proposal_timelocks.get(proposal_id)
        if timelock_id:
            return self._timelocks.get(timelock_id)
        return None

    def check_ready(self, timelock_id: str) -> bool:
        """Check if a timelock is ready for execution."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            return False

        # Update status if time has elapsed
        if timelock.status == TimelockStatus.ACTIVE:
            if datetime.utcnow() >= timelock.ends_at:
                timelock.status = TimelockStatus.READY

        return timelock.status == TimelockStatus.READY

    def execute(self, timelock_id: str) -> Timelock:
        """Mark a timelock as executed."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if not self.check_ready(timelock_id):
            raise ValueError(
                f"Timelock not ready for execution: {timelock.status.value}"
            )

        timelock.status = TimelockStatus.EXECUTED
        timelock.executed_at = datetime.utcnow()

        return timelock

    # Emergency Halt System

    def sign_halt(
        self,
        timelock_id: str,
        user_id: str,
        reason: str = None
    ) -> int:
        """
        Sign a halt request for a timelock.

        Returns the current number of halt signatures.
        """
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if timelock.status not in [TimelockStatus.ACTIVE, TimelockStatus.PENDING]:
            raise ValueError("Cannot halt a timelock that is not active")

        # Add signature if not already signed
        if user_id not in timelock.halt_signatures:
            timelock.halt_signatures.append(user_id)
            if reason and not timelock.halt_reason:
                timelock.halt_reason = reason

        return len(timelock.halt_signatures)

    def unsign_halt(self, timelock_id: str, user_id: str) -> int:
        """Remove a halt signature."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if user_id in timelock.halt_signatures:
            timelock.halt_signatures.remove(user_id)

        return len(timelock.halt_signatures)

    def check_halt_threshold(
        self,
        timelock_id: str,
        total_eligible_users: int
    ) -> bool:
        """Check if halt threshold has been reached."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            return False

        signature_count = len(timelock.halt_signatures)

        # Must meet minimum signers
        if signature_count < self.config.min_halt_signers:
            return False

        # Check percentage threshold
        if total_eligible_users > 0:
            percentage = signature_count / total_eligible_users
            return percentage >= self.config.emergency_halt_threshold

        return False

    def halt_timelock(self, timelock_id: str, reason: str = None) -> Timelock:
        """Trigger an emergency halt on a timelock."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if timelock.status not in [TimelockStatus.ACTIVE, TimelockStatus.PENDING]:
            raise ValueError("Cannot halt a timelock that is not active")

        timelock.status = TimelockStatus.HALTED
        timelock.halted_at = datetime.utcnow()
        if reason:
            timelock.halt_reason = reason

        return timelock

    # Extensions

    def request_extension(
        self,
        timelock_id: str,
        additional_days: int,
        reason: str,
        requester_id: str
    ) -> Timelock:
        """
        Request an extension to the timelock period.

        Extensions require guardian approval (handled separately).
        """
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if timelock.status != TimelockStatus.ACTIVE:
            raise ValueError("Can only extend active timelocks")

        # Check max extension
        total_extensions = sum(e.get("days", 0) for e in timelock.extensions)
        if total_extensions + additional_days > self.config.max_extension_days:
            raise ValueError(
                f"Extension would exceed maximum of {self.config.max_extension_days} days"
            )

        extension = {
            "days": additional_days,
            "reason": reason,
            "requester_id": requester_id,
            "requested_at": datetime.utcnow().isoformat(),
            "approved": False,
        }

        timelock.extensions.append(extension)
        return timelock

    def approve_extension(
        self,
        timelock_id: str,
        extension_index: int
    ) -> Timelock:
        """Approve a pending extension."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        if extension_index >= len(timelock.extensions):
            raise ValueError("Extension not found")

        extension = timelock.extensions[extension_index]
        if extension.get("approved"):
            raise ValueError("Extension already approved")

        # Apply extension
        extension["approved"] = True
        extension["approved_at"] = datetime.utcnow().isoformat()

        # Extend the timelock
        additional_days = extension["days"]
        timelock.ends_at += timedelta(days=additional_days)

        return timelock

    def cancel_timelock(self, timelock_id: str, reason: str = None) -> Timelock:
        """Cancel a timelock (proposal withdrawn or rejected)."""
        timelock = self._timelocks.get(timelock_id)
        if not timelock:
            raise ValueError(f"Timelock not found: {timelock_id}")

        timelock.status = TimelockStatus.CANCELLED
        return timelock

    def get_active_timelocks(self) -> List[Timelock]:
        """Get all active timelocks."""
        return [
            t for t in self._timelocks.values()
            if t.status in [TimelockStatus.PENDING, TimelockStatus.ACTIVE]
        ]

    def get_ready_timelocks(self) -> List[Timelock]:
        """Get all timelocks ready for execution."""
        ready = []
        for timelock in self._timelocks.values():
            if self.check_ready(timelock.id):
                ready.append(timelock)
        return ready
