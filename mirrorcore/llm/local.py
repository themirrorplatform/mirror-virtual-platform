"""
LocalLLMAdapter: Adapter for local LLMs (e.g., Ollama).
"""
from .adapter import LLMAdapter, LLMConfig
import subprocess
import asyncio

class LocalLLMAdapter(LLMAdapter):
    def __init__(self, config: LLMConfig):
        self.config = config

    def generate(self, prompt: str, **kwargs) -> str:
        # Example: call a local LLM via subprocess (Ollama CLI or similar)
        # This is a stub; replace with actual local LLM invocation
        cmd = ["ollama", "run", self.config.model or "llama2", prompt]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except Exception as e:
            return f"[LocalLLMAdapter error: {e}]"

    async def agenerate(self, prompt: str, **kwargs) -> str:
        # Async version using asyncio
        cmd = ["ollama", "run", self.config.model or "llama2", prompt]
        try:
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await proc.communicate()
            if proc.returncode == 0:
                return stdout.decode().strip()
            else:
                return f"[LocalLLMAdapter error: {stderr.decode().strip()}]"
        except Exception as e:
            return f"[LocalLLMAdapter error: {e}]"
