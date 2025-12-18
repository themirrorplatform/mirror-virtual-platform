"""
Reflection Pipeline

Coordinates the flow from user input to expressed reflection:

1. Input → Pre-processing (constitutional check)
2. Recognition → Pattern detection (L1)
3. Analysis → Tension surfacing (L2)
4. Expression → Tone adaptation (L3)
5. Output → Leave-ability check

Each stage has constitutional gates that can halt the pipeline.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Callable
from datetime import datetime
from enum import Enum
import asyncio


class PipelineStage(Enum):
    """Stages of the reflection pipeline."""
    INPUT = "input"  # User input received
    PREPROCESS = "preprocess"  # Constitutional pre-check
    RECOGNITION = "recognition"  # Pattern recognition (L1)
    ANALYSIS = "analysis"  # Tension detection (L2)
    EXPRESSION = "expression"  # Tone adaptation (L3)
    LEAVEABILITY = "leaveability"  # Leave-ability check
    OUTPUT = "output"  # Final output


class PipelineStatus(Enum):
    """Status of pipeline execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    HALTED = "halted"  # Constitutional halt
    FAILED = "failed"


@dataclass
class StageResult:
    """Result from a pipeline stage."""
    stage: PipelineStage
    status: PipelineStatus
    data: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    error: Optional[str] = None
    constitutional_halt: bool = False
    halt_reason: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "stage": self.stage.value,
            "status": self.status.value,
            "duration_ms": self.duration_ms,
            "error": self.error,
            "constitutional_halt": self.constitutional_halt,
            "halt_reason": self.halt_reason,
        }


@dataclass
class PipelineResult:
    """Complete result of pipeline execution."""
    id: str
    status: PipelineStatus
    stages: List[StageResult] = field(default_factory=list)

    # Final outputs
    reflection_text: Optional[str] = None
    patterns_detected: List[str] = field(default_factory=list)
    tensions_detected: List[str] = field(default_factory=list)

    # Leave-ability
    break_suggested: bool = False
    break_message: Optional[str] = None

    # Metadata
    total_duration_ms: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def get_stage_result(self, stage: PipelineStage) -> Optional[StageResult]:
        """Get result for a specific stage."""
        for sr in self.stages:
            if sr.stage == stage:
                return sr
        return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status.value,
            "stages": [s.to_dict() for s in self.stages],
            "reflection_text": self.reflection_text,
            "patterns_detected": self.patterns_detected,
            "tensions_detected": self.tensions_detected,
            "break_suggested": self.break_suggested,
            "break_message": self.break_message,
            "total_duration_ms": self.total_duration_ms,
        }


class PipelineContext:
    """Context passed through pipeline stages."""

    def __init__(
        self,
        user_id: str,
        session_id: str,
        user_input: str,
        metadata: Dict[str, Any] = None
    ):
        self.user_id = user_id
        self.session_id = session_id
        self.user_input = user_input
        self.metadata = metadata or {}

        # Accumulated data
        self.patterns: List[Dict] = []
        self.tensions: List[Dict] = []
        self.reflection_content: str = ""
        self.expressed_text: str = ""

        # Leave-ability
        self.break_suggested: bool = False
        self.break_message: Optional[str] = None

        # Session metrics (populated by orchestrator)
        self.session_duration_minutes: float = 0.0
        self.session_message_count: int = 0


class ReflectionPipeline:
    """
    The core reflection pipeline.

    Coordinates pattern recognition, tension detection, and expression.
    Each stage is independently testable and has constitutional gates.

    Usage:
        pipeline = ReflectionPipeline()

        # Register stage handlers
        pipeline.register_stage(PipelineStage.RECOGNITION, pattern_recognizer)
        pipeline.register_stage(PipelineStage.ANALYSIS, tension_detector)
        pipeline.register_stage(PipelineStage.EXPRESSION, expression_engine)

        # Execute pipeline
        result = await pipeline.execute(context)
    """

    def __init__(self):
        self._stage_handlers: Dict[PipelineStage, Callable] = {}
        self._pre_hooks: List[Callable] = []
        self._post_hooks: List[Callable] = []

    def register_stage(
        self,
        stage: PipelineStage,
        handler: Callable
    ):
        """
        Register a handler for a pipeline stage.

        Handler signature: async def handler(context: PipelineContext) -> StageResult
        """
        self._stage_handlers[stage] = handler

    def add_pre_hook(self, hook: Callable):
        """Add a hook that runs before each stage."""
        self._pre_hooks.append(hook)

    def add_post_hook(self, hook: Callable):
        """Add a hook that runs after each stage."""
        self._post_hooks.append(hook)

    async def execute(
        self,
        context: PipelineContext,
        pipeline_id: str = None
    ) -> PipelineResult:
        """
        Execute the full pipeline.

        Runs through all stages in order, respecting constitutional halts.
        """
        import uuid

        result = PipelineResult(
            id=pipeline_id or str(uuid.uuid4()),
            status=PipelineStatus.RUNNING,
            started_at=datetime.utcnow(),
        )

        # Define stage order
        stage_order = [
            PipelineStage.INPUT,
            PipelineStage.PREPROCESS,
            PipelineStage.RECOGNITION,
            PipelineStage.ANALYSIS,
            PipelineStage.EXPRESSION,
            PipelineStage.LEAVEABILITY,
            PipelineStage.OUTPUT,
        ]

        try:
            for stage in stage_order:
                # Run pre-hooks
                for hook in self._pre_hooks:
                    await self._safe_call(hook, stage, context)

                # Execute stage
                stage_result = await self._execute_stage(stage, context)
                result.stages.append(stage_result)

                # Run post-hooks
                for hook in self._post_hooks:
                    await self._safe_call(hook, stage, context, stage_result)

                # Check for halt
                if stage_result.constitutional_halt:
                    result.status = PipelineStatus.HALTED
                    break

                if stage_result.status == PipelineStatus.FAILED:
                    result.status = PipelineStatus.FAILED
                    break

            # Pipeline completed
            if result.status == PipelineStatus.RUNNING:
                result.status = PipelineStatus.COMPLETED

            # Collect final outputs
            result.reflection_text = context.expressed_text
            result.patterns_detected = [p.get("id", str(i)) for i, p in enumerate(context.patterns)]
            result.tensions_detected = [t.get("id", str(i)) for i, t in enumerate(context.tensions)]
            result.break_suggested = context.break_suggested
            result.break_message = context.break_message

        except Exception as e:
            result.status = PipelineStatus.FAILED
            result.stages.append(StageResult(
                stage=PipelineStage.OUTPUT,
                status=PipelineStatus.FAILED,
                error=str(e),
            ))

        result.completed_at = datetime.utcnow()
        result.total_duration_ms = (
            result.completed_at - result.started_at
        ).total_seconds() * 1000

        return result

    async def _execute_stage(
        self,
        stage: PipelineStage,
        context: PipelineContext
    ) -> StageResult:
        """Execute a single pipeline stage."""
        start_time = datetime.utcnow()

        handler = self._stage_handlers.get(stage)
        if not handler:
            # Use default handler
            handler = self._get_default_handler(stage)

        try:
            result = await handler(context)
            if not isinstance(result, StageResult):
                result = StageResult(
                    stage=stage,
                    status=PipelineStatus.COMPLETED,
                    data=result if isinstance(result, dict) else {},
                )
        except Exception as e:
            result = StageResult(
                stage=stage,
                status=PipelineStatus.FAILED,
                error=str(e),
            )

        end_time = datetime.utcnow()
        result.duration_ms = (end_time - start_time).total_seconds() * 1000

        return result

    def _get_default_handler(self, stage: PipelineStage) -> Callable:
        """Get default handler for a stage."""
        async def default_handler(context: PipelineContext) -> StageResult:
            return StageResult(
                stage=stage,
                status=PipelineStatus.COMPLETED,
            )
        return default_handler

    async def _safe_call(self, func: Callable, *args, **kwargs):
        """Safely call a function, handling errors."""
        try:
            if asyncio.iscoroutinefunction(func):
                await func(*args, **kwargs)
            else:
                func(*args, **kwargs)
        except Exception:
            pass  # Hooks shouldn't break pipeline


# Default stage handlers

async def default_input_handler(context: PipelineContext) -> StageResult:
    """Default handler for input stage."""
    # Just validates input exists
    if not context.user_input or not context.user_input.strip():
        return StageResult(
            stage=PipelineStage.INPUT,
            status=PipelineStatus.HALTED,
            constitutional_halt=True,
            halt_reason="No user input provided (Axiom 5: Post-action)",
        )

    return StageResult(
        stage=PipelineStage.INPUT,
        status=PipelineStatus.COMPLETED,
        data={"input_length": len(context.user_input)},
    )


async def default_preprocess_handler(context: PipelineContext) -> StageResult:
    """Default handler for preprocessing stage."""
    # Constitutional pre-checks
    # Check for signs that user wants to leave
    exit_phrases = ["goodbye", "bye", "stop", "end", "quit", "leave"]
    input_lower = context.user_input.lower()

    if any(phrase in input_lower for phrase in exit_phrases):
        return StageResult(
            stage=PipelineStage.PREPROCESS,
            status=PipelineStatus.COMPLETED,
            data={"exit_intent_detected": True},
        )

    return StageResult(
        stage=PipelineStage.PREPROCESS,
        status=PipelineStatus.COMPLETED,
        data={"exit_intent_detected": False},
    )


async def default_recognition_handler(context: PipelineContext) -> StageResult:
    """Default handler for recognition stage."""
    # Placeholder - would integrate with mirror-recognition
    return StageResult(
        stage=PipelineStage.RECOGNITION,
        status=PipelineStatus.COMPLETED,
        data={"patterns_found": 0},
    )


async def default_analysis_handler(context: PipelineContext) -> StageResult:
    """Default handler for analysis stage."""
    # Placeholder - would integrate with mirror-recognition tensions
    return StageResult(
        stage=PipelineStage.ANALYSIS,
        status=PipelineStatus.COMPLETED,
        data={"tensions_found": 0},
    )


async def default_expression_handler(context: PipelineContext) -> StageResult:
    """Default handler for expression stage."""
    # Placeholder - would integrate with mirror-expression
    # Generate a simple reflection
    context.expressed_text = (
        "I notice something in what you've shared. "
        "Would you like to explore this further?"
    )

    return StageResult(
        stage=PipelineStage.EXPRESSION,
        status=PipelineStatus.COMPLETED,
    )


async def default_leaveability_handler(context: PipelineContext) -> StageResult:
    """Default handler for leave-ability stage."""
    # Check if break should be suggested
    if context.session_duration_minutes >= 45:
        context.break_suggested = True
        context.break_message = (
            "You've been reflecting for a while. "
            "It might be good to take a break."
        )

    return StageResult(
        stage=PipelineStage.LEAVEABILITY,
        status=PipelineStatus.COMPLETED,
        data={
            "break_suggested": context.break_suggested,
        },
    )


async def default_output_handler(context: PipelineContext) -> StageResult:
    """Default handler for output stage."""
    # Final assembly
    return StageResult(
        stage=PipelineStage.OUTPUT,
        status=PipelineStatus.COMPLETED,
        data={
            "output_length": len(context.expressed_text),
        },
    )


def create_default_pipeline() -> ReflectionPipeline:
    """Create a pipeline with default handlers."""
    pipeline = ReflectionPipeline()

    pipeline.register_stage(PipelineStage.INPUT, default_input_handler)
    pipeline.register_stage(PipelineStage.PREPROCESS, default_preprocess_handler)
    pipeline.register_stage(PipelineStage.RECOGNITION, default_recognition_handler)
    pipeline.register_stage(PipelineStage.ANALYSIS, default_analysis_handler)
    pipeline.register_stage(PipelineStage.EXPRESSION, default_expression_handler)
    pipeline.register_stage(PipelineStage.LEAVEABILITY, default_leaveability_handler)
    pipeline.register_stage(PipelineStage.OUTPUT, default_output_handler)

    return pipeline
