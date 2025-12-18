"""
Tests for reflection pipeline.
"""

import pytest
from ..pipeline import (
    ReflectionPipeline,
    PipelineContext,
    PipelineResult,
    PipelineStage,
    StageResult,
    PipelineStatus,
    create_default_pipeline,
    default_input_handler,
    default_preprocess_handler,
)


class TestPipelineContext:
    """Test pipeline context."""

    def test_create_context(self):
        """Test creating a pipeline context."""
        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello, I want to reflect.",
        )

        assert context.user_id == "user_001"
        assert context.user_input == "Hello, I want to reflect."


class TestReflectionPipeline:
    """Test reflection pipeline."""

    def setup_method(self):
        self.pipeline = ReflectionPipeline()

    @pytest.mark.asyncio
    async def test_execute_empty_pipeline(self):
        """Test executing pipeline with no handlers."""
        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello",
        )

        result = await self.pipeline.execute(context)

        assert result.status == PipelineStatus.COMPLETED
        assert len(result.stages) > 0

    @pytest.mark.asyncio
    async def test_execute_with_custom_handler(self):
        """Test executing pipeline with custom handler."""
        async def custom_recognition(ctx: PipelineContext) -> StageResult:
            ctx.patterns.append({"id": "pattern_001", "name": "test"})
            return StageResult(
                stage=PipelineStage.RECOGNITION,
                status=PipelineStatus.COMPLETED,
                data={"custom": True},
            )

        self.pipeline.register_stage(PipelineStage.RECOGNITION, custom_recognition)

        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello",
        )

        result = await self.pipeline.execute(context)

        assert result.status == PipelineStatus.COMPLETED
        assert len(context.patterns) == 1

    @pytest.mark.asyncio
    async def test_pipeline_halt_on_constitutional_violation(self):
        """Test pipeline halts on constitutional violation."""
        async def halting_handler(ctx: PipelineContext) -> StageResult:
            return StageResult(
                stage=PipelineStage.PREPROCESS,
                status=PipelineStatus.HALTED,
                constitutional_halt=True,
                halt_reason="Test halt",
            )

        self.pipeline.register_stage(PipelineStage.PREPROCESS, halting_handler)

        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello",
        )

        result = await self.pipeline.execute(context)

        assert result.status == PipelineStatus.HALTED

    @pytest.mark.asyncio
    async def test_pipeline_hooks(self):
        """Test pre and post hooks."""
        hook_calls = []

        def pre_hook(stage, context):
            hook_calls.append(("pre", stage.value))

        def post_hook(stage, context, result):
            hook_calls.append(("post", stage.value))

        self.pipeline.add_pre_hook(pre_hook)
        self.pipeline.add_post_hook(post_hook)

        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello",
        )

        await self.pipeline.execute(context)

        # Should have pre and post hooks for each stage
        assert len(hook_calls) > 0
        assert any(call[0] == "pre" for call in hook_calls)
        assert any(call[0] == "post" for call in hook_calls)


class TestDefaultHandlers:
    """Test default pipeline handlers."""

    @pytest.mark.asyncio
    async def test_input_handler_empty_input(self):
        """Test input handler halts on empty input."""
        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="   ",  # Whitespace only
        )

        result = await default_input_handler(context)

        assert result.constitutional_halt
        assert result.status == PipelineStatus.HALTED

    @pytest.mark.asyncio
    async def test_input_handler_valid_input(self):
        """Test input handler passes valid input."""
        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Hello, I want to reflect.",
        )

        result = await default_input_handler(context)

        assert result.status == PipelineStatus.COMPLETED
        assert not result.constitutional_halt

    @pytest.mark.asyncio
    async def test_preprocess_detects_exit_intent(self):
        """Test preprocessing detects exit intent."""
        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="Goodbye, I'm done for now.",
        )

        result = await default_preprocess_handler(context)

        assert result.data.get("exit_intent_detected")


class TestDefaultPipeline:
    """Test the default pipeline factory."""

    @pytest.mark.asyncio
    async def test_create_default_pipeline(self):
        """Test creating default pipeline."""
        pipeline = create_default_pipeline()

        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="I've been thinking about my career.",
        )

        result = await pipeline.execute(context)

        assert result.status == PipelineStatus.COMPLETED
        assert result.reflection_text is not None
        assert len(result.reflection_text) > 0

    @pytest.mark.asyncio
    async def test_default_pipeline_leaveability(self):
        """Test default pipeline leave-ability check."""
        pipeline = create_default_pipeline()

        context = PipelineContext(
            user_id="user_001",
            session_id="session_001",
            user_input="I've been thinking about work.",
        )

        # Set session duration to trigger break suggestion
        context.session_duration_minutes = 50

        result = await pipeline.execute(context)

        assert result.break_suggested
        assert result.break_message is not None


class TestPipelineResult:
    """Test pipeline result structure."""

    def test_get_stage_result(self):
        """Test getting specific stage result."""
        result = PipelineResult(
            id="result_001",
            status=PipelineStatus.COMPLETED,
            stages=[
                StageResult(
                    stage=PipelineStage.INPUT,
                    status=PipelineStatus.COMPLETED,
                ),
                StageResult(
                    stage=PipelineStage.RECOGNITION,
                    status=PipelineStatus.COMPLETED,
                    data={"patterns_found": 3},
                ),
            ],
        )

        recognition_result = result.get_stage_result(PipelineStage.RECOGNITION)

        assert recognition_result is not None
        assert recognition_result.data.get("patterns_found") == 3

    def test_to_dict(self):
        """Test serialization to dict."""
        result = PipelineResult(
            id="result_001",
            status=PipelineStatus.COMPLETED,
            reflection_text="Test reflection",
            patterns_detected=["p1", "p2"],
        )

        data = result.to_dict()

        assert data["id"] == "result_001"
        assert data["reflection_text"] == "Test reflection"
        assert len(data["patterns_detected"]) == 2
