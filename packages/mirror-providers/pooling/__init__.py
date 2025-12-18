"""
Provider Pooling & Fallback

Enables resilient provider configurations:

1. FallbackChain: Try providers in order until one succeeds
2. ProviderPool: Load balance across healthy providers
3. TieredRouter: Route by request complexity

Usage:
    from mirror_providers.pooling import FallbackChain, ProviderPool, TieredRouter

    # Fallback: Try Anthropic first, fall back to OpenAI, then local
    chain = FallbackChain([
        AnthropicProvider(api_key="...", model="claude-sonnet-4"),
        OpenAIProvider(api_key="...", model="gpt-4o"),
        OllamaProvider(model="llama3.1")
    ])

    # Pool: Round-robin across multiple providers
    pool = ProviderPool(
        providers=[provider1, provider2, provider3],
        strategy="round_robin"
    )

    # Tiered: Route based on request complexity
    router = TieredRouter(
        flagship=AnthropicProvider(model="claude-opus-4"),
        balanced=AnthropicProvider(model="claude-sonnet-4"),
        fast=OllamaProvider(model="llama3.1")
    )
"""

from .router import FallbackChain, ProviderPool, TieredRouter
from .load_balancer import LoadBalancer, BalancingStrategy

__all__ = [
    "FallbackChain",
    "ProviderPool",
    "TieredRouter",
    "LoadBalancer",
    "BalancingStrategy",
]
