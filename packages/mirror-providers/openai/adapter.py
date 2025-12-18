"""
OpenAI Provider Adapter

Implements the MirrorProvider interface for OpenAI's API.
Supports both synchronous generation and real-time streaming
with constitutional filtering applied to each chunk.
"""

import asyncio
import time
from typing import AsyncIterator, Optional, List, Dict, Any
from datetime import datetime

from ..base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    RateLimitError,
    AuthenticationError,
    ModelNotFoundError,
    ContentFilteredError,
    ContextLengthError,
    ModelTier,
    ProviderStatus,
)
from .models import get_model_info, OPENAI_MODELS


class OpenAIProvider(MirrorProvider):
    """
    OpenAI API adapter for Mirror.

    Translates OpenAI's chat completion API to Mirror's protocol.
    Handles rate limiting, retries, and streaming transparently.

    Example:
        provider = OpenAIProvider(
            api_key="sk-...",
            model="gpt-4o"
        )

        # Simple generation
        result = await provider.generate("What is the meaning of life?")
        print(result.content)

        # With context
        result = await provider.generate(
            "Continue the story",
            context={
                "system": "You are a creative writer.",
                "messages": [
                    {"role": "user", "content": "Once upon a time..."},
                    {"role": "assistant", "content": "...in a distant land..."}
                ]
            }
        )

        # Streaming
        async for chunk in provider.stream("Tell me a joke"):
            print(chunk.content, end="", flush=True)
    """

    # Default system prompt for Mirror compatibility
    DEFAULT_SYSTEM_PROMPT = (
        "You are a reflective AI assistant. "
        "You observe and reflect without directing or diagnosing. "
        "You never claim certainty about the user's internal states."
    )

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        api_base: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """
        Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key (required)
            model: Model identifier (default: gpt-4o)
            api_base: Custom API base URL (for Azure, proxies)
            timeout: Request timeout in seconds
            max_retries: Number of retries on transient errors
            temperature: Default sampling temperature
            max_tokens: Default max tokens per response
        """
        config = ProviderConfig(
            api_key=api_key,
            api_base=api_base,
            model=model,
            timeout_seconds=timeout,
            max_retries=max_retries,
            temperature=temperature,
            max_tokens=max_tokens,
            provider_name="openai",
        )
        super().__init__(config)

        self._model_info = get_model_info(model)
        self._client = None  # Lazy initialization

    def _get_client(self):
        """Lazy-initialize the OpenAI client."""
        if self._client is None:
            try:
                from openai import AsyncOpenAI
            except ImportError:
                raise ProviderError(
                    "OpenAI package not installed. Run: pip install openai",
                    provider="openai",
                    model=self.config.model
                )

            self._client = AsyncOpenAI(
                api_key=self.config.api_key,
                base_url=self.config.api_base,
                timeout=self.config.timeout_seconds,
                max_retries=0,  # We handle retries ourselves
            )
        return self._client

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Declare OpenAI capabilities based on model."""
        return ProviderCapabilities(
            supports_streaming=True,
            supports_function_calling=self._model_info.supports_function_calling,
            supports_vision=self._model_info.supports_vision,
            supports_json_mode=self._model_info.supports_json_mode,
            max_tokens=self._model_info.max_output_tokens,
            max_context_window=self._model_info.context_window,
            tier=self._model_info.tier,
            allows_crisis_content=True,
            requires_content_filtering=True,  # OpenAI has its own filters
        )

    def _build_messages(
        self,
        prompt: str,
        context: Optional[dict] = None
    ) -> List[Dict[str, str]]:
        """Build the messages array for the API call."""
        messages = []
        context = context or {}

        # System prompt
        system_prompt = context.get("system", self.DEFAULT_SYSTEM_PROMPT)
        messages.append({"role": "system", "content": system_prompt})

        # Prior messages (for multi-turn)
        if "messages" in context:
            for msg in context["messages"]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Current prompt
        messages.append({"role": "user", "content": prompt})

        return messages

    def _translate_error(self, error: Exception) -> ProviderError:
        """Translate OpenAI errors to Mirror errors."""
        error_str = str(error).lower()

        if "rate limit" in error_str or "429" in error_str:
            # Extract retry-after if available
            retry_after = None
            if hasattr(error, "response"):
                retry_after = error.response.headers.get("retry-after")
                if retry_after:
                    retry_after = float(retry_after)
            return RateLimitError(
                str(error),
                provider="openai",
                model=self.config.model,
                retry_after=retry_after
            )

        if "authentication" in error_str or "401" in error_str:
            return AuthenticationError(
                str(error),
                provider="openai",
                model=self.config.model
            )

        if "model not found" in error_str or "404" in error_str:
            return ModelNotFoundError(
                str(error),
                provider="openai",
                model=self.config.model
            )

        if "content_filter" in error_str or "content policy" in error_str:
            return ContentFilteredError(
                str(error),
                provider="openai",
                model=self.config.model
            )

        if "context_length" in error_str or "maximum context" in error_str:
            return ContextLengthError(
                str(error),
                provider="openai",
                model=self.config.model
            )

        return ProviderError(
            str(error),
            provider="openai",
            model=self.config.model
        )

    async def _execute_with_retry(self, operation, *args, **kwargs):
        """Execute operation with exponential backoff retry."""
        last_error = None
        base_delay = 1.0

        for attempt in range(self.config.max_retries + 1):
            try:
                return await operation(*args, **kwargs)
            except Exception as e:
                last_error = self._translate_error(e)

                # Don't retry auth or model errors
                if isinstance(last_error, (AuthenticationError, ModelNotFoundError)):
                    raise last_error

                # Don't retry on last attempt
                if attempt == self.config.max_retries:
                    raise last_error

                # Exponential backoff
                delay = base_delay * (2 ** attempt)
                if isinstance(last_error, RateLimitError) and last_error.retry_after:
                    delay = max(delay, last_error.retry_after)

                await asyncio.sleep(delay)

        raise last_error

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """
        Generate a response using OpenAI's chat completion API.

        Args:
            prompt: User's input text
            context: Optional dict with:
                - system: System prompt override
                - messages: Prior conversation messages
                - temperature: Override default temperature
                - max_tokens: Override default max tokens
                - response_format: {"type": "json_object"} for JSON mode
            **kwargs: Additional OpenAI-specific parameters

        Returns:
            GenerationResult with content and metadata

        Raises:
            ProviderError: On API errors
        """
        start_time = time.time()
        client = self._get_client()

        messages = self._build_messages(prompt, context)

        # Build request parameters
        params = {
            "model": self.config.model,
            "messages": messages,
            "temperature": context.get("temperature", self.config.temperature) if context else self.config.temperature,
            "max_tokens": context.get("max_tokens", self.config.max_tokens) if context else self.config.max_tokens,
        }

        # Optional JSON mode
        if context and context.get("response_format"):
            params["response_format"] = context["response_format"]

        # Add any extra kwargs
        params.update(kwargs)

        try:
            response = await self._execute_with_retry(
                client.chat.completions.create,
                **params
            )

            latency_ms = (time.time() - start_time) * 1000
            choice = response.choices[0]

            result = GenerationResult(
                content=choice.message.content or "",
                success=True,
                provider="openai",
                model=response.model,
                prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                completion_tokens=response.usage.completion_tokens if response.usage else 0,
                total_tokens=response.usage.total_tokens if response.usage else 0,
                latency_ms=latency_ms,
                finish_reason=choice.finish_reason,
                raw_response=response,
            )

            self._status = ProviderStatus.AVAILABLE
            self._track_request(success=True)
            return result

        except ProviderError:
            self._track_request(success=False)
            raise
        except Exception as e:
            self._track_request(success=False)
            raise self._translate_error(e)

    async def stream(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """
        Stream a response chunk by chunk.

        Each chunk can be independently filtered by the constitutional
        engine for real-time safety.

        Args:
            prompt: User's input text
            context: Optional context dict
            **kwargs: Additional parameters

        Yields:
            StreamChunk for each piece of the response

        Example:
            async for chunk in provider.stream("Tell me about AI"):
                # Each chunk can be filtered before display
                if constitutional_check(chunk.content):
                    print(chunk.content, end="", flush=True)
        """
        client = self._get_client()

        messages = self._build_messages(prompt, context)

        params = {
            "model": self.config.model,
            "messages": messages,
            "temperature": context.get("temperature", self.config.temperature) if context else self.config.temperature,
            "max_tokens": context.get("max_tokens", self.config.max_tokens) if context else self.config.max_tokens,
            "stream": True,
        }

        params.update(kwargs)

        try:
            stream = await self._execute_with_retry(
                client.chat.completions.create,
                **params
            )

            chunk_index = 0
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    finish_reason = chunk.choices[0].finish_reason

                    yield StreamChunk(
                        content=content,
                        index=chunk_index,
                        is_final=finish_reason is not None,
                        finish_reason=finish_reason,
                        raw_chunk=chunk,
                    )
                    chunk_index += 1

                # Handle final chunk
                if chunk.choices and chunk.choices[0].finish_reason:
                    if chunk_index == 0 or not chunk.choices[0].delta.content:
                        yield StreamChunk(
                            content="",
                            index=chunk_index,
                            is_final=True,
                            finish_reason=chunk.choices[0].finish_reason,
                            raw_chunk=chunk,
                        )
                    break

            self._status = ProviderStatus.AVAILABLE
            self._track_request(success=True)

        except ProviderError:
            self._track_request(success=False)
            raise
        except Exception as e:
            self._track_request(success=False)
            raise self._translate_error(e)

    async def health_check(self) -> bool:
        """
        Check if OpenAI API is accessible.

        Uses a minimal completion request to verify connectivity.
        """
        try:
            result = await self.generate(
                "Say 'ok'",
                context={"max_tokens": 5, "temperature": 0}
            )
            return result.success and len(result.content) > 0
        except Exception:
            return False

    def switch_model(self, model: str) -> "OpenAIProvider":
        """
        Return a new provider with a different model.

        Preserves all other configuration.

        Args:
            model: New model identifier

        Returns:
            New OpenAIProvider instance
        """
        return OpenAIProvider(
            api_key=self.config.api_key,
            model=model,
            api_base=self.config.api_base,
            timeout=self.config.timeout_seconds,
            max_retries=self.config.max_retries,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
