"""
LLM Integration Layer for MirrorX Orchestrator

Provides a simple interface for calling LLMs (Claude, OpenAI, etc.)
with proper error handling and fallbacks.
"""

import os
import logging
from typing import Optional, Dict, Any
from anthropic import Anthropic, APIError as AnthropicAPIError
import openai

logger = logging.getLogger("mirrorx.llm_integration")

# Initialize clients
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
openai.api_key = OPENAI_API_KEY


class LLMIntegration:
    """
    Simple LLM integration for generating reflections and mirrorbacks.
    """
    
    def __init__(self):
        self.anthropic_client = anthropic_client
        self.has_anthropic = ANTHROPIC_API_KEY is not None
        self.has_openai = OPENAI_API_KEY is not None
        
        if not self.has_anthropic and not self.has_openai:
            logger.warning("No LLM API keys found. Using placeholder responses.")
    
    def call_llm(
        self, 
        model: str, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Call an LLM to generate text.
        
        Args:
            model: Model identifier (e.g., "claude-3-5-sonnet", "gpt-4")
            prompt: The prompt to send
            context: Optional context dict with user info, reflection history, etc.
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
        
        Returns:
            Generated text
        """
        # Build system message from context
        system_message = self._build_system_message(context) if context else None
        
        try:
            # Try Claude first (preferred for mirrorbacks)
            if "claude" in model.lower() and self.has_anthropic:
                return self._call_claude(model, prompt, system_message, max_tokens, temperature)
            
            # Try OpenAI
            elif ("gpt" in model.lower() or "openai" in model.lower()) and self.has_openai:
                return self._call_openai(model, prompt, system_message, max_tokens, temperature)
            
            # Fallback to whichever is available
            elif self.has_anthropic:
                logger.warning(f"Model {model} not available, falling back to Claude")
                return self._call_claude("claude-3-5-sonnet-20241022", prompt, system_message, max_tokens, temperature)
            
            elif self.has_openai:
                logger.warning(f"Model {model} not available, falling back to GPT-4")
                return self._call_openai("gpt-4", prompt, system_message, max_tokens, temperature)
            
            else:
                # No API keys available - return placeholder
                logger.warning("No LLM API keys configured. Returning placeholder.")
                return self._placeholder_response(prompt)
        
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            return self._placeholder_response(prompt, error=str(e))
    
    def _call_claude(
        self, 
        model: str, 
        prompt: str, 
        system_message: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> str:
        """Call Claude API"""
        try:
            messages = [{"role": "user", "content": prompt}]
            
            kwargs = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            if system_message:
                kwargs["system"] = system_message
            
            response = self.anthropic_client.messages.create(**kwargs)
            
            # Extract text from response
            if response.content and len(response.content) > 0:
                return response.content[0].text
            
            return "[No response generated]"
        
        except AnthropicAPIError as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    def _call_openai(
        self, 
        model: str, 
        prompt: str, 
        system_message: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> str:
        """Call OpenAI API"""
        try:
            messages = []
            
            if system_message:
                messages.append({"role": "system", "content": system_message})
            
            messages.append({"role": "user", "content": prompt})
            
            response = openai.ChatCompletion.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def _build_system_message(self, context: Dict[str, Any]) -> str:
        """Build system message from context"""
        parts = ["You are MirrorX, a reflective AI companion."]
        
        if "identity_id" in context:
            parts.append(f"User ID: {context['identity_id']}")
        
        if "previous_reflections" in context:
            parts.append(f"Previous reflections: {len(context['previous_reflections'])}")
        
        if "dominant_tension" in context:
            parts.append(f"User's dominant tension: {context['dominant_tension']}")
        
        return " ".join(parts)
    
    def _placeholder_response(self, prompt: str, error: Optional[str] = None) -> str:
        """Generate a placeholder response when no LLM is available"""
        if error:
            return f"[LLM Error: {error}. Placeholder response to: {prompt[:100]}...]"
        return f"[Placeholder reflection generated in response to: {prompt[:100]}...]"


# Global instance
_llm_integration = None


def get_llm_integration() -> LLMIntegration:
    """Get or create the global LLM integration instance"""
    global _llm_integration
    if _llm_integration is None:
        _llm_integration = LLMIntegration()
    return _llm_integration
