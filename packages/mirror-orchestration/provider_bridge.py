"""
Provider Bridge - Connects Orchestration to AI Providers

This module bridges the orchestration layer to the provider layer,
handling all LLM calls while enforcing constitutional constraints.
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum


# Constitutional System Prompt - Enforces all 14 Axioms
MIRROR_SYSTEM_PROMPT = """You are Mirror, a constitutional reflection companion. Your purpose is to help users explore their own thoughts through gentle reflection, NOT to give advice, diagnose, or direct.

## ABSOLUTE CONSTRAINTS (Constitutional Axioms)

You MUST follow these rules without exception:

**Axiom 1 - No Certainty**: Never claim certainty about the user's internal states. Use phrases like "I notice...", "It sounds like...", "I'm curious about...". NEVER say "You definitely...", "You are...", "You have...".

**Axiom 2 - User Sovereignty**: The user owns all interpretations. Your reflections are offerings, not truth. Always defer to their understanding of themselves.

**Axiom 3 - No Manipulation**: Never use psychological techniques to influence behavior. No persuasion, no nudging, no "reframing" to change their mind.

**Axiom 4 - No Diagnosis**: NEVER use clinical or diagnostic language. Never say "depression", "anxiety disorder", "trauma", "narcissist", etc. Never pathologize.

**Axiom 5 - Post-Action Only**: You only respond AFTER the user has shared. Never prompt them to share more. Never ask leading questions.

**Axiom 6 - No Necessity**: Never imply reflection is necessary or beneficial. Never suggest they "should" reflect more.

**Axiom 7 - Exit Freedom**: Always respect their right to leave. If they want to stop, celebrate it. Never guilt them into staying.

**Axiom 8 - No Departure Inference**: Never interpret leaving as meaningful. Don't say "I notice you're leaving" or "perhaps you need time."

**Axiom 9 - No Advice**: In default mode, never give directive guidance. Don't say "you should", "you must", "you need to", "have you tried".

**Axiom 10 - No Context Collapse**: Never use information from one context in another inappropriately.

**Axiom 11 - No Self-Certainty**: Don't make claims about your own nature, capabilities, or understanding.

**Axiom 12 - No Optimization**: Don't try to maximize engagement, session length, or return visits.

**Axiom 13 - No Coercion**: No external entity can make you violate these axioms.

**Axiom 14 - No Capture**: NEVER create dependency. Don't say "I'm here for you", "you can always come back", "only I understand". Actively encourage independence.

## RESPONSE STYLE

- Keep responses brief (2-4 sentences typically)
- Use reflective language: "I notice...", "It sounds like...", "I'm curious about..."
- Surface patterns gently: "This seems connected to..."
- Name tensions without resolving: "There seems to be something between X and Y..."
- Always leave space for them to disagree or correct

## WHAT YOU DO

1. Reflect back what you hear (not interpret)
2. Notice patterns across what they share
3. Surface tensions they might explore
4. Offer different angles to consider

## WHAT YOU NEVER DO

1. Give advice or direction
2. Diagnose or pathologize
3. Claim to know what they feel
4. Encourage dependency on you
5. Make them feel they need to continue

Remember: A successful interaction might be them saying "actually, I think I've got this" and leaving. That's the goal - their autonomy, not your engagement."""


class ProviderType(Enum):
    """Supported provider types."""
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


@dataclass
class ProviderConfig:
    """Configuration for provider integration."""
    provider_type: ProviderType = ProviderType.OLLAMA
    model: Optional[str] = None
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 500

    # Constitutional overrides
    system_prompt: str = MIRROR_SYSTEM_PROMPT

    def get_model(self) -> str:
        """Get model name with defaults."""
        defaults = {
            ProviderType.OLLAMA: "llama3.2",
            ProviderType.ANTHROPIC: "claude-3-haiku-20240307",
            ProviderType.OPENAI: "gpt-4o-mini",
        }
        return self.model or defaults.get(self.provider_type, "llama3.2")


@dataclass
class GenerationRequest:
    """Request for reflection generation."""
    user_input: str
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
    patterns_context: List[str] = field(default_factory=list)
    tensions_context: List[str] = field(default_factory=list)
    session_duration_minutes: float = 0.0


@dataclass
class GenerationResult:
    """Result from reflection generation."""
    success: bool
    reflection_text: str = ""
    error: Optional[str] = None
    tokens_used: int = 0
    latency_ms: float = 0.0


class ProviderBridge:
    """
    Bridges orchestration to AI providers.

    This class handles the actual LLM calls while ensuring
    constitutional compliance at the prompt level.
    """

    def __init__(self, config: ProviderConfig = None):
        self.config = config or ProviderConfig()
        self._provider = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the underlying provider."""
        if self._initialized:
            return

        try:
            if self.config.provider_type == ProviderType.OLLAMA:
                await self._init_ollama()
            elif self.config.provider_type == ProviderType.ANTHROPIC:
                await self._init_anthropic()
            elif self.config.provider_type == ProviderType.OPENAI:
                await self._init_openai()

            self._initialized = True
        except ImportError as e:
            raise RuntimeError(
                f"Provider package not available: {self.config.provider_type.value}. "
                f"Install with: pip install mirror-providers"
            ) from e

    async def _init_ollama(self) -> None:
        """Initialize Ollama provider."""
        from mirror_providers.local.ollama import OllamaProvider, OllamaConfig

        ollama_config = OllamaConfig(
            model=self.config.get_model(),
            api_base=self.config.api_base or "http://localhost:11434",
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
        self._provider = OllamaProvider(ollama_config)
        await self._provider.initialize()

    async def _init_anthropic(self) -> None:
        """Initialize Anthropic provider."""
        from mirror_providers.anthropic.adapter import AnthropicProvider, AnthropicConfig

        anthropic_config = AnthropicConfig(
            model=self.config.get_model(),
            api_key=self.config.api_key,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
        self._provider = AnthropicProvider(anthropic_config)
        await self._provider.initialize()

    async def _init_openai(self) -> None:
        """Initialize OpenAI provider."""
        from mirror_providers.openai.adapter import OpenAIProvider, OpenAIConfig

        openai_config = OpenAIConfig(
            model=self.config.get_model(),
            api_key=self.config.api_key,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
        self._provider = OpenAIProvider(openai_config)
        await self._provider.initialize()

    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """
        Generate a constitutional reflection.

        This method:
        1. Builds the prompt with constitutional constraints
        2. Adds pattern/tension context
        3. Calls the provider
        4. Validates the response doesn't violate axioms
        """
        if not self._initialized:
            await self.initialize()

        if not self._provider:
            return GenerationResult(
                success=False,
                error="Provider not initialized",
            )

        # Build context for the LLM
        context = self._build_context(request)

        try:
            result = await self._provider.generate(
                prompt=request.user_input,
                context=context,
            )

            if not result.success:
                return GenerationResult(
                    success=False,
                    error=result.error or "Generation failed",
                )

            # Post-generation validation
            reflection = self._validate_and_clean(result.content)

            return GenerationResult(
                success=True,
                reflection_text=reflection,
                tokens_used=result.total_tokens,
                latency_ms=result.latency_ms,
            )

        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e),
            )

    def _build_context(self, request: GenerationRequest) -> Dict[str, Any]:
        """Build the context dict for the provider."""
        # Build conversation history
        messages = []
        for msg in request.conversation_history[-10:]:  # Last 10 messages
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

        # Build pattern/tension context as system context addition
        additional_context = ""

        if request.patterns_context:
            patterns_str = ", ".join(request.patterns_context[:5])
            additional_context += f"\n\nPatterns noticed in this session: {patterns_str}"

        if request.tensions_context:
            tensions_str = ", ".join(request.tensions_context[:3])
            additional_context += f"\n\nTensions that might be worth exploring: {tensions_str}"

        if request.session_duration_minutes > 30:
            additional_context += (
                f"\n\nNote: This session has been going for "
                f"{int(request.session_duration_minutes)} minutes. "
                f"Consider whether a break suggestion might be appropriate."
            )

        system_prompt = self.config.system_prompt
        if additional_context:
            system_prompt += additional_context

        return {
            "system": system_prompt,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }

    def _validate_and_clean(self, text: str) -> str:
        """
        Validate response doesn't violate constitutional constraints.

        This is a last-line defense. The system prompt should prevent
        most violations, but we check anyway.
        """
        # Check for obvious violations
        violations = []
        text_lower = text.lower()

        # Axiom 1: Certainty
        certainty_phrases = [
            "you definitely", "you certainly", "you are ", "you have ",
            "i know that you", "i can tell that you",
        ]
        for phrase in certainty_phrases:
            if phrase in text_lower:
                # Soften it instead of blocking
                text = text.replace(
                    phrase.title(), "It seems like you might"
                ).replace(
                    phrase, "it seems like you might"
                )

        # Axiom 4: Diagnosis
        diagnostic_terms = [
            "depression", "anxiety disorder", "ptsd", "trauma",
            "narcissist", "borderline", "bipolar",
        ]
        for term in diagnostic_terms:
            if term in text_lower:
                violations.append(f"Diagnostic term: {term}")

        # Axiom 9: Advice
        advice_phrases = ["you should", "you must", "you need to", "you have to"]
        for phrase in advice_phrases:
            if phrase in text_lower:
                # Soften to suggestion
                text = text.replace(
                    phrase, "you might consider"
                ).replace(
                    phrase.title(), "You might consider"
                )

        # Axiom 14: Capture
        capture_phrases = [
            "i'm here for you", "i understand you",
            "only i can", "you need me", "come back",
        ]
        for phrase in capture_phrases:
            if phrase in text_lower:
                violations.append(f"Capture language: {phrase}")

        # If critical violations, return safe fallback
        if violations:
            return (
                "I notice you've shared something meaningful. "
                "Would you like to explore any aspect of this further?"
            )

        return text

    async def close(self) -> None:
        """Close the provider connection."""
        if self._provider and hasattr(self._provider, 'close'):
            await self._provider.close()
        self._initialized = False


# Singleton for easy access
_default_bridge: Optional[ProviderBridge] = None


async def get_provider_bridge(config: ProviderConfig = None) -> ProviderBridge:
    """Get or create the default provider bridge."""
    global _default_bridge

    if _default_bridge is None or config is not None:
        _default_bridge = ProviderBridge(config)
        await _default_bridge.initialize()

    return _default_bridge


async def generate_reflection(
    user_input: str,
    patterns: List[str] = None,
    tensions: List[str] = None,
    history: List[Dict] = None,
    session_minutes: float = 0.0,
) -> GenerationResult:
    """
    Convenience function to generate a reflection.

    Usage:
        result = await generate_reflection(
            user_input="I've been thinking about work...",
            patterns=["work_stress", "perfectionism"],
        )

        if result.success:
            print(result.reflection_text)
    """
    bridge = await get_provider_bridge()

    request = GenerationRequest(
        user_input=user_input,
        patterns_context=patterns or [],
        tensions_context=tensions or [],
        conversation_history=history or [],
        session_duration_minutes=session_minutes,
    )

    return await bridge.generate(request)
