"""
LLMAdapter interface and base types for Mirror core.
Supports both local and remote LLMs.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class LLMAdapter(ABC):
    """Abstract base class for LLM adapters (local and remote)."""

    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        """Synchronously generate a response from the LLM."""
        pass

    @abstractmethod
    async def agenerate(self, prompt: str, **kwargs) -> str:
        """Asynchronously generate a response from the LLM."""
        pass

class LLMConfig:
    """Configuration for LLM adapters (API keys, endpoints, etc)."""
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.endpoint = endpoint
        self.model = model

    def as_dict(self) -> Dict[str, Any]:
        return {"api_key": self.api_key, "endpoint": self.endpoint, "model": self.model}
