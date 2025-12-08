from dataclasses import dataclass
from typing import Dict


@dataclass
class ToneSnapshot:
    primary_emotion: str
    valence: float
    arousal: float
    style: str
    intensity: float
    provider_details: Dict[str, dict]

    def to_dict(self) -> dict:
        return {
            "primary_emotion": self.primary_emotion,
            "valence": self.valence,
            "arousal": self.arousal,
            "style": self.style,
            "intensity": self.intensity,
            "providers": self.provider_details,
        }
