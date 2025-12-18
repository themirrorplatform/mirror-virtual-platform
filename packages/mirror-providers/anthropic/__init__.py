"""
Anthropic Provider Adapter

Translates Anthropic's Claude API to Mirror's constitutional protocol.
Supports Claude 3 Opus, Sonnet, and Haiku models.

Usage:
    from mirror_providers.anthropic import AnthropicProvider

    provider = AnthropicProvider(
        api_key="sk-ant-...",
        model="claude-sonnet-4-20250514"
    )

    # Synchronous generation
    result = await provider.generate("What patterns do you notice?")

    # Streaming generation
    async for chunk in provider.stream("Reflect on this moment"):
        print(chunk.content, end="", flush=True)
"""

from .adapter import AnthropicProvider
from .models import ANTHROPIC_MODELS, AnthropicModelInfo

__all__ = [
    "AnthropicProvider",
    "ANTHROPIC_MODELS",
    "AnthropicModelInfo",
]
