"""
Provider Routing

High-level routing abstractions for resilient provider usage:

- FallbackChain: Sequential fallback through providers
- ProviderPool: Load-balanced pool of providers
- TieredRouter: Route by request complexity/tier
"""

import time
from typing import AsyncIterator, Optional, List, Dict, Any
from dataclasses import dataclass

from ..base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    ProviderStatus,
    ModelTier,
)
from .load_balancer import (
    LoadBalancer,
    BalancingStrategy,
    create_balancer,
    ProviderStats,
)


class FallbackChain(MirrorProvider):
    """
    Try providers in order until one succeeds.

    Perfect for reliability: if primary is down, fall back to secondary.

    Example:
        chain = FallbackChain([
            AnthropicProvider(model="claude-opus-4"),  # Primary
            OpenAIProvider(model="gpt-4o"),            # Fallback 1
            OllamaProvider(model="llama3.1")           # Fallback 2 (local)
        ])

        # Will try Anthropic first, then OpenAI, then local
        result = await chain.generate("What patterns emerge?")
    """

    def __init__(self, providers: List[MirrorProvider]):
        """
        Initialize fallback chain.

        Args:
            providers: List of providers in order of preference
        """
        if not providers:
            raise ValueError("At least one provider required")

        self._providers = providers
        self._last_successful_idx = 0

        # Use first provider's config as base
        config = ProviderConfig(
            provider_name="fallback_chain",
            model=f"chain({len(providers)} providers)",
        )
        super().__init__(config)

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Return capabilities of the primary (first) provider."""
        return self._providers[0].capabilities

    @property
    def providers(self) -> List[MirrorProvider]:
        """Get list of providers in chain."""
        return self._providers

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """
        Generate using fallback chain.

        Tries each provider in order until one succeeds.
        """
        errors = []

        # Start from last successful provider (optimization)
        indices = list(range(len(self._providers)))
        if self._last_successful_idx > 0:
            # Reorder: try last successful first, then others
            indices = (
                [self._last_successful_idx] +
                [i for i in indices if i != self._last_successful_idx]
            )

        for idx in indices:
            provider = self._providers[idx]

            # Skip unavailable providers
            if provider.status == ProviderStatus.UNAVAILABLE:
                continue

            try:
                result = await provider.generate(prompt, context, **kwargs)
                if result.success:
                    self._last_successful_idx = idx
                    self._status = ProviderStatus.AVAILABLE
                    return result
                else:
                    errors.append(f"{provider.provider_name}: {result.error}")
            except ProviderError as e:
                errors.append(f"{provider.provider_name}: {e.message}")
            except Exception as e:
                errors.append(f"{provider.provider_name}: {str(e)}")

        # All providers failed
        self._status = ProviderStatus.DEGRADED
        return GenerationResult(
            content="",
            success=False,
            provider="fallback_chain",
            model="all_failed",
            error=f"All providers failed: {'; '.join(errors)}",
        )

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """
        Stream using fallback chain.

        Note: If a provider fails mid-stream, we cannot seamlessly
        continue with another provider. The fallback is only for
        initial connection failures.
        """
        errors = []

        for idx, provider in enumerate(self._providers):
            if provider.status == ProviderStatus.UNAVAILABLE:
                continue

            try:
                async for chunk in provider.stream(prompt, context, **kwargs):
                    yield chunk

                # If we got here, streaming succeeded
                self._last_successful_idx = idx
                self._status = ProviderStatus.AVAILABLE
                return

            except ProviderError as e:
                errors.append(f"{provider.provider_name}: {e.message}")
            except Exception as e:
                errors.append(f"{provider.provider_name}: {str(e)}")

        # All providers failed
        self._status = ProviderStatus.DEGRADED
        yield StreamChunk(
            content=f"[Error: All providers failed: {'; '.join(errors)}]",
            index=0,
            is_final=True,
            finish_reason="error",
        )

    async def health_check(self) -> bool:
        """Check if at least one provider is healthy."""
        for provider in self._providers:
            if await provider.health_check():
                return True
        return False


class ProviderPool(MirrorProvider):
    """
    Load-balanced pool of providers.

    Distributes requests across multiple providers for:
    - Higher throughput
    - Redundancy
    - Cost optimization (mix expensive and cheap providers)

    Example:
        pool = ProviderPool(
            providers=[
                OpenAIProvider(model="gpt-4o"),
                OpenAIProvider(model="gpt-4o"),  # Two OpenAI instances
                AnthropicProvider(model="claude-sonnet-4"),
            ],
            strategy="least_loaded"
        )

        # Requests are distributed across providers
        results = await asyncio.gather(*[
            pool.generate(f"Request {i}") for i in range(10)
        ])
    """

    def __init__(
        self,
        providers: List[MirrorProvider],
        strategy: str = "round_robin",
        weights: List[float] = None
    ):
        """
        Initialize provider pool.

        Args:
            providers: List of providers to pool
            strategy: Balancing strategy (round_robin, random, least_loaded,
                     weighted, latency)
            weights: Optional weights for weighted strategy
        """
        if not providers:
            raise ValueError("At least one provider required")

        self._providers = providers

        # Convert strategy string to enum
        try:
            strategy_enum = BalancingStrategy(strategy)
        except ValueError:
            strategy_enum = BalancingStrategy.ROUND_ROBIN

        self._balancer = create_balancer(strategy_enum, providers, weights)

        config = ProviderConfig(
            provider_name="provider_pool",
            model=f"pool({len(providers)} providers, {strategy})",
        )
        super().__init__(config)

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Return most conservative capabilities across all providers."""
        # Return intersection of capabilities
        caps = [p.capabilities for p in self._providers]
        return ProviderCapabilities(
            supports_streaming=all(c.supports_streaming for c in caps),
            supports_function_calling=all(c.supports_function_calling for c in caps),
            supports_vision=all(c.supports_vision for c in caps),
            supports_json_mode=all(c.supports_json_mode for c in caps),
            max_tokens=min(c.max_tokens for c in caps),
            max_context_window=min(c.max_context_window for c in caps),
            tier=ModelTier.BALANCED,  # Pool is balanced by nature
        )

    @property
    def providers(self) -> List[MirrorProvider]:
        """Get list of providers in pool."""
        return self._providers

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """Generate using load-balanced selection."""
        stats = self._balancer.select()
        if stats is None:
            return GenerationResult(
                content="",
                success=False,
                provider="provider_pool",
                model="no_healthy_providers",
                error="No healthy providers available",
            )

        provider = stats.provider
        self._balancer.record_request(stats)
        start_time = time.time()

        try:
            result = await provider.generate(prompt, context, **kwargs)
            latency_ms = (time.time() - start_time) * 1000

            if result.success:
                self._balancer.record_success(stats, latency_ms)
                self._status = ProviderStatus.AVAILABLE
            else:
                self._balancer.record_error(stats)

            return result

        except Exception as e:
            self._balancer.record_error(stats)
            raise

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """Stream using load-balanced selection."""
        stats = self._balancer.select()
        if stats is None:
            yield StreamChunk(
                content="[Error: No healthy providers available]",
                index=0,
                is_final=True,
                finish_reason="error",
            )
            return

        provider = stats.provider
        self._balancer.record_request(stats)
        start_time = time.time()

        try:
            async for chunk in provider.stream(prompt, context, **kwargs):
                yield chunk

            latency_ms = (time.time() - start_time) * 1000
            self._balancer.record_success(stats, latency_ms)

        except Exception as e:
            self._balancer.record_error(stats)
            raise

    async def health_check(self) -> bool:
        """Check pool health."""
        healthy = 0
        for provider in self._providers:
            if await provider.health_check():
                healthy += 1

        # Pool is healthy if at least one provider works
        return healthy > 0

    def get_stats(self) -> List[dict]:
        """Get statistics for all providers in pool."""
        return [
            {
                "provider": s.provider.provider_name,
                "model": s.provider.model_name,
                "weight": s.weight,
                "active_requests": s.active_requests,
                "total_requests": s.total_requests,
                "error_rate": s.error_rate,
                "avg_latency_ms": s.avg_latency_ms,
                "is_healthy": s.is_healthy,
            }
            for s in self._balancer.stats
        ]


class TieredRouter(MirrorProvider):
    """
    Route requests based on complexity tier.

    Uses different providers for different request types:
    - Flagship: Complex, high-stakes requests (reasoning, analysis)
    - Balanced: General requests (conversation, reflection)
    - Fast: Simple requests (acknowledgments, short responses)

    Example:
        router = TieredRouter(
            flagship=AnthropicProvider(model="claude-opus-4"),
            balanced=AnthropicProvider(model="claude-sonnet-4"),
            fast=OllamaProvider(model="llama3.1")
        )

        # Route explicitly by tier
        result = await router.generate(
            "Analyze this complex philosophical question",
            context={"tier": "flagship"}
        )

        # Or let the router decide based on prompt
        result = await router.generate("Yes, I understand")  # Routes to fast
    """

    def __init__(
        self,
        flagship: MirrorProvider = None,
        balanced: MirrorProvider = None,
        fast: MirrorProvider = None,
        default_tier: str = "balanced"
    ):
        """
        Initialize tiered router.

        Args:
            flagship: Provider for complex requests
            balanced: Provider for general requests
            fast: Provider for simple requests
            default_tier: Default tier if not specified in context
        """
        self._tiers: Dict[str, MirrorProvider] = {}

        if flagship:
            self._tiers["flagship"] = flagship
        if balanced:
            self._tiers["balanced"] = balanced
        if fast:
            self._tiers["fast"] = fast

        if not self._tiers:
            raise ValueError("At least one tier provider required")

        self._default_tier = default_tier if default_tier in self._tiers else list(self._tiers.keys())[0]

        config = ProviderConfig(
            provider_name="tiered_router",
            model=f"tiered({len(self._tiers)} tiers)",
        )
        super().__init__(config)

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Return capabilities of balanced tier (or default)."""
        provider = self._tiers.get(self._default_tier, list(self._tiers.values())[0])
        return provider.capabilities

    def _select_tier(self, prompt: str, context: Optional[dict] = None) -> str:
        """Select appropriate tier based on prompt and context."""
        context = context or {}

        # Explicit tier override
        if "tier" in context:
            tier = context["tier"]
            if tier in self._tiers:
                return tier

        # Heuristic-based routing
        prompt_lower = prompt.lower()
        prompt_len = len(prompt)

        # Fast tier indicators
        fast_indicators = [
            prompt_len < 50,  # Very short
            any(w in prompt_lower for w in ["ok", "yes", "no", "thanks", "got it", "understood"]),
            prompt_lower.strip() in ["ok", "yes", "no", "thanks", "okay"],
        ]

        # Flagship tier indicators
        flagship_indicators = [
            prompt_len > 500,  # Long, complex
            any(w in prompt_lower for w in [
                "analyze", "explain", "compare", "evaluate",
                "reasoning", "philosophy", "ethics", "complex",
                "in depth", "thoroughly", "comprehensive"
            ]),
            context.get("requires_reasoning", False),
        ]

        # Route based on indicators
        if "fast" in self._tiers and sum(fast_indicators) >= 2:
            return "fast"
        if "flagship" in self._tiers and sum(flagship_indicators) >= 2:
            return "flagship"

        return self._default_tier

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """Generate using tier-appropriate provider."""
        tier = self._select_tier(prompt, context)
        provider = self._tiers[tier]

        result = await provider.generate(prompt, context, **kwargs)

        # Add tier info to metadata
        if result.raw_response:
            result.raw_response = {
                "tier_used": tier,
                "original_response": result.raw_response
            }

        return result

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """Stream using tier-appropriate provider."""
        tier = self._select_tier(prompt, context)
        provider = self._tiers[tier]

        async for chunk in provider.stream(prompt, context, **kwargs):
            yield chunk

    async def health_check(self) -> bool:
        """Check if default tier is healthy."""
        provider = self._tiers.get(self._default_tier)
        if provider:
            return await provider.health_check()
        return False

    def get_tier_provider(self, tier: str) -> Optional[MirrorProvider]:
        """Get provider for a specific tier."""
        return self._tiers.get(tier)
