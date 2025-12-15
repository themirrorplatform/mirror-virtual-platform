"""
Tension Proxy Vector (TPV): Lens usage patterns as routing signal

NOT biography. NOT inference from behavior.
ONLY explicit lens usage (what tools you reach for).

User can edit TPV manually. Visible always.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import math
import json
from pathlib import Path


@dataclass
class LensUsageEvent:
    """Single lens usage event"""
    lens_id: str
    timestamp: datetime
    weight: float = 1.0  # Can be >1 for longer sessions
    session_id: Optional[str] = None


class LensUsageTracker:
    """
    Tracks lens usage over time.
    
    Constitutional rule: Only explicit usage. No passive tracking.
    """
    
    def __init__(self, user_id: str, storage_path: Path):
        self.user_id = user_id
        self.storage_path = storage_path
        self.events: List[LensUsageEvent] = []
        self._load()
    
    def record_usage(self, lens_id: str, weight: float = 1.0, 
                    session_id: Optional[str] = None):
        """Record explicit lens usage"""
        event = LensUsageEvent(
            lens_id=lens_id,
            timestamp=datetime.utcnow(),
            weight=weight,
            session_id=session_id
        )
        self.events.append(event)
        self._save()
    
    def get_events_since(self, days: int) -> List[LensUsageEvent]:
        """Get events within time window"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        return [e for e in self.events if e.timestamp >= cutoff]
    
    def _load(self):
        """Load events from storage"""
        events_file = self.storage_path / f"lens_usage_{self.user_id}.json"
        if events_file.exists():
            with open(events_file, 'r') as f:
                data = json.load(f)
                self.events = [
                    LensUsageEvent(
                        lens_id=e['lens_id'],
                        timestamp=datetime.fromisoformat(e['timestamp']),
                        weight=e.get('weight', 1.0),
                        session_id=e.get('session_id')
                    )
                    for e in data.get('events', [])
                ]
    
    def _save(self):
        """Save events to storage"""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        events_file = self.storage_path / f"lens_usage_{self.user_id}.json"
        
        data = {
            'user_id': self.user_id,
            'events': [
                {
                    'lens_id': e.lens_id,
                    'timestamp': e.timestamp.isoformat(),
                    'weight': e.weight,
                    'session_id': e.session_id,
                }
                for e in self.events
            ],
            'updated_at': datetime.utcnow().isoformat(),
        }
        
        with open(events_file, 'w') as f:
            json.dump(data, f, indent=2)


class TensionProxyVector:
    """
    TPV: User's reflection instrument usage as sparse vector.
    
    Deterministic computation from lens usage.
    User-editable (manual override canonical).
    Includes "UNLABELED" as first-class channel.
    """
    
    # Configuration
    DECAY_TAU_DAYS = 7  # Half-life for recency decay
    SOFTMAX_TEMPERATURE = 1.0
    EPSILON = 0.1  # Minimum sum for valid TPV
    
    def __init__(self, user_id: str, lens_catalog: List[str], 
                 usage_tracker: LensUsageTracker):
        self.user_id = user_id
        self.lens_catalog = lens_catalog + ['UNLABELED']
        self.usage_tracker = usage_tracker
        
        self.vector: Dict[str, float] = {}
        self.is_manual_override: bool = False
        self.last_computed: Optional[datetime] = None
        
        self.recompute()
    
    def recompute(self) -> None:
        """
        Recompute TPV from lens usage events.
        
        Formula (from spec):
        raw_ℓ = Σ_i (w_i * exp(-(now - t_i)/τ))
        TPV_ℓ = softmax(raw_ℓ / T)
        """
        if self.is_manual_override:
            return  # User has manually set TPV
        
        now = datetime.utcnow()
        raw_scores: Dict[str, float] = {lens: 0.0 for lens in self.lens_catalog}
        
        # Get recent events
        events = self.usage_tracker.get_events_since(days=90)  # Look back 90 days
        
        for event in events:
            delta_days = (now - event.timestamp).total_seconds() / 86400
            decay = math.exp(-delta_days / self.DECAY_TAU_DAYS)
            
            lens_id = event.lens_id if event.lens_id in self.lens_catalog else 'UNLABELED'
            raw_scores[lens_id] += event.weight * decay
        
        # Check if TPV is valid (sum > epsilon)
        total_raw = sum(raw_scores.values())
        if total_raw < self.EPSILON:
            # Not enough data - TPV is null
            self.vector = {}
            self.last_computed = now
            return
        
        # Apply softmax with temperature
        z_scores = {lens: raw / self.SOFTMAX_TEMPERATURE 
                   for lens, raw in raw_scores.items()}
        
        exp_scores = {lens: math.exp(z) for lens, z in z_scores.items()}
        exp_sum = sum(exp_scores.values())
        
        self.vector = {lens: exp_z / exp_sum 
                      for lens, exp_z in exp_scores.items()}
        
        self.last_computed = now
    
    def set_manual(self, vector: Dict[str, float]) -> None:
        """User manually sets TPV (overrides computed)"""
        # Validate and normalize
        total = sum(vector.values())
        if total > 0:
            self.vector = {lens: v / total for lens, v in vector.items()}
            self.is_manual_override = True
    
    def reset_to_computed(self) -> None:
        """Reset to computed TPV from usage"""
        self.is_manual_override = False
        self.recompute()
    
    def get_ambiguity_score(self) -> float:
        """How much mass is in UNLABELED channel"""
        return self.vector.get('UNLABELED', 0.0)
    
    def is_null(self) -> bool:
        """Whether TPV has enough data"""
        return len(self.vector) == 0
    
    def cosine_distance(self, other: 'TensionProxyVector') -> float:
        """
        Compute cosine distance to another TPV.
        
        distance = 1 - cosine_similarity
        """
        if self.is_null() or other.is_null():
            return 0.5  # Neutral distance for null TPVs
        
        # Compute dot product
        dot = sum(self.vector.get(lens, 0) * other.vector.get(lens, 0)
                 for lens in set(self.vector.keys()) | set(other.vector.keys()))
        
        # Compute magnitudes
        mag_self = math.sqrt(sum(v**2 for v in self.vector.values()))
        mag_other = math.sqrt(sum(v**2 for v in other.vector.values()))
        
        if mag_self == 0 or mag_other == 0:
            return 0.5
        
        similarity = dot / (mag_self * mag_other)
        return 1.0 - similarity
    
    def to_dict(self) -> dict:
        """Serialize for UI/storage"""
        return {
            'user_id': self.user_id,
            'vector': self.vector,
            'is_manual_override': self.is_manual_override,
            'last_computed': self.last_computed.isoformat() if self.last_computed else None,
            'ambiguity_score': self.get_ambiguity_score(),
            'is_null': self.is_null(),
        }
    
    @staticmethod
    def from_lens_tags(lens_tags: List[str], lens_catalog: List[str]) -> 'TensionProxyVector':
        """
        Create pseudo-TPV from lens tags (for candidate cards).
        
        Used when candidate declares lens tags but has no usage history.
        """
        # Create dummy objects
        class DummyTracker:
            def get_events_since(self, days): return []
        
        tpv = TensionProxyVector(
            user_id='candidate',
            lens_catalog=lens_catalog,
            usage_tracker=DummyTracker()
        )
        
        if not lens_tags:
            tpv.vector = {}  # Null TPV
            return tpv
        
        # Set uniform distribution over declared tags
        weight = 1.0 / len(lens_tags)
        tpv.vector = {tag: weight for tag in lens_tags if tag in lens_catalog}
        tpv.is_manual_override = True  # Prevent recomputation
        
        return tpv
