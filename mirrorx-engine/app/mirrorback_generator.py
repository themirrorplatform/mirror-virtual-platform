"""
Mirrorback Generator - Multi-AI integration for reflective responses.

This module orchestrates multiple AI models (OpenAI, Anthropic, Google, etc.)
and uses MirrorCore to turn their outputs into reflective mirrorbacks.

Key principle: The AI models are tools. MirrorCore is the intelligence.
"""
from typing import Dict, List, Any, Optional
import os
import httpx
from enum import Enum

from app.policies import MirrorCorePolicy


class AIProvider(str, Enum):
    """Supported AI providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    # Add more as needed


class MirrorbackGenerator:
    """
    Generates mirrorbacks using multiple AI models under MirrorCore rules.

    The multi-AI approach:
    1. Call multiple models in parallel (OpenAI, Claude, Gemini, etc.)
    2. Pass each through MirrorCore validation
    3. Pick the most reflective response
    4. Ensure it follows all MirrorCore principles
    """

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")

    async def generate(
        self,
        reflection: Dict[str, Any],
        tone: str,
        tensions: List[str],
        bias_info: List[Dict[str, Any]],
        regression: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate a mirrorback for a reflection.

        Args:
            reflection: The original reflection dict
            tone: Detected tone
            tensions: Detected tensions
            bias_info: Bias insights
            regression: Regression markers

        Returns:
            {
                "body": str,  # The mirrorback text
                "tone": str,
                "tensions": List[str],
                "metadata": Dict
            }
        """
        reflection_body = reflection.get('body', '')
        lens_key = reflection.get('lens_key')

        # Build context for AI
        context = self._build_mirrorback_context(
            reflection_body,
            lens_key,
            tone,
            tensions,
            bias_info,
            regression
        )

        # Try primary provider (Anthropic Claude - best for reflection)
        mirrorback_text = await self._generate_with_anthropic(context)

        if not mirrorback_text:
            # Fallback to OpenAI
            mirrorback_text = await self._generate_with_openai(context)

        if not mirrorback_text:
            # Final fallback: simple template-based response
            mirrorback_text = self._generate_fallback(reflection_body, tone, tensions)

        # Validate against MirrorCore principles
        validation = MirrorCorePolicy.validate_mirrorback(mirrorback_text)

        if not validation['valid']:
            # If validation fails, try to fix it or use fallback
            print(f"⚠️  Mirrorback validation failed: {validation['violations']}")
            mirrorback_text = self._generate_fallback(reflection_body, tone, tensions)

        return {
            "body": mirrorback_text,
            "tone": tone,
            "tensions": tensions,
            "metadata": {
                "bias_insights": [b['dimension'] for b in bias_info],
                "regression_markers": [r['kind'] for r in regression],
                "validation": validation
            }
        }

    def _build_mirrorback_context(
        self,
        reflection_body: str,
        lens_key: Optional[str],
        tone: str,
        tensions: List[str],
        bias_info: List[Dict[str, Any]],
        regression: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Build context dict for AI generation."""
        context = {
            "reflection": reflection_body,
            "lens": lens_key or "general",
            "tone": tone,
            "tensions": tensions
        }

        # Add bias insights if present
        if bias_info:
            context["thinking_patterns"] = [
                f"{b['dimension']}: {b['direction']}" for b in bias_info
            ]

        # Add regression markers if present
        if regression:
            context["regression_signals"] = [
                f"{r['kind']}: {r.get('description', '')}" for r in regression
            ]

        return context

    async def _generate_with_anthropic(self, context: Dict[str, Any]) -> Optional[str]:
        """Generate mirrorback using Anthropic Claude."""
        if not self.anthropic_api_key:
            return None

        # Build prompt
        system_prompt = MirrorCorePolicy.get_reflection_prompt_rules()

        user_prompt = f"""
A person wrote this reflection:

"{context['reflection']}"

Detected tone: {context['tone']}
Tensions: {', '.join(context['tensions']) if context['tensions'] else 'none detected'}

Generate a reflective mirrorback. Remember:
- Ask questions, don't give answers
- Name what you notice, don't judge
- Reflect tensions, don't resolve them
- Be curious, not prescriptive

Keep it concise (2-3 sentences).
"""

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 200,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_prompt}
                        ]
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return data['content'][0]['text'].strip()

        except Exception as e:
            print(f"❌ Anthropic API error: {e}")

        return None

    async def _generate_with_openai(self, context: Dict[str, Any]) -> Optional[str]:
        """Generate mirrorback using OpenAI."""
        if not self.openai_api_key:
            return None

        system_prompt = MirrorCorePolicy.get_reflection_prompt_rules()

        user_prompt = f"""
Reflection: "{context['reflection']}"

Tone: {context['tone']}
Tensions: {', '.join(context['tensions']) if context['tensions'] else 'none'}

Generate a reflective mirrorback (2-3 sentences). Ask questions, don't advise.
"""

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4",
                        "max_tokens": 200,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ]
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return data['choices'][0]['message']['content'].strip()

        except Exception as e:
            print(f"❌ OpenAI API error: {e}")

        return None

    def _generate_fallback(
        self,
        reflection_body: str,
        tone: str,
        tensions: List[str]
    ) -> str:
        """
        Fallback mirrorback generator (template-based).
        Used when AI providers are unavailable or validation fails.
        """
        # Simple reflection based on tone
        if tone == "conflicted" or "internal_contradiction" in tensions:
            return f"I notice a tension in what you're sharing. What feels most true to you right now?"

        elif tone == "searching":
            return f"It sounds like you're exploring something important. What are you most curious about?"

        elif tone == "resigned":
            return f"There's a heaviness in what you're saying. What would it feel like to stay with that?"

        elif tone == "critical":
            return f"I hear some harsh judgment here. Is this directed at yourself or someone else?"

        else:
            # Generic fallback
            return f"What stands out to you most as you read this back?"
