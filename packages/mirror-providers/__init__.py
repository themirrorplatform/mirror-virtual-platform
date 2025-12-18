"""
Mirror Providers - AI Backend Adapters for Constitutional AI

This package provides provider-agnostic adapters that translate between
various AI backends (OpenAI, Anthropic, local LLMs) and Mirror's constitutional
protocol. All providers implement the same interface, ensuring:

1. Constitutional filtering applies uniformly across all backends
2. Provider switching requires zero code changes
3. Fallback and pooling work transparently
4. Streaming responses are filtered in real-time

Usage:
    from mirror_providers import OpenAIProvider, AnthropicProvider, OllamaProvider
    from mirror_providers.pooling import ProviderPool, FallbackChain

    # Single provider
    provider = OpenAIProvider(model="gpt-4")
    response = await provider.generate(prompt, context)

    # Fallback chain (tries providers in order)
    chain = FallbackChain([
        AnthropicProvider(model="claude-3-opus"),
        OpenAIProvider(model="gpt-4"),
        OllamaProvider(model="llama3.1")
    ])
    response = await chain.generate(prompt, context)

    # Load-balanced pool
    pool = ProviderPool([provider1, provider2], strategy="round_robin")
    response = await pool.generate(prompt, context)
"""

from .base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    RateLimitError,
    AuthenticationError,
    ModelNotFoundError,
)

__version__ = "1.0.0"
__all__ = [
    "MirrorProvider",
    "ProviderConfig",
    "ProviderCapabilities",
    "GenerationResult",
    "StreamChunk",
    "ProviderError",
    "RateLimitError",
    "AuthenticationError",
    "ModelNotFoundError",
]
