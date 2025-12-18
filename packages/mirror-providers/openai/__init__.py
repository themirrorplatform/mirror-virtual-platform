"""
OpenAI Provider Adapter

Translates OpenAI's API to Mirror's constitutional protocol.
Supports GPT-4, GPT-4-turbo, GPT-3.5-turbo, and other OpenAI models.

Usage:
    from mirror_providers.openai import OpenAIProvider

    provider = OpenAIProvider(
        api_key="sk-...",
        model="gpt-4"
    )

    # Synchronous generation
    result = await provider.generate("What is consciousness?")

    # Streaming generation
    async for chunk in provider.stream("Tell me a story"):
        print(chunk.content, end="", flush=True)
"""

from .adapter import OpenAIProvider
from .models import OPENAI_MODELS, OpenAIModelInfo

__all__ = [
    "OpenAIProvider",
    "OPENAI_MODELS",
    "OpenAIModelInfo",
]
