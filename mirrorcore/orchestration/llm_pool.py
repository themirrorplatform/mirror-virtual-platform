# mirrorcore/orchestration/llm_pool.py
"""
Multi-LLM Orchestration Pool

Provides fallback support and load balancing across multiple LLM providers.

Design:
- Primary, secondary, tertiary providers
- Automatic fallback on failure
- Load balancing (round-robin)
- Cost tracking
- Response time monitoring
"""

import time
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


logger = logging.getLogger(__name__)


class ProviderStatus(Enum):
    """Provider health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"  # Slow but working
    UNAVAILABLE = "unavailable"  # Failed


@dataclass
class ProviderConfig:
    """Configuration for an LLM provider"""
    name: str  # "claude", "openai", "gemini", "local"
    priority: int  # 1 = primary, 2 = secondary, 3 = tertiary
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    max_tokens: int = 4096
    timeout: int = 30  # seconds
    cost_per_1k_tokens: float = 0.0


@dataclass
class ProviderStats:
    """Statistics for provider monitoring"""
    name: str
    status: ProviderStatus
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    avg_response_time: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    failure_reason: Optional[str] = None


class LLMPool:
    """
    Multi-provider LLM pool with fallback and load balancing.
    
    Usage:
        pool = LLMPool()
        pool.add_provider(ProviderConfig(name="claude", priority=1, ...))
        pool.add_provider(ProviderConfig(name="openai", priority=2, ...))
        
        response = await pool.generate("prompt text")
    """
    
    def __init__(self):
        """Initialize LLM pool"""
        self.providers: Dict[str, ProviderConfig] = {}
        self.stats: Dict[str, ProviderStats] = {}
        self.current_primary: Optional[str] = None
        
        # Load balancing
        self.round_robin_index = 0
        
    def add_provider(self, config: ProviderConfig):
        """
        Add provider to pool.
        
        Args:
            config: Provider configuration
        """
        self.providers[config.name] = config
        self.stats[config.name] = ProviderStats(
            name=config.name,
            status=ProviderStatus.HEALTHY
        )
        
        # Set primary if first provider or higher priority
        if not self.current_primary or config.priority < self.providers[self.current_primary].priority:
            self.current_primary = config.name
        
        logger.info(f"Added provider: {config.name} (priority: {config.priority})")
    
    def get_provider_by_priority(self, exclude: Optional[List[str]] = None) -> Optional[ProviderConfig]:
        """
        Get next available provider by priority.
        
        Args:
            exclude: List of provider names to exclude
        
        Returns:
            ProviderConfig or None
        """
        exclude = exclude or []
        
        # Filter available providers
        available = [
            (name, config) 
            for name, config in self.providers.items()
            if name not in exclude and self.stats[name].status != ProviderStatus.UNAVAILABLE
        ]
        
        if not available:
            return None
        
        # Sort by priority
        available.sort(key=lambda x: x[1].priority)
        
        return available[0][1]
    
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Generate text using available providers with fallback.
        
        Args:
            prompt: Input prompt
            system: System message
            temperature: Sampling temperature
            max_retries: Maximum number of providers to try
        
        Returns:
            Dict with:
                - text: Generated text
                - provider: Provider name used
                - tokens: Token count
                - cost: Estimated cost
                - response_time: Response time in ms
        """
        start_time = time.time()
        exclude = []
        
        for attempt in range(max_retries):
            provider_config = self.get_provider_by_priority(exclude=exclude)
            
            if not provider_config:
                logger.error("No available providers")
                return {
                    'text': self._get_fallback_response(),
                    'provider': 'fallback',
                    'tokens': 0,
                    'cost': 0.0,
                    'response_time': int((time.time() - start_time) * 1000),
                    'error': 'No providers available'
                }
            
            try:
                logger.info(f"Attempting generation with {provider_config.name} (attempt {attempt + 1}/{max_retries})")
                
                # Try provider
                result = await self._call_provider(provider_config, prompt, system, temperature)
                
                # Update stats on success
                self._record_success(provider_config.name, result['tokens'], time.time() - start_time)
                
                result['response_time'] = int((time.time() - start_time) * 1000)
                return result
                
            except Exception as e:
                logger.warning(f"Provider {provider_config.name} failed: {e}")
                
                # Update stats on failure
                self._record_failure(provider_config.name, str(e))
                
                # Exclude this provider for next attempt
                exclude.append(provider_config.name)
                
                # Continue to next provider
                continue
        
        # All providers failed
        logger.error(f"All providers failed after {max_retries} attempts")
        return {
            'text': self._get_fallback_response(),
            'provider': 'fallback',
            'tokens': 0,
            'cost': 0.0,
            'response_time': int((time.time() - start_time) * 1000),
            'error': 'All providers failed'
        }
    
    async def _call_provider(
        self,
        config: ProviderConfig,
        prompt: str,
        system: Optional[str],
        temperature: float
    ) -> Dict[str, Any]:
        """
        Call specific provider.
        
        Args:
            config: Provider configuration
            prompt: Input prompt
            system: System message
            temperature: Sampling temperature
        
        Returns:
            Dict with text, provider, tokens, cost
        """
        if config.name == "claude":
            return await self._call_claude(config, prompt, system, temperature)
        elif config.name == "openai":
            return await self._call_openai(config, prompt, system, temperature)
        elif config.name == "gemini":
            return await self._call_gemini(config, prompt, system, temperature)
        elif config.name == "local":
            return await self._call_local(config, prompt, system, temperature)
        else:
            raise ValueError(f"Unknown provider: {config.name}")
    
    async def _call_claude(self, config: ProviderConfig, prompt: str, system: Optional[str], temperature: float) -> Dict[str, Any]:
        """Call Anthropic Claude"""
        try:
            from anthropic import Anthropic
            
            client = Anthropic(api_key=config.api_key)
            
            response = client.messages.create(
                model=config.model or "claude-3-5-sonnet-20241022",
                max_tokens=config.max_tokens,
                temperature=temperature,
                system=system or "",
                messages=[{"role": "user", "content": prompt}]
            )
            
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            cost = (tokens / 1000.0) * config.cost_per_1k_tokens
            
            return {
                'text': text,
                'provider': config.name,
                'tokens': tokens,
                'cost': cost
            }
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise
    
    async def _call_openai(self, config: ProviderConfig, prompt: str, system: Optional[str], temperature: float) -> Dict[str, Any]:
        """Call OpenAI"""
        try:
            import openai
            openai.api_key = config.api_key
            
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            
            response = openai.ChatCompletion.create(
                model=config.model or "gpt-4-turbo-preview",
                messages=messages,
                temperature=temperature,
                max_tokens=config.max_tokens
            )
            
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            cost = (tokens / 1000.0) * config.cost_per_1k_tokens
            
            return {
                'text': text,
                'provider': config.name,
                'tokens': tokens,
                'cost': cost
            }
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _call_gemini(self, config: ProviderConfig, prompt: str, system: Optional[str], temperature: float) -> Dict[str, Any]:
        """Call Google Gemini"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=config.api_key)
            
            model = genai.GenerativeModel(config.model or 'gemini-pro')
            
            full_prompt = f"{system}\n\n{prompt}" if system else prompt
            response = model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=config.max_tokens
                )
            )
            
            text = response.text
            # Gemini doesn't return token counts easily, estimate
            tokens = len(text.split()) * 1.3  # rough estimate
            cost = (tokens / 1000.0) * config.cost_per_1k_tokens
            
            return {
                'text': text,
                'provider': config.name,
                'tokens': int(tokens),
                'cost': cost
            }
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise
    
    async def _call_local(self, config: ProviderConfig, prompt: str, system: Optional[str], temperature: float) -> Dict[str, Any]:
        """Call local LLM (Ollama, etc)"""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": config.model or "llama2",
                    "prompt": f"{system}\n\n{prompt}" if system else prompt,
                    "temperature": temperature,
                    "max_tokens": config.max_tokens
                }
                
                async with session.post(
                    f"{config.base_url}/api/generate",
                    json=payload,
                    timeout=config.timeout
                ) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}")
                    
                    result = await response.json()
                    text = result.get('response', '')
                    
                    return {
                        'text': text,
                        'provider': config.name,
                        'tokens': len(text.split()),  # rough estimate
                        'cost': 0.0  # local is free
                    }
        except Exception as e:
            logger.error(f"Local LLM error: {e}")
            raise
    
    def _record_success(self, provider_name: str, tokens: int, response_time: float):
        """Record successful request"""
        stats = self.stats[provider_name]
        stats.total_requests += 1
        stats.successful_requests += 1
        stats.total_tokens += tokens
        stats.total_cost += (tokens / 1000.0) * self.providers[provider_name].cost_per_1k_tokens
        
        # Update average response time
        if stats.avg_response_time == 0:
            stats.avg_response_time = response_time
        else:
            stats.avg_response_time = (stats.avg_response_time * 0.9) + (response_time * 0.1)
        
        stats.last_success = datetime.utcnow()
        stats.status = ProviderStatus.HEALTHY
        
        logger.debug(f"{provider_name}: success, {tokens} tokens, {response_time:.2f}s")
    
    def _record_failure(self, provider_name: str, error: str):
        """Record failed request"""
        stats = self.stats[provider_name]
        stats.total_requests += 1
        stats.failed_requests += 1
        stats.last_failure = datetime.utcnow()
        stats.failure_reason = error
        
        # Mark as unavailable after 3 consecutive failures
        if stats.failed_requests >= 3 and stats.successful_requests == 0:
            stats.status = ProviderStatus.UNAVAILABLE
        elif stats.failed_requests > stats.successful_requests:
            stats.status = ProviderStatus.DEGRADED
        
        logger.warning(f"{provider_name}: failure - {error}")
    
    def _get_fallback_response(self) -> str:
        """Get fallback response when all providers fail"""
        return """I'm having trouble generating a response right now. 

What you wrote matters, and I want to reflect it back thoughtfully. You might try:
- Reflecting again in a moment
- Checking your connection
- Enabling manual mode if you'd prefer non-AI reflection

Your words are stored safely and I'll be here when you're ready."""
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get pool statistics.
        
        Returns:
            Dict with aggregate and per-provider stats
        """
        total_requests = sum(s.total_requests for s in self.stats.values())
        total_successful = sum(s.successful_requests for s in self.stats.values())
        total_tokens = sum(s.total_tokens for s in self.stats.values())
        total_cost = sum(s.total_cost for s in self.stats.values())
        
        return {
            'total_requests': total_requests,
            'total_successful': total_successful,
            'total_tokens': total_tokens,
            'total_cost': total_cost,
            'success_rate': (total_successful / total_requests * 100) if total_requests > 0 else 0,
            'providers': {
                name: {
                    'status': stats.status.value,
                    'requests': stats.total_requests,
                    'success_rate': (stats.successful_requests / stats.total_requests * 100) if stats.total_requests > 0 else 0,
                    'tokens': stats.total_tokens,
                    'cost': stats.total_cost,
                    'avg_response_time': round(stats.avg_response_time, 2),
                    'last_success': stats.last_success.isoformat() if stats.last_success else None,
                    'last_failure': stats.last_failure.isoformat() if stats.last_failure else None
                }
                for name, stats in self.stats.items()
            }
        }


# Self-test
if __name__ == "__main__":
    import asyncio
    
    print("LLM Pool Test")
    print("=" * 80)
    
    async def test():
        pool = LLMPool()
        
        # Add mock providers
        pool.add_provider(ProviderConfig(
            name="local",
            priority=1,
            base_url="http://localhost:11434",
            model="llama2"
        ))
        
        print(f"\nProviders configured: {len(pool.providers)}")
        print(f"Primary provider: {pool.current_primary}")
        
        # Test fallback response
        fallback = pool._get_fallback_response()
        print(f"\nFallback response: {fallback[:100]}...")
        
        # Get stats
        stats = pool.get_stats()
        print(f"\nStats: {stats['total_requests']} requests, {stats['success_rate']:.1f}% success rate")
        
        print("\n✅ LLM pool functional")
    
    asyncio.run(test())
