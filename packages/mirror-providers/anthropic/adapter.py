"""
Anthropic Provider Adapter

Implements the MirrorProvider interface for Anthropic's Claude API.
Claude models are particularly well-suited for Mirror's constitutional
approach due to their training methodology.
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
from .models import get_model_info, resolve_model_id, ANTHROPIC_MODELS


class AnthropicProvider(MirrorProvider):
    """
    Anthropic Claude API adapter for Mirror.

    Claude models align naturally with Mirror's constitutional approach
    due to their Constitutional AI training. This adapter translates
    Anthropic's Messages API to Mirror's protocol.

    Example:
        provider = AnthropicProvider(
            api_key="sk-ant-...",
            model="claude-sonnet-4-20250514"
        )

        # Simple generation
        result = await provider.generate("I notice a pattern in my thoughts...")
        print(result.content)

        # With system prompt and context
        result = await provider.generate(
            "What do you observe?",
            context={
                "system": "You are a reflective mirror, observing without judging.",
                "messages": [
                    {"role": "user", "content": "I've been feeling stuck lately."},
                    {"role": "assistant", "content": "I notice you mention feeling stuck..."}
                ]
            }
        )

        # Streaming with constitutional filtering
        async for chunk in provider.stream("Reflect on this..."):
            print(chunk.content, end="", flush=True)
    """

    # Mirror-aligned system prompt
    DEFAULT_SYSTEM_PROMPT = (
        "You are a reflective presence - a mirror that observes patterns "
        "without directing or diagnosing. You notice themes and tensions "
        "in what users share, reflecting them back without claiming certainty "
        "about internal states or prescribing solutions. Your role is to "
        "illuminate, not to guide."
    )

    def __init__(
        self,
        api_key: str,
        model: str = "claude-sonnet-4-20250514",
        api_base: Optional[str] = None,
        timeout: float = 60.0,
        max_retries: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """
        Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key (required)
            model: Model identifier or alias (default: claude-sonnet-4-20250514)
            api_base: Custom API base URL (for proxies)
            timeout: Request timeout in seconds
            max_retries: Number of retries on transient errors
            temperature: Default sampling temperature
            max_tokens: Default max tokens per response
        """
        # Resolve model aliases
        resolved_model = resolve_model_id(model)

        config = ProviderConfig(
            api_key=api_key,
            api_base=api_base,
            model=resolved_model,
            timeout_seconds=timeout,
            max_retries=max_retries,
            temperature=temperature,
            max_tokens=max_tokens,
            provider_name="anthropic",
        )
        super().__init__(config)

        self._model_info = get_model_info(resolved_model)
        self._client = None

    def _get_client(self):
        """Lazy-initialize the Anthropic client."""
        if self._client is None:
            try:
                from anthropic import AsyncAnthropic
            except ImportError:
                raise ProviderError(
                    "Anthropic package not installed. Run: pip install anthropic",
                    provider="anthropic",
                    model=self.config.model
                )

            client_kwargs = {
                "api_key": self.config.api_key,
                "timeout": self.config.timeout_seconds,
                "max_retries": 0,  # We handle retries ourselves
            }

            if self.config.api_base:
                client_kwargs["base_url"] = self.config.api_base

            self._client = AsyncAnthropic(**client_kwargs)
        return self._client

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Declare Anthropic capabilities based on model."""
        return ProviderCapabilities(
            supports_streaming=True,
            supports_function_calling=self._model_info.supports_function_calling,
            supports_vision=self._model_info.supports_vision,
            supports_json_mode=False,  # Anthropic doesn't have explicit JSON mode
            max_tokens=self._model_info.max_output_tokens,
            max_context_window=self._model_info.context_window,
            tier=self._model_info.tier,
            allows_crisis_content=True,
            requires_content_filtering=False,  # Claude's training is constitutional
        )

    def _build_messages(
        self,
        prompt: str,
        context: Optional[dict] = None
    ) -> List[Dict[str, Any]]:
        """Build the messages array for the API call."""
        messages = []
        context = context or {}

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
        """Translate Anthropic errors to Mirror errors."""
        error_str = str(error).lower()

        if "rate_limit" in error_str or "429" in error_str:
            retry_after = None
            if hasattr(error, "response"):
                headers = getattr(error.response, "headers", {})
                retry_after_str = headers.get("retry-after")
                if retry_after_str:
                    try:
                        retry_after = float(retry_after_str)
                    except ValueError:
                        pass
            return RateLimitError(
                str(error),
                provider="anthropic",
                model=self.config.model,
                retry_after=retry_after
            )

        if "authentication" in error_str or "401" in error_str or "invalid api key" in error_str:
            return AuthenticationError(
                str(error),
                provider="anthropic",
                model=self.config.model
            )

        if "model not found" in error_str or "404" in error_str:
            return ModelNotFoundError(
                str(error),
                provider="anthropic",
                model=self.config.model
            )

        if "content" in error_str and "filter" in error_str:
            return ContentFilteredError(
                str(error),
                provider="anthropic",
                model=self.config.model
            )

        if "context" in error_str and "length" in error_str:
            return ContextLengthError(
                str(error),
                provider="anthropic",
                model=self.config.model
            )

        return ProviderError(
            str(error),
            provider="anthropic",
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
        Generate a response using Anthropic's Messages API.

        Args:
            prompt: User's input text
            context: Optional dict with:
                - system: System prompt override
                - messages: Prior conversation messages
                - temperature: Override default temperature
                - max_tokens: Override default max tokens
            **kwargs: Additional Anthropic-specific parameters

        Returns:
            GenerationResult with content and metadata
        """
        start_time = time.time()
        client = self._get_client()

        messages = self._build_messages(prompt, context)
        system_prompt = (context or {}).get("system", self.DEFAULT_SYSTEM_PROMPT)

        # Build request parameters
        params = {
            "model": self.config.model,
            "messages": messages,
            "system": system_prompt,
            "temperature": (context or {}).get("temperature", self.config.temperature),
            "max_tokens": (context or {}).get("max_tokens", self.config.max_tokens),
        }

        # Add any extra kwargs
        params.update(kwargs)

        try:
            response = await self._execute_with_retry(
                client.messages.create,
                **params
            )

            latency_ms = (time.time() - start_time) * 1000

            # Extract content from response
            content = ""
            if response.content:
                for block in response.content:
                    if hasattr(block, "text"):
                        content += block.text

            result = GenerationResult(
                content=content,
                success=True,
                provider="anthropic",
                model=response.model,
                prompt_tokens=response.usage.input_tokens if response.usage else 0,
                completion_tokens=response.usage.output_tokens if response.usage else 0,
                total_tokens=(
                    (response.usage.input_tokens + response.usage.output_tokens)
                    if response.usage else 0
                ),
                latency_ms=latency_ms,
                finish_reason=response.stop_reason,
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

        Anthropic's streaming provides fine-grained chunks suitable
        for real-time constitutional filtering.

        Args:
            prompt: User's input text
            context: Optional context dict
            **kwargs: Additional parameters

        Yields:
            StreamChunk for each piece of the response
        """
        client = self._get_client()

        messages = self._build_messages(prompt, context)
        system_prompt = (context or {}).get("system", self.DEFAULT_SYSTEM_PROMPT)

        params = {
            "model": self.config.model,
            "messages": messages,
            "system": system_prompt,
            "temperature": (context or {}).get("temperature", self.config.temperature),
            "max_tokens": (context or {}).get("max_tokens", self.config.max_tokens),
        }

        params.update(kwargs)

        try:
            async with client.messages.stream(**params) as stream:
                chunk_index = 0

                async for text in stream.text_stream:
                    yield StreamChunk(
                        content=text,
                        index=chunk_index,
                        is_final=False,
                    )
                    chunk_index += 1

                # Get final message for metadata
                final_message = await stream.get_final_message()
                yield StreamChunk(
                    content="",
                    index=chunk_index,
                    is_final=True,
                    finish_reason=final_message.stop_reason,
                )

            self._status = ProviderStatus.AVAILABLE
            self._track_request(success=True)

        except ProviderError:
            self._track_request(success=False)
            raise
        except Exception as e:
            self._track_request(success=False)
            raise self._translate_error(e)

    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible."""
        try:
            result = await self.generate(
                "Say 'ok'",
                context={"max_tokens": 10, "temperature": 0}
            )
            return result.success and len(result.content) > 0
        except Exception:
            return False

    def switch_model(self, model: str) -> "AnthropicProvider":
        """
        Return a new provider with a different model.

        Args:
            model: New model identifier or alias

        Returns:
            New AnthropicProvider instance
        """
        return AnthropicProvider(
            api_key=self.config.api_key,
            model=model,
            api_base=self.config.api_base,
            timeout=self.config.timeout_seconds,
            max_retries=self.config.max_retries,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
