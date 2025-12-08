from typing import Protocol, Optional
from .tone_models import ToneSnapshot


class TextToneProvider(Protocol):
    async def analyze_text(self, text: str) -> Optional[ToneSnapshot]:
        ...


class AudioToneProvider(Protocol):
    async def analyze_audio(self, audio_bytes: bytes, *, sample_rate: int) -> Optional[ToneSnapshot]:
        ...
