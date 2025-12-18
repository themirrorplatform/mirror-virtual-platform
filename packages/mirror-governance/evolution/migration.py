"""
Constitution Migration

Manages transitions between constitution versions.
Ensures safe, reversible migrations with validation.

Key properties:
1. Atomic migrations - all-or-nothing
2. Validation at each step
3. Rollback capability
4. Audit trail
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Callable
from datetime import datetime
from enum import Enum
import copy


class MigrationStatus(Enum):
    """Status of a migration."""
    PENDING = "pending"
    VALIDATING = "validating"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class MigrationStep:
    """A single step in a migration."""
    name: str
    description: str
    transform: Callable[[Dict], Dict]  # Content transformation function
    validate: Callable[[Dict], bool] = None  # Optional validation
    rollback: Callable[[Dict], Dict] = None  # Rollback function

    executed: bool = False
    succeeded: bool = False
    error: Optional[str] = None


@dataclass
class Migration:
    """A migration between constitution versions."""
    id: str
    from_version: str
    to_version: str
    description: str
    steps: List[MigrationStep] = field(default_factory=list)

    # Status tracking
    status: MigrationStatus = MigrationStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_step: int = 0

    # Snapshots for rollback
    pre_migration_snapshot: Optional[Dict] = None
    step_snapshots: List[Dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "from_version": self.from_version,
            "to_version": self.to_version,
            "description": self.description,
            "status": self.status.value,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "current_step": self.current_step,
            "total_steps": len(self.steps),
            "steps": [
                {
                    "name": s.name,
                    "description": s.description,
                    "executed": s.executed,
                    "succeeded": s.succeeded,
                    "error": s.error,
                }
                for s in self.steps
            ],
        }


@dataclass
class MigrationResult:
    """Result of a migration execution."""
    success: bool
    migration_id: str
    from_version: str
    to_version: str
    steps_completed: int
    total_steps: int
    final_content: Optional[Dict] = None
    errors: List[str] = field(default_factory=list)
    rolled_back: bool = False

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "migration_id": self.migration_id,
            "from_version": self.from_version,
            "to_version": self.to_version,
            "steps_completed": self.steps_completed,
            "total_steps": self.total_steps,
            "errors": self.errors,
            "rolled_back": self.rolled_back,
        }


class MigrationEngine:
    """
    Executes constitution migrations.

    Provides:
    - Safe, atomic migrations
    - Step-by-step validation
    - Automatic rollback on failure
    - Dry-run capability

    Usage:
        engine = MigrationEngine()

        # Create migration
        migration = Migration(
            id="mig_001",
            from_version="1.0.0",
            to_version="1.1.0",
            description="Add new invariant",
            steps=[
                MigrationStep(
                    name="add_invariant",
                    description="Add transparency invariant",
                    transform=lambda c: {**c, "invariants": {**c.get("invariants", {}), "transparency": {...}}},
                ),
            ]
        )

        # Dry run first
        result = engine.dry_run(migration, current_content)
        if result.success:
            # Execute for real
            result = engine.execute(migration, current_content)
    """

    def __init__(self):
        self._migrations: Dict[str, Migration] = {}
        self._history: List[str] = []  # Order of executed migrations

    def register_migration(self, migration: Migration):
        """Register a migration for later execution."""
        self._migrations[migration.id] = migration

    def get_migration(self, migration_id: str) -> Optional[Migration]:
        """Get a registered migration."""
        return self._migrations.get(migration_id)

    def dry_run(
        self,
        migration: Migration,
        content: Dict[str, Any]
    ) -> MigrationResult:
        """
        Execute migration in dry-run mode.

        Validates all steps without modifying actual content.
        """
        return self._execute_migration(
            migration,
            content,
            dry_run=True
        )

    def execute(
        self,
        migration: Migration,
        content: Dict[str, Any],
        auto_rollback: bool = True
    ) -> MigrationResult:
        """
        Execute a migration.

        Args:
            migration: The migration to execute
            content: Current constitution content
            auto_rollback: Automatically rollback on failure
        """
        return self._execute_migration(
            migration,
            content,
            dry_run=False,
            auto_rollback=auto_rollback
        )

    def _execute_migration(
        self,
        migration: Migration,
        content: Dict[str, Any],
        dry_run: bool = False,
        auto_rollback: bool = True
    ) -> MigrationResult:
        """Internal migration execution."""
        result = MigrationResult(
            success=False,
            migration_id=migration.id,
            from_version=migration.from_version,
            to_version=migration.to_version,
            steps_completed=0,
            total_steps=len(migration.steps),
        )

        # Take pre-migration snapshot
        working_content = copy.deepcopy(content)
        migration.pre_migration_snapshot = copy.deepcopy(content)
        migration.step_snapshots = []

        if not dry_run:
            migration.status = MigrationStatus.IN_PROGRESS
            migration.started_at = datetime.utcnow()

        try:
            # Execute each step
            for i, step in enumerate(migration.steps):
                migration.current_step = i

                # Take snapshot before step
                migration.step_snapshots.append(copy.deepcopy(working_content))

                # Run validation if present
                if step.validate:
                    if not step.validate(working_content):
                        raise ValueError(
                            f"Pre-step validation failed for step {i}: {step.name}"
                        )

                # Execute transform
                try:
                    working_content = step.transform(working_content)
                    step.executed = True
                    step.succeeded = True
                    result.steps_completed += 1
                except Exception as e:
                    step.executed = True
                    step.succeeded = False
                    step.error = str(e)
                    raise

            # All steps completed
            result.success = True
            result.final_content = working_content

            if not dry_run:
                migration.status = MigrationStatus.COMPLETED
                migration.completed_at = datetime.utcnow()
                self._history.append(migration.id)

        except Exception as e:
            result.errors.append(str(e))

            if not dry_run:
                migration.status = MigrationStatus.FAILED

                if auto_rollback:
                    # Attempt rollback
                    rollback_result = self._rollback_migration(migration)
                    result.rolled_back = rollback_result
                    if rollback_result:
                        result.final_content = migration.pre_migration_snapshot
                        migration.status = MigrationStatus.ROLLED_BACK

        return result

    def _rollback_migration(self, migration: Migration) -> bool:
        """
        Rollback a failed migration.

        Executes rollback functions in reverse order.
        """
        try:
            # Start from the last completed step
            for i in range(migration.current_step, -1, -1):
                step = migration.steps[i]
                if step.executed and step.rollback:
                    snapshot = migration.step_snapshots[i]
                    step.rollback(snapshot)

            return True
        except Exception:
            return False

    def validate_migration(
        self,
        migration: Migration,
        from_content: Dict[str, Any]
    ) -> List[str]:
        """
        Validate a migration without executing.

        Returns list of validation errors.
        """
        errors = []

        # Check migration structure
        if not migration.steps:
            errors.append("Migration has no steps")

        if not migration.from_version:
            errors.append("Missing from_version")

        if not migration.to_version:
            errors.append("Missing to_version")

        # Try a dry run
        result = self.dry_run(migration, from_content)
        if not result.success:
            errors.extend(result.errors)

        return errors

    def create_simple_migration(
        self,
        migration_id: str,
        from_version: str,
        to_version: str,
        description: str,
        changes: Dict[str, Any]
    ) -> Migration:
        """
        Create a simple migration that applies a set of changes.

        Args:
            migration_id: Unique identifier
            from_version: Source version
            to_version: Target version
            description: Human-readable description
            changes: Dictionary of changes to apply (path -> new_value)
        """
        def make_transform(path: str, value: Any):
            def transform(content: Dict) -> Dict:
                result = copy.deepcopy(content)
                parts = path.split(".")
                target = result
                for part in parts[:-1]:
                    if part not in target:
                        target[part] = {}
                    target = target[part]
                target[parts[-1]] = value
                return result
            return transform

        steps = []
        for path, value in changes.items():
            steps.append(MigrationStep(
                name=f"set_{path.replace('.', '_')}",
                description=f"Set {path} to new value",
                transform=make_transform(path, value),
            ))

        migration = Migration(
            id=migration_id,
            from_version=from_version,
            to_version=to_version,
            description=description,
            steps=steps,
        )

        self.register_migration(migration)
        return migration

    def create_invariant_strengthening_migration(
        self,
        migration_id: str,
        from_version: str,
        to_version: str,
        invariant_name: str,
        new_constraints: List[str]
    ) -> Migration:
        """
        Create a migration that strengthens an invariant.

        Only allows ADDING constraints, never removing.
        """
        def strengthen_invariant(content: Dict) -> Dict:
            result = copy.deepcopy(content)
            invariants = result.setdefault("invariants", {})
            invariant = invariants.setdefault(invariant_name, {"constraints": []})

            existing = set(invariant.get("constraints", []))
            for constraint in new_constraints:
                if constraint not in existing:
                    invariant.setdefault("constraints", []).append(constraint)

            return result

        def validate_strengthening(content: Dict) -> bool:
            # Ensure we're only adding, never removing
            invariants = content.get("invariants", {})
            invariant = invariants.get(invariant_name, {})
            existing = set(invariant.get("constraints", []))

            # This is pre-transform, so just check structure
            return isinstance(invariant.get("constraints", []), list)

        migration = Migration(
            id=migration_id,
            from_version=from_version,
            to_version=to_version,
            description=f"Strengthen invariant: {invariant_name}",
            steps=[
                MigrationStep(
                    name=f"strengthen_{invariant_name}",
                    description=f"Add constraints to {invariant_name}",
                    transform=strengthen_invariant,
                    validate=validate_strengthening,
                ),
            ],
        )

        self.register_migration(migration)
        return migration

    def get_migration_history(self) -> List[Migration]:
        """Get list of executed migrations in order."""
        return [self._migrations[mid] for mid in self._history if mid in self._migrations]

    def get_pending_migrations(
        self,
        current_version: str,
        target_version: str = None
    ) -> List[Migration]:
        """
        Get migrations needed to reach target version.

        If target_version is None, returns all migrations after current.
        """
        pending = []
        for migration in self._migrations.values():
            if migration.status == MigrationStatus.PENDING:
                if migration.from_version == current_version:
                    pending.append(migration)
                    if target_version and migration.to_version == target_version:
                        break
                    current_version = migration.to_version

        return pending
