"""
Tests for provider pooling and routing.

These tests verify fallback chains, load balancing, and tiered routing.
"""

import pytest
import asyncio
from typing import AsyncIterator, Optional

from mirror_providers.base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    ProviderStatus,
    ModelTier,
)
from mirror_providers.pooling import (
    FallbackChain,
    ProviderPool,
    TieredRouter,
    LoadBalancer,
    BalancingStrategy,
)
from mirror_providers.pooling.load_balancer import (
    RoundRobinBalancer,
    LatencyBalancer,
    ProviderStats,
    create_balancer,
)


class MockProvider(MirrorProvider):
    """Mock provider for testing."""

    def __init__(
        self,
        name: str = "mock",
        should_fail: bool = False,
        latency_ms: float = 100.0,
        tier: ModelTier = ModelTier.BALANCED,
    ):
        config = ProviderConfig(
            provider_name=name,
            model=f"{name}-model",
        )
        super().__init__(config)
        self._should_fail = should_fail
        self._latency_ms = latency_ms
        self._tier = tier
        self._call_count = 0

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(tier=self._tier)

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        self._call_count += 1

        if self._should_fail:
            raise ProviderError("Mock failure", self.provider_name, self.model_name)

        await asyncio.sleep(self._latency_ms / 1000)

        return GenerationResult(
            content=f"Response from {self.provider_name}",
            success=True,
            provider=self.provider_name,
            model=self.model_name,
            latency_ms=self._latency_ms,
        )

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        self._call_count += 1

        if self._should_fail:
            raise ProviderError("Mock failure", self.provider_name, self.model_name)

        yield StreamChunk(
            content=f"Response from {self.provider_name}",
            index=0,
            is_final=True,
        )


class TestFallbackChain:
    """Tests for FallbackChain."""

    @pytest.mark.asyncio
    async def test_uses_first_provider_when_available(self):
        """Should use first provider when it's available."""
        p1 = MockProvider(name="primary")
        p2 = MockProvider(name="fallback")
        chain = FallbackChain([p1, p2])

        result = await chain.generate("test")

        assert result.provider == "primary"
        assert p1._call_count == 1
        assert p2._call_count == 0

    @pytest.mark.asyncio
    async def test_falls_back_on_failure(self):
        """Should fall back to next provider on failure."""
        p1 = MockProvider(name="primary", should_fail=True)
        p2 = MockProvider(name="fallback")
        chain = FallbackChain([p1, p2])

        result = await chain.generate("test")

        assert result.success is True
        assert result.provider == "fallback"

    @pytest.mark.asyncio
    async def test_all_providers_fail(self):
        """Should return error when all providers fail."""
        p1 = MockProvider(name="p1", should_fail=True)
        p2 = MockProvider(name="p2", should_fail=True)
        chain = FallbackChain([p1, p2])

        result = await chain.generate("test")

        assert result.success is False
        assert "All providers failed" in result.error

    @pytest.mark.asyncio
    async def test_remembers_successful_provider(self):
        """Should remember and prefer last successful provider."""
        p1 = MockProvider(name="primary", should_fail=True)
        p2 = MockProvider(name="fallback")
        chain = FallbackChain([p1, p2])

        # First call falls back to p2
        await chain.generate("test")
        assert chain._last_successful_idx == 1

        # Make p1 available again
        p1._should_fail = False
        p1._call_count = 0
        p2._call_count = 0

        # Second call should try p2 first (last successful)
        await chain.generate("test")
        assert p2._call_count == 1  # p2 tried first

    @pytest.mark.asyncio
    async def test_streaming_fallback(self):
        """Streaming should also support fallback."""
        p1 = MockProvider(name="primary", should_fail=True)
        p2 = MockProvider(name="fallback")
        chain = FallbackChain([p1, p2])

        chunks = []
        async for chunk in chain.stream("test"):
            chunks.append(chunk)

        assert len(chunks) == 1
        assert "fallback" in chunks[0].content

    def test_requires_at_least_one_provider(self):
        """Should require at least one provider."""
        with pytest.raises(ValueError):
            FallbackChain([])


class TestProviderPool:
    """Tests for ProviderPool."""

    @pytest.mark.asyncio
    async def test_distributes_requests(self):
        """Should distribute requests across providers."""
        providers = [
            MockProvider(name=f"p{i}") for i in range(3)
        ]
        pool = ProviderPool(providers, strategy="round_robin")

        # Make several requests
        for _ in range(6):
            await pool.generate("test")

        # Each provider should have been called twice
        for p in providers:
            assert p._call_count == 2

    @pytest.mark.asyncio
    async def test_avoids_unhealthy_providers(self):
        """Should skip unhealthy providers."""
        p1 = MockProvider(name="healthy")
        p2 = MockProvider(name="unhealthy", should_fail=True)
        pool = ProviderPool([p1, p2], strategy="round_robin")

        # Make p2 unhealthy
        p2._status = ProviderStatus.UNAVAILABLE

        # All requests should go to p1
        for _ in range(5):
            result = await pool.generate("test")
            assert result.provider == "healthy"

    @pytest.mark.asyncio
    async def test_least_loaded_strategy(self):
        """Least loaded strategy should prefer idle providers."""
        providers = [MockProvider(name=f"p{i}") for i in range(3)]
        pool = ProviderPool(providers, strategy="least_loaded")

        # Simulate p0 having many active requests
        pool._balancer.stats[0].active_requests = 10

        result = await pool.generate("test")

        # Should not use p0 (most loaded)
        assert result.provider != "p0"

    def test_capabilities_are_intersection(self):
        """Pool capabilities should be most conservative."""
        p1 = MockProvider(name="p1")
        p1._tier = ModelTier.FLAGSHIP

        p2 = MockProvider(name="p2")
        # Override capabilities
        original_caps = p2.capabilities
        p2.capabilities  # Access to ensure it's set

        pool = ProviderPool([p1, p2])
        caps = pool.capabilities

        # Pool tier should be BALANCED (most conservative)
        assert caps.tier == ModelTier.BALANCED

    def test_get_stats(self):
        """Should return stats for all providers."""
        providers = [MockProvider(name=f"p{i}") for i in range(2)]
        pool = ProviderPool(providers)

        stats = pool.get_stats()

        assert len(stats) == 2
        assert all("provider" in s for s in stats)
        assert all("is_healthy" in s for s in stats)


class TestTieredRouter:
    """Tests for TieredRouter."""

    @pytest.mark.asyncio
    async def test_explicit_tier_routing(self):
        """Should route to explicitly specified tier."""
        router = TieredRouter(
            flagship=MockProvider(name="flagship", tier=ModelTier.FLAGSHIP),
            balanced=MockProvider(name="balanced", tier=ModelTier.BALANCED),
            fast=MockProvider(name="fast", tier=ModelTier.FAST),
        )

        result = await router.generate(
            "test",
            context={"tier": "flagship"}
        )

        assert result.provider == "flagship"

    @pytest.mark.asyncio
    async def test_auto_routes_short_to_fast(self):
        """Should route short prompts to fast tier."""
        fast = MockProvider(name="fast", tier=ModelTier.FAST)
        balanced = MockProvider(name="balanced", tier=ModelTier.BALANCED)

        router = TieredRouter(fast=fast, balanced=balanced, default_tier="balanced")

        result = await router.generate("ok")

        assert result.provider == "fast"

    @pytest.mark.asyncio
    async def test_auto_routes_complex_to_flagship(self):
        """Should route complex prompts to flagship tier."""
        flagship = MockProvider(name="flagship", tier=ModelTier.FLAGSHIP)
        balanced = MockProvider(name="balanced", tier=ModelTier.BALANCED)

        router = TieredRouter(flagship=flagship, balanced=balanced, default_tier="balanced")

        result = await router.generate(
            "Please analyze this philosophical question thoroughly and "
            "provide a comprehensive evaluation of all perspectives involved. "
            "Consider the ethical implications and reasoning behind each position."
        )

        assert result.provider == "flagship"

    @pytest.mark.asyncio
    async def test_falls_back_to_default(self):
        """Should use default tier for ambiguous prompts."""
        router = TieredRouter(
            flagship=MockProvider(name="flagship"),
            balanced=MockProvider(name="balanced"),
            default_tier="balanced"
        )

        result = await router.generate("Tell me about the weather today")

        assert result.provider == "balanced"

    def test_requires_at_least_one_tier(self):
        """Should require at least one tier provider."""
        with pytest.raises(ValueError):
            TieredRouter()


class TestLoadBalancer:
    """Tests for LoadBalancer implementations."""

    def test_round_robin_balancer(self):
        """Round robin should cycle through providers."""
        providers = [MockProvider(name=f"p{i}") for i in range(3)]
        balancer = RoundRobinBalancer(providers)

        selections = [balancer.select().provider.provider_name for _ in range(6)]

        # Should cycle through all providers twice
        assert selections.count("p0") == 2
        assert selections.count("p1") == 2
        assert selections.count("p2") == 2

    def test_latency_balancer_prefers_low_latency(self):
        """Latency balancer should prefer low-latency providers."""
        providers = [
            MockProvider(name="slow", latency_ms=500),
            MockProvider(name="fast", latency_ms=50),
        ]
        balancer = LatencyBalancer(providers)

        # Record latencies
        balancer.stats[0].record_success(500)
        balancer.stats[1].record_success(50)

        # Most selections should be the fast provider
        selections = [balancer.select().provider.provider_name for _ in range(20)]
        fast_count = selections.count("fast")

        assert fast_count > 10  # Should prefer fast provider

    def test_provider_stats_error_tracking(self):
        """Provider stats should track errors correctly."""
        provider = MockProvider(name="test")
        stats = ProviderStats(provider=provider)

        stats.record_request()
        stats.record_success(100)
        stats.record_request()
        stats.record_error()

        assert stats.total_requests == 2
        assert stats.total_errors == 1
        assert stats.error_rate == 0.5

    def test_unhealthy_detection(self):
        """Should detect unhealthy providers."""
        provider = MockProvider(name="test")
        stats = ProviderStats(provider=provider)

        # High error rate should mark unhealthy
        for _ in range(10):
            stats.record_request()
            stats.record_error()

        assert stats.error_rate > 0.5
        assert stats.is_healthy is False

    def test_create_balancer_factory(self):
        """Factory should create correct balancer type."""
        providers = [MockProvider()]

        rr = create_balancer(BalancingStrategy.ROUND_ROBIN, providers)
        assert isinstance(rr, RoundRobinBalancer)

        lat = create_balancer(BalancingStrategy.LATENCY, providers)
        assert isinstance(lat, LatencyBalancer)


class TestProviderIntegration:
    """Integration tests for provider routing."""

    @pytest.mark.asyncio
    async def test_chain_with_pool(self):
        """Should support chaining pools as fallback."""
        primary_pool = ProviderPool([
            MockProvider(name="primary1"),
            MockProvider(name="primary2"),
        ])

        backup = MockProvider(name="backup")

        chain = FallbackChain([primary_pool, backup])

        result = await chain.generate("test")
        assert result.success is True

    @pytest.mark.asyncio
    async def test_tiered_with_pools(self):
        """Should support pools as tier providers."""
        fast_pool = ProviderPool([
            MockProvider(name="fast1", tier=ModelTier.FAST),
            MockProvider(name="fast2", tier=ModelTier.FAST),
        ])

        balanced = MockProvider(name="balanced", tier=ModelTier.BALANCED)

        router = TieredRouter(
            fast=fast_pool,
            balanced=balanced,
            default_tier="balanced"
        )

        result = await router.generate("ok")  # Short prompt -> fast tier
        assert "fast" in result.provider

    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Should handle concurrent requests correctly."""
        providers = [MockProvider(name=f"p{i}") for i in range(3)]
        pool = ProviderPool(providers, strategy="round_robin")

        # Make concurrent requests
        results = await asyncio.gather(*[
            pool.generate(f"request {i}") for i in range(10)
        ])

        assert all(r.success for r in results)

        # Requests should be distributed
        total_calls = sum(p._call_count for p in providers)
        assert total_calls == 10
