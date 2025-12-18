"""
Mirror Provider Base - Abstract Interface for AI Backends

This module defines the canonical interface that all AI providers must implement
to work with Mirror's constitutional engine. The interface ensures:

1. Stateless generation (no hidden context)
2. Real-time streaming with constitutional filtering
3. Transparent capability declaration
4. Consistent error handling

All providers MUST be stateless - conversation context is managed by the caller.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import AsyncIterator, Optional, Any
from datetime import datetime
import hashlib


class ProviderStatus(Enum):
    """Current operational status of a provider."""
    AVAILABLE = "available"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    RATE_LIMITED = "rate_limited"
    AUTHENTICATION_FAILED = "authentication_failed"


class ModelTier(Enum):
    """Model capability tier for routing decisions."""
    FLAGSHIP = "flagship"      # Best quality (GPT-4, Claude Opus)
    BALANCED = "balanced"      # Good quality/speed tradeoff (GPT-4-turbo, Claude Sonnet)
    FAST = "fast"              # Speed optimized (GPT-3.5, Claude Haiku)
    LOCAL = "local"            # Local models (Llama, Mistral via Ollama)


@dataclass(frozen=True)
class ProviderCapabilities:
    """
    Declares what a provider can do.

    Used by the pooling layer to make routing decisions.
    Immutable to prevent runtime modification.
    """
    supports_streaming: bool = True
    supports_function_calling: bool = False
    supports_vision: bool = False
    supports_json_mode: bool = False
    max_tokens: int = 4096
    max_context_window: int = 8192
    tier: ModelTier = ModelTier.BALANCED

    # Constitutional constraints
    allows_crisis_content: bool = True  # Can handle sensitive topics
    requires_content_filtering: bool = True  # Provider has own filters

    def to_dict(self) -> dict:
        """Serialize for logging/audit."""
        return {
            "supports_streaming": self.supports_streaming,
            "supports_function_calling": self.supports_function_calling,
            "supports_vision": self.supports_vision,
            "supports_json_mode": self.supports_json_mode,
            "max_tokens": self.max_tokens,
            "max_context_window": self.max_context_window,
            "tier": self.tier.value,
            "allows_crisis_content": self.allows_crisis_content,
            "requires_content_filtering": self.requires_content_filtering,
        }


@dataclass
class ProviderConfig:
    """
    Configuration for a provider instance.

    API keys should be passed here, never hardcoded.
    """
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model: str = ""
    timeout_seconds: float = 30.0
    max_retries: int = 3

    # Generation defaults
    temperature: float = 0.7
    max_tokens: int = 1024

    # Constitutional settings
    pre_filter: bool = True  # Filter input through L0 before sending
    post_filter: bool = True  # Filter output through L0-L3 after receiving

    # Metadata
    provider_name: str = ""

    def __post_init__(self):
        # Mask API key in repr for security
        self._masked_key = self._mask_key(self.api_key) if self.api_key else None

    @staticmethod
    def _mask_key(key: str) -> str:
        """Mask API key for safe logging."""
        if len(key) <= 8:
            return "***"
        return f"{key[:4]}...{key[-4:]}"

    def __repr__(self) -> str:
        return (
            f"ProviderConfig(provider={self.provider_name}, "
            f"model={self.model}, api_key={self._masked_key})"
        )


@dataclass
class StreamChunk:
    """
    A single chunk from a streaming response.

    Each chunk is independently valid and can be filtered.
    """
    content: str
    index: int
    is_final: bool = False
    finish_reason: Optional[str] = None

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    raw_chunk: Optional[Any] = None  # Original provider response

    def __post_init__(self):
        # Generate content hash for audit
        self.content_hash = hashlib.sha256(
            self.content.encode()
        ).hexdigest()[:16]


@dataclass
class GenerationResult:
    """
    Complete result from a generation request.

    Includes both the content and metadata for auditing.
    """
    content: str
    success: bool

    # Provider metadata
    provider: str
    model: str

    # Usage statistics
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    # Timing
    latency_ms: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Error information (if success=False)
    error: Optional[str] = None
    error_code: Optional[str] = None

    # Finish reason
    finish_reason: Optional[str] = None

    # Raw response (for debugging, excluded from audit)
    raw_response: Optional[Any] = field(default=None, repr=False)

    def __post_init__(self):
        # Generate content hash for audit trail
        self.content_hash = hashlib.sha256(
            self.content.encode()
        ).hexdigest()

    def to_audit_dict(self) -> dict:
        """Serialize for audit trail (excludes raw response)."""
        return {
            "content_hash": self.content_hash,
            "success": self.success,
            "provider": self.provider,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at.isoformat(),
            "error": self.error,
            "error_code": self.error_code,
            "finish_reason": self.finish_reason,
        }


# Custom Exceptions

class ProviderError(Exception):
    """Base exception for provider errors."""

    def __init__(self, message: str, provider: str = "", model: str = ""):
        self.message = message
        self.provider = provider
        self.model = model
        super().__init__(f"[{provider}/{model}] {message}")


class RateLimitError(ProviderError):
    """Raised when provider rate limit is hit."""

    def __init__(
        self,
        message: str,
        provider: str = "",
        model: str = "",
        retry_after: Optional[float] = None
    ):
        super().__init__(message, provider, model)
        self.retry_after = retry_after


class AuthenticationError(ProviderError):
    """Raised when API key is invalid or expired."""
    pass


class ModelNotFoundError(ProviderError):
    """Raised when requested model doesn't exist."""
    pass


class ContentFilteredError(ProviderError):
    """Raised when provider's own content filter blocks the request."""
    pass


class ContextLengthError(ProviderError):
    """Raised when input exceeds model's context window."""
    pass


class MirrorProvider(ABC):
    """
    Abstract base class for all AI providers.

    All providers MUST:
    1. Be stateless (no hidden context between calls)
    2. Support async generation
    3. Declare their capabilities accurately
    4. Handle errors gracefully

    Providers SHOULD:
    1. Support streaming for real-time filtering
    2. Return accurate token counts
    3. Implement health checks

    Example implementation:

        class MyProvider(MirrorProvider):
            def __init__(self, api_key: str, model: str = "my-model"):
                config = ProviderConfig(
                    api_key=api_key,
                    model=model,
                    provider_name="my-provider"
                )
                super().__init__(config)

            @property
            def capabilities(self) -> ProviderCapabilities:
                return ProviderCapabilities(
                    supports_streaming=True,
                    max_tokens=4096,
                    tier=ModelTier.BALANCED
                )

            async def generate(self, prompt, context) -> GenerationResult:
                # Implementation here
                pass
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self._status = ProviderStatus.AVAILABLE
        self._last_error: Optional[str] = None
        self._request_count = 0
        self._error_count = 0

    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """
        Declare this provider's capabilities.

        MUST be accurate - the pooling layer uses this for routing.
        """
        pass

    @property
    def provider_name(self) -> str:
        """Human-readable provider name."""
        return self.config.provider_name or self.__class__.__name__

    @property
    def model_name(self) -> str:
        """Current model identifier."""
        return self.config.model

    @property
    def status(self) -> ProviderStatus:
        """Current operational status."""
        return self._status

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """
        Generate a response for the given prompt.

        Args:
            prompt: The user's input or system+user prompt
            context: Optional context dict with:
                - messages: List of prior messages (for chat models)
                - system: System prompt
                - temperature: Override default temperature
                - max_tokens: Override default max tokens
            **kwargs: Provider-specific options

        Returns:
            GenerationResult with content and metadata

        Raises:
            ProviderError: On generation failure
            RateLimitError: When rate limited
            AuthenticationError: On auth failure

        Note:
            This method MUST be stateless. All context must be passed
            explicitly. Do not cache or remember previous calls.
        """
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """
        Stream a response chunk by chunk.

        Args:
            prompt: The user's input
            context: Optional context dict
            **kwargs: Provider-specific options

        Yields:
            StreamChunk for each piece of the response

        Note:
            Each chunk should be independently valid for filtering.
            The final chunk should have is_final=True.
        """
        pass

    async def health_check(self) -> bool:
        """
        Check if the provider is operational.

        Default implementation tries a minimal generation.
        Override for more efficient checks (e.g., status endpoint).

        Returns:
            True if provider is healthy
        """
        try:
            result = await self.generate(
                "Say 'ok'",
                context={"max_tokens": 5}
            )
            self._status = ProviderStatus.AVAILABLE
            return result.success
        except RateLimitError:
            self._status = ProviderStatus.RATE_LIMITED
            return False
        except AuthenticationError:
            self._status = ProviderStatus.AUTHENTICATION_FAILED
            return False
        except Exception as e:
            self._status = ProviderStatus.UNAVAILABLE
            self._last_error = str(e)
            return False

    def _track_request(self, success: bool):
        """Track request statistics."""
        self._request_count += 1
        if not success:
            self._error_count += 1

    def get_stats(self) -> dict:
        """Get provider statistics."""
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "status": self._status.value,
            "request_count": self._request_count,
            "error_count": self._error_count,
            "error_rate": (
                self._error_count / self._request_count
                if self._request_count > 0 else 0.0
            ),
            "last_error": self._last_error,
            "capabilities": self.capabilities.to_dict(),
        }

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"model={self.model_name}, "
            f"status={self._status.value})"
        )
