"""
BaseLLM: Abstract LLM Interface

Constitutional Requirements:
- I1 (Data Sovereignty): Must support local-first operation
- I2 (Identity Locality): All prompts scoped to mirror_id
- I7 (No Hidden Behavior): All LLM calls visible/auditable
- I13 (No Behavioral Optimization): No prompt manipulation for outcomes
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum


class LLMProvider(Enum):
    """LLM provider types"""
    LOCAL_OLLAMA = "local_ollama"
    LOCAL_LLAMACPP = "local_llamacpp"
    REMOTE_CLAUDE = "remote_claude"
    REMOTE_OPENAI = "remote_openai"
    REMOTE_CUSTOM = "remote_custom"


@dataclass
class LLMResponse:
    """Response from LLM generation"""
    content: str
    model: str
    provider: LLMProvider
    tokens_used: Optional[int] = None
    latency_ms: Optional[float] = None
    
    # Constitutional tracking
    mirror_id: Optional[str] = None  # I2: Identity-scoped
    prompt_hash: Optional[str] = None  # I7: Auditability
    
    # Metadata for telemetry (I13: Mechanical only)
    finish_reason: Optional[str] = None
    error: Optional[str] = None


@dataclass
class LLMConfig:
    """Configuration for LLM provider"""
    provider: LLMProvider
    model: str
    
    # Local model settings
    local_url: Optional[str] = None  # e.g., "http://localhost:11434" for Ollama
    local_model_path: Optional[str] = None  # For llama.cpp
    
    # Remote settings (optional, I1: Must degrade gracefully)
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    
    # Generation parameters
    temperature: float = 0.7
    max_tokens: int = 1000
    top_p: float = 0.9
    
    # Constitutional enforcement
    works_offline: bool = True  # I1: Must be True for local providers
    requires_network: bool = False  # Set True for remote providers


class LLMError(Exception):
    """Base exception for LLM errors"""
    pass


class LLMConnectionError(LLMError):
    """Failed to connect to LLM provider"""
    pass


class LLMGenerationError(LLMError):
    """Error during generation"""
    pass


class BaseLLM(ABC):
    """
    Abstract base class for LLM providers.
    
    Constitutional Guarantees:
    - I1: Local providers MUST work offline
    - I2: All generations tagged with mirror_id
    - I7: All prompts auditable (hash stored)
    - I13: No hidden prompt manipulation
    """
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self._validate_config()
    
    def _validate_config(self):
        """Validate configuration meets constitutional requirements"""
        if self.config.works_offline and self.config.requires_network:
            raise ValueError(
                "I1 VIOLATION: Cannot claim works_offline=True if requires_network=True"
            )
        
        if self.config.provider in [LLMProvider.REMOTE_CLAUDE, LLMProvider.REMOTE_OPENAI]:
            if not self.config.api_key:
                raise ValueError(f"Remote provider {self.config.provider} requires api_key")
    
    @abstractmethod
    def generate(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate text from prompt.
        
        Args:
            prompt: User prompt (I2: Will be identity-scoped)
            mirror_id: Mirror identity (I2: Required for all generations)
            system_prompt: Optional system instructions (I13: No manipulation)
            temperature: Override config temperature
            max_tokens: Override config max_tokens
            **kwargs: Provider-specific parameters
        
        Returns:
            LLMResponse with generated content and metadata
        
        Raises:
            LLMConnectionError: Cannot reach provider
            LLMGenerationError: Generation failed
        
        Constitutional Requirements:
        - I2: mirror_id MUST be included in response
        - I7: prompt_hash MUST be calculated for auditability
        - I13: No hidden modifications to prompt
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if LLM provider is available.
        
        Returns:
            True if provider can be reached/used
        
        Constitutional: I1 enforcement - local providers should always return True
        """
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dict with model metadata (name, version, capabilities, etc.)
        
        Constitutional: I7 transparency requirement
        """
        pass
    
    def calculate_prompt_hash(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Calculate hash of prompt for auditability.
        
        I7: Required for constitutional transparency.
        """
        import hashlib
        content = prompt
        if system_prompt:
            content = f"{system_prompt}|||{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def stream_generate(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """
        Stream generation token by token (optional, provider-dependent).
        
        Default implementation: Not supported, falls back to generate().
        """
        raise NotImplementedError(
            f"Streaming not supported for {self.config.provider}"
        )


class LocalLLMBase(BaseLLM):
    """Base class for local LLM providers (Ollama, llama.cpp)"""
    
    def __init__(self, config: LLMConfig):
        # Enforce I1: Local models MUST work offline
        config.works_offline = True
        config.requires_network = False
        super().__init__(config)
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if local LLM service is running"""
        pass


class RemoteLLMBase(BaseLLM):
    """Base class for remote LLM providers (Claude, GPT)"""
    
    def __init__(self, config: LLMConfig):
        # I1: Remote models require network, not offline
        config.works_offline = False
        config.requires_network = True
        super().__init__(config)
    
    def is_available(self) -> bool:
        """
        I1: Remote providers are OPTIONAL.
        System must degrade gracefully if unavailable.
        """
        try:
            return self._check_api_reachable()
        except Exception:
            return False
    
    @abstractmethod
    def _check_api_reachable(self) -> bool:
        """Check if API endpoint is reachable"""
        pass
