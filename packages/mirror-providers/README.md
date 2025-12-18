# Mirror Providers

AI provider adapters for Mirror's constitutional engine. Enables provider-agnostic AI integration with transparent switching, fallback chains, and load balancing.

## Installation

```bash
pip install mirror-providers

# With specific provider support
pip install mirror-providers[openai]      # OpenAI support
pip install mirror-providers[anthropic]   # Anthropic support
pip install mirror-providers[local]       # Ollama/local LLM support
pip install mirror-providers[all]         # All providers
```

## Quick Start

### Single Provider

```python
from mirror_providers.openai import OpenAIProvider
from mirror_providers.anthropic import AnthropicProvider
from mirror_providers.local import OllamaProvider

# OpenAI
provider = OpenAIProvider(api_key="sk-...", model="gpt-4o")
result = await provider.generate("What patterns do you notice?")

# Anthropic
provider = AnthropicProvider(api_key="sk-ant-...", model="claude-sonnet-4")
result = await provider.generate("Reflect on this moment...")

# Local (Ollama) - No API key needed!
provider = OllamaProvider(model="llama3.1")
result = await provider.generate("What themes emerge?")
```

### Streaming

```python
async for chunk in provider.stream("Tell me a story"):
    print(chunk.content, end="", flush=True)
```

### Fallback Chain

Try providers in order until one succeeds:

```python
from mirror_providers.pooling import FallbackChain

chain = FallbackChain([
    AnthropicProvider(api_key="...", model="claude-opus-4"),  # Primary
    OpenAIProvider(api_key="...", model="gpt-4o"),            # Fallback 1
    OllamaProvider(model="llama3.1")                          # Fallback 2
])

# Automatically falls back if primary is unavailable
result = await chain.generate("Complex reflection...")
```

### Load-Balanced Pool

Distribute requests across multiple providers:

```python
from mirror_providers.pooling import ProviderPool

pool = ProviderPool(
    providers=[provider1, provider2, provider3],
    strategy="least_loaded"  # or: round_robin, random, weighted, latency
)

# Requests are distributed across healthy providers
results = await asyncio.gather(*[
    pool.generate(f"Request {i}") for i in range(100)
])
```

### Tiered Routing

Route by request complexity:

```python
from mirror_providers.pooling import TieredRouter

router = TieredRouter(
    flagship=AnthropicProvider(model="claude-opus-4"),    # Complex
    balanced=AnthropicProvider(model="claude-sonnet-4"),  # General
    fast=OllamaProvider(model="llama3.1")                 # Simple
)

# Automatically routes based on prompt complexity
result = await router.generate("ok")  # → fast tier
result = await router.generate("Analyze this philosophical question in depth...")  # → flagship
```

## Provider Capabilities

Each provider declares its capabilities:

```python
caps = provider.capabilities

caps.supports_streaming      # Real-time streaming support
caps.supports_vision         # Image input support
caps.supports_function_calling
caps.max_tokens              # Maximum output tokens
caps.max_context_window      # Maximum input context
caps.tier                    # FLAGSHIP, BALANCED, FAST, or LOCAL
```

## Error Handling

```python
from mirror_providers.base import (
    ProviderError,
    RateLimitError,
    AuthenticationError,
    ModelNotFoundError,
)

try:
    result = await provider.generate("test")
except RateLimitError as e:
    print(f"Rate limited. Retry after: {e.retry_after}s")
except AuthenticationError:
    print("Invalid API key")
except ModelNotFoundError:
    print(f"Model not found: {provider.model_name}")
```

## Health Checks

```python
is_healthy = await provider.health_check()
stats = provider.get_stats()
# {'provider': 'openai', 'model': 'gpt-4o', 'status': 'available', ...}
```

## Data Sovereignty

For complete data sovereignty, use the local provider:

```python
# All data stays on your machine
provider = OllamaProvider(model="llama3.1")

# No API keys, no external calls
result = await provider.generate("Private reflection...")
```

## Supported Models

### OpenAI
- `gpt-4o`, `gpt-4o-mini`
- `gpt-4-turbo`, `gpt-4`
- `gpt-3.5-turbo`

### Anthropic
- `claude-opus-4-20250514` (alias: `opus`, `claude-opus-4`)
- `claude-sonnet-4-20250514` (alias: `sonnet`, `claude-sonnet-4`)
- `claude-3-5-sonnet-20241022`
- `claude-3-5-haiku-20241022`

### Ollama (Local)
- `llama3.1`, `llama3.1:70b`
- `llama3.2`, `llama3.2:1b`
- `mistral`, `mixtral`
- `phi3`, `gemma2`, `qwen2.5`
- Any model available via `ollama pull`

## License

MIT
