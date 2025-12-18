"""
OpenAI Model Definitions

Canonical list of supported OpenAI models with their capabilities.
Used for validation and routing decisions.
"""

from dataclasses import dataclass
from typing import Dict
from ..base import ModelTier


@dataclass(frozen=True)
class OpenAIModelInfo:
    """Information about an OpenAI model."""
    id: str
    tier: ModelTier
    context_window: int
    max_output_tokens: int
    supports_vision: bool = False
    supports_function_calling: bool = True
    supports_json_mode: bool = True
    deprecated: bool = False

    # Pricing (per 1M tokens, for cost estimation)
    input_cost_per_million: float = 0.0
    output_cost_per_million: float = 0.0


# Canonical model definitions (as of 2025)
OPENAI_MODELS: Dict[str, OpenAIModelInfo] = {
    # GPT-4o family (latest flagship)
    "gpt-4o": OpenAIModelInfo(
        id="gpt-4o",
        tier=ModelTier.FLAGSHIP,
        context_window=128000,
        max_output_tokens=16384,
        supports_vision=True,
        input_cost_per_million=2.50,
        output_cost_per_million=10.00,
    ),
    "gpt-4o-mini": OpenAIModelInfo(
        id="gpt-4o-mini",
        tier=ModelTier.FAST,
        context_window=128000,
        max_output_tokens=16384,
        supports_vision=True,
        input_cost_per_million=0.15,
        output_cost_per_million=0.60,
    ),

    # GPT-4 Turbo
    "gpt-4-turbo": OpenAIModelInfo(
        id="gpt-4-turbo",
        tier=ModelTier.BALANCED,
        context_window=128000,
        max_output_tokens=4096,
        supports_vision=True,
        input_cost_per_million=10.00,
        output_cost_per_million=30.00,
    ),
    "gpt-4-turbo-preview": OpenAIModelInfo(
        id="gpt-4-turbo-preview",
        tier=ModelTier.BALANCED,
        context_window=128000,
        max_output_tokens=4096,
        supports_vision=False,
        input_cost_per_million=10.00,
        output_cost_per_million=30.00,
    ),

    # GPT-4 (original)
    "gpt-4": OpenAIModelInfo(
        id="gpt-4",
        tier=ModelTier.FLAGSHIP,
        context_window=8192,
        max_output_tokens=4096,
        supports_vision=False,
        input_cost_per_million=30.00,
        output_cost_per_million=60.00,
    ),
    "gpt-4-32k": OpenAIModelInfo(
        id="gpt-4-32k",
        tier=ModelTier.FLAGSHIP,
        context_window=32768,
        max_output_tokens=4096,
        supports_vision=False,
        input_cost_per_million=60.00,
        output_cost_per_million=120.00,
    ),

    # GPT-3.5 Turbo
    "gpt-3.5-turbo": OpenAIModelInfo(
        id="gpt-3.5-turbo",
        tier=ModelTier.FAST,
        context_window=16385,
        max_output_tokens=4096,
        supports_vision=False,
        input_cost_per_million=0.50,
        output_cost_per_million=1.50,
    ),
    "gpt-3.5-turbo-16k": OpenAIModelInfo(
        id="gpt-3.5-turbo-16k",
        tier=ModelTier.FAST,
        context_window=16385,
        max_output_tokens=4096,
        supports_vision=False,
        input_cost_per_million=0.50,
        output_cost_per_million=1.50,
    ),
}


def get_model_info(model_id: str) -> OpenAIModelInfo:
    """
    Get model info, with fallback for unknown models.

    Args:
        model_id: OpenAI model identifier

    Returns:
        OpenAIModelInfo for the model

    Note:
        Returns a default BALANCED tier for unknown models
        to allow forward compatibility with new models.
    """
    if model_id in OPENAI_MODELS:
        return OPENAI_MODELS[model_id]

    # Check for dated model versions (e.g., gpt-4-0613)
    base_model = model_id.rsplit("-", 1)[0]
    if base_model in OPENAI_MODELS:
        return OPENAI_MODELS[base_model]

    # Default for unknown models (forward compatibility)
    return OpenAIModelInfo(
        id=model_id,
        tier=ModelTier.BALANCED,
        context_window=8192,
        max_output_tokens=4096,
        supports_vision=False,
    )


def list_models(tier: ModelTier = None) -> list:
    """List available models, optionally filtered by tier."""
    models = list(OPENAI_MODELS.values())
    if tier:
        models = [m for m in models if m.tier == tier]
    return [m for m in models if not m.deprecated]
