"""
Tests for the MirrorProvider base interface.

These tests verify the abstract interface contract and common behavior.
"""

import pytest
from typing import AsyncIterator, Optional

from mirror_providers.base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    RateLimitError,
    AuthenticationError,
    ModelNotFoundError,
    ProviderStatus,
    ModelTier,
)


class MockProvider(MirrorProvider):
    """Test implementation of MirrorProvider."""

    def __init__(
        self,
        should_fail: bool = False,
        fail_with: Exception = None,
        response_content: str = "Mock response"
    ):
        config = ProviderConfig(
            api_key="test-key",
            model="mock-model",
            provider_name="mock",
        )
        super().__init__(config)
        self._should_fail = should_fail
        self._fail_with = fail_with
        self._response_content = response_content

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_streaming=True,
            supports_function_calling=True,
            max_tokens=4096,
            tier=ModelTier.BALANCED,
        )

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        if self._should_fail:
            if self._fail_with:
                raise self._fail_with
            return GenerationResult(
                content="",
                success=False,
                provider="mock",
                model="mock-model",
                error="Mock failure",
            )

        return GenerationResult(
            content=self._response_content,
            success=True,
            provider="mock",
            model="mock-model",
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
            latency_ms=100.0,
        )

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        if self._should_fail:
            if self._fail_with:
                raise self._fail_with
            yield StreamChunk(
                content="[Error]",
                index=0,
                is_final=True,
                finish_reason="error",
            )
            return

        words = self._response_content.split()
        for i, word in enumerate(words):
            yield StreamChunk(
                content=word + " ",
                index=i,
                is_final=(i == len(words) - 1),
                finish_reason="stop" if i == len(words) - 1 else None,
            )


class TestProviderConfig:
    """Tests for ProviderConfig."""

    def test_api_key_masking(self):
        """API keys should be masked in repr."""
        config = ProviderConfig(
            api_key="sk-very-secret-key-12345",
            model="test-model",
            provider_name="test"
        )
        repr_str = repr(config)
        assert "sk-v" in repr_str
        assert "2345" in repr_str
        assert "very-secret-key" not in repr_str

    def test_short_api_key_fully_masked(self):
        """Short API keys should be fully masked."""
        config = ProviderConfig(api_key="short")
        assert config._masked_key == "***"

    def test_no_api_key(self):
        """Config should work without API key (for local providers)."""
        config = ProviderConfig(model="local-model")
        assert config.api_key is None
        assert config._masked_key is None


class TestProviderCapabilities:
    """Tests for ProviderCapabilities."""

    def test_immutable(self):
        """Capabilities should be immutable."""
        caps = ProviderCapabilities(max_tokens=1024)
        with pytest.raises(Exception):  # frozen dataclass
            caps.max_tokens = 2048

    def test_to_dict(self):
        """Capabilities should serialize to dict."""
        caps = ProviderCapabilities(
            supports_streaming=True,
            supports_vision=True,
            tier=ModelTier.FLAGSHIP
        )
        d = caps.to_dict()
        assert d["supports_streaming"] is True
        assert d["supports_vision"] is True
        assert d["tier"] == "flagship"


class TestGenerationResult:
    """Tests for GenerationResult."""

    def test_content_hash_generated(self):
        """Content hash should be generated automatically."""
        result = GenerationResult(
            content="Hello world",
            success=True,
            provider="test",
            model="test"
        )
        assert result.content_hash is not None
        assert len(result.content_hash) == 64  # SHA-256 hex

    def test_same_content_same_hash(self):
        """Same content should produce same hash."""
        r1 = GenerationResult(content="test", success=True, provider="a", model="a")
        r2 = GenerationResult(content="test", success=True, provider="b", model="b")
        assert r1.content_hash == r2.content_hash

    def test_to_audit_dict_excludes_raw(self):
        """Audit dict should not include raw response."""
        result = GenerationResult(
            content="test",
            success=True,
            provider="test",
            model="test",
            raw_response={"secret": "data"}
        )
        audit = result.to_audit_dict()
        assert "raw_response" not in audit
        assert "content_hash" in audit


class TestStreamChunk:
    """Tests for StreamChunk."""

    def test_content_hash_truncated(self):
        """Stream chunks should have truncated hashes for efficiency."""
        chunk = StreamChunk(content="test", index=0)
        assert len(chunk.content_hash) == 16


class TestProviderErrors:
    """Tests for provider error types."""

    def test_error_includes_provider_info(self):
        """Errors should include provider and model info."""
        error = ProviderError("Something failed", provider="openai", model="gpt-4")
        assert "[openai/gpt-4]" in str(error)

    def test_rate_limit_error_has_retry_after(self):
        """Rate limit errors can include retry-after."""
        error = RateLimitError(
            "Rate limited",
            provider="test",
            model="test",
            retry_after=30.0
        )
        assert error.retry_after == 30.0


class TestMockProvider:
    """Tests for the mock provider implementation."""

    @pytest.mark.asyncio
    async def test_successful_generation(self):
        """Mock provider should return expected response."""
        provider = MockProvider(response_content="Test response")
        result = await provider.generate("test prompt")

        assert result.success is True
        assert result.content == "Test response"
        assert result.provider == "mock"

    @pytest.mark.asyncio
    async def test_failed_generation(self):
        """Mock provider should handle failures."""
        provider = MockProvider(should_fail=True)
        result = await provider.generate("test")

        assert result.success is False
        assert result.error is not None

    @pytest.mark.asyncio
    async def test_exception_propagation(self):
        """Exceptions should propagate correctly."""
        provider = MockProvider(
            should_fail=True,
            fail_with=AuthenticationError("Bad key", "mock", "mock-model")
        )

        with pytest.raises(AuthenticationError):
            await provider.generate("test")

    @pytest.mark.asyncio
    async def test_streaming(self):
        """Streaming should yield chunks."""
        provider = MockProvider(response_content="One two three")
        chunks = []

        async for chunk in provider.stream("test"):
            chunks.append(chunk)

        assert len(chunks) == 3
        assert chunks[-1].is_final is True
        assert "".join(c.content for c in chunks).strip() == "One two three"

    def test_capabilities(self):
        """Capabilities should be declared."""
        provider = MockProvider()
        caps = provider.capabilities

        assert caps.supports_streaming is True
        assert caps.tier == ModelTier.BALANCED

    def test_stats_tracking(self):
        """Stats should be tracked."""
        provider = MockProvider()
        provider._track_request(success=True)
        provider._track_request(success=True)
        provider._track_request(success=False)

        stats = provider.get_stats()
        assert stats["request_count"] == 3
        assert stats["error_count"] == 1

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Health check should work."""
        provider = MockProvider()
        is_healthy = await provider.health_check()
        assert is_healthy is True
        assert provider.status == ProviderStatus.AVAILABLE


class TestProviderContract:
    """Tests verifying the MirrorProvider contract."""

    def test_must_implement_capabilities(self):
        """Subclasses must implement capabilities property."""
        class IncompleteProvider(MirrorProvider):
            async def generate(self, prompt, context=None, **kwargs):
                pass

            async def stream(self, prompt, context=None, **kwargs):
                yield StreamChunk(content="", index=0)

        with pytest.raises(TypeError):
            IncompleteProvider(ProviderConfig())

    def test_must_implement_generate(self):
        """Subclasses must implement generate method."""
        class IncompleteProvider(MirrorProvider):
            @property
            def capabilities(self):
                return ProviderCapabilities()

            async def stream(self, prompt, context=None, **kwargs):
                yield StreamChunk(content="", index=0)

        with pytest.raises(TypeError):
            IncompleteProvider(ProviderConfig())

    def test_must_implement_stream(self):
        """Subclasses must implement stream method."""
        class IncompleteProvider(MirrorProvider):
            @property
            def capabilities(self):
                return ProviderCapabilities()

            async def generate(self, prompt, context=None, **kwargs):
                pass

        with pytest.raises(TypeError):
            IncompleteProvider(ProviderConfig())
