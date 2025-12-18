"""
Anthropic Model Definitions

Canonical list of supported Claude models with their capabilities.
"""

from dataclasses import dataclass
from typing import Dict
from ..base import ModelTier


@dataclass(frozen=True)
class AnthropicModelInfo:
    """Information about an Anthropic Claude model."""
    id: str
    tier: ModelTier
    context_window: int
    max_output_tokens: int
    supports_vision: bool = True
    supports_function_calling: bool = True  # Tool use
    deprecated: bool = False

    # Pricing (per 1M tokens)
    input_cost_per_million: float = 0.0
    output_cost_per_million: float = 0.0


# Canonical Claude model definitions (as of 2025)
ANTHROPIC_MODELS: Dict[str, AnthropicModelInfo] = {
    # Claude 4 family (latest)
    "claude-opus-4-20250514": AnthropicModelInfo(
        id="claude-opus-4-20250514",
        tier=ModelTier.FLAGSHIP,
        context_window=200000,
        max_output_tokens=32000,
        supports_vision=True,
        input_cost_per_million=15.00,
        output_cost_per_million=75.00,
    ),
    "claude-sonnet-4-20250514": AnthropicModelInfo(
        id="claude-sonnet-4-20250514",
        tier=ModelTier.BALANCED,
        context_window=200000,
        max_output_tokens=16000,
        supports_vision=True,
        input_cost_per_million=3.00,
        output_cost_per_million=15.00,
    ),

    # Claude 3.5 family
    "claude-3-5-sonnet-20241022": AnthropicModelInfo(
        id="claude-3-5-sonnet-20241022",
        tier=ModelTier.BALANCED,
        context_window=200000,
        max_output_tokens=8192,
        supports_vision=True,
        input_cost_per_million=3.00,
        output_cost_per_million=15.00,
    ),
    "claude-3-5-haiku-20241022": AnthropicModelInfo(
        id="claude-3-5-haiku-20241022",
        tier=ModelTier.FAST,
        context_window=200000,
        max_output_tokens=8192,
        supports_vision=True,
        input_cost_per_million=0.80,
        output_cost_per_million=4.00,
    ),

    # Claude 3 family
    "claude-3-opus-20240229": AnthropicModelInfo(
        id="claude-3-opus-20240229",
        tier=ModelTier.FLAGSHIP,
        context_window=200000,
        max_output_tokens=4096,
        supports_vision=True,
        input_cost_per_million=15.00,
        output_cost_per_million=75.00,
    ),
    "claude-3-sonnet-20240229": AnthropicModelInfo(
        id="claude-3-sonnet-20240229",
        tier=ModelTier.BALANCED,
        context_window=200000,
        max_output_tokens=4096,
        supports_vision=True,
        input_cost_per_million=3.00,
        output_cost_per_million=15.00,
    ),
    "claude-3-haiku-20240307": AnthropicModelInfo(
        id="claude-3-haiku-20240307",
        tier=ModelTier.FAST,
        context_window=200000,
        max_output_tokens=4096,
        supports_vision=True,
        input_cost_per_million=0.25,
        output_cost_per_million=1.25,
    ),
}

# Aliases for convenience
MODEL_ALIASES = {
    "claude-opus-4": "claude-opus-4-20250514",
    "claude-sonnet-4": "claude-sonnet-4-20250514",
    "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3.5-haiku": "claude-3-5-haiku-20241022",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-sonnet": "claude-3-sonnet-20240229",
    "claude-3-haiku": "claude-3-haiku-20240307",
    # Short aliases
    "opus": "claude-opus-4-20250514",
    "sonnet": "claude-sonnet-4-20250514",
    "haiku": "claude-3-5-haiku-20241022",
}


def resolve_model_id(model: str) -> str:
    """Resolve a model alias to its full ID."""
    return MODEL_ALIASES.get(model, model)


def get_model_info(model_id: str) -> AnthropicModelInfo:
    """
    Get model info, with alias resolution and fallback.

    Args:
        model_id: Model identifier or alias

    Returns:
        AnthropicModelInfo for the model
    """
    # Resolve aliases
    resolved = resolve_model_id(model_id)

    if resolved in ANTHROPIC_MODELS:
        return ANTHROPIC_MODELS[resolved]

    # Default for unknown models (forward compatibility)
    return AnthropicModelInfo(
        id=resolved,
        tier=ModelTier.BALANCED,
        context_window=200000,
        max_output_tokens=4096,
        supports_vision=True,
    )


def list_models(tier: ModelTier = None) -> list:
    """List available models, optionally filtered by tier."""
    models = list(ANTHROPIC_MODELS.values())
    if tier:
        models = [m for m in models if m.tier == tier]
    return [m for m in models if not m.deprecated]
