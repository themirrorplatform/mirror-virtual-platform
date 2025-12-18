"""
Test stubs and property-based tests for LLMAdapter (local and remote).
"""
import pytest
from mirrorcore.llm.adapter import LLMAdapter, LLMConfig
from mirrorcore.llm.local import LocalLLMAdapter
from mirrorcore.llm.remote import RemoteLLMAdapter
from unittest.mock import patch

class DummyLLMAdapter(LLMAdapter):
    def generate(self, prompt: str, **kwargs) -> str:
        return f"echo: {prompt}"
    async def agenerate(self, prompt: str, **kwargs) -> str:
        return f"echo: {prompt}"

def test_dummy_llm_adapter_sync():
    adapter = DummyLLMAdapter()
    result = adapter.generate("hello world")
    assert result == "echo: hello world"

@pytest.mark.asyncio
async def test_dummy_llm_adapter_async():
    adapter = DummyLLMAdapter()
    result = await adapter.agenerate("async test")
    assert result == "echo: async test"

def test_local_llm_adapter_stub(monkeypatch):
    config = LLMConfig(model="llama2")
    adapter = LocalLLMAdapter(config)
    monkeypatch.setattr("subprocess.run", lambda *a, **k: type("R", (), {"stdout": "stub output", "returncode": 0})())
    result = adapter.generate("test prompt")
    assert "stub output" in result

def test_remote_llm_adapter_stub(monkeypatch):
    config = LLMConfig(api_key="test", model="claude-2")
    adapter = RemoteLLMAdapter(config)
    class DummyResp:
        def raise_for_status(self): pass
        def json(self): return {"completion": "remote output"}
    monkeypatch.setattr("requests.post", lambda *a, **k: DummyResp())
    result = adapter.generate("test prompt")
    assert "remote output" in result
