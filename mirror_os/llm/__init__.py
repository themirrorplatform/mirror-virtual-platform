"""
MirrorCore LLM Layer

Provides abstract LLM interface with local-first philosophy (I1: Data Sovereignty).
Supports local models (Ollama, llama.cpp) as primary, remote (Claude, GPT) as optional.
"""

from .base import BaseLLM, LLMResponse, LLMError
from .local import LocalLLM
from .remote import RemoteLLM

__all__ = [
    'BaseLLM',
    'LLMResponse',
    'LLMError',
    'LocalLLM',
    'RemoteLLM'
]
