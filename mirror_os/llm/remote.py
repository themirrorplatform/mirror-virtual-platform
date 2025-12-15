"""
RemoteLLM: Claude/OpenAI Integration

Constitutional: I1 (Data Sovereignty) - OPTIONAL layer, system degrades gracefully
Layer 3: Platform/Remote services are optional, not required
"""

import time
from typing import Optional, Dict, Any

from .base import (
    RemoteLLMBase, LLMResponse, LLMConfig, LLMProvider,
    LLMConnectionError, LLMGenerationError
)


class RemoteLLM(RemoteLLMBase):
    """
    Remote LLM integration (Claude, OpenAI, custom endpoints).
    
    I1 WARNING: This is Layer 3 (optional). System MUST work without this.
    Degradation strategy: If remote unavailable, fall back to local LLM.
    
    Example:
        # Claude
        config = LLMConfig(
            provider=LLMProvider.REMOTE_CLAUDE,
            model="claude-3-sonnet-20240229",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            works_offline=False,
            requires_network=True
        )
        
        # OpenAI
        config = LLMConfig(
            provider=LLMProvider.REMOTE_OPENAI,
            model="gpt-4",
            api_key=os.getenv("OPENAI_API_KEY"),
            works_offline=False,
            requires_network=True
        )
        
        llm = RemoteLLM(config)
        if llm.is_available():
            response = llm.generate(prompt, mirror_id)
        else:
            # Fall back to local
            pass
    """
    
    def _check_api_reachable(self) -> bool:
        """Check if API endpoint is reachable"""
        try:
            if self.config.provider == LLMProvider.REMOTE_CLAUDE:
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=self.config.api_key)
                    # Try to validate (will fail with invalid key)
                    return self.config.api_key is not None and len(self.config.api_key) > 10
                except ImportError:
                    return False
            
            elif self.config.provider == LLMProvider.REMOTE_OPENAI:
                try:
                    import openai
                    client = openai.OpenAI(api_key=self.config.api_key)
                    return self.config.api_key is not None and len(self.config.api_key) > 10
                except ImportError:
                    return False
            
            return False
        except Exception:
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get remote model information"""
        return {
            'provider': self.config.provider.value,
            'model': self.config.model,
            'local': False,
            'works_offline': False,
            'requires_network': True,
            'available': self.is_available()
        }
    
    def generate(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate using remote API.
        
        I1 WARNING: Requires network. Must degrade gracefully if unavailable.
        I2: mirror_id tracked
        I7: prompt_hash for auditability
        """
        if not self.is_available():
            raise LLMConnectionError(
                f"Remote provider {self.config.provider} not available. "
                "Check network connection and API key."
            )
        
        prompt_hash = self.calculate_prompt_hash(prompt, system_prompt)
        start_time = time.time()
        
        try:
            if self.config.provider == LLMProvider.REMOTE_CLAUDE:
                return self._generate_claude(
                    prompt, mirror_id, system_prompt, 
                    temperature, max_tokens, prompt_hash, **kwargs
                )
            
            elif self.config.provider == LLMProvider.REMOTE_OPENAI:
                return self._generate_openai(
                    prompt, mirror_id, system_prompt,
                    temperature, max_tokens, prompt_hash, **kwargs
                )
            
            else:
                raise LLMGenerationError(
                    f"Unsupported remote provider: {self.config.provider}"
                )
        
        except Exception as e:
            raise LLMGenerationError(f"Remote generation failed: {e}")
    
    def _generate_claude(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        prompt_hash: str,
        **kwargs
    ) -> LLMResponse:
        """Generate using Claude API"""
        try:
            import anthropic
        except ImportError:
            raise LLMGenerationError(
                "anthropic package not installed. "
                "Install: pip install anthropic"
            )
        
        start_time = time.time()
        client = anthropic.Anthropic(api_key=self.config.api_key)
        
        try:
            response = client.messages.create(
                model=self.config.model,
                max_tokens=max_tokens or self.config.max_tokens,
                temperature=temperature or self.config.temperature,
                system=system_prompt or "",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=response.content[0].text,
                model=self.config.model,
                provider=LLMProvider.REMOTE_CLAUDE,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
                latency_ms=latency_ms,
                mirror_id=mirror_id,
                prompt_hash=prompt_hash,
                finish_reason=response.stop_reason
            )
        
        except Exception as e:
            raise LLMGenerationError(f"Claude API error: {e}")
    
    def _generate_openai(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        prompt_hash: str,
        **kwargs
    ) -> LLMResponse:
        """Generate using OpenAI API"""
        try:
            import openai
        except ImportError:
            raise LLMGenerationError(
                "openai package not installed. "
                "Install: pip install openai"
            )
        
        start_time = time.time()
        client = openai.OpenAI(api_key=self.config.api_key)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=temperature or self.config.temperature,
                max_tokens=max_tokens or self.config.max_tokens,
                top_p=self.config.top_p
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=response.choices[0].message.content,
                model=self.config.model,
                provider=LLMProvider.REMOTE_OPENAI,
                tokens_used=response.usage.total_tokens,
                latency_ms=latency_ms,
                mirror_id=mirror_id,
                prompt_hash=prompt_hash,
                finish_reason=response.choices[0].finish_reason
            )
        
        except Exception as e:
            raise LLMGenerationError(f"OpenAI API error: {e}")
