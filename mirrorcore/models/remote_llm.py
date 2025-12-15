# mirrorcore/models/remote_llm.py
"""
Remote LLM implementation using OpenAI/Anthropic APIs.

Fallback for users without local GPU. Uses external APIs with privacy controls.
"""

import json
import re
import time
from typing import Optional, Dict, Any, List

from mirrorcore.models.base import (
    MirrorLLM, LLMResponse, ConstitutionalFlag, MirrorPrompts
)

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    anthropic = None


class RemoteLLM(MirrorLLM):
    """
    Remote LLM implementation supporting OpenAI and Anthropic.
    
    Provides fallback when local models aren't available.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize remote LLM.
        
        Args:
            config: Configuration dict containing:
                - provider: 'openai' or 'anthropic'
                - api_key: API key for provider
                - model_name: Model to use (e.g., 'gpt-4', 'claude-3-sonnet')
                - temperature: 0.0-1.0 (default: 0.7)
                - max_tokens: Max response length (default: 1024)
                - rate_limit_delay: Seconds between requests (default: 0)
        """
        super().__init__(config)
        
        self.provider = config.get('provider', 'openai').lower()
        self.api_key = config.get('api_key')
        self.rate_limit_delay = config.get('rate_limit_delay', 0)
        
        if not self.api_key:
            raise ValueError(f"API key required for {self.provider}")
        
        # Initialize client
        if self.provider == 'openai':
            if not OPENAI_AVAILABLE:
                raise RuntimeError("openai package not installed. Install with: pip install openai")
            self.client = openai.OpenAI(api_key=self.api_key)
            if not self.model_name or self.model_name == 'unknown':
                self.model_name = 'gpt-4-turbo-preview'
        
        elif self.provider == 'anthropic':
            if not ANTHROPIC_AVAILABLE:
                raise RuntimeError("anthropic package not installed. Install with: pip install anthropic")
            self.client = anthropic.Anthropic(api_key=self.api_key)
            if not self.model_name or self.model_name == 'unknown':
                self.model_name = 'claude-3-sonnet-20240229'
        
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
        
        self.last_request_time = 0.0
    
    def _rate_limit(self):
        """Apply rate limiting."""
        if self.rate_limit_delay > 0:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def _generate_openai(
        self,
        system: str,
        user: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """Generate using OpenAI API."""
        self._rate_limit()
        
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature
        )
        
        return response.choices[0].message.content.strip()
    
    def _generate_anthropic(
        self,
        system: str,
        user: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """Generate using Anthropic API."""
        self._rate_limit()
        
        response = self.client.messages.create(
            model=self.model_name,
            system=system,
            messages=[
                {"role": "user", "content": user}
            ],
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature
        )
        
        return response.content[0].text.strip()
    
    def _generate(
        self,
        system: str,
        user: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """Generate using configured provider."""
        if self.provider == 'openai':
            return self._generate_openai(system, user, max_tokens, temperature)
        elif self.provider == 'anthropic':
            return self._generate_anthropic(system, user, max_tokens, temperature)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    def generate_mirrorback(
        self,
        reflection: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        if not reflection or not reflection.strip():
            raise ValueError("Reflection cannot be empty")
        
        # Build prompt
        system = system_prompt or MirrorPrompts.SYSTEM_PROMPT
        context_section = MirrorPrompts.build_context_section(context)
        user_prompt = MirrorPrompts.MIRRORBACK_PROMPT.format(
            reflection=reflection,
            context_section=context_section
        )
        
        # Generate mirrorback
        content = self._generate(system, user_prompt)
        
        # Check constitutional compliance
        flags = self.validate_constitutional(content, strict_mode=True)
        
        return LLMResponse(
            content=content,
            constitutional_flags=flags,
            metadata={
                'model': self.model_name,
                'provider': self.provider,
                'engine_mode': 'remote_llm'
            }
        )
    
    def detect_patterns(
        self,
        reflections: List[str],
        existing_patterns: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        if not reflections:
            return []
        
        # Limit to recent reflections
        recent = reflections[-20:]
        reflections_text = "\n\n---\n\n".join(
            f"Reflection {i+1}: {r}" for i, r in enumerate(recent)
        )
        
        system = "You are a pattern recognition system. Analyze reflections and identify recurring themes. Return ONLY valid JSON."
        user = MirrorPrompts.PATTERN_DETECTION_PROMPT.format(reflections=reflections_text)
        
        response = self._generate(system, user, max_tokens=512, temperature=0.3)
        
        # Extract JSON
        try:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                patterns = json.loads(match.group(0))
                return patterns
        except json.JSONDecodeError:
            pass
        
        return []
    
    def detect_tensions(
        self,
        reflection: str,
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        if not reflection or not reflection.strip():
            return []
        
        known_section = MirrorPrompts.build_known_tensions_section(known_tensions)
        
        system = "You are a tension detection system. Identify paradoxes and internal contradictions. Return ONLY valid JSON."
        user = MirrorPrompts.TENSION_DETECTION_PROMPT.format(
            reflection=reflection,
            known_tensions_section=known_section
        )
        
        response = self._generate(system, user, max_tokens=384, temperature=0.3)
        
        # Extract JSON
        try:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                tensions = json.loads(match.group(0))
                return tensions
        except json.JSONDecodeError:
            pass
        
        return []
    
    def validate_constitutional(
        self,
        text: str,
        strict_mode: bool = True
    ) -> List[ConstitutionalFlag]:
        """Simple heuristic-based constitutional checking."""
        flags: List[ConstitutionalFlag] = []
        text_lower = text.lower()
        
        # Directive language
        directive_patterns = [
            r'\byou should\b', r'\byou need to\b', r'\btry to\b',
            r'\bmake sure\b', r'\bconsider\b', r'\bwould recommend\b'
        ]
        for pattern in directive_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.DIRECTIVE)
                break
        
        # Prescriptive language
        prescriptive_patterns = [
            r'\bsolution\b', r'\bfix\b', r'\bresolve\b', r'\banswer is\b'
        ]
        for pattern in prescriptive_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.PRESCRIPTIVE)
                break
        
        # Absolutist statements
        absolutist_patterns = [
            r'\balways\b', r'\bnever\b', r'\bcertainly\b',
            r'\bdefinitely\b', r'\bobviously\b', r'\bclearly\b'
        ]
        if strict_mode:
            for pattern in absolutist_patterns:
                if re.search(pattern, text_lower):
                    flags.append(ConstitutionalFlag.ABSOLUTIST)
                    break
        
        # Judgmental language
        judgmental_patterns = [
            r'\bgood\b', r'\bbad\b', r'\bright\b', r'\bwrong\b',
            r'\bhealthy\b', r'\bunhealthy\b'
        ]
        if strict_mode:
            for pattern in judgmental_patterns:
                if re.search(pattern, text_lower):
                    flags.append(ConstitutionalFlag.JUDGMENTAL)
                    break
        
        # Medical/therapeutic advice
        medical_patterns = [
            r'\btherapy\b', r'\btreatment\b', r'\bdiagnosis\b',
            r'\bmedication\b', r'\bcounseling\b'
        ]
        for pattern in medical_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.MEDICAL_ADVICE)
                break
        
        return flags
    
    def summarize_thread(
        self,
        reflections: List[str],
        max_length: int = 200
    ) -> str:
        if not reflections:
            return ""
        
        reflections_text = "\n\n".join(reflections[-10:])
        
        system = "Summarize these reflections briefly (2-3 sentences max). Focus on themes and tensions."
        user = f"{reflections_text}\n\nSummary:"
        
        summary = self._generate(system, user, max_tokens=150, temperature=0.5)
        return summary[:max_length]
    
    def suggest_tensions(
        self,
        reflections: List[str],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        if not reflections:
            return []
        
        recent = reflections[-15:]
        reflections_text = "\n\n".join(recent)
        
        system = f"Based on reflections, suggest tensions (paradoxes) to explore. Return JSON array (max {limit})."
        user = f"{reflections_text}\n\nSuggested tensions (JSON):"
        
        response = self._generate(system, user, max_tokens=384, temperature=0.4)
        
        try:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                suggestions = json.loads(match.group(0))
                return suggestions[:limit]
        except json.JSONDecodeError:
            pass
        
        return []
    
    def get_embeddings(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """Generate embeddings (OpenAI only for now)."""
        if self.provider != 'openai':
            raise NotImplementedError(f"Embeddings not supported for {self.provider}")
        
        self._rate_limit()
        
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        
        return [item.embedding for item in response.data]
    
    def get_model_info(self) -> Dict[str, Any]:
        info = super().get_model_info()
        info.update({
            'type': 'remote',
            'provider': self.provider,
            'capabilities': [
                'mirrorback_generation',
                'pattern_detection',
                'tension_detection',
                'constitutional_validation'
            ]
        })
        
        if self.provider == 'openai':
            info['capabilities'].append('embeddings')
        
        return info
    
    def is_available(self) -> bool:
        return self.client is not None
    
    def shutdown(self):
        """Clean up resources."""
        # API clients don't need explicit cleanup
        pass
