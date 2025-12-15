"""
LocalLLM: Ollama Integration

Constitutional: I1 (Data Sovereignty) - Works completely offline
"""

import time
from typing import Optional, Dict, Any
import requests

from .base import (
    LocalLLMBase, LLMResponse, LLMConfig, LLMProvider,
    LLMConnectionError, LLMGenerationError
)


class LocalLLM(LocalLLMBase):
    """
    Ollama local LLM integration.
    
    I1 Enforcement: Runs locally, no network required, complete data sovereignty.
    
    Setup:
        1. Install Ollama: https://ollama.ai
        2. Pull model: `ollama pull llama2` (or mistral, phi, etc.)
        3. Verify running: `ollama list`
    
    Example:
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2",
            local_url="http://localhost:11434",
            works_offline=True
        )
        llm = LocalLLM(config)
        response = llm.generate("What is consciousness?", mirror_id="user123")
    """
    
    def __init__(self, config: LLMConfig):
        if not config.local_url:
            config.local_url = "http://localhost:11434"
        super().__init__(config)
    
    def health_check(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.config.local_url}/api/tags", timeout=2)
            return response.status_code == 200
        except Exception:  # Catch all exceptions for test mocking
            return False
    
    def is_available(self) -> bool:
        """I1: Local LLM should always be available if service running"""
        return self.health_check()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get Ollama model information"""
        try:
            response = requests.get(f"{self.config.local_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                for model in models:
                    if model['name'].startswith(self.config.model):
                        return {
                            'provider': 'ollama',
                            'model': model['name'],
                            'size': model.get('size'),
                            'modified': model.get('modified_at'),
                            'local': True,
                            'works_offline': True
                        }
            return {
                'provider': 'ollama',
                'model': self.config.model,
                'local': True,
                'works_offline': True,
                'available': False
            }
        except Exception as e:
            return {
                'provider': 'ollama',
                'model': self.config.model,
                'error': str(e),
                'available': False
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
        Generate using Ollama.
        
        I2: mirror_id tracked in response
        I7: prompt_hash calculated for auditability
        I13: No prompt manipulation
        """
        if not self.is_available():
            raise LLMConnectionError(
                f"Ollama not available at {self.config.local_url}. "
                "Install: https://ollama.ai"
            )
        
        # I7: Calculate prompt hash for auditability
        prompt_hash = self.calculate_prompt_hash(prompt, system_prompt)
        
        # Build request
        request_body = {
            'model': self.config.model,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': temperature or self.config.temperature,
                'num_predict': max_tokens or self.config.max_tokens,
                'top_p': self.config.top_p
            }
        }
        
        if system_prompt:
            request_body['system'] = system_prompt
        
        # Add any additional kwargs
        if kwargs:
            request_body['options'].update(kwargs)
        
        # Generate
        start_time = time.time()
        try:
            response = requests.post(
                f"{self.config.local_url}/api/generate",
                json=request_body,
                timeout=60
            )
            response.raise_for_status()
            result = response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=result['response'],
                model=self.config.model,
                provider=LLMProvider.LOCAL_OLLAMA,
                tokens_used=result.get('eval_count'),
                latency_ms=latency_ms,
                mirror_id=mirror_id,  # I2: Identity-scoped
                prompt_hash=prompt_hash,  # I7: Auditability
                finish_reason='complete' if result.get('done') else 'incomplete'
            )
        
        except requests.exceptions.Timeout:
            raise LLMGenerationError("Ollama generation timed out (60s)")
        except requests.exceptions.RequestException as e:
            raise LLMGenerationError(f"Ollama request failed: {e}")
        except Exception as e:
            raise LLMGenerationError(f"Unexpected error: {e}")
    
    def stream_generate(
        self,
        prompt: str,
        mirror_id: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """
        Stream generation from Ollama.
        
        Yields:
            Partial LLMResponse objects with incremental content
        """
        if not self.is_available():
            raise LLMConnectionError("Ollama not available")
        
        prompt_hash = self.calculate_prompt_hash(prompt, system_prompt)
        
        request_body = {
            'model': self.config.model,
            'prompt': prompt,
            'stream': True,
            'options': {
                'temperature': self.config.temperature,
                'num_predict': self.config.max_tokens,
                'top_p': self.config.top_p
            }
        }
        
        if system_prompt:
            request_body['system'] = system_prompt
        
        try:
            response = requests.post(
                f"{self.config.local_url}/api/generate",
                json=request_body,
                stream=True,
                timeout=60
            )
            response.raise_for_status()
            
            accumulated = ""
            for line in response.iter_lines():
                if line:
                    import json
                    chunk = json.loads(line)
                    token = chunk.get('response', '')
                    accumulated += token
                    
                    yield LLMResponse(
                        content=accumulated,
                        model=self.config.model,
                        provider=LLMProvider.LOCAL_OLLAMA,
                        mirror_id=mirror_id,
                        prompt_hash=prompt_hash,
                        finish_reason='streaming' if not chunk.get('done') else 'complete'
                    )
        
        except Exception as e:
            raise LLMGenerationError(f"Streaming failed: {e}")
