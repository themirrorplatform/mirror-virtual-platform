"""
Local LLM Provider Adapters

Enables running Mirror with local LLMs via Ollama.
This is critical for data sovereignty - users can keep
all data on their own machine with zero external API calls.

Usage:
    from mirror_providers.local import OllamaProvider

    provider = OllamaProvider(
        model="llama3.1",
        host="http://localhost:11434"
    )

    # Works exactly like cloud providers
    result = await provider.generate("Reflect on this...")

    # Streaming
    async for chunk in provider.stream("What patterns emerge?"):
        print(chunk.content, end="", flush=True)
"""

from .ollama import OllamaProvider, OLLAMA_MODELS

__all__ = [
    "OllamaProvider",
    "OLLAMA_MODELS",
]
