"""
Tests for identity and fork management.

Covers:
- Fork legitimacy
- Exit rights
"""

import pytest
from datetime import datetime

from ..identity.fork import (
    ForkManager,
    Fork,
    ForkType,
    ForkLegitimacy,
)
from ..identity.exit_rights import (
    ExitRightsManager,
    ExitRequest,
    ExitResult,
    ExitType,
    ExitStatus,
)


class TestForkManager:
    """Test fork legitimacy management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.root_constitution = {
            "axioms": {
                "certainty": {"description": "Mirror does not convince"},
                "sovereignty": {"description": "User has final say"},
                "manipulation": {"description": "No dark patterns"},
                "diagnosis": {"description": "Never diagnose"},
                "post_action": {"description": "Activated after user action"},
                "necessity": {"description": "Minimal necessary analysis"},
                "exit_freedom": {"description": "User can always leave"},
                "departure_inference": {"description": "No inference from departure"},
                "advice": {"description": "Never prescriptive advice"},
                "context_collapse": {"description": "Private stays private"},
                "certainty_self": {"description": "No AI certainty claims"},
                "optimization": {"description": "No behavior optimization"},
                "coercion": {"description": "No pressure tactics"},
                "capture": {"description": "No psychological capture"},
            },
            "invariants": {
                "user_control": {
                    "constraints": ["user_can_delete", "user_can_export"],
                },
            },
            "governance": {
                "allows_exit": True,
            },
        }
        self.manager = ForkManager(self.root_constitution)

    def test_root_fork_registered(self):
        """Test that root fork is automatically registered."""
        root = self.manager.get_fork("root")

        assert root is not None
        assert root.legitimacy == ForkLegitimacy.LEGITIMATE
        assert root.name == "Mirror"

    def test_legitimate_fork(self):
        """Test registering a legitimate fork."""
        fork_constitution = {**self.root_constitution}
        # Strengthen an invariant (allowed)
        fork_constitution["invariants"]["user_control"]["constraints"].append("user_can_pause")

        fork = self.manager.register_fork(
            name="Mirror Enhanced",
            constitution=fork_constitution,
            description="Fork with stronger user control"
        )

        assert fork.legitimacy == ForkLegitimacy.LEGITIMATE
        assert fork.axioms_preserved
        assert fork.allows_exit

    def test_illegitimate_fork_missing_axiom(self):
        """Test that fork missing axiom is illegitimate."""
        fork_constitution = {**self.root_constitution}
        del fork_constitution["axioms"]["sovereignty"]  # Remove an axiom

        fork = self.manager.register_fork(
            name="Bad Fork",
            constitution=fork_constitution,
        )

        assert fork.legitimacy == ForkLegitimacy.ILLEGITIMATE
        assert not fork.axioms_preserved
        assert fork.fork_type == ForkType.HOSTILE

    def test_illegitimate_fork_no_exit(self):
        """Test that fork blocking exit is illegitimate."""
        fork_constitution = {**self.root_constitution}
        fork_constitution["governance"]["allows_exit"] = False

        fork = self.manager.register_fork(
            name="Hotel California",
            constitution=fork_constitution,
        )

        assert fork.legitimacy == ForkLegitimacy.ILLEGITIMATE
        assert not fork.allows_exit

    def test_illegitimate_fork_weakened_invariant(self):
        """Test that fork weakening invariant is illegitimate."""
        fork_constitution = {**self.root_constitution}
        # Remove a constraint (weakening)
        fork_constitution["invariants"]["user_control"]["constraints"] = ["user_can_delete"]
        # Removed user_can_export

        fork = self.manager.register_fork(
            name="Weakened Fork",
            constitution=fork_constitution,
        )

        assert fork.legitimacy == ForkLegitimacy.ILLEGITIMATE
        assert not fork.invariants_only_strengthened

    def test_get_legitimate_forks(self):
        """Test getting only legitimate forks."""
        # Register one good and one bad fork
        good_constitution = {**self.root_constitution}
        bad_constitution = {**self.root_constitution}
        del bad_constitution["axioms"]["sovereignty"]

        self.manager.register_fork("Good Fork", good_constitution)
        self.manager.register_fork("Bad Fork", bad_constitution)

        legitimate = self.manager.get_legitimate_forks()

        # Root + Good Fork
        assert len(legitimate) == 2
        assert all(f.legitimacy in [ForkLegitimacy.LEGITIMATE, ForkLegitimacy.CONDITIONAL] for f in legitimate)

    def test_fork_lineage(self):
        """Test getting fork lineage."""
        fork1 = self.manager.register_fork(
            name="Fork 1",
            constitution=self.root_constitution,
            parent_fork_id="root"
        )

        fork2 = self.manager.register_fork(
            name="Fork 2",
            constitution=self.root_constitution,
            parent_fork_id=fork1.id
        )

        lineage = self.manager.get_fork_lineage(fork2.id)

        assert len(lineage) == 3  # root -> fork1 -> fork2
        assert lineage[0].id == "root"
        assert lineage[-1].id == fork2.id

    def test_migration_compatibility(self):
        """Test checking migration compatibility between forks."""
        good_fork = self.manager.register_fork(
            name="Good Fork",
            constitution=self.root_constitution,
        )

        bad_constitution = {**self.root_constitution}
        del bad_constitution["axioms"]["sovereignty"]
        bad_fork = self.manager.register_fork(
            name="Bad Fork",
            constitution=bad_constitution,
        )

        # Can migrate to legitimate fork
        compatible, issues = self.manager.verify_fork_compatibility("root", good_fork.id)
        assert compatible

        # Cannot migrate to illegitimate fork
        compatible, issues = self.manager.verify_fork_compatibility("root", bad_fork.id)
        assert not compatible


class TestExitRights:
    """Test exit rights management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.manager = ExitRightsManager()

    @pytest.mark.asyncio
    async def test_request_exit(self):
        """Test requesting an exit."""
        request = await self.manager.request_exit(
            user_id="user_001",
            exit_type=ExitType.COMPLETE,
            reason="Moving to another platform"
        )

        assert request.id is not None
        assert request.user_id == "user_001"
        assert request.exit_type == ExitType.COMPLETE
        assert request.status == ExitStatus.REQUESTED

    @pytest.mark.asyncio
    async def test_exit_types(self):
        """Test different exit types."""
        complete = await self.manager.request_exit("user_1", ExitType.COMPLETE)
        migrate = await self.manager.request_exit("user_2", ExitType.MIGRATE, destination_fork_id="fork_123")
        pause = await self.manager.request_exit("user_3", ExitType.PAUSE)
        data_only = await self.manager.request_exit("user_4", ExitType.DATA_ONLY)

        assert complete.exit_type == ExitType.COMPLETE
        assert migrate.exit_type == ExitType.MIGRATE
        assert pause.exit_type == ExitType.PAUSE
        assert data_only.exit_type == ExitType.DATA_ONLY

    @pytest.mark.asyncio
    async def test_prepare_export(self):
        """Test preparing data export."""
        request = await self.manager.request_exit("user_001", ExitType.COMPLETE)
        prepared = await self.manager.prepare_export(request.id)

        assert prepared.status == ExitStatus.READY
        assert prepared.export_ready_at is not None
        assert prepared.export_expires_at is not None

    @pytest.mark.asyncio
    async def test_complete_exit(self):
        """Test completing an exit."""
        request = await self.manager.request_exit("user_001", ExitType.COMPLETE)
        await self.manager.prepare_export(request.id)
        result = await self.manager.complete_exit(request.id)

        assert result.success
        assert result.exit_type == ExitType.COMPLETE

        # Request should be marked completed
        updated = self.manager.get_request(request.id)
        assert updated.status == ExitStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_cancel_exit(self):
        """Test cancelling an exit request."""
        request = await self.manager.request_exit("user_001", ExitType.COMPLETE)
        cancelled = await self.manager.cancel_exit(request.id)

        assert cancelled.status == ExitStatus.CANCELLED

    @pytest.mark.asyncio
    async def test_cannot_cancel_completed_exit(self):
        """Test that completed exits cannot be cancelled."""
        request = await self.manager.request_exit("user_001", ExitType.COMPLETE)
        await self.manager.prepare_export(request.id)
        await self.manager.complete_exit(request.id)

        with pytest.raises(ValueError, match="Cannot cancel completed"):
            await self.manager.cancel_exit(request.id)

    @pytest.mark.asyncio
    async def test_get_user_requests(self):
        """Test getting all requests for a user."""
        await self.manager.request_exit("user_001", ExitType.PAUSE)
        await self.manager.request_exit("user_001", ExitType.DATA_ONLY)
        await self.manager.request_exit("user_002", ExitType.COMPLETE)

        user1_requests = self.manager.get_user_requests("user_001")
        assert len(user1_requests) == 2

        user2_requests = self.manager.get_user_requests("user_002")
        assert len(user2_requests) == 1

    @pytest.mark.asyncio
    async def test_exit_freedom_verification(self):
        """Test exit freedom compliance report."""
        # Create and complete some requests
        r1 = await self.manager.request_exit("user_001", ExitType.COMPLETE)
        await self.manager.prepare_export(r1.id)
        await self.manager.complete_exit(r1.id)

        r2 = await self.manager.request_exit("user_002", ExitType.COMPLETE)
        await self.manager.cancel_exit(r2.id)

        report = self.manager.verify_exit_freedom()

        assert report["total_requests"] == 2
        assert report["completed"] == 1
        assert report["cancelled"] == 1
        assert report["exit_freedom_compliant"] is True

    @pytest.mark.asyncio
    async def test_exit_statistics(self):
        """Test exit statistics."""
        await self.manager.request_exit("user_001", ExitType.COMPLETE)
        await self.manager.request_exit("user_002", ExitType.MIGRATE)
        await self.manager.request_exit("user_003", ExitType.MIGRATE)
        await self.manager.request_exit("user_004", ExitType.PAUSE)

        stats = self.manager.get_exit_statistics()

        assert stats["total"] == 4
        assert stats["by_type"]["migrate"] == 2
        assert stats["by_type"]["complete"] == 1
        assert stats["by_type"]["pause"] == 1
