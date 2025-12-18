"""
Ollama Provider Adapter

Implements the MirrorProvider interface for Ollama local LLMs.
Enables complete data sovereignty - no API calls leave the user's machine.

Ollama supports many models:
- LLaMA 3.1 (8B, 70B, 405B)
- Mistral (7B, 8x7B)
- Phi-3
- Gemma 2
- And many more

See: https://ollama.ai/library
"""

import asyncio
import time
import aiohttp
from typing import AsyncIterator, Optional, List, Dict, Any
from dataclasses import dataclass

from ..base import (
    MirrorProvider,
    ProviderConfig,
    ProviderCapabilities,
    GenerationResult,
    StreamChunk,
    ProviderError,
    ModelNotFoundError,
    ModelTier,
    ProviderStatus,
)


@dataclass(frozen=True)
class OllamaModelInfo:
    """Information about an Ollama model."""
    id: str
    tier: ModelTier
    context_window: int
    description: str = ""


# Common Ollama models
OLLAMA_MODELS: Dict[str, OllamaModelInfo] = {
    # LLaMA 3.1 family
    "llama3.1": OllamaModelInfo(
        id="llama3.1",
        tier=ModelTier.LOCAL,
        context_window=128000,
        description="Meta LLaMA 3.1 8B - excellent quality/size ratio"
    ),
    "llama3.1:70b": OllamaModelInfo(
        id="llama3.1:70b",
        tier=ModelTier.LOCAL,
        context_window=128000,
        description="Meta LLaMA 3.1 70B - near-flagship quality"
    ),

    # LLaMA 3.2 family
    "llama3.2": OllamaModelInfo(
        id="llama3.2",
        tier=ModelTier.LOCAL,
        context_window=128000,
        description="Meta LLaMA 3.2 3B - fast and efficient"
    ),
    "llama3.2:1b": OllamaModelInfo(
        id="llama3.2:1b",
        tier=ModelTier.LOCAL,
        context_window=128000,
        description="Meta LLaMA 3.2 1B - ultra lightweight"
    ),

    # Mistral family
    "mistral": OllamaModelInfo(
        id="mistral",
        tier=ModelTier.LOCAL,
        context_window=32768,
        description="Mistral 7B - fast and capable"
    ),
    "mixtral": OllamaModelInfo(
        id="mixtral",
        tier=ModelTier.LOCAL,
        context_window=32768,
        description="Mixtral 8x7B - MoE architecture"
    ),

    # Phi family (Microsoft)
    "phi3": OllamaModelInfo(
        id="phi3",
        tier=ModelTier.LOCAL,
        context_window=4096,
        description="Microsoft Phi-3 Mini - very efficient"
    ),
    "phi3:medium": OllamaModelInfo(
        id="phi3:medium",
        tier=ModelTier.LOCAL,
        context_window=4096,
        description="Microsoft Phi-3 Medium"
    ),

    # Gemma family (Google)
    "gemma2": OllamaModelInfo(
        id="gemma2",
        tier=ModelTier.LOCAL,
        context_window=8192,
        description="Google Gemma 2 9B"
    ),
    "gemma2:27b": OllamaModelInfo(
        id="gemma2:27b",
        tier=ModelTier.LOCAL,
        context_window=8192,
        description="Google Gemma 2 27B"
    ),

    # Qwen family (Alibaba)
    "qwen2.5": OllamaModelInfo(
        id="qwen2.5",
        tier=ModelTier.LOCAL,
        context_window=32768,
        description="Alibaba Qwen 2.5 7B"
    ),
    "qwen2.5:72b": OllamaModelInfo(
        id="qwen2.5:72b",
        tier=ModelTier.LOCAL,
        context_window=32768,
        description="Alibaba Qwen 2.5 72B"
    ),
}


def get_model_info(model_id: str) -> OllamaModelInfo:
    """Get model info with fallback for unknown models."""
    if model_id in OLLAMA_MODELS:
        return OLLAMA_MODELS[model_id]

    # Check base model (e.g., llama3.1:8b -> llama3.1)
    base_model = model_id.split(":")[0]
    if base_model in OLLAMA_MODELS:
        return OLLAMA_MODELS[base_model]

    # Default for unknown models
    return OllamaModelInfo(
        id=model_id,
        tier=ModelTier.LOCAL,
        context_window=4096,
        description="Unknown model"
    )


class OllamaProvider(MirrorProvider):
    """
    Ollama local LLM adapter for Mirror.

    Enables complete data sovereignty by running models locally.
    No API keys required, no data leaves your machine.

    Prerequisites:
        1. Install Ollama: https://ollama.ai
        2. Pull a model: ollama pull llama3.1
        3. Ollama runs on localhost:11434 by default

    Example:
        # Basic usage
        provider = OllamaProvider(model="llama3.1")
        result = await provider.generate("What patterns do you notice?")

        # Custom host (e.g., running on another machine)
        provider = OllamaProvider(
            model="llama3.1:70b",
            host="http://192.168.1.100:11434"
        )

        # Streaming
        async for chunk in provider.stream("Reflect on this..."):
            print(chunk.content, end="", flush=True)
    """

    DEFAULT_HOST = "http://localhost:11434"

    # Mirror-aligned system prompt for local models
    DEFAULT_SYSTEM_PROMPT = (
        "You are a reflective presence. You observe and reflect without "
        "directing or diagnosing. You notice patterns and themes, "
        "reflecting them back without claiming certainty about internal "
        "states or prescribing solutions."
    )

    def __init__(
        self,
        model: str = "llama3.1",
        host: Optional[str] = None,
        timeout: float = 120.0,  # Local models can be slower
        max_retries: int = 2,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """
        Initialize Ollama provider.

        Args:
            model: Ollama model name (e.g., "llama3.1", "mistral")
            host: Ollama server URL (default: http://localhost:11434)
            timeout: Request timeout in seconds (higher for local)
            max_retries: Number of retries on transient errors
            temperature: Default sampling temperature
            max_tokens: Default max tokens per response (num_predict in Ollama)
        """
        config = ProviderConfig(
            api_key=None,  # No API key needed
            api_base=host or self.DEFAULT_HOST,
            model=model,
            timeout_seconds=timeout,
            max_retries=max_retries,
            temperature=temperature,
            max_tokens=max_tokens,
            provider_name="ollama",
        )
        super().__init__(config)

        self._model_info = get_model_info(model)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout_seconds)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def close(self):
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Declare Ollama capabilities."""
        return ProviderCapabilities(
            supports_streaming=True,
            supports_function_calling=False,  # Limited support in Ollama
            supports_vision=False,  # Depends on model
            supports_json_mode=True,  # Ollama supports format=json
            max_tokens=self._model_info.context_window,
            max_context_window=self._model_info.context_window,
            tier=ModelTier.LOCAL,
            allows_crisis_content=True,
            requires_content_filtering=False,  # No external filtering
        )

    def _translate_error(self, error: Exception) -> ProviderError:
        """Translate Ollama errors to Mirror errors."""
        error_str = str(error).lower()

        if "not found" in error_str or "unknown model" in error_str:
            return ModelNotFoundError(
                f"Model '{self.config.model}' not found. "
                f"Run: ollama pull {self.config.model}",
                provider="ollama",
                model=self.config.model
            )

        if "connection" in error_str or "refused" in error_str:
            return ProviderError(
                "Cannot connect to Ollama. Is it running? "
                "Start with: ollama serve",
                provider="ollama",
                model=self.config.model
            )

        return ProviderError(
            str(error),
            provider="ollama",
            model=self.config.model
        )

    async def _execute_with_retry(self, operation, *args, **kwargs):
        """Execute operation with retry on transient errors."""
        last_error = None
        base_delay = 0.5

        for attempt in range(self.config.max_retries + 1):
            try:
                return await operation(*args, **kwargs)
            except Exception as e:
                last_error = self._translate_error(e)

                # Don't retry model not found
                if isinstance(last_error, ModelNotFoundError):
                    raise last_error

                if attempt == self.config.max_retries:
                    raise last_error

                await asyncio.sleep(base_delay * (2 ** attempt))

        raise last_error

    async def generate(
        self,
        prompt: str,
        context: Optional[dict] = None,
        **kwargs
    ) -> GenerationResult:
        """
        Generate a response using Ollama's API.

        Args:
            prompt: User's input text
            context: Optional dict with:
                - system: System prompt override
                - messages: Prior conversation messages
                - temperature: Override default temperature
                - max_tokens: Override default max tokens
            **kwargs: Additional Ollama-specific parameters

        Returns:
            GenerationResult with content and metadata
        """
        start_time = time.time()
        session = await self._get_session()
        context = context or {}

        # Build messages for chat endpoint
        messages = []

        # System prompt
        system_prompt = context.get("system", self.DEFAULT_SYSTEM_PROMPT)
        messages.append({"role": "system", "content": system_prompt})

        # Prior messages
        if "messages" in context:
            for msg in context["messages"]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Current prompt
        messages.append({"role": "user", "content": prompt})

        # Build request payload
        payload = {
            "model": self.config.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": context.get("temperature", self.config.temperature),
                "num_predict": context.get("max_tokens", self.config.max_tokens),
            }
        }

        # Add any extra options
        if kwargs:
            payload["options"].update(kwargs)

        url = f"{self.config.api_base}/api/chat"

        try:
            async def _make_request():
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise ProviderError(
                            f"Ollama error ({response.status}): {text}",
                            provider="ollama",
                            model=self.config.model
                        )
                    return await response.json()

            data = await self._execute_with_retry(_make_request)

            latency_ms = (time.time() - start_time) * 1000

            result = GenerationResult(
                content=data.get("message", {}).get("content", ""),
                success=True,
                provider="ollama",
                model=data.get("model", self.config.model),
                prompt_tokens=data.get("prompt_eval_count", 0),
                completion_tokens=data.get("eval_count", 0),
                total_tokens=(
                    data.get("prompt_eval_count", 0) +
                    data.get("eval_count", 0)
                ),
                latency_ms=latency_ms,
                finish_reason=data.get("done_reason", "stop"),
                raw_response=data,
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

        Local streaming enables real-time constitutional filtering
        without latency from round trips to external APIs.

        Args:
            prompt: User's input text
            context: Optional context dict
            **kwargs: Additional parameters

        Yields:
            StreamChunk for each piece of the response
        """
        session = await self._get_session()
        context = context or {}

        # Build messages
        messages = []
        system_prompt = context.get("system", self.DEFAULT_SYSTEM_PROMPT)
        messages.append({"role": "system", "content": system_prompt})

        if "messages" in context:
            for msg in context["messages"]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.config.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": context.get("temperature", self.config.temperature),
                "num_predict": context.get("max_tokens", self.config.max_tokens),
            }
        }

        if kwargs:
            payload["options"].update(kwargs)

        url = f"{self.config.api_base}/api/chat"

        try:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    text = await response.text()
                    raise self._translate_error(
                        Exception(f"Ollama error ({response.status}): {text}")
                    )

                chunk_index = 0
                async for line in response.content:
                    if not line:
                        continue

                    try:
                        import json
                        data = json.loads(line.decode())
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        continue

                    message = data.get("message", {})
                    content = message.get("content", "")
                    done = data.get("done", False)

                    if content:
                        yield StreamChunk(
                            content=content,
                            index=chunk_index,
                            is_final=done,
                            finish_reason="stop" if done else None,
                            raw_chunk=data,
                        )
                        chunk_index += 1

                    if done:
                        if chunk_index == 0:
                            # Ensure we yield at least one chunk
                            yield StreamChunk(
                                content="",
                                index=0,
                                is_final=True,
                                finish_reason="stop",
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
        """Check if Ollama is running and model is available."""
        try:
            session = await self._get_session()

            # Check if Ollama is running
            async with session.get(f"{self.config.api_base}/api/tags") as response:
                if response.status != 200:
                    self._status = ProviderStatus.UNAVAILABLE
                    return False

                data = await response.json()
                models = [m.get("name", "") for m in data.get("models", [])]

                # Check if our model is available
                model_available = any(
                    self.config.model in m or m.startswith(self.config.model)
                    for m in models
                )

                if model_available:
                    self._status = ProviderStatus.AVAILABLE
                    return True
                else:
                    self._status = ProviderStatus.UNAVAILABLE
                    self._last_error = f"Model {self.config.model} not found. Available: {models}"
                    return False

        except Exception as e:
            self._status = ProviderStatus.UNAVAILABLE
            self._last_error = str(e)
            return False

    async def list_available_models(self) -> List[str]:
        """List models available in local Ollama installation."""
        try:
            session = await self._get_session()
            async with session.get(f"{self.config.api_base}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    return [m.get("name", "") for m in data.get("models", [])]
        except Exception:
            pass
        return []

    def switch_model(self, model: str) -> "OllamaProvider":
        """Return a new provider with a different model."""
        return OllamaProvider(
            model=model,
            host=self.config.api_base,
            timeout=self.config.timeout_seconds,
            max_retries=self.config.max_retries,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
