"""
Mock LLM for testing/development.

In production, replace with actual LLM (Ollama, Claude, etc.)
"""

from mirror_os.llm.base import BaseLLM, LLMConfig, LLMProvider, LLMResponse


class MockLLM(BaseLLM):
    """
    Mock LLM that returns reflection-style responses.
    
    For development/testing only.
    """
    
    def __init__(self):
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="mock",
            works_offline=True,
            requires_network=False
        )
        super().__init__(config)
        self.call_count = 0
    
    def is_available(self) -> bool:
        """Always available."""
        return True
    
    def generate(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: str = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate mock reflection response.
        
        Returns reflective, non-prescriptive responses that pass L0 checks.
        """
        self.call_count += 1
        
        # Simple response generation based on common patterns
        responses = [
            "I notice the weight of that uncertainty. The not-knowing itself holds space for something.",
            "There's a tension there between what feels comfortable and what feels possible.",
            "The doubt you're expressing - it's not weakness. It's awareness of complexity.",
            "I hear the question beneath the question. What does resolution even mean here?",
            "That feeling of being stuck - sometimes stuckness is where clarity germinates.",
            "The contradiction you're holding - both sides seem to have their own truth.",
            "I notice how you're navigating between certainty and openness.",
            "The space between what you know and what you're discovering - that's where you seem to be.",
        ]
        
        # Rotate through responses
        content = responses[self.call_count % len(responses)]
        
        return LLMResponse(
            content=content,
            model="mock",
            provider="mock"
        )
    
    def get_model_info(self) -> dict:
        """Get model information."""
        return {
            "model": "mock",
            "provider": "mock",
            "version": "1.0.0",
            "purpose": "development/testing"
        }
