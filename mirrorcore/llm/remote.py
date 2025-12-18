"""
RemoteLLMAdapter: Adapter for remote LLMs (e.g., Anthropic Claude API).
"""
from .adapter import LLMAdapter, LLMConfig
import requests
import asyncio
import aiohttp

class RemoteLLMAdapter(LLMAdapter):
    def __init__(self, config: LLMConfig):
        self.config = config

    def generate(self, prompt: str, **kwargs) -> str:
        # Example: call Anthropic Claude API (replace with actual endpoint/model)
        url = self.config.endpoint or "https://api.anthropic.com/v1/complete"
        headers = {"x-api-key": self.config.api_key or "", "Content-Type": "application/json"}
        data = {"prompt": prompt, "model": self.config.model or "claude-2", "max_tokens": 512}
        try:
            resp = requests.post(url, headers=headers, json=data, timeout=30)
            resp.raise_for_status()
            return resp.json().get("completion", "")
        except Exception as e:
            return f"[RemoteLLMAdapter error: {e}]"

    async def agenerate(self, prompt: str, **kwargs) -> str:
        url = self.config.endpoint or "https://api.anthropic.com/v1/complete"
        headers = {"x-api-key": self.config.api_key or "", "Content-Type": "application/json"}
        data = {"prompt": prompt, "model": self.config.model or "claude-2", "max_tokens": 512}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data, timeout=30) as resp:
                    resp.raise_for_status()
                    result = await resp.json()
                    return result.get("completion", "")
        except Exception as e:
            return f"[RemoteLLMAdapter error: {e}]"
