import asyncio
from typing import Optional

from app.tone_models import ToneSnapshot
# Note: tone_providers module exists but specific provider functions may need implementation
# For now, returning None stubs to prevent import errors


async def analyze_text_with_openai(text: str) -> Optional[ToneSnapshot]:
    """Placeholder for OpenAI tone analysis"""
    return None


async def analyze_text_with_hume(text: str) -> Optional[ToneSnapshot]:
    """Placeholder for Hume tone analysis"""
    return None


def _merge_snapshots(a: Optional[ToneSnapshot], b: Optional[ToneSnapshot]) -> Optional[ToneSnapshot]:
    if not a and not b:
        return None
    if a and not b:
        return a
    if b and not a:
        return b

    # both exist: merge numeric fields and pick primary by intensity
    primary = a.primary_emotion if a.intensity >= b.intensity else b.primary_emotion
    valence = (a.valence + b.valence) / 2
    arousal = (a.arousal + b.arousal) / 2
    intensity = max(a.intensity, b.intensity)
    style = a.style or b.style
    providers = {}
    providers.update(a.provider_details)
    providers.update(b.provider_details)

    return ToneSnapshot(
        primary_emotion=primary,
        valence=valence,
        arousal=arousal,
        style=style,
        intensity=intensity,
        provider_details=providers,
    )


async def analyze_text_tone(text: str) -> Optional[ToneSnapshot]:
    openai_snap = await analyze_text_with_openai(text)
    hume_snap = await analyze_text_with_hume(text)
    return _merge_snapshots(openai_snap, hume_snap)
